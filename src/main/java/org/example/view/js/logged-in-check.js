fetch('/api/user', {
    method: 'GET',
    credentials: 'include'
})
    .then(res => {
        if (res.status === 401) {
            window.location.href = '/login.html';
            return Promise.reject(new Error('Unauthorized'));
        }
        if (res.ok) {
            return res.json();
        }
        return Promise.reject(new Error(`Error ${res.status}`));
    })
    .catch(err => {
        console.error(err);
    });
