package com.vizsgaremek.bookr.controller;

import com.vizsgaremek.bookr.security.JWT;
import com.vizsgaremek.bookr.service.AppointmentsService;
import com.vizsgaremek.bookr.util.RoleChecker;
import java.math.BigDecimal;
import java.time.LocalDate;
import javax.inject.Inject;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 *
 * @author vben
 */
@Path("appointments")
public class AppointmentsController {

    private final AppointmentsService layer = new AppointmentsService();
    private final RoleChecker RoleChecker = new RoleChecker();

    /**
     * Default XML endpoint - not used, kept for template compatibility
     */
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

    @GET
    @Path("unavailable-dates")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getUnavailableDates(
            @QueryParam("companyId") Integer companyId,
            @QueryParam("staffId") Integer staffId) {

        JSONObject errorResponse = new JSONObject();

        // Validation
        if (companyId == null || companyId <= 0) {
            errorResponse.put("status", "error");
            errorResponse.put("statusCode", 400);
            errorResponse.put("message", "Invalid or missing companyId");
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(errorResponse.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }

        if (staffId == null || staffId <= 0) {
            errorResponse.put("status", "error");
            errorResponse.put("statusCode", 400);
            errorResponse.put("message", "Invalid or missing staffId");
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(errorResponse.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }

        try {
            // Call service layer - returns full JSON response (status, data, etc.)
            JSONObject result = layer.getUnavailableDates(companyId, staffId);

            // Service already sets status and statusCode
            int statusCode = result.optInt("statusCode", 200);
            return Response.status(statusCode)
                    .entity(result.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();

        } catch (Exception e) {
            e.printStackTrace();
            errorResponse.put("status", "error");
            errorResponse.put("statusCode", 500);
            errorResponse.put("message", "Internal server error occurred");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(errorResponse.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
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

        // Validációk sorrendben
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

        // Service call
        try {
            JSONObject result = layer.getOccupiedSlotsDataForBooking(companyId, staffId, date);
            int statusCode = result.optInt("statusCode", 200);
            return Response.status(statusCode)
                    .entity(result.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();

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

        // Extract token from "Bearer <token>"
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("Missing or invalid Authorization header");
            return Response.status(401).entity("missingToken").build();
        }

        // Remove "Bearer " prefix
        String jwtToken = authHeader.substring(7);

        //
        Boolean validJwt = JWT.validateAccessToken(jwtToken);
        Integer clientId = JWT.getUserIdFromAccessToken(jwtToken);

        Integer companyId = bodyObject.getInt("companyId");
        Integer serviceId = bodyObject.getInt("serviceIds");
        Integer staffId = bodyObject.getInt("staffId");
        String startTime = bodyObject.getString("startTime");
        String endTime = bodyObject.getString("endTime");
        String notes = bodyObject.getString("notes");
        BigDecimal price = bodyObject.getBigDecimal("price");

        if (validJwt == null) {
            // Lejárt JWT
            return Response.status(401).entity("tokenExpired").build();
        } else if (validJwt == false) {
            // Invalid JWT
            return Response.status(401).entity("invalidToken").build();
        } else {
            // Valid token
            JSONObject toReturn = layer.createAppointment(jwtToken, companyId, serviceId, staffId, clientId, startTime, endTime, notes, price);

            return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                    .entity(toReturn.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }

    @GET
    @Path("getAppointmentsByClient")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response getAppointmentsByClient(
            @HeaderParam("Authorization") String authHeader,
            @QueryParam("page") Integer page,
            @QueryParam("amount") Integer amount,
            @QueryParam("isupcoming") Integer isUpComingInt) {

        // Extract token from "Bearer <token>"
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("Missing or invalid Authorization header");
            return buildErrorResponse(401, "missingToken");
        }

        // Validate parameters
        if (page == null || page <= 0
                || amount == null || amount <= 0
                || isUpComingInt == null || (isUpComingInt != 0 && isUpComingInt != 1)) {
            return buildErrorResponse(417, "invalidParam");
        }

        // Convert Integer to Boolean
        Boolean isUpComing = (isUpComingInt == 1);

        // Remove "Bearer " prefix
        String jwtToken = authHeader.substring(7);
        Boolean validJwt = JWT.validateAccessToken(jwtToken);

        if (validJwt == null) {
            // Lejárt JWT
            return buildErrorResponse(401, "tokenExpired");
        } else if (validJwt == false) {
            // Invalid JWT
            return buildErrorResponse(401, "invalidToken");
        } else {
            // Valid token
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
    @Consumes(MediaType.APPLICATION_JSON)
    public Response getAllFutureAppointmentsByCompany(@HeaderParam("Authorization") String authHeader, @QueryParam("companyId") Integer companyId) {

        // Extract token from "Bearer <token>"
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("Missing or invalid Authorization header");
            return buildErrorResponse(401, "missingToken");
        }

        // Validate parameters
        if (companyId == null || companyId <= 0) {
            return buildErrorResponse(417, "invalidParam");
        }

        // Remove "Bearer " prefix
        String jwtToken = authHeader.substring(7);
        Boolean validJwt = JWT.validateAccessToken(jwtToken);

        if (validJwt == null) {
            // Lejárt JWT
            return buildErrorResponse(401, "tokenExpired");
        } else if (validJwt == false) {
            // Invalid JWT
            return buildErrorResponse(401, "invalidToken");
        } else {
            // Valid token
            String userRoles = JWT.getRolesFromAccessToken(jwtToken);
            boolean hasPermission = RoleChecker.hasAllRoles(userRoles, "client", "owner") || RoleChecker.hasAllRoles(userRoles, "client", "superadmin");

            if (!hasPermission) {
                return buildErrorResponse(403, "forbidden");
            }

            JSONObject toReturn = layer.getAllFutureAppointmentsByCompany(companyId);
            return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                    .entity(toReturn.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }
}
