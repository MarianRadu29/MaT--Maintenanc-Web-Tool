document.addEventListener("DOMContentLoaded", () => {
    // Navbar mobil
    const menuToggle = document.getElementById("menuToggle");
    const mainNav = document.querySelector(".main-nav");
    menuToggle?.addEventListener("click", () => mainNav.classList.toggle("open"));

    // Tabs profile
    const tabs = document.querySelectorAll(".profile-tabs .tab-button");
    const tabContents = document.querySelectorAll(".tab-content");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            tabContents.forEach(tc => (tc.style.display = "none"));
            document.getElementById("tab-" + tab.dataset.tab).style.display = "block";
        });
    });

    // User data
    let userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || null);

    if (!userData) {
        window.location.href = 'login.html';
        return;
    }

    // Populare date user în profil
    function populateUserData() {
        document.getElementById('user-fullname-display').textContent = (userData.firstName || '') + ' ' + (userData.lastName || '');
        document.getElementById('user-email-display').textContent = userData.email || '-';
        document.getElementById('user-phone-display').textContent = userData.phoneNumber || '-';
        document.getElementById('user-role-display').textContent = userData.roleID == 2 ? 'Administrator' : 'Client';
    }

    populateUserData();
    updateAuthLinks();

    // Sistem de editare inline
    const editButtons = document.querySelectorAll('.edit-btn');
    const saveButtons = document.querySelectorAll('.save-btn');
    const cancelButtons = document.querySelectorAll('.cancel-btn');

    // Event listeners pentru butoanele de editare
    editButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const field = e.target.closest('.edit-btn').dataset.field;
            startEdit(field);
        });
    });

    // Event listeners pentru butoanele de salvare
    saveButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const field = e.target.closest('.save-btn').dataset.field;
            saveEdit(field);
        });
    });

    // Event listeners pentru butoanele de anulare
    cancelButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const field = e.target.closest('.cancel-btn').dataset.field;
            cancelEdit(field);
        });
    });

    function startEdit(field) {
        const displayRow = document.querySelector(`[data-field="${field}"]`).closest('.info-item-inline').querySelector('.info-row');
        const editRow = document.getElementById(`edit-${field}`);

        // Ascunde rândul de afișare și arată rândul de editare
        displayRow.style.display = 'none';
        editRow.style.display = 'flex';

        // Populează câmpurile de input cu valorile curente
        if (field === 'fullname') {
            document.getElementById('user-firstname').value = userData.firstName || '';
            document.getElementById('user-lastname').value = userData.lastName || '';
            document.getElementById('user-firstname').focus();
        } else if (field === 'email') {
            document.getElementById('user-email-input').value = userData.email || '';
            document.getElementById('user-email-input').focus();
        } else if (field === 'phone') {
            document.getElementById('user-phone-input').value = userData.phoneNumber || '';
            document.getElementById('user-phone-input').focus();
        }
    }

    function saveEdit(field) {
        let hasChanges = false;
        let newData = { ...userData };

        if (field === 'fullname') {
            const firstName = document.getElementById('user-firstname').value.trim();
            const lastName = document.getElementById('user-lastname').value.trim();

            if (firstName !== userData.firstName || lastName !== userData.lastName) {
                newData.firstName = firstName;
                newData.lastName = lastName;
                hasChanges = true;
            }
            fetch("/api/user/update",{
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    firstName: newData.firstName,
                    lastName: newData.lastName
                })
            })
        } else if (field === 'email') {
            const email = document.getElementById('user-email-input').value.trim();

            if (email && !isValidEmail(email)) {
                alert('Vă rugăm să introduceți o adresă de email validă.');
                return;
            }

            if (email !== userData.email) {
                newData.email = email;
                hasChanges = true;
            }
            fetch("/api/user/update",{
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email:newData.email,
                })
            })
        } else if (field === 'phone') {
            const phone = document.getElementById('user-phone-input').value.trim();

            if (phone !== userData.phoneNumber) {
                newData.phoneNumber = phone;
                hasChanges = true;
            }
            fetch("/api/user/update",{
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    phoneNumber:newData.phoneNumber,
                })
            })
        }

        if (hasChanges) {
            userData = newData;
            localStorage.setItem('userData', JSON.stringify(userData));
            if (sessionStorage.getItem('userData')) {
                sessionStorage.setItem('userData', JSON.stringify(userData));
            }

            // Actualizează afișarea
            populateUserData();

            // Aici ai putea face și un call către API pentru a salva în baza de date
            // await updateUserProfile(userData);
        }

        cancelEdit(field);
    }

    function cancelEdit(field) {
        const displayRow = document.querySelector(`[data-field="${field}"]`).closest('.info-item-inline').querySelector('.info-row');
        const editRow = document.getElementById(`edit-${field}`);

        // Arată rândul de afișare și ascunde rândul de editare
        displayRow.style.display = 'flex';
        editRow.style.display = 'none';
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Suport pentru Enter și Escape în câmpurile de editare

    document.addEventListener('keydown', (e) => {
        if (e.target.closest('.edit-inputs')) {
            const editContainer = e.target.closest('.info-edit');
            const field = editContainer.id.replace('edit-', '');

            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit(field);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit(field);
            }
        }
    });

    let appointments = [];

    // incarc programrile din API + fallback demo
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
            console.log(appointments);
        } catch (error) {
            console.error("Error fetching appointments:", error);
        }
        renderAppointments();
    }

    // Render tabel programari
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
                    dateTimeDisplay = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]} ${a.startTime+ ":00" + " - " + a.endTime+":00"}`;
                } else if (a.dateTime) {
                    // Pentru datele cu dateTime combinat
                    const [datePart, timePart] = a.dateTime.split(" ");
                    const dateParts = datePart.split("-");
                    dateTimeDisplay = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]} ${timePart}`;
                }

                // Verificăm dacă programarea poate fi ștearsă (doar pending și rejected)
                const canDelete = a.status === 'pending' || a.status === 'rejected';

                tr.innerHTML = `
                    <td>${dateTimeDisplay}</td>
                    <td>${translateVehicleType(a.vehicleType)}</td>
                    <td>${a.problem}</td>
                    <td>${translateStatus(a.status)}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-primary btn-sm view-details" data-id="${a.id}">Vezi</button>
                            ${canDelete ? `<button class="btn btn-danger btn-sm delete-appointment" data-id="${a.id}">Șterge</button>` : ''}
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    }

    // Funcții de traducere
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
            "canceled":"Anulat"
        };
        return translations[status] || capitalize(status);
    }

    // Capitalize helper
    function capitalize(str) {
        if (!str) return "";
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Evenimente filtre input
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

    // Funcții pentru gestionarea scroll-ului
    function disableBodyScroll() {
        document.body.style.overflow = 'hidden';
    }

    function enableBodyScroll() {
        document.body.style.overflow = '';
    }

    // Funcție pentru afișarea modalului de confirmare ștergere
    function showDeleteConfirmationModal(appointmentId) {
        const appointment = appointments.find(a => a.id == appointmentId);
        if (!appointment) return;

        // Verifică dacă modalul există deja, dacă da îl șterge
        const existingModal = document.getElementById('deleteConfirmationModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Blochează scroll-ul pe body
        disableBodyScroll();

        // Formatare dată pentru afișare
        let dateTimeDisplay = '';
        if (appointment.date && appointment.startTime && appointment.endTime) {
            const dateParts = appointment.date.split("-");
            dateTimeDisplay = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]} ${appointment.startTime}:00 - ${appointment.endTime}:00`;
        } else if (appointment.dateTime) {
            const [datePart, timePart] = appointment.dateTime.split(" ");
            const dateParts = datePart.split("-");
            dateTimeDisplay = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]} ${timePart}`;
        }

        // Creează modalul
        const modal = document.createElement('div');
        modal.id = 'deleteConfirmationModal';
        modal.className = 'modal-overlay';

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content modal-small';

        modalContent.innerHTML = `
            <div class="modal-header">
                <h3>Confirmă ștergerea</h3>
                <button class="modal-close">
                    <i class="ri-close-line"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="delete-confirmation-content">
                    <p>Ești sigur că vrei să ștergi această programare?<br> Această acțiune nu poate fi anulată.</p>
                    
                </div>
                <div class="modal-actions">
                    <button class="btn btn-danger confirm-delete" data-id="${appointmentId}">
                        <i class="ri-delete-bin-line"></i>
                        Șterge
                    </button>
                    <button class="btn btn-secondary cancel-delete">
                        <i class="ri-close-line"></i>
                        Anulează
                    </button>
                </div>
            </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Funcție pentru închiderea modalului
        function closeModal() {
            modal.remove();
            enableBodyScroll();
        }

        // Event listeners pentru închiderea modalului
        const closeButtons = modal.querySelectorAll('.modal-close, .cancel-delete');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', closeModal);
        });

        // Închide modalul când se dă click pe overlay
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Închide modalul cu tasta Escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Event listener pentru butonul de confirmare ștergere
        const confirmBtn = modal.querySelector('.confirm-delete');
        confirmBtn.addEventListener('click', async () => {
            await deleteAppointment(appointmentId);
            closeModal();
        });
    }

    // Funcție pentru ștergerea programării
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

            // Elimină programarea din array-ul local
            appointments = appointments.filter(a => a.id != appointmentId);

            // Re-renderează tabelul
            renderAppointments({
                search: document.getElementById("searchAppointments").value,
                vehicleType: document.getElementById("vehicleTypeFilter").value,
                status: document.getElementById("statusFilter").value
            });

            // Afișează mesaj de succes (opțional)
            showSuccessMessage("Programarea a fost ștearsă cu succes!");

        } catch (error) {
            console.error("Error deleting appointment:", error);
            showErrorMessage("A apărut o eroare la ștergerea programării. Vă rugăm să încercați din nou.");
        }
    }

    // Funcții pentru afișarea mesajelor de succes/eroare (opționale)
    function showSuccessMessage(message) {
        // Poți implementa un toast notification sau alt sistem de mesaje
        alert(message); // Soluție temporară
    }

    function showErrorMessage(message) {
        // Poți implementa un toast notification sau alt sistem de mesaje
        alert(message); // Soluție temporară
    }

    // Funcție pentru crearea și afișarea modalului
    // Funcție pentru crearea și afișarea modalului
    function showAppointmentModal(appointment) {
        // Verifică dacă modalul există deja, dacă da îl șterge
        const existingModal = document.getElementById('appointmentModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Blochează scroll-ul pe body
        disableBodyScroll();

        // Formatare dată pentru modal
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

        // Verifică dacă programarea are status "modified" sau "pending"
        const isModified = appointment.status === 'modified';
        const isPending = appointment.status === 'pending';

        // Creează modalul
        const modal = document.createElement('div');
        modal.id = 'appointmentModal';
        modal.className = 'modal-overlay';

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';

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
                <strong>Note:</strong>
                <span class="notes-text">${appointment.adminMessage}</span>
            </div>
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
    ${isPending ? `
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

        // Funcție pentru închiderea modalului
        function closeModal() {
            modal.remove();
            enableBodyScroll(); // Reactivează scroll-ul
        }

        // Event listeners pentru închiderea modalului
        const closeButtons = modal.querySelectorAll('.modal-close');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', closeModal);
        });

        // Închide modalul când se dă click pe overlay
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Închide modalul cu tasta Escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Event listeners pentru butoanele de acceptare/respingere modificări
        if (isModified) {
            const acceptBtn = modal.querySelector('.accept-modification');
            const rejectBtn = modal.querySelector('.reject-modification');
            acceptBtn.addEventListener('click', async () => {
                // await handleModificationResponse(appointment.id, 'accepted');
                await fetch("api/appointment/update",{
                    method:"PUT",
                    headers: { "Content-Type": "application/json" },
                    body:JSON.stringify({
                        appointmentId:appointment.id,
                        adminMessage:appointment.adminMessage,
                        status:"pending",
                    })
                })
                closeModal();
            });

            rejectBtn.addEventListener('click', async () => {
                // await handleModificationResponse(appointment.id, 'rejected');
                await fetch("api/appointment/update",{
                    method:"PUT",
                    headers: { "Content-Type": "application/json" },
                    body:JSON.stringify({
                        appointmentId:appointment.id,
                        adminMessage:appointment.adminMessage,
                        status:"canceled",
                    })
                })
                closeModal();
            });
            
        }

        const cancelBtn = modal.querySelector('.cancel-appointment');
        cancelBtn.addEventListener('click',async ()=>{
            // await handleModificationResponse(appointment.id, 'rejected');
            console.log("ssiiiiii");
        await fetch("api/appointment/update",{
            method:"PUT",
            headers: { "Content-Type": "application/json" },
            body:JSON.stringify({
                appointmentId:appointment.id,
                adminMessage:appointment.adminMessage,
                status:"canceled",
            })
        })
        closeModal();
    })
    }

    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("view-details")) {
            const appointmentId = e.target.getAttribute("data-id");
            const appointment = appointments.find(a => a.id == appointmentId);
            if (appointment) {
                showAppointmentModal(appointment);
            }
        }
    });

    // Event listener pentru butoanele "Vezi" și "Șterge"
    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("view-details")) {
            const appointmentId = e.target.getAttribute("data-id");
            const appointment = appointments.find(a => a.id == appointmentId);
            if (appointment) {
                showAppointmentModal(appointment);
            }
        } else if (e.target.classList.contains("delete-appointment")) {
            const appointmentId = e.target.getAttribute("data-id");
            showDeleteConfirmationModal(appointmentId);
        }
    });

    // Actualizează butoanele login/logout din header
    function updateAuthLinks() {
        const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || null);
        const authLinks = document.querySelector('.auth-links');
        const userAccountLink = document.getElementById('user-account');

        if (userData) {
            if (authLinks) {
                userAccountLink.style.display = "block";
                authLinks.innerHTML = `<a href="#" id="logoutButton" class="btn btn-secondary">Deconectare</a>`;
                document.getElementById('logoutButton').addEventListener('click', e => {
                    e.preventDefault();
                    localStorage.removeItem('userData');
                    sessionStorage.removeItem('userData');
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('userAppointments');
                    window.location.reload();
                });
            }
        } else {
            if (authLinks) {
                userAccountLink.style.display = "none";
                authLinks.innerHTML = `
                    <a href="login.html" class="btn btn-primary">Conectare</a>
                    <a href="register.html" class="btn btn-secondary">Înregistrare</a>
                `;
            }
        }
    }

    // Corectare: Afișează link admin doar pentru admini (roleID == 2)
    const adminLink = document.getElementById('admin-link');
    if (adminLink) {
        if (userData && userData.roleID == 2) {
            adminLink.style.display = 'list-item';
        } else {
            adminLink.style.display = 'none';
        }
    }

    loadAppointments();

    document.getElementById("currentYear").textContent = new Date().getFullYear();
});