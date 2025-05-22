document.addEventListener('DOMContentLoaded', function () {
    const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData') || null;
    if(!userData){
        window.location.href = "/login.html";
    }   
});