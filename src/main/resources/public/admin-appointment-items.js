let selectedInventoryItems = [];
let totalPrice = 0;
let inventoryItems = [];

async function loadInventoryAPI() {
    try {
        let res = await fetch("/api/inventory", {
            method: "GET"
        });
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
        console.error("Eroare la încărcarea inventarului:", error);
        showInventoryLoadError();
        inventoryItems = [];
    }
}

function showInventoryLoadError() {
    const resultsContainer = document.getElementById('inventoryResults');
    if (resultsContainer) {
        resultsContainer.innerHTML = '<div class="error-message" style="color: red; padding: 1rem; text-align: center;">Eroare la încărcarea inventarului. Vă rugăm să încercați din nou.</div>';
    }
}

function initializeInventorySearch() {
    const searchInput = document.getElementById('inventorySearchModal');
    const resultsContainer = document.getElementById('inventoryResults');

    if (!searchInput || !resultsContainer) return;

    searchInput.addEventListener('input', function () {
        const normalizeText = text => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
        const searchTerm = normalizeText(this.value);

        if (searchTerm === '') {
            resultsContainer.innerHTML = '';
            return;
        }

        if (inventoryItems.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">Inventarul nu este încărcat. Vă rugăm să reîmprospătați pagina.</div>';
            return;
        }

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

    if (items.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">Nu s-au găsit produse</div>';
        return;
    }

    resultsContainer.innerHTML = '';

    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'inventory-item-result';

        const isAvailable = item.status !== 'out-of-stock' && item.quantity > 0;
        const isSelected = selectedInventoryItems.some(selected => selected.id === item.id);

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
        itemElement.style.border = isSelected ? '2px solid #4CAF50' : '1px solid #ccc';
        itemElement.style.backgroundColor = '#fff';
        itemElement.style.margin = '5px';
        itemElement.style.borderRadius = '5px';
        itemElement.style.padding = '10px';

        if (isAvailable) {
            itemElement.addEventListener('click', function () {
                const index = selectedInventoryItems.findIndex(selected => selected.id === item.id);
                if (index >= 0) {
                    selectedInventoryItems.splice(index, 1);
                } else {
                    selectedInventoryItems.push({ ...item, selectedQuantity: 1 });
                }

                updateSelectedItemsDisplay();
                calculateTotalPrice(); // <-- MODIFICARE AICI

                const searchInput = document.getElementById('inventorySearchModal');
                if (searchInput.value.trim() !== '') {
                    const normalizeText = text => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
                    const searchTerm = normalizeText(searchInput.value);
                    const filteredItems = inventoryItems.filter(item =>
                        normalizeText(item.name).includes(searchTerm) ||
                        normalizeText(item.supplier).includes(searchTerm) ||
                        normalizeText(translateCategory(item.category)).includes(searchTerm)
                    );
                    displaySearchResults(filteredItems);
                }
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
        itemElement.innerHTML = `
            <div><strong>${item.name}</strong> (${translateCategory(item.category)}) - ${item.selectedQuantity} x ${item.price.toFixed(2)} RON</div>
            <div style="margin-top: 5px;">
                <button onclick="decreaseQuantity(${index})">-</button>
                <input type="number" value="${item.selectedQuantity}" onchange="updateQuantity(${index}, this.value)" min="1" max="${item.quantity}" style="width: 40px;">
                <button onclick="increaseQuantity(${index})">+</button>
                <button onclick="removeSelectedItem(${index})" style="margin-left: 10px; color: red;">Sterge</button>
            </div>
        `;
        selectedItemsList.appendChild(itemElement);
    });
    calculateTotalPrice();
}

function increaseQuantity(index) {
    const item = selectedInventoryItems[index];
    if (item.selectedQuantity < item.quantity) {
        item.selectedQuantity++;
        updateSelectedItemsDisplay();
    }
}

function decreaseQuantity(index) {
    const item = selectedInventoryItems[index];
    if (item.selectedQuantity > 1) {
        item.selectedQuantity--;
        updateSelectedItemsDisplay();
    }
}

function updateQuantity(index, newQuantity) {
    const qty = parseInt(newQuantity);
    if (qty >= 1 && qty <= selectedInventoryItems[index].quantity) {
        selectedInventoryItems[index].selectedQuantity = qty;
        updateSelectedItemsDisplay();
    }
}

function removeSelectedItem(index) {
    selectedInventoryItems.splice(index, 1);
    updateSelectedItemsDisplay();
}

function calculateTotalPrice() {
    totalPrice = selectedInventoryItems.reduce((sum, item) => sum + item.selectedQuantity * item.price, 0);
    const totalPriceElement = document.getElementById('totalPrice');
    if (totalPriceElement) totalPriceElement.textContent = totalPrice.toFixed(2);
}

function resetInventorySelection() {
    selectedInventoryItems = [];
    totalPrice = 0;
    const selectedItemsList = document.getElementById('selectedItemsList');
    if (selectedItemsList) selectedItemsList.innerHTML = '<div class="no-results">Nu aveți produse selectate</div>';
    calculateTotalPrice();
    const searchInput = document.getElementById('inventorySearchModal');
    const resultsContainer = document.getElementById('inventoryResults');
    if (searchInput) searchInput.value = '';
    if (resultsContainer) resultsContainer.innerHTML = '';
}

function initializeInventoryComponent() {
    initInventoryLoad().then(() => {
        const container = document.createElement('div');
        container.innerHTML = `
            <input id="inventorySearchModal" placeholder="Caută produse..." type="text">
            <div id="inventoryResults" style="border: 1px solid #ccc; margin: 10px 0; padding: 10px;"></div>
            <h4>Produse Selectate:</h4>
            <div id="selectedItemsList"></div>
            <div>Total: <span id="totalPrice">0.00</span> RON</div>
        `;
        document.body.appendChild(container);
        initializeInventorySearch();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeInventoryComponent);
} else {
    initializeInventoryComponent();
}
