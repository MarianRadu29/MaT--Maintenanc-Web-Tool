document.addEventListener("DOMContentLoaded", function () {
    let userData;
    const tabs = document.querySelectorAll('.tab');
    checkLogin().then(user => {
        userData = user;
        if(userData.roleID===1){
            window.location.href = "/notFound";
        }

        if(userData.roleID===2){
            // appointments
            tabs.forEach(tab => {
                if(tab.getAttribute('data-tab').search('appointments')===-1){
                    tab.style.display = "none";
                }
            })

        }
    });


// tabs functionality
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const tabId = this.getAttribute('data-tab');

            tabs.forEach(t => t.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
});
