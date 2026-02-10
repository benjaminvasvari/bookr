/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.DTO.CompanyRegisterRequest;
import com.vizsgaremek.bookr.model.AuditLogs;
import com.vizsgaremek.bookr.model.Companies;
import com.vizsgaremek.bookr.model.Images;
import com.vizsgaremek.bookr.model.OpeningHours;
import com.vizsgaremek.bookr.model.Reviews;
import com.vizsgaremek.bookr.model.UserXRole;
import com.vizsgaremek.bookr.model.Users;
import com.vizsgaremek.bookr.security.JWT;
import com.vizsgaremek.bookr.util.FileStorageUtil;
import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Map;
import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.Persistence;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 *
 * @author vben
 */
public class CompaniesService {

    private Companies layer = new Companies();
    private ServiceCategoryService serviceCategoryService = new ServiceCategoryService();
    private Users Users = new Users();
    private UserXRole UserXRole = new UserXRole();
    private AuditLogService AuditLogService = new AuditLogService();

    // EntityManagerFactory a tranzakciókezeléshez
    private static EntityManagerFactory emf = Persistence.createEntityManagerFactory("com.vizsgaremek_bookr_war_1.0-SNAPSHOTPU");

    public JSONObject loadCompanyById(Integer id) {

        try {
            // 1. VALIDÁCIÓ
            if (id == null || id <= 0) {
                JSONObject error = new JSONObject();
                error.put("statusCode", 400);
                error.put("message", "Invalid company ID");
                return error;
            }

            // 2. COMPANY DATA
            Companies company = Companies.getCompanyDataById(id);

            if (company == null) {
                JSONObject error = new JSONObject();
                error.put("statusCode", 404);
                error.put("message", "Company not found with ID: " + id);
                return error;
            }

            // 3. SERVICE CATEGORIES (csoportosítva!)  ← JAVÍTVA!
            JSONArray serviceCategories = serviceCategoryService.getServiceCategoriesWithServicesByCompanyId(id);

            // 4. REVIEWS
            List<Reviews> reviewsList = Reviews.getReviewsByCompanyId(id);
            JSONArray reviews = new JSONArray();
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy. MM. dd.");

            for (Reviews review : reviewsList) {
                JSONObject reviewObj = new JSONObject();
                reviewObj.put("id", review.getId());
                reviewObj.put("userName", review.getUserName());
                reviewObj.put("userImage", review.getUserImage());
                reviewObj.put("rating", review.getRating());
                reviewObj.put("comment", review.getComment());
                reviewObj.put("date", sdf.format(review.getCreatedAt()));
                reviews.put(reviewObj);
            }

            // 5. GALLERY IMAGES
            List<Images> galleryImagesList = Images.getCompanyNotMainImages(id);
            JSONArray galleryImages = new JSONArray();
            for (Images img : galleryImagesList) {
                galleryImages.put(FileStorageUtil.buildFullUrl(img.getUrl()));
            }

            // 6. OPENING HOURS
            OpeningHours openingHours = OpeningHours.getOpeningHoursFormatted(id);
            JSONObject openingHoursObj = new JSONObject();
            if (openingHours != null) {
                openingHoursObj.put("monday", openingHours.getMonday());
                openingHoursObj.put("tuesday", openingHours.getTuesday());
                openingHoursObj.put("wednesday", openingHours.getWednesday());
                openingHoursObj.put("thursday", openingHours.getThursday());
                openingHoursObj.put("friday", openingHours.getFriday());
                openingHoursObj.put("saturday", openingHours.getSaturday());
                openingHoursObj.put("sunday", openingHours.getSunday());
            }

            // 7. ÖSSZERAKÁS - VÉGSŐ JSON
            JSONObject result = new JSONObject();
            result.put("statusCode", 200);
            result.put("id", company.getId());
            result.put("name", company.getName());
            result.put("description", company.getDescription());

            // Teljes cím
            String fullAddress = String.format("%s, %s %s, %s",
                    company.getAddress(),
                    company.getPostalCode(),
                    company.getCity(),
                    company.getCountry()
            );
            result.put("address", fullAddress);

            // AddressDetails nested object
            JSONObject addressDetails = new JSONObject();

            addressDetails.put("street", company.getAddress());
            addressDetails.put("postalCode", company.getPostalCode());
            addressDetails.put("city", company.getCity());
            addressDetails.put("country", company.getCountry());

            result.put("addressDetails", addressDetails);

            result.put("phone", company.getPhone());
            result.put("email", company.getEmail());
            result.put("website", company.getWebsite());
            result.put("businessCategoryId", company.getBusinessCategoryIdInt());
            result.put("category", company.getCategoryName());
            result.put("imageUrl", FileStorageUtil.buildFullUrl(company.getImageUrl()));
            result.put("rating", company.getRating());
            result.put("reviewCount", company.getReviewCount());

            result.put("serviceCategories", serviceCategories);
            result.put("reviews", reviews);
            result.put("galleryImages", galleryImages);
            result.put("openingHours", openingHoursObj);
            result.put("isFavorite", false);

            return result;

        } catch (Exception e) {
            e.printStackTrace();
            JSONObject error = new JSONObject();
            error.put("statusCode", 500);
            error.put("message", "Internal server error: " + e.getMessage());
            return error;
        }
    }

    public JSONObject getTopRecommendations(Integer limit) {
        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        try {
            // Input validáció
            if (limit == null || limit <= 0) {
                status = "InvalidParamValue";
                statusCode = 400;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                toReturn.put("message", "Invalid limit");
                return toReturn;
            }

            // Adatbázis lekérdezés
            List<Companies> modelResult = Companies.getTopRecommendations(limit);

            // NULL ELLENŐRZÉS
            if (modelResult == null) {
                status = "NotFound";
                statusCode = 404;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                toReturn.put("message", "No company found");
                return toReturn;
            }

            // Sikeres válasz összeállítása
            JSONArray result = new JSONArray();

            for (Companies actualCompany : modelResult) {
                JSONObject actualCompanyObject = new JSONObject();

                actualCompanyObject.put("id", actualCompany.getId());
                actualCompanyObject.put("name", actualCompany.getName());
                actualCompanyObject.put("rating", actualCompany.getRating());
                actualCompanyObject.put("reviewCount", actualCompany.getReviewCount());
                actualCompanyObject.put("address", actualCompany.getAddress());
                actualCompanyObject.put("imageUrl", FileStorageUtil.buildFullUrl(actualCompany.getImageUrl()));

                result.put(actualCompanyObject);
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

    public JSONObject getNewCompanies(Integer limit) {
        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        try {
            // Input validáció
            if (limit == null || limit <= 0) {
                status = "InvalidParamValue";
                statusCode = 400;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                toReturn.put("message", "Invalid limit");
                return toReturn;
            }

            // Adatbázis lekérdezés
            List<Companies> modelResult = Companies.getNewCompanies(limit);

            // NULL ELLENŐRZÉS
            if (modelResult == null) {
                status = "NotFound";
                statusCode = 404;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                toReturn.put("message", "No company found");
                return toReturn;
            }

            // Sikeres válasz összeállítása
            JSONArray result = new JSONArray();

            for (Companies actualCompany : modelResult) {
                JSONObject actualCompanyObject = new JSONObject();

                actualCompanyObject.put("id", actualCompany.getId());
                actualCompanyObject.put("name", actualCompany.getName());
                actualCompanyObject.put("rating", actualCompany.getRating());
                actualCompanyObject.put("reviewCount", actualCompany.getReviewCount());
                actualCompanyObject.put("address", actualCompany.getAddress());
                actualCompanyObject.put("imageUrl", FileStorageUtil.buildFullUrl(actualCompany.getImageUrl()));

                result.put(actualCompanyObject);
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

    public JSONObject getFeaturedCompanies(Integer limit) {
        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        try {
            // Input validáció
            if (limit == null || limit <= 0) {
                status = "InvalidParamValue";
                statusCode = 400;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                toReturn.put("message", "Invalid limit");
                return toReturn;
            }

            // Adatbázis lekérdezés
            List<Companies> modelResult = Companies.getFeaturedCompanies(limit);

            // NULL ELLENŐRZÉS
            if (modelResult == null) {
                status = "NotFound";
                statusCode = 404;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                toReturn.put("message", "No company found");
                return toReturn;
            }

            // Sikeres válasz összeállítása
            JSONArray result = new JSONArray();

            for (Companies actualCompany : modelResult) {
                JSONObject actualCompanyObject = new JSONObject();

                actualCompanyObject.put("id", actualCompany.getId());
                actualCompanyObject.put("name", actualCompany.getName());
                actualCompanyObject.put("rating", actualCompany.getRating());
                actualCompanyObject.put("reviewCount", actualCompany.getReviewCount());
                actualCompanyObject.put("address", actualCompany.getAddress());
                actualCompanyObject.put("imageUrl", FileStorageUtil.buildFullUrl(actualCompany.getImageUrl()));

                result.put(actualCompanyObject);
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

    public JSONObject getCompanyShort(Integer id) {

        try {
            // 1. VALIDÁCIÓ
            if (id == null || id <= 0) {
                JSONObject error = new JSONObject();
                error.put("statusCode", 400);
                error.put("message", "Invalid company ID");
                return error;
            }

            Companies company = Companies.getCompanyShort(id);

            if (company == null) {
                JSONObject error = new JSONObject();
                error.put("statusCode", 404);
                error.put("message", "Company not found with ID: " + id);
                return error;
            }

            JSONObject result = new JSONObject();
            result.put("statusCode", 200);
            result.put("id", company.getId());
            result.put("name", company.getName());

            // Teljes cím
            String fullAddress = String.format("%s, %s %s, %s",
                    company.getAddress(),
                    company.getPostalCode(),
                    company.getCity(),
                    company.getCountry()
            );
            result.put("address", fullAddress);

            // AddressDetails nested object
            JSONObject addressDetails = new JSONObject();

            addressDetails.put("street", company.getAddress());
            addressDetails.put("postalCode", company.getPostalCode());
            addressDetails.put("city", company.getCity());
            addressDetails.put("country", company.getCountry());

            result.put("addressDetails", addressDetails);

            result.put("rating", company.getRating());
            result.put("reviewCount", company.getReviewCount());
            result.put("imageUrl", company.getImageUrl());

            return result;

        } catch (Exception e) {
            e.printStackTrace();
            JSONObject error = new JSONObject();
            error.put("statusCode", 500);
            error.put("message", "Internal server error: " + e.getMessage());
            return error;
        }
    }

    public Boolean validateCompanyExist(Integer companyId) {

        try {

            Boolean result = true;

            Companies modelResult = layer.checkCompany(companyId);

            if (modelResult == null) {
                result = false;
            } else if (modelResult.getIsActive() == false) {
                result = false;
            } else if (modelResult.getIsDeleted() == true) {
                result = false;
            }

            return result;

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public JSONObject createFull(String jwtToken, CompanyRegisterRequest request) {
        EntityManager em = null;

        try {
            JSONObject toReturn = new JSONObject();
            String status = "success";
            Integer statusCode = 200;

            // EntityManager létrehozása
            em = emf.createEntityManager();

            // Tranzakció indítása
            em.getTransaction().begin();

            try {
                // 1. User ID lekérése JWT-ből
                Integer userId = JWT.getUserIdFromAccessToken(jwtToken);

                if (userId == null) {
                    em.getTransaction().rollback();
                    return buildErrorResponse(401, "invalidToken");
                }

                // 2. Company objektum összeállítása
                Companies company = new Companies(
                        request.getName(),
                        request.getDescription(),
                        request.getAddress(),
                        request.getCity(),
                        request.getPostalCode(),
                        request.getCountry(),
                        request.getPhone(),
                        request.getEmail(),
                        request.getWebsite(),
                        request.getBusinessCategoryId(),
                        userId,
                        request.getBookingAdvanceDays(),
                        request.getCancellationHours(),
                        (request.getMinimumBookingHoursAhead() != null && request.getMinimumBookingHoursAhead() != 0),
                        request.getMinimumBookingHoursAhead() != null && request.getMinimumBookingHoursAhead() != 0 ? request.getMinimumBookingHoursAhead() : null
                );

                // 3. Company létrehozása az adatbázisban (stored procedure hívás)
                Integer companyId = Companies.createFull(company);

                if (companyId == null) {
                    em.getTransaction().rollback();
                    return buildErrorResponse(500, "companyCreationFailed");
                }

                // 4. User company_id mezőjének frissítése
                Boolean isCompanyAssignSuccess = Users.assignCompanyToUser(userId, companyId);

                if (isCompanyAssignSuccess == null || !isCompanyAssignSuccess) {
                    em.getTransaction().rollback();
                    return buildErrorResponse(500, "userAssignmentFailed");
                }
                
                // 5. Give owner role
                Boolean isRoleAssignSuccess = UserXRole.assignRole(userId, 2);

                if (isRoleAssignSuccess == null || !isRoleAssignSuccess) {
                    em.getTransaction().rollback();
                    return buildErrorResponse(500, "userRoleAssignmentFailed");
                }

                // 6. OpeningHours létrehozása
                Map<String, String> openingHours = request.getOpeningHours();

                if (openingHours != null && !openingHours.isEmpty()) {
                    boolean openingHoursCreated = OpeningHours.createOpeningHoursForCompany(companyId, openingHours);

                    if (!openingHoursCreated) {
                        em.getTransaction().rollback();
                        return buildErrorResponse(500, "openingHoursCreationFailed");
                    }
                }

                // ========== AUDIT LOG ==========
                try {
                    String userEmail = JWT.getEmailFromAccessToken(jwtToken);
                    String userBestRole = JWT.getUserBestRoleFromAccessToken(jwtToken);

                    AuditLogs auditLog = new AuditLogs(
                            userId,
                            userBestRole,
                            companyId,
                            userEmail,
                            "company",
                            "create"
                    );

                    auditLog.addNewValue("name", request.getName());
                    auditLog.addNewValue("description", request.getDescription());
                    auditLog.addNewValue("address", request.getAddress());
                    auditLog.addNewValue("city", request.getCity());
                    auditLog.addNewValue("postalCode", request.getPostalCode());
                    auditLog.addNewValue("country", request.getCountry());
                    auditLog.addNewValue("phone", request.getPhone());
                    auditLog.addNewValue("email", request.getEmail());
                    auditLog.addNewValue("website", request.getWebsite());
                    auditLog.addNewValue("businessCategoryId", request.getBusinessCategoryId());
                    auditLog.addNewValue("ownerId", userId);
                    auditLog.addNewValue("bookingAdvanceDays", request.getBookingAdvanceDays());
                    auditLog.addNewValue("cancellationHours", request.getCancellationHours());
                    auditLog.addNewValue("allowSameDayBooking", (request.getMinimumBookingHoursAhead() != null && request.getMinimumBookingHoursAhead() != 0));
                    auditLog.addNewValue("minimumBookingHoursahead", request.getMinimumBookingHoursAhead() != null && request.getMinimumBookingHoursAhead() != 0 ? request.getMinimumBookingHoursAhead() : null);

                    AuditLogService.logAudit(auditLog);

                } catch (Exception ex) {
                    // Log the error but don't fail the registration
                    ex.printStackTrace();
                }

                // 7. Tranzakció commit
                em.getTransaction().commit();

                // 8. Sikeres válasz visszaküldése
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);

                JSONObject result = new JSONObject();
                result.put("companyId", companyId);

                toReturn.put("result", result);

                return toReturn;

            } catch (Exception e) {
                // Hiba esetén rollback
                if (em.getTransaction().isActive()) {
                    em.getTransaction().rollback();
                }

                e.printStackTrace();
                return buildErrorResponse(500, "transactionFailed");
            }

        } catch (Exception e) {
            e.printStackTrace();
            return buildErrorResponse(500, "internalServerError");

        } finally {
            // EntityManager bezárása
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    private JSONObject buildErrorResponse(int statusCode, String status) {
        JSONObject errorResponse = new JSONObject();
        errorResponse.put("statusCode", statusCode);
        errorResponse.put("status", status);
        return errorResponse;
    }
}
