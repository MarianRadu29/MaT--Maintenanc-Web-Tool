package org.example.controller;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import org.example.model.UserModel;
import org.example.objects.UserData;
import org.example.utils.*;
import org.example.utils.JsonSender;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

public class UserController {
    public static class GetUserInfo implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1); // Method Not Allowed
                return;
            }
            String token = Cookie.getValue(exchange, "token");

            if(token == null) {
                JsonSender.send(exchange, 401, "{\"message\":\"Missing or invalid token\"}");
                return;
            }
            Map<String, Object> claims = JwtUtil.validateAndExtractClaims(token);

            if (claims == null) {
                JsonSender.send(exchange, 401, "{\"message\":\"Invalid or expired token\"}");
                return;
            }

            int userId = (int) claims.get("id");
            String email = (String) claims.get("email");
            UserData userData = UserModel.getUserByEmail(email);

            if (userData == null || userData.getId() != userId) {
                JsonSender.send(exchange, 404, "{\"message\":\"User not found\"}");
                return;
            }

            JSONObject obj = new JSONObject()
                    .put("id",           userData.getId())
                    .put("roleID",       userData.getRoleId())
                    .put("firstName",    userData.getFirstName())
                    .put("lastName",     userData.getLastName())
                    .put("email",        userData.getEmail())
                    .put("phoneNumber",  userData.getPhoneNumber());

            String json = obj.toString();
            JsonSender.send(exchange, 200, json);
        }
    }

    public static class GetUsers implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1); // Method Not Allowed
                return;
            }
            String token = Cookie.getValue(exchange, "token");
            if(token == null) {
                JsonSender.send(exchange, 401, "{\"message\":\"Missing or invalid token\"}");
                return;
            }
            Map<String, Object> claims = JwtUtil.validateAndExtractClaims(token);

            if (claims == null) {
                JsonSender.send(exchange, 401, "{\"message\":\"Invalid or expired token\"}");
                return;
            }

            int userId = (int) claims.get("id");
            String email = (String) claims.get("email");
            UserData userData = UserModel.getUserByEmail(email);

            if (userData == null || userData.getId() != userId) {
                JsonSender.send(exchange, 404, "{\"message\":\"User not found\"}");
                return;
            }
            if(userData.getRoleId()<3){
                JsonSender.send(exchange,403,new  JSONObject().put("message","Forbidden: You do not have permission to access this resource").toString());
                return;
            }
            List<UserData> users;
            try{
                users = UserModel.getAllUsers();
                users.sort(Comparator.comparingInt(UserData::getId));
            }
            catch (SQLException e){
                JsonSender.send(exchange,500,new  JSONObject().put("message","Internal server error").toString());
                return;
            }
            JSONArray resultJSON = new JSONArray();
            users.forEach(user ->
                    resultJSON.put(
                            new JSONObject()
                                    .put("id", user.getId())
                                    .put("email", user.getEmail())
                                    .put("firstName", user.getFirstName())
                                    .put("lastName", user.getLastName())
                                    .put("phoneNumber", user.getPhoneNumber())
                                    .put("roleID", user.getRoleId())
                    )
            );
            String json = resultJSON.toString();
            JsonSender.send(exchange, 200, json);
        }
    }

    public static class UpdateUserRole implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"PATCH".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
                return;
            }

            String token = Cookie.getValue(exchange, "token");
            if(token == null) {
                JsonSender.send(exchange, 401, "{\"message\":\"Missing or invalid token\"}");
                return;
            }
            Map<String, Object> claims = JwtUtil.validateAndExtractClaims(token);

            if (claims == null) {
                JsonSender.send(exchange, 401, "{\"message\":\"Invalid or expired token\"}");
                return;
            }

            int userId = (int) claims.get("id");
            String email = (String) claims.get("email");
            UserData userData = UserModel.getUserByEmail(email);

            if (userData == null || userData.getId() != userId) {
                JsonSender.send(exchange, 404, "{\"message\":\"User not found\"}");
                return;
            }
            if(userData.getRoleId()!=3){
                JsonSender.send(exchange,403,new  JSONObject().put("message","Forbidden: You do not have permission to access this resource").toString());
                return;
            }

            var list =  Arrays.stream(exchange.getRequestURI().getPath().split("/")).toList();
            String userIDString = list.get(list.size()-1);
            int userIdReceive;
            try{
                userIdReceive = Integer.parseInt(userIDString);
            }
            catch (Exception e){
                JsonSender.send(exchange, 400, "{\"message\":\"Bad Request\"}");
                return;
            }
            String requestBody = new String(
                    exchange.getRequestBody().readAllBytes(),
                    StandardCharsets.UTF_8
            );
            JSONObject obj = new JSONObject(requestBody);
            int newRoleId =  obj.getInt("roleID");
            try{
                var user = UserModel.getUserById(userIdReceive);
                if(user==null){
                    JsonSender.send(exchange, 404, "{\"message\":\"User not found\"}");
                    return;
                }
                System.out.println(UserModel.updateUserRole(user.getId(), newRoleId));
                var users = UserModel.getAllUsers();
                System.out.println(users);
            }
            catch (Exception e){
                e.printStackTrace();
                JsonSender.send(exchange, 500, "{\"message\":\"Internal error\"}");
                return;
            }
            JsonSender.send(exchange, 200, "{\"message\":\"User updated\"}");
        }
    }

    public static class UpdateUserInfo implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"PATCH".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1); // Method Not Allowed
                return;
            }

            String token = Cookie.getValue(exchange, "token");
            if(token == null) {
                JsonSender.send(exchange, 401, "{\"message\":\"Missing or invalid token\"}");
                return;
            }
            Map<String, Object> claims = JwtUtil.validateAndExtractClaims(token);

            if (claims == null) {
                JsonSender.send(exchange, 401, "{\"message\":\"Invalid or expired token\"}");
                return;
            }

            int userId = (int) claims.get("id");
            String email = (String) claims.get("email");
            UserData userData = UserModel.getUserByEmail(email);

            if (userData == null || userData.getId() != userId) {
                JsonSender.send(exchange, 404, "{\"message\":\"User not found\"}");
                return;
            }

            String requestBody = new String(
                    exchange.getRequestBody().readAllBytes(),
                    StandardCharsets.UTF_8
            );

            try {
                JSONObject json = new JSONObject(requestBody);
                String firstName     = Sanitizer.sanitizeJavaScript(Sanitizer.sanitizeHtml(json.optString("firstName", null)));
                String lastName      = Sanitizer.sanitizeJavaScript(Sanitizer.sanitizeHtml(json.optString("lastName", null)));
                String phoneNumber   = Sanitizer.sanitizeJavaScript(Sanitizer.sanitizeHtml(json.optString("phoneNumber", null)));
                String emailFromJson = Sanitizer.sanitizeJavaScript(Sanitizer.sanitizeHtml(json.optString("email", null)));

                if ((firstName == null || firstName.isEmpty()) &&
                        (lastName == null  || lastName.isEmpty()) &&
                        (phoneNumber == null || phoneNumber.isEmpty()) &&
                        (emailFromJson == null || emailFromJson.isEmpty())) {
                    JsonSender.send(exchange, 400, "{\"message\":\"No field found to update\"}");
                    return;
                }

                if (!(firstName == null || firstName.isEmpty())) {
                    userData.setFirstName(firstName);
                }
                if (!(lastName == null || lastName.isEmpty())) {
                    userData.setLastName(lastName);
                }
                if (!(phoneNumber == null || phoneNumber.isEmpty())) {
                    userData.setPhoneNumber(phoneNumber);
                }
                if (!(emailFromJson == null || emailFromJson.isEmpty())) {
                    userData.setEmail(emailFromJson);
                }

                if (emailFromJson != null) {
                    UserData userDataEmailCheck = UserModel.getUserByEmail(emailFromJson);
                    if (userDataEmailCheck != null && userData.getId() != userDataEmailCheck.getId()) {
                        JsonSender.send(exchange, 409, "{\"message\":\"User with this email already exists\"}");
                        return;
                    }
                }

                UserModel.updateUser(userData);
                JsonSender.send(exchange, 200, "{\"message\":\"User information updated successfully\"}");
            } catch (Exception e) {
                e.printStackTrace();
                JsonSender.send(exchange, 500, "{\"message\":\"Invalid JSON format\"}");
            }
        }
    }

    public static class DeleteUser implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"DELETE".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
                return;
            }
            String token = Cookie.getValue(exchange, "token");
            if(token == null) {
                JsonSender.send(exchange, 401, "{\"message\":\"Missing or invalid token\"}");
                return;
            }
            Map<String, Object> claims = JwtUtil.validateAndExtractClaims(token);

            if (claims == null) {
                JsonSender.send(exchange, 401, "{\"message\":\"Invalid or expired token\"}");
                return;
            }

            int userId = (int) claims.get("id");
            String email = (String) claims.get("email");
            UserData userData = UserModel.getUserByEmail(email);

            if (userData == null || userData.getId() != userId) {
                JsonSender.send(exchange, 404, "{\"message\":\"User not found\"}");
                return;
            }
            if(userData.getRoleId()!=3){
                JsonSender.send(exchange,403,new  JSONObject().put("message","Forbidden: You do not have permission to access this resource").toString());
                return;
            }

            var list = Arrays.stream(exchange.getRequestURI().getPath().split("/")).toList();
            String userIDString = list.get(list.size()-1);
            int userIdReceive;
            try{
                userIdReceive = Integer.parseInt(userIDString);
            }
            catch (Exception e){
                JsonSender.send(exchange, 400, "{\"message\":\"Bad Request\"}");
                return;
            }

            try{
                var user = UserModel.getUserById(userIdReceive);
                if(user==null){
                    JsonSender.send(exchange, 404, "{\"message\":\"User not found\"}");
                    return;
                }
                System.out.println(user.getId());
                UserModel.deleteUser(user.getId());
            }
            catch (Exception e){
                e.printStackTrace();
                JsonSender.send(exchange, 500, "{\"message\":\"Internal error\"}");
                return;
            }
            JsonSender.send(exchange, 200, "{\"message\":\"User deleted\"}");

        }
    }
}
