package org.example.controller;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import org.example.model.UserModel;
import org.example.objects.UserData;
import org.example.utils.*;
import org.example.utils.JsonSender;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

public class AuthController {
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public static class Register implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                JsonSender.send(exchange, 405, "{\"message\":\"Method Not Allowed\"}");
                return;
            }

            String requestBody = new String(
                    exchange.getRequestBody().readAllBytes(),
                    StandardCharsets.UTF_8
            );
            JSONObject obj = new JSONObject(requestBody);

            String firstName = Sanitizer.sanitizeJavaScript(Sanitizer.sanitizeHtml(obj.getString("first_name")));
            String lastName = Sanitizer.sanitizeJavaScript(Sanitizer.sanitizeHtml(obj.getString("last_name")));
            String password = Sanitizer.sanitizeJavaScript(Sanitizer.sanitizeHtml(obj.getString("password")));
            String email = Sanitizer.sanitizeJavaScript(Sanitizer.sanitizeHtml(obj.getString("email")));
            String phoneNumber = Sanitizer.sanitizeJavaScript(Sanitizer.sanitizeHtml(obj.getString("phone_number")));

            if (firstName == null || lastName == null || password == null || email == null || phoneNumber == null) {
                JsonSender.send(exchange, 400, "{\"message\":\"Missing fields\"}");
                return;
            }

            var user = UserModel.getUserByEmail(email);
            if (user == null) {
                UserData newUserData = new UserData(firstName, lastName, password, email, 0, phoneNumber, 1);
                UserModel.createUser(newUserData);

                user = UserModel.getUserByEmail(email);
                String accessToken = JwtUtil.generateToken(user.getId(), email, 15); // 15 minute
                var cookie = new Cookie.Builder("token", accessToken).maxAge(15*60).httpOnly().secure().build();
                exchange.getResponseHeaders().add("Set-Cookie", cookie.toString());
                String json = new JSONObject().put("message","Successfully registered").toString();
                JsonSender.send(exchange, 200, json);
            } else {
                JsonSender.send(exchange, 409, "{\"message\":\"User already exists\"}");
            }
        }
    }

    public static class Login implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                JsonSender.send(exchange, 405, "{\"message\":\"Method Not Allowed\"}");
                return;
            }

            String requestBody = new String(
                    exchange.getRequestBody().readAllBytes(),
                    StandardCharsets.UTF_8
            );
            JSONObject obj = new JSONObject(requestBody);
            String email = Sanitizer.sanitizeJavaScript(Sanitizer.sanitizeHtml(obj.getString("email")));
            String password = Sanitizer.sanitizeJavaScript(Sanitizer.sanitizeHtml(obj.getString("password")));
            boolean remember = obj.getBoolean("rememberMe");
            if (email == null || password == null) {
                JsonSender.send(exchange, 400, "{\"message\":\"Missing fields\"}");
                return;
            }
            UserData userData = UserModel.getUserByEmail(email);
            if (userData != null && BCrypt.checkPassword(password, userData.getPassword())) {
                String accessToken = JwtUtil.generateToken(userData.getId(), email, remember? 7*60 * 24 : 60*24);
                var cookie = new Cookie.Builder("token", accessToken).maxAge(remember? 7*60*60 * 24 : 60*60*24).httpOnly().secure().build();
                exchange.getResponseHeaders().add("Set-Cookie", cookie.toString());

                String json = new JSONObject().put("message","Successfully logged in").toString();
                JsonSender.send(exchange, 200, json);
            } else {
                JsonSender.send(exchange, 404, "{\"message\":\"email or password is wrong\"}");
            }
        }
    }

    public static class ForgotPassword implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1); // Method Not Allowed
                return;
            }

            String requestBody = new String(
                    exchange.getRequestBody().readAllBytes(),
                    StandardCharsets.UTF_8
            );

            try {
                JSONObject json = new JSONObject(requestBody);
                String email = Sanitizer.sanitizeJavaScript(Sanitizer.sanitizeHtml(json.optString("email", null)));

                if (email == null || email.isEmpty()) {
                    JsonSender.send(exchange, 400, "{\"message\":\"Email is required\"}");
                    return;
                }
                UserData userData = UserModel.getUserByEmail(email);
                if (userData == null) {
                    // Nu spun daca emailul nu exista exact ca sa nu revelam informatii
                    JsonSender.send(exchange, 200,
                            "{\"message\":\"Dacă emailul există, vei primi un link de resetare.\"}");
                    return;
                }

                String token = ForgetPasswordTokenGenerator.generateToken();
                LocalDateTime expirationDate = LocalDateTime.now().plusHours(1);
                String expirationDateStr = expirationDate.format(FORMATTER);

                try {
                    UserModel.deleteExistingToken(userData.getId());
                    UserModel.insertNewToken(userData.getId(), token, expirationDateStr);
                } catch (SQLException ex) {
                    ex.printStackTrace();
                    JsonSender.send(exchange, 500,
                            "{\"message\":\"Eroare la salvarea tokenului\"}");
                    return;
                }
                System.out.println(userData.getFirstName() + " " + userData.getLastName() + " " + token);

                String bodyEmail = EmailTemplate.createResetPasswordEmailHtml(
                        userData.getFirstName() + " " + userData.getLastName(),
                        token
                );



                EmailSender.sendEmail(email, "Resetare parola", bodyEmail);

                JsonSender.send(exchange, 200,
                        "{\"message\":\"Dacă emailul există, vei primi un link de resetare.\"}");

            } catch (Exception e) {
                e.printStackTrace();
                JsonSender.send(exchange, 500,
                        "{\"message\":\"Invalid JSON format\"}");
            }
        }
    }

    public static class ValidateTokenResetPassword implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1); // Method Not Allowed
                return;
            }

            try {
                String query = exchange.getRequestURI().getRawQuery();
                Map<String, String> map = Utils.parseQuery(query);
                String token = map.get("token");

                if (token == null || token.isEmpty()) {
                    JsonSender.send(exchange, 400, "{\"message\":\"Token is required\"}");
                    return;
                }

                LocalDateTime expirationDate;
                try {
                    expirationDate = UserModel.getForgotPasswordExpiration(token);
                } catch (Exception ex) {
                    ex.printStackTrace();
                    JsonSender.send(exchange, 500, "{\"message\":\"Eroare la validarea tokenului\"}");
                    return;
                }

                if (expirationDate == null) {
                    JsonSender.send(exchange, 401, "{\"message\":\"Invalid token\"}");
                    return;
                }

                if (LocalDateTime.now().isAfter(expirationDate)) {
                    JsonSender.send(exchange, 401, "{\"message\":\"Token expired\"}");
                    return;
                }

                JsonSender.send(exchange, 200, "{\"message\":\"Token valid\"}");


            } catch (Exception e) {
                e.printStackTrace();
                JsonSender.send(exchange, 500, "{\"message\":\"Invalid request format\"}");
            }
        }
    }

    public static class ResetPassword implements HttpHandler {

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            // check metoda HTTP
            if (!"PATCH".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1); // Method Not Allowed
                return;
            }

            // read body-ul cererii
            String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            try {
                JSONObject json = new JSONObject(body);
                String token = json.optString("token", null);
                String newPassword = Sanitizer.sanitizeJavaScript(Sanitizer.sanitizeHtml(json.optString("newPassword", null)));

                // Validari parametri
                if (token == null || token.isEmpty()) {
                    JsonSender.send(exchange, 400, "{\"message\":\"Token is required\"}");
                    return;
                }
                if (newPassword == null || newPassword.isEmpty()) {
                    JsonSender.send(exchange, 400, "{\"message\":\"New password is required\"}");
                    return;
                }

                // Validare token
                int userId;
                try {
                    userId = UserModel.validateResetPasswordToken(token);
                } catch (TokenInvalidException ex) {
                    JsonSender.send(exchange, 400, "{\"message\":\"Invalid token\"}");
                    return;
                } catch (TokenExpiredException ex) {
                    JsonSender.send(exchange, 400, "{\"message\":\"Token expired\"}");
                    return;
                } catch (Exception ex) {
                    ex.printStackTrace();
                    JsonSender.send(exchange, 500, "{\"message\":\"Eroare la implementare\"}");
                    return;
                }

                //update password
                try {
                    UserModel.updateUserPassword(userId, BCrypt.hashPassword(newPassword));
                } catch (Exception ex) {
                    ex.printStackTrace();
                    JsonSender.send(exchange, 500, "{\"message\":\"Eroare la resetarea parolei\"}");
                    return;
                }

                // Sterge token-ul de reset
                try {
                    UserModel.deleteForgotPasswordTokenByUserId(userId);
                } catch (Exception ex) {
                    ex.printStackTrace();
                }

                // Trimite email de confirmare
                try {
                    UserData userData = UserModel.getUserById(userId);
                    if (userData != null) {
                        String emailBody = EmailTemplate.createPasswordResetSuccessEmailHtml(
                                userData.getFirstName() + " " + userData.getLastName()
                        );
                        EmailSender.sendEmail(userData.getEmail(), "Parolă resetată", emailBody);
                    }
                } catch (Exception ex) {
                    ex.printStackTrace();
                }

                // Raspuns final de succes
                JsonSender.send(exchange, 200, "{\"message\":\"Parola a fost resetata cu succes!\"}");

            } catch (JSONException ex) {
                ex.printStackTrace();
                JsonSender.send(exchange, 400, "{\"message\":\"Invalid JSON format\"}");
            } catch (Exception ex) {
                ex.printStackTrace();
                JsonSender.send(exchange, 500, "{\"message\":\"Eroare internă\"}");
            }
        }
    }

    public static class Logout implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"DELETE".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1); // Method Not Allowed
                exchange.close();
                return;
            }
            Cookie deleteCookie = new Cookie.Builder("token", "")
                    .path("/")
                    .maxAge(0)
                    .httpOnly()
                    .secure()
                    .sameSite("Strict")
                    .build();
            exchange.getResponseHeaders().add("Set-Cookie", deleteCookie.toString());
            exchange.sendResponseHeaders(204, -1);
            exchange.close();
        }
    }

    public static class Session implements HttpHandler {
         @Override
        public void handle(HttpExchange exchange) throws IOException {
             if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                 exchange.sendResponseHeaders(405, -1); // Method Not Allowed
                 exchange.close();
                 return;
             }
             String token = Cookie.getValue(exchange, "token");
             if(token == null) {
                 JsonSender.send(exchange, 201, "");
                 exchange.close();
                 return;
             }
             Map<String, Object> claims = JwtUtil.validateAndExtractClaims(token);
             if (claims == null) {
                 exchange.getRequestHeaders().set("Set-Cookie", new Cookie.Builder("token", "").httpOnly().secure().maxAge(0).build().toString());
                 JsonSender.send(exchange, 201, "");
                 exchange.close();
                 return;
             }

             JsonSender.send(exchange, 200, "");
             exchange.close();
         }
    }
}
