package org.example.utils;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.Arrays;

public class StaticFileHandler implements HttpHandler {
    private final String root;

    public StaticFileHandler(String rootDir) {
        this.root = rootDir;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        System.out.println("Path: " + exchange.getRequestURI());

        String path = exchange.getRequestURI().getPath();
        if (path.equals("/")) path = "/index.html";


//        la celalalte fisiere css/js le adaug prin html
        String nameFile = root + ( path.endsWith(".html") ? "/html" : "" ) + path;

        File file = new File(nameFile).getCanonicalFile();
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
        name = name.toLowerCase();
        if (name.endsWith(".html")) return "text/html";
        if (name.endsWith(".css")) return "text/css";
        if (name.endsWith(".js")) return "application/javascript";
        if (name.endsWith(".json")) return "application/json";
        if (name.endsWith(".png")) return "image/png";
        if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
        if (name.endsWith(".gif")) return "image/gif";
        if (name.endsWith(".svg")) return "image/svg+xml";
        if (name.endsWith(".ico")) return "image/x-icon";
        if (name.endsWith(".woff")) return "font/woff";
        if (name.endsWith(".woff2")) return "font/woff2";
        if (name.endsWith(".ttf")) return "font/ttf";
        if (name.endsWith(".otf")) return "font/otf";
        if (name.endsWith(".pdf")) return "application/pdf";
        if (name.endsWith(".zip")) return "application/zip";
        return "application/octet-stream";
    }
}
