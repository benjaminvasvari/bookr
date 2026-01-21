package com.vizsgaremek.bookr.config;

import io.github.cdimascio.dotenv.Dotenv;
import java.io.File;

/**
 * Környezeti változók kezelése .env fájlból tölti be a konfigurációt
 */
public class EnvConfig {

    private static final Dotenv dotenv;

    // Statikus inicializálás
    static {
        try {
            dotenv = Dotenv.configure()
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
     *
     * @throws IllegalStateException ha hiányzik
     */
    private static String getRequired(String key) {
        String value = dotenv.get(key);

        if (value == null || value.trim().isEmpty()) {
            throw new IllegalStateException(
                    "HIBA: Hiányzó kötelező környezeti változó: " + key
                    + "\nEllenőrizd a .env fájlt!"
            );
        }

        return value.trim();
    }

    /**
     * Opcionális környezeti változó lekérése default értékkel PUBLIC -
     * használható más config osztályokból is!
     */
    public static String get(String key, String defaultValue) {
        String value = dotenv.get(key);
        return (value != null && !value.trim().isEmpty()) ? value.trim() : defaultValue;
    }

    /**
     * Környezeti változó lekérése default érték nélkül
     */
    private static String get(String key) {
        String value = dotenv.get(key);
        return (value != null && !value.trim().isEmpty()) ? value.trim() : null;
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
                    "HIBA: ACCESS_SECRET túl rövid! Minimum 32 karakter szükséges. (Jelenlegi: " + jwtSecret.length() + ")"
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
                    "HIBA: ACCESS_SECRET és REFRESH_SECRET nem lehet ugyanaz!"
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

        System.out.println("=== EnvConfig Validálás ===");

        // ... meglévő JWT és Argon2 validációk ...
        // ===== FILE UPLOAD VALIDÁCIÓ =====
        // 1. Upload könyvtár ellenőrzése
        String uploadDir = getUploadBaseDir();
        File uploadDirFile = new File(uploadDir);

        if (!uploadDirFile.exists()) {
            throw new IllegalStateException(
                    "HIBA: Upload könyvtár nem létezik: " + uploadDir
                    + "\nHozd létre a mappát vagy frissítsd az UPLOAD_BASE_DIR változót!"
            );
        }

        if (!uploadDirFile.isDirectory()) {
            throw new IllegalStateException(
                    "HIBA: UPLOAD_BASE_DIR nem könyvtár: " + uploadDir
            );
        }

        if (!uploadDirFile.canWrite()) {
            throw new IllegalStateException(
                    "HIBA: Upload könyvtár nem írható: " + uploadDir
                    + "\nEllenőrizd a jogosultságokat!"
            );
        }

        // 2. Almappák ellenőrzése/létrehozása
        File companiesDir = new File(uploadDir, "companies");
        File usersDir = new File(uploadDir, "users");

        if (!companiesDir.exists()) {
            if (!companiesDir.mkdirs()) {
                throw new IllegalStateException(
                        "HIBA: Nem sikerült létrehozni a companies mappát: " + companiesDir.getAbsolutePath()
                );
            }
            System.out.println("  ✓ Companies mappa létrehozva: " + companiesDir.getAbsolutePath());
        }

        if (!usersDir.exists()) {
            if (!usersDir.mkdirs()) {
                throw new IllegalStateException(
                        "HIBA: Nem sikerült létrehozni a users mappát: " + usersDir.getAbsolutePath()
                );
            }
            System.out.println("  ✓ Users mappa létrehozva: " + usersDir.getAbsolutePath());
        }

        // 3. Upload URL validáció
        String uploadUrl = getUploadBaseUrl();
        if (!uploadUrl.startsWith("http://") && !uploadUrl.startsWith("https://")) {
            throw new IllegalStateException(
                    "HIBA: UPLOAD_BASE_URL invalid formátum: " + uploadUrl
                    + "\nPélda: http://localhost:8080/api/uploads"
            );
        }

        // 4. Max fájlméret validáció
        long maxSize = getUploadMaxFileSize();
        if (maxSize <= 0 || maxSize > 10485760) { // max 10MB
            throw new IllegalStateException(
                    "HIBA: UPLOAD_MAX_FILE_SIZE értéke 1 byte - 10MB között lehet! (Jelenlegi: " + maxSize + " byte)"
            );
        }

        System.out.println("✓ Konfiguráció sikeres");
        System.out.println("  - Access Token: " + getAccessTokenExpirationMinutes() + " perc");
        System.out.println("  - Refresh Token: " + getRefreshTokenExpirationDays() + " nap");
        System.out.println("  - Upload dir: " + uploadDir);
        System.out.println("  - Max file size: " + getUploadMaxFileSizeMB() + " MB");
        System.out.println("  - Company max images: " + getCompanyMaxImages());
        System.out.println("===========================");

    }

    // ===== JWT Configuration =====
    /**
     * JWT Secret (Access Token-hez) KÖTELEZŐ - minimum 32 karakter
     */
    public static String getJwtSecret() {
        return getRequired("ACCESS_SECRET");
    }

    /**
     * Refresh Secret (Refresh Token-hez) KÖTELEZŐ - minimum 32 karakter
     */
    public static String getRefreshSecret() {
        return getRequired("REFRESH_SECRET");
    }

    /**
     * Access Token élettartam percben KÖTELEZŐ - 1-1440 (max 24 óra)
     */
    public static long getAccessTokenExpirationMinutes() {
        return Long.parseLong(getRequired("ACCESS_TOKEN_EXPIRATION_MINUTES"));
    }

    /**
     * Refresh Token élettartam napokban KÖTELEZŐ - 1-30
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

    // ===== File Upload Configuration =====
    /**
     * Upload könyvtár alapútvonala KÖTELEZŐ - ahol a feltöltött fájlok
     * tárolódnak
     */
    public static String getUploadBaseDir() {
        return getRequired("UPLOAD_BASE_DIR");
    }

    /**
     * Upload URL prefix (API endpoint alapja)
     */
    public static String getUploadBaseUrl() {
        return getRequired("UPLOAD_BASE_URL");
    }

    /**
     * Maximum fájlméret byte-ban
     */
    public static long getUploadMaxFileSize() {
        return Long.parseLong(get("UPLOAD_MAX_FILE_SIZE"));
    }

    /**
     * Maximum fájlméret MB-ban (olvashatóbb formátum)
     */
    public static double getUploadMaxFileSizeMB() {
        return getUploadMaxFileSize() / (1024.0 * 1024.0);
    }

    /**
     * Engedélyezett fájl típusok (MIME types)
     */
    public static String[] getAllowedImageTypes() {
        String types = get("UPLOAD_ALLOWED_TYPES");
        return types.split(",");
    }

    /**
     * Engedélyezett fájl extension-ök
     */
    public static String[] getAllowedImageExtensions() {
        String extensions = get("UPLOAD_ALLOWED_EXTENSIONS");
        return extensions.split(",");
    }

    /**
     * Company maximum képeinek száma (main + gallery)
     */
    public static int getCompanyMaxImages() {
        return Integer.parseInt(get("COMPANY_MAX_IMAGES"));
    }
}
