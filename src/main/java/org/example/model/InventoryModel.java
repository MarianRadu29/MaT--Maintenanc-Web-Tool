package org.example.model;


import org.json.JSONArray;
import org.json.JSONObject;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class InventoryModel {
    // Într-un caz real, ai putea citi aceste valori dintr-un fișier de configurație sau din variabile de mediu
    private static final String DB_URL      = "jdbc:postgresql://localhost:5432/postgres";
    private static final String DB_USER     = "postgres";
    private static final String DB_PASSWORD = "student";

    /**
     * Returnează toate categoriile din tabela 'category' sub forma unui JSONArray.
     */
    public static JSONArray getAllCategories() throws SQLException {
        String sql = "SELECT id, name FROM category";
        JSONArray jsonArray = new JSONArray();

        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
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

    /**
     * Returnează toate elementele din tabela 'inventory', împreună cu numele categoriei asociate,
     * sub forma unui JSONArray.
     */
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

        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
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

        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
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
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, itemId);
            int rows = ps.executeUpdate();
            return rows > 0;
        }
    }

    public static boolean updateItem(int itemId, String name, int categoryID, int quantity, double price, String supplier, String status) throws SQLException {
        String sql = "UPDATE inventory SET name = ?, category = ?, quantity = ?, price = ?, supplier = ?, status = ? WHERE id = ?";
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
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

}

