package org.example.utils;

import io.github.cdimascio.dotenv.Dotenv;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

import java.util.Date;
import java.util.Map;

public class JwtUtil {
    private static final String SECRET_KEY;
    static{
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
        SECRET_KEY = dotenv.get("JWT_KEY");
    }
    public static String generateToken(int userId, String email, int expiresInMinutes) {
        long now = System.currentTimeMillis();
        long expiry = now + expiresInMinutes * 60L * 1000;

        return Jwts.builder()
                .claim("id", userId)
                .claim("email", email)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(expiry))
                .signWith(Keys.hmacShaKeyFor(SECRET_KEY.getBytes()), SignatureAlgorithm.HS256)
                .compact();
    }

    public static Map<String, Object> validateAndExtractClaims(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(Keys.hmacShaKeyFor(SECRET_KEY.getBytes()))
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            return Map.of(
                    "id", claims.get("id"),
                    "email", claims.get("email"),
                    "issuedAt", claims.getIssuedAt(),
                    "expiration", claims.getExpiration()
            );
        } catch (JwtException e) {
            System.out.println("[JWT VALIDATION ERROR] " + e.getMessage());
            return null;
        }
    }
}
