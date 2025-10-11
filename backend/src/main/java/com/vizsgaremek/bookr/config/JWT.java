package com.vizsgaremek.bookr.config;

import com.vizsgaremek.bookr.model.Users;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.impl.TextCodec;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

public class JWT {
    
    private static final String JWT_SECRET = EnvConfig.getJwtSecret();
    private static final long EXPIRATION_DAYS = EnvConfig.getJwtExpirationDays();
    
    public static String createJwt(Users u) {
        Instant now = Instant.now();

        return Jwts.builder()
                .setIssuer("Bookr")
                .setSubject("appointment_booking")
                .claim("id", u.getId())
                .claim("phone", u.getPhone())
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plus(EXPIRATION_DAYS, ChronoUnit.DAYS)))
                .signWith(
                        SignatureAlgorithm.HS256,
                        TextCodec.BASE64.decode(JWT_SECRET)
                )
                .compact();
    }
}