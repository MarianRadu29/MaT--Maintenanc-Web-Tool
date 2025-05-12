package org.example.controller;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import org.example.model.UserModel;
import org.example.objects.User;
import org.example.utils.JwtUtil;
import org.example.view.JsonView;

import java.io.IOException;
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

            String json = String.format("{\"id\":%d,\"roleID\":%d,\"firstName\":\"%s\",\"lastName\":\"%s\",\"email\":\"%s\",\"phoneNumber\":\"%s\"}",
                    user.getId(), user.getRoleId(), user.getFirstName(), user.getLastName(), user.getEmail(), user.getPhoneNumber());
            JsonView.send(exchange, 200, json);
        }
    }
}

