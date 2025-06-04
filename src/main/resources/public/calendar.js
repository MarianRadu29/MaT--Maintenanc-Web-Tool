document.addEventListener("DOMContentLoaded", function () {
  // Get current year for footer
  document.getElementById("currentYear").innerText = new Date().getFullYear();

  // Initialize UI elements
  const userAccount = document.getElementById("user-account");
  const adminLink = document.getElementById("admin-link");
  const authLinks = document.querySelector(".auth-links");

  if (userAccount) userAccount.style.display = "none";
  if (adminLink) adminLink.style.display = "none";

  // Adaugă butoanele de autentificare inițiale
  if (authLinks) {
    authLinks.innerHTML = `
      <a class="btn btn-primary" href="login.html">Conectare</a>
      <a class="btn btn-secondary" href="register.html">Înregistrare</a>
    `;
  }

  const calendarDays = document.getElementById("calendarDays");
  const currentMonthYearElement = document.getElementById("currentMonthYear");
  const prevMonthButton = document.getElementById("prevMonth");
  const nextMonthButton = document.getElementById("nextMonth");
  const selectedDateElement = document.getElementById("selectedDate");
  const appointmentsList = document.getElementById("appointmentsList");
  const noAppointments = document.getElementById("noAppointments");

  let currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();

  const monthNames = [
    "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
    "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"
  ];

  generateCalendar(currentMonth, currentYear);

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

  function generateCalendar(month, year) {
    calendarDays.innerHTML = "";
    currentMonthYearElement.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1);
    let firstDayOfWeek = firstDay.getDay() - 1;
    if (firstDayOfWeek < 0) firstDayOfWeek = 6;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Previous month days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const dayElement = createDayElement(day, true, year, month);
      calendarDays.appendChild(dayElement);
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const isToday =
          day === currentDate.getDate() &&
          month === currentDate.getMonth() &&
          year === currentDate.getFullYear();

      const isPastDay = dateObj < currentDate && !isToday;
      const isSunday = dateObj.getDay() === 0;

      const dayElement = createDayElement(
          day,
          false,
          year,
          month,
          isToday,
          isPastDay || isSunday
      );

      if (!isPastDay && !isSunday) {
        dayElement.addEventListener("click", function () {
          document.querySelectorAll(".calendar-day").forEach((el) =>
              el.classList.remove("selected")
          );
          this.classList.add("selected");

          selectedDateElement.textContent = dateObj.toLocaleDateString("ro-RO", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          fetchAppointmentsForDay(year, month, day);
        });
      }

      calendarDays.appendChild(dayElement);
    }

    // Next month days
    const totalCells = 42;
    const remainingCells = totalCells - (firstDayOfWeek + daysInMonth);
    for (let day = 1; day <= remainingCells; day++) {
      const dayElement = createDayElement(day, true, year, month);
      calendarDays.appendChild(dayElement);
    }
  }

  function createDayElement(
      day,
      isOutsideMonth,
      year,
      month,
      isToday = false,
      isDisabled = false
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

    if (isDisabled) {
      dayElement.classList.add("disabled");
      dayElement.style.pointerEvents = "none";
    }

    return dayElement;
  }

  function fetchAppointmentsForDay(year, month, day) {
    const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
    ).padStart(2, "0")}`;
    const apiUrl = `/api/appointments/day/${dateString}`;

    fetch(apiUrl)
        .then((response) => response.json())
        .then((data) => {

          showAppointmentsForDay(dateString, data.map(time=>time.padStart(2,'0')));
        })
        .catch((error) => {
          console.error("Error fetching appointments:", error);
          noAppointments.style.display = "block";
          appointmentsList.style.display = "none";
          noAppointments.textContent =
              "Eroare la încărcarea programărilor pentru această zi.";
        });
  }

  function showAppointmentsForDay(dateString, appointments) {
    appointmentsList.innerHTML = "";

    const dateObj = new Date(dateString);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
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

    noAppointments.style.display = "none";
    appointmentsList.style.display = "block";

    timeSlots.forEach((time) => {
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
      status.className = `appointment-status ${isBooked ? "booked" : "available"}`;
      status.textContent = isBooked ? "Ocupat" : "Disponibil";

      appointmentCard.appendChild(appointmentInfo);
      appointmentCard.appendChild(status);

      if (!isBooked) {
        const bookButton = document.createElement("a");
        const appointmentDate = `${year}-${String(month + 1).padStart(
            2,
            "0"
        )}-${String(day).padStart(2, "0")}`;

        // Check if user is logged in
        const userData = JSON.parse(
            localStorage.getItem("userData") ||
            sessionStorage.getItem("userData") ||
            "null"
        );

        bookButton.href = userData ? "programari.html" : "login.html";
        bookButton.className = "btn btn-primary btn-sm";
        bookButton.textContent = "Rezervă";
        bookButton.addEventListener("click", function (e) {
          localStorage.setItem("selectedAppointmentDate", appointmentDate);
          localStorage.setItem("selectedAppointmentTime", time);
        });

        appointmentCard.appendChild(bookButton);
      }

      appointmentsList.appendChild(appointmentCard);
    });

  }

  // Mobile menu toggle functionality
  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.querySelector(".main-nav");

  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      mainNav.classList.toggle("open");
    });
  }

  // *** User authentication check and UI update ***
  function checkLoggedInUser() {
    const userData = JSON.parse(
        localStorage.getItem("userData") ||
        sessionStorage.getItem("userData") ||
        null
    );
    if (userData) {
      // Update UI for logged in user
      const authLinks = document.querySelector(".auth-links");
      const adminLink = document.getElementById("admin-link");
      if (authLinks && adminLink) {
        document.getElementById("user-account").style.display = "block";

        authLinks.innerHTML = `
          <a href="#" id="logoutButton" class="btn btn-secondary">Deconectare</a>
        `;
        if (userData.roleID == 2) {
          adminLink.style.display = "block";
        }
        // Add logout functionality
        document
            .getElementById("logoutButton")
            .addEventListener("click", function (e) {
              e.preventDefault();
              localStorage.removeItem("userData");
              localStorage.removeItem("accessToken");
              localStorage.removeItem("refreshToken");

              window.location.reload();
            });
      }
    }
  }

  // Initialize user authentication state on page load
  checkLoggedInUser();
});