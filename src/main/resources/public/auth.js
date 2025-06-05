document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('currentYear').innerText = new Date().getFullYear();

    // handle login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe')?.checked || false;

            if (!email || !validateEmail(email)) {
                showError('Vă rugăm să introduceți un email valid.');
                return;
            }

            if (!password || password.length < 6) {
                showError('Parola trebuie să aibă cel puțin 6 caractere.');
                return;
            }


            const form = new FormData(this);
            const params = new URLSearchParams(form);
            params.forEach((value, key) => {
                console.log(key, "=", value);
            });


            const response = await fetch("/api/login", {
                method: "POST",
                body: params,
            });


            if (response.status === 200) {

                const data = await response.json();
                const accessToken = data.accessToken;
                localStorage.setItem("accessToken", accessToken);
                const responseUser = await fetch("/api/user", {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${accessToken}`
                    }
                });
                if (responseUser.status === 200) {
                    const user = await responseUser.json();
                    if (user) {

                        localStorage.setItem("userData", JSON.stringify(user));
                    }
                }
                window.location.href = "/";
            } else if (response.status === 400) {
                showError(result.message);
            }
            else if(response.status === 404) {
                showError("Email-ul sau parola sunt gresite");
            }
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Get form data
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const phone = document.getElementById('phone').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const termsAgree = document.getElementById('termsAgree').checked;

            if (!firstName || !lastName) {
                showError('Vă rugăm să completați numele și prenumele.');
                return;
            }

            if (!phone || !validatePhone(phone)) {
                showError('Vă rugăm să introduceți un număr de telefon valid.');
                return;
            }

            if (!email || !validateEmail(email)) {
                showError('Vă rugăm să introduceți un email valid.');
                return;
            }

            if (!password || password.length < 8) {
                showError('Parola trebuie să aibă cel puțin 6 caractere.');
                return;
            }

            if (password !== confirmPassword) {
                showError('Parolele nu coincid.');
                return;
            }

            if (!termsAgree) {
                showError('Trebuie să acceptați termenii și condițiile.');
                return;
            }

            const form = new FormData(this);
            const params = new URLSearchParams(form);
            const response = await fetch("/api/register", {
                method: "POST",
                body: params,
            });


            
            if (response.status === 200) {
                const data = await response.json();
                const accessToken = data.accessToken;
                localStorage.setItem("accessToken", accessToken);
                
                const responseUser = await fetch("/api/user", {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${accessToken}`
                    }
                });
                if (responseUser.status === 200) {
                    const user = await responseUser.json();
                    if (user) {
                        localStorage.setItem("userData", JSON.stringify(user));
                    }
                }
                window.location.href = "/";
            } else if (response.status === 400) {
                showError(result.message);
            }
           
        });
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function validatePhone(phone) {
        const re = /^(07[0-9]{8})$/;
        return re.test(phone.replace(/\s+/g, ''));
    }

    function showError(message) {
        // Check if error element already exists
        let errorElement = document.querySelector('.auth-error');

        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'auth-error';

            const formTitle = document.querySelector('.section-title');
            formTitle.insertAdjacentElement('afterend', errorElement);
        }

        errorElement.textContent = message;

        setTimeout(() => {
            errorElement.remove();
        }, 5000);
    }

    function showSuccess(message) {
        const successElement = document.createElement('div');
        successElement.className = 'auth-success';
        successElement.textContent = message;

        const formTitle = document.querySelector('.section-title');
        formTitle.insertAdjacentElement('afterend', successElement);

        setTimeout(() => {
            successElement.remove();
        }, 5000);
    }

    function checkLoggedInUser() {
        const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || '{}');

        if (userData.isLoggedIn) {
            if (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html')) {
                window.location.href = '/';
            }
        }
    }

    // CSS for auth error/success messages
    const style = document.createElement('style');
    style.textContent = `
    .auth-error {
      background-color: #FEE2E2;
      color: #B91C1C;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1rem;
      border-left: 4px solid #B91C1C;
    }
    
    .auth-success {
      background-color: #D1FAE5;
      color: #047857;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1rem;
      border-left: 4px solid #047857;
    }
  `;
    document.head.appendChild(style);

    // call on page load
    checkLoggedInUser();
});

const menuToggle = document.getElementById('menuToggle');
const mainNav = document.querySelector('.main-nav');

menuToggle.addEventListener('click', () => {
    mainNav.classList.toggle('open');
});