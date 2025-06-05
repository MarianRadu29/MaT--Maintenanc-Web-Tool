package org.example.controller;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import org.example.model.InventoryModel;
import org.example.model.UserModel;
import org.example.objects.User;
import org.example.utils.JwtUtil;
import org.example.view.JsonView;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;
import java.io.OutputStream;
import java.io.InputStreamReader;
import java.io.BufferedReader;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.Map;
import java.util.stream.Collectors;

public class InventoryController {

    public static class GetCategory implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
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
            int user = UserModel.getUserRoleId(userId);
            if(user==1){
                JsonView.send(exchange, 403, "{\"message\":\"Forbidden\"}");
                return;
            }

            try {
                JSONArray categories = InventoryModel.getAllCategories();
                JsonView.send(exchange, 200, categories.toString());
            } catch (SQLException e) {
                e.printStackTrace();
                exchange.sendResponseHeaders(500, -1);
            }
        }
    }

    public static class GetInventory implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
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
            int user = UserModel.getUserRoleId(userId);
            if(user==1){
                JsonView.send(exchange, 403, "{\"message\":\"Forbidden\"}");
                return;
            }

            try {
                JSONArray inventory = InventoryModel.getAllInventory();
               JsonView.send(exchange, 200, inventory.toString());
            } catch (SQLException e) {
                e.printStackTrace();
                exchange.sendResponseHeaders(500, -1);
            }
        }
    }

    public static class AddItem implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
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
            int user = UserModel.getUserRoleId(userId);
            if(user==1){
                JsonView.send(exchange, 403, "{\"message\":\"Forbidden\"}");
                return;
            }

            String requestBody = new BufferedReader(
                    new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8)
            ).lines().collect(Collectors.joining());

            JSONObject json = new JSONObject(requestBody);
            String name       = json.optString("name");
            int categoryID    = json.optInt("category");
            int quantity      = json.optInt("quantity", 0);
            double price      = json.optDouble("price", 0.0);
            String supplier   = json.optString("supplier");
            String status     = json.optString("status", "in-stock");

            try {
                InventoryModel.addItem(name, categoryID, quantity, price, supplier, status);
                    JSONObject res = new JSONObject();
                    res.put("status", "success");
                    res.put("message", "Item added successfully.");

                   JsonView.send(exchange, 200, res.toString());

            } catch (SQLException e) {
                e.printStackTrace();
                exchange.sendResponseHeaders(500, -1);
            }
        }
    }

    public static class UpdateItem implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"PUT".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
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
            int user = UserModel.getUserRoleId(userId);
            if(user==1){
                JsonView.send(exchange, 403, "{\"message\":\"Forbidden\"}");
                return;
            }

            String requestBody = new BufferedReader(
                    new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8)
            ).lines().collect(Collectors.joining());

            JSONObject json = new JSONObject(requestBody);
            int itemId       = json.optInt("id");
            String name      = json.optString("name");
            int categoryID   = json.optInt("category");
            int quantity     = json.optInt("quantity", 0);
            double price     = json.optDouble("price", 0.0);
            String supplier  = json.optString("supplier");
            String status    = json.optString("status", "in-stock");

            try {
                boolean success = InventoryModel.updateItem(itemId, name, categoryID, quantity, price, supplier, status);
                if (success) {
                    JSONObject res = new JSONObject();
                    res.put("status", "success");
                    res.put("message", "Item updated successfully.");

                    JsonView.send(exchange, 200, res.toString());
                } else {
                    exchange.sendResponseHeaders(500, -1);
                }
            } catch (SQLException e) {
                e.printStackTrace();
                exchange.sendResponseHeaders(500, -1);
            }
        }
    }

    public static class DeleteItem implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"DELETE".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
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
            int user = UserModel.getUserRoleId(userId);
            if(user==1){
                JsonView.send(exchange, 403, "{\"message\":\"Forbidden\"}");
                return;
            }

            String path       = exchange.getRequestURI().getPath();
            String itemIdString = path.substring("/api/inventory/delete/".length());
            int itemId;
            try{
                itemId = Integer.parseInt(itemIdString);
            }catch (NumberFormatException e){
                exchange.sendResponseHeaders(400, -1);
                return;
            }
            try {
                boolean success = InventoryModel.deleteItem(itemId);
                if (success) {
                    JSONObject res = new JSONObject();
                    res.put("message", "Item deleted successfully.");

                   JsonView.send(exchange, 200, res.toString());
                } else {
                    exchange.sendResponseHeaders(500, -1);
                }
            } catch (SQLException e) {
                if ("P0001".equals(e.getSQLState())) {
                    System.out.println("Trigger PL/pgSQL a aruncat exceptia: " + e.getMessage());
                    exchange.sendResponseHeaders(409, -1);
                }
                else {
                    //eroare neprevazuta
                    e.printStackTrace();
                    exchange.sendResponseHeaders(500, -1);
                }
            }

        }
    }
}
