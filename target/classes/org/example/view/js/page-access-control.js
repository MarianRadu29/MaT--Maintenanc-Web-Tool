const pages = ["login.html", "register.html", "reset-password.html", "forgotten-password.html"];

// localhost:8001/login.html => login.html
const path = window.location.pathname;
const pageName = path.substring(path.lastIndexOf("/") + 1);

let userData;
fetch('/api/session', {
    method: 'GET',
    credentials: 'include'
}).then(res => {
    if (res.status == 200) {
        return Promise.reject(new Error('Logged'));
    }
    if (res.ok) {
        return res.json();
    }
    return Promise.reject(new Error(`Error ${res.status}`));
})
    .catch(_=>{});



