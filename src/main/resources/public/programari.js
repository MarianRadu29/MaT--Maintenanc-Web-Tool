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
    // Initialize auth links first
    initializeAuthLinks();

    // Check authentication first
    const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData') || null;
    if(!userData){
        window.location.href = "/login.html";
        return;
    }

    // Get current year for footer
    const currentYearElement = document.getElementById("currentYear");
    if (currentYearElement) {
        currentYearElement.innerText = new Date().getFullYear();
    }

    // Initialize UI elements
    document.getElementById("user-account").style.display = "none";
    document.getElementById("admin-link").style.display = "none";

    const timeSlots = document.getElementById("timeSlots");
    const appointmentDateInput = document.getElementById("appointmentDate");

    // Get appointment data from localStorage if available
    const appointmentDate = localStorage.getItem("selectedAppointmentDate");
    const appointmentTime = localStorage.getItem("selectedAppointmentTime");

    // --- File upload handling cu DataTransfer pentru multiple adăugări ---
    const fileUpload = document.getElementById("fileUpload");
    const fileUploadArea = document.querySelector(".file-upload-area");
    const filesList = document.getElementById("filesList");

    // creează un DataTransfer pentru a gestiona files[]
    const dt = new DataTransfer();

    if (fileUpload && fileUploadArea && filesList) {
        // click pe zona custom deschide dialogul
        fileUploadArea.addEventListener("click", () => fileUpload.click());

        // atunci când alegi noi fisierer în dialog
        fileUpload.addEventListener("change", () => {
            // adaugă fiecare fisire nou id dt si in lista vizuala
            Array.from(fileUpload.files).forEach((file) => {
                dt.items.add(file); // adaug  DataTransfer
                appendFileItem(file); // afisez în UI
            });
            fileUpload.files = dt.files; // sincronizez input.files
        });

        // suport drag & drop
        ["dragover", "dragleave", "drop"].forEach((evtName) => {
            fileUploadArea.addEventListener(evtName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (evtName === "dragover") fileUploadArea.classList.add("dragover");
                else fileUploadArea.classList.remove("dragover");
            });
        });

        fileUploadArea.addEventListener("drop", (e) => {
            Array.from(e.dataTransfer.files).forEach((file) => {
                dt.items.add(file);
                appendFileItem(file);
            });
            fileUpload.files = dt.files;
            fileUploadArea.classList.remove("dragover");
        });

        // functie helper pentru afisare + ștergere
        function appendFileItem(file) {
            // validare
            if (!file.type.match("image/*") && !file.type.match("video/*")) {
                showCustomAlert("Doar imagini și videoclipuri sunt acceptate.",3000);
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                showCustomAlert("Fișier prea mare (max 10MB).",3000);
                return;
            }

            const fileItem = document.createElement("div");
            fileItem.className = "file-item";
            fileItem.innerHTML = `
                <span class="file-name">${file.name}</span>
                <button type="button" class="btn btn-secondary btn-sm remove-file">Șterge</button>
            `;
            filesList.appendChild(fileItem);

            // handler pentru ștergere
            fileItem.querySelector(".remove-file").addEventListener("click", () => {
                // gasesc indexul fisierului in dt.files
                const idx = Array.from(dt.files).findIndex(
                    (f) =>
                        f.name === file.name &&
                        f.size === file.size &&
                        f.lastModified === file.lastModified
                );
                if (idx > -1) {
                    dt.items.remove(idx); // scoate din DataTransfer
                    fileUpload.files = dt.files; // update input.files
                }
                fileItem.remove(); // scoate din UI
            });
        }
    }

    // Service type selection
    const serviceTypes = document.querySelectorAll(".service-type");
    let selectedVehicleType = "motorcycle";
    serviceTypes.forEach((btn) => {
        btn.addEventListener("click", () => {
            serviceTypes.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            selectedVehicleType = btn.dataset.type;
        });
    });

    // Set the date and time in the form if they exist in localStorage
    if (appointmentDate && appointmentTime) {
        const dateInput = document.getElementById("appointmentDate");
        if (dateInput) {
            dateInput.value = appointmentDate;
        }

        // Set the selected time in the time slots (if applicable)
        const timeSlotElements = document.querySelectorAll(".time-slot");
        timeSlotElements.forEach((slot) => {
            if (slot.textContent.trim() === appointmentTime) {
                slot.classList.add("selected");
            }
        });

        // Remove items from localStorage after they're used
        localStorage.removeItem("selectedAppointmentDate");
        localStorage.removeItem("selectedAppointmentTime");
    }

    // Time slots generation on date change
    if (appointmentDateInput && appointmentDateInput.value) {
        generateTimeSlots(appointmentDateInput.value);
    }

    if (timeSlots && appointmentDateInput) {
        appointmentDateInput.addEventListener("change", function () {
            generateTimeSlots(this.value);
        });
    }

    // Form submission
    const appointmentForm = document.getElementById("appointmentForm");

    if (appointmentForm) {
        appointmentForm.addEventListener("submit", function (e) {
            e.preventDefault();
            // Get form data
            const data = new FormData(this);

            // Get selected time
            const selectedTime = document.querySelector(".time-slot.selected");
            if (!selectedTime) {
                showCustomAlert("Vă rugăm să selectați o oră pentru programare.",3000);
                return;
            }

            const hour = selectedTime.textContent.trim().substring(0, 2);
            data.append("vehicleType", selectedVehicleType);
            data.append("appointmentStartTime", hour);
            data.append("appointmentEndTime", String(Number(hour)+1));
            data.append("idClient", JSON.parse(localStorage.getItem("userData")).id);

            // Simulate form submission
            const submitButton = this.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = "Se procesează...";

            // Trimite ca multipart/form-data
            fetch("/api/appointment", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
                    "Content-Type": "application/json"
                },
                body: data,
            })
                .then(async res => {
                    if (res.ok) {
                        const json = await res.json();
                        return json;
                    }
                    let err;
                    try {
                        err = await res.json();
                    } catch {
                        err = { message: res.statusText || `HTTP ${res.status}` };
                    }
                    throw { status: res.status, ...err };
                })
                .then(json => {
                    showCustomAlert("Rezervare creată: " + JSON.stringify(json),3000);
                })
                .catch(err => {
                    console.error("Eroare la fetch:", err);
                    if (err.status) {
                        showCustomAlert(`Server error ${err.status}: ${err.message || ""}`,3000);
                    } else {
                        showCustomAlert(`Network/JS error: ${err.message}`,3000);
                    }
                });

            setTimeout(() => {
                //ar trebui facut un pop up frumos elegant cat de cat
                showCustomAlert(
                    "Programare trimisă cu succes! Veți primi un email de confirmare.",3000
                );

                // Reset form
                appointmentForm.reset();
                filesList.innerHTML = "";
                document.querySelectorAll(".time-slot").forEach((slot) => {
                    slot.classList.remove("selected");
                });
                serviceTypes.forEach((btn) => btn.classList.remove("active"));
                serviceTypes[0].classList.add("active"); // Reset to motorcycle
                selectedVehicleType = "motorcycle";

                // Re-enable submit button
                submitButton.disabled = false;
                submitButton.textContent = "Trimite programare";
            }, 1500);
        });
    }

    // Mobile menu toggle
    const menuToggle = document.getElementById("menuToggle");
    const mainNav = document.querySelector(".main-nav");

    if (menuToggle) {
        menuToggle.addEventListener("click", () => {
            mainNav.classList.toggle("open");
        });
    }

    // Call this on page load
    checkLoggedInUser();

    // Initialize auth links function
    function initializeAuthLinks() {
        const authLinks = document.querySelector(".auth-links");
        if (authLinks) {
            // Set default login/register buttons
            authLinks.innerHTML = `
                <a class="btn btn-primary" href="login.html">Conectare</a>
                <a class="btn btn-secondary" href="register.html">Înregistrare</a>
            `;
        }
    }

    // Check if user is already logged in
    function checkLoggedInUser() {
        const userData = JSON.parse(
            localStorage.getItem("userData") ||
            sessionStorage.getItem("userData") ||
            null
        );

        const authLinks = document.querySelector(".auth-links");
        const adminLink = document.getElementById("admin-link");

        if (userData && authLinks) {
            // Update UI for logged in user
            document.getElementById("user-account").style.display = "block";

            authLinks.innerHTML = `
                <a href="#" id="logoutButton" class="btn btn-secondary">Deconectare</a>
            `;

            if (userData.roleID == 2 && adminLink) {
                adminLink.style.display = "block";
            }

            // Add logout functionality
            const logoutButton = document.getElementById("logoutButton");
            if (logoutButton) {
                logoutButton.addEventListener("click", function (e) {
                    e.preventDefault();
                    localStorage.removeItem("userData");
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");

                    // Reset auth links to login/register buttons
                    authLinks.innerHTML = `
                        <a href="login.html" class="btn btn-primary">Conectare</a>
                        <a href="register.html" class="btn btn-secondary">Înregistrare</a>
                    `;

                    // Hide user-specific elements
                    document.getElementById("user-account").style.display = "none";
                    if (adminLink) {
                        adminLink.style.display = "none";
                    }

                    // Reload page or redirect
                    window.location.reload();
                });
            }
        } else if (authLinks) {
            // Ensure login/register buttons are shown for non-logged users
            authLinks.innerHTML = `
                <a href="login.html" class="btn btn-primary">Conectare</a>
                <a href="register.html" class="btn btn-secondary">Înregistrare</a>
            `;
        }
    }

    // Generate time slots function
    function generateTimeSlots(selectedDate) {
        const timeSlotsContainer = timeSlots.querySelector(".time-slots-container");
        // Obține toate elementele time-slot deja existente
        const timeSlotsElements = timeSlotsContainer.querySelectorAll(".time-slot");

        // Fetch appointments for the selected date from the server
        const dateString = selectedDate; // Formatul datei selectate este deja acceptabil
        const apiUrl = `/api/appointments/day/${dateString}`; // Endpointul care returnează programările pentru ziua respectivă

        fetch(apiUrl)
            .then((response) => response.json())
            .then((appointments) => {
                // Generate time slots from 9:00 to 17:00
                const startHour = 9;
                const endHour = 17;

                // Loop over each hour and check if it is booked
                for (let hour = startHour; hour <= endHour; hour++) {
                    const time = `${String(hour).padStart(2, "0")}:00`;

                    // Find the time slot element that corresponds to this hour
                    const timeSlotElement = Array.from(timeSlotsElements).find(
                        (slot) => slot.textContent.trim() === time
                    );

                    if (timeSlotElement) {
                        // Check if the time slot is booked
                        const isBooked = appointments.includes(String(hour)); // Verificăm dacă ora este ocupată

                        // Update the class for the time slot based on whether it is booked
                        if (isBooked) {
                            timeSlotElement.classList.add("unavailable");
                        } else {
                            timeSlotElement.classList.remove("unavailable");
                        }

                        // Optional: Handle the onclick functionality for available slots
                        if (!isBooked) {
                            timeSlotElement.onclick = function () {
                                // Remove selected class from all time slots
                                const slots = document.querySelectorAll(".time-slot");

                                slots.forEach((slot) => {
                                    slot.classList.remove("selected");
                                });

                                // Add selected class to clicked time slot
                                this.classList.add("selected");
                            };
                        }
                    }
                }
            })
            .catch((error) => {
                console.error("Error fetching appointments:", error);
            });
    }
});