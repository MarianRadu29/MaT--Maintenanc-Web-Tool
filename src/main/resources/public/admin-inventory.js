document.addEventListener('DOMContentLoaded', function () {

    // Modal functionality
    const inventoryModal = document.getElementById('inventoryModal');
    const editInventoryModal = document.getElementById('editInventoryModal'); // Noul modal pentru editare
    const closeBtns = document.querySelectorAll('.close, .close-btn');

    closeBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            inventoryModal.style.display = 'none';
            editInventoryModal.style.display = 'none'; // Închide și modalul de editare
        });
    });

    let inventoryItems = [];
    async function loadInventoryAPI(){
        let res = await fetch("/api/inventory",{
            method:"GET"
        });
        return res.json();
    }
    function initInventoryLoad() {
        loadInventoryAPI().then(list => {
            inventoryItems = list;

            loadInventoryItems(inventoryItems);
        }).catch(error => {
            console.error("Eroare la încărcarea inventarului:", error);
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
                case 'in-stock':
                    statusClass = 'status-in-stock';
                    break;
                case 'low-stock':
                    statusClass = 'status-low-stock';
                    break;
                case 'out-of-stock':
                    statusClass = 'status-out-of-stock';
                    break;
                case 'ordered':
                    statusClass = 'status-ordered';
                    break;
            }

            let statusText = '';
            switch (item.status) {
                case 'in-stock':
                    statusText = 'În stoc';
                    break;
                case 'low-stock':
                    statusText = 'Stoc limitat';
                    break;
                case 'out-of-stock':
                    statusText = 'Epuizat';
                    break;
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

            // Add event listeners for edit and delete buttons
            row.querySelector('.action-btn-edit').addEventListener('click', function () {
                const itemId = this.getAttribute('data-id');
                const item = inventoryItems.find(i => i.id == itemId);

                if (item) {
                    const selectCategories = document.getElementById("editItemCategory");

                    // mai întâi curăță selectul
                    selectCategories.innerHTML = "<option value=\"\">Selectează categoria</option>";

                    // încarcă opțiunile și abia apoi setează valoarea
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
                        });

                    // Populează modalul de editare cu datele itemului
                    document.getElementById('editInventoryModalTitle').textContent = 'Editează produs';
                    document.getElementById('editItemId').value = item.id;
                    document.getElementById('editItemName').value = item.name;
                    document.getElementById('editItemQuantity').value = item.quantity;
                    document.getElementById('editItemPrice').value = item.price;
                    document.getElementById('editItemSupplier').value = item.supplier;
                    document.getElementById('editItemStatus').value = item.status;

                    editInventoryModal.style.display = 'block'; // Deschide modalul de editare
                }
            });

            row.querySelector('.action-btn-delete').addEventListener('click', function () {
                const itemId = this.getAttribute('data-id');

                if (confirm('Sigur doriți să ștergeți acest produs?')) {
                    const index = inventoryItems.findIndex(i => i.id == itemId);
                    console.log(index);
                    if (index != -1) {
                        inventoryItems.splice(index, 1);
                        fetch(`api/inventory/delete/${itemId}`,{
                            method:"DELETE",
                        }).then(res=>res.json()).then(obj=>{
                            console.log(obj);
                        }).catch(err=>console.log(err));
                        loadInventoryItems(inventoryItems);
                    }
                }
            });
        });
    }

    loadInventoryItems(inventoryItems);

    window.addEventListener('click', function (event) {
        if (event.target === inventoryModal) {
            inventoryModal.style.display = 'none';
        }
        if (event.target === editInventoryModal) {
            editInventoryModal.style.display = 'none';
        }
    });

    // Add inventory item button
    const addItemBtn = document.getElementById('addItemBtn');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', function () {
            document.getElementById('inventoryModalTitle').textContent = 'Adaugă produs';
            document.getElementById('inventoryForm').reset();
            document.getElementById('itemId').value = '';
            inventoryModal.style.display = 'block';
            const selectCategory = document.getElementById("itemCategory");

            // Curăță selectul
            selectCategory.innerHTML = "<option value=\"\">Selectează categoria</option>";

            fetch("api/inventory/categories",{
                method:"GET"
            }).then(res=>{
                return res.json()
            })
                .then(list=>{
                    list.forEach(category=>{
                        const option = document.createElement("option");
                        option.value = category.id;
                        option.text = translateCategory(category.name);
                        selectCategory.appendChild(option);
                    })
                })
                .catch(e=>{
                    console.log(e);
                })
        });
    }

    // Inventory form submission (pentru adăugare)
    const inventoryForm = document.getElementById('inventoryForm');
    if (inventoryForm) {
        inventoryForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const itemName = document.getElementById('itemName').value;
            const itemCategory = document.getElementById('itemCategory').value;
            const itemQuantity = document.getElementById('itemQuantity').value;
            const itemPrice = document.getElementById('itemPrice').value;
            const itemSupplier = document.getElementById('itemSupplier').value;
            const itemStatus = document.getElementById('itemStatus').value;

            const newItem = {
                name: itemName,
                category: itemCategory,
                quantity: parseInt(itemQuantity),
                price: parseFloat(itemPrice),
                supplier: itemSupplier,
                status: itemStatus
            };

            fetch("/api/inventory/add",{
                method:"POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newItem)
            }).then(res=>{
                return res.json();
            }).then(result => {
                console.log('Produs adăugat:', result);
                // Reîncarcă inventarul
                initInventoryLoad();
            }).catch(e=>console.log(e))

            // Close modal
            inventoryModal.style.display = 'none';
        });
    }

    // Edit inventory form submission (pentru editare) - VERSIUNE CU API REAL
    const editInventoryForm = document.getElementById('editInventoryForm');
    if (editInventoryForm) {
        editInventoryForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const itemId = document.getElementById('editItemId').value;
            const itemName = document.getElementById('editItemName').value;
            const itemCategory = document.getElementById('editItemCategory').value;
            const itemQuantity = document.getElementById('editItemQuantity').value;
            const itemPrice = document.getElementById('editItemPrice').value;
            const itemSupplier = document.getElementById('editItemSupplier').value;
            const itemStatus = document.getElementById('editItemStatus').value;

            const updatedItem = {
                id:parseInt(itemId),
                name: itemName,
                category: parseInt(itemCategory),
                quantity: parseInt(itemQuantity),
                price: parseFloat(itemPrice),
                supplier: itemSupplier,
                status: itemStatus
            };

            // Folosește endpoint-ul de update
            fetch(`/api/inventory/update/${itemId}`, {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedItem)
            }).then(res => {
                return res.json();
            }).then(result => {
                console.log('Produs actualizat:', result);
                // Reîncarcă inventarul
                initInventoryLoad();
                // Close modal
                editInventoryModal.style.display = 'none';
            }).catch(e => {
                console.log(e);
                alert('Eroare la actualizarea produsului');
            });
        });
    }

    // Filtering functionality
    const searchInventory = document.getElementById('searchInventory');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');

    if (searchInventory && categoryFilter && statusFilter) {
        fetch("api/inventory/categories",{
            method:"GET"
        }).then(res=>{
            return res.json()
        })
            .then(list=>{
                list.forEach(category=>{
                    const option = document.createElement("option");
                    option.value = category.id;
                    option.text = translateCategory(category.name);
                    categoryFilter.appendChild(option);
                })
            })
            .catch(e=>{
                console.log(e);
            })
        searchInventory.addEventListener('input', filterInventory);
        categoryFilter.addEventListener('change', filterInventory);
        statusFilter.addEventListener('change', filterInventory);

        function filterInventory() {
            const searchValue = searchInventory.value.toLowerCase();
            const categoryValue = categoryFilter.value; // acesta este categoryID numeric
            const statusValue = statusFilter.value;

            const filteredItems = inventoryItems.filter(item => {
                const matchesSearch = item.name.toLowerCase().includes(searchValue) ||
                    item.supplier.toLowerCase().includes(searchValue);

                const matchesCategory = !categoryValue || item.categoryID == categoryValue;

                const matchesStatus = !statusValue || item.status === statusValue;

                return matchesSearch && matchesCategory && matchesStatus;
            });

            loadInventoryItems(filteredItems);
        }
    }

});