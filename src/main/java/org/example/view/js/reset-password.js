const contentDiv = document.getElementById('content');

//afisez mesajul de success sau eroare 
function showMessage(msg, isError = false) {
  contentDiv.innerHTML = `<p class="message ${isError ? 'error' : 'success'}">${msg}</p>`;
}

// generez formularul de resetare
function showResetForm(token) {
  contentDiv.innerHTML = `
    <form id="resetForm" novalidate>
      <label for="newPassword">Noua parolă</label>
      <input type="password" id="newPassword" name="newPassword" required minlength="6" placeholder="Introdu noua parolă" />
      <label for="confirmPassword">Confirmă parola</label>
      <input type="password" id="confirmPassword" name="confirmPassword" required minlength="6" placeholder="Confirmă parola" />
      <button type="submit">Resetează parola</button>
      <p id="formMessage" class="message"></p>
    </form>
  `;

  const form = document.getElementById('resetForm');
  const formMessage = document.getElementById('formMessage');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formMessage.style.display = 'none';
    formMessage.textContent = '';

    const newPassword = form.newPassword.value.trim();
    const confirmPassword = form.confirmPassword.value.trim();

    if (newPassword.length < 8) {
      formMessage.textContent = 'Parola trebuie să aibă minim 8 caractere.';
      formMessage.className = 'message error';
      return;
    }

    if (newPassword !== confirmPassword) {
      formMessage.textContent = 'Parolele nu coincid.';
      formMessage.className = 'message error';
      return;
    }

    try {
      const response = await fetch('/api/reset-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Eroare la resetarea parolei.');
      }

      showMessage('Parola a fost resetată cu succes!', false);

      setTimeout(() => {
        window.location.href = '/login.html';
      }, 3000);

    } catch (err) {
      formMessage.textContent = err.message;
      formMessage.className = 'message error';
    }
  });
}

// extrage tokenul din URL
(async function init() {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
        showMessage('Lipsă token în URL.', true);
        return;
    }

    try {
        const res = await fetch(`/api/validate-reset-token?token=${encodeURIComponent(token)}`);
        if (!res.ok) throw new Error('Link-ul este invalid sau a expirat.');
        showResetForm(token);
    } catch (err) {
        showMessage(err.message, true);
    }
})();
