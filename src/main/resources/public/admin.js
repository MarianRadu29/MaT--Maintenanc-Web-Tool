document.addEventListener('DOMContentLoaded', function () {
    // Get current year for footer
    document.getElementById("currentYear").innerText = new Date().getFullYear();
    document.getElementById("user-account").style.display = "none";
    document.getElementById("admin-link").style.display = "none";

    const user = JSON.parse(localStorage.getItem("userData") || null);

    if (!user || user.roleID !== 2) {
        window.location.replace("/notFound");//o sa mi dea 100% 404 de la server
    }

    // Check if user is already logged in
    function checkLoggedInUser() {
        const userData = JSON.parse(
            localStorage.getItem("userData") ||
            sessionStorage.getItem("userData") ||
            null
        );
        if (userData) {
            // Update UI for logged in user
            const authLinks = document.querySelector(".auth-links");
            const adminLink = document.getElementById("admin-link");
            if (authLinks && adminLink) {
                document.getElementById("user-account").style.display = "block";

                authLinks.innerHTML = `
          <a href="#" id="logoutButton" class="btn btn-secondary">Deconectare</a>
        `;
                if (userData.roleID == 2) {
                    adminLink.style.display = "block";
                }
                // Add logout functionality
                document
                    .getElementById("logoutButton")
                    .addEventListener("click", function (e) {
                        e.preventDefault();
                        localStorage.removeItem("userData");
                        localStorage.removeItem("accessToken");
                        localStorage.removeItem("refreshToken");

                        window.location.reload();
                        authLinks.innerHTML = `
                        <a href="login.html" class="btn btn-primary">Conectare</a>
                        <a href="register.html" class="btn btn-secondary">Înregistrare</a>
                    `;
                    });
            }
        }
    }

    // Call this on page load
    checkLoggedInUser();

    // Mobile menu toggle
    const menuToggle = document.getElementById("menuToggle");
    const mainNav = document.querySelector(".main-nav");

    if (menuToggle) {
        menuToggle.addEventListener("click", () => {
            mainNav.classList.toggle("open");
        });
    }

    // Tab functionality
    const tabs = document.querySelectorAll('.tab');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const tabId = this.getAttribute('data-tab');

            // Remove active class from all tabs and panes
            tabs.forEach(t => t.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            // Add active class to current tab and pane
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
    let inventoryItems = [];
    async function loadInventoryAPI(){
        let res = await fetch("/api/inventory",{
            method:"GET"
        });
        return res.json();
    }
    function initInventoryLoad() {
        loadInventoryAPI().then(list => {
            inventoryItems = list;

            loadInventoryItems(inventoryItems);
        }).catch(error => {
            console.error("Eroare la încărcarea inventarului:", error);
        });
    }
    initInventoryLoad();


    function loadInventoryItems(items) {
        const tableBody = document.getElementById('inventoryTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        items.forEach(item => {
            const row = document.createElement('tr');

            let statusClass = '';
            switch (item.status) {
                case 'in-stock':
                    statusClass = 'status-in-stock';
                    break;
                case 'low-stock':
                    statusClass = 'status-low-stock';
                    break;
                case 'out-of-stock':
                    statusClass = 'status-out-of-stock';
                    break;
                case 'ordered':
                    statusClass = 'status-ordered';
                    break;
            }

            let statusText = '';
            switch (item.status) {
                case 'in-stock':
                    statusText = 'În stoc';
                    break;
                case 'low-stock':
                    statusText = 'Stoc limitat';
                    break;
                case 'out-of-stock':
                    statusText = 'Epuizat';
                    break;
                case 'ordered':
                    statusText = 'Comandat';
                    break;
            }

            row.innerHTML = `
                <td>${item.name}</td>
                <td>${translateCategory(item.category)}</td>
                <td>${item.quantity}</td>
                <td>${item.price.toFixed(2)} RON</td>
                <td>${item.supplier}</td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td class="table-actions">
                    <button class="action-btn action-btn-edit" data-id="${item.id}">Editează</button>
                    <button class="action-btn action-btn-delete" data-id="${item.id}">Șterge</button>
                </td>
            `;

            tableBody.appendChild(row);

            // Add event listeners for edit and delete buttons
            row.querySelector('.action-btn-edit').addEventListener('click', function () {
                const itemId = this.getAttribute('data-id');
                const item = inventoryItems.find(i => i.id == itemId);

                if (item) {
                    const selectCategories = document.getElementById("itemCategory");

                    // mai întâi curăță selectul
                    selectCategories.innerHTML = "<option value=\"\">Selectează categoria</option>";

                    // încarcă opțiunile și abia apoi setează valoarea
                    fetch("api/inventory/categories", {
                        method: "GET"
                    })
                    .then(res => res.json())
                    .then(list => {
                        list.forEach(category => {
                            const option = document.createElement("option");
                            option.value = category.id;
                            option.text = translateCategory(category.name);
                            selectCategories.appendChild(option);
                        });

                        selectCategories.value = item.categoryID;
                    })
                    .catch(e => {
                        console.log(e);
                    });

                    document.getElementById('inventoryModalTitle').textContent = 'Editează produs';
                    document.getElementById('itemId').value = item.id;
                    document.getElementById('itemName').value = item.name;
                    document.getElementById('itemQuantity').value = item.quantity;
                    document.getElementById('itemPrice').value = item.price;
                    document.getElementById('itemSupplier').value = item.supplier;
                    document.getElementById('itemStatus').value = item.status;

                    inventoryModal.style.display = 'block';
                }
            });

            row.querySelector('.action-btn-delete').addEventListener('click', function () {
                const itemId = this.getAttribute('data-id');

                if (confirm('Sigur doriți să ștergeți acest produs?')) {
                    const index = inventoryItems.findIndex(i => i.id === itemId);

                    if (index !== -1) {
                        inventoryItems.splice(index, 1);
                        loadInventoryItems(inventoryItems);
                    }
                }
            });
        });
    }

    // Variable to store appointments data
    let appointments = [];

    // Load appointments
    fetch("/api/appointments")
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        }).then(data => {
        appointments = data; // Store the data
        loadAppointments(data);
    })
        .catch(error => {
            console.error('Error loading appointments:', error);
        });

    // Load inventory items
    loadInventoryItems(inventoryItems);

    // Modal functionality
    const appointmentModal = document.getElementById('appointmentModal');
    const inventoryModal = document.getElementById('inventoryModal');
    const closeBtns = document.querySelectorAll('.close, .close-btn');

    closeBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            appointmentModal.style.display = 'none';
            inventoryModal.style.display = 'none';
        });
    });

    window.addEventListener('click', function (event) {
        if (event.target === appointmentModal) {
            appointmentModal.style.display = 'none';
        }
        if (event.target === inventoryModal) {
            inventoryModal.style.display = 'none';
        }
    });




    // Add inventory item button
    const addItemBtn = document.getElementById('addItemBtn');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', function () {
            document.getElementById('inventoryModalTitle').textContent = 'Adaugă produs';
            document.getElementById('inventoryForm').reset();
            document.getElementById('itemId').value = '';
            inventoryModal.style.display = 'block';
            const selectCategory = document.getElementById("itemCategory");

        fetch("api/inventory/categories",{
            method:"GET"
        }).then(res=>{
            return res.json()
        })
        .then(list=>{
            list.forEach(category=>{
                const option = document.createElement("option");
                option.value = category.id;
                option.text = translateCategory(category.name);
                selectCategory.appendChild(option);
            })
        })
        .catch(e=>{
            console.log(e);
        })
        });
    }

    // Inventory form submission
    const inventoryForm = document.getElementById('inventoryForm');
    if (inventoryForm) {
        inventoryForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const itemId = document.getElementById('itemId').value;
            const itemName = document.getElementById('itemName').value;
            const itemCategory = document.getElementById('itemCategory').value;
            const itemQuantity = document.getElementById('itemQuantity').value;
            const itemPrice = document.getElementById('itemPrice').value;
            const itemSupplier = document.getElementById('itemSupplier').value;
            const itemStatus = document.getElementById('itemStatus').value;

            const newItem = {
                name: itemName,
                category: itemCategory,
                quantity: parseInt(itemQuantity),
                price: parseFloat(itemPrice),
                supplier: itemSupplier,
                status: itemStatus
            };
            alert(JSON.stringify(newItem,null,4));
            fetch("/api/inventory/add",{
                method:"POST",
                body: JSON.stringify(newItem)
            }).then(res=>{
                return res.json();
            }).catch(e=>console.log(e))

            if (itemId) {
                // Update existing item
                const index = inventoryItems.findIndex(item => item.id === itemId);
                if (index !== -1) {
                    inventoryItems[index] = newItem;
                }
            } else {
                // Add new item
                inventoryItems.push(newItem);
            }

            // Reload inventory table
            loadInventoryItems(inventoryItems);

            // Close modal
            inventoryModal.style.display = 'none';
        });
    }

    // Filter and search inventory
    const searchInventory = document.getElementById('searchInventory');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');

    if (searchInventory && categoryFilter && statusFilter) {
        function translateCategory(categoryEn) {
            const translations = {
                "Brake System": "Sistem de frânare",
                "Transmission System": "Sistem de transmisie",
                "Wheels and Tires": "Roți și anvelope",
                "Suspension and Fork": "Suspensie și furcă",
                "Electrical Components": "Componente electrice",
                "Battery and Charging": "Baterii și încărcare",
                "Lighting": "Iluminat",
                "Engine and Clutch": "Motor și ambreiaj",
                "Cables and Housings": "Cabluri și cămăși",
                "Consumables": "Consumabile",
                "Bearings and Seals": "Rulmenți și simeringuri",
                "Fasteners and Mounts": "Elemente de prindere și montaj"
            };

            return translations[categoryEn] || categoryEn;
        }

        fetch("api/inventory/categories",{
            method:"GET"
        }).then(res=>{
            return res.json()
        })
        .then(list=>{
            list.forEach(category=>{
                const option = document.createElement("option");
                option.value = category.id;
                option.text = translateCategory(category.name);
                categoryFilter.appendChild(option);
            })
        })
        .catch(e=>{
            console.log(e);
        })
        searchInventory.addEventListener('input', filterInventory);
        categoryFilter.addEventListener('change', filterInventory);
        statusFilter.addEventListener('change', filterInventory);

        function filterInventory() {
            const searchValue = searchInventory.value.toLowerCase();
            const categoryValue = categoryFilter.value; // acesta este categoryID numeric
            const statusValue = statusFilter.value;

            const filteredItems = inventoryItems.filter(item => {
                const matchesSearch = item.name.toLowerCase().includes(searchValue) ||
                    item.supplier.toLowerCase().includes(searchValue);

                const matchesCategory = !categoryValue || item.categoryID == categoryValue;

                const matchesStatus = !statusValue || item.status === statusValue;

                return matchesSearch && matchesCategory && matchesStatus;
            });

            loadInventoryItems(filteredItems);
        }
    }

    // Add filters for appointments
    const searchAppointments = document.getElementById('searchAppointments');
    const statusFilterAppointments = document.getElementById('statusFilterAppointments');
    const vehicleFilterAppointments = document.getElementById('vehicleFilterAppointments');

    if (searchAppointments && statusFilterAppointments && vehicleFilterAppointments) {
        searchAppointments.addEventListener('input', filterAppointments);
        statusFilterAppointments.addEventListener('change', filterAppointments);
        vehicleFilterAppointments.addEventListener('change', filterAppointments);

        function filterAppointments() {
            const searchValue = searchAppointments.value.toLowerCase();
            const statusValue = statusFilterAppointments.value;
            const vehicleValue = vehicleFilterAppointments.value;

            const filteredAppointments = appointments.filter(appointment => {
                const matchesSearch = appointment.clientName.toLowerCase().includes(searchValue) ||
                    appointment.problem.toLowerCase().includes(searchValue);
                const matchesStatus = !statusValue || appointment.status === statusValue;
                const matchesVehicle = !vehicleValue || appointment.vehicleType === vehicleValue;

                return matchesSearch && matchesStatus && matchesVehicle;
            });

            loadAppointments(filteredAppointments);
        }
    }

    // Add event listeners for appointment management
    const approveButton = document.getElementById('approveAppointment');
    const rejectButton = document.getElementById('rejectAppointment');
    const cancelButton = document.getElementById('cancelAppointment');

    let currentAppointment = null;

    if (approveButton && rejectButton && cancelButton) {
        approveButton.addEventListener('click', function () {
            if (currentAppointment) {
                const responseMessage = document.getElementById('responseMessage').value;
                const estimatedPrice = document.getElementById('estimatedPrice').value;
                const warranty = document.getElementById('warranty').value;

                if (!responseMessage || !estimatedPrice || !warranty) {
                    alert('Vă rugăm să completați toate câmpurile.');
                    return;
                }

                function getSelectedInventoryIds() {
                    const selectedElements = document.querySelectorAll('.selected-item');
                    const ids = [];

                    selectedElements.forEach(el => {
                        const dataId = el.getAttribute('data-id');
                        if (dataId !== null) {
                            const obj ={
                                id:parseInt(dataId, 10),
                                quantity:el.querySelector('.selected-item-controls input').value
                            }
                            console.log(JSON.stringify(obj,null,4));
                            ids.push(obj);
                        }
                    });

                    return ids;
                }

                const bodySend = {
                    status:"approved",
                    appointmentId:currentAppointment.id,
                    estimatedPrice:Number.parseInt(estimatedPrice),
                    warrantyMonths:Number.parseInt(warranty),
                    adminMessage:responseMessage,
                    inventoryPieces:getSelectedInventoryIds()
                }

                alert(JSON.stringify(bodySend,null,4));
                fetch("/api/appointment/update", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(bodySend)
                })
                .then(res => {
                    switch (res.status) {
                        case 200:
                        case 201:
                            return res.json().then(data => {
                                console.log("Comanda trimisă cu succes:", data);
                            });

                        case 400:
                            // 400 Bad Request → corpul conține, probabil, detalii despre eroare
                            return res.json()
                                .then(errorBody => {
                                    console.error("Bad Request (400):", errorBody);
                                })
                                .catch(() => {
                                    console.error("Bad Request (400): nu s-a putut parsa JSON-ul din răspuns.");
                                });

                        case 404:
                            // 404 Not Found → res text, nu JSON (de obicei)
                            return res.text().then(textBody => {
                                console.error("Not Found (404):", textBody);
                            });

                        case 500:
                            return res.text().then(textBody => {
                                console.error("Internal Server Error (500):", textBody);
                            });

                        default:
                            // Orice alt cod de status
                            return res.text().then(textBody => {
                                console.error(`Eroare neașteptată (${res.status}):`, textBody);
                            });
                    }
                })
                .catch(networkErr => {
                    console.error("Eroare neasteptata:", networkErr);
                });

                const index = appointments.findIndex(app => app.id === currentAppointment.id);
                if (index !== -1) {
                    appointments[index].status = 'approved';
                    appointments[index].responseMessage = responseMessage;
                    appointments[index].estimatedPrice = estimatedPrice;
                    appointments[index].warranty = warranty;

                    loadAppointments(appointments);
                    appointmentModal.style.display = 'none';
                    alert('Programare aprobată cu succes!');
                }
            }
        });

        rejectButton.addEventListener('click', function () {
            if (currentAppointment) {
                const responseMessage = document.getElementById('responseMessage').value;

                if (!responseMessage) {
                    alert('Vă rugăm să adăugați un motiv pentru respingere.');
                    return;
                }

                const bodySend = {
                    status:"rejected",
                    appointmentId:currentAppointment.id,
                    adminMessage:responseMessage,
                }
                fetch("/api/appointment/update", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(bodySend)
                })
                .then(res => {
                    switch (res.status) {
                        case 200:
                        case 201:
                            return res.json().then(data => {
                                console.log("Comanda trimisă cu succes:", data);
                            });



                        case 400:
                            // 400 Bad Request → corpul conține, probabil, detalii despre eroare
                            return res.json()
                                .then(errorBody => {
                                    console.error("Bad Request (400):", errorBody);
                                })
                                .catch(() => {
                                    console.error("Bad Request (400): nu s-a putut parsa JSON-ul din răspuns.");
                                });

                        case 404:
                            // 404 Not Found → res text, nu JSON (de obicei)
                            return res.text().then(textBody => {
                                console.error("Not Found (404):", textBody);
                            });

                        case 500:
                            return res.text().then(textBody => {
                                console.error("Internal Server Error (500):", textBody);
                            });

                        default:
                            // Orice alt cod de status
                            return res.text().then(textBody => {
                                console.error(`Eroare neașteptată (${res.status}):`, textBody);
                            });
                    }
                })
                .catch(networkErr => {
                    console.error("Eroare neasteptata:", networkErr);
                });



                const index = appointments.findIndex(app => app.id === currentAppointment.id);
                if (index !== -1) {
                    appointments[index].status = 'rejected';
                    appointments[index].adminMessage = responseMessage;

                    // Actualizează și obiectul currentAppointment
                    currentAppointment.status = 'rejected';
                    currentAppointment.adminMessage = responseMessage;

                    loadAppointments(appointments);
                    appointmentModal.style.display = 'none';
                    alert('Programare respinsă!');
                }
            }
        });

        cancelButton.addEventListener('click', function () {
            appointmentModal.style.display = 'none';
        });
    }

    // Helper Functions
    function loadAppointments(appointmentsData) {
        const tableBody = document.getElementById('appointmentsTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        const today = new Date();
        const currentDate = today.toISOString().split('T')[0];

        const futureAppointments = appointmentsData.filter(appointment => {
            if (!appointment.date) return false;
            return appointment.date >= currentDate;
        });

        futureAppointments.forEach(appointment => {
            const row = document.createElement('tr');

            const formattedDate = appointment.date ?
                appointment.date.split("-").reverse().join("-") : 'N/A';

            let statusText = '';
            let statusClass = '';
            switch (appointment.status) {
                case 'pending':
                    statusText = 'În așteptare';
                    statusClass = 'status-pending';
                    break;
                case 'approved':
                    statusText = 'Aprobată';
                    statusClass = 'status-approved';
                    break;
                case 'rejected':
                    statusText = 'Respinsă';
                    statusClass = 'status-rejected';
                    break;
                case 'modified':
                    statusText = 'Modificată';
                    statusClass = 'status-modified';
                    break;
                case 'completed':
                    statusText = 'Finalizată';
                    statusClass = 'status-completed';
                    break;
                default:
                    statusText = appointment.status || 'Necunoscut';
                    statusClass = 'status-unknown';
            }

            let vehicleTypeText = '';
            switch (appointment.vehicleType) {
                case 'motorcycle':
                    vehicleTypeText = 'Motocicletă';
                    break;
                case 'bicycle':
                    vehicleTypeText = 'Bicicletă';
                    break;
                case 'scooter':
                    vehicleTypeText = 'Trotinetă';
                    break;
                default:
                    vehicleTypeText = appointment.vehicleType || 'Necunoscut';
            }

            const problemText = appointment.problem && appointment.problem.length > 50
                ? appointment.problem.slice(0, 50) + '...'
                : appointment.problem || 'N/A';

            row.innerHTML = `
            <td>${appointment.clientName || 'N/A'}</td>
            <td>${formattedDate} / ${appointment.startTime + ":00-" + appointment.endTime + ":00" || 'N/A'}</td>
            <td>${appointment.vehicleBrand || ''} ${appointment.vehicleModel || ''} (${vehicleTypeText})</td>
            <td>${problemText}</td>
            <td><span class="status ${statusClass}">${statusText}</span></td>
            <td>${appointment.hasAttachments ? '📎 Da' : 'Nu'}</td>
            <td class="table-actions">
                <button class="action-btn action-btn-view" data-id="${appointment.id}">Vezi</button>
                <button class="action-btn action-btn-edit" data-id="${appointment.id}" ${appointment.status === 'approved' ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>Modifică</button>
            </td>
        `;

            tableBody.appendChild(row);

            row.querySelector('.action-btn-view').addEventListener('click', function () {
                const appId = this.getAttribute('data-id');
                const app = futureAppointments.find(a => a.id == appId);

                if (app) {
                    currentAppointment = app;
                    handleAppointmentView(app);
                    const detailsContainer = document.getElementById('appointmentDetails');
                    detailsContainer.innerHTML = `
                    <div class="appointment-detail-section">
                        <div class="detail-row">
                            <i class="ri-user-line modal-icons"></i>
                            <span class="detail-label">Client:</span>
                            <span class="info">${app.clientName}</span>
                        </div>  
                    </div>
                    <div class="appointment-detail-section">
                        <div class="detail-row">
                            <i class="ri-calendar-line modal-icons"></i>
                            <span class="detail-label">Programare:</span>
                            <span class="info">${app.date.split("-").reverse().join("-")} / ${app.startTime + ":00-" + app.endTime + ":00"}</span>
                        </div>
                    </div>
                    <div class="appointment-detail-section">
                        <div class="detail-row">
                            <i class="ri-motorbike-line modal-icons"></i>
                            <span class="detail-label">Vehicul:</span>
                            <span class="info">${app.vehicleBrand || ''} ${app.vehicleModel || ''} 
                                (${vehicleTypeText})
                            </span>
                        </div>
                    </div>
                    <div class="appointment-detail-section"> 
                        <div class="detail-row">
                            <i class="ri-tools-line"></i>
                            <span class="detail-label">Problemă:</span>
                            <span class="info">${app.problem || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="appointment-detail-section"> 
                        ${app.hasAttachments ? `
                            <p class="text-xs">Clientul a încărcat imagini și/sau videoclipuri.</p>
                            <div class="attachments-box">
                                <div id="attachmentsContainer" class="attachments-content" style="margin-top:1rem;"></div>
                            </div>
                        ` : `<p>Nu sunt atașamente pentru această programare.</p>`}
                    </div>
                    ${app.status === 'approved' && app.inventoryPieces ? `
                        <div class="appointment-detail-section">
                            <div class="detail-row">
                                <span class="detail-label">Produse folosite:</span>
                            </div>
                            <div id="usedProductsContainer" class="used-products-content"></div>
                        </div>
                    ` : ''}
                `;


                    // Controlează vizibilitatea secțiunii de selecție produse
                    const inventorySelectionTitle = document.getElementById('inventorySelectionTitle');
                    const inventorySearchBox = document.querySelector('.inventory-search-box');
                    const inventoryResults = document.getElementById('inventoryResults');
                    const selectedItemsSection = document.querySelector('.selected-items-section h4');

                    if (app.status === 'approved' || app.status === 'completed') {
                        // Ascunde instrucțiunile, căutarea și rezultatele pentru programările aprobate/finalizate
                        if (inventorySelectionTitle) inventorySelectionTitle.style.display = 'none';
                        if (inventorySearchBox) inventorySearchBox.style.display = 'none';
                        if (inventoryResults) inventoryResults.style.display = 'none';
                        if (selectedItemsSection) selectedItemsSection.textContent = 'Produse folosite în această programare:';

                        // Încărcăm produsele folosite în selectedInventoryItems pentru afișare
                        selectedInventoryItems = [];
                        if (app.inventoryPieces && app.inventoryPieces.length > 0) {
                            app.inventoryPieces.forEach(usedItem => {
                                const inventoryItem = inventoryItems.find(item => item.id === usedItem.id);
                                if (inventoryItem) {
                                    selectedInventoryItems.push({
                                        ...inventoryItem,
                                        selectedQuantity: usedItem.quantity
                                    });
                                }
                            });
                        }
                        // Actualizăm afișarea cu produsele folosite
                        updateSelectedItemsDisplay();
                    } else {
                        // Afișează toate elementele pentru programările în așteptare
                        if (inventorySelectionTitle) inventorySelectionTitle.style.display = 'block';
                        if (inventorySearchBox) inventorySearchBox.style.display = 'block';
                        if (inventoryResults) inventoryResults.style.display = 'block';
                        if (selectedItemsSection) selectedItemsSection.textContent = 'Produse Selectate:';

                        // Resetăm selecția pentru programările noi
                        selectedInventoryItems = [];
                        updateSelectedItemsDisplay();
                    }

                    // Atașamente
                    if (app.hasAttachments) {
                        const container = detailsContainer.querySelector('#attachmentsContainer');
                        fetch(`/api/appointment/media/${app.id}`)
                            .then(res => res.ok ? res.json() : Promise.reject(res.statusText))
                            .then(files => {
                                files.forEach(file => {
                                    const { fileName, contentType, content } = file;
                                    let previewEl;

                                    if (contentType.startsWith('image/')) {
                                        previewEl = document.createElement('img');
                                        previewEl.src = `data:${contentType};base64,${content}`;
                                        previewEl.style.maxWidth = '200px';
                                    } else if (contentType.startsWith('video/')) {
                                        previewEl = document.createElement('video');
                                        previewEl.src = `data:${contentType};base64,${content}`;
                                        previewEl.controls = true;
                                        previewEl.style.maxWidth = '300px';
                                    } else {
                                        previewEl = document.createElement('div');
                                        previewEl.textContent = `${fileName} (${contentType})`;
                                    }

                                    const dlLink = document.createElement('a');
                                    dlLink.href = `data:${contentType};base64,${content}`;
                                    dlLink.download = fileName;
                                    dlLink.textContent = `⬇️ Descarcă ${fileName}`;

                                    container.appendChild(previewEl);
                                    container.appendChild(dlLink);
                                });
                            })
                            .catch(err => {
                                console.error('Eroare atașamente', err);
                                alert('Eroare la încărcarea atașamentelor.');
                            });
                    }

                    document.getElementById('responseMessage').value = app.adminMessage || app.responseMessage || '';
                    document.getElementById('estimatedPrice').value = app.estimatedPrice || '';
                    document.getElementById('warranty').value = app.warrantyMonths || app.warranty || '';

                    const readonly = app.status === 'approved' || app.status === 'completed';
                    document.getElementById('responseMessage').readOnly = readonly;
                    document.getElementById('estimatedPrice').readOnly = readonly;
                    document.getElementById('warranty').readOnly = readonly;

                    const approveButton = document.getElementById('approveAppointment');
                    const rejectButton = document.getElementById('rejectAppointment');
                    const finalizeButton = document.getElementById('finalizeAppointment');

                    approveButton.style.display = (app.status === 'approved' || app.status === 'rejected') ? 'none' : 'block';
                    rejectButton.style.display = (app.status === 'approved' || app.status === 'rejected') ? 'none' : 'block';
                    finalizeButton.style.display = (app.status === 'approved') ? 'block' : 'none';

                    finalizeButton.onclick = () => {
                        fetch("api/appointment/update", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ appointmentId: app.id, status: "completed" })
                        })
                            .then(res => res.json())
                            .then(() => {
                                alert('Programarea a fost terminată!');
                                editModal.style.display = 'none';
                            });
                    };

                    document.getElementById('appointmentModal').style.display = 'block';
                }
            });

            row.querySelector('.action-btn-edit').addEventListener('click', function () {
                const appId = this.getAttribute('data-id');
                const app = futureAppointments.find(a => a.id == appId);
                if (app && app.status !== 'approved') {
                    openEditTimeModal(app);
                }
            });
        });
    }

    // Import/Export functionality
    const importButtons = document.querySelectorAll('button[data-import]');
    const exportButtons = document.querySelectorAll('button[data-export]');

    importButtons.forEach(button => {
        button.addEventListener('click', function () {
            const importType = this.getAttribute('data-import');
            const fileInput = document.getElementById(`${importType}Import`);

            if (fileInput.files.length === 0) {
                alert(`Vă rugăm să selectați un fișier ${importType.toUpperCase()} pentru import.`);
                return;
            }

            const file = fileInput.files[0];
            const reader = new FileReader();

            reader.onload = function (e) {
                try {
                    let data;

                    if (importType === 'csv') {
                        // Parse CSV
                        const csvData = e.target.result;
                        // Simple CSV parsing (in real app, use a library)
                        data = parseCSV(csvData);
                    } else if (importType === 'json') {
                        // Parse JSON
                        data = JSON.parse(e.target.result);
                    }

                    alert(`${importType.toUpperCase()} importat cu succes!`);
                    console.log('Imported data:', data);

                } catch (error) {
                    alert(`Eroare la importul ${importType.toUpperCase()}: ${error.message}`);
                }
            };

            reader.onerror = function () {
                alert('Eroare la citirea fișierului.');
            };

            if (importType === 'csv') {
                reader.readAsText(file);
            } else {
                reader.readAsText(file);
            }
        });
    });

    exportButtons.forEach(button => {
        button.addEventListener('click', function () {
            const exportType = this.getAttribute('data-export');
            let data, filename, contentType, content;

            // For demo, we'll export inventory data
            data = inventoryItems;

            if (exportType === 'csv') {
                filename = 'inventory.csv';
                contentType = 'text/csv';
                content = convertToCSV(data);
            } else if (exportType === 'json') {
                filename = 'inventory.json';
                contentType = 'application/json';
                content = JSON.stringify(data, null, 2);
            } else if (exportType === 'pdf') {
                alert('Funcționalitatea de export PDF va fi implementată în viitor.');
                return;
            }

            // Create download link
            const blob = new Blob([content], {type: contentType});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        });
    });
    function parseCSV(csv) {
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(header => header.trim());
        const result = [];

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;

            const values = lines[i].split(',').map(val => val.trim());
            const obj = {};

            for (let j = 0; j < headers.length; j++) {
                obj[headers[j]] = values[j];
            }

            result.push(obj);
        }

        return result;
    }

    function convertToCSV(data) {
        if (data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csvRows = [];

        csvRows.push(headers.join(','));

        for (const item of data) {
            const values = headers.map(header => {
                const value = item[header];
                return value;
            });

            csvRows.push(values.join(','));
        }

        return csvRows.join('\n');
    }
});


function openEditTimeModal(appointment) {

    // Creează modalul dacă nu există
    let editModal = document.getElementById('editTimeModal');
    if (!editModal) {
        editModal = document.createElement('div');
        editModal.id = 'editTimeModal';
        editModal.className = 'modal';
        editModal.innerHTML = `
            <div class="modal-content">
                <span class="close" id="closeEditTimeModal">&times;</span>
                <h2>Modifică Ora Programării</h2>
                
                <div class="edit-time-section">
                    <form id="editTimeForm">
                        <div class="time-inputs">
                            <div class="form-group">
                                <label for="editStartTime">Ora de început:</label>
                                <select id="editStartTime" class="time-select" required>
                                    <option value="08">08:00</option>
                                    <option value="09">09:00</option>
                                    <option value="10">10:00</option>
                                    <option value="11">11:00</option>
                                    <option value="12">12:00</option>
                                    <option value="13">13:00</option>
                                    <option value="14">14:00</option>
                                    <option value="15">15:00</option>
                                    <option value="16">16:00</option>
                                    <option value="17">17:00</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="editEndTime">Ora de sfârșit:</label>
                                <select id="editEndTime" class="time-select" required>
                                    <option value="09">09:00</option>
                                    <option value="10">10:00</option>
                                    <option value="11">11:00</option>
                                    <option value="12">12:00</option>
                                    <option value="13">13:00</option>
                                    <option value="14">14:00</option>
                                    <option value="15">15:00</option>
                                    <option value="16">16:00</option>
                                    <option value="17">17:00</option>
                                    <option value="18">18:00</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="modal-actions">
                            <button type="submit" class="btn btn-primary">Salvează</button>
                            <button type="button" class="btn btn-secondary" id="cancelEditTime">Anulează</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(editModal);

        // Adaugă event listeners pentru închiderea modalului
        document.getElementById('closeEditTimeModal').addEventListener('click', function() {
            editModal.style.display = 'none';
        });

        document.getElementById('cancelEditTime').addEventListener('click', function() {
            editModal.style.display = 'none';
        });

        // Închide modalul când se dă click în afara lui
        window.addEventListener('click', function(event) {
            if (event.target === editModal) {
                editModal.style.display = 'none';
            }
        });

        // Form submit handler
        document.getElementById('editTimeForm').addEventListener('submit', function(e) {
            e.preventDefault();

            const startTime = document.getElementById('editStartTime').value;
            const endTime = document.getElementById('editEndTime').value;

            if (parseInt(startTime) >= parseInt(endTime)) {
                alert('Ora de sfârșit trebuie să fie după ora de început!');
                return;
            }

            console.log('Noua oră:', startTime + ':00 - ' + endTime + ':00');
            const data = {
                appointmentId:appointment.id,
                status:"modified",
                startTime:startTime,
                endTime:endTime
            }
            fetch("api/appointment/update",{
                method:"PUT",
                headers: { "Content-Type": "application/json" },
                body:JSON.stringify(data)
            }).then(res=>res.json()).then( obj=>
                {
                    alert('Ora a fost modificată cu succes!');
                    editModal.style.display = 'none';
                })

        });
    }

    // FIX: Convertește valorile la string și asigură-te că sunt setate corect
    const startTimeValue = String(appointment.startTime);
    const endTimeValue = String(appointment.endTime);

    console.log('Setting start time to:', startTimeValue);
    console.log('Setting end time to:', endTimeValue);

    // Setează valorile curente în select-uri
    const startTimeSelect = document.getElementById('editStartTime');
    const endTimeSelect = document.getElementById('editEndTime');

    // Verifică dacă valorile există în opțiuni înainte de a le seta
    if (startTimeSelect) {
        startTimeSelect.value = startTimeValue;
        // Verifică dacă valoarea a fost setată corect
        if (startTimeSelect.value !== startTimeValue) {
            console.warn(`Start time ${startTimeValue} not found in options`);
        }
    }

    if (endTimeSelect) {
        endTimeSelect.value = endTimeValue;
        // Verifică dacă valoarea a fost setată corect
        if (endTimeSelect.value !== endTimeValue) {
            console.warn(`End time ${endTimeValue} not found in options`);
        }
    }

    // Afișează modalul
    editModal.style.display = 'block';
}
