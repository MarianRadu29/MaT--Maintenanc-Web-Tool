document.addEventListener("DOMContentLoaded", function () {
    // get current year for footer
    document.getElementById("currentYear").innerText = new Date().getFullYear().toString();

    document.getElementById("userData-account").style.display = "none";
    document.getElementById("admin-link").style.display = "none";

    function renderAuthButtons() {
        const authLinks = document.querySelector(".auth-links");
        if (authLinks) {
            authLinks.innerHTML = `
                <a class="btn btn-primary" href="login.html">Conectare</a>
                <a class="btn btn-secondary" href="register.html">Înregistrare</a>
            `;
        }
    }

    function renderLogoutButton() {
        const authLinks = document.querySelector(".auth-links");
        if (authLinks) {
            authLinks.innerHTML = `
                <a href="#" id="logoutButton" class="btn btn-secondary">Deconectare</a>
            `;

            document.getElementById("logoutButton").addEventListener("click", function (e) {
                e.preventDefault();
                localStorage.removeItem("userData");
                localStorage.removeItem("accessToken");
                sessionStorage.removeItem("userData");

                document.getElementById("userData-account").style.display = "none";
                document.getElementById("admin-link").style.display = "none";
                renderAuthButtons();
                window.location.href = '/';
            });
        }
    }


    //AR TREBUI SA FAC CU COOKIE UN REQUEST LA UN ENDPOINT /api/me
    function checkLoggedInUser() {
        const userData = JSON.parse(
            localStorage.getItem("userData") ||
            sessionStorage.getItem("userData") ||
            null
        );

        if (userData) {
            document.getElementById("userData-account").style.display = "block";

            if (userData["roleID"] === 2) {
                document.getElementById("admin-link").style.display = "block";
            }

            renderLogoutButton();
        } else {
            renderAuthButtons();
        }
    }

    checkLoggedInUser();
});

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.querySelector(".main-nav");

if (menuToggle) {
    menuToggle.addEventListener("click", () => {
        mainNav.classList.toggle("open");
    });
}


