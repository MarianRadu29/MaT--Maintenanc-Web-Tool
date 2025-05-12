# Web Project

[//]: # (- de implementat tokenii &#40;JWT&#41; pentru autentificare și autorizare)

[//]: # (- de implementat `/user` endpoint pentru a obține datele utilizatorului)

[//]: # ()
[//]: # (****)

[//]: # ()
[//]: # (## Service Scheduler README)

[//]: # ()
[//]: # (Acest document prezintă lista paginilor HTML necesare pentru aplicația online de management al programărilor și gestiune)

[//]: # (a service-ului de motociclete, biciclete și trotinete.)

[//]: # ()
[//]: # (## 1. Pagini Publice &#40;Client&#41;)

[//]: # ()
[//]: # (* **index.html**)

[//]: # (  Pagina principală, prezintă descrierea serviciului și link către autentificare/înregistrare.)

[//]: # ()
[//]: # (* **register.html**)

[//]: # (  Formular de înregistrare pentru clienți &#40;nume, email, parolă, date de contact&#41;.)

[//]: # ()
[//]: # (* **login.html**)

[//]: # (  Formular de autentificare pentru clienți și administratori.)

[//]: # ()
[//]: # (* **calendar.html**)

[//]: # (  Vizualizare calendar cu zilele și orele disponibile pentru programări.)

[//]: # ()
[//]: # (* **appointment\_form.html**)

[//]: # (  Formular pentru solicitarea unei programări &#40;selectare dată/oră, descriere problemă, atașare imagini/video&#41;.)

[//]: # ()
[//]: # (* **appointment\_success.html**)

[//]: # (  Mesaj de confirmare că programarea a fost înregistrată cu succes.)

[//]: # ()
[//]: # (* **appointment\_error.html**)

[//]: # (  Afișează erori în cazul în care solicitarea de programare nu a fost validă.)

[//]: # ()
[//]: # (## 2. Pagini Admin &#40;Administrator&#41;)

[//]: # ()
[//]: # (* **admin\_dashboard.html**)

[//]: # (  Panou de administrare cu statistici sumare &#40;număr programări, stocuri, comenzi în curs&#41;.)

[//]: # ()
[//]: # (* **admin\_appointments.html**)

[//]: # (  Listă cu toate programările primite &#40;filtrare după stare: pending, approved, rejected&#41;.)

[//]: # ()
[//]: # (* **admin\_appointment\_detail.html**)

[//]: # (  Detalii complete ale unei programări: date client, multimedia atașată, butoane Approve/Reject și câmpuri pentru)

[//]: # (  răspuns administrativ &#40;preț, garanție, mesaj respingere&#41;.)

[//]: # ()
[//]: # (* **admin\_inventory.html**)

[//]: # (  Listă și gestionare a pieselor în stoc: adăugare, actualizare cantități, ștergere.)

[//]: # ()
[//]: # (* **admin\_suppliers.html**)

[//]: # (  Listă furnizori și detalii de contact.)

[//]: # ()
[//]: # (* **admin\_order\_form.html**)

[//]: # (  Formular pentru plasare de comenzi către furnizori &#40;selectare furnizor, articole, cantități&#41;.)

[//]: # ()
[//]: # (* **admin\_orders.html**)

[//]: # (  Istoric comenzi către furnizori și stare &#40;pending, delivered, canceled&#41;.)

[//]: # ()
[//]: # (## 3. Pagini Import/Export)

[//]: # ()
[//]: # (* **import.html**)

[//]: # (  Upload CSV sau JSON pentru importul de date în sistem &#40;programări, stocuri, comenzi&#41;.)

[//]: # ()
[//]: # (* **export.html**)

[//]: # (  Alegerea formatului de export &#40;CSV, JSON, PDF&#41; și generarea fișierului pentru descărcare.)

[//]: # ()
[//]: # (## 4. Pagină de Simulare)

[//]: # ()
[//]: # (* **simulation.html**)

[//]: # (  Interfață pentru configurarea și rularea simulării activității service-ului pe perioade de timp &#40;lunar, anual&#41;: număr)

[//]: # (  programări generate, variație stocuri, comenzi automate.)

[//]: # ()
[//]: # (## 5. Pagini Comune)

[//]: # ()
[//]: # (* **header.html**)

[//]: # (  Fragment cu meniul de navigare &#40;inclus în toate paginile&#41;.)

[//]: # ()
[//]: # (* **footer.html**)

[//]: # (  Fragment cu informații de copyright și link-uri utile.)

[//]: # ()
[//]: # (* **styles.css**)

[//]: # (  Fișier global de stiluri.)

[//]: # ()
[//]: # (* **scripts.js**)

[//]: # (  Fișier global de scripturi JavaScript &#40;funcționalități comune, AJAX, validări&#41;.)

[//]: # ()
[//]: # (---)

[//]: # ()
[//]: # (Această structură asigură o separare clară între rolul clientului și cel al administratorului, precum și o modularitate)

[//]: # (ridicată pentru gestionarea importului/exportului și simulării.)

[//]: # ()
[//]: # (Te pot ajuta cu un exemplu de structură de directoare și link-uri între pagini?)
