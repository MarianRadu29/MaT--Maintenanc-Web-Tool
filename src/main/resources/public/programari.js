
document.addEventListener('DOMContentLoaded', function () {
    initializeAuthLinks();


    const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData') || null;
    if(!userData){
        window.location.href = "/login.html";
        return;
    }

    const currentYearElement = document.getElementById("currentYear");
    if (currentYearElement) {
        currentYearElement.innerText = new Date().getFullYear();
    }

    document.getElementById("user-account").style.display = "none";
    document.getElementById("admin-link").style.display = "none";

    const timeSlots = document.getElementById("timeSlots");
    const appointmentDateInput = document.getElementById("appointmentDate");

    const appointmentDate = localStorage.getItem("selectedAppointmentDate");
    const appointmentTime = localStorage.getItem("selectedAppointmentTime");

    const fileUpload = document.getElementById("fileUpload");
    const fileUploadArea = document.querySelector(".file-upload-area");
    const filesList = document.getElementById("filesList");

    // creeaza un DataTransfer pentru a gestiona files[]
    const dt = new DataTransfer();

    if (fileUpload && fileUploadArea && filesList) {
        // click pe zona custom deschide dialogul
        fileUploadArea.addEventListener("click", () => fileUpload.click());

        fileUpload.addEventListener("change", () => {
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

        // functie helper pentru afisare + stergere
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

    const serviceTypes = document.querySelectorAll(".service-type");
    let selectedVehicleType = "motorcycle";
    serviceTypes.forEach((btn) => {
        btn.addEventListener("click", () => {
            serviceTypes.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            selectedVehicleType = btn.dataset.type;
        });
    });

    if (appointmentDate && appointmentTime) {
        const dateInput = document.getElementById("appointmentDate");
        if (dateInput) {
            dateInput.value = appointmentDate;
        }

        const timeSlotElements = document.querySelectorAll(".time-slot");
        timeSlotElements.forEach((slot) => {
            if (slot.textContent.trim() === appointmentTime) {
                slot.classList.add("selected");
            }
        });

        localStorage.removeItem("selectedAppointmentDate");
        localStorage.removeItem("selectedAppointmentTime");
    }

    if (appointmentDateInput && appointmentDateInput.value) {
        generateTimeSlots(appointmentDateInput.value);
    }

    if (timeSlots && appointmentDateInput) {
        appointmentDateInput.addEventListener("change", function () {
            generateTimeSlots(this.value);
        });
    }

    // form submission
    const appointmentForm = document.getElementById("appointmentForm");

    if (appointmentForm) {
        appointmentForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const data = new FormData(this);

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

            const submitButton = this.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = "Se procesează...";

            // trimite ca multipart/form-data
            fetch("/api/appointment", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
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
                showCustomAlert(
                    "Programare trimisă cu succes! Veți primi un email de confirmare.",3000
                );

                appointmentForm.reset();
                filesList.innerHTML = "";
                document.querySelectorAll(".time-slot").forEach((slot) => {
                    slot.classList.remove("selected");
                });
                serviceTypes.forEach((btn) => btn.classList.remove("active"));
                serviceTypes[0].classList.add("active");
                selectedVehicleType = "motorcycle";

                submitButton.disabled = false;
                submitButton.textContent = "Trimite programare";
            }, 1500);
        });
    }

    const menuToggle = document.getElementById("menuToggle");
    const mainNav = document.querySelector(".main-nav");

    if (menuToggle) {
        menuToggle.addEventListener("click", () => {
            mainNav.classList.toggle("open");
        });
    }

    checkLoggedInUser();

    function initializeAuthLinks() {
        const authLinks = document.querySelector(".auth-links");
        if (authLinks) {
            authLinks.innerHTML = `
                <a class="btn btn-primary" href="login.html">Conectare</a>
                <a class="btn btn-secondary" href="register.html">Înregistrare</a>
            `;
        }
    }

    function checkLoggedInUser() {
        const userData = JSON.parse(
            localStorage.getItem("userData") ||
            sessionStorage.getItem("userData") ||
            null
        );

        const authLinks = document.querySelector(".auth-links");
        const adminLink = document.getElementById("admin-link");

        if (userData && authLinks) {
            document.getElementById("user-account").style.display = "block";

            authLinks.innerHTML = `
                <a href="#" id="logoutButton" class="btn btn-secondary">Deconectare</a>
            `;

            if (userData.roleID == 2 && adminLink) {
                adminLink.style.display = "block";
            }

            //logout functionality
            const logoutButton = document.getElementById("logoutButton");
            if (logoutButton) {
                logoutButton.addEventListener("click", function (e) {
                    e.preventDefault();
                    localStorage.removeItem("userData");
                    localStorage.removeItem("accessToken");

                    // Reset auth links to login/register buttons
                    authLinks.innerHTML = `
                        <a href="login.html" class="btn btn-primary">Conectare</a>
                        <a href="register.html" class="btn btn-secondary">Înregistrare</a>
                    `;

                    document.getElementById("user-account").style.display = "none";
                    if (adminLink) {
                        adminLink.style.display = "none";
                    }

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

    function generateTimeSlots(selectedDate) {
        const timeSlotsContainer = timeSlots.querySelector(".time-slots-container");
        const timeSlotsElements = timeSlotsContainer.querySelectorAll(".time-slot");

        const dateString = selectedDate; // formatul datei selectate este deja acceptabil
        const apiUrl = `/api/appointments/day/${dateString}`; // endpoint pt programarile din ziua respectiva

        fetch(apiUrl)
            .then((response) => response.json())
            .then((appointments) => {
                const startHour = 9;
                const endHour = 17;

                for (let hour = startHour; hour <= endHour; hour++) {
                    const time = `${String(hour).padStart(2, "0")}:00`;

                    const timeSlotElement = Array.from(timeSlotsElements).find(
                        (slot) => slot.textContent.trim() === time
                    );

                    if (timeSlotElement) {
                        const isBooked = appointments.includes(String(hour));

                        if (isBooked) {
                            timeSlotElement.classList.add("unavailable");
                        } else {
                            timeSlotElement.classList.remove("unavailable");
                        }

                        if (!isBooked) {
                            timeSlotElement.onclick = function () {
                                const slots = document.querySelectorAll(".time-slot");

                                slots.forEach((slot) => {
                                    slot.classList.remove("selected");
                                });

                                // add selected class to clicked time slot
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