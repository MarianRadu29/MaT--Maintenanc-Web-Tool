package org.example.controller;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import org.example.model.UserModel;
import org.example.objects.User;
import org.example.utils.*;
import org.example.view.JsonView;
import org.json.JSONObject;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

public class AuthController {
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private static Map<String, String> parseForm(InputStream is) throws IOException {
        StringBuilder sb = new StringBuilder();
        byte[] buffer = new byte[1024];
        int bytesRead;
        while ((bytesRead = is.read(buffer)) != -1) {
            sb.append(new String(buffer, 0, bytesRead, StandardCharsets.UTF_8));
        }

        Map<String, String> result = new HashMap<>();
        String[] pairs = sb.toString().split("&");
        for (String pair : pairs) {
            String[] kv = pair.split("=");
            if (kv.length == 2) {
                String key = URLDecoder.decode(kv[0], StandardCharsets.UTF_8);
                String value = URLDecoder.decode(kv[1], StandardCharsets.UTF_8);
                result.put(key, value);
            }
        }
        return result;
    }

    public static class Register implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                JsonView.send(exchange, 405, "{\"message\":\"Method Not Allowed\"}");
                return;
            }

            Map<String, String> form = parseForm(exchange.getRequestBody());

            String firstName = form.get("first_name");
            String lastName = form.get("last_name");
            String password = form.get("password");
            String email = form.get("email");
            String phoneNumber = form.get("phone_number");

            if (firstName == null || lastName == null || password == null || email == null || phoneNumber == null) {
                JsonView.send(exchange, 400, "{\"message\":\"Missing fields\"}");
                return;
            }

            var user = UserModel.getUserByEmail(email);
            if (user == null) {
                User newUser = new User(firstName, lastName, password, email, 0, phoneNumber, 1);
                UserModel.createUser(newUser);

                user = UserModel.getUserByEmail(email);
                String accessToken = JwtUtil.generateToken(user.getId(), email, 60 * 24); // 15 minute

                String json = String.format("{\"message\":\"User registered successfully\", \"accessToken\":\"%s\"}", accessToken);
                JsonView.send(exchange, 200, json);
            } else {
                JsonView.send(exchange, 409, "{\"message\":\"User already exists\"}");
            }
        }
    }

    public static class Login implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                JsonView.send(exchange, 405, "{\"message\":\"Method Not Allowed\"}");
                return;
            }

            Map<String, String> form = parseForm(exchange.getRequestBody());

            String email = form.get("email");
            String password = form.get("password");
            if (email == null || password == null) {
                JsonView.send(exchange, 400, "{\"message\":\"Missing fields\"}");
                return;
            }
            User user = UserModel.getUserByEmail(email);
            if (user != null && BCrypt.checkPassword(password, user.getPassword())) {
                String accessToken = JwtUtil.generateToken(user.getId(), email, 60 * 24);
                String json = String.format("{\"message\":\"Login successful\", \"accessToken\":\"%s\"}", accessToken);
                JsonView.send(exchange, 200, json);
            } else {
                JsonView.send(exchange, 404, "{\"message\":\"email or password is wrong\"}");
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

                LocalDateTime expirationDate;
                try {
                    expirationDate = UserModel.getForgotPasswordExpiration(token);
                } catch (Exception ex) {
                    ex.printStackTrace();
                    JsonView.send(exchange, 500, "{\"message\":\"Eroare la validarea tokenului\"}");
                    return;
                }

                if (expirationDate == null) {
                    JsonView.send(exchange, 401, "{\"message\":\"Invalid token\"}");
                    return;
                }

                if (LocalDateTime.now().isAfter(expirationDate)) {
                    JsonView.send(exchange, 401, "{\"message\":\"Token expired\"}");
                    return;
                }

                JsonView.send(exchange, 200, "{\"message\":\"Token valid\"}");


            } catch (Exception e) {
                e.printStackTrace();
                JsonView.send(exchange, 500, "{\"message\":\"Invalid request format\"}");
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
