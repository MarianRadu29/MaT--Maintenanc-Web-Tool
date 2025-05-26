package org.example.model;

import org.example.objects.User;
import org.example.utils.BCrypt;

import java.sql.*;

public class UserModel {
    private static final String DB_URL = "jdbc:sqlite:service_booking.db";

    public static boolean createUser(User data) {
        String sql = "INSERT INTO users(first_name,last_name, password, email,role_id,phone_number) VALUES (?,?, ?, ?,?,?)";
        try (Connection conn = DriverManager.getConnection(DB_URL);
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, data.getFirstName());
            pstmt.setString(2, data.getLastName());
            pstmt.setString(3, BCrypt.hashPassword(data.getPassword()));
            pstmt.setString(4, data.getEmail());
            pstmt.setInt(5, 1);
            pstmt.setString(6, data.getPhoneNumber());

            pstmt.executeUpdate();
            return true;
        } catch (SQLException e) {
            System.out.println("[create user error] " + e.getMessage());
            return false;
        }
    }

    public static User updateUser(User user){
        String sql = "UPDATE users SET first_name = ?, last_name = ?, email = ?, phone_number = ? WHERE id = ?";
        try (Connection conn = DriverManager.getConnection(DB_URL);
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, user.getFirstName());
            pstmt.setString(2, user.getLastName());
            pstmt.setString(3, user.getEmail());
            pstmt.setString(4, user.getPhoneNumber());
            pstmt.setInt(5, user.getId());

            pstmt.executeUpdate();
            return user;
        } catch (SQLException e) {
            System.out.println("[UPDATE USER ERROR] " + e.getMessage());
        }
        return null;
    }

    public static User getUserByEmail(String email) {
        String sql = "SELECT * FROM users WHERE email = ?";
        try (Connection conn = DriverManager.getConnection(DB_URL);
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, email);
            ResultSet rs = pstmt.executeQuery();
            if (rs.next()) {
                int id = rs.getInt("id");
                int roleId = rs.getInt("role_id");
                String phoneNumber = rs.getString("phone_number");
                String firstName = rs.getString("first_name");
                String lastName = rs.getString("last_name");
                String password = rs.getString("password");
                return new User(firstName, lastName, password, email, id, phoneNumber, roleId);
            }
        } catch (SQLException e) {
            System.out.println("[GET USER BY EMAIL ERROR] " + e.getMessage());
        }
        return null;
    }


    public static User getUserById(int id) {
        String sql = "SELECT * FROM users WHERE id = ?";
        try (Connection conn = DriverManager.getConnection(DB_URL);
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1,id);
            ResultSet rs = pstmt.executeQuery();
            if (rs.next()) {
                int roleId = rs.getInt("role_id");
                String phoneNumber = rs.getString("phone_number");
                String firstName = rs.getString("first_name");
                String lastName = rs.getString("last_name");
                String password = rs.getString("password");
                String email = rs.getString("email");
                return new User(firstName, lastName, password, email, id, phoneNumber, roleId);
            }
        } catch (SQLException e) {
            System.out.println("[GET USER BY EMAIL ERROR] " + e.getMessage());
        }
        return null;
    }
}
