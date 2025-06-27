package org.example.model;

import org.example.objects.UserData;
import org.example.utils.BCrypt;
import org.example.utils.DatabaseConnection;

import java.sql.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;


public class UserModel {
    private static final String DB_URL      = "jdbc:postgresql://localhost:5432/postgres";
    private static final String DB_USER     = "postgres";
    private static final String DB_PASSWORD = "student";
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");


    public static boolean createUser(UserData data) {
        String sql = "INSERT INTO users(first_name, last_name, password, email, role_id, phone_number) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, data.getFirstName());
            pstmt.setString(2, data.getLastName());
            pstmt.setString(3, BCrypt.hashPassword(data.getPassword()));
            pstmt.setString(4, data.getEmail());
            pstmt.setInt(5, 1);  // rol implicit = 1 (client)
            pstmt.setString(6, data.getPhoneNumber());

            pstmt.executeUpdate();
            return true;
        } catch (SQLException e) {
            System.out.println("[create user error] " + e.getMessage());
            return false;
        }
    }

    public static UserData updateUser(UserData userData) {
        String sql = "UPDATE users SET first_name = ?, last_name = ?, email = ?, phone_number = ? WHERE id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, userData.getFirstName());
            pstmt.setString(2, userData.getLastName());
            pstmt.setString(3, userData.getEmail());
            pstmt.setString(4, userData.getPhoneNumber());
            pstmt.setInt(5, userData.getId());

            pstmt.executeUpdate();
            return userData;
        } catch (SQLException e) {
            System.out.println("[UPDATE USER ERROR] " + e.getMessage());
            return null;
        }
    }

    public static int getUserRoleId(int userId) {
        String sql = "SELECT role_id FROM users WHERE id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, userId);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("role_id");
                }
            }
        } catch (SQLException e) {
            System.out.println("[GET USER ROLE_ID ERROR] " + e.getMessage());
        }
        return -1;
    }

    public static int getUserIdByAppointmentId(int appointmentId) {
        String sql = "SELECT client_id FROM appointments WHERE id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, appointmentId);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("client_id");
                }
            }
        } catch (SQLException e) {
            System.out.println("[GET USER ID BY APPOINTMENT ID ERROR] " + e.getMessage());
        }
        return -1;
    }

    public static UserData getUserByEmail(String email) {
        String sql = "SELECT * FROM users WHERE email = ? and status='enabled'";
        try (Connection conn = DatabaseConnection.getConnection();
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
                return new UserData(firstName, lastName, password, email, id, phoneNumber, roleId);
            }
        } catch (SQLException e) {
            System.out.println("[GET USER BY EMAIL ERROR] " + e.getMessage());

        }
        return null;
    }

    public static UserData getUserById(int id) {
        String sql = "SELECT * FROM users WHERE id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setInt(1, id);
            ResultSet rs = pstmt.executeQuery();
            if (rs.next()) {
                int roleId = rs.getInt("role_id");
                String phoneNumber = rs.getString("phone_number");
                String firstName = rs.getString("first_name");
                String lastName = rs.getString("last_name");
                String password = rs.getString("password");
                String email = rs.getString("email");
                return new UserData(firstName, lastName, password, email, id, phoneNumber, roleId);
            }
        } catch (SQLException e) {
            System.out.println("[GET USER BY ID ERROR] " + e.getMessage());
        }
        return null;
    }

    public static void deleteExistingToken(int userId) throws SQLException {
        String deleteSql = "DELETE FROM forgot_password WHERE user_id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement deleteStmt = conn.prepareStatement(deleteSql)) {

            deleteStmt.setInt(1, userId);
            deleteStmt.executeUpdate();
        }
    }

    public static void insertNewToken(int userId, String token, String expirationDateStr) throws SQLException {
        String insertSql = "INSERT INTO forgot_password (user_id, token, expiration_date) VALUES (?, ?, ?)";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement insertStmt = conn.prepareStatement(insertSql)) {

            insertStmt.setInt(1, userId);
            insertStmt.setString(2, token);
            insertStmt.setString(3, expirationDateStr);
            insertStmt.executeUpdate();
        }
    }

    public static LocalDateTime getForgotPasswordExpiration(String token) throws SQLException {
        String sql = "SELECT expiration_date FROM forgot_password WHERE token = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, token);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    String expirationDateStr = rs.getString("expiration_date");
                    return LocalDateTime.parse(expirationDateStr, FORMATTER);
                } else {
                    return null;
                }
            }
        }
    }

    public static int validateResetPasswordToken(String token)
            throws Exception{
        String sql = "SELECT user_id, expiration_date FROM forgot_password WHERE token = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, token);
            try (ResultSet rs = stmt.executeQuery()) {
                if (!rs.next()) {
                    // nu există rand cu acest token
                    throw new Exception();
                }

                String expirationDateStr = rs.getString("expiration_date");
                LocalDateTime expirationDate = LocalDateTime.parse(expirationDateStr, FORMATTER);
                if (LocalDateTime.now().isAfter(expirationDate)) {
                    // token-ul a expirat
                    throw new Exception();
                }

                // token e valid
                return rs.getInt("user_id");
            }
        }
    }

    public static List<UserData> getAllUsers() throws SQLException {
        List<UserData> users = new ArrayList<>();
        String sql = "SELECT * FROM users where status <> 'disabled' ";
        try (Connection conn = DatabaseConnection.getConnection();
        PreparedStatement stmt = conn.prepareStatement(sql)) {
           var rs = stmt.executeQuery();
           while (rs.next()) {
               int id = rs.getInt("id");
               int roleId = rs.getInt("role_id");
               String phoneNumber = rs.getString("phone_number");
               String firstName = rs.getString("first_name");
               String lastName = rs.getString("last_name");
               String password = rs.getString("password");
               String email = rs.getString("email");
               users.add(new UserData(firstName, lastName, password, email, id, phoneNumber, roleId));
           }
        }
        return users;
    }

    public static int updateUserRole(int userId, int roleId) throws SQLException {
        String sql = "UPDATE users SET role_id = ? WHERE id = ?";
        int result ;
        try (Connection conn = DatabaseConnection.getConnection();
        PreparedStatement stmt = conn.prepareStatement(sql)) {
            conn.setAutoCommit(false);
            stmt.setInt(1, roleId);
            stmt.setInt(2, userId);
            result = stmt.executeUpdate();
            conn.commit();
        }
        return result;
    }

    public static void deleteUser(int userId) throws SQLException {
        String sql = "update users set status='disabled' where id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)
        ){
            pstmt.setInt(1, userId);
            pstmt.executeUpdate();
        }
    }

    public static void updateUserPassword(int userId, String hashedPassword) throws SQLException {
        String sql = "UPDATE users SET password = ? WHERE id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, hashedPassword);
            stmt.setInt(2, userId);
            stmt.executeUpdate();
        }
    }

    public static void deleteForgotPasswordTokenByUserId(int userId) throws SQLException {
        String sql = "DELETE FROM forgot_password WHERE user_id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, userId);
            stmt.executeUpdate();
        }
    }
}
