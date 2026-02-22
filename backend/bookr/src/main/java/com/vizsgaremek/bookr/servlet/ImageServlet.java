package com.vizsgaremek.bookr.servlet;

import com.vizsgaremek.bookr.config.EnvConfig;
import com.vizsgaremek.bookr.util.FileStorageUtil;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Feltöltött képek kiszolgálása
 * URL pattern: /api/uploads/{type}/{id}/{filename}
 * Példa: /api/uploads/companies/123/abc.jpg
 */
@WebServlet("/uploads/*")
public class ImageServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        // URL path: /uploads/companies/123/abc.jpg
        String requestedPath = request.getPathInfo();  // "/companies/123/abc.jpg"

        if (requestedPath == null || requestedPath.isEmpty() || requestedPath.equals("/")) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid image path");
            return;
        }

        // Leading slash eltávolítása
        if (requestedPath.startsWith("/")) {
            requestedPath = requestedPath.substring(1);
        }
        // → "companies/123/abc.jpg"

        try {
            // 1. Biztonsági ellenőrzés - path traversal védelem
            validatePath(requestedPath);

            // 2. File létezik-e?
            if (!FileStorageUtil.fileExists(requestedPath)) {
                response.sendError(HttpServletResponse.SC_NOT_FOUND, "Image not found");
                return;
            }

            // 3. Abszolút path lekérése
            Path filePath = FileStorageUtil.buildAbsolutePath(requestedPath);
            File file = filePath.toFile();

            // 4. Dupla biztonsági ellenőrzés - canonical path
            String canonicalPath = file.getCanonicalPath();
            String baseDir = new File(EnvConfig.getUploadBaseDir()).getCanonicalPath();
            
            if (!canonicalPath.startsWith(baseDir)) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Access denied");
                return;
            }

            // 5. Content-Type beállítása
            String contentType = determineContentType(file.getName());
            response.setContentType(contentType);

            // 6. Cache headers (1 év - képek nem változnak UUID miatt)
            response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
            response.setHeader("ETag", generateETag(file));

            // 7. Content-Length
            response.setContentLengthLong(file.length());

            // 8. Fájl tartalmának visszaadása
            Files.copy(filePath, response.getOutputStream());
            response.getOutputStream().flush();

        } catch (SecurityException e) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Security violation: " + e.getMessage());
        } catch (Exception e) {
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error serving image");
            e.printStackTrace();
        }
    }

    /**
     * Path validálás - path traversal védelem
     */
    private void validatePath(String path) throws SecurityException {
        // Path traversal attack védelem
        if (path.contains("..") || path.contains("./") || path.contains("\\")) {
            throw new SecurityException("Path traversal attempt detected");
        }

        // Null byte injection védelem
        if (path.contains("\0")) {
            throw new SecurityException("Null byte injection attempt detected");
        }

        // Csak companies/ és users/ prefix engedélyezett
        if (!path.startsWith("companies/") && !path.startsWith("users/")) {
            throw new SecurityException("Invalid path prefix");
        }
    }

    /**
     * Content-Type meghatározása fájlnév alapján
     */
    private String determineContentType(String filename) {
        String extension = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        
        switch (extension) {
            case "jpg":
            case "jpeg":
                return "image/jpeg";
            case "png":
                return "image/png";
            case "webp":
                return "image/webp";
            case "gif":
                return "image/gif";
            case "svg":
                return "image/svg+xml";
            default:
                return "application/octet-stream";
        }
    }

    /**
     * ETag generálás (cache optimalizálás)
     */
    private String generateETag(File file) {
        // Simple ETag: filename + last modified + size
        return "\"" + file.getName() + "-" + file.lastModified() + "-" + file.length() + "\"";
    }
}