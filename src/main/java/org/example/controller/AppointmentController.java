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
                // 1) Pregatim parser-ul multipart
                DiskFileItemFactory factory = new DiskFileItemFactory();
                ServletFileUpload upload    = new ServletFileUpload(factory);
                RequestContext ctx = new HttpExchangeRequestContext(exchange);

                Map<String, String>    fields        = new HashMap<>();
                List<FileUploadData>   uploadedFiles = new ArrayList<>();
                FileItemIterator       iter          = upload.getItemIterator(ctx);

                while (iter.hasNext()) {
                    FileItemStream item = iter.next();
                    String          name = item.getFieldName();
                    try (InputStream stream = item.openStream()) {
                        if (item.isFormField()) {
                            // camp text
                            String value = Streams.asString(stream, StandardCharsets.UTF_8.name());
                            fields.put(name, value);
                        } else {
                            // camp de fisier
                            try (InputStream streamInput = item.openStream()) {
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
                String startTime          = fields.get("appointmentStartTime");
                String endTime            = fields.get("appointmentEndTime");
                String vehicleType        = fields.get("vehicleType");

                int appointmentId = AppointmentModel.insertAppointment(
                        clientId, brand, model,
                        problemDescription,
                        date, startTime, endTime, vehicleType
                );

                AppointmentModel.insertMediaFiles(appointmentId, uploadedFiles);

                String fullName = AppointmentModel.getUserFullName(clientId);
                if (fullName == null) {
                    fullName = "";
                }

                String bodyEmail = EmailTemplate.createConfirmationEmailHtml(
                        fullName,
                        date,
                        startTime + ":00 - " + endTime + ":00",
                        vehicleType,
                        problemDescription,
                        uploadedFiles.stream().map(FileUploadData::fileName).toList()
                );
                EmailSender.sendEmail(
                        "radumariansebastian29@gmail.com",
                        "Programare primită #" + appointmentId,
                        bodyEmail
                );

                // 7) Răspuns JSON către client
                String resp = new JSONObject().put("appointmentId", appointmentId).toString();
                JsonView.send(exchange, 200, resp);

            } catch (FileUploadException fe) {
                fe.printStackTrace();
                JsonView.send(exchange, 500, new JSONObject()
                        .put("error", "Invalid multipart request")
                        .toString()
                );
            } catch (SQLException se) {
                se.printStackTrace();
                JsonView.send(exchange, 500, new JSONObject()
                        .put("error", "DB error")
                        .toString()
                );
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

            try {
                JSONArray resultArray = AppointmentModel.getAppointments();

                byte[] responseBytes = resultArray.toString().getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
                exchange.sendResponseHeaders(200, responseBytes.length);
                exchange.getResponseBody().write(responseBytes);
                exchange.getResponseBody().close();

            } catch (SQLException e) {
                e.printStackTrace();
                JSONObject err = new JSONObject().put("error", "Database error");
                byte[] errorBytes = err.toString().getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
                exchange.sendResponseHeaders(500, errorBytes.length);
                exchange.getResponseBody().write(errorBytes);
                exchange.getResponseBody().close();
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

            int clientId = (int) claims.get("id");
            try {
                // 1) Apelăm modelul pentru a obține JSONArray cu propriile programări
                JSONArray resultArray = AppointmentModel.getAppointmentsByClientId(clientId);

                // 2) Trimitem răspunsul JSON
                byte[] responseBytes = resultArray.toString().getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
                exchange.sendResponseHeaders(200, responseBytes.length);
                exchange.getResponseBody().write(responseBytes);
                exchange.getResponseBody().close();

            } catch (SQLException e) {
                e.printStackTrace();
                JSONObject err = new JSONObject().put("error", "Database error");
                byte[] errorBytes = err.toString().getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
                exchange.sendResponseHeaders(500, errorBytes.length);
                exchange.getResponseBody().write(errorBytes);
                exchange.getResponseBody().close();
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
            // așteptăm o cale de forma "/api/appointment/media/{id}"
            String idStr = path.substring("/api/appointment/media/".length());
            int appointmentId;
            try {
                appointmentId = Integer.parseInt(idStr);
            } catch (NumberFormatException e) {
                JsonView.send(exchange, 400, new JSONObject()
                        .put("error", "Invalid appointment ID")
                        .toString()
                );
                return;
            }

            try {
                // 1) Obținem lista de FileUploadData din model
                List<FileUploadData> files = AppointmentModel.getMediaFiles(appointmentId);

                // 2) Construim JSONArray-ul de răspuns: punem fiecare fișier base64-encodat
                JSONArray arr = new JSONArray();
                for (FileUploadData f : files) {
                    JSONObject obj = new JSONObject()
                            .put("fileName",    f.fileName())
                            .put("contentType", f.contentType())
                            //  content ul binar in Base64
                            .put("content",     Base64.getEncoder().encodeToString(f.content()));
                    arr.put(obj);
                }

                byte[] responseBytes = arr.toString(4)
                        .getBytes(StandardCharsets.UTF_8);

                exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
                exchange.sendResponseHeaders(200, responseBytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(responseBytes);
                }

            } catch (SQLException e) {
                e.printStackTrace();
                JsonView.send(exchange, 500, new JSONObject()
                        .put("error", "Database error: " + e.getMessage())
                        .toString()
                );
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
                case "rejected", "canceled": {
                    String sqlUpdateAppointment =
                            "UPDATE appointments SET status = ?, admin_message = ? WHERE id = ?";

                    String sqlUpdateOrder =
                            "UPDATE orders SET status = ? WHERE appointment_id = ?";

                    try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
                        conn.setAutoCommit(false);

                        try (PreparedStatement psAppointment = conn.prepareStatement(sqlUpdateAppointment)) {
                            psAppointment.setString(1, status);
                            psAppointment.setString(2, adminMessage);
                            psAppointment.setInt(3, appointmentId);
                            psAppointment.executeUpdate();
                        }

                        try (PreparedStatement psOrder = conn.prepareStatement(sqlUpdateOrder)) {
                            psOrder.setString(1, "canceled");
                            psOrder.setInt(2, appointmentId);
                            psOrder.executeUpdate();
                        }

                        conn.commit();
                    } catch (SQLException e) {
                        e.printStackTrace();
                        JsonView.send(exchange, 500,
                                new JSONObject().put("message", "Internal server error").toString());
                        return;
                    }
                }
                    break;
                case "approved":{

                    double estimatedPrice = jsonBody.optDouble("estimatedPrice", 0.0);
                    int warrantyMonths = jsonBody.optInt("warrantyMonths", 0);
                    JSONArray inventoryIds = jsonBody.optJSONArray("inventoryPieces");

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
                                int inventoryId = inventoryIds.getJSONObject(i).getInt("id");
                                // You may want to get quantity and price from the request or DB
                                int quantity = inventoryIds.getJSONObject(i).getInt("quantity");
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
                case "completed":{
                    String sqlUpdateAppointment =
                            "UPDATE appointments SET status = ? WHERE id = ?";

                    String sqlUpdateOrder =
                            "UPDATE orders SET status = ? WHERE appointment_id = ?";

                    try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
                        conn.setAutoCommit(false);

                        try (PreparedStatement psAppointment = conn.prepareStatement(sqlUpdateAppointment)) {
                            psAppointment.setString(1, status);
                            psAppointment.setInt(2, appointmentId);
                            psAppointment.executeUpdate();
                        }

                        try (PreparedStatement psOrder = conn.prepareStatement(sqlUpdateOrder)) {
                            psOrder.setString(1, "completed");
                            psOrder.setInt(2, appointmentId);
                            psOrder.executeUpdate();
                        }

                        conn.commit();
                    } catch (SQLException e) {
                        e.printStackTrace();
                        JsonView.send(exchange, 500,
                                new JSONObject().put("message", "Internal server error").toString());
                        return;
                    }
                }
                break;
                default: {
                    JsonView.send(exchange, 400, new JSONObject().put("message","Invalid status").toString());
                    return;
                }
            }

            JsonView.send(exchange, 200, "{\"message\":\"Appointment updated successfully\"}");

        }
    }

}
