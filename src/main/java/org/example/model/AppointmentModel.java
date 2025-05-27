package org.example.model;

import org.json.JSONArray;

import java.sql.*;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

public class AppointmentModel {
    public static String getAppointmentsForDate(String dateString) {
        Set<Integer> times = new HashSet<>();
        try (Connection conn = DriverManager.getConnection("jdbc:sqlite:service_booking.db")) {
            String sql = "SELECT start_time,end_time FROM appointments WHERE date = ?";

            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, dateString);

                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        int startTime = Integer.parseInt(rs.getString("start_time"));
                        int endTime = Integer.parseInt(rs.getString("end_time"));
                        for(int i = startTime; i < endTime; i++) {
                            times.add(i);
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            return "[]";
        }

        JSONArray hoursJson = new JSONArray(Arrays.stream(times.toArray()).map(time-> time.toString()).collect(Collectors.toSet()));
        System.out.println(hoursJson);
        return hoursJson.toString();
    }
}

