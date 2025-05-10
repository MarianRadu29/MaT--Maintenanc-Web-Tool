- de implementat tokenii (JWT) pentru autentificare și autorizare
- de implementat `/user` endpoint pentru a obține datele utilizatorului
****


## Service Scheduler README

Acest document prezintă lista paginilor HTML necesare pentru aplicația online de management al programărilor și gestiune a service-ului de motociclete, biciclete și trotinete.

## 1. Pagini Publice (Client)

* **index.html**
  Pagina principală, prezintă descrierea serviciului și link către autentificare/înregistrare.

* **register.html**
  Formular de înregistrare pentru clienți (nume, email, parolă, date de contact).

* **login.html**
  Formular de autentificare pentru clienți și administratori.

* **calendar.html**
  Vizualizare calendar cu zilele și orele disponibile pentru programări.

* **appointment\_form.html**
  Formular pentru solicitarea unei programări (selectare dată/oră, descriere problemă, atașare imagini/video).

* **appointment\_success.html**
  Mesaj de confirmare că programarea a fost înregistrată cu succes.

* **appointment\_error.html**
  Afișează erori în cazul în care solicitarea de programare nu a fost validă.

## 2. Pagini Admin (Administrator)

* **admin\_dashboard.html**
  Panou de administrare cu statistici sumare (număr programări, stocuri, comenzi în curs).

* **admin\_appointments.html**
  Listă cu toate programările primite (filtrare după stare: pending, approved, rejected).

* **admin\_appointment\_detail.html**
  Detalii complete ale unei programări: date client, multimedia atașată, butoane Approve/Reject și câmpuri pentru răspuns administrativ (preț, garanție, mesaj respingere).

* **admin\_inventory.html**
  Listă și gestionare a pieselor în stoc: adăugare, actualizare cantități, ștergere.

* **admin\_suppliers.html**
  Listă furnizori și detalii de contact.

* **admin\_order\_form.html**
  Formular pentru plasare de comenzi către furnizori (selectare furnizor, articole, cantități).

* **admin\_orders.html**
  Istoric comenzi către furnizori și stare (pending, delivered, canceled).

## 3. Pagini Import/Export

* **import.html**
  Upload CSV sau JSON pentru importul de date în sistem (programări, stocuri, comenzi).

* **export.html**
  Alegerea formatului de export (CSV, JSON, PDF) și generarea fișierului pentru descărcare.

## 4. Pagină de Simulare

* **simulation.html**
  Interfață pentru configurarea și rularea simulării activității service-ului pe perioade de timp (lunar, anual): număr programări generate, variație stocuri, comenzi automate.

## 5. Pagini Comune

* **header.html**
  Fragment cu meniul de navigare (inclus în toate paginile).

* **footer.html**
  Fragment cu informații de copyright și link-uri utile.

* **styles.css**
  Fișier global de stiluri.

* **scripts.js**
  Fișier global de scripturi JavaScript (funcționalități comune, AJAX, validări).

---

Această structură asigură o separare clară între rolul clientului și cel al administratorului, precum și o modularitate ridicată pentru gestionarea importului/exportului și simulării.

Te pot ajuta cu un exemplu de structură de directoare și link-uri între pagini?
