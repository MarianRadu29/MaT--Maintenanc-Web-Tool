document.addEventListener("DOMContentLoaded", async function () {
    try {
        // userData
        checkLogin().then(user => {
            if(!user){
                window.location.href = 'login.html';
                return;
            }
            userData = user;
        });

        initializeTabs();
        populateUserData();
        initializeEditFunctionality();
        await initializeAppointments();

    } catch (error) {
        console.error('Error initializing app:', error);
        // window.location.href = 'login.html';
    }
});

function initializeTabs() {
    const tabs = document.querySelectorAll(".profile-tabs .tab-button");
    const tabContents = document.querySelectorAll(".tab-content");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            tabContents.forEach(tc => (tc.style.display = "none"));
            document.getElementById("tab-" + tab.dataset.tab).style.display = "block";
        });
    });
}