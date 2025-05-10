package org.example;

// Database schema and creation class for motorcycle/bike/scooter service booking system

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

public class DatabaseInitializer {
    public static void initialize() {
        try (Connection conn = DriverManager.getConnection("jdbc:sqlite:service_booking.db")) {
            Statement stmt = conn.createStatement();


            stmt.execute("DROP TABLE IF EXISTS supplier_orders;");
            stmt.execute("DROP TABLE IF EXISTS media;");
            stmt.execute("DROP TABLE IF EXISTS appointments;");
            stmt.execute("DROP TABLE IF EXISTS inventory;");
            stmt.execute("DROP TABLE IF EXISTS users;");

            // Clients
            //role_id 1 = client
            //role_id 2 = admin
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    first_name TEXT NOT NULL,
                    last_name TEXT  NOT NULL,
                    role_id INTEGER NOT NULL,
                    password TEXT NOT NULL,
                    phone_number TEXT NOT NULL,
                    email TEXT NOT NULL,
                );
            """);

            // Appointments
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS appointments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    client_id INTEGER NOT NULL,
                    date TEXT NOT NULL,
                    time TEXT NOT NULL,
                    description TEXT,
                    status TEXT DEFAULT 'pending',
                    admin_message TEXT,
                    estimated_price REAL,
                    warranty_months INTEGER,
                    FOREIGN KEY(client_id) REFERENCES users(id)
                );
            """);

            // Media
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS media (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    appointment_id INTEGER,
                    file_path TEXT,
                    type TEXT,
                    FOREIGN KEY(appointment_id) REFERENCES appointments(id)
                );
            """);

            // Inventory
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS inventory (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    quantity INTEGER NOT NULL,
                    supplier TEXT
                );
            """);

            // Orders
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS supplier_orders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    inventory_id INTEGER,
                    quantity INTEGER,
                    order_date TEXT,
                    status TEXT,
                    FOREIGN KEY(inventory_id) REFERENCES inventory(id)
                );
            """);

            System.out.println("Database initialized successfully.");

        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
