package org.example.controller;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import org.example.model.UserModel;
import org.example.objects.User;
import org.example.utils.*;
import org.example.view.JsonView;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;


public class UserController {
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final String DB_URL = "jdbc:sqlite:service_booking.db";

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

            String json = String.format("{\"id\":%d,\"roleID\":%d,\"firstName\":\"%s\",\"lastName\":\"%s\",\"email\":\"%s\",\"phoneNumber\":\"%s\"}",
                    user.getId(), user.getRoleId(), user.getFirstName(), user.getLastName(), user.getEmail(), user.getPhoneNumber());
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

            // Citim corpul cererii (body)
            StringBuilder sb = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
            }

            String requestBody = sb.toString();
            System.out.println("Daaa\n"+requestBody);
            try {
                JSONObject json = new JSONObject(requestBody);
                String firstName = json.optString("firstName", null);
                String lastName = json.optString("lastName", null);
                String phoneNumber = json.optString("phoneNumber", null);
                String emailFromJson = json.optString("email", null);

                if ((firstName == null || firstName.isEmpty()) &&
                        (lastName == null || lastName.isEmpty()) &&
                        (phoneNumber == null || phoneNumber.isEmpty())
                && (emailFromJson == null || emailFromJson.isEmpty())) {
                    JsonView.send(exchange, 400, "{\"message\":\"Not field found\"}");
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
                if(emailFromJson!=null){
                    var userEmailCheck = UserModel.getUserByEmail(emailFromJson);
                    if(user.getId()!=userEmailCheck.getId()){
                        JsonView.send(exchange, 409, "{\"message\":\"User with this email already exists\"}");

                    }
                }
                UserModel.updateUser(user);


                JsonView.send(exchange, 200, "{\"message\":\"User information updated successfully\"}");
            } catch
            (Exception e) {
                e.printStackTrace();
                JsonView.send(exchange, 400, "{\"message\":\"Invalid JSON format\"}");
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

            // Citim corpul cererii (body)
            StringBuilder sb = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
            }

            String requestBody = sb.toString();

            try {
                JSONObject json = new JSONObject(requestBody);
                String email = json.optString("email", null);

                if (email == null || email.isEmpty()) {
                    // Email lipsa in json
                    JsonView.send(exchange, 400, "{\"message\":\"Email is required\"}");
                    return;
                }

                User user = UserModel.getUserByEmail(email);

                if (user == null) {
                    JsonView.send(exchange, 200, "{\"message\":\"Dacă emailul există, vei primi un link de resetare.\"}");
                    return;
                }


                var token = ForgetPasswordTokenGenerator.generateToken();
                try (Connection conn = DriverManager.getConnection(DB_URL)) {
                    LocalDateTime expirationDate = LocalDateTime.now().plusHours(1);
                    String expirationDateStr = expirationDate.format(FORMATTER);

                    String deleteSql = "DELETE FROM forgot_password WHERE user_id = ?;";
                    try (PreparedStatement deleteStmt = conn.prepareStatement(deleteSql)) {
                        deleteStmt.setInt(1, user.getId());
                        deleteStmt.executeUpdate();
                    }

                    String insertSql = "INSERT INTO forgot_password (user_id, token, expiration_date) VALUES (?, ?, ?);";
                    try (PreparedStatement insertStmt = conn.prepareStatement(insertSql)) {
                        insertStmt.setInt(1, user.getId());
                        insertStmt.setString(2, token);
                        insertStmt.setString(3, expirationDateStr);
                        insertStmt.executeUpdate();
                    }
                } catch (SQLException ex) {
                    ex.printStackTrace();
                    JsonView.send(exchange, 500, "{\"message\":\"Eroare la salvarea tokenului\"}");
                    return;
                }

                String bodyEmail = EmailTemplate.createResetPasswordEmailHtml(user.getFirstName() + " " + user.getLastName(),token);
                System.out.println(bodyEmail);
                System.out.println(email);
                EmailSender.sendEmail(email, "Resetare parola", bodyEmail);

                JsonView.send(exchange, 200, "{\"message\":\"Dacă emailul există, vei primi un link de resetare.\"}");

            } catch (Exception e) {
                e.printStackTrace();
                JsonView.send(exchange, 400, "{\"message\":\"Invalid JSON format\"}");
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
                var map = Utils.parseQuery(query);
                String token =map.get("token");

                if (token == null || token.isEmpty()) {
                    // Token lipsa in json
                    JsonView.send(exchange, 400, "{\"message\":\"Token is required\"}");
                    return;
                }

                try (Connection conn = DriverManager.getConnection(DB_URL)) {
                    String sql = "SELECT * FROM forgot_password WHERE token = ?;";
                    try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                        stmt.setString(1, token);
                        var rs = stmt.executeQuery();
                        if (rs.next()) {
                            LocalDateTime expirationDate = LocalDateTime.parse(rs.getString("expiration_date"), FORMATTER);
                            if (LocalDateTime.now().isAfter(expirationDate)) {
                                JsonView.send(exchange, 400, "{\"message\":\"Token expired\"}");
                                return;
                            }
                            JsonView.send(exchange, 200, "{\"message\":\"Token valid\"}");
                        } else {
                            JsonView.send(exchange, 400, "{\"message\":\"Invalid token\"}");
                        }
                    }
                } catch (SQLException ex) {
                    ex.printStackTrace();
                    JsonView.send(exchange, 500, "{\"message\":\"Eroare la validarea tokenului\"}");
                }
            } catch (Exception e) {
                e.printStackTrace();
                JsonView.send(exchange, 400, "{\"message\":\"Invalid JSON format\"}");
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
            // Citim corpul cererii (body)
            StringBuilder sb = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
            }
            String requestBody = sb.toString();
            try {
                JSONObject json = new JSONObject(requestBody);
                String token = json.optString("token", null);
                String newPassword = json.optString("newPassword", null);

                if (token == null || token.isEmpty()) {
                    // Token lipsa in json
                    JsonView.send(exchange, 400, "{\"message\":\"Token is required\"}");
                    return;
                }

                if (newPassword == null || newPassword.isEmpty()) {
                    // Password lipsa in json
                    JsonView.send(exchange, 400, "{\"message\":\"New password is required\"}");
                    return;
                }

                try (Connection conn = DriverManager.getConnection(DB_URL)) {
                    String sql = "SELECT * FROM forgot_password WHERE token = ?;";
                    try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                        stmt.setString(1, token);
                        var rs = stmt.executeQuery();
                        if (rs.next()) {
                            LocalDateTime expirationDate = LocalDateTime.parse(rs.getString("expiration_date"), FORMATTER);
                            if (LocalDateTime.now().isAfter(expirationDate)) {
                                JsonView.send(exchange, 400, "{\"message\":\"Token expired\"}");
                                return;
                            }
                            int userId = rs.getInt("user_id");
//                            UserModel.updatePassword(userId, newPassword);
                             String sqlUpdate = "UPDATE users SET password = ? WHERE id = ?";
                            try (PreparedStatement updateStmt = conn.prepareStatement(sqlUpdate)) {
                                updateStmt.setString(1, BCrypt.hashPassword(newPassword));
                                updateStmt.setInt(2, userId);
                                updateStmt.executeUpdate();
                            }
                            String deleteSql = "DELETE FROM forgot_password WHERE user_id = ?;";
                            try (PreparedStatement deleteStmt = conn.prepareStatement(deleteSql)) {
                                deleteStmt.setInt(1, userId);
                                deleteStmt.executeUpdate();
                            }
                            // Trimitem un email de confirmare
                            User user = UserModel.getUserById(userId);
                            String bodyEmail = EmailTemplate.createPasswordResetSuccessEmailHtml(user.getFirstName() + " " + user.getLastName());
                            EmailSender.sendEmail(user.getEmail(), "Parola resetata", bodyEmail);


                            JsonView.send(exchange, 200, "{\"message\":\"Parola a fost resetata cu succes!\"}");
                        } else {
                            JsonView.send(exchange, 400, "{\"message\":\"Invalid token\"}");
                        }
                    }
                } catch (SQLException ex) {
                    ex.printStackTrace();
                    JsonView.send(exchange, 500, "{\"message\":\"Eroare la resetarea parolei\"}");
                }
            } catch (Exception e) {
                e.printStackTrace();
                JsonView.send(exchange, 400, "{\"message\":\"Invalid JSON format\"}");
            }
        }
    }
}

