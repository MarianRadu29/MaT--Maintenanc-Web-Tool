//alerte
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

