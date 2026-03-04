package com.vizsgaremek.bookr.controller;

import com.vizsgaremek.bookr.security.JWT;
import com.vizsgaremek.bookr.service.AppointmentsService;
import com.vizsgaremek.bookr.util.RoleChecker;
import java.math.BigDecimal;
import java.time.LocalDate;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.json.JSONObject;

@Path("appointments")
public class AppointmentsController {

    private final AppointmentsService layer = new AppointmentsService();
    private final RoleChecker RoleChecker = new RoleChecker();

    @GET
    @Produces(MediaType.APPLICATION_XML)
    public String getXml() {
        throw new UnsupportedOperationException("XML not supported");
    }

    private Response buildErrorResponse(int statusCode, String status) {
        JSONObject errorResponse = new JSONObject();
        errorResponse.put("statusCode", statusCode);
        errorResponse.put("status", status);
        return Response.status(statusCode)
                .entity(errorResponse.toString())
                .type(MediaType.APPLICATION_JSON)
                .build();
    }

    private Response handleSalesEndpoint(String authHeader, Integer companyId, String period, java.util.function.BiFunction<Integer, String, JSONObject> serviceCall) {
        JSONObject errorResponse = new JSONObject();

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return buildErrorResponse(401, "missingToken");
        }
        if (companyId == null || companyId <= 0) {
            errorResponse.put("status", "InvalidParam");
            errorResponse.put("statusCode", 400);
            return Response.status(400).entity(errorResponse.toString()).type(MediaType.APPLICATION_JSON).build();
        }
        if (period == null || (!period.equals("week") && !period.equals("month") && !period.equals("year"))) {
            errorResponse.put("status", "InvalidParam");
            errorResponse.put("statusCode", 400);
            return Response.status(400).entity(errorResponse.toString()).type(MediaType.APPLICATION_JSON).build();
        }

        String jwtToken = authHeader.substring(7);
        Boolean validJwt = JWT.validateAccessToken(jwtToken);
        if (validJwt == null) {
            return buildErrorResponse(401, "tokenExpired");
        }
        if (validJwt == false) {
            return buildErrorResponse(401, "invalidToken");
        }

        String userRoles = JWT.getRolesFromAccessToken(jwtToken);
        boolean hasPermission = RoleChecker.hasAllRoles(userRoles, "client", "owner")
                || RoleChecker.hasAllRoles(userRoles, "client", "superadmin");
        if (!hasPermission) {
            return buildErrorResponse(403, "forbidden");
        }

        if (RoleChecker.hasAllRoles(userRoles, "client", "owner")) {
            Integer jwtCompanyId = JWT.getCompanyIdFromAccessToken(jwtToken);
            if (jwtCompanyId == null || !jwtCompanyId.equals(companyId)) {
                return buildErrorResponse(403, "forbidden");
            }
        }

        JSONObject toReturn = serviceCall.apply(companyId, period);
        return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                .entity(toReturn.toString())
                .type(MediaType.APPLICATION_JSON)
                .build();
    }

    @GET
    @Path("unavailable-dates")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getUnavailableDates(
            @QueryParam("companyId") Integer companyId,
            @QueryParam("staffId") Integer staffId) {

        JSONObject errorResponse = new JSONObject();

        if (companyId == null || companyId <= 0) {
            errorResponse.put("status", "error");
            errorResponse.put("statusCode", 400);
            errorResponse.put("message", "Invalid or missing companyId");
            return Response.status(400).entity(errorResponse.toString()).type(MediaType.APPLICATION_JSON).build();
        }

        if (staffId == null || staffId <= 0) {
            errorResponse.put("status", "error");
            errorResponse.put("statusCode", 400);
            errorResponse.put("message", "Invalid or missing staffId");
            return Response.status(400).entity(errorResponse.toString()).type(MediaType.APPLICATION_JSON).build();
        }

        try {
            JSONObject result = layer.getUnavailableDates(companyId, staffId);
            int statusCode = result.optInt("statusCode", 200);
            return Response.status(statusCode).entity(result.toString()).type(MediaType.APPLICATION_JSON).build();
        } catch (Exception e) {
            e.printStackTrace();
            errorResponse.put("status", "error");
            errorResponse.put("statusCode", 500);
            errorResponse.put("message", "Internal server error occurred");
            return Response.status(500).entity(errorResponse.toString()).type(MediaType.APPLICATION_JSON).build();
        }
    }

    @GET
    @Path("occupied-slots")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getOccupiedSlotsForBooking(
            @QueryParam("companyId") Integer companyId,
            @QueryParam("staffId") Integer staffId,
            @QueryParam("date") java.sql.Date date) {

        JSONObject errorResponse = new JSONObject();

        if (companyId == null || companyId <= 0) {
            errorResponse.put("status", "error");
            errorResponse.put("statusCode", 400);
            errorResponse.put("message", "Invalid or missing companyId");
            return Response.status(400).entity(errorResponse.toString()).type(MediaType.APPLICATION_JSON).build();
        }

        if (staffId == null || staffId <= 0) {
            errorResponse.put("status", "error");
            errorResponse.put("statusCode", 400);
            errorResponse.put("message", "Invalid or missing staffId");
            return Response.status(400).entity(errorResponse.toString()).type(MediaType.APPLICATION_JSON).build();
        }

        if (date == null) {
            errorResponse.put("status", "error");
            errorResponse.put("statusCode", 400);
            errorResponse.put("message", "Date parameter is required");
            return Response.status(400).entity(errorResponse.toString()).type(MediaType.APPLICATION_JSON).build();
        }

        LocalDate dateOnly = date.toLocalDate();
        if (dateOnly.isBefore(LocalDate.now())) {
            errorResponse.put("status", "error");
            errorResponse.put("statusCode", 400);
            errorResponse.put("message", "Date cannot be in the past");
            return Response.status(400).entity(errorResponse.toString()).type(MediaType.APPLICATION_JSON).build();
        }

        try {
            JSONObject result = layer.getOccupiedSlotsDataForBooking(companyId, staffId, date);
            int statusCode = result.optInt("statusCode", 200);
            return Response.status(statusCode).entity(result.toString()).type(MediaType.APPLICATION_JSON).build();
        } catch (Exception e) {
            e.printStackTrace();
            errorResponse.put("status", "error");
            errorResponse.put("statusCode", 500);
            errorResponse.put("message", "Internal server error occurred");
            return Response.status(500).entity(errorResponse.toString()).type(MediaType.APPLICATION_JSON).build();
        }
    }

    @POST
    @Path("createAppointment")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response createAppointment(@HeaderParam("Authorization") String authHeader, String body) {
        JSONObject bodyObject = new JSONObject(body);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return buildErrorResponse(401, "missingToken");
        }

        String jwtToken = authHeader.substring(7);
        Boolean validJwt = JWT.validateAccessToken(jwtToken);
        Integer clientId = JWT.getUserIdFromAccessToken(jwtToken);

        Integer companyId = bodyObject.getInt("companyId");
        Integer serviceId = bodyObject.getInt("serviceIds");
        Integer staffId = bodyObject.getInt("staffId");
        String startTime = bodyObject.getString("startTime");
        String endTime = bodyObject.getString("endTime");
        String notes = bodyObject.optString("notes", null);
        BigDecimal price = bodyObject.getBigDecimal("price");

        if (validJwt == null) {
            return buildErrorResponse(401, "tokenExpired");
        } else if (validJwt == false) {
            return buildErrorResponse(401, "invalidToken");
        } else {
            JSONObject toReturn = layer.createAppointment(jwtToken, companyId, serviceId, staffId, clientId, startTime, endTime, notes, price);
            return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                    .entity(toReturn.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }

    @GET
    @Path("getAppointmentsByClient")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAppointmentsByClient(
            @HeaderParam("Authorization") String authHeader,
            @QueryParam("page") Integer page,
            @QueryParam("amount") Integer amount,
            @QueryParam("isupcoming") Integer isUpComingInt) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return buildErrorResponse(401, "missingToken");
        }

        if (page == null || page <= 0
                || amount == null || amount <= 0
                || isUpComingInt == null || (isUpComingInt != 0 && isUpComingInt != 1)) {
            return buildErrorResponse(400, "invalidParam");
        }

        Boolean isUpComing = (isUpComingInt == 1);

        String jwtToken = authHeader.substring(7);
        Boolean validJwt = JWT.validateAccessToken(jwtToken);

        if (validJwt == null) {
            return buildErrorResponse(401, "tokenExpired");
        } else if (validJwt == false) {
            return buildErrorResponse(401, "invalidToken");
        } else {
            String userRoles = JWT.getRolesFromAccessToken(jwtToken);
            Integer userId = JWT.getUserIdFromAccessToken(jwtToken);
            boolean hasPermission = RoleChecker.hasAnyRole(userRoles, "client");
            if (!hasPermission) {
                return buildErrorResponse(403, "forbidden");
            }

            JSONObject toReturn = layer.getAppointmentsByClient(userId, page, amount, isUpComing);
            return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                    .entity(toReturn.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }

    @GET
    @Path("getAllByCompany")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAllFutureAppointmentsByCompany(@HeaderParam("Authorization") String authHeader, @QueryParam("companyId") Integer companyId) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return buildErrorResponse(401, "missingToken");
        }

        if (companyId == null || companyId <= 0) {
            return buildErrorResponse(400, "invalidParam");
        }

        String jwtToken = authHeader.substring(7);
        Boolean validJwt = JWT.validateAccessToken(jwtToken);

        if (validJwt == null) {
            return buildErrorResponse(401, "tokenExpired");
        } else if (validJwt == false) {
            return buildErrorResponse(401, "invalidToken");
        } else {
            String userRoles = JWT.getRolesFromAccessToken(jwtToken);
            boolean hasPermission = RoleChecker.hasAllRoles(userRoles, "client", "owner")
                    || RoleChecker.hasAllRoles(userRoles, "client", "superadmin");
            if (!hasPermission) {
                return buildErrorResponse(403, "forbidden");
            }

            if (RoleChecker.hasAllRoles(userRoles, "client", "owner")) {
                Integer jwtCompanyId = JWT.getCompanyIdFromAccessToken(jwtToken);
                if (jwtCompanyId == null || !jwtCompanyId.equals(companyId)) {
                    return buildErrorResponse(403, "forbidden");
                }
            }

            JSONObject toReturn = layer.getAllFutureAppointmentsByCompany(companyId);
            return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                    .entity(toReturn.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }

    @GET
    @Path("getSalesOverviewRevenueByCompany")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getSalesOverviewRevenueByCompany(@HeaderParam("Authorization") String authHeader, @QueryParam("companyId") Integer companyId, @QueryParam("period") String period) {
        return handleSalesEndpoint(authHeader, companyId, period, layer::getSalesOverviewRevenueByCompany);
    }

    @GET
    @Path("getSalesOverviewAvgBasket")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getSalesOverviewAvgBasket(@HeaderParam("Authorization") String authHeader, @QueryParam("companyId") Integer companyId, @QueryParam("period") String period) {
        return handleSalesEndpoint(authHeader, companyId, period, layer::getSalesOverviewAvgBasket);
    }

    @GET
    @Path("getSalesOverviewBookingsCount")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getSalesOverviewBookingsCount(@HeaderParam("Authorization") String authHeader, @QueryParam("companyId") Integer companyId, @QueryParam("period") String period) {
        return handleSalesEndpoint(authHeader, companyId, period, layer::getSalesOverviewBookingsCount);
    }

    @GET
    @Path("getSalesOverviewReturningClients")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getSalesOverviewReturningClients(@HeaderParam("Authorization") String authHeader, @QueryParam("companyId") Integer companyId, @QueryParam("period") String period) {
        return handleSalesEndpoint(authHeader, companyId, period, layer::getSalesOverviewReturningClients);
    }

    @GET
    @Path("getSalesRevenueChart")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getSalesRevenueChart(@HeaderParam("Authorization") String authHeader, @QueryParam("companyId") Integer companyId, @QueryParam("period") String period) {
        return handleSalesEndpoint(authHeader, companyId, period, layer::getSalesRevenueChart);
    }

    @GET
    @Path("getWeeklyCalendarAppointments")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getWeeklyCalendarAppointments(
            @HeaderParam("Authorization") String authHeader,
            @QueryParam("companyId") Integer companyId,
            @QueryParam("staffId") Integer staffId,
            @QueryParam("weekStart") String weekStart) {

        JSONObject errorResponse = new JSONObject();

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return buildErrorResponse(401, "missingToken");
        }

        if (companyId == null || companyId <= 0) {
            errorResponse.put("status", "InvalidParam");
            errorResponse.put("statusCode", 400);
            return Response.status(400).entity(errorResponse.toString()).type(MediaType.APPLICATION_JSON).build();
        }

        if (weekStart == null || !weekStart.matches("\\d{4}-\\d{2}-\\d{2}")) {
            errorResponse.put("status", "InvalidParam");
            errorResponse.put("statusCode", 400);
            return Response.status(400).entity(errorResponse.toString()).type(MediaType.APPLICATION_JSON).build();
        }

        String jwtToken = authHeader.substring(7);
        Boolean validJwt = JWT.validateAccessToken(jwtToken);
        if (validJwt == null) {
            return buildErrorResponse(401, "tokenExpired");
        }
        if (validJwt == false) {
            return buildErrorResponse(401, "invalidToken");
        }

        String userRoles = JWT.getRolesFromAccessToken(jwtToken);
        boolean hasPermission = RoleChecker.hasAllRoles(userRoles, "client", "owner")
                || RoleChecker.hasAllRoles(userRoles, "client", "superadmin");
        if (!hasPermission) {
            return buildErrorResponse(403, "forbidden");
        }

        if (RoleChecker.hasAllRoles(userRoles, "client", "owner")) {
            Integer jwtCompanyId = JWT.getCompanyIdFromAccessToken(jwtToken);
            if (jwtCompanyId == null || !jwtCompanyId.equals(companyId)) {
                return buildErrorResponse(403, "forbidden");
            }
        }

        JSONObject toReturn = layer.getWeeklyCalendarAppointments(companyId, staffId, weekStart);
        return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                .entity(toReturn.toString())
                .type(MediaType.APPLICATION_JSON)
                .build();
    }
}
