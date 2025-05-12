document.addEventListener('DOMContentLoaded', function () {
    // Get current year for footer
    document.getElementById('currentYear').innerText = new Date().getFullYear();

    // Handle login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Get form data
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe')?.checked || false;

            // Simple client-side validation
            if (!email || !validateEmail(email)) {
                showError('Vă rugăm să introduceți un email valid.');
                return;
            }

            if (!password || password.length < 6) {
                showError('Parola trebuie să aibă cel puțin 6 caractere.');
                return;
            }

            // Simulate login request
            // simulateLoginRequest(email, password, rememberMe);

            const form = new FormData(this);
            const params = new URLSearchParams(form);
            params.forEach((value, key) => {
                console.log(key, "=", value);
            });


            const response = await fetch("/api/login", {
                method: "POST",
                body: params,
            });


            const data = await response.json();
            const accessToken = data.accessToken;
            const refreshToken = data.refreshToken;
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);

            if (response.status === 200) {
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

    // Handle register form submission
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

            // Simple client-side validation
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

            // // Simulate register request
            // registerRequest(firstName, lastName, phone, email, password);

            const form = new FormData(this);
            const params = new URLSearchParams(form);
            const response = await fetch("/api/register", {
                method: "POST",
                body: params,
            });


            const data = await response.json();
            const accessToken = data.accessToken;
            const refreshToken = data.refreshToken;
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);

            if (response.status === 200) {
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

    // Helper function to validate email
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Helper function to validate phone number
    function validatePhone(phone) {
        const re = /^(07[0-9]{8})$/;
        return re.test(phone.replace(/\s+/g, ''));
    }

    // Function to show error message
    function showError(message) {
        // Check if error element already exists
        let errorElement = document.querySelector('.auth-error');

        if (!errorElement) {
            // Create error element if it doesn't exist
            errorElement = document.createElement('div');
            errorElement.className = 'auth-error';

            // Insert after form title
            const formTitle = document.querySelector('.section-title');
            formTitle.insertAdjacentElement('afterend', errorElement);
        }

        // Set error message
        errorElement.textContent = message;

        // Auto-remove error after 5 seconds
        setTimeout(() => {
            errorElement.remove();
        }, 5000);
    }

    // Function to show success message
    function showSuccess(message) {
        // Create success element
        const successElement = document.createElement('div');
        successElement.className = 'auth-success';
        successElement.textContent = message;

        // Insert after form title
        const formTitle = document.querySelector('.section-title');
        formTitle.insertAdjacentElement('afterend', successElement);

        // Auto-remove success after 5 seconds
        setTimeout(() => {
            successElement.remove();
        }, 5000);
    }

    // Simulate login request
    function simulateLoginRequest(email, password, rememberMe) {
        // In a real app, this would be an API call
        const submitButton = document.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Se procesează...';

        setTimeout(() => {
            // Mock successful login
            const userData = {
                email: email,
                firstName: 'Utilizator', // In a real app, this would come from the backend
                isLoggedIn: true
            };

            // Store user data
            if (rememberMe) {
                localStorage.setItem('userData', JSON.stringify(userData));
            } else {
                sessionStorage.setItem('userData', JSON.stringify(userData));
            }

            // Show success message
            showSuccess('Autentificare reușită! Veți fi redirecționat...');

            // Redirect after short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }, 1500);
    }

    // Simulate register request
    // function registerRequest(firstName, lastName, phone, email, password) {
    //     // In a real app, this would be an API call
    //     const submitButton = document.querySelector('button[type="submit"]');
    //     submitButton.disabled = true;
    //     submitButton.textContent = 'Se procesează...';
    //
    //     setTimeout(() => {
    //         // Mock successful registration
    //         const userData = {
    //             email: email,
    //             firstName: firstName,
    //             lastName: lastName,
    //             phone: phone,
    //             isLoggedIn: true
    //         };
    //
    //         // Store user data (in session by default for new registrations)
    //         sessionStorage.setItem('userData', JSON.stringify(userData));
    //
    //         // Show success message
    //         showSuccess('Înregistrare reușită! Veți fi redirecționat...');
    //
    //         // Redirect after short delay
    //         setTimeout(() => {
    //             window.location.href = 'index.html';
    //         }, 1000);
    //     }, 1500);
    // }

    // Check if user is already logged in
    function checkLoggedInUser() {
        const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || '{}');

        if (userData.isLoggedIn) {
            // If on login or register page, redirect to home
            if (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html')) {
                window.location.href = 'index.html';
            }
        }
    }

    // Add CSS for auth error/success messages
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

    // Call this on page load
    checkLoggedInUser();
});