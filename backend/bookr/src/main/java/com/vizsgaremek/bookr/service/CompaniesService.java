/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.model.Companies;
import com.vizsgaremek.bookr.model.Images;
import com.vizsgaremek.bookr.model.OpeningHours;
import com.vizsgaremek.bookr.model.Reviews;
import java.text.SimpleDateFormat;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 *
 * @author vben
 */
public class CompaniesService {

    private static final String IMAGE_BASE_URL = "http://localhost:8080/bookr-1.0-SNAPSHOT/";

    private Companies layer = new Companies();
    private ServiceCategoryService serviceCategoryService = new ServiceCategoryService();

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
                galleryImages.put(IMAGE_BASE_URL + img.getUrl());
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
            result.put("imageUrl", IMAGE_BASE_URL + company.getImageUrl());
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
                actualCompanyObject.put("imageUrl", IMAGE_BASE_URL + actualCompany.getImageUrl());

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
                actualCompanyObject.put("imageUrl", IMAGE_BASE_URL + actualCompany.getImageUrl());

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
                actualCompanyObject.put("imageUrl", IMAGE_BASE_URL + actualCompany.getImageUrl());

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
            result.put("imageUrl", IMAGE_BASE_URL + company.getImageUrl());

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
}
