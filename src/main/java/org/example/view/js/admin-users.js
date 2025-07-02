let users;

async function fetchAndUseUsers() {
    await fetch('/api/users', {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        },
    }).then(res => {
        if (res.status === 200) {
            return res.json();
        } else {
            throw new Error("Nu pot accesa lista de utilizatori")
        }
    }).then(list => {
        users = list;

        renderAllUsers();
        renderClients();
        updateStats();
    }).catch(err => showCustomAlert(err.toString()))
}
fetchAndUseUsers();
let userToDeleteId = null;
let userToPromoteId = null;

// Role mapping
const roleNames = {
    1: { name: 'Client', class: 'role-client' },
    2: { name: 'Mecanic', class: 'role-mechanic' },
    3: { name: 'Administrator', class: 'role-admin' }
};

function updateStats() {
    const totalUsers = users.length;
    const totalClients = users.filter(u => u.roleID === 1).length;
    const totalMechanics = users.filter(u => u.roleID === 2).length;
    const totalAdmins = users.filter(u => u.roleID === 3).length;

    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('totalClients').textContent = totalClients;
    document.getElementById('totalMechanics').textContent = totalMechanics;
    document.getElementById('totalAdmins').textContent = totalAdmins;
}

function renderAllUsers() {
    const tbody = document.getElementById('allUsersTable');
    tbody.innerHTML = '';

    users.forEach(user => {
        const role = roleNames[user.roleID];
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.firstName} ${user.lastName}</td>
                    <td>${user.email}</td>
                    <td>${user.phoneNumber}</td>
                    <td><span class="role-badge ${role.class}">${role.name}</span></td>
                    <td>
                        <div class="action-buttons">
                             ${
            [1,2].includes(user.roleID)
                ?`<button class="btn-icon btn-delete" onclick="showDeleteModal(${user.id}, '${user.firstName} ${user.lastName}')">
                                Sterge
                            </button>`
                :``}
                        </div>
                    </td>
                `;
        tbody.appendChild(row);
    });
}

function renderClients() {
    const tbody = document.getElementById('clientsTable');
    tbody.innerHTML = '';

    const clients = users.filter(user => user.roleID !== 3);

    if (clients.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td colspan="5" style="text-align: center; color: var(--medium-text); padding: 2rem;">
                        Nu există clienți în sistem
                    </td>
                `;
        tbody.appendChild(row);
        return;
    }

    clients.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.firstName} ${user.lastName}</td>
                    <td>${user.email}</td>
                    <td>${user.phoneNumber}</td>
                    <td>${roleNames[user.roleID].name}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon btn-promote" onclick="showPromoteModal(${user.id}, '${user.firstName} ${user.lastName}')">
                                Schimbă rol
                            </button>
                        </div>
                    </td>
                `;
        tbody.appendChild(row);
    });
}

function showDeleteModal(userId, userName) {
    userToDeleteId = userId;
    document.getElementById('userToDelete').textContent = userName;
    document.getElementById('deleteModal').style.display = 'block';
}

function showPromoteModal(userId, userName) {
    userToPromoteId = userId;
    document.getElementById('userToPromote').textContent = userName;
    document.getElementById('promoteModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    userToDeleteId = null;
    userToPromoteId = null;
}

function confirmDelete() {
    if (userToDeleteId) {
        users = users.filter(user => user.id !== userToDeleteId);
        fetch(`/api/user/delete/${userToDeleteId}`,{
            method: 'DELETE',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
            },
        }).then(res=>{
            console.log(res.status);
            switch (res.status){
                case 200:{
                    closeModal('deleteModal');
                    // Show success message
                    showCustomAlert('Utilizatorul a fost șters cu succes!');
                    fetchAndUseUsers();
                    renderAllUsers();
                    renderClients();
                    updateStats();
                }
                    break;
                //401 403 500 etc
                default:
                    throw new Error(`${JSON.stringify(res,null,4)}`);
            }
        }).catch(err => {
            closeModal('deleteModal');
            showCustomAlert(err.toString())
        })

    }
}

function confirmPromotion() {
    if (userToPromoteId) {
        const newRoleId = parseInt(document.getElementById('newRole').value);
        const userIndex = users.findIndex(user => user.id === userToPromoteId);

        if (userIndex !== -1) {
            const oldRole = roleNames[users[userIndex].roleID].name;
            const newRole = roleNames[newRoleId].name;

            users[userIndex].roleID = newRoleId;
            fetch(`/api/user/${userToPromoteId}`,{
                method: 'PATCH',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
                },
                body:JSON.stringify({
                    roleID:newRoleId
                },null,4)
            }).then(res=>{
                console.log(res.status);
                switch (res.status){
                    case 200:{
                        closeModal('promoteModal');
                        // Show success message
                        showCustomAlert(`Utilizatorul a fost promovat de la ${oldRole} la ${newRole}!`);
                        fetchAndUseUsers();
                        renderAllUsers();
                        renderClients();
                        updateStats();
                    }
                        break;
                    //401 403 500 etc
                    default:
                        throw new Error(`${JSON.stringify(res,null,4)}`);
                }
            }).catch(err => {
                closeModal('promoteModal');
                showCustomAlert(err.toString())
            })
        }
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const deleteModal = document.getElementById('deleteModal');
    const promoteModal = document.getElementById('promoteModal');

    if (event.target === deleteModal) {
        closeModal('deleteModal');
    }
    if (event.target === promoteModal) {
        closeModal('promoteModal');
    }
}

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal('deleteModal');
        closeModal('promoteModal');
    }
});