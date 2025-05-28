package org.example.utils;

// Database schema and creation class for motorcycle/bike/scooter service booking system

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

public class DatabaseInitializer {
    public static void initialize() {
        try (Connection conn = DriverManager.getConnection("jdbc:sqlite:service_booking.db")) {
            Statement stmt = conn.createStatement();


//            stmt.execute("DROP TABLE IF EXISTS supplier_orders;");
//            stmt.execute("DROP TABLE IF EXISTS media;");
//            stmt.execute("DROP TABLE IF EXISTS appointments;");
//            stmt.execute("DROP TABLE IF EXISTS inventory;");
//            stmt.execute("DROP TABLE IF EXISTS users;");

            // Clients
            //role_id 1 = client
            //role_id 2 = employee
            //role_id 3 = admin
            stmt.execute("""
                        CREATE TABLE IF NOT EXISTS users (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            first_name TEXT NOT NULL,
                            last_name TEXT  NOT NULL,
                            role_id INTEGER NOT NULL,
                            password TEXT NOT NULL,
                            phone_number TEXT NOT NULL,
                            email TEXT NOT NULL
                        );
                    """);
            stmt.execute("""
                    CREATE TABLE IF NOT EXISTS forgot_password (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        token TEXT NOT NULL,
                        expiration_date TEXT NOT NULL,
                        FOREIGN KEY(user_id) REFERENCES users(id)
                    );
                    """);

            // Appointments
                        stmt.execute("""
                CREATE TABLE IF NOT EXISTS appointments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    client_id INTEGER NOT NULL,
                    date TEXT NOT NULL,
                    start_time TEXT NOT NULL,
                    end_time TEXT NOT NULL,
                    vehicle_brand TEXT,
                    vehicle_model TEXT,
                    vehicle_type TEXT NOT NULL,
                    description TEXT NOT NULL,
                    status TEXT DEFAULT 'pending', --canceled(clientul anuleaza), pending,approved,rejected,completed(treb gandit daca mai treb)
                    admin_message TEXT,
                    estimated_price REAL,
                    warranty_months INTEGER,
                    FOREIGN KEY(client_id) REFERENCES users(id)
                );
            """);

            // Media
            stmt.execute("""
                        CREATE TABLE IF NOT EXISTS media (
                          id             INTEGER PRIMARY KEY AUTOINCREMENT,
                          appointment_id INTEGER NOT NULL,
                          file_name      TEXT,
                          type      TEXT,
                          file_data      BLOB,
                          FOREIGN KEY(appointment_id) REFERENCES appointments(id)
                        );
                    """);

            // Inventory

            //pk id nume_furnizor nume_produs
//            stmt.execute("""
//                        CREATE TABLE IF NOT EXISTS inventory (
//                            id INTEGER PRIMARY KEY AUTOINCREMENT,
//                            name TEXT NOT NULL,
//                            category TEXT NOT NULL,
//                            quantity INTEGER NOT NULL,
//                            price REAL NOT NULL,
//                            supplier TEXT NOT NULL,
//                            status TEXT DEFAULT '' --in-stock , out-of-stock, low-stock,ordered
//                        );
//                    """);
            stmt.execute("""
                    CREATE TABLE IF NOT EXISTS inventory (
                        id        INTEGER      NOT NULL,
                        name      TEXT         NOT NULL,
                        category  INTEGER         NOT NULL,
                        quantity  INTEGER      NOT NULL,
                        price     REAL         NOT NULL,
                        supplier  TEXT         NOT NULL,
                        status    TEXT    DEFAULT '' , -- in-stock, out-of-stock, low-stock, ordered
                        PRIMARY KEY (id, supplier, name)
                        FOREIGN KEY (category) REFERENCES category(id)
                    );
                """);

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS category (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE
                );
            """);

            stmt.execute("""
                INSERT INTO category (name) VALUES
                -- Sistem de frânare: plăcuțe, discuri, saboți, lichid de frână, manete
                ('Brake System'),
                
                -- Sistem de transmisie: lanțuri, pinioane, foi, curele, casete, deraioare
                ('Transmission System'),
                
                -- Roți și anvelope: cauciucuri, camere, jante, valve
                ('Wheels and Tires'),
                
                -- Suspensie și furcă: furcă față, amortizoare spate, arcuri
                ('Suspension and Fork'),
                
                -- Componente electrice: fire, senzori, leduri, mufe, panou de control, accelerometru
                ('Electrical Components'),
                
                -- Baterii și încărcare: acumulatori Li-Ion, încărcătoare, conectori, adaptoare
                ('Battery and Charging'),
                
                -- Iluminat: faruri, stopuri, semnalizatoare, becuri LED
                ('Lighting'),
                
                -- Motor și ambreiaj: bujii, ambreiaj, cilindri, pistoane, filtre de aer/ulei (pentru motociclete)
                ('Engine and Clutch'),
                
                -- Cabluri și cămăși: cabluri de frână, schimbător, accelerație, ambreiaj
                ('Cables and Housings'),
                
                -- Consumabile: ulei lanț, spray curățare frâne, lichid frână, vaselină
                ('Consumables'),
                
                -- Rulmenți, garnituri și simeringuri: rulmenți ax, simeringuri, garnituri etanșare
                ('Bearings and Seals'),
                
                -- Elemente de prindere și montaj: șuruburi, piulițe, coliere, cleme, distanțiere
                ('Fasteners and Mounts');
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
