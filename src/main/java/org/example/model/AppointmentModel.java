package org.example.model;

import org.example.controller.AppointmentController.FileUploadData;
import org.json.JSONArray;
import org.json.JSONObject;

import java.sql.*;
import java.util.*;
import java.util.stream.Collectors;

public class AppointmentModel {
    // JDBC URL pentru PostgreSQL:
    private static final String DB_URL      = "jdbc:postgresql://localhost:5432/postgres";
    private static final String DB_USER     = "postgres";
    private static final String DB_PASSWORD = "student";

    public static String getAppointmentsForDate(String dateString) {
        Set<Integer> times = new HashSet<>();
        String sql = "SELECT start_time, end_time FROM appointments WHERE date = ? and status not in ('rejected','canceled')";

        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, dateString);

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    int startTime = Integer.parseInt(rs.getString("start_time"));
                    int endTime   = Integer.parseInt(rs.getString("end_time"));
                    for (int i = startTime; i < endTime; i++) {
                        times.add(i);
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            return new JSONArray().toString();
        }

        JSONArray hoursJson = new JSONArray(
                Arrays.stream(times.toArray())
                        .map(Object::toString)
                        .collect(Collectors.toSet())
        );
        System.out.println(hoursJson);
        return hoursJson.toString();
    }

    public static int insertAppointment(
            int clientId,
            String vehicleBrand,
            String vehicleModel,
            String problemDescription,
            String date,
            String startTime,
            String endTime,
            String vehicleType
    ) throws SQLException {
        String sql = """
            INSERT INTO appointments
              (client_id, vehicle_brand, vehicle_model,
               description, date,
               start_time, end_time, vehicle_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id;
        """;

        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, clientId);
            ps.setString(2, vehicleBrand);
            ps.setString(3, vehicleModel);
            ps.setString(4, problemDescription);
            ps.setString(5, date);
            ps.setString(6, startTime);
            ps.setString(7, endTime);
            ps.setString(8, vehicleType);

            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    throw new SQLException("Nu pot obține id-ul programării");
                }
                return rs.getInt("id");
            }
        }
    }


    public static void insertMediaFiles(int appointmentId, List<FileUploadData> files) throws SQLException {
        String sql = """
            INSERT INTO media (appointment_id, file_name, type, file_data)
            VALUES (?, ?, ?, ?);
        """;

        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
             PreparedStatement ps = conn.prepareStatement(sql)) {

            for (FileUploadData f : files) {
                if (f.content() == null ||
                        f.content().length == 0 ||
                        "application/octet-stream".equalsIgnoreCase(f.contentType())) {
                    continue;
                }
                ps.setInt(1, appointmentId);
                ps.setString(2, f.fileName());
                ps.setString(3, f.contentType());
                ps.setBytes(4, f.content());
                ps.addBatch();
            }
            ps.executeBatch();
        }
    }


    public static String getUserFullName(int userId) throws SQLException {
        String sql = "SELECT first_name, last_name FROM users WHERE id = ?";
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    String first = rs.getString("first_name");
                    String last  = rs.getString("last_name");
                    return first + " " + last;
                } else {
                    return null;
                }
            }
        }
    }



    public static JSONArray getAppointments() throws SQLException {
        JSONArray resultArray = new JSONArray();

        // 1) Query principal pentru appointments + numele clientului
        String sqlAppointments = """
            SELECT
              a.id                               AS id,
              u.last_name || ' ' || u.first_name AS clientName,
              a.vehicle_type                     AS vehicleType,
              a.vehicle_brand                    AS vehicleBrand,
              a.vehicle_model                    AS vehicleModel,
              a.description                      AS problem,
              a.date                             AS date,
              a.start_time                       AS startTime,
              a.end_time                         AS endTime,
              a.status                           AS status,
              a.admin_message                    AS adminMessage,
              a.estimated_price                  AS estimatedPrice,
              a.warranty_months                  AS warrantyMonths
            FROM appointments AS a
            JOIN users        AS u ON u.id = a.client_id
            WHERE a.status IN ('pending', 'approved', 'modified')
            ORDER BY a.date, a.start_time, a.end_time;
        """;

        // 2) Query pentru media
        String sqlMedia = "SELECT file_name FROM media WHERE appointment_id = ?";

        // 3) Query pentru order items
        String sqlOrder = """
            SELECT oi.inventory_id, oi.quantity, oi.unit_price
            FROM orders AS o
            JOIN order_items AS oi ON o.id = oi.order_id
            WHERE o.appointment_id = ?
        """;

        try (
                Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
                PreparedStatement psAppt = conn.prepareStatement(sqlAppointments);
                PreparedStatement psMedia = conn.prepareStatement(sqlMedia);
                PreparedStatement psOrder = conn.prepareStatement(sqlOrder);
                ResultSet rsAppt = psAppt.executeQuery()
        ) {
            while (rsAppt.next()) {
                int    id             = rsAppt.getInt("id");
                String clientName     = rsAppt.getString("clientName");
                String vehicleType    = rsAppt.getString("vehicleType");
                String brand          = rsAppt.getString("vehicleBrand");
                String model          = rsAppt.getString("vehicleModel");
                String problem        = rsAppt.getString("problem");
                String date           = rsAppt.getString("date");
                String startTime      = rsAppt.getString("startTime");
                String endTime        = rsAppt.getString("endTime");
                String status         = rsAppt.getString("status");
                String adminMessage   = rsAppt.getString("adminMessage");
                double estimatedPrice = rsAppt.getDouble("estimatedPrice");
                int    warrantyMonths = rsAppt.getInt("warrantyMonths");

                // 4) Detectăm dacă există atașamente (media)
                List<String> attachments = new ArrayList<>();
                psMedia.setInt(1, id);
                try (ResultSet rsMed = psMedia.executeQuery()) {
                    while (rsMed.next()) {
                        attachments.add(rsMed.getString("file_name"));
                    }
                }
                boolean hasAttachments = !attachments.isEmpty();

                // 5) Colectăm order items într-un JSONArray
                JSONArray orderArray = new JSONArray();
                psOrder.setInt(1, id);
                try (ResultSet rsOrder = psOrder.executeQuery()) {
                    while (rsOrder.next()) {
                        int invId    = rsOrder.getInt("inventory_id");
                        int quantity = rsOrder.getInt("quantity");
                        double price = rsOrder.getDouble("unit_price");
                        JSONObject oi = new JSONObject()
                                .put("id",        invId)
                                .put("quantity",  quantity)
                                .put("unitPrice", price);
                        orderArray.put(oi);
                    }
                }

                // 6) Construim obiectul JSON pentru fiecare appointment
                JSONObject obj = new JSONObject()
                        .put("id",             id)
                        .put("clientName",     clientName)
                        .put("vehicleType",    vehicleType)
                        .put("vehicleBrand",   brand)
                        .put("vehicleModel",   model)
                        .put("problem",        problem)
                        .put("date",           date)
                        .put("startTime",      startTime)
                        .put("endTime",        endTime)
                        .put("status",         status)
                        .put("hasAttachments", hasAttachments)
                        .put("orderItems",     orderArray)
                        .put("adminMessage",   adminMessage)
                        .put("estimatedPrice", estimatedPrice)
                        .put("warrantyMonths", warrantyMonths);

                resultArray.put(obj);
            }
        }

        return resultArray;
    }




    public static JSONArray getAppointmentsByClientId(int clientId) throws SQLException {
        JSONArray resultArray = new JSONArray();

        String sqlAppointments = """
            SELECT
              a.id                               AS id,
              u.last_name || ' ' || u.first_name AS clientName,
              a.vehicle_type                     AS vehicleType,
              a.vehicle_brand                    AS vehicleBrand,
              a.vehicle_model                    AS vehicleModel,
              a.description                      AS problem,
              a.date                             AS date,
              a.start_time                       AS startTime,
              a.end_time                         AS endTime,
              a.status                           AS status,
              a.admin_message                    AS adminMessage,
              a.estimated_price                  AS estimatedPrice,
              a.warranty_months                  AS warrantyMonths
            FROM appointments AS a
            JOIN users        AS u ON u.id = a.client_id
            WHERE a.client_id = ?
            ORDER BY a.date, a.start_time, a.end_time;
        """;

        String sqlMedia = "SELECT file_name FROM media WHERE appointment_id = ?";
        String sqlOrder = """
            SELECT oi.inventory_id, oi.quantity, oi.unit_price
            FROM orders AS o
            JOIN order_items AS oi ON o.id = oi.order_id
            WHERE o.appointment_id = ?
        """;

        try (
                Connection conn   = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
                PreparedStatement psAppt = conn.prepareStatement(sqlAppointments);
                PreparedStatement psMedia = conn.prepareStatement(sqlMedia);
                PreparedStatement psOrder = conn.prepareStatement(sqlOrder)
        ) {
            psAppt.setInt(1, clientId);
            try (ResultSet rsAppt = psAppt.executeQuery()) {
                while (rsAppt.next()) {
                    int    id             = rsAppt.getInt("id");
                    String clientName     = rsAppt.getString("clientName");
                    String vehicleType    = rsAppt.getString("vehicleType");
                    String brand          = rsAppt.getString("vehicleBrand");
                    String model          = rsAppt.getString("vehicleModel");
                    String problem        = rsAppt.getString("problem");
                    String date           = rsAppt.getString("date");
                    String startTime      = rsAppt.getString("startTime");
                    String endTime        = rsAppt.getString("endTime");
                    String status         = rsAppt.getString("status");
                    String adminMessage   = rsAppt.getString("adminMessage");
                    double estimatedPrice = rsAppt.getDouble("estimatedPrice");
                    int    warrantyMonths = rsAppt.getInt("warrantyMonths");

                    // 1) Obținem lista de fișiere atașate (media)
                    List<String> attachments = new ArrayList<>();
                    psMedia.setInt(1, id);
                    try (ResultSet rsMed = psMedia.executeQuery()) {
                        while (rsMed.next()) {
                            attachments.add(rsMed.getString("file_name"));
                        }
                    }
                    boolean hasAttachments = !attachments.isEmpty();

                    // 2) Construim JSONArray pentru order items
                    JSONArray orderArray = new JSONArray();
                    psOrder.setInt(1, id);
                    try (ResultSet rsOrder = psOrder.executeQuery()) {
                        while (rsOrder.next()) {
                            int    invId    = rsOrder.getInt("inventory_id");
                            int    quantity = rsOrder.getInt("quantity");
                            double price    = rsOrder.getDouble("unit_price");
                            JSONObject oi = new JSONObject()
                                    .put("id",        invId)
                                    .put("quantity",  quantity)
                                    .put("unitPrice", price);
                            orderArray.put(oi);
                        }
                    }

                    // 3) Construim obiectul JSON pentru această programare
                    JSONObject obj = new JSONObject()
                            .put("id",             id)
                            .put("clientName",     clientName)
                            .put("vehicleType",    vehicleType)
                            .put("vehicleBrand",   brand)
                            .put("vehicleModel",   model)
                            .put("problem",        problem)
                            .put("date",           date)
                            .put("startTime",      startTime)
                            .put("endTime",        endTime)
                            .put("status",         status)
                            .put("hasAttachments", hasAttachments)
                            .put("orderItems",     orderArray)
                            .put("adminMessage",   adminMessage)
                            .put("estimatedPrice", estimatedPrice)
                            .put("warrantyMonths", warrantyMonths);

                    resultArray.put(obj);
                }
            }
        }

        return resultArray;
    }

    public static List<FileUploadData> getMediaFiles(int appointmentId) throws SQLException {
        String sql = "SELECT file_name, type, file_data FROM media WHERE appointment_id = ?";

        List<FileUploadData> files = new ArrayList<>();
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, appointmentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String fileName    = rs.getString("file_name");
                    String contentType = rs.getString("type");
                    byte[] content     = rs.getBytes("file_data");

                    // Pentru câmpul fieldName punem "fileUpload" ca placeholder
                    files.add(new FileUploadData(
                            "fileUpload",
                            fileName,
                            contentType,
                            content
                    ));
                }
            }
        }
        return files;
    }

}
