package org.example.controller;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import lombok.SneakyThrows;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.sql.*;

public class InventoryController {
    private static final String DB_URL      = "jdbc:postgresql://localhost:5432/postgres";
    private static final String DB_USER     = "postgres";
    private static final String DB_PASSWORD = "student";

    public static class GetCategory implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
                return;
            }

            JSONArray jsonArray = new JSONArray();
            String sqlStatement = "SELECT id, name FROM category";

            try (
                    Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
                    PreparedStatement ps = conn.prepareStatement(sqlStatement)
            ) {
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        JSONObject jsonObject = new JSONObject();
                        jsonObject.put("id", rs.getInt("id"));
                        jsonObject.put("name", rs.getString("name"));
                        jsonArray.put(jsonObject);
                    }
                }
            } catch (SQLException e) {
                throw new RuntimeException(e);
            }

            String response = jsonArray.toString();
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.length());
            exchange.getResponseBody().write(response.getBytes(StandardCharsets.UTF_8));
            exchange.close();
        }
    }

    public static class GetInventory implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
                return;
            }

            JSONArray jsonArray = new JSONArray();
            String sqlStatement =
                    "SELECT i.id, i.name, i.category, i.quantity, i.price, i.supplier, i.status, c.name AS category_name " +
                            "FROM inventory i JOIN category c ON i.category = c.id";

            try (
                    Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
                    PreparedStatement ps = conn.prepareStatement(sqlStatement)
            ) {
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        JSONObject jsonObject = new JSONObject();
                        jsonObject.put("id", rs.getInt("id"));
                        jsonObject.put("name", rs.getString("name"));
                        jsonObject.put("categoryID", rs.getInt("category"));
                        jsonObject.put("quantity", rs.getInt("quantity"));
                        jsonObject.put("price", rs.getDouble("price"));
                        jsonObject.put("supplier", rs.getString("supplier"));
                        jsonObject.put("status", rs.getString("status"));
                        jsonObject.put("category", rs.getString("category_name"));
                        jsonArray.put(jsonObject);
                    }
                }
            } catch (SQLException e) {
                throw new RuntimeException(e);
            }

            String response = jsonArray.toString();
            System.out.println(response);
            byte[] responseBytes = response.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, responseBytes.length);
            exchange.getResponseBody().write(responseBytes);
            exchange.close();
        }
    }

    public static class AddItem implements HttpHandler {
        @SneakyThrows
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
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
            JSONObject json = new JSONObject(requestBody);

            String name       = json.optString("name");
            int categoryID    = json.optInt("category");
            int quantity      = json.optInt("quantity", 0);
            double price      = json.optDouble("price", 0.0);
            String supplier   = json.optString("supplier");
            String status     = json.optString("status", "in-stock");

            String sqlStmtInsert =
                    "INSERT INTO inventory (name, category, quantity, price, supplier, status) " +
                            "VALUES (?, ?, ?, ?, ?, ?)";

            try (
                    Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
                    PreparedStatement insertPS = conn.prepareStatement(sqlStmtInsert)
            ) {
                insertPS.setString(1, name);
                insertPS.setInt(2, categoryID);
                insertPS.setInt(3, quantity);
                insertPS.setDouble(4, price);
                insertPS.setString(5, supplier);
                insertPS.setString(6, status);

                int rowsAffected = insertPS.executeUpdate();
                if (rowsAffected > 0) {
                    exchange.getResponseHeaders().set("Content-Type", "application/json");
                    String response = "{\"status\": \"success\", \"message\": \"Item added successfully.\"}";
                    exchange.sendResponseHeaders(200, response.length());
                    exchange.getResponseBody().write(response.getBytes(StandardCharsets.UTF_8));
                } else {
                    exchange.sendResponseHeaders(500, -1);
                }
            } catch (SQLException e) {
                e.printStackTrace();
                exchange.sendResponseHeaders(500, -1);
            } finally {
                exchange.getResponseBody().close();
            }
        }
    }
}
