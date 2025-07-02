document.addEventListener("DOMContentLoaded", async function () {
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
                async function logout() {
                    try {
                        const res = await fetch('/api/logout', {
                            method: 'DELETE',
                            credentials: 'include'
                        });
                        if (res.status === 204) {
                            window.location.href = '/';
                        } else {
                            console.error('Logout failed', res.status);
                        }
                    } catch (err) {
                        console.error('Eroare la logout', err);
                    }
                }
                logout().then(_=>{
                    document.getElementById("userData-account").style.display = "none";
                    document.getElementById("admin-link").style.display = "none";
                    renderAuthButtons();
                    window.location.href = '/';
                });
            });
        }
    }

    checkLogin().then(user => {
        if (user) {
            document.getElementById("userData-account").style.display = "block";

            if (user["roleID"] !==1) {
                document.getElementById("admin-link").style.display = "block";
            }
            renderLogoutButton();
        } else {
            renderAuthButtons();
        }
    })
});

async function checkLogin() {
    try {
        const res = await fetch('/api/user', {
            method: 'GET',
            credentials: 'include'
        });
        if (res.ok) {
            return await res.json();
        } else {
            return null;
        }
    } catch (err) {
        console.error('Eroare la verificare autentificare:', err);
        return null;
    }
}

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.querySelector(".main-nav");
if (menuToggle) {
    menuToggle.addEventListener("click", () => {
        mainNav.classList.toggle("open");
    });
}


