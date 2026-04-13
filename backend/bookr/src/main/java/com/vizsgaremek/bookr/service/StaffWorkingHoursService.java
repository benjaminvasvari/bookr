package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.model.Staff;
import com.vizsgaremek.bookr.model.StaffWorkingHours;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.LinkedHashMap;

import static com.vizsgaremek.bookr.service.AppointmentsService.timeFormatter;


public class StaffWorkingHoursService {

    private StaffWorkingHours layer = new StaffWorkingHours();

    public JSONObject getStaffWorkingHoursByStaffId(Integer userId) {

        JSONObject toReturn = new JSONObject();
        JSONObject data = new JSONObject();

        Integer staffId = Staff.getStaffIdByUserId(userId);

        ArrayList<StaffWorkingHours> modelResult = layer.getStaffWorkingHoursByStaffId(staffId);

        for (StaffWorkingHours s : modelResult) {
            JSONObject dayObj = new JSONObject();
            dayObj.put("startTime", s.getStartTime() != null ? timeFormatter.format(s.getStartTime()) : JSONObject.NULL);
            dayObj.put("endTime", s.getEndTime() != null ? timeFormatter.format(s.getEndTime()) : JSONObject.NULL);
            dayObj.put("isAvailable", s.getIsAvailable());
            data.put(s.getDayOfWeek(), dayObj);
        }

        toReturn.put("status", "success");
        toReturn.put("statusCode", 200);
        toReturn.put("data", data);

        return toReturn;
    }

    public JSONObject updateStaffWorkingHours(Integer userId, String dayOfWeek, String startTime, String endTime, Boolean isAvailable) {

        JSONObject toReturn = new JSONObject();

        try {
            Integer staffId = Staff.getStaffIdByUserId(userId);

            layer.updateStaffWorkingHours(staffId, dayOfWeek, startTime, endTime, isAvailable);

            toReturn.put("status", "success");
            toReturn.put("statusCode", 200);

        } catch (Exception ex) {
            ex.printStackTrace();
            toReturn.put("status", "error");
            toReturn.put("statusCode", 500);
            toReturn.put("message", ex.getMessage());
        }

        return toReturn;
    }


}
