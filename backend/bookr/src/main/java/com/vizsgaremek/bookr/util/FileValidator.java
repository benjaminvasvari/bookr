/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.util;

import com.vizsgaremek.bookr.config.EnvConfig;
import java.util.Arrays;
import java.util.regex.Pattern;
import javax.validation.ValidationException;

/**
 *
 * @author vben
 */
public class FileValidator {

    // Veszélyes karakterek regex pattern
    private static final Pattern DANGEROUS_CHARS = Pattern.compile("[^a-zA-Z0-9._-]");

    // Path traversal attack pattern
    private static final Pattern PATH_TRAVERSAL = Pattern.compile(".*[/\\\\]?\\.\\.[/\\\\].*");

    // Private constructor - ne lehessen példányosítani (utility osztály)
    private FileValidator() {
        throw new IllegalStateException("Utility class - cannot instantiate");
    }

    /**
     * Fájlméret validálása
     *
     * @param fileSize Fájl mérete byte-ban
     * @throws ValidationException ha túl nagy a fájl
     */
    public static void validateFileSize(long fileSize) throws ValidationException {
        if (fileSize <= 0) {
            throw new ValidationException("A fájl üres vagy nem létezik");
        }

        long maxSize = EnvConfig.getUploadMaxFileSize();

        if (fileSize > maxSize) {
            double fileSizeMB = fileSize / (1024.0 * 1024.0);
            double maxSizeMB = EnvConfig.getUploadMaxFileSizeMB();

            throw new ValidationException(
                    String.format("A fájl túl nagy (%.2f MB). Maximum megengedett: %.2f MB",
                            fileSizeMB, maxSizeMB)
            );
        }
    }

    /**
     * MIME type (Content-Type) validálása Csak engedélyezett képformátumok
     *
     * @param mimeType Fájl MIME típusa (pl. "image/jpeg")
     * @throws ValidationException ha nem engedélyezett formátum
     */
    public static void validateMimeType(String mimeType) throws ValidationException {
        if (mimeType == null || mimeType.trim().isEmpty()) {
            throw new ValidationException("MIME type hiányzik");
        }

        String[] allowedTypes = EnvConfig.getAllowedImageTypes();
        boolean isAllowed = Arrays.stream(allowedTypes)
                .anyMatch(type -> type.equalsIgnoreCase(mimeType.trim()));

        if (!isAllowed) {
            throw new ValidationException(
                    String.format("Nem engedélyezett fájl formátum: %s. Engedélyezett: %s",
                            mimeType, String.join(", ", allowedTypes))
            );
        }
    }

    /**
     * Fájl kiterjesztés validálása
     *
     * @param filename Fájlnév (pl. "photo.jpg")
     * @throws ValidationException ha nem engedélyezett kiterjesztés
     */
    public static void validateFileExtension(String filename) throws ValidationException {
        if (filename == null || filename.trim().isEmpty()) {
            throw new ValidationException("Fájlnév hiányzik");
        }

        // Extension kivonása (utolsó pont után)
        int lastDotIndex = filename.lastIndexOf('.');

        if (lastDotIndex == -1 || lastDotIndex == filename.length() - 1) {
            throw new ValidationException("A fájlnak nincs kiterjesztése");
        }

        String extension = filename.substring(lastDotIndex + 1).toLowerCase();
        String[] allowedExtensions = EnvConfig.getAllowedImageExtensions();

        boolean isAllowed = Arrays.stream(allowedExtensions)
                .anyMatch(ext -> ext.equalsIgnoreCase(extension));

        if (!isAllowed) {
            throw new ValidationException(
                    String.format("Nem engedélyezett fájl kiterjesztés: .%s. Engedélyezett: %s",
                            extension, String.join(", ", allowedExtensions))
            );
        }
    }

    /**
     * Fájlnév megtisztítása (sanitize) Eltávolítja a veszélyes karaktereket
     *
     * @param filename Eredeti fájlnév
     * @return Biztonságos fájlnév
     */
    public static String sanitizeFilename(String filename) {
        if (filename == null || filename.trim().isEmpty()) {
            return "unnamed";
        }

        // Trim és lowercase
        String sanitized = filename.trim();

        // Veszélyes karakterek cseréje underscore-ra
        sanitized = DANGEROUS_CHARS.matcher(sanitized).replaceAll("_");

        // Több underscore egymás után → egy underscore
        sanitized = sanitized.replaceAll("_{2,}", "_");

        // Elején/végén ne legyen underscore vagy pont
        sanitized = sanitized.replaceAll("^[._]+|[._]+$", "");

        // Ha üres lett, default név
        if (sanitized.isEmpty()) {
            return "unnamed";
        }

        return sanitized;
    }

    /**
     * Path traversal attack ellenőrzése Megakadályozza a "../" típusú
     * támadásokat
     *
     * @param filename Fájlnév vagy path
     * @throws ValidationException ha path traversal kísérletet észlel
     */
    public static void validatePathTraversal(String filename) throws ValidationException {
        if (filename == null || filename.trim().isEmpty()) {
            throw new ValidationException("Fájlnév hiányzik");
        }

        // Path traversal pattern ellenőrzése
        if (PATH_TRAVERSAL.matcher(filename).matches()) {
            throw new ValidationException(
                    "Biztonsági hiba: path traversal kísérlet észlelve a fájlnévben"
            );
        }

        // Null byte injection védelem
        if (filename.contains("\0")) {
            throw new ValidationException(
                    "Biztonsági hiba: null byte injection kísérlet észlelve"
            );
        }

        // Abszolút path védelem
        if (filename.startsWith("/") || filename.contains(":\\")) {
            throw new ValidationException(
                    "Biztonsági hiba: abszolút path használata nem engedélyezett"
            );
        }
    }

    /**
     * Fájl kiterjesztés kivonása a fájlnévből
     *
     * @param filename Fájlnév (pl. "photo.jpg")
     * @return Kiterjesztés kisbetűvel (pl. "jpg") vagy null ha nincs
     */
    public static String getFileExtension(String filename) {
        if (filename == null || filename.trim().isEmpty()) {
            return null;
        }

        int lastDotIndex = filename.lastIndexOf('.');

        if (lastDotIndex == -1 || lastDotIndex == filename.length() - 1) {
            return null;
        }

        return filename.substring(lastDotIndex + 1).toLowerCase();
    }

    /**
     * Teljes fájl validáció (all-in-one) Minden ellenőrzés egyszerre
     *
     * @param filename Fájlnév
     * @param fileSize Fájlméret byte-ban
     * @param mimeType MIME type
     * @throws ValidationException ha bármelyik validáció sikertelen
     */
    public static void validateUploadedFile(String filename, long fileSize, String mimeType)
            throws ValidationException {

        // 1. Path traversal védelem
        validatePathTraversal(filename);

        // 2. Fájlméret
        validateFileSize(fileSize);

        // 3. MIME type
        validateMimeType(mimeType);

        // 4. Extension
        validateFileExtension(filename);
    }
}
