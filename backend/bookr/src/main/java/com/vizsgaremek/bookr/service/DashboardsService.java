/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.security.JWT;
import org.json.JSONObject;

/**
 *
 * @author vben
 */
public class DashboardsService {

    private AppointmentsService AppointmentsService = new AppointmentsService();
    private UsersService UsersService = new UsersService();
    private ReviewsService ReviewsService = new ReviewsService();

    public JSONObject getOwnerDashboard(String jwtToken) {

        try {
            JSONObject toReturn = new JSONObject();
            String status = "success";
            Integer statusCode = 200;
            
            int ownerId = JWT.getUserIdFromAccessToken(jwtToken);

            int companyId = getCompanyIdByOwnerId(ownerId);

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
}
