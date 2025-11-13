package com.vizsgaremek.bookr.config;

import io.github.cdimascio.dotenv.Dotenv;

/**
 * Környezeti változók kezelése
 * .env fájlból tölti be a konfigurációt
 */
public class EnvConfig {
    
    private static final Dotenv dotenv;
    
    // Statikus inicializálás
    static {
        try {
            dotenv = Dotenv.configure()
                    .ignoreIfMissing()  // Ne dobjon hibát ha nincs .env
                    .load();
            
            validateConfiguration();
            
        } catch (Exception e) {
            throw new IllegalStateException(
                "HIBA: .env fájl betöltése sikertelen: " + e.getMessage()
            );
        }
    }
    
    /**
     * Kötelező környezeti változó lekérése
     * @throws IllegalStateException ha hiányzik
     */
    private static String getRequired(String key) {
        String value = dotenv.get(key);
        
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalStateException(
                "HIBA: Hiányzó kötelező környezeti változó: " + key + 
                "\nEllenőrizd a .env fájlt!"
            );
        }
        
        return value.trim();
    }
    
    /**
     * Opcionális környezeti változó lekérése default értékkel
     */
    private static String get(String key) {
        String value = dotenv.get(key);
        return (value != null && !value.trim().isEmpty()) ? value.trim() : "hiba a .env file-al";
    }
    
    /**
     * Konfiguráció validálása induláskor
     */
    private static void validateConfiguration() {
        System.out.println("=== EnvConfig Validálás ===");
        
        // JWT Secret ellenőrzés
        String jwtSecret = getJwtSecret();
        if (jwtSecret.length() < 32) {
            throw new IllegalStateException(
                "HIBA: JWT_SECRET túl rövid! Minimum 32 karakter szükséges. (Jelenlegi: " + jwtSecret.length() + ")"
            );
        }
        
        // Refresh Secret ellenőrzés
        String refreshSecret = getRefreshSecret();
        if (refreshSecret.length() < 32) {
            throw new IllegalStateException(
                "HIBA: REFRESH_SECRET túl rövid! Minimum 32 karakter szükséges. (Jelenlegi: " + refreshSecret.length() + ")"
            );
        }
        
        // Ugyanaz nem lehet
        if (jwtSecret.equals(refreshSecret)) {
            throw new IllegalStateException(
                "HIBA: JWT_SECRET és REFRESH_SECRET nem lehet ugyanaz!"
            );
        }
        
        // Token élettartamok ellenőrzése
        long accessMinutes = getAccessTokenExpirationMinutes();
        if (accessMinutes <= 0 || accessMinutes > 1440) {
            throw new IllegalStateException(
                "HIBA: ACCESS_TOKEN_EXPIRATION_MINUTES értéke 1-1440 között kell legyen! (Jelenlegi: " + accessMinutes + ")"
            );
        }
        
        long refreshDays = getRefreshTokenExpirationDays();
        if (refreshDays <= 0 || refreshDays > 30) {
            throw new IllegalStateException(
                "HIBA: REFRESH_TOKEN_EXPIRATION_DAYS értéke 1-30 között kell legyen! (Jelenlegi: " + refreshDays + ")"
            );
        }
        
        System.out.println("✓ Konfiguráció sikeres");
        System.out.println("  - Access Token: " + accessMinutes + " perc");
        System.out.println("  - Refresh Token: " + refreshDays + " nap");
        System.out.println("===========================");
    }
    
    // ===== JWT Configuration =====
    
    /**
     * JWT Secret (Access Token-hez)
     * KÖTELEZŐ - minimum 32 karakter
     */
    public static String getJwtSecret() {
        return getRequired("JWT_SECRET");
    }
    
    /**
     * Refresh Secret (Refresh Token-hez)
     * KÖTELEZŐ - minimum 32 karakter
     */
    public static String getRefreshSecret() {
        return getRequired("REFRESH_SECRET");
    }
    
    /**
     * Access Token élettartam percben
     * KÖTELEZŐ - 1-1440 (max 24 óra)
     */
    public static long getAccessTokenExpirationMinutes() {
        return Long.parseLong(getRequired("ACCESS_TOKEN_EXPIRATION_MINUTES"));
    }
    
    /**
     * Refresh Token élettartam napokban
     * KÖTELEZŐ - 1-30
     */
    public static long getRefreshTokenExpirationDays() {
        return Long.parseLong(getRequired("REFRESH_TOKEN_EXPIRATION_DAYS"));
    }
    
    
    
    // ===== Argon2 Configuration =====
    
    /**
     * Argon2 salt hossz
     */
    public static int getArgon2SaltLength() {
        return Integer.parseInt(get("ARGON2_SALT_LENGTH"));
    }
    
    /**
     * Argon2 hash hossz
     */
    public static int getArgon2HashLength() {
        return Integer.parseInt(get("ARGON2_HASH_LENGTH"));
    }
    
    /**
     * Argon2 iterációk száma
     */
    public static int getArgon2Iterations() {
        return Integer.parseInt(get("ARGON2_ITERATIONS"));
    }
    
    /**
     * Argon2 memória KB-ban
     */
    public static int getArgon2Memory() {
        return Integer.parseInt(get("ARGON2_MEMORY"));
    }
    
    /**
     * Argon2 párhuzamosság
     */
    public static int getArgon2Parallelism() {
        return Integer.parseInt(get("ARGON2_PARALLELISM"));
    }
    
}