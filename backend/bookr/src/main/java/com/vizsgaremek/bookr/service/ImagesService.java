package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.model.AuditLogs;
import com.vizsgaremek.bookr.model.Images;
import com.vizsgaremek.bookr.security.JWT;
import com.vizsgaremek.bookr.util.FileStorageUtil;
import com.vizsgaremek.bookr.util.FileValidator;
import java.io.InputStream;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Service for image operations
 *
 * @author vben
 */
public class ImagesService {

    private Images layer = new Images();
    private CompaniesService CompaniesService = new CompaniesService();
    private UsersService UsersService = new UsersService();
    private AuditLogService AuditLogService = new AuditLogService();

    public JSONObject getCompanyImages(Integer companyId) {
        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        try {
            // Input validáció
            if (companyId == null || companyId <= 0) {
                status = "InvalidParamValue";
                statusCode = 400;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                toReturn.put("message", "Invalid company ID");
                return toReturn;
            }

            // Adatbázis lekérdezés
            List<Images> modelResult = layer.getCompanyNotMainImages(companyId);

            // NULL ELLENŐRZÉS
            if (modelResult == null) {
                status = "NotFound";
                statusCode = 404;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                toReturn.put("message", "Company not found with ID: " + companyId);
                return toReturn;
            }

            // Sikeres válasz összeállítása
            JSONArray result = new JSONArray();

            for (Images actualImage : modelResult) {
                JSONObject actualImageObject = new JSONObject();

                actualImageObject.put("id", actualImage.getId());
                actualImageObject.put("url", actualImage.getUrl());
                actualImageObject.put("isMain", actualImage.getIsMain());
                actualImageObject.put("uploadedAt", actualImage.getUploadedAt());

                result.put(actualImageObject);
            }

            toReturn.put("result", result);

            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);

        } catch (Exception ex) {
            ex.printStackTrace();
            status = "InternalServerError";
            statusCode = 500;
            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
        }

        return toReturn;
    }

    public JSONObject getUserProfilePicture(Integer userId) {
        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        try {
            // Input validáció
            if (userId == null || userId <= 0) {
                status = "InvalidParamValue";
                statusCode = 400;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                toReturn.put("message", "Invalid user ID");
                return toReturn;
            }

            // Adatbázis lekérdezés
            Images modelResult = layer.getUserProfilePicture(userId);

            // NULL ELLENŐRZÉS
            if (modelResult == null) {
                status = "NotFound";
                statusCode = 404;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                toReturn.put("message", "User not found with ID: " + userId);
                return toReturn;
            }

            // Sikeres válasz összeállítása
            JSONObject result = new JSONObject();

            result.put("id", modelResult.getId());
            result.put("url", modelResult.getUrl());
            result.put("uploadedAt", modelResult.getUploadedAt());
            result.put("userId", modelResult.getUserIdInt());

            toReturn.put("result", result);

            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);

        } catch (Exception ex) {
            ex.printStackTrace();
            status = "InternalServerError";
            statusCode = 500;
            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
        }

        return toReturn;
    }

    public JSONObject uploadCompanyImage(Integer companyId, String jwtToken, String filename, long fileSize, String mimeType, InputStream inputStream, boolean isMain) {
        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        try {

            // Company exist
            Boolean isCompanyExist = CompaniesService.validateCompanyExist(companyId);

            if (isCompanyExist == null) {
                status = "InternalServerError";
                statusCode = 500;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                return toReturn;
            }
            if (!isCompanyExist) {
                status = "NotFound";
                statusCode = 404;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                return toReturn;
            }

            if (!isMain) {
                Integer imageCount = layer.getCompanyImageCount(companyId);

                if (imageCount == 4) {
                    status = "ReachedMaxImageCount";
                    statusCode = 409;
                    toReturn.put("status", status);
                    toReturn.put("statusCode", statusCode);
                    return toReturn;
                }

                if (imageCount > 4) {
                    status = "MoreThan4Image";
                    statusCode = 409;
                    toReturn.put("status", status);
                    toReturn.put("statusCode", statusCode);
                    System.err.println("Több mint 4 kép!! Valami nagyon nem jó");
                    return toReturn;
                }
            }

            // ezt még néézd át
            FileValidator.validateUploadedFile(filename, fileSize, mimeType);

            String uniqueFilename = FileStorageUtil.generateUniqueFilename(filename);

            String relativePath = FileStorageUtil.saveFile(
                    inputStream,
                    "companies",
                    companyId,
                    uniqueFilename
            );

            if (relativePath == null) {
                status = "ImageSaveError";
                statusCode = 500;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                System.err.println("Nem sikerült a mentés");
                return toReturn;
            }

            Images modelResult = layer.uploadCompanyImage(companyId, relativePath, isMain);

            if (modelResult == null) {
                status = "serverError";
                statusCode = 500;
            } else {
                // ========== AUDIT LOG ==========
                try {
                    Integer userId = JWT.getUserIdFromAccessToken(jwtToken);
                    String userEmail = JWT.getEmailFromAccessToken(jwtToken);
                    String userRoles = JWT.getRolesFromAccessToken(jwtToken);

                    AuditLogService.logSimpleAction(
                            userId,
                            userRoles.split(",")[0].trim(),
                            null,
                            companyId,
                            userEmail,
                            "company",
                            isMain == true ? "uploadedMainImage" : "uploadedImage"
                    );

                } catch (Exception ex) {
                    // Log the error but don't fail the registration
                    ex.printStackTrace();
                }
                // ===============================
            }

            String fullUrl = FileStorageUtil.buildFullUrl(relativePath);

            JSONObject result = new JSONObject();

            result.put("id", modelResult.getId());
            result.put("url", fullUrl);
            result.put("relativePath", relativePath);

            toReturn.put("result", result);

            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);

        } catch (Exception ex) {
            ex.printStackTrace();
            status = "InternalServerError";
            statusCode = 500;
            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
        }

        return toReturn;
    }

    public JSONObject softDeleteCompanyImage(String jwtToken, Integer companyId, Integer imageId) {

        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        // Company exist
        Boolean isCompanyExist = CompaniesService.validateCompanyExist(companyId);

        if (isCompanyExist == null) {
            status = "InternalServerError";
            statusCode = 500;
            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
            return toReturn;
        }
        if (!isCompanyExist) {
            status = "CompanyNotFound";
            statusCode = 404;
            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
            return toReturn;
        }

        Boolean modelResult = Images.softDeleteCompanyImage(companyId, imageId);

        if (modelResult == false) {
            status = "serverError";
            statusCode = 500;
        } else {
            // ========== AUDIT LOG ==========
            try {
                Integer userId = JWT.getUserIdFromAccessToken(jwtToken);

                String userEmail = JWT.getEmailFromAccessToken(jwtToken);
                String userRoles = JWT.getRolesFromAccessToken(jwtToken);

                AuditLogService.logSimpleAction(
                        userId,
                        userRoles.split(",")[0].trim(),
                        null,
                        JWT.getCompanyIdFromAccessToken(jwtToken) != null ? JWT.getCompanyIdFromAccessToken(jwtToken) : null,
                        userEmail,
                        "company",
                        "deleteImage"
                );

            } catch (Exception ex) {
                // Log the error but don't fail the registration
                ex.printStackTrace();
            }
            // ===============================
        }
        toReturn.put("result", modelResult);

        toReturn.put(
                "status", status);
        toReturn.put(
                "statusCode", statusCode);
        return toReturn;
    }

    public JSONObject softDeleteUserImage(String jwtToken, Integer userId, Integer imageId) {

        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        // Company exist
        Boolean isUserExist = UsersService.validateUserExist(userId);

        if (isUserExist == null) {
            status = "InternalServerError";
            statusCode = 500;
            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
            return toReturn;
        }
        if (!isUserExist) {
            status = "CompanyNotFound";
            statusCode = 404;
            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
            return toReturn;
        }

        Boolean modelResult = Images.softDeleteCompanyImage(userId, imageId);

        if (modelResult == false) {
            status = "serverError";
            statusCode = 500;
        } else {
            // ========== AUDIT LOG ==========
            try {
                Integer jwtUserId = JWT.getUserIdFromAccessToken(jwtToken);
                String userEmail = JWT.getEmailFromAccessToken(jwtToken);
                String userRoles = JWT.getRolesFromAccessToken(jwtToken);

                try {
                    AuditLogs auditLog = new AuditLogs(
                            jwtUserId,
                            userRoles.split(",")[0].trim(),
                            userId,
                            userEmail,
                            "user",
                            "updateUser"
                    );

                    auditLog.addNewValue("userId", userId);
                    auditLog.addNewValue("imageId", imageId);

                    AuditLogService.logAudit(auditLog);

                } catch (Exception ex) {
                    // Log the error but don't fail the registration
                    ex.printStackTrace();
                }

            } catch (Exception ex) {
                // Log the error but don't fail the registration
                ex.printStackTrace();
            }
            // ===============================
        }
        toReturn.put("result", modelResult);

        toReturn.put("status", status);
        toReturn.put("statusCode", statusCode);
        return toReturn;
    }

    public JSONObject uploadUserImage(Integer userId, String jwtToken, String filename, long fileSize, String mimeType, InputStream inputStream) {
        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        try {

            Boolean isUserExist = UsersService.validateUserExist(userId);

            if (isUserExist == null) {
                status = "InternalServerError";
                statusCode = 500;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                return toReturn;
            }
            if (!isUserExist) {
                status = "NotFound";
                statusCode = 404;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                return toReturn;
            }

            FileValidator.validateUploadedFile(filename, fileSize, mimeType);

            String uniqueFilename = FileStorageUtil.generateUniqueFilename(filename);

            String relativePath = FileStorageUtil.saveFile(
                    inputStream,
                    "users",
                    userId,
                    uniqueFilename
            );

            if (relativePath == null) {
                status = "ImageSaveError";
                statusCode = 500;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                System.err.println("Nem sikerült a mentés");
                return toReturn;
            }

            Images modelResult = layer.uploadUserImage(userId, relativePath);

            if (modelResult == null) {
                status = "serverError";
                statusCode = 500;
            } else {
                // ========== AUDIT LOG ==========
                try {
                    String userEmail = JWT.getEmailFromAccessToken(jwtToken);
                    String userRoles = JWT.getRolesFromAccessToken(jwtToken);

                    AuditLogService.logSimpleAction(
                            userId,
                            userRoles.split(",")[0].trim(),
                            null,
                            null,
                            userEmail,
                            "user",
                            "uploadProfileImage"
                    );

                } catch (Exception ex) {
                    // Log the error but don't fail the registration
                    ex.printStackTrace();
                }
                // ===============================
            }

            String fullUrl = FileStorageUtil.buildFullUrl(relativePath);

            JSONObject result = new JSONObject();

            result.put("id", modelResult.getId());
            result.put("url", fullUrl);
            result.put("originalFilename", filename);

            toReturn.put("result", result);

            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);

        } catch (Exception ex) {
            ex.printStackTrace();
            status = "InternalServerError";
            statusCode = 500;
            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
        }

        return toReturn;
    }
}
