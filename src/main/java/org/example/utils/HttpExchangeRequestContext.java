package org.example.utils;

import com.sun.net.httpserver.HttpExchange;
import org.apache.commons.fileupload.RequestContext;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;

public class HttpExchangeRequestContext implements RequestContext {
    private final HttpExchange exchange;
    public HttpExchangeRequestContext(HttpExchange exchange) {
        this.exchange = exchange;
    }
    @Override public String getCharacterEncoding() {
        return "UTF-8";
    }
    @Override public String getContentType() {
        return exchange.getRequestHeaders().getFirst("Content-Type");
    }
    @Override public int getContentLength() {
        String len = exchange.getRequestHeaders().getFirst("Content-length");
        return len != null ? Integer.parseInt(len) : -1;
    }
    @Override public InputStream getInputStream() throws IOException {
        return exchange.getRequestBody();
    }
}
