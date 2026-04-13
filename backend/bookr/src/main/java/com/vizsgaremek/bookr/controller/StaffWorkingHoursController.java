package com.vizsgaremek.bookr.controller;

import com.vizsgaremek.bookr.security.JWT;
import com.vizsgaremek.bookr.service.StaffWorkingHoursService;
import com.vizsgaremek.bookr.util.RoleChecker;
import org.json.JSONObject;

import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import static com.vizsgaremek.bookr.util.ErrorResponseBuilder.buildErrorResponse;

@Path("staffworkingh")
public class StaffWorkingHoursController {

    private StaffWorkingHoursService service = new StaffWorkingHoursService();
    private RoleChecker RoleChecker = new RoleChecker();

    @GET
    @Path("staffWorkingHours")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getStaffWorkingHours(@HeaderParam("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return buildErrorResponse(401, "missingToken");
        }

        String jwtToken = authHeader.substring(7);
        Boolean validJwt = JWT.validateAccessToken(jwtToken);

        if (validJwt == null) {
            return buildErrorResponse(401, "tokenExpired");
        } else if (validJwt == false) {
            return buildErrorResponse(401, "invalidToken");
        }

        String userRoles = JWT.getRolesFromAccessToken(jwtToken);
        boolean hasPermission = RoleChecker.hasAllRoles(userRoles, "client", "staff");
        if (!hasPermission) {
            return buildErrorResponse(403, "Forbidden");
        }

        Integer userId = JWT.getUserIdFromAccessToken(jwtToken);

        JSONObject toReturn = service.getStaffWorkingHoursByStaffId(userId);

        return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                .entity(toReturn.toString())
                .type(MediaType.APPLICATION_JSON)
                .build();
    }

    @PUT
    @Path("updateStaffWorkingHours")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response updateStaffWorkingHours(@HeaderParam("Authorization") String authHeader, String body) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return buildErrorResponse(401, "missingToken");
        }

        String jwtToken = authHeader.substring(7);
        Boolean validJwt = JWT.validateAccessToken(jwtToken);

        if (validJwt == null) {
            return buildErrorResponse(401, "tokenExpired");
        } else if (validJwt == false) {
            return buildErrorResponse(401, "invalidToken");
        }

        String userRoles = JWT.getRolesFromAccessToken(jwtToken);
        boolean hasPermission = RoleChecker.hasAllRoles(userRoles, "client", "staff");
        if (!hasPermission) {
            return buildErrorResponse(403, "Forbidden");
        }

        JSONObject bodyObj = new JSONObject(body);

        if (!bodyObj.has("dayOfWeek") || bodyObj.isNull("dayOfWeek")
                || !bodyObj.has("isAvailable") || bodyObj.isNull("isAvailable")) {
            return buildErrorResponse(400, "missingFields");
        }

        String dayOfWeek = bodyObj.getString("dayOfWeek");
        Boolean isAvailable = bodyObj.getBoolean("isAvailable");
        String startTime = bodyObj.optString("startTime", null);
        String endTime = bodyObj.optString("endTime", null);

        if (isAvailable && (startTime == null || endTime == null)) {
            return buildErrorResponse(400, "missingFields");
        }

        Integer userId = JWT.getUserIdFromAccessToken(jwtToken);


        JSONObject toReturn = service.updateStaffWorkingHours(userId, dayOfWeek, startTime, endTime, isAvailable);

        return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                .entity(toReturn.toString())
                .type(MediaType.APPLICATION_JSON)
                .build();
    }
}