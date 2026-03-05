/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.DTO.OwnerPanelDTO.createTemporaryClosedPeriodDTO;
import com.vizsgaremek.bookr.model.Companies;
import com.vizsgaremek.bookr.model.TemporaryClosedPeriods;
import com.vizsgaremek.bookr.util.FileStorageUtil;
import java.text.SimpleDateFormat;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 *
 * @author vben
 */
public class TemporaryClosedPeriodsService {

    TemporaryClosedPeriods layer = new TemporaryClosedPeriods();

    public JSONObject getTemporaryClosedPeriods(Integer companyId) {
        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        try {
            // Adatbázis lekérdezés
            List<TemporaryClosedPeriods> modelResult = layer.getTemporaryClosedPeriods(companyId);

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

            if (!modelResult.isEmpty()) {
                for (TemporaryClosedPeriods actualPeriod : modelResult) {
                    JSONObject actualClosedObject = new JSONObject();
                    actualClosedObject.put("id", actualPeriod.getId());
                    actualClosedObject.put("startDate", actualPeriod.getStartDateStr());
                    actualClosedObject.put("endDate", actualPeriod.getEndDateStr());
                    actualClosedObject.put("openTime", actualPeriod.getOpenTimeStr() != null ? actualPeriod.getOpenTimeStr() : JSONObject.NULL);
                    actualClosedObject.put("closeTime", actualPeriod.getCloseTimeStr() != null ? actualPeriod.getCloseTimeStr() : JSONObject.NULL);
                    actualClosedObject.put("reason", actualPeriod.getReason());
                    result.put(actualClosedObject);
                }
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

    public JSONObject createTemporaryClosedPeriod(Integer companyId, createTemporaryClosedPeriodDTO request) {
        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        try {
            // Adatbázis lekérdezés
            createTemporaryClosedPeriodDTO modelResult = layer.createTemporaryClosedPeriod(companyId, request);

            // NULL ELLENŐRZÉS
            if (modelResult == null) {
                status = "NotFound";
                statusCode = 404;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                return toReturn;
            }

            JSONObject result = new JSONObject();
            result.put("id", modelResult.getId());
            result.put("startDate", modelResult.getStartDate());
            result.put("endDate", modelResult.getEndDate());
            result.put("openTime", modelResult.getOpenTime() != null ? modelResult.getOpenTime() : JSONObject.NULL);
            result.put("closeTime", modelResult.getCloseTime() != null ? modelResult.getCloseTime() : JSONObject.NULL);
            result.put("reason", modelResult.getReason() != null ? modelResult.getReason() : JSONObject.NULL);

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

    public JSONObject updateTemporaryClosedPeriod(Integer periodId, Integer companyId, createTemporaryClosedPeriodDTO request) {
        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        try {
            // Adatbázis lekérdezés
            createTemporaryClosedPeriodDTO modelResult = layer.updateTemporaryClosedPeriod(periodId, companyId, request);

            // NULL ELLENŐRZÉS
            if (modelResult == null) {
                status = "NotFound";
                statusCode = 404;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                return toReturn;
            }

            JSONObject result = new JSONObject();
            result.put("id", modelResult.getId());
            result.put("startDate", modelResult.getStartDate());
            result.put("endDate", modelResult.getEndDate());
            result.put("openTime", modelResult.getOpenTime() != null ? modelResult.getOpenTime() : JSONObject.NULL);
            result.put("closeTime", modelResult.getCloseTime() != null ? modelResult.getCloseTime() : JSONObject.NULL);
            result.put("reason", modelResult.getReason() != null ? modelResult.getReason() : JSONObject.NULL);

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

    public JSONObject deleteTemporaryClosedPeriod(Integer periodId) {
        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        try {
            // Adatbázis lekérdezés
            Boolean modelResult = layer.deleteTemporaryClosedPeriod(periodId);

            // NULL ELLENŐRZÉS
            if (modelResult == null || !modelResult) {
                status = "NotFound";
                statusCode = 404;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
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
