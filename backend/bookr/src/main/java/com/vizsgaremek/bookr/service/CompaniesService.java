/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.model.Companies;
import org.json.JSONObject;

/**
 *
 * @author vben
 */
public class CompaniesService {

    private Companies layer = new Companies();

    public JSONObject getCompanyById(Integer id) {
        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        try {
            // Input validáció
            if (id == null || id <= 0) {
                status = "InvalidParamValue";
                statusCode = 400;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                toReturn.put("message", "Invalid company ID");
                return toReturn;
            }

            // Adatbázis lekérdezés
            Companies modelResult = Companies.getCompanyById(id);

            // NULL ELLENŐRZÉS
            if (modelResult == null) {
                status = "NotFound";
                statusCode = 404;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                toReturn.put("message", "Company not found with ID: " + id);
                return toReturn;
            }

            // Sikeres válasz összeállítása
            JSONObject result = new JSONObject();
            result.put("id", modelResult.getId());
            result.put("name", modelResult.getName());
            result.put("description", modelResult.getDescription());
            result.put("address", modelResult.getAddress());
            result.put("city", modelResult.getCity());
            result.put("postalCode", modelResult.getPostalCode());
            result.put("country", modelResult.getCountry());
            result.put("phone", modelResult.getPhone());
            result.put("email", modelResult.getEmail());
            result.put("website", modelResult.getWebsite());
            result.put("bookingAdvanceDays", modelResult.getBookingAdvanceDays());
            result.put("cancellationHours", modelResult.getCancellationHours());
            result.put("createdAt", modelResult.getCreatedAt());
            result.put("updatedAt", modelResult.getUpdatedAt());
            result.put("isActive", modelResult.getIsActive());

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
