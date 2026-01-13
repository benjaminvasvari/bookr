package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.model.Appointments;
import com.vizsgaremek.bookr.model.Companies;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;

public class AppointmentsService {

    public JSONObject getUnavailableDates(Integer companyId, Integer staffId) {

        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        // Cég booking advance days lekérése
        Integer companyBookingAdvanceDays = Companies.getCompanyBookingAdvanceDays(companyId).getBookingAdvanceDays();

        if (companyBookingAdvanceDays == null) {
            status = "InternalServerError";
            statusCode = 500;
            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
            toReturn.put("message", "Failed to retrieve company booking settings");
            return toReturn;
        }

        // Dátumtartomány kiszámítása
        LocalDate currentDate = LocalDate.now();
        LocalDate dateTo = currentDate.plusDays(companyBookingAdvanceDays);

        // Model hívás
        ArrayList<Appointments> modelResult = Appointments.getUnavailableDatesInRange(companyId, staffId, currentDate, dateTo);

        if (modelResult == null) {
            statusCode = 500;
            status = "ModelException";
            toReturn.put("message", "Internal server error");

        } else {
            // JSON data objektum építése
            JSONObject data = new JSONObject();
            data.put("periodStart", currentDate.toString());
            data.put("periodEnd", dateTo.toString());
            data.put("advanceDays", companyBookingAdvanceDays);

            if (modelResult.isEmpty()) {
                // Üres lista = minden nap elérhető
                data.put("unavailableDates", new JSONArray());
                toReturn.put("data", data);
                toReturn.put("message", "All dates are available");

            } else {
                // Van tiltott nap
                JSONArray unavailableDatesArray = new JSONArray();
                SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");

                for (Appointments unavailableDate : modelResult) {
                    JSONObject dateObject = new JSONObject();

                    // Date objektumot formázzuk yyyy-MM-dd formátumúra
                    dateObject.put("date", dateFormat.format(unavailableDate.getDate()));
                    dateObject.put("dayOfWeek", unavailableDate.getDayOfWeek());
                    dateObject.put("reason", unavailableDate.getReason());

                    unavailableDatesArray.put(dateObject);
                }

                data.put("unavailableDates", unavailableDatesArray);
                toReturn.put("data", data);
                toReturn.put("message", "Unavailable dates retrieved successfully");
            }
        }

        toReturn.put("status", status);
        toReturn.put("statusCode", statusCode);

        return toReturn;
    }

    public JSONObject getOccupiedSlotsDataForBooking(Integer companyId, Integer staffId, Date date) {

        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;
        
        SimpleDateFormat timeFormatter = new SimpleDateFormat("HH:mm");

        // Model hívás
        Appointments workingHModelResult = Appointments.getWorkingHoursForDate(companyId, staffId, date);

        if (workingHModelResult == null) {
            statusCode = 500;
            status = "ModelException";
            toReturn.put("message", "Internal server error");

        } else {
            // JSON data objektum építése
            JSONObject data = new JSONObject();
            data.put("date", date);
            data.put("staffId", staffId);

            JSONArray workingHoursArray = new JSONArray();
            JSONObject workingHoursObj = new JSONObject();
            
            workingHoursObj.put("startTime", timeFormatter.format(workingHModelResult.getStartTime()));
            workingHoursObj.put("endTime", timeFormatter.format(workingHModelResult.getEndTime()));
            workingHoursObj.put("isAvailable", workingHModelResult.getIsAvailable());
            workingHoursObj.put("reason", workingHModelResult.getReason());
            
            workingHoursArray.put(workingHoursObj);
            data.put("workingHours", workingHoursArray);

            
            ArrayList<Appointments> OccupiedModelResult = Appointments.getOccupiedSlotsForDate(staffId, date);

            if (OccupiedModelResult == null) {
                statusCode = 500;
                status = "ModelException";
                toReturn.put("message", "Internal server error");

            } else {

                if (OccupiedModelResult.isEmpty()) {
                    // Üres lista = minden slot elérhető
                    data.put("occupiedSlots", new JSONArray());
                    toReturn.put("data", data);
                    toReturn.put("message", "All slots are available");

                } else {
                    // Van tiltott nap
                    JSONArray occupiedSlotsArray = new JSONArray();

                    for (Appointments occupiedSlot : OccupiedModelResult) {
                        JSONObject slotObject = new JSONObject();

                        slotObject.put("appointmentId", occupiedSlot.getId());
                        slotObject.put("startTime", timeFormatter.format(occupiedSlot.getStartTime()));
                        slotObject.put("endTime", timeFormatter.format(occupiedSlot.getEndTime()));
                        slotObject.put("serviceId", occupiedSlot.getServiceIdInt());
                        slotObject.put("durationMinutes", occupiedSlot.getDurationMinutes());

                        occupiedSlotsArray.put(slotObject);
                    }
                    data.put("occupiedSlots", occupiedSlotsArray);
                }

                toReturn.put("data", data);
                toReturn.put("message", "Occupied slots retrieved successfully");
            }
        }

        toReturn.put("status", status);
        toReturn.put("statusCode", statusCode);

        return toReturn;
    }
}
