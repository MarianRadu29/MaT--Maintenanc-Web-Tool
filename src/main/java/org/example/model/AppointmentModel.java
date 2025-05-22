package org.example.model;

import java.sql.*;
import java.util.ArrayList;

public class AppointmentModel {
    public static String getAppointmentsForDate(String dateString) {
        StringBuilder appointmentsJson = new StringBuilder("[");

        try (Connection conn = DriverManager.getConnection("jdbc:sqlite:service_booking.db")) {
            String sql = "SELECT hour FROM appointments WHERE date = ?";

            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, dateString);

                try (ResultSet rs = stmt.executeQuery()) {
                    boolean first = true;
                    while (rs.next()) {
                        String time = rs.getString("hour");
                        if (!first) {
                            appointmentsJson.append(", ");
                        }
                        appointmentsJson.append("\"").append(time).append("\"");
                        first = false;
                    }
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "[]";
        }

        if(appointmentsJson.length() > 1) {
            appointmentsJson.append(", ");
        }
        appointmentsJson.append(" \"10\"]");
        System.out.println(appointmentsJson);
        return appointmentsJson.toString();
    }
}

