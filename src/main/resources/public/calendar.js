document.addEventListener("DOMContentLoaded", function () {
  // Get current year for footer
  document.getElementById("currentYear").innerText = new Date().getFullYear();

  // Calendar functionality
  const calendarDays = document.getElementById("calendarDays");
  const currentMonthYearElement = document.getElementById("currentMonthYear");
  const prevMonthButton = document.getElementById("prevMonth");
  const nextMonthButton = document.getElementById("nextMonth");
  const selectedDateElement = document.getElementById("selectedDate");
  const appointmentsList = document.getElementById("appointmentsList");
  const noAppointments = document.getElementById("noAppointments");

  // Current date tracking
  let currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();

  const monthNames = [
    "Ianuarie",
    "Februarie",
    "Martie",
    "Aprilie",
    "Mai",
    "Iunie",
    "Iulie",
    "August",
    "Septembrie",
    "Octombrie",
    "Noiembrie",
    "Decembrie",
  ];

  // Generate calendar for current month
  generateCalendar(currentMonth, currentYear);

  // Event listeners for month navigation
  prevMonthButton.addEventListener("click", function () {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    generateCalendar(currentMonth, currentYear);
  });

  nextMonthButton.addEventListener("click", function () {
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
    calendarDays.innerHTML = "";

    // Update month and year display
    currentMonthYearElement.textContent = `${monthNames[month]} ${year}`;

    // Get first day of the month
    const firstDay = new Date(year, month, 1);

    // Get day of the week for the first day (0: Sunday, 1: Monday, ..., 6: Saturday)
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
      const dayElement = createDayElement(day, true, year, month);
      calendarDays.appendChild(dayElement);
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday =
        day === currentDate.getDate() &&
        month === currentDate.getMonth() &&
        year === currentDate.getFullYear();

      const isPastDay = new Date(year, month, day) < currentDate && !isToday;

      // Create day element
      const dayElement = createDayElement(
        day,
        false,
        year,
        month,
        isToday,
        isPastDay
      );

      // Add click event to show appointments
      dayElement.addEventListener("click", function () {
        if (isPastDay) return; // Don't allow selection of past days

        // Remove selected class from all days
        document.querySelectorAll(".calendar-day").forEach((el) => {
          el.classList.remove("selected");
        });

        this.classList.add("selected");

        const dateObj = new Date(year, month, day);
        const options = {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        };
        selectedDateElement.textContent = dateObj.toLocaleDateString(
          "ro-RO",
          options
        );

        // Fetch appointments for the selected day from the server
        fetchAppointmentsForDay(year, month, day);
      });

      calendarDays.appendChild(dayElement);
    }

    // Next month days to fill the grid
    const totalCells = 42; // 6 rows x 7 days
    const remainingCells = totalCells - (firstDayOfWeek + daysInMonth);

    for (let day = 1; day <= remainingCells; day++) {
      const dayElement = createDayElement(day, true, year, month);
      calendarDays.appendChild(dayElement);
    }
  }

  // Create a day element for the calendar
  function createDayElement(
    day,
    isOutsideMonth,
    year,
    month,
    isToday = false,
    isPastDay = false
  ) {
    const dayElement = document.createElement("div");
    dayElement.className = "calendar-day";
    dayElement.textContent = day;

    if (isOutsideMonth) {
      dayElement.classList.add("outside-month");
    }

    if (isToday) {
      dayElement.classList.add("today");
    }

    if (isPastDay) {
      dayElement.classList.add("past-day"); // Add a class to mark past days
      dayElement.style.pointerEvents = "none"; // Disable click for past days
    }

    return dayElement;
  }

  // Fetch appointments for a specific day
  function fetchAppointmentsForDay(year, month, day) {
    const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    console.log(dateString);
    const apiUrl = `/api/appointments/day/${dateString}`;

    fetch(apiUrl)
      .then((response) => response.json())
      .then((data) => {
        // Process the response and display appointments
        console.log(JSON.stringify(data, null, 4));
        showAppointmentsForDay(dateString, data);
      })
      .catch((error) => {
        console.error("Error fetching appointments:", error);
      });
  }

  // Show appointments for a specific day
  function showAppointmentsForDay(dateString, appointments) {
    appointmentsList.innerHTML = "";

    const dateObj = new Date(dateString);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth(); // Luna este 0-indexed (0 pentru ianuarie, 1 pentru februarie, etc.)
    const day = dateObj.getDate();

    const timeSlots = [
      "09:00",
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
    ];

    //daca nu sunt programari afisez toate intervalele orare ca disponibile
    if (appointments.length === 0) {
      noAppointments.style.display = "block";
      appointmentsList.style.display = "none";
      noAppointments.textContent =
        "Toate intervalele orare sunt disponibile pentru această zi.";
    } else {
      noAppointments.style.display = "none";
      appointmentsList.style.display = "block";

      timeSlots.forEach((time) => {
        //verific daca existao programare la acea ora
        const isBooked = appointments.includes(time.substring(0, 2));

        const appointmentCard = document.createElement("div");
        appointmentCard.className = `appointment-card ${
          isBooked ? "booked" : "available"
        }`;

        const appointmentInfo = document.createElement("div");
        appointmentInfo.className = "appointment-info";

        const title = document.createElement("h4");
        title.textContent = `Programare la ora ${time}`;

        const details = document.createElement("p");
        details.textContent = isBooked
          ? "Acest interval orar este deja ocupat."
          : "Acest interval orar este disponibil pentru programări.";

        appointmentInfo.appendChild(title);
        appointmentInfo.appendChild(details);

        const status = document.createElement("div");
        status.className = `appointment-status ${
          isBooked ? "booked" : "available"
        }`;
        status.textContent = isBooked ? "Ocupat" : "Disponibil";

        appointmentCard.appendChild(appointmentInfo);
        appointmentCard.appendChild(status);

        // daca intervalul este disponibil, adaug butonul de rezervare
        if (!isBooked) {
          const bookButton = document.createElement("a");

          const appointmentTime = time;
          const appointmentDate = `${year}-${String(month + 1).padStart(
            2,
            "0"
          )}-${String(day).padStart(2, "0")}`; // Data selectată

          // salvez data si ora in localStorage

          const user = localStorage.getItem("userData");
          bookButton.href = user ? "programari.html" : "login.html";
          bookButton.className = "btn btn-primary btn-sm";
          bookButton.textContent = "Rezervă";
          bookButton.addEventListener("click", function (e) {
            alert(appointmentDate + " " + appointmentTime);

            localStorage.setItem("selectedAppointmentDate", appointmentDate);
            localStorage.setItem("selectedAppointmentTime", appointmentTime);
          });

          appointmentCard.appendChild(bookButton);
        }

        appointmentsList.appendChild(appointmentCard);
      });
    }
  }

  // Check if user is already logged in
  function checkLoggedInUser() {
    const userData = JSON.parse(
      localStorage.getItem("userData") ||
        sessionStorage.getItem("userData") ||
        "{}"
    );

    if (userData.isLoggedIn) {
      // Update UI for logged in user
      const authLinks = document.querySelector(".auth-links");
      if (authLinks) {
        authLinks.innerHTML = `
          <span class="welcome-user">Bine ai venit, ${
            userData.firstName || userData.email
          }</span>
          <a href="#" id="logoutButton" class="btn btn-secondary">Deconectare</a>
        `;
        // Add logout functionality
        document
          .getElementById("logoutButton")
          .addEventListener("click", function (e) {
            e.preventDefault();
            localStorage.removeItem("userData");
            sessionStorage.removeItem("userData");
            window.location.reload();
          });
      }
    }
  }

  // Call this on page load
  checkLoggedInUser();
});
