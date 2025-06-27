package org.example.utils;

import com.sun.net.httpserver.HttpExchange;
import io.github.cdimascio.dotenv.Dotenv;

import java.io.IOException;
import java.io.OutputStream;

public class JsonSender {
    private static final String ALLOWED_ORIGIN;

    static{
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
        ALLOWED_ORIGIN = dotenv.get("ALLOWED_ORIGIN");
    }
    public static void send(HttpExchange exchange, int statusCode, String jsonBody) throws IOException {
        var headers = exchange.getResponseHeaders();

        // CORS
        headers.add("Access-Control-Allow-Origin",  ALLOWED_ORIGIN);
        headers.add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH");
        headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
        headers.add("Access-Control-Allow-Credentials", "true");

        // JSON
        headers.add("Content-Type", "application/json");

        exchange.sendResponseHeaders(statusCode, jsonBody.getBytes().length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(jsonBody.getBytes());
        }
    }
}
