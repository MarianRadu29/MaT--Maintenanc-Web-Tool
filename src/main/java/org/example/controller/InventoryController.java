package org.example.controller;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.example.model.InventoryModel;
import org.example.model.UserModel;
import org.example.utils.Cookie;
import org.example.utils.JwtUtil;
import org.example.utils.JsonSender;
import org.example.utils.Sanitizer;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.util.*;
import java.util.stream.Collectors;

import static org.example.model.InventoryModel.getOrderedInventory;

public class InventoryController {

    public static class GetCategory implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
                return;
            }

            String token = Cookie.getValue(exchange, "token");
            if(token == null) {
                JsonSender.send(exchange, 401, "{\"message\":\"Missing or invalid token\"}");
                return;
            }
            Map<String, Object> claims = JwtUtil.validateAndExtractClaims(token);

            if (claims == null) {
                JsonSender.send(exchange, 401, "{\"message\":\"Invalid or expired token\"}");
                return;
            }

            int userId = (int) claims.get("id");
            int user = UserModel.getUserRoleId(userId);
            if(user!=3){
                JsonSender.send(exchange, 403, "{\"message\":\"Forbidden\"}");
                return;
            }

            try {
                JSONArray categories = InventoryModel.getAllCategories();
                JsonSender.send(exchange, 200, categories.toString());
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

            String token = Cookie.getValue(exchange, "token");
            if(token == null) {
                JsonSender.send(exchange, 401, "{\"message\":\"Missing or invalid token\"}");
                return;
            }
            Map<String, Object> claims = JwtUtil.validateAndExtractClaims(token);

            if (claims == null) {
                JsonSender.send(exchange, 401, "{\"message\":\"Invalid or expired token\"}");
                return;
            }

            int userId = (int) claims.get("id");
            int user = UserModel.getUserRoleId(userId);
            if(user!=3){
                JsonSender.send(exchange, 403, "{\"message\":\"Forbidden\"}");
                return;
            }

            try {
                JSONArray inventory = InventoryModel.getAllInventory();
               JsonSender.send(exchange, 200, inventory.toString());
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

            String token = Cookie.getValue(exchange, "token");
            if(token == null) {
                JsonSender.send(exchange, 401, "{\"message\":\"Missing or invalid token\"}");
                return;
            }
            Map<String, Object> claims = JwtUtil.validateAndExtractClaims(token);

            if (claims == null) {
                JsonSender.send(exchange, 401, "{\"message\":\"Invalid or expired token\"}");
                return;
            }

            int userId = (int) claims.get("id");
            int user = UserModel.getUserRoleId(userId);
            if(user!=3){
                JsonSender.send(exchange, 403, "{\"message\":\"Forbidden\"}");
                return;
            }

            String requestBody = new BufferedReader(
                    new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8)
            ).lines().collect(Collectors.joining());

            JSONObject json = new JSONObject(requestBody);
            String name       = Sanitizer.sanitizeJavaScript(Sanitizer.sanitizeHtml(json.optString("name")));
            int categoryID    = json.optInt("category");
            int quantity      = json.optInt("quantity", 0);
            double price      = json.optDouble("price", 0.0);
            String supplier   = Sanitizer.sanitizeJavaScript(Sanitizer.sanitizeHtml(json.optString("supplier")));
            String status     = Sanitizer.sanitizeJavaScript(Sanitizer.sanitizeHtml(json.optString("status", "in-stock")));

            try {
                InventoryModel.addItem(name, categoryID, quantity, price, supplier, status);
                    JSONObject res = new JSONObject();
                    res.put("message", "Item added successfully.");

                   JsonSender.send(exchange, 200, res.toString());

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

            String token = Cookie.getValue(exchange, "token");
            if(token == null) {
                JsonSender.send(exchange, 401, "{\"message\":\"Missing or invalid token\"}");
                return;
            }
            Map<String, Object> claims = JwtUtil.validateAndExtractClaims(token);

            if (claims == null) {
                JsonSender.send(exchange, 401, "{\"message\":\"Invalid or expired token\"}");
                return;
            }

            int userId = (int) claims.get("id");
            int user = UserModel.getUserRoleId(userId);
            if(user!=3){
                JsonSender.send(exchange, 403, "{\"message\":\"Forbidden\"}");
                return;
            }

            String requestBody = new BufferedReader(
                    new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8)
            ).lines().collect(Collectors.joining());

            JSONObject json = new JSONObject(requestBody);
            int itemId       = json.optInt("id");
            String name      = Sanitizer.sanitizeJavaScript(Sanitizer.sanitizeHtml(json.optString("name")));
            int categoryID   = json.optInt("category");
            int quantity     = json.optInt("quantity", 0);
            double price     = json.optDouble("price", 0.0);
            String supplier  = Sanitizer.sanitizeJavaScript(Sanitizer.sanitizeHtml(json.optString("supplier")));
            String status    = Sanitizer.sanitizeJavaScript(Sanitizer.sanitizeHtml(json.optString("status", "in-stock")));

            try {
                boolean success = InventoryModel.updateItem(itemId, name, categoryID, quantity, price, supplier, status);
                if (success) {
                    JSONObject res = new JSONObject();
                    res.put("message", "Item updated successfully.");

                    JsonSender.send(exchange, 200, res.toString());
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

            String token = Cookie.getValue(exchange, "token");
            if(token == null) {
                JsonSender.send(exchange, 401, "{\"message\":\"Missing or invalid token\"}");
                return;
            }
            Map<String, Object> claims = JwtUtil.validateAndExtractClaims(token);

            if (claims == null) {
                JsonSender.send(exchange, 401, "{\"message\":\"Invalid or expired token\"}");
                return;
            }

            int userId = (int) claims.get("id");
            int user = UserModel.getUserRoleId(userId);
            if(user!=3){
                JsonSender.send(exchange, 403, "{\"message\":\"Forbidden\"}");
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

                   JsonSender.send(exchange, 200, res.toString());
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

    public static class ImportInventory implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
                return;
            }

            String token = Cookie.getValue(exchange, "token");
            if(token == null) {
                JsonSender.send(exchange, 401, "{\"message\":\"Missing or invalid token\"}");
                return;
            }
            Map<String, Object> claims = JwtUtil.validateAndExtractClaims(token);
            if (claims == null) {
                JsonSender.send(exchange, 401, "{\"message\":\"Invalid or expired token\"}");
                return;
            }
            int userId = (int) claims.get("id");
            int roleId = UserModel.getUserRoleId(userId);
            if (roleId != 3) {
                JsonSender.send(exchange, 403, "{\"message\":\"Forbidden\"}");
                return;
            }

            String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);

            // parsare CSV
            List<Map<String, String>> rows = new ArrayList<>();
            try (
                    Reader stringReader = new StringReader( new JSONObject(body).getString("content"));
                    CSVParser csvParser = new CSVParser(stringReader, CSVFormat.DEFAULT
                            .withFirstRecordAsHeader()
                            .withIgnoreSurroundingSpaces()
                            .withTrim())
            ) {
                List<String> expectedHeaders = Arrays.asList(
                        "name", "categoryId", "quantity", "price", "supplier", "status"
                );
                List<String> actualHeaders = csvParser.getHeaderNames();

                List<String> missing = new ArrayList<>();
                for (String h : expectedHeaders) {
                    if (!actualHeaders.contains(h)) {
                        missing.add(h);
                    }
                }
                if (!missing.isEmpty()) {
                    throw new IOException("Lipsec coloana/coloanele: " + String.join(", ", missing));
                }
                // Construim lista rows
                for (CSVRecord record : csvParser) {
                    Map<String, String> row = new HashMap<>();
                    for (String header : expectedHeaders) {
                        row.put(header, Sanitizer.sanitizeJavaScript(Sanitizer.sanitizeHtml(record.get(header))));
                    }
                    rows.add(row);
                }
            } catch (Exception e) {
                JsonSender.send(exchange, 400,
                        new JSONObject().put("message", "Invalid CSV format " + e.getMessage()).toString());
                return;
            }

            int importedCount;
            try {
                importedCount = InventoryModel.importCsvRows(rows);
            } catch (SQLException | NumberFormatException e) {
                e.printStackTrace();
                JsonSender.send(exchange, 500,
                        new JSONObject().put("message", "Internal server error").toString());
                return;
            }

            JSONObject respJson = new JSONObject();
            respJson.put("importedCount", importedCount);
            JsonSender.send(exchange, 200, respJson.toString());
        }
    }

    public static class ExportInventory implements HttpHandler {

        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
                return;
            }

            String token = Cookie.getValue(exchange, "token");
            if(token == null) {
                JsonSender.send(exchange, 401, "{\"message\":\"Missing or invalid token\"}");
                return;
            }
            Map<String, Object> claims = JwtUtil.validateAndExtractClaims(token);
            if (claims == null) {
                JsonSender.send(exchange, 401, "{\"message\":\"Invalid or expired token\"}");
                return;
            }

            int userId = (int) claims.get("id");
            int roleId = UserModel.getUserRoleId(userId);
            if (roleId !=3) {
                JsonSender.send(exchange, 403, "{\"message\":\"Forbidden\"}");
                return;
            }

            JSONArray list;
            try {
                list = getOrderedInventory();
            } catch (SQLException e) {
                e.printStackTrace();
                exchange.sendResponseHeaders(500, -1);
                return;
            }


            StringBuilder sb = new StringBuilder();
            // Header
            sb.append("Order ID,Appointment ID,Client Name,Appointment Date,Equipment Total,Grand Total,Service Total\n");

            // Linii
            for (int i = 0; i < list.length(); i++) {
                JSONObject order = list.getJSONObject(i);
                String orderId        = String.valueOf(order.getInt("orderId"));
                String appointmentId  = String.valueOf(order.getInt("appointmentId"));
                String clientName     = order.getString("clientName");
                String appointmentDate = order.getString("appointmentDate");
                String equipmentTotal = String.valueOf(order.getDouble("equipmentTotal"));
                String grandTotal     = String.valueOf(order.getDouble("grandTotal"));
                String serviceTotal   = String.valueOf(order.getDouble("serviceTotal"));

                sb.append(orderId).append(',')
                        .append(appointmentId).append(',')
                        .append(clientName).append(',')
                        .append(appointmentDate).append(',')
                        .append(equipmentTotal).append(',')
                        .append(grandTotal).append(',')
                        .append(serviceTotal).append('\n');
            }


            byte[] csvBytes = sb.toString().getBytes(StandardCharsets.UTF_8);
            String base64Content = Base64.getEncoder().encodeToString(csvBytes);

            JSONObject respJson = new JSONObject();
            respJson.put("fieldName", "file");
            respJson.put("fileName", "export_inventory.csv");
            respJson.put("contentType", "text/csv");
            respJson.put("content", base64Content);

            JsonSender.send(exchange, 200, respJson.toString());
        }
    }
}
