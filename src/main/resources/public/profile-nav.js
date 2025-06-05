
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("currentYear").innerText = new Date().getFullYear();

    // hide admin and user account links by default
    document.getElementById("user-account").style.display = "none";
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
                localStorage.removeItem("refreshToken");
                sessionStorage.removeItem("userData");

                // Reset UI
                document.getElementById("user-account").style.display = "none";
                document.getElementById("admin-link").style.display = "none";
                renderAuthButtons();
            });
        }
    }

    // check if user is already logged in
    function checkLoggedInUser() {
        const userData = JSON.parse(
            localStorage.getItem("userData") ||
            sessionStorage.getItem("userData") ||
            null
        );

        if (userData) {
            document.getElementById("user-account").style.display = "block";

            if (userData.roleID == 2) {
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

document.addEventListener("DOMContentLoaded", async function () {

    function renderAuthButtons() {
        const authLinks = document.querySelector(".auth-links");
        if (authLinks) {
            authLinks.innerHTML = `
                <a class="btn btn-primary" href="login.html">Conectare</a>
                <a class="btn btn-secondary" href="register.html">Înregistrare</a>
            `;
        }
    }

    //render logout button
    function renderLogoutButton() {
        const authLinks = document.querySelector(".auth-links");
        if (authLinks) {
            authLinks.innerHTML = `
                <a href="#" id="logoutButton" class="btn btn-secondary">Deconectare</a>
            `;

            // logout functionality
            document.getElementById("logoutButton").addEventListener("click", function (e) {
                e.preventDefault();
                localStorage.removeItem("userData");
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                sessionStorage.removeItem("userData");

                // Reset UI
                document.getElementById("user-account").style.display = "none";
                document.getElementById("admin-link").style.display = "none";
                renderAuthButtons();
            });
        }
    }

    // check if user is already logged in
    function checkLoggedInUser() {
        const storedUserData = JSON.parse(
            localStorage.getItem("userData") ||
            sessionStorage.getItem("userData") ||
            null
        );

        if (storedUserData) {
            document.getElementById("user-account").style.display = "block";

            if (storedUserData.roleID == 2) {
                document.getElementById("admin-link").style.display = "block";
            }

            renderLogoutButton();
        } else {
            renderAuthButtons();
        }
    }

    checkLoggedInUser();

    await initializeApp();
});

function initializeTabs() {
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
}

function disableBodyScroll() {
    document.body.style.overflow = 'hidden';
}

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
