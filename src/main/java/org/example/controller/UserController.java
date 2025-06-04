package org.example.controller;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import org.example.utils.TokenExpiredException;
import org.example.utils.TokenInvalidException;
import org.example.model.UserModel;
import org.example.objects.User;
import org.example.utils.*;
import org.example.view.JsonView;
import org.json.JSONObject;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

public class UserController {
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public static class GetUserInfo implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String authHeader = exchange.getRequestHeaders().getFirst("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                JsonView.send(exchange, 401, "{\"message\":\"Missing or invalid token\"}");
                return;
            }

            String token = authHeader.substring(7); // Remove "Bearer "
            Map<String, Object> claims = JwtUtil.validateAndExtractClaims(token);

            if (claims == null) {
                JsonView.send(exchange, 401, "{\"message\":\"Invalid or expired token\"}");
                return;
            }

            int userId = (int) claims.get("id");
            String email = (String) claims.get("email");
            User user = UserModel.getUserByEmail(email);

            if (user == null || user.getId() != userId) {
                JsonView.send(exchange, 404, "{\"message\":\"User not found\"}");
                return;
            }

            String json = String.format(
                    "{\"id\":%d,\"roleID\":%d,\"firstName\":\"%s\",\"lastName\":\"%s\",\"email\":\"%s\",\"phoneNumber\":\"%s\"}",
                    user.getId(), user.getRoleId(), user.getFirstName(), user.getLastName(), user.getEmail(), user.getPhoneNumber()
            );
            JsonView.send(exchange, 200, json);
        }
    }

    public static class UpdateUserInfo implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"PATCH".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1); // Method Not Allowed
                return;
            }

            String authHeader = exchange.getRequestHeaders().getFirst("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                JsonView.send(exchange, 401, "{\"message\":\"Missing or invalid token\"}");
                return;
            }

            String token = authHeader.substring(7); // Remove "Bearer "
            Map<String, Object> claims = JwtUtil.validateAndExtractClaims(token);

            if (claims == null) {
                JsonView.send(exchange, 401, "{\"message\":\"Invalid or expired token\"}");
                return;
            }

            int userId = (int) claims.get("id");
            String email = (String) claims.get("email");
            User user = UserModel.getUserByEmail(email);

            if (user == null || user.getId() != userId) {
                JsonView.send(exchange, 404, "{\"message\":\"User not found\"}");
                return;
            }

            String requestBody = new String(
                    exchange.getRequestBody().readAllBytes(),
                    StandardCharsets.UTF_8
            );

            try {
                JSONObject json = new JSONObject(requestBody);
                String firstName     = json.optString("firstName", null);
                String lastName      = json.optString("lastName", null);
                String phoneNumber   = json.optString("phoneNumber", null);
                String emailFromJson = json.optString("email", null);

                if ((firstName == null || firstName.isEmpty()) &&
                        (lastName == null  || lastName.isEmpty()) &&
                        (phoneNumber == null || phoneNumber.isEmpty()) &&
                        (emailFromJson == null || emailFromJson.isEmpty())) {
                    JsonView.send(exchange, 400, "{\"message\":\"No field found to update\"}");
                    return;
                }

                if (!(firstName == null || firstName.isEmpty())) {
                    user.setFirstName(firstName);
                }
                if (!(lastName == null || lastName.isEmpty())) {
                    user.setLastName(lastName);
                }
                if (!(phoneNumber == null || phoneNumber.isEmpty())) {
                    user.setPhoneNumber(phoneNumber);
                }
                if (!(emailFromJson == null || emailFromJson.isEmpty())) {
                    user.setEmail(emailFromJson);
                }

                if (emailFromJson != null) {
                    User userEmailCheck = UserModel.getUserByEmail(emailFromJson);
                    if (userEmailCheck != null && user.getId() != userEmailCheck.getId()) {
                        JsonView.send(exchange, 409, "{\"message\":\"User with this email already exists\"}");
                        return;
                    }
                }

                UserModel.updateUser(user);
                JsonView.send(exchange, 200, "{\"message\":\"User information updated successfully\"}");
            } catch (Exception e) {
                e.printStackTrace();
                JsonView.send(exchange, 500, "{\"message\":\"Invalid JSON format\"}");
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
                String email = json.optString("email", null);

                if (email == null || email.isEmpty()) {
                    JsonView.send(exchange, 400, "{\"message\":\"Email is required\"}");
                    return;
                }

                User user = UserModel.getUserByEmail(email);
                if (user == null) {
                    // Nu spun daca emailul nu exista exact ca sa nu revelam informatii
                    JsonView.send(exchange, 200,
                            "{\"message\":\"Dacă emailul există, vei primi un link de resetare.\"}");
                    return;
                }

                String token = ForgetPasswordTokenGenerator.generateToken();
                LocalDateTime expirationDate = LocalDateTime.now().plusHours(1);
                String expirationDateStr = expirationDate.format(FORMATTER);

                try {
                    UserModel.deleteExistingToken(user.getId());
                    UserModel.insertNewToken(user.getId(), token, expirationDateStr);
                } catch (SQLException ex) {
                    ex.printStackTrace();
                    JsonView.send(exchange, 500,
                            "{\"message\":\"Eroare la salvarea tokenului\"}");
                    return;
                }

                String bodyEmail = EmailTemplate.createResetPasswordEmailHtml(
                        user.getFirstName() + " " + user.getLastName(), token
                );
                EmailSender.sendEmail(email, "Resetare parola", bodyEmail);

                JsonView.send(exchange, 200,
                        "{\"message\":\"Dacă emailul există, vei primi un link de resetare.\"}");

            } catch (Exception e) {
                e.printStackTrace();
                JsonView.send(exchange, 500,
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
                    JsonView.send(exchange, 400, "{\"message\":\"Token is required\"}");
                    return;
                }

                // 1) Obținem data de expirare a token-ului din BD (sau null dacă nu există)
                LocalDateTime expirationDate;
                try {
                    expirationDate = UserModel.getForgotPasswordExpiration(token);
                } catch (Exception ex) {
                    ex.printStackTrace();
                    JsonView.send(exchange, 500, "{\"message\":\"Eroare la validarea tokenului\"}");
                    return;
                }

                // 2) Dacă nu există nicio intrare cu acel token => e invalid
                if (expirationDate == null) {
                    JsonView.send(exchange, 400, "{\"message\":\"Invalid token\"}");
                    return;
                }

                // 3) Verificăm dacă s-a expirat
                if (LocalDateTime.now().isAfter(expirationDate)) {
                    JsonView.send(exchange, 400, "{\"message\":\"Token expired\"}");
                    return;
                }

                // 4) Dacă ajungem aici, token-ul există și nu a expirat
                JsonView.send(exchange, 200, "{\"message\":\"Token valid\"}");


            } catch (Exception e) {
                e.printStackTrace();
                JsonView.send(exchange, 400, "{\"message\":\"Invalid request format\"}");
            }
        }
    }

    public static class ResetPassword implements HttpHandler {

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
                String token       = json.optString("token", null);
                String newPassword = json.optString("newPassword", null);

                if (token == null || token.isEmpty()) {
                    JsonView.send(exchange, 400, "{\"message\":\"Token is required\"}");
                    return;
                }
                if (newPassword == null || newPassword.isEmpty()) {
                    JsonView.send(exchange, 400, "{\"message\":\"New password is required\"}");
                    return;
                }

                int userId;
                try {
                    userId = UserModel.validateResetPasswordToken(token);
                } catch (TokenInvalidException ex) {
                    JsonView.send(exchange, 400, "{\"message\":\"Invalid token\"}");
                    return;
                } catch (TokenExpiredException ex) {
                    JsonView.send(exchange, 400, "{\"message\":\"Token expired\"}");
                    return;
                } catch (Exception ex) {
                    ex.printStackTrace();
                    JsonView.send(exchange, 500, "{\"message\":\"Eroare la implementare\"}");
                    return;
                }

                try {
                    String hashed = BCrypt.hashPassword(newPassword);
                    UserModel.updateUserPassword(userId, hashed);
                } catch (Exception ex) {
                    ex.printStackTrace();
                    JsonView.send(exchange, 500, "{\"message\":\"Eroare la resetarea parolei\"}");
                    return;
                }

                try {
                    UserModel.deleteForgotPasswordTokenByUserId(userId);
                } catch (Exception ex) {
                    //chiar daca pica deletu la token este ok
                    ex.printStackTrace();
                }

                try {
                    User user = UserModel.getUserById(userId);
                    if (user != null) {
                        String bodyEmail = EmailTemplate.createPasswordResetSuccessEmailHtml(
                                user.getFirstName() + " " + user.getLastName()
                        );
                        EmailSender.sendEmail(user.getEmail(), "Parolă resetată", bodyEmail);
                    }
                } catch (Exception ex) {
                    ex.printStackTrace();
                }

                JsonView.send(exchange, 200, "{\"message\":\"Parola a fost resetata cu succes!\"}");

            } catch (Exception e) {
                e.printStackTrace();
                JsonView.send(exchange, 500, "{\"message\":\"Invalid JSON format\"}");
            }
        }
    }
}
