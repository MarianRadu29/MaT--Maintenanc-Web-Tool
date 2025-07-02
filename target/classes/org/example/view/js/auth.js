document.addEventListener('DOMContentLoaded',  function()  {
    document.getElementById('currentYear').innerText = new Date().getFullYear().toString();

    // handle login/register form submission
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = DOMPurify.sanitize(document.getElementById('email').value);
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe')?.checked || false;

            if (!email || !validateEmail(email)) {
                showError('Vă rugăm să introduceți un email valid.');
                return;
            }

            if (!password || password.length < 8) {
                showError('Parola trebuie să aibă cel puțin 8 caractere.');
                return;
            }

            const body = {
                email:email,
                password:password,
                rememberMe:rememberMe,
            };

            const response = await fetch("/api/login", {
                method: "POST",
                headers:{
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body,null,4),
            });


            if (response.status === 200) {
                window.location.href = "/";
            } else if (response.status === 400) {
                showError(response.message);
            }
            else if(response.status === 404) {
                showError("Email-ul sau parola sunt gresite");
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async function (e){
            e.preventDefault();

            // Get form data
            const firstName = DOMPurify.sanitize(document.getElementById('firstName').value);
            const lastName = DOMPurify.sanitize(document.getElementById('lastName').value);
            const phone = DOMPurify.sanitize(document.getElementById('phone').value);
            const email = DOMPurify.sanitize(document.getElementById('email').value);
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const termsAgree = document.getElementById('termsAgree').checked;

            if (!firstName || !lastName) {
                showError('Vă rugăm să completați numele și prenumele.');
                return;
            }

            const isValidPhoneNr =
                typeof phone === 'string' &&
                /^(07[0-9]{8})$/.test(phone.replace(/\s+/g, ''));
            if (!isValidPhoneNr) {
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

            const body = {};
            const formData = new FormData(this);
            formData.forEach((value, key) => {
                body[key] = value.toString().trim();
            });

            const response = await fetch("/api/register", {
                method: "POST",
                headers:{
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body,null,4),
            });
            
            if (response.status === 200) {
                window.location.href = "/";
            } else if (response.status === 400) {
                showError(response.message);
            }
           
        });
    }

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function showError(message) {
        // Check if error element already exists,will replace the current content
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


    // const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData'));

    //o sa fiu sigur pe pagina de login/register
    //NUSH CE AM VRUT SA FAC AICI!!!!!!!!!!    =)))))))))))
    // if (userData["isLoggedIn"]) {
    //             window.location.href = '/';
    // }
});