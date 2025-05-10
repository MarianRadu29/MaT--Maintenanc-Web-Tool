package org.example.utils;


import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;

public class StaticFileHandler implements HttpHandler {
    private final String root;

    public StaticFileHandler(String rootDir) {
        this.root = rootDir;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        if (path.equals("/")) path = "/index.html";

        File file = new File(root + path).getCanonicalFile();
        if (!file.exists() || !file.getPath().startsWith(new File(root).getCanonicalPath())) {
            exchange.sendResponseHeaders(404, -1);
            return;
        }

        byte[] content = Files.readAllBytes(file.toPath());
        String mime = getMime(file.getName());
        exchange.getResponseHeaders().add("Content-Type", mime);
        exchange.sendResponseHeaders(200, content.length);
        exchange.getResponseBody().write(content);
        exchange.close();
    }

    private String getMime(String name) {
        if (name.endsWith(".html")) return "text/html";
        if (name.endsWith(".css")) return "text/css";
        if (name.endsWith(".js")) return "application/javascript";
        return "application/octet-stream";
    }
}
