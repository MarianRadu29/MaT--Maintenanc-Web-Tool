document.addEventListener('DOMContentLoaded', function () {
    // Import/Export functionality
    const importButtons = document.querySelectorAll('button[data-import]');
    const exportButtons = document.querySelectorAll('button[data-export]');

    importButtons.forEach(button => {
        button.addEventListener('click', function () {
            const importType = this.getAttribute('data-import');
            const fileInput = document.getElementById(`${importType}Import`);

            if (fileInput.files.length === 0) {
                showCustomAlert(`Vă rugăm să selectați un fișier ${importType.toUpperCase()} pentru import.`);
                return;
            }

            const file = fileInput.files[0];
            const reader = new FileReader();

            reader.onload = function (e) {
                try {
                    let data;

                    if (importType === 'csv') {
                        // Parse CSV
                        const csvData = e.target.result;
                        // Simple CSV parsing (in real app, use a library)
                        data = parseCSV(csvData);
                    } else if (importType === 'json') {
                        // Parse JSON
                        data = JSON.parse(e.target.result);
                    }

                    showCustomAlert(`${importType.toUpperCase()} importat cu succes!`);
                    console.log('Imported data:', data);

                } catch (error) {
                    showCustomAlert(`Eroare la importul ${importType.toUpperCase()}: ${error.message}`);
                }
            };

            reader.onerror = function () {
                showCustomAlert('Eroare la citirea fișierului.');
            };

            if (importType === 'csv') {
                reader.readAsText(file);
            } else {
                reader.readAsText(file);
            }
        });
    });

    exportButtons.forEach(button => {
        button.addEventListener('click', function () {
            const exportType = this.getAttribute('data-export');
            let data, filename, contentType, content;

            // For demo, we'll export inventory data
            data = inventoryItems;

            if (exportType === 'csv') {
                filename = 'inventory.csv';
                contentType = 'text/csv';
                content = convertToCSV(data);
            } else if (exportType === 'json') {
                filename = 'inventory.json';
                contentType = 'application/json';
                content = JSON.stringify(data, null, 2);
            } else if (exportType === 'pdf') {
                showCustomAlert('Funcționalitatea de export PDF va fi implementată în viitor.');
                return;
            }

            // Create download link
            const blob = new Blob([content], {type: contentType});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        });
    });
    function parseCSV(csv) {
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(header => header.trim());
        const result = [];

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;

            const values = lines[i].split(',').map(val => val.trim());
            const obj = {};

            for (let j = 0; j < headers.length; j++) {
                obj[headers[j]] = values[j];
            }

            result.push(obj);
        }

        return result;
    }

    function convertToCSV(data) {
        if (data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csvRows = [];

        csvRows.push(headers.join(','));

        for (const item of data) {
            const values = headers.map(header => {
                const value = item[header];
                return value;
            });

            csvRows.push(values.join(','));
        }

        return csvRows.join('\n');
    }
});