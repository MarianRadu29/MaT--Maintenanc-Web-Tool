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
import org.example.model.UserModel;
import org.example.objects.User;
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
import java.util.stream.IntStream;

public class AppointmentController {

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
            JsonView.send(exchange, 200, response);
        }
    }

    public record FileUploadData(String fieldName, String fileName, String contentType, byte[] content) {}

    public static class SetAppointment implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
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

                int userId = (int) claims.get("id");
                if(userId!=clientId){
                    JsonView.send(exchange, 403, "{\"message\":\"Forbidden: You cannot create an appointment for another user\"}");
                    return;
                }
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

                String res = new JSONObject().put("appointmentId", appointmentId).toString();
                JsonView.send(exchange, 200, res);

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

            int userId = (int) claims.get("id");
            int userRoleId = UserModel.getUserRoleId(userId);
            if(userRoleId==1){
                JsonView.send(exchange, 403, "{\"message\":\"Forbidden: You do not have permission to access this resource\"}");
                return;
            }
            try {
                JSONArray resultArray = AppointmentModel.getAppointments();
               JsonView.send(exchange, 200, resultArray.toString());
            } catch (SQLException e) {
                e.printStackTrace();
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

            int clientId = (int) claims.get("id");
            try {
                JSONArray resultArray = AppointmentModel.getAppointmentsByClientId(clientId);
               JsonView.send(exchange, 200, resultArray.toString());

            } catch (SQLException e) {
                e.printStackTrace();
               JsonView.send(exchange, 500, new JSONObject().put("error", "Database error").toString());
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

            int userId = (int) claims.get("id");

            String path = exchange.getRequestURI().getPath();
            // astept un path de forma "/api/appointment/media/{id}"
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
                var list = AppointmentModel.getAppointmentsByClientId(userId);
                boolean ok = IntStream.range(0, list.length())
                        .mapToObj(list::getJSONObject)
                        .anyMatch(obj -> appointmentId== obj.getInt("id"));
                if(!ok){
                    JsonView.send(exchange, 403, new JSONObject()
                            .put("error", "Forbidden: You do not have permission to access this appointment")
                            .toString()
                    );
                    return;
                }

                List<FileUploadData> files = AppointmentModel.getMediaFiles(appointmentId);

                JSONArray arr = new JSONArray();
                for (FileUploadData f : files) {
                    JSONObject obj = new JSONObject()
                            .put("fileName",    f.fileName())
                            .put("contentType", f.contentType())
                            //  content ul binar in Base64
                            .put("content",     Base64.getEncoder().encodeToString(f.content()));
                    arr.put(obj);
                }

                JsonView.send(exchange, 200, arr.toString());

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

            String authHeader = exchange.getRequestHeaders().getFirst("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                JsonView.send(exchange, 401, "{\"message\":\"Missing or invalid token\"}");
                return;
            }

            String token = authHeader.substring(7); // Remove "Bearer "
            Map<String, Object> claims = JwtUtil.validateAndExtractClaims(token);

            if (claims == null || !claims.containsKey("id") || !claims.containsKey("email")) {
                JsonView.send(exchange, 401, "{\"message\":\"Invalid or expired token\"}");
                return;
            }

            String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            JSONObject jsonBody = new JSONObject(body);

            int appointmentId = jsonBody.getInt("appointmentId");
            int userId = (int) claims.get("id");
            if(UserModel.getUserIdByAppointmentId(appointmentId) != userId){
                JsonView.send(exchange, 403, "{\"message\":\"Forbidden: You do not have permission to update this appointment\"}");
                return;
            }
            String status = jsonBody.getString("status");
            String adminMessage = jsonBody.optString("adminMessage", null);


            try {
                switch (status.trim().toLowerCase()) {
                    //din modified in pending
                    case "pending" -> {
                        AppointmentModel.setStatusAppointment(appointmentId, status);
                    }
                    case "rejected" -> {
                        if(UserModel.getUserRoleId(UserModel.getUserIdByAppointmentId(appointmentId))==1){
                            JsonView.send(exchange, 403, new JSONObject().put("message", "Forbidden: You do not have permission to reject this appointment").toString());
                            return;
                        }
                        AppointmentModel.updateAppointmentStatusAndMessage(appointmentId, status, adminMessage);
                        AppointmentModel.updateOrderStatusByAppointment(appointmentId, "canceled");
                    }
                    case "canceled" -> {
                        AppointmentModel.updateAppointmentStatusAndMessage(appointmentId, status, adminMessage);
                        AppointmentModel.updateOrderStatusByAppointment(appointmentId, "canceled");
                    }
                    case "approved" -> {
                        if(UserModel.getUserRoleId(UserModel.getUserIdByAppointmentId(appointmentId))==1){
                            JsonView.send(exchange, 403, new JSONObject().put("message", "Forbidden: You do not have permission to reject this appointment").toString());
                            return;
                        }
                        double estimatedPrice = jsonBody.optDouble("estimatedPrice", 0.0);
                        int warrantyMonths = jsonBody.optInt("warrantyMonths", 0);
                        JSONArray inventoryIds = jsonBody.optJSONArray("inventoryPieces");
                        AppointmentModel.updateAppointmentApproved(appointmentId, status, adminMessage, estimatedPrice, warrantyMonths);
                        int orderId = AppointmentModel.insertOrder(appointmentId, estimatedPrice);
                        AppointmentModel.insertOrderItems(orderId, inventoryIds);
                    }
                    case "modified" -> {
                        if(UserModel.getUserRoleId(UserModel.getUserIdByAppointmentId(appointmentId))==1){
                            JsonView.send(exchange, 403, new JSONObject().put("message", "Forbidden: You do not have permission to reject this appointment").toString());
                            return;
                        }
                        String newStartTime = jsonBody.optString("startTime");
                        String newEndTime = jsonBody.optString("endTime");
                        AppointmentModel.updateAppointmentModified(appointmentId, newStartTime, newEndTime);
                        System.out.println("ssssssiiiiiiiiiii");
                    }
                    case "accepted" -> {
                        AppointmentModel.setStatusAppointment(appointmentId, "approved");
                    }
                    case "completed" -> {
                        if(UserModel.getUserRoleId(UserModel.getUserIdByAppointmentId(appointmentId))==1){
                            JsonView.send(exchange, 403, new JSONObject().put("message", "Forbidden: You do not have permission to reject this appointment").toString());
                            return;
                        }
                        AppointmentModel.completeAppointmentAndOrder(appointmentId, status);
                    }
                    default -> {
                        JsonView.send(exchange, 400, new JSONObject().put("message", "Invalid status").toString());
                        return;
                    }
                }
                JsonView.send(exchange, 200, "{\"message\":\"Appointment updated successfully\"}");
            } catch (SQLException e) {
                if ("P0001".equals(e.getSQLState())) {
                    JsonView.send(exchange,409, new JSONObject()
                            .put("message", e.getMessage())
                            .toString()
                    );
                    return;
                }
                e.printStackTrace();
                JsonView.send(exchange, 500, new JSONObject().put("message", "Internal server error").toString());
            }

        }
    }

}
