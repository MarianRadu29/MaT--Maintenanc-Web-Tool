package org.example.utils;

public class TokenExpiredException extends Exception {
    public TokenExpiredException() {
        super("Token expired");
    }
}
