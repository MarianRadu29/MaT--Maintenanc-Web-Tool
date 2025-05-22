package org.example.utils;

import com.sun.net.httpserver.HttpExchange;
import java.net.URI;
import java.util.HashMap;
import java.util.Map;

public class Utils {
    // Parsează query string în Map<String, String>
    public static Map<String, String> parseQuery(String query) {
        Map<String, String> result = new HashMap<>();
        if (query == null || query.isEmpty()) return result;

        String[] pairs = query.split("&");
        for (String pair : pairs) {
            int idx = pair.indexOf("=");
            if (idx > 0 && idx < pair.length() - 1) {
                String key = decode(pair.substring(0, idx));
                String value = decode(pair.substring(idx + 1));
                result.put(key, value);
            } else if (idx == pair.length() - 1) {
                String key = decode(pair.substring(0, idx));
                result.put(key, "");
            } else {
                result.put(decode(pair), "");
            }
        }
        return result;
    }

    // Decodificare URL encoded (ex: %20 -> spațiu)
    private static String decode(String s) {
        try {
            return java.net.URLDecoder.decode(s, "UTF-8");
        } catch (Exception e) {
            return s;
        }
    }
}

