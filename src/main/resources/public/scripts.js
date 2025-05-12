document.addEventListener('DOMContentLoaded', function () {
    // Get current year for footer
    document.getElementById('currentYear').innerText = new Date().getFullYear();
    document.getElementById('user-account').style.display = "none";
    document.getElementById('admin-link').style.display = "none";


    // Service type buttons 
    const serviceTypes = document.querySelectorAll('.service-type');
    let selectedVehicleType = 'motorcycle'; // Default selected type

    serviceTypes.forEach(button => {
        button.addEventListener('click', function () {
            // Remove active class from all buttons
            serviceTypes.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            // Update selected vehicle type
            selectedVehicleType = this.getAttribute('data-type');
        });
    });

    // Scroll to appointment form when schedule button is clicked
    const scheduleButton = document.getElementById('scheduleButton');
    const heroSection = document.getElementById('hero');

    if (scheduleButton && heroSection) {
        scheduleButton.addEventListener('click', function () {
            const appointmentForm = document.getElementById('appointment-form');
            if (appointmentForm) {
                appointmentForm.scrollIntoView({behavior: 'smooth'});
                // Hide hero after scrolling
                setTimeout(() => {
                    heroSection.style.display = 'none';
                }, 500);
            }
        });
    }

    // File upload handling
    const fileUpload = document.getElementById('fileUpload');
    const filesList = document.getElementById('filesList');
    const fileUploadArea = document.querySelector('.file-upload-area');

    if (fileUpload && filesList && fileUploadArea) {
        fileUploadArea.addEventListener('click', function () {
            fileUpload.click();
        });

        fileUploadArea.addEventListener('dragover', function (e) {
            e.preventDefault();
            this.style.borderColor = `var(--primary-color)`;
            this.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
        });

        fileUploadArea.addEventListener('dragleave', function (e) {
            e.preventDefault();
            this.style.borderColor = '';
            this.style.backgroundColor = '';
        });

        fileUploadArea.addEventListener('drop', function (e) {
            e.preventDefault();
            this.style.borderColor = '';
            this.style.backgroundColor = '';

            if (e.dataTransfer.files.length) {
                fileUpload.files = e.dataTransfer.files;
                handleFiles(e.dataTransfer.files);
            }
        });

        fileUpload.addEventListener('change', function () {
            handleFiles(this.files);
        });

        function handleFiles(files) {
            filesList.innerHTML = '';

            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // Check if file is an image or video
                if (!file.type.match('image/*') && !file.type.match('video/*')) {
                    alert('Doar imagini și videoclipuri sunt acceptate.');
                    continue;
                }

                // Check file size (max 10MB)
                if (file.size > 10 * 1024 * 1024) {
                    alert('Fișierul este prea mare. Dimensiunea maximă este de 10MB.');
                    continue;
                }

                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';

                const fileName = document.createElement('div');
                fileName.className = 'file-name';
                fileName.textContent = file.name;

                const removeButton = document.createElement('button');
                removeButton.className = 'btn btn-secondary';
                removeButton.textContent = 'Șterge';
                removeButton.onclick = function () {
                    fileItem.remove();
                };

                fileItem.appendChild(fileName);
                fileItem.appendChild(removeButton);
                filesList.appendChild(fileItem);
            }
        }
    }

    // Time slots generation
    const timeSlots = document.getElementById('timeSlots');
    const appointmentDate = document.getElementById('appointmentDate');

    if (timeSlots && appointmentDate) {
        // Set min date to today
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];
        appointmentDate.min = dateString;

        appointmentDate.addEventListener('change', function () {
            generateTimeSlots(this.value);
        });

        function generateTimeSlots(selectedDate) {
            const timeSlotsContainer = timeSlots.querySelector('.time-slots-container');
            timeSlotsContainer.innerHTML = '';

            // Generate time slots from 9:00 to 17:00
            const startHour = 9;
            const endHour = 17;

            // For demo purposes, randomly mark some slots as unavailable
            const unavailableSlots = [];
            for (let i = 0; i < 3; i++) {
                unavailableSlots.push(Math.floor(Math.random() * (endHour - startHour + 1)) + startHour);
            }

            for (let hour = startHour; hour <= endHour; hour++) {
                const timeSlot = document.createElement('div');
                timeSlot.className = 'time-slot';
                if (unavailableSlots.includes(hour)) {
                    timeSlot.className += ' unavailable';
                } else {
                    timeSlot.onclick = function () {
                        // Remove selected class from all time slots
                        document.querySelectorAll('.time-slot').forEach(slot => {
                            slot.classList.remove('selected');
                        });
                        // Add selected class to clicked time slot
                        this.classList.add('selected');
                    };
                }

                timeSlot.textContent = `${hour}:00`;
                timeSlotsContainer.appendChild(timeSlot);
            }
        }
    }

    // Form submission
    const appointmentForm = document.getElementById('appointmentForm');

    if (appointmentForm) {
        appointmentForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Get form data
            const formData = new FormData(this);

            // Add vehicle type
            formData.append('vehicleType', selectedVehicleType);

            // Get selected time
            const selectedTime = document.querySelector('.time-slot.selected');
            if (!selectedTime) {
                alert('Vă rugăm să selectați o oră pentru programare.');
                return;
            }
            formData.append('appointmentTime', selectedTime.textContent);

            // Simulate form submission
            const submitButton = this.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Se procesează...';

            setTimeout(() => {
                // Show success message
                alert('Programare trimisă cu succes! Veți primi un email de confirmare.');

                // Reset form
                appointmentForm.reset();
                filesList.innerHTML = '';
                document.querySelectorAll('.time-slot').forEach(slot => {
                    slot.classList.remove('selected');
                });
                serviceTypes.forEach(btn => btn.classList.remove('active'));
                serviceTypes[0].classList.add('active'); // Reset to motorcycle
                selectedVehicleType = 'motorcycle';

                // Re-enable submit button
                submitButton.disabled = false;
                submitButton.textContent = 'Trimite programare';
            }, 1500);
        });
    }

    // Check if user is already logged in
    function checkLoggedInUser() {
        const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || null);
        if (userData) {
            // Update UI for logged in user
            const authLinks = document.querySelector('.auth-links');
            const adminLink = document.getElementById('admin-link');
            if (authLinks && adminLink) {
                document.getElementById('user-account').style.display = "block";

                authLinks.innerHTML = `
          <a href="#" id="logoutButton" class="btn btn-secondary">Deconectare</a>
        `;
                if (userData.roleID == 2) {
                    adminLink.style.display = "block";
                }
                // Add logout functionality
                document.getElementById('logoutButton').addEventListener('click', function (e) {
                    e.preventDefault();
                    localStorage.removeItem('userData');
                    sessionStorage.removeItem('userData');
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
});