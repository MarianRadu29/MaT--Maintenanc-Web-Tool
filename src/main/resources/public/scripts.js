document.addEventListener("DOMContentLoaded", function () {
    // Get current year for footer
    document.getElementById("currentYear").innerText = new Date().getFullYear();

    // Hide admin and user account links by default
    document.getElementById("user-account").style.display = "none";
    document.getElementById("admin-link").style.display = "none";

    // Check if user is already logged in
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

// Mobile menu toggle
const menuToggle = document.getElementById("menuToggle");
const mainNav = document.querySelector(".main-nav");

if (menuToggle) {
    menuToggle.addEventListener("click", () => {
        mainNav.classList.toggle("open");
    });
}