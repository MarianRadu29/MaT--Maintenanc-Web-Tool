document.addEventListener('DOMContentLoaded', function () {

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

    // === Modal functionality ===
    const inventoryModal = document.getElementById('inventoryModal');
    const editInventoryModal = document.getElementById('editInventoryModal');
    const closeBtns = document.querySelectorAll('.close, .close-btn');

    closeBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            inventoryModal.style.display = 'none';
            editInventoryModal.style.display = 'none';
        });
    });

    let inventoryItems = [];
    async function loadInventoryAPI() {
        let res = await fetch("/api/inventory", {
            method: "GET"
        });
        return res.json();
    }

    function initInventoryLoad() {
        loadInventoryAPI().then(list => {
            inventoryItems = list;
            loadInventoryItems(inventoryItems);
        }).catch(error => {
            console.error("Eroare la încărcarea inventarului:", error);
            showCustomAlert("Eroare la încărcarea inventarului!");
        });
    }

    initInventoryLoad();

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

    function loadInventoryItems(items) {
        const tableBody = document.getElementById('inventoryTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        items.forEach(item => {
            const row = document.createElement('tr');

            let statusClass = '';
            switch (item.status) {
                case 'in-stock': statusClass = 'status-in-stock'; break;
                case 'low-stock': statusClass = 'status-low-stock'; break;
                case 'out-of-stock': statusClass = 'status-out-of-stock'; break;
                case 'ordered': statusClass = 'status-ordered'; break;
            }

            let statusText = '';
            switch (item.status) {
                case 'in-stock': statusText = 'În stoc'; break;
                case 'low-stock': statusText = 'Stoc limitat'; break;
                case 'out-of-stock': statusText = 'Epuizat'; break;
            }

            row.innerHTML = `
                <td>${item.name}</td>
                <td>${translateCategory(item.category)}</td>
                <td>${item.quantity}</td>
                <td>${item.price.toFixed(2)} RON</td>
                <td>${item.supplier}</td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td class="table-actions">
                    <button class="action-btn action-btn-edit" data-id="${item.id}">Editează</button>
                    <button class="action-btn action-btn-delete" data-id="${item.id}">Șterge</button>
                </td>
            `;

            tableBody.appendChild(row);

            row.querySelector('.action-btn-edit').addEventListener('click', function () {
                const itemId = this.getAttribute('data-id');
                const item = inventoryItems.find(i => i.id == itemId);

                if (item) {
                    const selectCategories = document.getElementById("editItemCategory");
                    selectCategories.innerHTML = "<option value=\"\">Selectează categoria</option>";

                    fetch("api/inventory/categories", {
                        method: "GET"
                    })
                        .then(res => res.json())
                        .then(list => {
                            list.forEach(category => {
                                const option = document.createElement("option");
                                option.value = category.id;
                                option.text = translateCategory(category.name);
                                selectCategories.appendChild(option);
                            });

                            selectCategories.value = item.categoryID;
                        })
                        .catch(e => {
                            console.log(e);
                            showCustomAlert("Eroare la încărcarea categoriilor!");
                        });

                    document.getElementById('editInventoryModalTitle').textContent = 'Editează produs';
                    document.getElementById('editItemId').value = item.id;
                    document.getElementById('editItemName').value = item.name;
                    document.getElementById('editItemQuantity').value = item.quantity;
                    document.getElementById('editItemPrice').value = item.price;
                    document.getElementById('editItemSupplier').value = item.supplier;
                    document.getElementById('editItemStatus').value = item.status;

                    editInventoryModal.style.display = 'block';
                }
            });

            row.querySelector('.action-btn-delete').addEventListener('click', function () {
                const itemId = this.getAttribute('data-id');

                showConfirmDialog((confirmed) => {
                    if (confirmed) {
                        const index = inventoryItems.findIndex(i => i.id == itemId);
                        if (index != -1) {
                            inventoryItems.splice(index, 1);
                            fetch(`api/inventory/delete/${itemId}`, {
                                method: "DELETE",
                            }).then(res => res.json()).then(obj => {
                                showCustomAlert("Produsul a fost șters cu succes!");
                                loadInventoryItems(inventoryItems);
                            }).catch(err => {
                                console.log(err);
                                showCustomAlert("Eroare la ștergere.");
                            });
                        }
                    }
                });
            });
        });
    }

    window.addEventListener('click', function (event) {
        if (event.target === inventoryModal) {
            inventoryModal.style.display = 'none';
        }
        if (event.target === editInventoryModal) {
            editInventoryModal.style.display = 'none';
        }
    });

    const addItemBtn = document.getElementById('addItemBtn');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', function () {
            document.getElementById('inventoryModalTitle').textContent = 'Adaugă produs';
            document.getElementById('inventoryForm').reset();
            document.getElementById('itemId').value = '';
            inventoryModal.style.display = 'block';

            const selectCategory = document.getElementById("itemCategory");
            selectCategory.innerHTML = "<option value=\"\">Selectează categoria</option>";

            fetch("api/inventory/categories", {
                method: "GET"
            }).then(res => res.json())
                .then(list => {
                    list.forEach(category => {
                        const option = document.createElement("option");
                        option.value = category.id;
                        option.text = translateCategory(category.name);
                        selectCategory.appendChild(option);
                    })
                })
                .catch(e => {
                    console.log(e);
                    showCustomAlert("Eroare la încărcarea categoriilor.");
                });
        });
    }

    const inventoryForm = document.getElementById('inventoryForm');
    if (inventoryForm) {
        inventoryForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const newItem = {
                name: document.getElementById('itemName').value,
                category: document.getElementById('itemCategory').value,
                quantity: parseInt(document.getElementById('itemQuantity').value),
                price: parseFloat(document.getElementById('itemPrice').value),
                supplier: document.getElementById('itemSupplier').value,
                status: document.getElementById('itemStatus').value
            };

            fetch("/api/inventory/add", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newItem)
            }).then(res => res.json())
                .then(result => {
                    initInventoryLoad();
                    showCustomAlert("Produs adăugat cu succes!");
                }).catch(e => {
                console.log(e);
                showCustomAlert("Eroare la adăugarea produsului!");
            });

            inventoryModal.style.display = 'none';
        });
    }

    const editInventoryForm = document.getElementById('editInventoryForm');
    if (editInventoryForm) {
        editInventoryForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const updatedItem = {
                id: parseInt(document.getElementById('editItemId').value),
                name: document.getElementById('editItemName').value,
                category: parseInt(document.getElementById('editItemCategory').value),
                quantity: parseInt(document.getElementById('editItemQuantity').value),
                price: parseFloat(document.getElementById('editItemPrice').value),
                supplier: document.getElementById('editItemSupplier').value,
                status: document.getElementById('editItemStatus').value
            };

            fetch(`/api/inventory/update/${updatedItem.id}`, {
                method: "PUT",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedItem)
            }).then(res => res.json())
                .then(result => {
                    initInventoryLoad();
                    editInventoryModal.style.display = 'none';
                    showCustomAlert("Produs actualizat cu succes!");
                }).catch(e => {
                console.log(e);
                showCustomAlert("Eroare la actualizarea produsului!");
            });
        });
    }

    const searchInventory = document.getElementById('searchInventory');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');

    if (searchInventory && categoryFilter && statusFilter) {
        fetch("api/inventory/categories", {
            method: "GET"
        }).then(res => res.json())
            .then(list => {
                list.forEach(category => {
                    const option = document.createElement("option");
                    option.value = category.name;
                    option.text = translateCategory(category.name);
                    categoryFilter.appendChild(option);
                });
            }).catch(e => {
            console.log(e);
            showCustomAlert("Eroare la încărcarea categoriilor.");
        });

        function filterAndLoad() {
            const searchTerm = searchInventory.value.toLowerCase();
            const selectedCategory = categoryFilter.value;
            const selectedStatus = statusFilter.value;

            const filtered = inventoryItems.filter(item => {
                const matchesSearch = item.name.toLowerCase().includes(searchTerm);
                const matchesCategory = selectedCategory === "" || item.category === selectedCategory;
                const matchesStatus = selectedStatus === "" || item.status === selectedStatus;
                return matchesSearch && matchesCategory && matchesStatus;
            });
            loadInventoryItems(filtered);
        }

        searchInventory.addEventListener('input', filterAndLoad);
        categoryFilter.addEventListener('change', filterAndLoad);
        statusFilter.addEventListener('change', filterAndLoad);
    }
});
