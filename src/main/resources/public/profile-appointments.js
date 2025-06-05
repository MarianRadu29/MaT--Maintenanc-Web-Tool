// Initialize appointments functionality
async function initializeAppointments() {
    await loadAppointments();
    initializeAppointmentFilters();
    initializeAppointmentEvents();
}

// incarc programrile din API
async function loadAppointments() {
    try {
        const response = await fetch("/api/appointments/self", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
            }
        });

        if (!response.ok) throw new Error(`HTTP status ${response.status}`);

        appointments = await response.json();
        console.log('Appointments loaded:', appointments);
    } catch (error) {
        console.error("Error fetching appointments:", error);
    }
    renderAppointments();
}

// filters
function initializeAppointmentFilters() {
    // event filtre input
    document.getElementById("searchAppointments").addEventListener("input", e => {
        renderAppointments({
            search: e.target.value,
            vehicleType: document.getElementById("vehicleTypeFilter").value,
            status: document.getElementById("statusFilter").value
        });
    });

    document.getElementById("vehicleTypeFilter").addEventListener("change", () => {
        renderAppointments({
            search: document.getElementById("searchAppointments").value,
            vehicleType: document.getElementById("vehicleTypeFilter").value,
            status: document.getElementById("statusFilter").value
        });
    });

    document.getElementById("statusFilter").addEventListener("change", () => {
        renderAppointments({
            search: document.getElementById("searchAppointments").value,
            vehicleType: document.getElementById("vehicleTypeFilter").value,
            status: document.getElementById("statusFilter").value
        });
    });
}

// events pt programari
function initializeAppointmentEvents() {
    // event listener pentru butoanele "Vezi"
    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("view-details")) {
            const appointmentId = e.target.getAttribute("data-id");
            const appointment = appointments.find(a => a.id == appointmentId);
            if (appointment) {
                showAppointmentModal(appointment);
            }
        }
    });
}

// render tabel programari
function renderAppointments(filter = {}) {
    const tbody = document.getElementById("appointmentsTableBody");
    const emptyState = document.getElementById("emptyAppointments");
    const table = tbody.parentElement;

    tbody.innerHTML = "";

    let filtered = appointments;

    if (filter.search) {
        const s = filter.search.toLowerCase();
        filtered = filtered.filter(a =>
            (a.vehicleType && a.vehicleType.toLowerCase().includes(s)) ||
            (a.problem && a.problem.toLowerCase().includes(s))
        );
    }
    if (filter.vehicleType) {
        filtered = filtered.filter(a => a.vehicleType === filter.vehicleType);
    }
    if (filter.status) {
        filtered = filtered.filter(a => a.status === filter.status);
    }

    if (filtered.length === 0) {
        emptyState.style.display = "block";
        table.style.display = "none";
    } else {
        emptyState.style.display = "none";
        table.style.display = "table";

        filtered.forEach(a => {
            const tr = document.createElement("tr");

            // Formatare dată corectă
            let dateTimeDisplay = '';
            if (a.date && a.startTime && a.endTime) {
                const dateParts = a.date.split("-");
                dateTimeDisplay = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]} ${a.startTime + ":00" + " - " + a.endTime + ":00"}`;
            } else if (a.dateTime) {
                // Pentru datele cu dateTime combinat
                const [datePart, timePart] = a.dateTime.split(" ");
                const dateParts = datePart.split("-");
                dateTimeDisplay = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]} ${timePart}`;
            }

            tr.innerHTML = `
                <td>${dateTimeDisplay}</td>
                <td>${translateVehicleType(a.vehicleType)}</td>
                <td>${a.problem}</td>
                <td>${translateStatus(a.status)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-sm view-details" data-id="${a.id}">Vezi</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

//traducere
function translateVehicleType(type) {
    const translations = {
        "motorcycle": "Motocicletă",
        "bicycle": "Bicicletă",
        "scooter": "Trotinetă"
    };
    return translations[type] || capitalize(type);
}

function translateStatus(status) {
    const translations = {
        "pending": "În așteptare",
        "approved": "Aprobat",
        "rejected": "Refuzat",
        "completed": "Finalizat",
        "modified": "Modificat",
        "canceled": "Anulat"
    };
    return translations[status] || capitalize(status);
}

// capitalize helper
function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function enableBodyScroll() {
    document.body.style.overflow = '';
}

function showAppointmentModal(appointment) {
    // daca modalil este deja il sterge
    const existingModal = document.getElementById('appointmentModal');
    if (existingModal) {
        existingModal.remove();
    }

    // blocheaza scroll ul cand esrti in modal
    disableBodyScroll();

    let dateTimeDisplay = '';
    let timeDisplay = '';

    if (appointment.date && appointment.startTime && appointment.endTime) {
        const dateParts = appointment.date.split("-");
        dateTimeDisplay = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
        timeDisplay = `${appointment.startTime}:00 - ${appointment.endTime}:00`;
    } else if (appointment.dateTime) {
        const [datePart, timePart] = appointment.dateTime.split(" ");
        const dateParts = datePart.split("-");
        dateTimeDisplay = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
        timeDisplay = timePart;
    }

    // status programare
    const isModified = appointment.status === 'modified';
    const isPending = appointment.status === 'pending';
    const isApproved = appointment.status === 'approved';
    const isCompleted = appointment.status === 'completed';
    const canCancel = isPending || isApproved;

    console.log('Appointment status:', appointment.status);
    console.log('Can cancel:', canCancel);

    //modal
    const modal = document.createElement('div');
    modal.id = 'appointmentModal';
    modal.className = 'modal-overlay';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    let totalEquipmentPrice = 0;
    let equipmentListHTML = '';

    if ((isApproved || isCompleted) && appointment.orderItems && appointment.orderItems.length > 0) {
        totalEquipmentPrice = appointment.orderItems.reduce((total, item) => {
            return total + (item.unitPrice * item.quantity);
        }, 0);

        equipmentListHTML = appointment.orderItems.map(item => `
            <div class="equipment-item">
                <span class="equipment-name">Produs:</span>
                <span class="equipment-details">Cantitate: ${item.quantity} x ${item.unitPrice.toFixed(2)} RON</span>
                <span class="equipment-total">${(item.unitPrice * item.quantity).toFixed(2)} RON</span>
            </div>
        `).join('');
    }

    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>Detalii Programare</h3>
            <button class="modal-close">
                <i class="ri-close-line"></i>
            </button>
        </div>
        <div class="modal-body">
            <div class="appointment-details">
                <div class="detail-item">
                    <i class="ri-calendar-line"></i>
                    <div>
                        <strong>Data:</strong>
                        <span>${dateTimeDisplay}</span>
                    </div>
                </div>
                <div class="detail-item">
                    <i class="ri-time-line"></i>
                    <div>
                        <strong>Ora:</strong>
                        <span>${timeDisplay || 'N/A'}</span>
                    </div>
                </div>
                <div class="detail-item">
                    <i class="ri-motorbike-line"></i>
                    <div>
                        <strong>Tip vehicul:</strong>
                        <span>${translateVehicleType(appointment.vehicleType)}</span>
                    </div>
                </div>
                ${appointment.vehicleBrand ? `
                <div class="detail-item">
                    <i class="ri-star-line"></i>
                    <div>
                        <strong>Marcă vehicul:</strong>
                        <span>${appointment.vehicleBrand}</span>
                    </div>
                </div>
                ` : ''}
                <div class="detail-item">
                    <i class="ri-tools-line"></i>
                    <div>
                        <strong>Problemă:</strong>
                        <span class="problem-text">${appointment.problem}</span>
                    </div>
                </div>
                <div class="detail-item">
                    <i class="ri-information-line"></i>
                    <div>
                        <strong>Status:</strong>
                        <span>${translateStatus(appointment.status)}</span>
                    </div>
                </div>
                ${appointment.adminMessage ? `
                <div class="detail-item">
                    <i class="ri-sticky-note-line"></i>
                    <div>
                        <strong>${isApproved || isCompleted || appointment.status === 'canceled' ? 'Mesaj administrator:' : 'Motiv respingere:'}</strong>
                        <span class="notes-text">${appointment.adminMessage}</span>
                    </div>
                </div>
                ` : ''}
                ${(isApproved || isCompleted) ? `
                <div class="approved-details">
                    <h4><i class="ri-check-circle-line"></i> ${isCompleted ? 'Detalii serviciu finalizat' : 'Detalii serviciu aprobat'}</h4>
                    
                    ${appointment.estimatedPrice ? `
                    <div class="detail-item">
                        <i class="ri-money-dollar-circle-line"></i>
                        <div>
                            <strong>${isCompleted ? 'Preț serviciu:' : 'Preț estimat serviciu:'}</strong>
                            <span>${appointment.estimatedPrice.toFixed(2)} RON</span>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${appointment.warrantyMonths ? `
                    <div class="detail-item">
                        <i class="ri-shield-check-line"></i>
                        <div>
                            <strong>Garanție:</strong>
                            <span>${appointment.warrantyMonths} ${appointment.warrantyMonths === 1 ? 'lună' : 'luni'}</span>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${appointment.orderItems && appointment.orderItems.length > 0 ? `
                    <div class="equipment-section">
                        <div class="equipment-list">
                            ${equipmentListHTML}
                            <div class="equipment-total-section">
                                <strong>Total echipamente: ${totalEquipmentPrice.toFixed(2)} RON</strong>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${(appointment.estimatedPrice || totalEquipmentPrice) ? `
                    <div class="total-cost">
                        <div class="detail-item total-highlight">
                            <i class="ri-calculator-line"></i>
                            <div>
                                <strong>${isCompleted ? 'Cost total:' : 'Cost total :'}</strong>
                                <span class="total-price">${((appointment.estimatedPrice || 0) + totalEquipmentPrice).toFixed(2)} RON</span>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                </div>
                ` : ''}
            </div>
            ${isModified ? `
            <div class="modification-notice">
                <div class="modification-message">
                    <p>Programarea a fost modificată de către administrator. Acceptați modificările?</p>
                </div>
                <div class="modification-actions">
                    <button class="btn btn-primary accept-modification" data-id="${appointment.id}">
                        <i class="ri-check-line"></i>
                        Acceptă
                    </button>
                    <button class="btn btn-secondary reject-modification" data-id="${appointment.id}">
                        <i class="ri-close-line"></i>
                        Respinge
                    </button>
                </div>
            </div>
            ` : ''}
            ${canCancel ? `
            <div class="cancel-appointment-section">
                <button class="btn btn-danger cancel-appointment" data-id="${appointment.id}">
                    <i class="ri-close-circle-line"></i>
                    Anulează programarea
                </button>
            </div>
            ` : ''}
        </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    function closeModal() {
        modal.remove();
        enableBodyScroll();
    }

    // event listeners pentru inchiderea modalului
    const closeButtons = modal.querySelectorAll('.modal-close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // inchide cu escape
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);

    if (isModified) {
        const acceptBtn = modal.querySelector('.accept-modification');
        const rejectBtn = modal.querySelector('.reject-modification');

        if (acceptBtn) {
            acceptBtn.addEventListener('click', async () => {
                try {
                    await fetch("api/appointment/update", {
                        method: "PUT",
                        headers: {
                            "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            appointmentId: appointment.id,
                            adminMessage: appointment.adminMessage,
                            status: "pending",
                        })
                    });
                    closeModal();
                    loadAppointments();
                } catch (error) {
                    console.error('Error accepting modification:', error);
                    showCustomAlert('A apărut o eroare. Vă rugăm să încercați din nou.', 3000);
                }
            });
        }

        if (rejectBtn) {
            rejectBtn.addEventListener('click', async () => {
                try {
                    await fetch("api/appointment/update", {
                        method: "PUT",
                        headers: {
                            "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            appointmentId: appointment.id,
                            adminMessage: appointment.adminMessage,
                            status: "canceled",
                        })
                    });
                    closeModal();
                    loadAppointments();
                } catch (error) {
                    console.error('Error rejecting modification:', error);
                    showCustomAlert('A apărut o eroare. Vă rugăm să încercați din nou.', 3000);
                }
            });
        }
    }

    if (canCancel) {
        const cancelBtn = modal.querySelector('.cancel-appointment');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', async () => {
                if (confirm('Sunteți sigur că doriți să anulați această programare?')) {
                    try {
                        await fetch("api/appointment/update", {
                            method: "PUT",
                            headers: {
                                "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                appointmentId: appointment.id,
                                adminMessage: appointment.adminMessage,
                                status: "canceled",
                            })
                        });
                        closeModal();
                        loadAppointments();
                    } catch (error) {
                        console.error('Eroare la anularea programării:', error);
                        showCustomAlert('A apărut o eroare la anularea programării. Vă rugăm să încercați din nou.',3000);
                    }
                }
            });
        }
    }
}

async function deleteAppointment(appointmentId) {
    try {
        const response = await fetch(`/api/appointments/${appointmentId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP status ${response.status}`);
        }

        appointments = appointments.filter(a => a.id != appointmentId);

        renderAppointments({
            search: document.getElementById("searchAppointments").value,
            vehicleType: document.getElementById("vehicleTypeFilter").value,
            status: document.getElementById("statusFilter").value
        });

        //mesaj de succes
        showSuccessMessage("Programarea a fost ștearsă cu succes!");

    } catch (error) {
        console.error("Error deleting appointment:", error);
        showErrorMessage("A apărut o eroare la ștergerea programării. Vă rugăm să încercați din nou.");
    }
}

function showSuccessMessage(message) {
    showCustomAlert(message,3000);
}

function showErrorMessage(message) {
    showCustomAlert(message,3000);
}

loadAppointments();