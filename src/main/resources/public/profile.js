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
    const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || null);

    if (!userData) {
        window.location.href = 'login.html';
        return;
    }

    // Populare date user în profil
    document.getElementById('user-fullname').textContent = userData.firstName + ' ' + (userData.lastName || '');
    document.getElementById('user-email').textContent = userData.email || '-';
    document.getElementById('user-phone').textContent = userData.phoneNumber || '-';
    document.getElementById('user-role').textContent = userData.roleID == 2 ? 'Administrator' : 'Client';

    updateAuthLinks();

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