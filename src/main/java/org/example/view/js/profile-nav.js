document.addEventListener("DOMContentLoaded", async function () {
    try {
        userData = await getUserData();

        if (!userData) {
            window.location.href = 'login.html';
            return;
        }

        localStorage.setItem('userData', JSON.stringify(userData));
        if (sessionStorage.getItem('userData')) {
            sessionStorage.setItem('userData', JSON.stringify(userData));
        }

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