package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.model.Appointments;
import com.vizsgaremek.bookr.model.AuditLogs;
import com.vizsgaremek.bookr.model.Companies;
import com.vizsgaremek.bookr.model.Services;
import com.vizsgaremek.bookr.model.Staff;
import com.vizsgaremek.bookr.model.Users;
import com.vizsgaremek.bookr.security.JWT;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import org.json.JSONArray;
import org.json.JSONObject;

public class AppointmentsService {

    private AuditLogService auditLogService = new AuditLogService();
    private EmailService EmailService = new EmailService();
    private UsersService UsersService = new UsersService();
    private Companies Companies = new Companies();
    private Staff Staff = new Staff();
    private Services Services = new Services();

    static SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

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

    public JSONObject createAppointment(String jwtToken, Integer companyId, Integer serviceId, Integer staffId, Integer clientId, String startTimeString, String endTimeString, String notes, BigDecimal price) {

        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        Timestamp startTime = Timestamp.valueOf(startTimeString);
        Timestamp endTime = Timestamp.valueOf(endTimeString);

        //code
        Integer appointmentId = Appointments.createAppointment(companyId, serviceId, staffId, clientId, startTime, endTime, notes, price);

        if (appointmentId == null) {
            status = "serverError";
            statusCode = 500;
        } else {
            // ========== AUDIT LOG ==========

            Integer userId = JWT.getUserIdFromAccessToken(jwtToken);
            String userRoles = JWT.getRolesFromAccessToken(jwtToken);
            String userEmail = JWT.getEmailFromAccessToken(jwtToken);

            try {
                AuditLogs auditLog = new AuditLogs(
                        userId,
                        userRoles.split(",")[0].trim(),
                        userEmail,
                        "user",
                        "bookAppointment"
                );
                auditLog.addNewValue("companyId", companyId);
                auditLog.addNewValue("serviceId", serviceId);
                auditLog.addNewValue("staffId", staffId);
                auditLog.addNewValue("clientId", clientId);
                auditLog.addNewValue("startTime", startTime);
                auditLog.addNewValue("endTime", endTime);
                auditLog.addNewValue("notes", notes);
                auditLog.addNewValue("price", price);

                auditLogService.logAudit(auditLog);

            } catch (Exception ex) {
                // Log the error but don't fail the registration
                ex.printStackTrace();
            }

            // ========== EMAIL KÜLDÉS ==========
            try {

                Appointments appointmentDataFromDB = Appointments.getInfoForBookingEmail(appointmentId);
                Users userFromDB = Users.getUserProfile(userId);
                String userName = userFromDB.getFirstName() + userFromDB.getLastName();

                EmailService.sendAppointmentConfirmationEmail(userEmail, userName, appointmentDataFromDB.getCompanyName(), appointmentDataFromDB.getServiceName(), appointmentDataFromDB.getStaffName(), startTimeString, endTimeString, appointmentDataFromDB.getDurationMinutes(), price, appointmentDataFromDB.getCompanyAddress(), appointmentDataFromDB.getCompanyPhone(), notes);

            } catch (Exception ex) {
                // Log the error but don't fail the registration
                System.err.println("Failed to send verification email: " + ex.getMessage());
            }
            // ===============================

        }

        toReturn.put("status", status);
        toReturn.put("statusCode", statusCode);
        return toReturn;
    }

    public JSONObject getAppointmentsByClient(Integer userId, Integer page, Integer amount, boolean isUpcoming) {
        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;
        SimpleDateFormat timeFormatter = new SimpleDateFormat("HH:mm");

        // User validáció
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

        // Model hívás - nyers adatok
        JSONObject appointmentsModelResult = Appointments.getAppointmentsByClient(userId, page, amount, isUpcoming);

        if (appointmentsModelResult == null) {
            statusCode = 500;
            status = "ModelException";
            toReturn.put("message", "Internal server error");
        } else {
            int totalCount = appointmentsModelResult.getInt("appointmentsCount");
            JSONArray rawAppointments = appointmentsModelResult.getJSONArray("result");

            // Csoportosítás: startTime + staffId + companyId alapján
            LinkedHashMap<String, JSONObject> groupedMap = new LinkedHashMap<>();

            for (int i = 0; i < rawAppointments.length(); i++) {
                JSONObject rawAppt = rawAppointments.getJSONObject(i);

                String startTime = rawAppt.getString("startTime");
                Integer staffId = rawAppt.getInt("staffId");
                Integer companyId = rawAppt.getInt("companyId");

                // Csoportosítási kulcs: startTime + staffId + companyId
                String groupKey = startTime + "_" + staffId + "_" + companyId;

                JSONObject group = groupedMap.get(groupKey);

                if (group == null) {
                    // Új csoport létrehozása
                    group = new JSONObject();

                    // Company, Staff adatok lekérése (csak egyszer per csoport)
                    Companies company = Companies.getCompanyShort(companyId);
                    Staff staff = Staff.getStaffShort(staffId);

                    group.put("startTime", startTime);
                    group.put("endTime", rawAppt.getString("endTime"));
                    group.put("status", rawAppt.getString("status"));
                    group.put("companyId", companyId);
                    group.put("companyName", company.getName());
                    group.put("companyLogo", company.getImageUrl());
                    group.put("staffId", staffId);
                    group.put("staffName", staff.getLastName() + " " + staff.getFirstName());
                    group.put("services", new JSONArray());
                    group.put("totalPrice", BigDecimal.ZERO);

                    groupedMap.put(groupKey, group);
                }

                // Service adatok lekérése
                Integer serviceId = rawAppt.getInt("serviceId");
                Services service = Services.getServiceShort(serviceId);

                // Szolgáltatás hozzáadása a csoporthoz
                JSONObject serviceObj = new JSONObject();
                serviceObj.put("serviceId", serviceId);
                serviceObj.put("serviceName", service.getName());
                serviceObj.put("price", service.getPrice());
                serviceObj.put("duration", service.getDurationMinutes());

                group.getJSONArray("services").put(serviceObj);

                // Ár hozzáadása
                BigDecimal currentTotal = group.getBigDecimal("totalPrice");
                group.put("totalPrice", currentTotal.add(service.getPrice()));

                // End time frissítése (mindig a legkésőbbi)
                String currentEndTime = group.getString("endTime");
                String newEndTime = rawAppt.getString("endTime");
                if (newEndTime.compareTo(currentEndTime) > 0) {
                    group.put("endTime", newEndTime);
                }
            }

            // Csoportosított adatok átalakítása tömbbe + szolgáltatásnevek összefűzése
            JSONArray finalData = new JSONArray();
            for (JSONObject group : groupedMap.values()) {
                JSONArray services = group.getJSONArray("services");

                // Szolgáltatásnevek összefűzése " + " jellel
                StringBuilder serviceNames = new StringBuilder();
                for (int i = 0; i < services.length(); i++) {
                    if (i > 0) {
                        serviceNames.append(" + ");
                    }
                    serviceNames.append(services.getJSONObject(i).getString("serviceName"));
                }
                group.put("serviceNames", serviceNames.toString());

                finalData.put(group);
            }

            // Válasz összeállítása
            JSONObject responseData = new JSONObject();
            responseData.put("appointments", finalData);
            responseData.put("totalCount", totalCount);
            responseData.put("currentPage", page);
            
            // Oldalak számának kiszámítása: Math.ceil felfelé kerekít, így a maradék elemek is kapnak egy külön oldalt (pl. 25 elem / 10 = 2.5 → 3 oldal)
            responseData.put("totalPages", (int) Math.ceil((double) totalCount / amount));

            toReturn.put("data", responseData);
        }

        toReturn.put("status", status);
        toReturn.put("statusCode", statusCode);
        return toReturn;
    }
}
