package org.example.controller;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import org.example.model.InventoryModel;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;
import java.io.OutputStream;
import java.io.InputStreamReader;
import java.io.BufferedReader;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.stream.Collectors;

public class InventoryController {

    public static class GetCategory implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
                return;
            }

            try {
                JSONArray categories = InventoryModel.getAllCategories();
                byte[] responseBytes = categories.toString().getBytes(StandardCharsets.UTF_8);

                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(200, responseBytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(responseBytes);
                }
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

            try {
                JSONArray inventory = InventoryModel.getAllInventory();
                byte[] responseBytes = inventory.toString().getBytes(StandardCharsets.UTF_8);

                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(200, responseBytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(responseBytes);
                }
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
                boolean success = InventoryModel.addItem(name, categoryID, quantity, price, supplier, status);
                if (success) {
                    JSONObject resp = new JSONObject();
                    resp.put("status", "success");
                    resp.put("message", "Item added successfully.");

                    byte[] responseBytes = resp.toString().getBytes(StandardCharsets.UTF_8);
                    exchange.getResponseHeaders().set("Content-Type", "application/json");
                    exchange.sendResponseHeaders(200, responseBytes.length);
                    try (OutputStream os = exchange.getResponseBody()) {
                        os.write(responseBytes);
                    }
                } else {
                    exchange.sendResponseHeaders(500, -1);
                }
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
                    JSONObject resp = new JSONObject();
                    resp.put("status", "success");
                    resp.put("message", "Item updated successfully.");

                    byte[] responseBytes = resp.toString().getBytes(StandardCharsets.UTF_8);
                    exchange.getResponseHeaders().set("Content-Type", "application/json");
                    exchange.sendResponseHeaders(200, responseBytes.length);
                    try (OutputStream os = exchange.getResponseBody()) {
                        os.write(responseBytes);
                    }
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
                    JSONObject resp = new JSONObject();
                    resp.put("message", "Item deleted successfully.");

                    byte[] responseBytes = resp.toString().getBytes(StandardCharsets.UTF_8);
                    exchange.getResponseHeaders().set("Content-Type", "application/json");
                    exchange.sendResponseHeaders(200, responseBytes.length);
                    try (OutputStream os = exchange.getResponseBody()) {
                        os.write(responseBytes);
                    }
                } else {
                    exchange.sendResponseHeaders(500, -1);
                }
            } catch (SQLException e) {
                if ("P0001".equals(e.getSQLState())) {
                    System.out.println("Trigger PL/pgSQL a aruncat exceptia: " + e.getMessage());
                    //conflict gen ca nu pot da delete ca am alte comenzi care folosesc acest item
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
