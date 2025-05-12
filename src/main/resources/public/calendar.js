document.addEventListener('DOMContentLoaded', function () {
    // Get current year for footer
    document.getElementById('currentYear').innerText = new Date().getFullYear();

    // Calendar functionality
    const calendarDays = document.getElementById('calendarDays');
    const currentMonthYearElement = document.getElementById('currentMonthYear');
    const prevMonthButton = document.getElementById('prevMonth');
    const nextMonthButton = document.getElementById('nextMonth');
    const selectedDateElement = document.getElementById('selectedDate');
    const appointmentsList = document.getElementById('appointmentsList');
    const noAppointments = document.getElementById('noAppointments');

    // Current date tracking
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();

    // Month names in Romanian
    const monthNames = [
        'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
        'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
    ];

    // Generate calendar for current month
    generateCalendar(currentMonth, currentYear);

    // Event listeners for month navigation
    prevMonthButton.addEventListener('click', function () {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        generateCalendar(currentMonth, currentYear);
    });

    nextMonthButton.addEventListener('click', function () {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        generateCalendar(currentMonth, currentYear);
    });

    // Generate calendar
    function generateCalendar(month, year) {
        // Clear previous calendar
        calendarDays.innerHTML = '';

        // Update month and year display
        currentMonthYearElement.textContent = `${monthNames[month]} ${year}`;

        // Get first day of the month
        const firstDay = new Date(year, month, 1);

        // Get day of the week for the first day (0: Sunday, 1: Monday, ..., 6: Saturday)
        // Adjust for Monday as first day of the week
        let firstDayOfWeek = firstDay.getDay() - 1;
        if (firstDayOfWeek < 0) firstDayOfWeek = 6; // Sunday becomes last day

        // Get number of days in the month
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Get number of days in previous month
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        // Create calendar days

        // Previous month days
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            const dayElement = createDayElement(day, true);
            calendarDays.appendChild(dayElement);
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            // Check if it's today
            const isToday = (
                day === currentDate.getDate() &&
                month === currentDate.getMonth() &&
                year === currentDate.getFullYear()
            );

            // Check if the day has appointments (mock data)
            const hasAppointments = Math.random() > 0.7;

            // Create day element
            const dayElement = createDayElement(day, false, isToday, hasAppointments);

            // Add click event to show appointments
            dayElement.addEventListener('click', function () {
                // Remove selected class from all days
                document.querySelectorAll('.calendar-day').forEach(el => {
                    el.classList.remove('selected');
                });

                // Add selected class to clicked day
                this.classList.add('selected');

                // Update selected date display
                const dateObj = new Date(year, month, day);
                const options = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'};
                selectedDateElement.textContent = dateObj.toLocaleDateString('ro-RO', options);

                // Show appointments for the selected day
                showAppointmentsForDay(dateObj, hasAppointments);
            });

            calendarDays.appendChild(dayElement);
        }

        // Next month days to fill the grid
        const totalCells = 42; // 6 rows x 7 days
        const remainingCells = totalCells - (firstDayOfWeek + daysInMonth);

        for (let day = 1; day <= remainingCells; day++) {
            const dayElement = createDayElement(day, true);
            calendarDays.appendChild(dayElement);
        }
    }

    // Create a day element for the calendar
    function createDayElement(day, isOutsideMonth, isToday = false, hasAppointments = false) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;

        if (isOutsideMonth) {
            dayElement.classList.add('outside-month');
        }

        if (isToday) {
            dayElement.classList.add('today');
        }

        if (hasAppointments && !isOutsideMonth) {
            dayElement.classList.add('has-appointments');
        }

        // Check if it's Sunday (unavailable)
        if (new Date(currentYear, currentMonth, day).getDay() === 0 && !isOutsideMonth) {
            dayElement.classList.add('unavailable');
        }

        return dayElement;
    }

    // Show appointments for a specific day
    function showAppointmentsForDay(date, hasAppointments) {
        appointmentsList.innerHTML = '';

        if (!hasAppointments) {
            noAppointments.style.display = 'block';
            appointmentsList.style.display = 'none';
            noAppointments.textContent = 'Nu există programări pentru această zi.';
            return;
        }

        noAppointments.style.display = 'none';
        appointmentsList.style.display = 'block';

        // Generate mock appointments
        const timeSlots = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00'];

        timeSlots.forEach(time => {
            const isAvailable = Math.random() > 0.5;

            const appointmentCard = document.createElement('div');
            appointmentCard.className = `appointment-card ${isAvailable ? 'available' : 'booked'}`;

            const appointmentInfo = document.createElement('div');
            appointmentInfo.className = 'appointment-info';

            const title = document.createElement('h4');
            title.textContent = `Programare la ora ${time}`;

            const details = document.createElement('p');
            if (isAvailable) {
                details.textContent = 'Acest interval orar este disponibil pentru programări.';
            } else {
                details.textContent = 'Acest interval orar este deja ocupat.';
            }

            appointmentInfo.appendChild(title);
            appointmentInfo.appendChild(details);

            const status = document.createElement('div');
            status.className = `appointment-status ${isAvailable ? 'available' : 'booked'}`;
            status.textContent = isAvailable ? 'Disponibil' : 'Ocupat';

            appointmentCard.appendChild(appointmentInfo);
            appointmentCard.appendChild(status);

            if (isAvailable) {
                const bookButton = document.createElement('a');
                bookButton.href = 'programari.html';
                bookButton.className = 'btn btn-primary btn-sm';
                bookButton.textContent = 'Rezervă';
                appointmentCard.appendChild(bookButton);
            }

            appointmentsList.appendChild(appointmentCard);
        });
    }

    // Check if user is already logged in
    function checkLoggedInUser() {
        const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || '{}');

        if (userData.isLoggedIn) {
            // Update UI for logged in user
            const authLinks = document.querySelector('.auth-links');
            if (authLinks) {
                authLinks.innerHTML = `
          <span class="welcome-user">Bine ai venit, ${userData.firstName || userData.email}</span>
          <a href="#" id="logoutButton" class="btn btn-secondary">Deconectare</a>
        `;

                // Add logout functionality
                document.getElementById('logoutButton').addEventListener('click', function (e) {
                    e.preventDefault();
                    localStorage.removeItem('userData');
                    sessionStorage.removeItem('userData');
                    window.location.reload();
                });
            }
        }
    }

    // Call this on page load
    checkLoggedInUser();
});