package org.example.controller;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import org.apache.commons.fileupload.FileItemIterator;
import org.apache.commons.fileupload.FileItemStream;
import org.apache.commons.fileupload.FileUploadException;
import org.apache.commons.fileupload.RequestContext;
import org.apache.commons.fileupload.disk.DiskFileItemFactory;
import org.apache.commons.fileupload.servlet.ServletFileUpload;
import org.apache.commons.fileupload.util.Streams;

import org.example.model.AppointmentModel;
import org.example.utils.EmailSender;
import org.example.utils.EmailTemplate;
import org.example.utils.HttpExchangeRequestContext;
import org.example.utils.JwtUtil;
import org.example.view.JsonView;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.util.*;

public class AppointmentController {

    private static final String DB_URL      = "jdbc:postgresql://localhost:5432/postgres";
    private static final String DB_USER     = "postgres";
    private static final String DB_PASSWORD = "student";

    /** Handler GET /api/appointments/day/{yyyy-MM-dd} */
    public static class GetDayAppointments implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
                return;
            }
            String path       = exchange.getRequestURI().getPath();
            String dateString = path.substring("/api/appointments/day/".length());
            String response   = AppointmentModel.getAppointmentsForDate(dateString);
            System.out.println(response);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, bytes.length);
            exchange.getResponseBody().write(bytes);
            exchange.getResponseBody().close();
        }
    }

    public record FileUploadData(String fieldName, String fileName, String contentType, byte[] content) {}

    /** Handler POST /api/appointment */
    public static class SetAppointment implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
                return;
            }

            try {
                // 1)prepare the multipart parser
                DiskFileItemFactory factory = new DiskFileItemFactory();
                ServletFileUpload upload    = new ServletFileUpload(factory);


                RequestContext ctx = new HttpExchangeRequestContext(exchange);

                Map<String,String>        fields        = new HashMap<>();
                List<FileUploadData>     uploadedFiles = new ArrayList<>();
                FileItemIterator          iter          = upload.getItemIterator(ctx);

                while (iter.hasNext()) {
                    FileItemStream item   = iter.next();
                    String          name   = item.getFieldName();
                    try (InputStream stream = item.openStream()) {
                        if (item.isFormField()) {
                            // field text
                            String value = Streams.asString(stream, StandardCharsets.UTF_8.name());
                            fields.put(name, value);
                        } else {
                            try (InputStream streamInput = item.openStream()) {
                                // reading in buffer
                                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                                byte[] buffer = new byte[4096];
                                int bytesRead;
                                while ((bytesRead = streamInput.read(buffer)) != -1) {
                                    baos.write(buffer, 0, bytesRead);
                                }
                                byte[] data = baos.toByteArray();

                                String fileName    = new File(item.getName()).getName();
                                String contentType = item.getContentType();
                                if (data.length > 0 && !("application/octet-stream".equalsIgnoreCase(contentType))) {
                                    uploadedFiles.add(new FileUploadData(
                                            item.getFieldName(),
                                            fileName,
                                            contentType,
                                            data
                                    ));
                                }
                            }
                        }
                    }
                }

                int    clientId           = Integer.parseInt(fields.get("idClient"));
                String brand              = fields.get("vehicleBrand");
                String model              = fields.get("vehicleModel");
                String problemDescription = fields.get("problemDescription");
                String date               = fields.get("appointmentDate");
                String startTime               = fields.get("appointmentStartTime");
                String endTime         = fields.get("appointmentEndTime");
                String vehicleType        = fields.get("vehicleType");
                System.out.println("clientId: " + clientId);
                System.out.println("brand: " + brand);
                System.out.println("model: " + model);
                System.out.println("problemDescription: " + problemDescription);
                System.out.println("date: " + date);
                System.out.println("startTime: " + startTime);
                System.out.println("endTime: " + endTime);
                System.out.println("vehicleType: " + vehicleType);
                System.out.println("uploadedFiles: " + uploadedFiles.size());
                uploadedFiles.forEach(f -> {
                    System.out.println("  " + f.fileName);
                    System.out.println("  " + f.contentType);
                    System.out.println("  " + f.content.length);
                });

                int appointmentId;
                String sqlA = """
    INSERT INTO appointments
      (client_id, vehicle_brand, vehicle_model,
       description, date,
       start_time, end_time, vehicle_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING id;
""";

                try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
                     PreparedStatement ps = conn.prepareStatement(sqlA)) {

                    ps.setInt(1, clientId);
                    ps.setString(2, brand);
                    ps.setString(3, model);
                    ps.setString(4, problemDescription);
                    ps.setString(5, date);
                    ps.setString(6, startTime);
                    ps.setString(7, endTime);
                    ps.setString(8, vehicleType);

                    try (ResultSet rs = ps.executeQuery()) {
                        if (!rs.next()) {
                            throw new SQLException("Nu pot obține id-ul programării");
                        }
                        appointmentId = rs.getInt("id");
                    }

                    String sqlM = """
                        INSERT INTO media (appointment_id, file_name, type, file_data)
                        VALUES (?, ?, ?, ?)
                    """;
                    try (PreparedStatement ps2 = conn.prepareStatement(sqlM)) {
                        for (FileUploadData f : uploadedFiles) {
                            if (f.content == null || f.content.length == 0 ||
                                    "application/octet-stream".equalsIgnoreCase(f.contentType)) {
                                continue;
                            }
                            ps2.setInt(1, appointmentId);
                            ps2.setString(2, f.fileName);
                            ps2.setString(3, f.contentType);
                            ps2.setBytes(4, f.content);
                            ps2.addBatch();
                        }
                        ps2.executeBatch();
                    }
                }

                String firstName = null;
                String lastName = null;
                String userSQL = "SELECT  first_name,last_name FROM users WHERE id = ?";
                try (Connection conn = DriverManager.getConnection(DB_URL,DB_USER,DB_PASSWORD);
                     PreparedStatement stmt = conn.prepareStatement(userSQL)) {
                    stmt.setInt(1, clientId);

                    try (ResultSet rs = stmt.executeQuery()) {
                        while (rs.next()) {
                           firstName = rs.getString("first_name");
                            lastName = rs.getString("last_name");
                        }
                    }
                }

                String bodyEmail = EmailTemplate.createConfirmationEmailHtml(
                        firstName + " " + lastName,
                        date,
                        startTime + ":00 - " + endTime+ ":00",
                        vehicleType,
                        problemDescription,
                        uploadedFiles.stream().map(FileUploadData::fileName).toList()
                );
                EmailSender.sendEmail("radumariansebastian29@gmail.com","Programare primita #" + appointmentId, bodyEmail);



                String resp = new JSONObject().put("appointmentId", appointmentId).toString();
                System.out.println(resp);
                JsonView.send(exchange, 200, resp);

            } catch (FileUploadException fe) {
                fe.printStackTrace();
                JsonView.send(exchange, 400, new JSONObject().put("error", "Invalid multipart request").toString());
            } catch (SQLException se) {
                se.printStackTrace();
                JsonView.send(exchange, 500, new JSONObject().put("error", "DB error").toString());
            }
        }
    }

    public static class GetAppointments implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
                return;
            }

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
                  a.start_time                             AS startTime,
                  a.end_time                             AS endTime,
                  a.status                           AS status,
                  a.admin_message                  AS adminMessage,
                    a.estimated_price                AS estimatedPrice,
                    a.warranty_months                AS warrantyMonths
                FROM appointments AS a
                JOIN users        AS u ON u.id = a.client_id
                WHERE a.status in ('pending','approved','modified')
                ORDER BY a.date, a.start_time,a.end_time;
            """;

            String sqlMedia = "SELECT * FROM media WHERE appointment_id = ?";

            try (Connection conn = DriverManager.getConnection(DB_URL,DB_USER, DB_PASSWORD);
                 PreparedStatement psAppt = conn.prepareStatement(sqlAppointments);
                 PreparedStatement psMedia = conn.prepareStatement(sqlMedia);
                 ResultSet rsAppt = psAppt.executeQuery()) {

                while (rsAppt.next()) {
                    int        id           = rsAppt.getInt("id");
                    String     clientName   = rsAppt.getString("clientName");
                    String     vehicleType  = rsAppt.getString("vehicleType");
                    String     brand        = rsAppt.getString("vehicleBrand");
                    String     model        = rsAppt.getString("vehicleModel");
                    String     problem      = rsAppt.getString("problem");
                    String     date         = rsAppt.getString("date");
                    String     startTime         = rsAppt.getString("startTime");
                    String     endTime         = rsAppt.getString("endTime");
                    String     status       = rsAppt.getString("status");
                    var adminMessage = rsAppt.getString("adminMessage");
                    var estimatedPrice = rsAppt.getDouble("estimatedPrice");
                    var warrantyMonths = rsAppt.getInt("warrantyMonths");
                    psMedia.setInt(1, id);
                    List<String> attachments = new ArrayList<>();

                    try (ResultSet rsMed = psMedia.executeQuery()) {
                        while (rsMed.next()) {
                            attachments.add(rsMed.getString("file_name"));
                        }
                    }
                    var inventoryIds = new ArrayList<>();
                    int inventoryQuantities;
                    double inventoryPrices;
                    var orderObject = new JSONArray();

                    var sqlOrder = """
                        SELECT oi.inventory_id, oi.quantity, oi.unit_price
                        FROM orders AS o
                        JOIN order_items AS oi ON o.id = oi.order_id
                        WHERE o.appointment_id = ?
                    """;
                    try (PreparedStatement psOrder = conn.prepareStatement(sqlOrder)) {
                        psOrder.setInt(1, id);
                        try (ResultSet rsOrder = psOrder.executeQuery()) {
                            while (rsOrder.next()) {
                                inventoryIds.add(rsOrder.getInt("inventory_id"));
                                inventoryQuantities = rsOrder.getInt("quantity");
                                inventoryPrices = rsOrder.getDouble("unit_price");
                                orderObject.put(new JSONObject().put("id", rsOrder.getInt("inventory_id"))
                                        .put("quantity", inventoryQuantities)
                                        .put("unitPrice", inventoryPrices));
                            }
                        }
                    }

                    JSONObject obj = new JSONObject()
                            .put("id",            id)
                            .put("clientName",    clientName)
                            .put("vehicleType",   vehicleType)
                            .put("vehicleBrand",  brand)
                            .put("vehicleModel",  model)
                            .put("problem",       problem)
                            .put("date",          date)
                            .put("endTime",          endTime)
                            .put("startTime",          startTime)
                            .put("status",        status)
                            .put("hasAttachments", !attachments.isEmpty())
                            .put("orderItems", orderObject)
                            .put("adminMessage", adminMessage)
                            .put("estimatedPrice", estimatedPrice)
                            .put("warrantyMonths", warrantyMonths);

                    resultArray.put(obj);
                }

                String response = resultArray.toString();


//                System.out.println("siii\n" + response);


                exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
                byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
                exchange.sendResponseHeaders(200, bytes.length);
                exchange.getResponseBody().write(bytes);
                exchange.getResponseBody().close();

            } catch (SQLException e) {
                e.printStackTrace();
                System.out.println("eroare "  + e.getMessage());
                JSONObject err = new JSONObject().put("error", "Database error");
                JsonView.send(exchange, 500, err.toString());
            }
        }
    }


    public static class GetAppointmentsSelf implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
                return;
            }

            String authHeader = exchange.getRequestHeaders().getFirst("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                JsonView.send(exchange, 401, "{\"message\":\"Missing or invalid token\"}");
                return;
            }

            String token = authHeader.substring(7); // Remove "Bearer "
            Map<String, Object> claims = JwtUtil.validateAndExtractClaims(token);

            if (claims == null) {
                JsonView.send(exchange, 401, "{\"message\":\"Invalid or expired token\"}");
                return;
            }


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
                  a.start_time                             AS startTime,
                  a.end_time                             AS endTime,
                  a.status                           AS status,
                   a.admin_message                  AS adminMessage,
                    a.estimated_price                AS estimatedPrice,
                    a.warranty_months                AS warrantyMonths
                FROM appointments AS a
                JOIN users        AS u ON u.id = a.client_id
                WHERE a.client_id = ?
                ORDER BY a.date, a.start_time,a.end_time;
            """;

            String sqlMedia = "SELECT * FROM media WHERE appointment_id = ?";

            try (Connection conn = DriverManager.getConnection(DB_URL,DB_USER, DB_PASSWORD);
                 PreparedStatement psAppt = conn.prepareStatement(sqlAppointments);
                 PreparedStatement psMedia = conn.prepareStatement(sqlMedia);
                 ) {

                psAppt.setInt(1, (int)claims.get("id"));
                ResultSet rsAppt = psAppt.executeQuery();
                while (rsAppt.next()) {
                    int        id           = rsAppt.getInt("id");
                    String     clientName   = rsAppt.getString("clientName");
                    String     vehicleType  = rsAppt.getString("vehicleType");
                    String     brand        = rsAppt.getString("vehicleBrand");
                    String     model        = rsAppt.getString("vehicleModel");
                    String     problem      = rsAppt.getString("problem");
                    String     date         = rsAppt.getString("date");
                    String     endTime         = rsAppt.getString("endTime");
                    String     startTime         = rsAppt.getString("startTime");
                    String     status       = rsAppt.getString("status");
                    var adminMessage = rsAppt.getString("adminMessage");
                    var estimatedPrice = rsAppt.getDouble("estimatedPrice");
                    var warrantyMonths = rsAppt.getInt("warrantyMonths");
                    // 1) Obținem lista de fișiere atașate
                    psMedia.setInt(1, id);
                    List<String> attachments = new ArrayList<>();
                    try (ResultSet rsMed = psMedia.executeQuery()) {
                        while (rsMed.next()) {
                            attachments.add(rsMed.getString("file_name"));
                        }
                    }

                    var inventoryIds = new ArrayList<>();
                    int inventoryQuantities;
                    double inventoryPrices;
                    var orderObject = new JSONArray();

                    var sqlOrder = """
                        SELECT oi.inventory_id, oi.quantity, oi.unit_price
                        FROM orders AS o
                        JOIN order_items AS oi ON o.id = oi.order_id
                        WHERE o.appointment_id = ?
                    """;
                    try (PreparedStatement psOrder = conn.prepareStatement(sqlOrder)) {
                        psOrder.setInt(1, id);
                        try (ResultSet rsOrder = psOrder.executeQuery()) {
                            while (rsOrder.next()) {
                                inventoryIds.add(rsOrder.getInt("inventory_id"));
                                inventoryQuantities = rsOrder.getInt("quantity");
                                inventoryPrices = rsOrder.getDouble("unit_price");
                                orderObject.put(new JSONObject().put("id", rsOrder.getInt("inventory_id"))
                                        .put("quantity", inventoryQuantities)
                                        .put("unitPrice", inventoryPrices));
                            }
                        }
                    }

                    // 2) Construim obiectul JSON pentru această programare
                    JSONObject obj = new JSONObject()
                            .put("id",            id)
                            .put("clientName",    clientName)
                            .put("vehicleType",   vehicleType)
                            .put("vehicleBrand",  brand)
                            .put("vehicleModel",  model)
                            .put("problem",       problem)
                            .put("date",          date)
                            .put("endTime",          endTime)
                            .put("startTime",          startTime)
                            .put("status",        status)
                            .put("hasAttachments", !attachments.isEmpty())
                            .put("orderItems", orderObject)
                            .put("adminMessage", adminMessage)
                            .put("estimatedPrice", estimatedPrice)
                            .put("warrantyMonths", warrantyMonths);
//                            .put("attachments",   new JSONArray(attachments));

                    resultArray.put(obj);
                }

                String response = resultArray.toString();


                System.out.println("siii\n" + response);


                exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
                byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
                exchange.sendResponseHeaders(200, bytes.length);
                exchange.getResponseBody().write(bytes);
                exchange.getResponseBody().close();

            } catch (SQLException e) {
                e.printStackTrace();
                System.out.println("eroare "  + e.getMessage());
                JSONObject err = new JSONObject().put("error", "Database error");
                JsonView.send(exchange, 500, err.toString());
            }
        }
    }
    public static class GetMedia implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
                return;
            }

            String path = exchange.getRequestURI().getPath();
            // expecting path like "/api/appointment/media/123"
            String idStr = path.substring("/api/appointment/media/".length());
            int appointmentId;
            try {
                appointmentId = Integer.parseInt(idStr);
            } catch (NumberFormatException e) {
                JsonView.send(exchange, 400, new JSONObject()
                        .put("error", "Invalid appointment ID")
                        .toString());
                return;
            }

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
                        // we don't have the original form field name in the DB;
                        // you can store it in another column or reuse "fileUpload"
                        files.add(new FileUploadData(
                                "fileUpload",
                                fileName,
                                contentType,
                                content
                        ));
                    }
                }

                // Build JSON response
                JSONArray arr = new JSONArray();
                for (FileUploadData f : files) {
                    JSONObject obj = new JSONObject()
                            .put("fileName",    f.fileName())
                            .put("contentType", f.contentType())
                            // Base64‐encode the byte[] so it can travel in JSON
                            .put("content",     Base64.getEncoder().encodeToString(f.content()));
                    arr.put(obj);
                }
                System.out.println("size array " + arr.length());


                byte[] responseBytes = arr.toString(4).getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
                exchange.sendResponseHeaders(200, responseBytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(responseBytes);
                }

            } catch (SQLException e) {
                e.printStackTrace();
                JsonView.send(exchange, 500, new JSONObject()
                        .put("error", "Database error: " + e.getMessage())
                        .toString());
            }
        }
    }

    public static class UpdateAppointment implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            System.out.println(exchange.getRequestMethod());
            if (!"PUT".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
                return;
            }

//            String authHeader = exchange.getRequestHeaders().getFirst("Authorization");
//
//            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
//                JsonView.send(exchange, 401, "{\"message\":\"Missing or invalid token\"}");
//                return;
//            }
//
//            String token = authHeader.substring(7); // Remove "Bearer "
//            Map<String, Object> claims = JwtUtil.validateAndExtractClaims(token);
//
//            if (claims == null) {
//                JsonView.send(exchange, 401, "{\"message\":\"Invalid or expired token\"}");
//                return;
//            }
//
//            int userId = (int) claims.get("id");
            String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            JSONObject jsonBody = new JSONObject(body);
            System.out.println(jsonBody);

            int appointmentId = jsonBody.getInt("appointmentId");
            String status = jsonBody.getString("status");
            System.out.println(status);
            String adminMessage = jsonBody.optString("adminMessage", null);


            // Validate status
            switch (status.trim().toLowerCase()) {
                //din modified in pending
                case "pending":{
                    String sql = "UPDATE appointments SET status = ? WHERE id = ?";
                    try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
                         PreparedStatement ps = conn.prepareStatement(sql)) {
                        ps.setString(1, status);
                        ps.setInt(2, appointmentId);
                        ps.executeUpdate();
                    } catch (SQLException e) {
                        e.printStackTrace();
                        JsonView.send(exchange, 500, new JSONObject().put("message","Internal server error").toString());
                        return;
                    }
                }
                break;
                case "rejected", "canceled":{
                    String sql = "UPDATE appointments SET status = ?, admin_message = ? WHERE id = ?";
                    try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
                         PreparedStatement ps = conn.prepareStatement(sql)) {
                        ps.setString(1, status);
                        ps.setString(2, adminMessage);
                        ps.setInt(3, appointmentId);
                        ps.executeUpdate();
                    } catch (SQLException e) {
                        e.printStackTrace();
                        JsonView.send(exchange, 500, new JSONObject().put("message","Internal server error").toString());
                        return;
                    }
                }
                break;
                case "approved":{

                    double estimatedPrice = jsonBody.optDouble("estimatedPrice", 0.0);
                    int warrantyMonths = jsonBody.optInt("warrantyMonths", 0);
                    JSONArray inventoryIds = jsonBody.optJSONArray("inventoryIds");

                    try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
                        conn.setAutoCommit(false);

                        // 1. Update appointment
                        String sqlUpdate = "UPDATE appointments SET status = ?, admin_message = ?, estimated_price = ?, warranty_months = ? WHERE id = ?";
                        try (PreparedStatement ps = conn.prepareStatement(sqlUpdate)) {
                            ps.setString(1, status);
                            ps.setString(2, adminMessage);
                            ps.setDouble(3, estimatedPrice);
                            ps.setInt(4, warrantyMonths);
                            ps.setInt(5, appointmentId);
                            ps.executeUpdate();
                        }

                        // 1) Inserarea comenzii în tabela orders, folosind RETURNING id
                        String sqlOrder = "INSERT INTO orders (appointment_id, estimated_total) VALUES (?, ?) RETURNING id";
                        int orderId;

                        try (PreparedStatement ps = conn.prepareStatement(sqlOrder)) {
                            ps.setInt(1, appointmentId);
                            ps.setDouble(2, estimatedPrice);

                            // executăm și citim rezultatul RETURNING
                            try (ResultSet rs = ps.executeQuery()) {
                                if (rs.next()) {
                                    orderId = rs.getInt("id");
                                } else {
                                    throw new SQLException("Nu pot obține ID-ul comenzii");
                                }
                            }
                        }



                        // 3. Insert order items
                        String sqlOrderItem = "INSERT INTO order_items (order_id, inventory_id, quantity, unit_price) VALUES (?, ?, ?, ?)";
                        try (PreparedStatement ps = conn.prepareStatement(sqlOrderItem)) {
                            for (int i = 0; i < inventoryIds.length(); i++) {
                                int inventoryId = inventoryIds.getInt(i);
                                // You may want to get quantity and price from the request or DB
                                int quantity = 1; // default, or get from request
                                double unitPrice = 0.0;
                                // Get price from inventory
                                try (PreparedStatement psInv = conn.prepareStatement("SELECT price FROM inventory WHERE id = ?")) {
                                    psInv.setInt(1, inventoryId);
                                    try (ResultSet rs = psInv.executeQuery()) {
                                        if (rs.next()) unitPrice = rs.getDouble("price");
                                    }
                                }
                                ps.setInt(1, orderId);
                                ps.setInt(2, inventoryId);
                                ps.setInt(3, quantity);
                                ps.setDouble(4, unitPrice);
                                ps.addBatch();
                            }
                            ps.executeBatch();
                        }
                        conn.commit();
                    } catch (SQLException e) {
                        e.printStackTrace();
                        JsonView.send(exchange, 500, new JSONObject().put("message", "Internal server error").toString());
                        return;
                    }
                }
                break;
                case "modified":{
                    System.out.println(status);
                    //AICI CRED CA AR TREBUI SA PRIMESC DOAR START TIME SI END TIME,pe langa status
//                    double estimatedPrice = jsonBody.optDouble("estimatedPrice", 0.0);
//                    int warrantyMonths = jsonBody.optInt("warrantyMonths", 0);
                    String newStartTime = jsonBody.optString("startTime");
                    String newEndTime = jsonBody.optString("endTime");
//                    JSONArray inventoryIds = jsonBody.optJSONArray("inventoryIds");

                    try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
                        conn.setAutoCommit(false);

                        // 1. Update appointment with new time and details
                        String sqlUpdate = "UPDATE appointments SET status = ? ,start_time = ?, end_time = ? WHERE id = ?";
                        try (PreparedStatement ps = conn.prepareStatement(sqlUpdate)) {
                            ps.setString(1, "modified");
                            ps.setString(2, newStartTime);
                            ps.setString(3, newEndTime);
                            ps.setInt(4, appointmentId);

                            ps.execute();
                        }

//                        String sqlOrder = "INSERT INTO orders (appointment_id, estimated_total) VALUES (?, ?)";
//                        int orderId;
//                        try (PreparedStatement ps = conn.prepareStatement(sqlOrder, Statement.RETURN_GENERATED_KEYS)) {
//                            ps.setInt(1, appointmentId);
//                            ps.setDouble(3, estimatedPrice);
//                            ps.executeUpdate();
//                            try (ResultSet rs = ps.getGeneratedKeys()) {
//                                if (!rs.next()) throw new SQLException("Failed to get order ID");
//                                orderId = rs.getInt(1);
//                            }
//                        }

//                        // 3. Insert order items
//                        String sqlOrderItem = "INSERT INTO order_items (order_id, inventory_id, quantity, unit_price) VALUES (?, ?, ?, ?)";
//                        try (PreparedStatement ps = conn.prepareStatement(sqlOrderItem)) {
//                            for (int i = 0; i < inventoryIds.length(); i++) {
//                                int inventoryId = inventoryIds.getInt(i);
//                                // You may want to get quantity and price from the request or DB
//                                int quantity = 1; // default, or get from request
//                                double unitPrice = 0.0;
//                                // Get price from inventory
//                                try (PreparedStatement psInv = conn.prepareStatement("SELECT price FROM inventory WHERE id = ?")) {
//                                    psInv.setInt(1, inventoryId);
//                                    try (ResultSet rs = psInv.executeQuery()) {
//                                        if (rs.next()) unitPrice = rs.getDouble("price");
//                                    }
//                                }
//                                ps.setInt(1, orderId);
//                                ps.setInt(2, inventoryId);
//                                ps.setInt(3, quantity);
//                                ps.setDouble(4, unitPrice);
//                                ps.addBatch();
//                            }
//                            ps.executeBatch();
//                        }
                        conn.commit();
                        System.out.println("Appointment modified successfully");
                    } catch (SQLException e) {
                        e.printStackTrace();
                        JsonView.send(exchange, 500, new JSONObject().put("message", "Internal server error").toString());
                        return;
                    }
                }
                break;
                case "accepted":{
                    String sql = "UPDATE appointments SET status = ? WHERE id = ?";
                    try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
                         PreparedStatement ps = conn.prepareStatement(sql)) {
                        ps.setString(1, "approved");
                        ps.setInt(2, appointmentId);
                        ps.executeUpdate();
                    } catch (SQLException e) {
                        e.printStackTrace();
                        JsonView.send(exchange, 500, new JSONObject().put("message","Internal server error").toString());
                        return;
                    }
                }
                break;
                //completed
                default: {
                    JsonView.send(exchange, 400, new JSONObject().put("message","Invalid status").toString());
                    return;
                }
            }

            JsonView.send(exchange, 200, "{\"message\":\"Appointment updated successfully\"}");

        }
    }

}
