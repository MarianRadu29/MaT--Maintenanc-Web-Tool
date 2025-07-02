const form = document.getElementById("forgotPasswordForm");
const emailInput = document.getElementById("email");
const formMessage = document.getElementById("formMessage");
if (userData) {
  window.location.href = "/notFound";
}
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Reset message
  formMessage.style.display = "none";
  formMessage.classList.remove("error");

  const email = emailInput.value.trim();
  if (!email) {
    showMessage("Te rog introdu o adresă de email validă.", true);
    return;
  }

  try {
    const response = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    console.log(JSON.stringify(response.status, null, 4));

    if (!response.ok) {
      throw new Error("A apărut o eroare. Încearcă din nou.");
    }

    //nu afisez daca emailul exista sau nu in db
    //Phishing => atacatorul trimite un email fals in care iti poate fura datele aplicatiei
    //Brute-force => atacatorul incearca sa genereze parola stiind ca contul respectiv exista in db
    //Credential stuffing => am mai multe connturi pe cu aceeasi parola
    showMessage(
      "Dacă emailul este înregistrat, vei primi un link de resetare în curând."
    );

    form.querySelector("button").disabled = true;
    emailInput.disabled = true;
  } catch (err) {
    showMessage(err.message || "Eroare la trimiterea cererii.", true);
  }
});

function showMessage(msg, isError = false) {
  formMessage.textContent = msg;
  formMessage.style.display = "block";
  if (isError) {
    formMessage.classList.add("error");
  } else {
    formMessage.classList.remove("error");
  }
}
