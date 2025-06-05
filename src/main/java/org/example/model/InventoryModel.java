package org.example.model;


import org.example.utils.DatabaseConnection;
import org.json.JSONArray;
import org.json.JSONObject;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class InventoryModel {
    public static JSONArray getAllCategories() throws SQLException {
        String sql = "SELECT id, name FROM category";
        JSONArray jsonArray = new JSONArray();

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                JSONObject obj = new JSONObject();
                obj.put("id",   rs.getInt("id"));
                obj.put("name", rs.getString("name"));
                jsonArray.put(obj);
            }
        }

        return jsonArray;
    }

    public static JSONArray getAllInventory() throws SQLException {
        String sql = """
    SELECT i.id,
           i.name,
           i.category,
           i.quantity,
           i.price,
           i.supplier,
           i.status,
           c.name AS category_name
    FROM inventory i
    JOIN category c ON i.category = c.id
    WHERE i.status <> 'deleted'
    """;

        JSONArray jsonArray = new JSONArray();

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                JSONObject obj = new JSONObject();
                obj.put("id",          rs.getInt("id"));
                obj.put("name",        rs.getString("name"));
                obj.put("categoryID",  rs.getInt("category"));
                obj.put("quantity",    rs.getInt("quantity"));
                obj.put("price",       rs.getDouble("price"));
                obj.put("supplier",    rs.getString("supplier"));
                obj.put("status",      rs.getString("status"));
                obj.put("category",    rs.getString("category_name"));
                jsonArray.put(obj);
            }
        }

        return jsonArray;
    }


    public static boolean addItem(String name,
                                  int categoryID,
                                  int quantity,
                                  double price,
                                  String supplier,
                                  String status) throws SQLException {
        String sql =
                "INSERT INTO inventory (name, category, quantity, price, supplier, status) " +
                        "VALUES (?, ?, ?, ?, ?, ?)";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, name);
            ps.setInt(2, categoryID);
            ps.setInt(3, quantity);
            ps.setDouble(4, price);
            ps.setString(5, supplier);
            ps.setString(6, status);

            int rows = ps.executeUpdate();
            return rows > 0;
        }
    }

    public static boolean deleteItem(int itemId) throws SQLException {
        String sql = "UPDATE inventory SET status = 'deleted' WHERE id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, itemId);
            int rows = ps.executeUpdate();
            return rows > 0;
        }
    }

    public static boolean updateItem(int itemId, String name, int categoryID, int quantity, double price, String supplier, String status) throws SQLException {
        String sql = "UPDATE inventory SET name = ?, category = ?, quantity = ?, price = ?, supplier = ?, status = ? WHERE id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, name);
            ps.setInt(2, categoryID);
            ps.setInt(3, quantity);
            ps.setDouble(4, price);
            ps.setString(5, supplier);
            ps.setString(6, status);
            ps.setInt(7, itemId);
            int rows = ps.executeUpdate();
            return rows > 0;
        }
    }

    public static int importCsvRows(List<Map<String, String>> rows) throws SQLException, NumberFormatException {
        int importedCount = 0;
        try (Connection conn = DatabaseConnection.getConnection()) {
            conn.setAutoCommit(false);
            String insertSql = """
                INSERT INTO inventory (name, category, quantity, price, supplier, status)
                VALUES (?, ?, ?, ?, ?, ?)
            """;
            try (PreparedStatement ps = conn.prepareStatement(insertSql)) {
                for (Map<String, String> row : rows) {
                    String nameStr      = row.getOrDefault("name", "").trim();
                    String categoryStr  = row.getOrDefault("categoryId", "").trim();
                    String qtyStr       = row.getOrDefault("quantity", "").trim();
                    String priceStr     = row.getOrDefault("price", "").trim();
                    String supplierStr  = row.getOrDefault("supplier", "").trim();
                    String statusStr    = row.getOrDefault("status", "in-stock").trim();

                    if (nameStr.isEmpty() || categoryStr.isEmpty() || qtyStr.isEmpty()
                            || priceStr.isEmpty() || supplierStr.isEmpty() || statusStr.isEmpty()) {
                        continue;
                    }

                    int quantity     = Integer.parseInt(qtyStr);
                    double price     = Double.parseDouble(priceStr);
                    int categoryId   = Integer.parseInt(categoryStr);

                    ps.setString(1, nameStr);
                    ps.setInt(2, categoryId);
                    ps.setInt(3, quantity);
                    ps.setDouble(4, price);
                    ps.setString(5, supplierStr);
                    ps.setString(6, statusStr);
                    ps.addBatch();
                    importedCount++;
                }
                ps.executeBatch();
            }
            conn.commit();
        }
        return importedCount;
    }

    public static JSONArray getOrderedInventory() throws SQLException {
        String sql = """
            
                SELECT
                             o.id AS order_id,
                             o.appointment_id,
                             u.first_name || ' ' || u.last_name AS client_name,
                             a.date AS appointment_date,
                             COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS equipment_total,
                             o.estimated_total + COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS grand_total,
                             o.estimated_total AS service_total
                         FROM orders o
                         JOIN appointments a ON o.appointment_id = a.id
                         JOIN users u        ON a.client_id = u.id
                         LEFT JOIN order_items oi ON oi.order_id = o.id
                         WHERE o.status = 'completed'
                         GROUP BY
                             o.id,
                             o.appointment_id,
                             u.first_name,
                             u.last_name,
                             a.date,
                             o.estimated_total,
                             o.status;
                         
            """;
        JSONArray result = new JSONArray();
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                JSONObject order = new JSONObject();
                order.put( "orderId",         rs.getInt("order_id"));
                order. put("appointmentId",   rs.getInt("appointment_id")); order.put("clientName",      rs.getString("client_name"));
                order.put("appointmentDate", rs.getTimestamp("appointment_date").toString());
                order.put("equipmentTotal",  rs.getDouble("equipment_total"));
                order.put( "grandTotal",      rs.getDouble("grand_total"));
                order.put ("serviceTotal",    rs.getDouble("service_total"));

                result.put(order);
            }

        }
        return result;
    }




}


