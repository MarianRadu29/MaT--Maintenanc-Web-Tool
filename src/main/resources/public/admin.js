document.addEventListener('DOMContentLoaded', function () {

    const user = JSON.parse(localStorage.getItem("userData") || null);

    if (!user || user.roleID !== 2) {
        window.location.replace("/notFound");//o sa mi dea 100% 404 de la server
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

    const inventoryItems = [
        {
            id: 'i1',
            name: 'Ulei Motor 10W40',
            category: 'Lichide',
            quantity: 25,
            price: 45.99,
            supplier: 'MotorOil SRL',
            status: 'in-stock'
        },
        {
            id: 'i2',
            name: 'Filtru ulei Honda',
            category: 'Filtre',
            quantity: 12,
            price: 29.99,
            supplier: 'AutoParts SRL',
            status: 'in-stock'
        },
        {
            id: 'i3',
            name: 'Plăcuțe frână Shimano',
            category: 'Frâne',
            quantity: 5,
            price: 79.99,
            supplier: 'BikeZone',
            status: 'low-stock'
        },
        {
            id: 'i4',
            name: 'Baterie trotinetă Xiaomi',
            category: 'Electrice',
            quantity: 0,
            price: 349.99,
            supplier: 'TechParts',
            status: 'out-of-stock'
        }
    ];

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
                id: itemId || 'i' + (inventoryItems.length + 1),
                name: itemName,
                category: itemCategory,
                quantity: parseInt(itemQuantity),
                price: parseFloat(itemPrice),
                supplier: itemSupplier,
                status: itemStatus
            };

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
        searchInventory.addEventListener('input', filterInventory);
        categoryFilter.addEventListener('change', filterInventory);
        statusFilter.addEventListener('change', filterInventory);

        function filterInventory() {
            const searchValue = searchInventory.value.toLowerCase();
            const categoryValue = categoryFilter.value;
            const statusValue = statusFilter.value;

            const filteredItems = inventoryItems.filter(item => {
                const matchesSearch = item.name.toLowerCase().includes(searchValue) ||
                    item.supplier.toLowerCase().includes(searchValue);
                const matchesCategory = !categoryValue || item.category === categoryValue;
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

                const index = appointments.findIndex(app => app.id === currentAppointment.id);
                if (index !== -1) {
                    appointments[index].status = 'rejected';
                    appointments[index].responseMessage = responseMessage;

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

        appointmentsData.forEach(appointment => {
            const row = document.createElement('tr');

            // Format date
            const formattedDate = appointment.date ?
                appointment.date.split("-").reverse().join("-") : 'N/A';

            // Status text and class
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
                default:
                    statusText = appointment.status || 'Necunoscut';
                    statusClass = 'status-unknown';
            }

            // Vehicle type text
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

            // Truncate problem text
            const problemText = appointment.problem && appointment.problem.length > 50
                ? appointment.problem.slice(0, 50) + '...'
                : appointment.problem || 'N/A';

            row.innerHTML = `
                <td>${appointment.clientName || 'N/A'}</td>
                <td>${formattedDate} - ${appointment.time || 'N/A'}:00</td>
                <td>${appointment.vehicleBrand || ''} ${appointment.vehicleModel || ''} (${vehicleTypeText})</td>
                <td>${problemText}</td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td>${appointment.hasAttachments ? '📎 Da' : 'Nu'}</td>
                <td class="table-actions">
                    <button class="action-btn action-btn-view" data-id="${appointment.id}">Vezi</button>
                </td>
            `;

            tableBody.appendChild(row);

            // Add event listener for the view button
            row.querySelector('.action-btn-view').addEventListener('click', function () {
                const appId = this.getAttribute('data-id');
                const app = appointmentsData.find(a => a.id == appId);

                if (app) {
                    console.log(JSON.stringify(app, null, 4));
                    currentAppointment = app;

                    const detailsContainer = document.getElementById('appointmentDetails');
                    detailsContainer.innerHTML = `
                        <div class="appointment-detail-section">
                            <div class="detail-row">
                                <span class="detail-label">Client:</span>
                                <span>${app.clientName}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Programare:</span>
                                <span>${app.date ? app.date.split("-").reverse().join("-") : 'N/A'} - ${app.time || 'N/A'}:00</span>
                            </div>
                        </div>
                        
                        <div class="appointment-detail-section">
                            <div class="detail-row">
                                <span class="detail-label">Vehicul:</span>
                                <span>${app.vehicleBrand || ''} ${app.vehicleModel || ''} 
                                    (${app.vehicleType === 'motorcycle' ? 'Motocicletă' :
                        app.vehicleType === 'bicycle' ? 'Bicicletă' :
                            app.vehicleType === 'scooter' ? 'Trotinetă' : 'Necunoscut'})
                                </span>
                            </div>
                            
                            <div class="detail-row">
                                <span class="detail-label">Problemă:</span>
                                <span>${app.problem || 'N/A'}</span>
                            </div>
                            
                            ${app.hasAttachments ? `
                                <div class="attachments-box">
                                    <p class="font-medium">Atașamente</p>
                                    <p class="text-xs">Clientul a încărcat imagini și/sau videoclipuri.</p>
                                    <div id="attachmentsContainer" class="attachments-content" style="margin-top:1rem;"></div>
                                </div>
                            ` : ''}
                        </div>
                    `;

                    if (app.hasAttachments) {
                        const container = detailsContainer.querySelector('#attachmentsContainer');
                        fetch(`/api/appointment/media/${app.id}`)
                            .then(res => {
                                if (!res.ok) throw new Error(res.statusText);
                                return res.json();
                            })
                            .then(files => {
                                console.log(JSON.stringify(files, null, 4));
                                files.forEach(file => {
                                    const { fileName, contentType, content } = file;
                                    let previewEl;

                                    if (contentType.startsWith('image/')) {
                                        previewEl = document.createElement('img');
                                        previewEl.src = `data:${contentType};base64,${content}`;
                                        previewEl.style.maxWidth = '200px';
                                        previewEl.style.margin = '.5rem';
                                    }
                                    else if (contentType.startsWith('video/')) {
                                        previewEl = document.createElement('video');
                                        previewEl.src = `data:${contentType};base64,${content}`;
                                        previewEl.controls = true;
                                        previewEl.style.maxWidth = '300px';
                                        previewEl.style.display = 'block';
                                        previewEl.style.margin = '.5rem 0';
                                    }
                                    else {
                                        previewEl = document.createElement('div');
                                        previewEl.textContent = `${fileName} (${contentType})`;
                                        previewEl.style.margin = '.5rem 0';
                                    }

                                    const dlLink = document.createElement('a');
                                    dlLink.href = `data:${contentType};base64,${content}`;
                                    dlLink.download = fileName;
                                    dlLink.textContent = `⬇️ Descarcă ${fileName}`;
                                    dlLink.style.display = 'block';
                                    dlLink.style.margin = '0.25rem 0 1rem';

                                    container.appendChild(previewEl);
                                    container.appendChild(dlLink);
                                });
                            })
                            .catch(err => {
                                console.error('Failed to load attachments', err);
                                alert('Eroare la încărcarea atașamentelor.');
                            });
                    }

                    // Set existing values if appointment has been processed
                    document.getElementById('responseMessage').value = app.responseMessage || '';
                    document.getElementById('estimatedPrice').value = app.estimatedPrice || '';
                    document.getElementById('warranty').value = app.warranty || '';

                    // Show or hide buttons based on status
                    approveButton.style.display = app.status === 'rejected' ? 'none' : 'block';
                    rejectButton.style.display = app.status === 'approved' ? 'none' : 'block';

                    appointmentModal.style.display = 'block';
                }
            });
        });
    }

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
                <td>${item.category}</td>
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
                const item = inventoryItems.find(i => i.id === itemId);

                if (item) {
                    document.getElementById('inventoryModalTitle').textContent = 'Editează produs';
                    document.getElementById('itemId').value = item.id;
                    document.getElementById('itemName').value = item.name;
                    document.getElementById('itemCategory').value = item.category;
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