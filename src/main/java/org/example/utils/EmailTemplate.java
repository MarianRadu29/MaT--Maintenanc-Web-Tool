package org.example.utils;

import java.util.List;

public class EmailTemplate {

    public static String createConfirmationEmailHtml(String firstName, String date, String time,
                                                     String vehicleType, String problemDescription, List<String> files) {
        String filesList = files.isEmpty() ? "(niciunul)" : String.join(", ", files);

        String template = """
        <html>
        <body>
            <p>Salut %s,</p>
            <p>Îți mulțumim pentru cererea de programare trimisă către service-ul nostru.</p>
            <p>Am înregistrat cu succes solicitarea ta pentru data de <strong>%s</strong> la ora <strong>%s</strong>. Un membru al echipei noastre va analiza cererea cât de curând posibil și îți va trimite un răspuns în maximum 24–48 de ore lucrătoare.</p>
            <p>📌 <strong>Detalii primite:</strong></p>
            <ul>
                <li>Tip vehicul: %s</li>
                <li>Descriere problemă: %s</li>
                <li>Fișiere atașate: %s</li>
            </ul>
            <p>Te vom informa dacă este nevoie de detalii suplimentare sau dacă trebuie reprogramată vizita în funcție de disponibilitate și stocuri.</p>
            <p>Îți mulțumim că ai ales MaT Service!</p>
            <p>Cu respect,<br/>Echipa MaT – Maintenance Web Tool<br/>
            www.mat-service.ro • contact@mat-service.ro</p>
        </body>
        </html>
        """;

        return template.formatted(firstName, date, time, vehicleType, problemDescription, filesList);
    }




    public static String createResetPasswordEmailHtml(String name, String token) {
        String resetUrl = "http://localhost:8001/reset-password.html?token=" + token;

        return """
        <html>
        <body>
            <p>Salut %s,</p>
            <p>Am primit o cerere de resetare a parolei pentru contul tău.</p>
            <p>Pentru a-ți reseta parola, te rugăm să accesezi linkul de mai jos:</p>
            <p><a href="%s" style="color: #3b82f6; text-decoration: none; font-weight: bold;">Resetează parola</a></p>
            <p>Acest link este valabil o oră și poate fi folosit o singură dată.</p>
            <p>Dacă nu ai făcut această cerere, te rugăm să ignori acest mesaj.</p>
            <br/>
            <p>Cu respect,<br/>Echipa MaT – Maintenance Web Tool<br/>
            www.mat-service.ro • contact@mat-service.ro</p>
        </body>
        </html>
        """.formatted(name, resetUrl);
    }

    public static String createPasswordResetSuccessEmailHtml(String name) {
        return """
    <html>
    <body>
        <p>Salut %s,</p>
        <p>Parola ta a fost resetată cu succes.</p>
        <p>Dacă nu ai făcut această schimbare, te rugăm să ne contactezi imediat.</p>
        <br/>
        <p>Cu respect,<br/>Echipa MaT – Maintenance Web Tool<br/>
        www.mat-service.ro • contact@mat-service.ro</p>
    </body>
    </html>
    """.formatted(name);
    }



}

