package org.example.utils;

import com.sun.net.httpserver.HttpExchange;

import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.ZoneOffset;
import java.util.List;

public final class Cookie {
    private final String name;
    private final String value;
    private final String path;
    private final ZonedDateTime expires;
    private final Long maxAge;
    private final boolean httpOnly;
    private final boolean secure;
    private final String sameSite;

    private Cookie(Builder b) {
        this.name     = b.name;
        this.value    = b.value;
        this.path     = b.path;
        this.expires  = b.expires;
        this.maxAge   = b.maxAge;
        this.httpOnly = b.httpOnly;
        this.secure   = b.secure;
        this.sameSite = b.sameSite;
    }

    public static String getValue(HttpExchange exchange, String name) {
        List<String> cookies = exchange.getRequestHeaders().get("Cookie");
        if (cookies == null) {
            return null;
        }
        for (String header : cookies) {
            String[] pairs = header.split(";");
            for (String pair : pairs) {
                String[] parts = pair.trim().split("=", 2);
                if (parts.length >= 1 && parts[0].equals(name)) {
                    return parts.length > 1 ? parts[1] : "";
                }
            }
        }
        return null;
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append(name).append("=").append(value);

        if (path != null) {
            sb.append("; Path=").append(path);
        }
        if (maxAge != null) {
            sb.append("; Max-Age=").append(maxAge);
        }
        if (expires != null) {
            sb.append("; Expires=")
                    .append(expires.format(DateTimeFormatter.RFC_1123_DATE_TIME));
        }
        if (secure) {
            sb.append("; Secure");
        }
        if (httpOnly) {
            sb.append("; HttpOnly");
        }
        if (sameSite != null) {
            sb.append("; SameSite=").append(sameSite);
        }
        return sb.toString();
    }

    public static class Builder {
        private final String name;
        private final String value;
        private String path = "/";
        private ZonedDateTime expires;
        private Long maxAge;
        private boolean httpOnly = false;
        private boolean secure = false;
        private String sameSite;

        public Builder(String name, String value) {
            this.name = name;
            this.value = value;
        }

        public Builder path(String path) {
            this.path = path;
            return this;
        }

        public Builder maxAge(long seconds) {
            this.maxAge = seconds;
            return this;
        }

        public Builder expires(ZonedDateTime when) {
            this.expires = when;
            return this;
        }

        public Builder expiresInDays(int days) {
            this.expires = ZonedDateTime.now(ZoneOffset.UTC).plusDays(days);
            return this;
        }

        public Builder httpOnly() {
            this.httpOnly = true;
            return this;
        }

        public Builder secure() {
            this.secure = true;
            return this;
        }

        public Builder sameSite(String policy) {
            switch (policy){
                case "None":
                case "Strict":
                case"Lax":
                    this.sameSite = policy;
                    break;
                default:
                    throw new IllegalArgumentException("Invalid policy: " + policy);
            }
            return this;
        }

        public Cookie build() {
            return new Cookie(this);
        }
    }
}

