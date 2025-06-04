package org.example.utils;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseConnection {

    private static final String DB_URL      = "jdbc:postgresql://localhost:5432/postgres";
    private static final String DB_USER     = "postgres";
    private static final String DB_PASSWORD = "student";

    static {
        //ar trebui sa iau dintr un fisier de configurare datele de mai sus
    }

    private DatabaseConnection() { }

    public static Connection getConnection() throws  SQLException {
        return DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
    }
}
