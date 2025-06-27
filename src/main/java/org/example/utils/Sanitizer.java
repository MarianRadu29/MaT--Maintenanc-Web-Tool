package org.example.utils;

import org.apache.commons.text.StringEscapeUtils;

public class Sanitizer {

    public static String sanitizeHtml(String input) {
        return StringEscapeUtils.escapeHtml4(input);
    }

    public static String sanitizeJavaScript(String input) {
        return StringEscapeUtils.escapeEcmaScript(input);
    }

    public static void main(String[] args) {
        var str = "<img src=x onerror=alert(1)> AURAA!";
        var result = sanitizeHtml(str);
        System.out.println(result);
    }
}