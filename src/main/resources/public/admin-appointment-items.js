// admin-appointment-items.js - Versiunea modificată
let selectedInventoryItems = [];
let totalPrice = 0;
let inventoryItems = [];
let appointmentStatus = "approved";
let currentAppointment = null;

async function loadInventoryAPI() {
    try {
        let res = await fetch("/api/inventory", { method: "GET" });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
    } catch (error) {
        console.error("Eroare la încărcarea inventarului:", error);
        throw error;
    }
}

function translateCategory(categoryEn) {
    const translations = {
        "Brake System": "Sistem de frânare",
        "Transmission System": "Sistem de transmisie",
        "Wheels and Tires": "Roți și anvelope",
        "Suspension and Fork": "Suspensie și furcă",
        "Electrical Components": "Componente electrice",
        "Battery and Charging": "Baterii și încărcare",
        "Lighting": "Iluminat",
        "Engine and Clutch": "Motor și ambreiaj",
        "Cables and Housings": "Cabluri și cămăși",
        "Consumables": "Consumabile",
        "Bearings and Seals": "Rulmenți și simeringuri",
        "Fasteners and Mounts": "Elemente de prindere și montaj"
    };
    return translations[categoryEn] || categoryEn;
}

async function initInventoryLoad() {
    try {
        inventoryItems = await loadInventoryAPI();
        console.log("Inventar încărcat:", inventoryItems);
    } catch (error) {
        showInventoryLoadError();
        inventoryItems = [];
    }
}

function showInventoryLoadError() {
    const resultsContainer = document.getElementById('inventoryResults');
    if (resultsContainer) {
        resultsContainer.innerHTML = '<div class="error-message" style="color: red;">Eroare la încărcarea inventarului.</div>';
    }
}

function setAppointmentStatus(status, appointment = null) {
    appointmentStatus = status;
    currentAppointment = appointment;
    updateInterfaceForStatus();
}

function updateInterfaceForStatus() {
    const inventorySelectionTitle = document.getElementById('inventorySelectionTitle');
    const inventorySearchBox = document.querySelector('.inventory-search-box');
    const inventoryResults = document.getElementById('inventoryResults');
    const selectedItemsSection = document.querySelector('.selected-items-section h4');

    if (appointmentStatus === 'approved') {
        if (inventorySelectionTitle) inventorySelectionTitle.style.display = 'none';
        if (inventorySearchBox) inventorySearchBox.style.display = 'none';
        if (inventoryResults) inventoryResults.style.display = 'none';
        if (selectedItemsSection) selectedItemsSection.textContent = 'Produse folosite în această programare:';
    } else {
        if (inventorySelectionTitle) inventorySelectionTitle.style.display = 'block';
        if (inventorySearchBox) inventorySearchBox.style.display = 'block';
        if (inventoryResults) inventoryResults.style.display = 'block';
        if (selectedItemsSection) selectedItemsSection.textContent = 'Produse Selectate:';
    }
}

// ✅ MODIFICAT: încarcă echipamentele folosite indiferent de status
function loadUsedEquipment(appointment) {
    selectedInventoryItems = [];

    if (appointment.orderItems && appointment.orderItems.length > 0) {
        appointment.orderItems.forEach(usedItem => {
            const inventoryItem = inventoryItems.find(item => item.id === usedItem.id);
            if (inventoryItem) {
                selectedInventoryItems.push({
                    ...inventoryItem,
                    selectedQuantity: usedItem.quantity
                });
            } else {
                // fallback dacă itemul nu mai exista în inventar
                selectedInventoryItems.push({
                    id: usedItem.id,
                    name: "Produs necunoscut",
                    category: "Necunoscut",
                    supplier: "-",
                    quantity: 0,
                    price: usedItem.unitPrice,
                    selectedQuantity: usedItem.quantity
                });
            }
        });
    }

    updateSelectedItemsDisplay();
}

function initializeInventorySearch() {
    if (appointmentStatus === "approved") return;

    const searchInput = document.getElementById('inventorySearchModal');
    const resultsContainer = document.getElementById('inventoryResults');
    if (!searchInput || !resultsContainer) return;

    const normalizeText = text => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

    searchInput.addEventListener('focus', () => {
        if (inventoryItems.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">Inventarul nu este încărcat.</div>';
            return;
        }
        displaySearchResults(inventoryItems);
    });

    searchInput.addEventListener('input', function () {
        const searchTerm = normalizeText(this.value);
        const filteredItems = inventoryItems.filter(item =>
            normalizeText(item.name).includes(searchTerm) ||
            normalizeText(item.supplier).includes(searchTerm) ||
            normalizeText(translateCategory(item.category)).includes(searchTerm)
        );
        displaySearchResults(filteredItems);
    });
}

function displaySearchResults(items) {
    const resultsContainer = document.getElementById('inventoryResults');
    resultsContainer.innerHTML = '';

    if (items.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">Nu s-au găsit produse</div>';
        return;
    }

    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'inventory-item-result';
        itemElement.setAttribute('data-id', item.id);
        itemElement.setAttribute('id', `inventory-item-${item.id}`);

        const isAvailable = item.status !== 'out-of-stock' && item.quantity > 0;
        const isSelected = selectedInventoryItems.some(selected => selected.id === item.id);

        if (isSelected) itemElement.classList.add('selected');

        itemElement.innerHTML = `
            <div class="inventory-item-info">
                <div class="inventory-item-name">${item.name}</div>
                <div class="inventory-item-details">
                    ${translateCategory(item.category)} • ${item.supplier} • Stoc: ${item.quantity}
                </div>
            </div>
            <div class="inventory-item-price">${item.price.toFixed(2)} RON</div>
        `;

        itemElement.style.cursor = isAvailable ? 'pointer' : 'not-allowed';
        itemElement.style.opacity = isAvailable ? '1' : '0.6';

        if (isAvailable && appointmentStatus !== "approved") {
            itemElement.addEventListener('click', function () {
                const index = selectedInventoryItems.findIndex(selected => selected.id === item.id);
                if (index >= 0) {
                    selectedInventoryItems.splice(index, 1);
                    itemElement.classList.remove('selected');
                } else {
                    selectedInventoryItems.push({ ...item, selectedQuantity: 1 });
                    itemElement.classList.add('selected');
                }

                updateSelectedItemsDisplay();
                calculateTotalPrice();
            });
        }

        resultsContainer.appendChild(itemElement);
    });
}

function updateSelectedItemsDisplay() {
    const selectedItemsList = document.getElementById('selectedItemsList');
    if (!selectedItemsList) return;

    if (selectedInventoryItems.length === 0) {
        selectedItemsList.innerHTML = '<div class="no-results">Nu aveți produse selectate</div>';
        return;
    }

    selectedItemsList.innerHTML = '';

    selectedInventoryItems.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'selected-item';
        itemElement.setAttribute('data-id', item.id);
        itemElement.setAttribute('id', `selected-item-${item.id}`);

        let content = `
            <div class="selected-item-info">
                <div><strong>${item.name}</strong></div>
                <div style="font-size: 0.9em; color: #666;">
                    ${translateCategory(item.category)} • ${item.supplier}
                </div>
                <div style="font-size: 0.9em; color: #007bff;">
                    ${item.selectedQuantity} x ${item.price.toFixed(2)} RON = ${(item.selectedQuantity * item.price).toFixed(2)} RON
                </div>
            </div>
        `;

        if (appointmentStatus !== "approved") {
            content += `
                <div class="selected-item-controls">
                    <button onclick="decreaseQuantity(${index})" ${item.selectedQuantity <= 1 ? 'disabled' : ''}>-</button>
                    <input type="number" value="${item.selectedQuantity}" onchange="updateQuantity(${index}, this.value)" min="1" max="${item.quantity}">
                    <button onclick="increaseQuantity(${index})" ${item.selectedQuantity >= item.quantity ? 'disabled' : ''}>+</button>
                    <button class="action-btn action-btn-delete" onclick="removeSelectedItem(${index})">Șterge</button>
                </div>
            `;
        }

        itemElement.innerHTML = content;
        selectedItemsList.appendChild(itemElement);
    });

    calculateTotalPrice();
}

function increaseQuantity(index) {
    if (appointmentStatus === "approved") return;
    const item = selectedInventoryItems[index];
    if (item.selectedQuantity < item.quantity) {
        item.selectedQuantity++;
        updateSelectedItemsDisplay();
    }
}

function decreaseQuantity(index) {
    if (appointmentStatus === "approved") return;
    const item = selectedInventoryItems[index];
    if (item.selectedQuantity > 1) {
        item.selectedQuantity--;
        updateSelectedItemsDisplay();
    }
}

function updateQuantity(index, newQuantity) {
    if (appointmentStatus === "approved") return;
    const qty = parseInt(newQuantity);
    if (qty >= 1 && qty <= selectedInventoryItems[index].quantity) {
        selectedInventoryItems[index].selectedQuantity = qty;
        updateSelectedItemsDisplay();
    }
}

function removeSelectedItem(index) {
    if (appointmentStatus === "approved") return;
    selectedInventoryItems.splice(index, 1);
    updateSelectedItemsDisplay();
    calculateTotalPrice();
}

function calculateTotalPrice() {
    totalPrice = selectedInventoryItems.reduce((sum, item) => sum + item.selectedQuantity * item.price, 0);
    const totalPriceElement = document.getElementById('totalPrice');
    if (totalPriceElement) totalPriceElement.textContent = totalPrice.toFixed(2);
}

function resetInventorySelection() {
    if (appointmentStatus === "approved") return;
    selectedInventoryItems = [];
    totalPrice = 0;
    const selectedItemsList = document.getElementById('selectedItemsList');
    if (selectedItemsList) selectedItemsList.innerHTML = '<div class="no-results">Nu aveți produse selectate</div>';
    calculateTotalPrice();
}

async function approveAppointment(appointmentId) {
    try {
        const response = await fetch(`/api/appointments/${appointmentId}/approve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ inventoryUsed: selectedInventoryItems })
        });

        if (!response.ok) throw new Error("Eroare la aprobare");
        alert("Programarea a fost aprobată!");

        setAppointmentStatus("approved");
        updateSelectedItemsDisplay();
    } catch (err) {
        console.error("Eroare la aprobare:", err);
        alert("Eroare la aprobarea programării.");
    }
}

document.addEventListener('DOMContentLoaded', function () {
    initInventoryLoad().then(() => {
        initializeInventorySearch();
        updateSelectedItemsDisplay();
    });
});

// ✅ MODIFICAT: încarcă echipamentele pentru orice status
async function handleAppointmentView(appointment) {
    if (inventoryItems.length === 0) {
        try {
            await initInventoryLoad();
        } catch (err) {
            console.error("Inventarul nu a putut fi încărcat pentru programare:", err);
            return;
        }
    }

    setAppointmentStatus(appointment.status, appointment);
    loadUsedEquipment(appointment);
    initializeInventorySearch();
}
