
  document.addEventListener('DOMContentLoaded', function () {
   

    const fileInput       = document.getElementById('csvImport');
    const importCsvButtons = document.querySelectorAll('button[data-import="csv"]');
    const exportButtons    = document.querySelectorAll('button[data-export]');
  
    importCsvButtons.forEach(button => {
        button.addEventListener('click', function () {
          if (!fileInput || fileInput.files.length === 0) {
            showCustomAlert('Va rugam sa selectati un fisier CSV pentru import.', 3000);
            return;
          }
      
          const file = fileInput.files[0];
      
          const reader = new FileReader();
          reader.onload = async e => {
            const csvText = e.target.result;
      
            try {
              const response = await fetch('/api/import', {
                method: 'POST',
                headers: {
                  "Content-Type": "application/json",
                },
                credentials:'include',
                body: JSON.stringify({ content: csvText })
              });
      
              const status = response.status;
              const res    = await response.json();
      
              switch (status) {
                case 200:
                  showCustomAlert(
                    `CSV importat cu succes! Au fost procesate ${res.importedCount} rânduri.`,
                    3000
                  );
                  fileInput.value = '';
                  break;
                case 400:
                  showCustomAlert(`CSV invalid`, 4000);
                  break;
                case 401:
                  showCustomAlert('401 Unauthorized: Trebuie să te autentifici.', 4000);
                  break;
                case 403:
                  showCustomAlert('403 Forbidden: Nu ai permisiunea necesară.', 4000);
                  break;
                case 415:
                  showCustomAlert(`415 Unsupported Media Type: ${JSON.stringify(res,null,4)}`, 4000);
                  break;
                default:
                  showCustomAlert(`Eroare ${status}: ${JSON.stringify(res,null,4)}`, 4000);
              }
            } catch (err) {
              console.error('Eroare la upload:', err);
              showCustomAlert(`Eroare la import: ${err.message}`, 4000);
            }
          };
          reader.onerror = () => {
            showCustomAlert('Eroare la citirea fișierului.', 3000);
          };
      
          reader.readAsText(file); // citim CSV-ul ca text
        });
      });
  
    exportButtons.forEach(button => {
        button.addEventListener('click', function () {
            fetch('/api/export', {
              method: 'GET',
              credentials:'include'
            })
              .then(async response => {
                const status = response.status;
                const res = await response.json();
    
                switch (status) {
                  case 200: {
                    
                    const { fileName, contentType, content } = res;
                    if (!fileName || !contentType || !content) {
                      throw new Error('Date incomplete primite de la server.');
                    }

                    // decodific Base64 -> Uint8Array
                    const byteString = atob(content);
                    const len        = byteString.length;
                    const bytes     = new Uint8Array(len);
                    for (let i = 0; i < len; i++) {
                      bytes[i] = byteString.charCodeAt(i);
                    }
    
                    // creez Blob si declansez descarcarea
                    const blob = new Blob([bytes], { type: contentType });
                    const url  = URL.createObjectURL(blob);
                    const a    = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
    
                    showCustomAlert(`Exportul a fost descarcat: ${fileName}`, 3000);
                    return;
                  }
                  case 401:
                    showCustomAlert('401 Unauthorized: Trebuie sa te autentifici.', 4000);
                    return;
                  case 403:
                    showCustomAlert('403 Forbidden: Nu ai permisiunea necesara.', 4000);
                    return;
                  default:
                    showCustomAlert(`Eroare ${status}: ${JSON.stringify(res,null,4)}`, 4000);
                    return;
                }
              })
              .catch(err => {
                console.error('Eroare la export:', err);
                showCustomAlert(`Eroare la export: ${err.message}`, 4000);
              });
          
        });
      });
  
  });
  