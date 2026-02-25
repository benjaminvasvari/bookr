/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.util;

import com.vizsgaremek.bookr.config.EnvConfig;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 *
 * @author vben
 */
public class FileStorageUtil {

    // Buffer méret file másoláshoz (8KB)
    private static final int BUFFER_SIZE = 8192;

    // Private constructor - utility osztály
    private FileStorageUtil() {
        throw new IllegalStateException("Utility class - cannot instantiate");
    }

    public static String generateUniqueFilename(String originalFilename) {
        // UUID generálás
        String uuid = UUID.randomUUID().toString();

        // Extension kivonása az eredeti fájlnévből
        String extension = FileValidator.getFileExtension(originalFilename);

        return uuid + "." + extension;
    }

    // Relatív file path összeállítása (ez megy a db-be)
    public static String buildRelativePath(String type, Integer entityId, String filename) {
        return type + "/" + entityId + "/" + filename;
    }

    // Abszolút file path összeállítása (fizikai file system)
    public static Path buildAbsolutePath(String relativePath) {
        String baseDir = EnvConfig.getUploadBaseDir();

        return Paths.get(baseDir, relativePath);
    }

    public static String buildFullUrl(String relativePath) {
        String baseUrl = EnvConfig.getUploadBaseUrl();

        // Ensure no double slashes
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }

        if (relativePath.startsWith("/")) {
            relativePath = relativePath.substring(1);
        }

        return baseUrl + "/" + relativePath;
    }

    // Directory létrehozása ha még nem létezik
    public static void ensureDirectoryExists(String type, Integer entityId) {
        try {
            String relativePath = type + "/" + entityId;
            Path dirPath = buildAbsolutePath(relativePath);

            // Létrehozza a directory-t (és az összes parent directory-t is)
            Files.createDirectories(dirPath);

        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    // Fájl mentése
    public static String saveFile(InputStream inputStream, String type, Integer entityId, String filename) {

        try {

            // 1. Directory létrehozása
            ensureDirectoryExists(type, entityId);

            // 2. Relatív path összeállítása
            String relativePath = buildRelativePath(type, entityId, filename);

            // 3. Abszolút path összeállítása
            Path absolutePath = buildAbsolutePath(relativePath);

            // 4. File mentés
            Files.copy(inputStream, absolutePath, StandardCopyOption.REPLACE_EXISTING);

            // 5. Visszaadjuk a relatív path-ot (ezt menti az adatbázisba)
            return relativePath;

        } catch (IOException ex) {
            ex.printStackTrace();
            return null;

        } finally {
            // InputStream bezárása
            try {
                inputStream.close();

            } catch (IOException e) {
                // Ignore close exception
            }
        }
    }

    /**
     * File beolvasása file system-ből
     *
     * @param relativePath Relatív path (adatbázisból)
     * @return InputStream a file tartalmához
     */
    public static InputStream readFile(String relativePath) {
        try {
            Path absolutePath = buildAbsolutePath(relativePath);

            // Ellenőrzi hogy létezik-e
            if (!Files.exists(absolutePath)) {
                return null;
            }

            // Ellenőrzi hogy olvasható-e
            if (!Files.isReadable(absolutePath)) {
                return null;
            }

            // InputStream visszaadása
            return Files.newInputStream(absolutePath);

        } catch (IOException ex) {
            ex.printStackTrace();
            return null;
        }
    }

    /**
     * Ellenőrzi hogy létezik-e a file
     *
     * @param relativePath Relatív path
     * @return true ha létezik, false ha nem
     */
    public static boolean fileExists(String relativePath) {
        Path absolutePath = buildAbsolutePath(relativePath);
        return Files.exists(absolutePath);
    }
}
