const customAlert = document.createElement('div');
customAlert.id = 'customAlert';
customAlert.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #3B82F6;
        color: white;
        padding: 12px 24px;
        font-size: 16px;
        font-weight: 500;
        display: none;
        z-index: 9999;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        transition: opacity 0.3s ease;
    `;
document.body.appendChild(customAlert);

function showCustomAlert(message, duration = 3000) {
    customAlert.textContent = message;
    customAlert.style.display = 'block';
    customAlert.style.opacity = '1';

    setTimeout(() => {
        customAlert.style.opacity = '0';
        setTimeout(() => {
            customAlert.style.display = 'none';
        }, 300);
    }, duration);
}

document.addEventListener('DOMContentLoaded', function () {

    const appointmentModal = document.getElementById('appointmentModal');
    const closeBtns = document.querySelectorAll('.close, .close-btn');

    closeBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            appointmentModal.style.display = 'none';
        });
    });

    // Variable to store appointments data
    let appointments = [];

    // Load appointments
    fetch("/api/appointments",
    {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
            "Content-Type": "application/json"
        }
    })
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

    window.addEventListener('click', function (event) {
        if (event.target === appointmentModal) {
            appointmentModal.style.display = 'none';
        }
    });

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
                    showCustomAlert('Vă rugăm să completați toate câmpurile.',3000);
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


                fetch("/api/appointment/update", {
                    method: "PUT",
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
                        "Content-Type": "application/json"
                    },
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
                    showCustomAlert('Programare aprobată cu succes!',3000);
                }
            }
        });

        rejectButton.addEventListener('click', function () {
            if (currentAppointment) {
                const responseMessage = document.getElementById('responseMessage').value;

                if (!responseMessage) {
                    showCustomAlert('Vă rugăm să adăugați un motiv pentru respingere.',3000);
                    return;
                }

                const bodySend = {
                    status:"rejected",
                    appointmentId:currentAppointment.id,
                    adminMessage:responseMessage,
                }
                fetch("/api/appointment/update", {
                    method: "PUT",
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
                        "Content-Type": "application/json"
                    },
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
                    showCustomAlert('Programare respinsă!',3000);
                }
            }
        });

        cancelButton.addEventListener('click', function () {
            appointmentModal.style.display = 'none';
        });
    }

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
            <td>${appointment.hasAttachments ? '✅' : '❌'}</td>
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
                        fetch(`/api/appointment/media/${app.id}`,{
                            headers: {
                                "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
                                "Content-Type": "application/json"
                            }
                        })
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
                                showCustomAlert('Eroare la încărcarea atașamentelor.',3000);
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
                            headers: {
                                "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({ appointmentId: app.id, status: "completed" })
                        })
                            .then(res => res.json())
                            .then(() => {
                                showCustomAlert('Programarea a fost finalizată!',3000);
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
                showCustomAlert('Ora de sfârșit trebuie să fie după ora de început!',3000);
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
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
                    "Content-Type": "application/json"
                },
                body:JSON.stringify(data)
            }).then(res=>res.json()).then( obj=>
            {
                showCustomAlert('Ora a fost modificată cu succes!',3000);
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