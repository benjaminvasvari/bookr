package com.vizsgaremek.bookr.servlet;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@WebServlet("/images/*")
public class ImageServlet extends HttpServlet {

    // Képek root mappája
    private static final String IMAGE_BASE_DIR = "/Users/vben/Programming school/idopontfogalo_rendszer/backend/bookr/uploads/images";

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        // URL path: /images/companies/1/main.jpg
        String requestedPath = request.getPathInfo();  // "/companies/1/main.jpg"

        if (requestedPath == null || requestedPath.equals("/")) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        // Teljes fájl path
        Path filePath = Paths.get(IMAGE_BASE_DIR + requestedPath);
        File file = filePath.toFile();

        // Biztonsági ellenőrzés: ne lehessen kilépni a mappából
        if (!file.getCanonicalPath().startsWith(new File(IMAGE_BASE_DIR).getCanonicalPath())) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN);
            return;
        }

        // Fájl létezik?
        if (!file.exists() || !file.isFile()) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        // Content-Type beállítása (MIME type)
        String contentType = getServletContext().getMimeType(file.getName());
        if (contentType == null) {
            contentType = "application/octet-stream";  // fallback
        }
        response.setContentType(contentType);

        // Cache header (1 év)
        response.setHeader("Cache-Control", "public, max-age=31536000");

        // Fájl mérete
        response.setContentLengthLong(file.length());

        // Fájl tartalmának visszaadása
        Files.copy(filePath, response.getOutputStream());
        response.getOutputStream().flush();
    }
}
