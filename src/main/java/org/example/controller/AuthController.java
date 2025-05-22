package org.example.controller;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import org.example.model.UserModel;
import org.example.objects.User;
import org.example.utils.BCrypt;
import org.example.utils.JwtUtil;
import org.example.view.JsonView;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public class AuthController {

    private static Map<String, String> parseForm(InputStream is) throws IOException {
        StringBuilder sb = new StringBuilder();
        byte[] buffer = new byte[1024];
        int bytesRead;
        while ((bytesRead = is.read(buffer)) != -1) {
            sb.append(new String(buffer, 0, bytesRead, StandardCharsets.UTF_8));
        }

        Map<String, String> result = new HashMap<>();
        String[] pairs = sb.toString().split("&");
        for (String pair : pairs) {
            String[] kv = pair.split("=");
            if (kv.length == 2) {
                String key = URLDecoder.decode(kv[0], StandardCharsets.UTF_8);
                String value = URLDecoder.decode(kv[1], StandardCharsets.UTF_8);
                result.put(key, value);
            }
        }
        return result;
    }

    public static class Register implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                JsonView.send(exchange, 405, "{\"message\":\"Method Not Allowed\"}");
                return;
            }

            Map<String, String> form = parseForm(exchange.getRequestBody());

            String firstName = form.get("first_name");
            String lastName = form.get("last_name");
            String password = form.get("password");
            String email = form.get("email");
            String phoneNumber = form.get("phone_number");

            if (firstName == null || lastName == null || password == null || email == null || phoneNumber == null) {
                JsonView.send(exchange, 400, "{\"message\":\"Missing fields\"}");
                return;
            }

            var user = UserModel.getUserByEmail(email);
            if (user == null) {
                User newUser = new User(firstName, lastName, password, email, 0, phoneNumber, 1);
                UserModel.createUser(newUser);

                user = UserModel.getUserByEmail(email);
                String accessToken = JwtUtil.generateToken(user.getId(), email, 15); // 15 minute
                String refreshToken = JwtUtil.generateToken(user.getId(), email, 60 * 24 * 7); // 7 zile

                String json = String.format("{\"message\":\"User registered successfully\", \"accessToken\":\"%s\", \"refreshToken\":\"%s\"}", accessToken, refreshToken);
                JsonView.send(exchange, 200, json);
            } else {
                JsonView.send(exchange, 409, "{\"message\":\"User already exists\"}");
            }
        }
    }

    public static class Login implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                JsonView.send(exchange, 405, "{\"message\":\"Method Not Allowed\"}");
                return;
            }

            Map<String, String> form = parseForm(exchange.getRequestBody());

            String email = form.get("email");
            String password = form.get("password");
            if (email == null || password == null) {
                JsonView.send(exchange, 400, "{\"message\":\"Missing fields\"}");
                return;
            }

            User user = UserModel.getUserByEmail(email);
            System.out.println(BCrypt.checkPassword(password, user.getPassword()));
            if (user != null && BCrypt.checkPassword(password, user.getPassword())) {
                String accessToken = JwtUtil.generateToken(user.getId(), email, 15);
                String refreshToken = JwtUtil.generateToken(user.getId(), email, 60 * 24 * 7);
                String json = String.format("{\"message\":\"Login successful\", \"accessToken\":\"%s\", \"refreshToken\":\"%s\"}", accessToken, refreshToken);
                JsonView.send(exchange, 200, json);
            } else {
                JsonView.send(exchange, 404, "{\"message\":\"email or password is wrong\"}");
            }
        }
    }
}
