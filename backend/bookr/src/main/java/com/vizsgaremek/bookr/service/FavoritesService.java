/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.model.Companies;
import com.vizsgaremek.bookr.model.Favorites;
import com.vizsgaremek.bookr.security.JWT;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 *
 * @author vben
 */
public class FavoritesService {

    private Favorites layer = new Favorites();
    private UsersService UsersService = new UsersService();
    private CompaniesService CompaniesService = new CompaniesService();

    public JSONObject getUserFavorites(String jwtToken) {
        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        try {

            Integer userId = JWT.getUserIdFromAccessToken(jwtToken);

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

            // Adatbázis lekérdezés
            List<Favorites> modelResult = layer.getUserFavorites(userId);

            // NULL ELLENŐRZÉS
            if (modelResult == null) {
                status = "NotFound";
                statusCode = 404;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                toReturn.put("message", "Favorites not found with user: " + userId);
                return toReturn;
            }

            // Sikeres válasz összeállítása
            JSONArray result = new JSONArray();
            for (Favorites actualFav : modelResult) {
                JSONObject actualFavObject = new JSONObject();
                Integer companyId = actualFav.getCompanyIdInt();
                Boolean CompanyExist = CompaniesService.validateCompanyExist(companyId);
                if (CompanyExist) {
                    JSONObject actualCompanyObject = new JSONObject();
                    Companies companyModelResult = Companies.getCompanyShort(companyId);
                    actualFavObject.put("favoriteId", actualFav.getId());
                    actualFavObject.put("addedAt", actualFav.getCreatedAt());
                    actualCompanyObject.put("companyId", companyId);
                    actualCompanyObject.put("name", companyModelResult.getName());
                    actualCompanyObject.put("category", companyModelResult.getCategoryName());
                    // Teljes cím
                    String fullAddress = String.format("%s %s, %s",
                            companyModelResult.getPostalCode(),
                            companyModelResult.getCity(),
                            companyModelResult.getAddress()
                    );
                    actualCompanyObject.put("address", fullAddress);
                    actualCompanyObject.put("rating", companyModelResult.getRating());
                    actualCompanyObject.put("reviewCount", companyModelResult.getReviewCount());
                    actualCompanyObject.put("imageUrl", companyModelResult.getImageUrl());
                    actualFavObject.put("company", actualCompanyObject);
                    result.put(actualFavObject);
                }
            }

            // Count hozzáadása a válaszhoz
            toReturn.put("result", result);
            toReturn.put("count", result.length());

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
