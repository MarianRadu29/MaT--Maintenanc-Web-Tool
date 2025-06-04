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

   }
