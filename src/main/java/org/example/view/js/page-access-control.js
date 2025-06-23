const pages = ["login.html", "register.html", "reset-password.html", "forgotten-password.html"];

// localhost:8001/login.html => login.html
const path = window.location.pathname;
const pageName = path.substring(path.lastIndexOf("/") + 1);

const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
const isAuth   = Boolean(userData);

// daca sunt autentificat si sunt pe una dintre paginile de auth/register
if (isAuth && pages.includes(pageName)) {
    window.location.href = "/notFound";
}
