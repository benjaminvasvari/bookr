package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.model.Images;
import java.util.ArrayList;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Service for image operations
 *
 * @author vben
 */
public class ImagesService {

    private Images layer = new Images();

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
            ArrayList<Images> modelResult = Images.getCompanyImages(companyId);

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
            Images modelResult = Images.getUserProfilePicture(userId);

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
}
