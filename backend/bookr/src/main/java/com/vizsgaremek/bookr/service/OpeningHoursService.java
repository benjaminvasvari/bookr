/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.DTO.OwnerPanelDTO.updateOpeningHoursDTO;
import com.vizsgaremek.bookr.model.OpeningHours;
import com.vizsgaremek.bookr.util.ErrorResponseBuilder;
import static com.vizsgaremek.bookr.util.ErrorResponseBuilder.buildErrorResponseJSON;
import java.util.Map;
import org.json.JSONObject;

/**
 *
 * @author vben
 */
public class OpeningHoursService {

    private OpeningHours layer = new OpeningHours();

    public JSONObject getOpeningHours(Integer id) {

        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        // 6. OPENING HOURS
        OpeningHours openingHours = layer.getOpeningHoursFormatted(id);

        if (openingHours == null) {
            return buildErrorResponseJSON(500, "InternalServerError");
        }

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

        toReturn.put("result", openingHoursObj);
        toReturn.put("status", status);
        toReturn.put("statusCode", statusCode);

        return toReturn;
    }

    public JSONObject updateOpeningHours(Integer id, updateOpeningHoursDTO request) {

        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        Map<String, String> openingHours = request.getOpeningHours();

        Boolean openingHoursUpdated = null;

        if (openingHours != null && !openingHours.isEmpty()) {
            openingHoursUpdated = layer.updateOpeningHours(id, openingHours);

            if (!openingHoursUpdated) {
                return buildErrorResponseJSON(500, "openingHoursCreationFailed");
            }
        }

        toReturn.put("status", status);
        toReturn.put("statusCode", statusCode);

        return toReturn;
    }
}
