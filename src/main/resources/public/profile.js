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
        } else if (field === 'email') {
            const email = document.getElementById('user-email-input').value.trim();

            // Validare simplă de email
            if (email && !isValidEmail(email)) {
                alert('Vă rugăm să introduceți o adresă de email validă.');
                return;
            }

            if (email !== userData.email) {
                newData.email = email;
                hasChanges = true;
            }
        } else if (field === 'phone') {
            const phone = document.getElementById('user-phone-input').value.trim();

            if (phone !== userData.phoneNumber) {
                newData.phoneNumber = phone;
                hasChanges = true;
            }
        }

        if (hasChanges) {
            // Salvează în localStorage/sessionStorage
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
        } catch (error) {
            console.error("Error fetching appointments:", error);
            // Fallback - folosim date demo cu structura corectă
            if (!localStorage.getItem("userAppointments")) {
                appointments = [
                    {
                        id: 1,
                        date: "2025-05-22",
                        time: "14:00",
                        vehicleType: "motorcycle",
                        problem: "Schimb ulei",
                        status: "pending"
                    },
                    {
                        id: 2,
                        date: "2025-05-25",
                        time: "10:00",
                        vehicleType: "bicycle",
                        problem: "Revizie frâne",
                        status: "approved"
                    },
                    {
                        id: 3,
                        date: "2025-06-01",
                        time: "16:00",
                        vehicleType: "scooter",
                        problem: "Înlocuire baterie",
                        status: "completed"
                    }
                ];
                // Salvăm datele demo pentru utilizare ulterioară
                localStorage.setItem("userAppointments", JSON.stringify(appointments));
            } else {
                appointments = JSON.parse(localStorage.getItem("userAppointments"));
            }
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
                if (a.date && a.time) {
                    // Pentru datele cu date și time separate
                    const dateParts = a.date.split("-");
                    dateTimeDisplay = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]} ${a.time}`;
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
                    <td><button class="btn btn-primary btn-sm view-details" data-id="${a.id}">Vezi</button></td>
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
            "completed": "Finalizat"
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

    // Event listener pentru butoanele "Vezi"
    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("view-details")) {
            const appointmentId = e.target.getAttribute("data-id");
            const appointment = appointments.find(a => a.id == appointmentId);
            if (appointment) {
                alert(`Detalii programare:\nData: ${appointment.date || appointment.dateTime}\nVehicul: ${translateVehicleType(appointment.vehicleType)}\nProblemă: ${appointment.problem}\nStatus: ${translateStatus(appointment.status)}`);
            }
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