document.addEventListener('DOMContentLoaded', function () {

    // Modal functionality
    const inventoryModal = document.getElementById('inventoryModal');
    const closeBtns = document.querySelectorAll('.close, .close-btn');

    closeBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            inventoryModal.style.display = 'none';
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
                case 'ordered':
                    statusText = 'Comandat';
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
                    const selectCategories = document.getElementById("itemCategory");

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

                    document.getElementById('inventoryModalTitle').textContent = 'Editează produs';
                    document.getElementById('itemId').value = item.id;
                    document.getElementById('itemName').value = item.name;
                    document.getElementById('itemQuantity').value = item.quantity;
                    document.getElementById('itemPrice').value = item.price;
                    document.getElementById('itemSupplier').value = item.supplier;
                    document.getElementById('itemStatus').value = item.status;

                    inventoryModal.style.display = 'block';
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

    // Inventory form submission
    const inventoryForm = document.getElementById('inventoryForm');
    if (inventoryForm) {
        inventoryForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const itemId = document.getElementById('itemId').value;
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
            alert(JSON.stringify(newItem,null,4));
            fetch("/api/inventory/add",{
                method:"POST",
                body: JSON.stringify(newItem)
            }).then(res=>{
                return res.json();
            }).catch(e=>console.log(e))

            if (itemId) {
                // Update existing item
                const index = inventoryItems.findIndex(item => item.id === itemId);
                if (index !== -1) {
                    inventoryItems[index] = newItem;
                }
            } else {
                // Add new item
                inventoryItems.push(newItem);
            }

            // Reload inventory table
            loadInventoryItems(inventoryItems);

            // Close modal
            inventoryModal.style.display = 'none';
        });
    }

    if (searchInventory && categoryFilter && statusFilter) {
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