package org.example.view;

import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.io.OutputStream;

public class JsonView {
    public static void send(HttpExchange exchange, int statusCode, String jsonBody) throws IOException {
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.sendResponseHeaders(statusCode, jsonBody.getBytes().length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(jsonBody.getBytes());
        }
    }
}
