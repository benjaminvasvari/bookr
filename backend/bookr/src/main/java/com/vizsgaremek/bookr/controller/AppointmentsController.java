package com.vizsgaremek.bookr.controller;

import com.vizsgaremek.bookr.security.JWT;
import com.vizsgaremek.bookr.service.AppointmentsService;
import com.vizsgaremek.bookr.util.RoleChecker;
import java.math.BigDecimal;
import java.time.LocalDate;
import javax.inject.Inject;
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

/**
 *
 * @author vben
 */
@Path("appointments")
public class AppointmentsController {

    private final AppointmentsService appointmentsService = new AppointmentsService();

    @Inject
    private RoleChecker roleChecker;

    /**
     * Default XML endpoint - not used, kept for template compatibility
     */
    @GET
    @Produces(MediaType.APPLICATION_XML)
    public String getXml() {
        throw new UnsupportedOperationException("XML not supported");
    }

    /**
     * Retrieves unavailable dates for a company and staff member. Returns dates
     * from today up to the company's configured advance booking period.
     *
     * @param companyId the company identifier (required, > 0)
     * @param staffId the staff identifier (required, > 0)
     * @return JSON response with unavailable dates
     */
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
            JSONObject result = appointmentsService.getUnavailableDates(companyId, staffId);

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
            JSONObject result = appointmentsService.getOccupiedSlotsDataForBooking(companyId, staffId, date);
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
        Integer serviceId = bodyObject.getInt("serviceId");
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
            JSONObject toReturn = appointmentsService.createAppointment(jwtToken, companyId, serviceId, staffId, clientId, startTime, endTime, notes, price);
            
            return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                    .entity(toReturn.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }
}
