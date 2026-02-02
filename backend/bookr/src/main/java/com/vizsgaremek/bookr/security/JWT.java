package com.vizsgaremek.bookr.security;

import com.vizsgaremek.bookr.config.EnvConfig;
import com.vizsgaremek.bookr.model.Users;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import javax.crypto.SecretKey;

/**
 * JWT token kezelő osztály EnvConfig-ból tölti be a konfigurációt Kompatibilis
 * JJWT 0.11.x és 0.12.x verziókkal
 */
public class JWT {

    // Token élettartamok EnvConfig-ból
    private static final long ACCESS_TOKEN_VALIDITY = EnvConfig.getAccessTokenExpirationMinutes();
    private static final long REFRESH_TOKEN_VALIDITY = EnvConfig.getRefreshTokenExpirationDays() * 24 * 60;

    /**
     * Access token létrehozása
     */
    public static String createAccessToken(Users user) {
        return createToken(
                user,
                ACCESS_TOKEN_VALIDITY,
                getSecretKey(EnvConfig.getJwtSecret()),
                "access"
        );
    }

    /**
     * Refresh token létrehozása
     */
    public static String createRefreshToken(Users user) {
        return createToken(
                user,
                REFRESH_TOKEN_VALIDITY,
                getSecretKey(EnvConfig.getRefreshSecret()),
                "refresh"
        );
    }

    /**
     * Token létrehozása
     */
    private static String createToken(Users user, long validityMinutes, SecretKey key, String tokenType) {
        Instant now = Instant.now();

        Map<String, Object> claims = new HashMap<>();

        // Access token: minimális szükséges adatok
        if ("access".equals(tokenType)) {
            claims.put("id", user.getId());
            claims.put("email", user.getEmail());

            String roles = user.getRolesString();
            if (roles != null) {
                claims.put("role_names", roles);
            }

            Integer companyId = user.getCompanyId();
            if (companyId != null) {
                claims.put("company_id", companyId);
            }

            claims.put("token_type", "access");
        } // Refresh token: CSAK user ID
        else if ("refresh".equals(tokenType)) {
            claims.put("id", user.getId());
            claims.put("token_type", "refresh");
        }

        return Jwts.builder()
                .setClaims(claims)
                .setIssuer("bookr-api")
                .setSubject(user.getId().toString())
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plus(validityMinutes, ChronoUnit.MINUTES)))
                .setId(UUID.randomUUID().toString())
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Access token validálása
     *
     * @return Boolean - true: valid, false: invalid, null: expired
     */
    public static Boolean validateAccessToken(String token) {
        return validateToken(token, getSecretKey(EnvConfig.getJwtSecret()), "access");
    }

    /**
     * Refresh token validálása
     *
     * @return Boolean - true: valid, false: invalid, null: expired
     */
    public static Boolean validateRefreshToken(String token) {
        return validateToken(token, getSecretKey(EnvConfig.getRefreshSecret()), "refresh");
    }

    /**
     * Token validálása
     */
    private static Boolean validateToken(String token, SecretKey key, String expectedType) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            // Ellenőrizzük a kötelező claim-eket
            Integer userId = claims.get("id", Integer.class);
            String tokenType = claims.get("token_type", String.class);
            String issuer = claims.getIssuer();

            // Issuer ellenőrzés (security)
            if (!"bookr-api".equals(issuer)) {
                return false;
            }

            if (userId == null || tokenType == null || !tokenType.equals(expectedType)) {
                return false;
            }

            return true;

        } catch (ExpiredJwtException ex) {
            // Lejárt token
            return null;

        } catch (SignatureException | MalformedJwtException
                | IllegalArgumentException | UnsupportedJwtException ex) {
            // Hibás token                
            System.out.println(ex);

            return false;
        }
    }

    /**
     * User ID kinyerése access tokenből
     */
    public static Integer getUserIdFromAccessToken(String token) {
        return getUserIdFromToken(token, getSecretKey(EnvConfig.getJwtSecret()));
    }

    /**
     * User ID kinyerése refresh tokenből
     */
    public static Integer getUserIdFromRefreshToken(String token) {
        return getUserIdFromToken(token, getSecretKey(EnvConfig.getRefreshSecret()));
    }

    /**
     * User ID kinyerése tokenből
     */
    private static Integer getUserIdFromToken(String token, SecretKey key) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            return claims.get("id", Integer.class);

        } catch (Exception ex) {
            return null;
        }
    }

    public static Integer getCompanyIdFromAccessToken(String token) {
        try {
            Claims claims = getClaimsFromAccessToken(token);
            return claims != null ? claims.get("company_id", Integer.class) : null;
        } catch (Exception ex) {
            return null;
        }
    }

    public static String getEmailFromAccessToken(String token) {
        try {
            Claims claims = getClaimsFromAccessToken(token);
            return claims != null ? claims.get("email", String.class) : null;
        } catch (Exception ex) {
            return null;
        }
    }

    public static String getJtiFromAccessToken(String token) {
        try {
            Claims claims = getClaimsFromAccessToken(token);
            return claims != null ? claims.getId() : null;
        } catch (Exception ex) {
            return null;
        }
    }

    public static Claims getClaimsFromAccessToken(String token) {
        return getClaimsFromToken(token, getSecretKey(EnvConfig.getJwtSecret()));
    }

    public static Claims getClaimsFromRefreshToken(String token) {
        return getClaimsFromToken(token, getSecretKey(EnvConfig.getRefreshSecret()));
    }

    private static Claims getClaimsFromToken(String token, SecretKey key) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

        } catch (Exception ex) {
            return null;
        }
    }

    public static String getRolesFromAccessToken(String token) {
        try {
            Claims claims = getClaimsFromAccessToken(token);
            return claims != null ? claims.get("role_names", String.class) : null;
        } catch (Exception ex) {
            return null;
        }
    }

    private static SecretKey getSecretKey(String secret) {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

}
