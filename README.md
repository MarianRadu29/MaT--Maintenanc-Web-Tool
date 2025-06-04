# Web Project

---
## De verificat cu profa:

1. De verificat daca sunt toate paginile necesare

1.  De verificat la admin la programari daca e totul necesar pe pagina(daca treb sa fie toate programarile sau doar cele in asteptare)

1. De verificat la inventar daca sunt toate campurile necesare

1. La inport/export, ce ar trebui sa importez/exportez

1. De verificat la comenzi daca sunt toate campurile necesare


--- 
## Chestii de implementat:

- SA FOLOSIM COOKIE URI IN LOC DE LOCALSTORAGE 
- ar trebui un nou rol de `employee` care sa aiba acces la programari si inventar
- adminu sau mecanicul pot schimba ora unei programari(sau sa o prelungeasca)
- clientul poate sa schimbe ora programarii daca nu a fost inca aprobata
- clientul poate sa anuleze programarea daca nu a fost inca aprobata
- la lista de programari la admin sa se vada numai programarile din ziua respectiva si din zilele urmatoare
- daca o programare este aprobata,se poate adauga un buton de `order` sau `completed` care ar face un order al programarii respective(pretul garantia + piese utilizate)
- mecanicul poate avea acces numai la sectiunea de programari si inventar(asta ar treb discutat)
- la programari sa se vada si piesele utilizate la acea programare
- la programari sa se vada si garantia oferita la acea programare
- la operatiuni unde se foloseste tokenul daca nu este valid sa se verifice si daca este inca valid, daca nu sa se dea un mesaj de eroare si sa se redirectioneze la login
- ar trebui trimis si emailul userului si nr de telefon la pagina de admin la programari la detalii
- trigger la baza de date pentru a trimite emailul de confirmare a programarii
- trigger cand se face un order sa se scada din stocul pieselor respective
- trigger cand se face o programare sa se adauge in baza de date si piesele utilizate la acea programare
---

## Chestii de modificat pe front
- de rezolvat bugul la tabele pe ecrane mici ✅
- la calendar sa nu pot selecta ziua de duminica ✅
- de facut `pop up` uri in loc de alerte
- de rezolvat cum arata filtrele la pagina de profil ✅
- de adaugat `interactiune` sa iti poti schimba datele direct din profil ✅
- de reparat `navbar` pentru pagina de programari (doar pe asta nu merge din ceva motiv)✅
- la admin sa apara doar programarile din ziua respectiva si din viitor ✅
- de facut tabelele sa fie 100% responsive ✅
- de modificat sa nu mai apara butonul de conectare de fiecare data cand intru pe o pagina noua
- de modificat cand faci o programare chenarul de la incarcare documente e prea mare
- de modificat imaginea cu motocicleta de pe home-page✅
- eventual de facut o pagina de servicii unde sa se detalieze mai mult fiecare serviciu in parte
- de facut calendarul responsive pe ecrane f mici (cand e ecranul mic sa apara prescurtarile zilelor saptamanii)✅
- de modificat fisierele sa nu mai am css in fisierele js✅
- la o programare la sectiunea de admin cand dau modifica sa apara iar=)) un pop up ceva care sa editez intervalele orare ale acelei programari(check urile le fac la backend si iti trimit raspunsul daca e ok sau nu)✅
- de scos scrolul pe toata pagina cand sunt pe modal(pe vezi) ✅
- de facut cele 2 modale sa arate la fel (de la admin si de la profil) , sa arata ce cel de la profil
- de modificat iconita de la marca (din modal)✅
- de repearat in modal la profil sa preia cantitatea buna de echipamente folosite ✅
- de mofificat la admin sa nu mai apara butonul de aproba atunci cand programarea e deja aprobata ✅
- de facut sa apara si echipamentele la programariele approved ✅
- de facut sa apara si programarile anulate si finalizate la admin
- de facut sa se dea refresh dupa ce se face o actiune (aproba , etc)
- de facut iconita de exit sa fie la fel la ambele modale 
- de reparat atunci cand intru pe o programare care nu are produse selectate imi arata pretul de la ultima programare pe care am intrat
- de facut sticky partea de sus la modaluri 





****

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

[//]: # (* **login.html**)

[//]: # (  Formular de autentificare pentru clienți și administratori.)

[//]: # (* **calendar.html**)

[//]: # (  Vizualizare calendar cu zilele și orele disponibile pentru programări.)

[//]: # (* **appointment\_form.html**)

[//]: # (  Formular pentru solicitarea unei programări &#40;selectare dată/oră, descriere problemă, atașare imagini/video&#41;.)

[//]: # (* **appointment\_success.html**)

[//]: # (  Mesaj de confirmare că programarea a fost înregistrată cu succes.)

[//]: # (* **appointment\_error.html**)

[//]: # (  Afișează erori în cazul în care solicitarea de programare nu a fost validă.)

[//]: # (## 2. Pagini Admin &#40;Administrator&#41;)

[//]: # (* **admin\_dashboard.html**)

[//]: # (  Panou de administrare cu statistici sumare &#40;număr programări, stocuri, comenzi în curs&#41;.)

[//]: # (* **admin\_appointments.html**)

[//]: # (  Listă cu toate programările primite &#40;filtrare după stare: pending, approved, rejected&#41;.)

[//]: # (* **admin\_appointment\_detail.html**)

[//]: # (  Detalii complete ale unei programări: date client, multimedia atașată, butoane Approve/Reject și câmpuri pentru)

[//]: # (  răspuns administrativ &#40;preț, garanție, mesaj respingere&#41;.)

[//]: # (* **admin\_inventory.html**)

[//]: # (  Listă și gestionare a pieselor în stoc: adăugare, actualizare cantități, ștergere.)

[//]: # (* **admin\_suppliers.html**)

[//]: # (  Listă furnizori și detalii de contact.)

[//]: # (* **admin\_order\_form.html**)

[//]: # (  Formular pentru plasare de comenzi către furnizori &#40;selectare furnizor, articole, cantități&#41;.)

[//]: # (* **admin\_orders.html**)

[//]: # (  Istoric comenzi către furnizori și stare &#40;pending, delivered, canceled&#41;.)

[//]: # (## 3. Pagini Import/Export)

[//]: # (* **import.html**)

[//]: # (  Upload CSV sau JSON pentru importul de date în sistem &#40;programări, stocuri, comenzi&#41;.)

[//]: # (* **export.html**)

[//]: # (  Alegerea formatului de export &#40;CSV, JSON, PDF&#41; și generarea fișierului pentru descărcare.)

[//]: # (## 4. Pagină de Simulare)

[//]: # (* **simulation.html**)

[//]: # (  Interfață pentru configurarea și rularea simulării activității service-ului pe perioade de timp &#40;lunar, anual&#41;: număr)

[//]: # (  programări generate, variație stocuri, comenzi automate.)

[//]: # (## 5. Pagini Comune)

[//]: # (* **header.html**)

[//]: # (  Fragment cu meniul de navigare &#40;inclus în toate paginile&#41;.)

[//]: # (* **footer.html**)

[//]: # (  Fragment cu informații de copyright și link-uri utile.)

[//]: # (* **styles.css**)

[//]: # (  Fișier global de stiluri.)

[//]: # (* **scripts.js**)

[//]: # (  Fișier global de scripturi JavaScript &#40;funcționalități comune, AJAX, validări&#41;.)

[//]: # (---)
