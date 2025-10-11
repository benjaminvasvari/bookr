/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.config;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import org.bouncycastle.crypto.generators.Argon2BytesGenerator;
import org.bouncycastle.crypto.params.Argon2Parameters;

/**
 *
 * @author vben
 */
public class PasswordHasher {
    
    private static final int SALT_LENGTH = 16; // 16 byte salt
    private static final int HASH_LENGTH = 32; // 32 byte hash
    private static final int ITERATIONS = 3;
    private static final int MEMORY = 65536; // 64 MB
    private static final int PARALLELISM = 1;
    
    private final SecureRandom secureRandom;
    
    public PasswordHasher() {
        this.secureRandom = new SecureRandom();
    }
    
    /**
     * Jelszó hashelése Argon2id-vel
     */
    public String hashPassword(String password) {
        byte[] salt = generateSalt();
        byte[] hash = argon2Hash(password, salt);
        
        // Formátum: $argon2id$v=19$m=65536,t=3,p=1$salt$hash
        return String.format("$argon2id$v=19$m=%d,t=%d,p=%d$%s$%s",
                MEMORY, ITERATIONS, PARALLELISM,
                Base64.getEncoder().withoutPadding().encodeToString(salt),
                Base64.getEncoder().withoutPadding().encodeToString(hash));
    }
    
    /**
     * Jelszó ellenőrzése
     */
    public boolean verifyPassword(String password, String hashedPassword) {
        String[] parts = hashedPassword.split("\\$");
        
        if (parts.length != 6 || !parts[1].equals("argon2id")) {
            return false;
        }
        
        byte[] salt = Base64.getDecoder().decode(parts[4]);
        byte[] expectedHash = Base64.getDecoder().decode(parts[5]);
        byte[] actualHash = argon2Hash(password, salt);
        
        return slowEquals(expectedHash, actualHash);
    }
    
    private byte[] generateSalt() {
        byte[] salt = new byte[SALT_LENGTH];
        secureRandom.nextBytes(salt);
        return salt;
    }
    
    private byte[] argon2Hash(String password, byte[] salt) {
        Argon2Parameters params = new Argon2Parameters.Builder(Argon2Parameters.ARGON2_id)
                .withSalt(salt)
                .withIterations(ITERATIONS)
                .withMemoryAsKB(MEMORY)
                .withParallelism(PARALLELISM)
                .build();
        
        Argon2BytesGenerator generator = new Argon2BytesGenerator();
        generator.init(params);
        
        byte[] hash = new byte[HASH_LENGTH];
        generator.generateBytes(password.getBytes(StandardCharsets.UTF_8), hash);
        
        return hash;
    }
    
    /**
     * Timing attack elleni védelem
     */
    private boolean slowEquals(byte[] a, byte[] b) {
        int diff = a.length ^ b.length;
        for (int i = 0; i < a.length && i < b.length; i++) {
            diff |= a[i] ^ b[i];
        }
        return diff == 0;
    }
}
