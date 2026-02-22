/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.model.Reviews;
import com.vizsgaremek.bookr.DTO.OwnerPanelDTO;
import com.vizsgaremek.bookr.util.FileStorageUtil;
import java.util.ArrayList;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 *
 * @author vben
 */
public class ReviewsService {

    private Reviews layer = new Reviews();
    private CompaniesService CompaniesService = new CompaniesService();

    public JSONObject getOwnerReviews(Integer companyId, OwnerPanelDTO.OwnerReviewsRequest request) {

        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        try {

            Boolean companyExist = CompaniesService.validateCompanyExist(companyId);

            if (!companyExist) {
                JSONObject error = new JSONObject();
                error.put("statusCode", 404);
                error.put("status", "NotFound");
                error.put("message", "Company not found with ID: " + companyId);
                return error;
            }

            // Adatbázis lekérdezés
            OwnerPanelDTO.ReviewsForOwnerResultWrapper modelResult = layer.getOwnerReviews(companyId, request);

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
            JSONArray reviewsJSONArray = new JSONArray();
            JSONObject resultObj = new JSONObject();

            for (OwnerPanelDTO.OwnerReviewsDTO actualData : modelResult.getReviews()) {
                JSONObject actualObj = new JSONObject();

                actualObj.put("reviewId", actualData.getReviewId());
                actualObj.put("rating", actualData.getRating());
                actualObj.put("comment", actualData.getComment());
                actualObj.put("createdAt", actualData.getCreatedAt());
                actualObj.put("clientName", actualData.getClientName());
                actualObj.put("imageUrl", actualData.getImageUrl() != null ? FileStorageUtil.buildFullUrl(actualData.getImageUrl()) : JSONObject.NULL);
                actualObj.put("serviceName", actualData.getServiceName());
                actualObj.put("appointmentDate", actualData.getAppointmentDate());

                reviewsJSONArray.put(actualObj);
            }
            resultObj.put("clients", reviewsJSONArray);
            resultObj.put("totalCount", modelResult.getTotalCount());

            toReturn.put("result", resultObj);

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
