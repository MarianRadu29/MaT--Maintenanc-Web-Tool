// === Custom Alert Element ===
const customAlert = document.createElement('div');
customAlert.id = 'customAlert';
customAlert.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #3B82F6;
        color: white;
        padding: 12px 24px;
        font-size: 16px;
        font-weight: 500;
        display: none;
        z-index: 9999;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        transition: opacity 0.3s ease;
    `;
document.body.appendChild(customAlert);

function showCustomAlert(message, duration = 3000) {
    customAlert.textContent = message;
    customAlert.style.display = 'block';
    customAlert.style.opacity = '1';

    setTimeout(() => {
        customAlert.style.opacity = '0';
        setTimeout(() => {
            customAlert.style.display = 'none';
        }, 300);
    }, duration);
}

// === Custom Confirm Modal ===
const confirmModal = document.createElement('div');
confirmModal.id = 'confirmModal';
confirmModal.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 99999;
    `;
confirmModal.innerHTML = `
        <div style="background: white; padding: 24px 32px; border-radius: 8px; max-width: 400px; text-align: center;">
            <p style="font-size: 18px; margin-bottom: 20px;">Sigur doriți să ștergeți acest produs?</p>
            <button id="confirmYes" style="margin-right: 10px; padding: 8px 16px; background: #3B82F6; color: white; border: none; border-radius: 5px; cursor: pointer;">Da</button>
            <button id="confirmNo" style="padding: 8px 16px; background: #e5e7eb; border: none; border-radius: 5px; cursor: pointer;">Nu</button>
        </div>
    `;
document.body.appendChild(confirmModal);

function showConfirmDialog(callback) {
    confirmModal.style.display = 'flex';
    const yesBtn = document.getElementById('confirmYes');
    const noBtn = document.getElementById('confirmNo');

    yesBtn.onclick = () => {
        confirmModal.style.display = 'none';
        callback(true);
    };
    noBtn.onclick = () => {
        confirmModal.style.display = 'none';
        callback(false);
    };
}
