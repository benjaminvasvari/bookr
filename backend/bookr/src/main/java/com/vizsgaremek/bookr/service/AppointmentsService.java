package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.DTO.OwnerPanelDTO;
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
import java.util.List;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONObject;

public class AppointmentsService {

    private AuditLogService auditLogService = new AuditLogService();
    private EmailService EmailService = new EmailService();
    private UsersService UsersService = new UsersService();
    private Companies Companies = new Companies();
    private Staff Staff = new Staff();
    private Services Services = new Services();
    private CompaniesService CompaniesService = new CompaniesService();
    private Appointments layer = new Appointments();

    static SimpleDateFormat timeFormatter = new SimpleDateFormat("HH:mm");

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
        ArrayList<Appointments> modelResult = layer.getUnavailableDatesInRange(companyId, staffId, currentDate, dateTo);

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
        Appointments workingHModelResult = layer.getWorkingHoursForDate(companyId, staffId, date);

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

            ArrayList<Appointments> OccupiedModelResult = layer.getOccupiedSlotsForDate(staffId, date);

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
        Integer appointmentId = layer.createAppointment(companyId, serviceId, staffId, clientId, startTime, endTime, notes, price);

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

                Appointments appointmentDataFromDB = layer.getInfoForBookingEmail(appointmentId);
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
        Boolean isUserExist = UsersService.validateUserExistById(userId);
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
        JSONObject appointmentsModelResult = layer.getAppointmentsByClient(userId, page, amount, isUpcoming);

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
                    group.put("staffName", staff.getDisplayName());
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

    private String formatDuration(int minutes) {
        if (minutes < 60) {
            return minutes + " perc";
        } else if (minutes == 60) {
            return "1 óra";
        } else if (minutes % 60 == 0) {
            return (minutes / 60) + " óra";
        } else {
            int hours = minutes / 60;
            int remainingMinutes = minutes % 60;
            return remainingMinutes + " perc - " + hours + " óra";
        }
    }

    public JSONObject getAllFutureAppointmentsByCompany(Integer companyId) {
        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        try {
            List<OwnerPanelDTO.AllFutureAppointmentsByCompanyDTO> modelResult = layer.getAllFutureAppointmentsByCompany(companyId);

            if (modelResult == null || modelResult.isEmpty()) {
                toReturn.put("status", "success");
                toReturn.put("statusCode", 200);
                toReturn.put("result", new JSONArray()); // üres array
                return toReturn;
            }

            Map<LocalDate, JSONObject> appointmentsMap = new LinkedHashMap<>();

            for (OwnerPanelDTO.AllFutureAppointmentsByCompanyDTO app : modelResult) {
                LocalDate appointmentDate = app.getAppointmentDate();

                // date array create
                if (!appointmentsMap.containsKey(appointmentDate)) {
                    JSONObject date = new JSONObject();
                    date.put("date", appointmentDate.toString()); // toString() kell JSONhoz!
                    date.put("appointments", new JSONArray());
                    appointmentsMap.put(appointmentDate, date);
                }

                // appointments section
                JSONObject date = appointmentsMap.get(appointmentDate);
                JSONObject appointmentObj = new JSONObject();

                appointmentObj.put("id", app.getAppoinmentId());
                appointmentObj.put("startTime", timeFormatter.format(app.getStartTime()));
                appointmentObj.put("endTime", timeFormatter.format(app.getEndTime()));
                appointmentObj.put("serviceName", app.getServiceName());
                appointmentObj.put("staffName", app.getStaffName());
                appointmentObj.put("staffImage", app.getStaffImage());
                appointmentObj.put("clientName", app.getClientName());
                appointmentObj.put("clientImage", app.getClientImage());
                appointmentObj.put("durationFormatted", formatDuration(app.getDurationMinutes()));
                appointmentObj.put("status", app.getStatus());
                appointmentObj.put("price", app.getPrice());
                appointmentObj.put("currency", app.getCurrency());
                appointmentObj.put("createdAt", app.getCreateAt() != null ? app.getCreateAt().toString() : null);

                date.getJSONArray("appointments").put(appointmentObj);
            }

            JSONArray result = new JSONArray();
            for (JSONObject date : appointmentsMap.values()) {
                date.put("count", date.getJSONArray("appointments").length());
                result.put(date);
            }

            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
            toReturn.put("result", result);

            return toReturn;

        } catch (Exception e) {
            e.printStackTrace();

            toReturn.put("status", "InternalServerError");
            toReturn.put("statusCode", 500);
            toReturn.put("error", e.getMessage());
            toReturn.put("result", new JSONArray()); // üres array

            return toReturn;
        }
    }

    public JSONObject getSalesOverviewRevenueByCompany(Integer companyId, String period) {

        try {
            JSONObject toReturn = new JSONObject();

            Boolean companyExist = CompaniesService.validateCompanyExist(companyId);

            if (!companyExist) {
                JSONObject error = new JSONObject();
                error.put("statusCode", 404);
                error.put("message", "Company not found with ID: " + companyId);
                return error;
            }

            OwnerPanelDTO.SalesOverviewRevenueDTO modelResult = layer.getSalesOverviewRevenueByCompany(companyId, period);

            if (modelResult == null) {
                toReturn.put("status", "InternalServerError");
                toReturn.put("statusCode", 500);
                return toReturn;
            }

            JSONObject result = new JSONObject();
            result.put("currentRevenue", modelResult.getCurrentRevenue());
            result.put("previousRevenue", modelResult.getPreviousRevenue());
            result.put("currency", modelResult.getCurrency());

            toReturn.put("result", result);

            toReturn.put("status", "success");
            toReturn.put("statusCode", 200);

            return toReturn;

        } catch (Exception e) {
            e.printStackTrace();
            JSONObject error = new JSONObject();
            error.put("statusCode", 500);
            error.put("message", "Internal server error: " + e.getMessage());
            return error;
        }
    }

    public JSONObject getSalesOverviewAvgBasket(Integer companyId, String period) {

        try {
            JSONObject toReturn = new JSONObject();

            Boolean companyExist = CompaniesService.validateCompanyExist(companyId);

            if (!companyExist) {
                JSONObject error = new JSONObject();
                error.put("statusCode", 404);
                error.put("message", "Company not found with ID: " + companyId);
                return error;
            }

            OwnerPanelDTO.SalesOverviewAvgBasketDTO modelResult = layer.getSalesOverviewAvgBasket(companyId, period);

            if (modelResult == null) {
                toReturn.put("status", "InternalServerError");
                toReturn.put("statusCode", 500);
                return toReturn;
            }

            JSONObject result = new JSONObject();
            result.put("currentAvg", modelResult.getCurrentAvg());
            result.put("previousAvg", modelResult.getPreviousAvg());
            result.put("currency", modelResult.getCurrency());

            toReturn.put("result", result);

            toReturn.put("status", "success");
            toReturn.put("statusCode", 200);

            return toReturn;

        } catch (Exception e) {
            e.printStackTrace();
            JSONObject error = new JSONObject();
            error.put("statusCode", 500);
            error.put("message", "Internal server error: " + e.getMessage());
            return error;
        }
    }

    public JSONObject getSalesOverviewBookingsCount(Integer companyId, String period) {

        try {
            JSONObject toReturn = new JSONObject();

            Boolean companyExist = CompaniesService.validateCompanyExist(companyId);

            if (!companyExist) {
                JSONObject error = new JSONObject();
                error.put("statusCode", 404);
                error.put("message", "Company not found with ID: " + companyId);
                return error;
            }

            OwnerPanelDTO.SalesOverviewBookingsCount modelResult = layer.getSalesOverviewBookingsCount(companyId, period);

            if (modelResult == null) {
                toReturn.put("status", "InternalServerError");
                toReturn.put("statusCode", 500);
                return toReturn;
            }

            JSONObject result = new JSONObject();
            result.put("currentCount", modelResult.getCurrentCount());
            result.put("previousCount", modelResult.getPreviousCount());

            toReturn.put("result", result);

            toReturn.put("status", "success");
            toReturn.put("statusCode", 200);

            return toReturn;

        } catch (Exception e) {
            e.printStackTrace();
            JSONObject error = new JSONObject();
            error.put("statusCode", 500);
            error.put("message", "Internal server error: " + e.getMessage());
            return error;
        }
    }

    public JSONObject getSalesOverviewReturningClients(Integer companyId, String period) {

        try {
            JSONObject toReturn = new JSONObject();

            Boolean companyExist = CompaniesService.validateCompanyExist(companyId);

            if (!companyExist) {
                JSONObject error = new JSONObject();
                error.put("statusCode", 404);
                error.put("status", "NotFound");
                error.put("message", "Company not found with ID: " + companyId);
                return error;
            }

            OwnerPanelDTO.SalesOverviewReturningClientsDTO modelResult = layer.getSalesOverviewReturningClients(companyId, period);

            if (modelResult == null) {
                toReturn.put("status", "InternalServerError");
                toReturn.put("statusCode", 500);
                return toReturn;
            }

            JSONObject result = new JSONObject();
            result.put("currentTotalClients", modelResult.getCurrentTotalClients());
            result.put("currentReturningClients", modelResult.getCurrentReturningClients());
            result.put("previousTotalClients", modelResult.getPreviousTotalClients());
            result.put("previousReturningClients", modelResult.getPreviousReturningClients());

            toReturn.put("result", result);

            toReturn.put("status", "success");
            toReturn.put("statusCode", 200);

            return toReturn;

        } catch (Exception e) {
            e.printStackTrace();
            JSONObject error = new JSONObject();
            error.put("statusCode", 500);
            error.put("message", "Internal server error: " + e.getMessage());
            return error;
        }
    }

    public JSONObject getSalesRevenueChart(Integer companyId, String period) {

        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        Boolean companyExist = CompaniesService.validateCompanyExist(companyId);

        if (!companyExist) {
            JSONObject error = new JSONObject();
            error.put("statusCode", 404);
            error.put("status", "NotFound");
            error.put("message", "Company not found with ID: " + companyId);
            return error;
        }

        // Model hívás
        ArrayList<OwnerPanelDTO.SalesRevenueChartDTO> modelResult = layer.getSalesRevenueChart(companyId, period);

        if (modelResult == null) {
            statusCode = 500;
            status = "ModelException";
            toReturn.put("message", "Internal server error");

        } else {
            ArrayList resultList = new ArrayList();

            for (OwnerPanelDTO.SalesRevenueChartDTO record : modelResult) {
                JSONObject datObj = new JSONObject();
                datObj.put("date", record.getDate());
                datObj.put("dayName", record.getDayName());
                datObj.put("revenue", record.getRevenue() != null ? record.getRevenue() : JSONObject.NULL);
                datObj.put("currency", record.getCurrency());

                resultList.add(datObj);
            }

            toReturn.put("result", resultList);
        }

        toReturn.put("status", status);
        toReturn.put("statusCode", statusCode);

        return toReturn;
    }
}
