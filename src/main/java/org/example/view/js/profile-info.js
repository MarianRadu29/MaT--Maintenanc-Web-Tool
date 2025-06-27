//user data
let userData = null;
let appointments = [];

function populateUserData() {
    checkLogin().then(user => {
        userData = user;
        if (!userData) return;
        document.getElementById('userData-fullname-display').textContent = (DOMPurify.sanitize(userData.firstName) || '') + ' ' + (DOMPurify.sanitize(userData.lastName) || '');
        document.getElementById('userData-email-display').textContent = DOMPurify.sanitize(userData.email) || '-';
        document.getElementById('userData-phone-display').textContent = DOMPurify.sanitize(userData.phoneNumber) || '-';
        document.getElementById('userData-role-display').textContent = userData.roleID === 3 ? 'Administrator' : userData.roleID===2?'Mecanic': 'Client';

    });
   }

function initializeEditFunctionality() {
    //sistem de editare
    const editButtons = document.querySelectorAll('.edit-btn');
    const saveButtons = document.querySelectorAll('.save-btn');
    const cancelButtons = document.querySelectorAll('.cancel-btn');

    editButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const field = e.target.closest('.edit-btn').dataset.field;
            startEdit(field);
        });
    });

    //butoane de salvare
    saveButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const field = e.target.closest('.save-btn').dataset.field;
            saveEdit(field);
        });
    });

    cancelButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const field = e.target.closest('.cancel-btn').dataset.field;
            cancelEdit(field);
        });
    });

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

    displayRow.style.display = 'none';
    editRow.style.display = 'flex';

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
                        "Content-Type": "application/json"
                    },
                    credentials:'include',
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
                        "Content-Type": "application/json"
                    },
                    credentials:'include',
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
                if( /^(07[0-9]{8})$/.test(phone.replace(/\s+/g, ''))===false){
                    showCustomAlert("Numar invalid de telefon");
                    return;
                }
                newData.phoneNumber = phone;
                hasChanges = true;

                const response = await fetch("/api/user/update", {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials:'include',
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

    // revine la randul normal,chenarele se sterg
    displayRow.style.display = 'flex';
    editRow.style.display = 'none';
}

function isValidEmail(email) {
    return  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

