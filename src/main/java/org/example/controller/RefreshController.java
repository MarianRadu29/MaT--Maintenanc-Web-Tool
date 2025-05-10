package org.example.controller;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import org.example.utils.JwtUtil;
import org.example.view.JsonView;

import java.io.IOException;
import java.util.Map;


public class RefreshController
{
    public static class RefreshToken implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String authHeader = exchange.getRequestHeaders().getFirst("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                JsonView.send(exchange, 401, "{\"message\":\"Missing or invalid refresh token\"}");
                return;
            }

            String token = authHeader.substring(7);
            Map<String, Object> claims = JwtUtil.validateAndExtractClaims(token);

            if (claims == null) {
                JsonView.send(exchange, 401, "{\"message\":\"Invalid or expired refresh token\"}");
                return;
            }

            int userId = (int) claims.get("id");
            String email = (String) claims.get("email");
            String newAccessToken = JwtUtil.generateToken(userId, email, 15);

            String json = String.format("{\"accessToken\":\"%s\"}", newAccessToken);
            JsonView.send(exchange, 200, json);
        }
    }
}
