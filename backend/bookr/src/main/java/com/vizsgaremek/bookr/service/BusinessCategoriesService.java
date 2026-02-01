/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.model.BusinessCategories;
import com.vizsgaremek.bookr.security.JWT;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 *
 * @author vben
 */
public class BusinessCategoriesService {

    private BusinessCategories layer = new BusinessCategories();
    private UsersService UsersService = new UsersService();

    public JSONObject getAllBusinessCategories() {
        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        try {

            // Adatbázis lekérdezés
            List<BusinessCategories> modelResult = layer.getAllBusinessCategories();

            // NULL ELLENŐRZÉS
            if (modelResult == null) {
                status = "NotFound";
                statusCode = 404;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                return toReturn;
            }

            // Sikeres válasz összeállítása
            JSONArray result = new JSONArray();
            for (BusinessCategories actualCat : modelResult) {
                JSONObject actualCatObject = new JSONObject();

                actualCatObject.put("categoryId", actualCat.getId());
                actualCatObject.put("name", actualCat.getName());
                actualCatObject.put("description", actualCat.getDescription());
                actualCatObject.put("createdAt", actualCat.getCreatedAt());
                actualCatObject.put("updatedAt", actualCat.getUpdatedAt());

                result.put(actualCatObject);
            }

            // Count hozzáadása a válaszhoz
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

    public JSONObject createBusinessCategory(String jwtToken, BusinessCategories catCreated) {

        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        Integer userId = JWT.getUserIdFromAccessToken(jwtToken);

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
            status = "UserNotFound";
            statusCode = 404;
            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
            return toReturn;
        }

        BusinessCategories modelResult = layer.createBusinessCategory(catCreated);

        if (modelResult == null) {
            status = "InternalServerError";
            statusCode = 500;
        }

        toReturn.put("status", status);
        toReturn.put("statusCode", statusCode);
        return toReturn;
    }

    public JSONObject updateBusinessCategory(String jwtToken, BusinessCategories updatedCat) {

        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        Integer userId = JWT.getUserIdFromAccessToken(jwtToken);

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
            status = "UserNotFound";
            statusCode = 404;
            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
            return toReturn;
        }

        Boolean modelResult = layer.updateBusinessCategory(updatedCat);

        if (modelResult == false) {
            status = "InternalServerError";
            statusCode = 500;
        }

        toReturn.put("status", status);
        toReturn.put("statusCode", statusCode);
        return toReturn;
    }

    public JSONObject activateBusinessCategory(String jwtToken, Integer id) {

        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        Integer userId = JWT.getUserIdFromAccessToken(jwtToken);

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
            status = "UserNotFound";
            statusCode = 404;
            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
            return toReturn;
        }

        Boolean modelResult = layer.activateBusinessCategory(id);

        if (modelResult == false) {
            status = "InternalServerError";
            statusCode = 500;
        }

        toReturn.put("status", status);
        toReturn.put("statusCode", statusCode);
        return toReturn;
    }

    public JSONObject deactivateBusinessCategory(String jwtToken, Integer id) {

        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        Integer userId = JWT.getUserIdFromAccessToken(jwtToken);

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
            status = "UserNotFound";
            statusCode = 404;
            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
            return toReturn;
        }

        Boolean modelResult = layer.deactivateBusinessCategory(id);

        if (modelResult == false) {
            status = "InternalServerError";
            statusCode = 500;
        }

        toReturn.put("status", status);
        toReturn.put("statusCode", statusCode);
        return toReturn;
    }
}
