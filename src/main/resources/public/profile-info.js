// Variabilă globală pentru userData
let userData = null;
let appointments = [];

// User data
async function getUserData() {
    try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            throw new Error('No access token found');
        }

        const response = await fetch('/api/user', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP status ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching user data:', error);
        window.location.href = 'login.html';
        return null;
    }
}

async function initializeApp() {
    try {
        // Get user data from API
        userData = await getUserData();

        if (!userData) {
            window.location.href = 'login.html';
            return;
        }

        // Store user data in localStorage for consistency
        localStorage.setItem('userData', JSON.stringify(userData));
        if (sessionStorage.getItem('userData')) {
            sessionStorage.setItem('userData', JSON.stringify(userData));
        }

        // Initialize all components that depend on userData
        initializeTabs();
        populateUserData();
        updateAuthLinks();
        initializeEditFunctionality();
        initializeAppointments();

    } catch (error) {
        console.error('Error initializing app:', error);
        window.location.href = 'login.html';
    }
}

function populateUserData() {
    if (!userData) return;

    document.getElementById('user-fullname-display').textContent = (userData.firstName || '') + ' ' + (userData.lastName || '');
    document.getElementById('user-email-display').textContent = userData.email || '-';
    document.getElementById('user-phone-display').textContent = userData.phoneNumber || '-';
    document.getElementById('user-role-display').textContent = userData.roleID == 2 ? 'Administrator' : 'Client';
}

function initializeEditFunctionality() {
    // Sistem de editare inline
    const editButtons = document.querySelectorAll('.edit-btn');
    const saveButtons = document.querySelectorAll('.save-btn');
    const cancelButtons = document.querySelectorAll('.cancel-btn');

    // Event listeners pentru butoanele de editare
    editButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const field = e.target.closest('.edit-btn').dataset.field;
            startEdit(field);
        });
    });

    // Event listeners pentru butoanele de salvare
    saveButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const field = e.target.closest('.save-btn').dataset.field;
            saveEdit(field);
        });
    });

    // Event listeners pentru butoanele de anulare
    cancelButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const field = e.target.closest('.cancel-btn').dataset.field;
            cancelEdit(field);
        });
    });

    // Suport pentru Enter și Escape în câmpurile de editare
    document.addEventListener('keydown', (e) => {
        if (e.target.closest('.edit-inputs')) {
            const editContainer = e.target.closest('.info-edit');
            const field = editContainer.id.replace('edit-', '');

            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit(field);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit(field);
            }
        }
    });
}

function startEdit(field) {
    const displayRow = document.querySelector(`[data-field="${field}"]`).closest('.info-item-inline').querySelector('.info-row');
    const editRow = document.getElementById(`edit-${field}`);

    // Ascunde rândul de afișare și arată rândul de editare
    displayRow.style.display = 'none';
    editRow.style.display = 'flex';

    // Populează câmpurile de input cu valorile curente
    if (field === 'fullname') {
        document.getElementById('user-firstname').value = userData.firstName || '';
        document.getElementById('user-lastname').value = userData.lastName || '';
        document.getElementById('user-firstname').focus();
    } else if (field === 'email') {
        document.getElementById('user-email-input').value = userData.email || '';
        document.getElementById('user-email-input').focus();
    } else if (field === 'phone') {
        document.getElementById('user-phone-input').value = userData.phoneNumber || '';
        document.getElementById('user-phone-input').focus();
    }
}

async function saveEdit(field) {
    let hasChanges = false;
    let newData = { ...userData };

    try {
        if (field === 'fullname') {
            const firstName = document.getElementById('user-firstname').value.trim();
            const lastName = document.getElementById('user-lastname').value.trim();

            if (firstName !== userData.firstName || lastName !== userData.lastName) {
                newData.firstName = firstName;
                newData.lastName = lastName;
                hasChanges = true;

                const response = await fetch("/api/user/update", {
                    method: "PATCH",
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        firstName: newData.firstName,
                        lastName: newData.lastName
                    })
                });

                if (!response.ok) {
                    throw new Error('Eroare la actualizarea datelor');
                }
            }
        } else if (field === 'email') {
            const email = document.getElementById('user-email-input').value.trim();

            if (email && !isValidEmail(email)) {
                showCustomAlert('Vă rugăm să introduceți o adresă de email validă.', 3000);
                return;
            }

            if (email !== userData.email) {
                newData.email = email;
                hasChanges = true;

                const response = await fetch("/api/user/update", {
                    method: "PATCH",
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: newData.email,
                    })
                });

                if (!response.ok) {
                    throw new Error('Eroare la actualizarea email-ului');
                }
            }
        } else if (field === 'phone') {
            const phone = document.getElementById('user-phone-input').value.trim();

            if (phone !== userData.phoneNumber) {
                newData.phoneNumber = phone;
                hasChanges = true;

                const response = await fetch("/api/user/update", {
                    method: "PATCH",
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        phoneNumber: newData.phoneNumber,
                    })
                });

                if (!response.ok) {
                    throw new Error('Eroare la actualizarea numărului de telefon');
                }
            }
        }

        if (hasChanges) {
            userData = newData;
            localStorage.setItem('userData', JSON.stringify(userData));
            if (sessionStorage.getItem('userData')) {
                sessionStorage.setItem('userData', JSON.stringify(userData));
            }

            // Actualizează afișarea
            populateUserData();
            showCustomAlert('Datele au fost actualizate cu succes!', 3000);
        }

    } catch (error) {
        console.error('Error saving user data:', error);
        showCustomAlert('A apărut o eroare la salvarea datelor. Vă rugăm să încercați din nou.', 3000);
    }

    cancelEdit(field);
}

function cancelEdit(field) {
    const displayRow = document.querySelector(`[data-field="${field}"]`).closest('.info-item-inline').querySelector('.info-row');
    const editRow = document.getElementById(`edit-${field}`);

    // Arată rândul de afișare și ascunde rândul de editare
    displayRow.style.display = 'flex';
    editRow.style.display = 'none';
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Corectare: Afișează link admin doar pentru admini (roleID == 2)
const adminLink = document.getElementById('admin-link');
if (adminLink) {
    if (userData && userData.roleID == 2) {
        adminLink.style.display = 'list-item';
    } else {
        adminLink.style.display = 'none';
    }
}