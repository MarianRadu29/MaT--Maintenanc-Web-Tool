function checkLoggedInUser() {
    const userData = JSON.parse(
        localStorage.getItem("userData") ||
        sessionStorage.getItem("userData") ||
        null
    );
    if (userData) {
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
            // logout functionality
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

checkLoggedInUser();