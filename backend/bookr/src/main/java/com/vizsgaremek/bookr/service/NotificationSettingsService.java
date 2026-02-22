/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.model.NotificationSettings;
import org.json.JSONObject;

/**
 *
 * @author vben
 */
public class NotificationSettingsService {

    private NotificationSettings layer = new NotificationSettings();

    public JSONObject getAllNotificationSettings(Integer userId) {
        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        try {
            // Input validáció
            if (userId == null || userId <= 0) {
                status = "InvalidParamValue";
                statusCode = 400;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                toReturn.put("message", "Invalid user ID");
                return toReturn;
            }

            // Adatbázis lekérdezés
            NotificationSettings modelResult = layer.getAllNotificationSettings(userId);

            // NULL ELLENŐRZÉS
            if (modelResult == null) {
                status = "NotFound";
                statusCode = 404;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                toReturn.put("message", "User settings not found with ID: " + userId);
                return toReturn;
            }

            JSONObject result = new JSONObject();

            result.put("id", modelResult.getId());
            result.put("confirm", modelResult.getAppointmentConfirmation());
            result.put("reminder", modelResult.getAppointmentReminder());
            result.put("cancel", modelResult.getAppointmentCancellation());
            result.put("marketing", modelResult.getMarketingEmails());

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

    public JSONObject updateNotificationSettings(NotificationSettings updatedSetting) {
        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        try {

            // Adatbázis lekérdezés
            Boolean modelResult = layer.updateNotificationSetting(updatedSetting);

            // NULL ELLENŐRZÉS
            if (modelResult == null) {
                status = "NotFound";
                statusCode = 404;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                toReturn.put("message", "User settings not found with ID: " + updatedSetting.getId());
                return toReturn;
            }

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
