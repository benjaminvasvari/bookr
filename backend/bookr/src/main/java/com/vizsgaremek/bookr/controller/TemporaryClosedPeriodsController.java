/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/WebServices/GenericResource.java to edit this template
 */
package com.vizsgaremek.bookr.controller;

import com.vizsgaremek.bookr.DTO.OwnerPanelDTO;
import com.vizsgaremek.bookr.DTO.OwnerPanelDTO.createTemporaryClosedPeriodDTO;
import com.vizsgaremek.bookr.security.JWT;
import com.vizsgaremek.bookr.service.CompaniesService;
import com.vizsgaremek.bookr.service.TemporaryClosedPeriodsService;
import static com.vizsgaremek.bookr.util.ErrorResponseBuilder.buildErrorResponse;
import com.vizsgaremek.bookr.util.RoleChecker;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.UriInfo;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.Produces;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PUT;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.json.JSONObject;

/**
 * REST Web Service
 *
 * @author vben
 */
@Path("temporary-closed")
public class TemporaryClosedPeriodsController {

    private TemporaryClosedPeriodsService layer = new TemporaryClosedPeriodsService();
    private CompaniesService CompaniesService = new CompaniesService();
    private RoleChecker RoleChecker = new RoleChecker();

    @Context
    private UriInfo context;

    /**
     * Creates a new instance of TemporaryClosedPeriodsController
     */
    public TemporaryClosedPeriodsController() {
    }

    /**
     * Retrieves representation of an instance of
     * com.vizsgaremek.bookr.controller.TemporaryClosedPeriodsController
     *
     * @return an instance of java.lang.String
     */
    @GET
    @Produces(MediaType.APPLICATION_XML)
    public String getXml() {
        //TODO return proper representation object
        throw new UnsupportedOperationException();
    }

    /**
     * PUT method for updating or creating an instance of
     * TemporaryClosedPeriodsController
     *
     * @param content representation for the resource
     */
    @PUT
    @Consumes(MediaType.APPLICATION_XML)
    public void putXml(String content) {
    }

    @GET
    @Path("getAll")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response getAll(@HeaderParam("Authorization") String authHeader) {

        // 1. Auth header check
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

        // 3. Role check
        String userRoles = JWT.getRolesFromAccessToken(jwtToken);
        boolean hasPermission = RoleChecker.hasAllRoles(userRoles, "client", "owner");
        if (!hasPermission) {
            return buildErrorResponse(403, "Forbidden");
        }

        Integer userCompanyId = JWT.getCompanyIdFromAccessToken(jwtToken);

        Boolean isCompanyExist = CompaniesService.validateCompanyExist(userCompanyId);

        if (!isCompanyExist) {
            return buildErrorResponse(400, "CompanyNotExist");
        } else if (isCompanyExist == null) {
            return buildErrorResponse(500, "InternalServerError");
        }

        JSONObject toReturn = layer.getTemporaryClosedPeriods(userCompanyId);

        return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                .entity(toReturn.toString())
                .type(MediaType.APPLICATION_JSON)
                .build();
    }

    @POST
    @Path("create")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response create(@HeaderParam("Authorization") String authHeader, String body) {
        JSONObject bodyObj = new JSONObject(body);

        // 1. Auth header check
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

        // 3. Role check
        String userRoles = JWT.getRolesFromAccessToken(jwtToken);
        boolean hasPermission = RoleChecker.hasAllRoles(userRoles, "client", "owner");
        if (!hasPermission) {
            return buildErrorResponse(403, "Forbidden");
        }

        Integer userCompanyId = JWT.getCompanyIdFromAccessToken(jwtToken);

        Boolean isCompanyExist = CompaniesService.validateCompanyExist(userCompanyId);

        if (!isCompanyExist) {
            return buildErrorResponse(400, "CompanyNotExist");
        } else if (isCompanyExist == null) {
            return buildErrorResponse(500, "InternalServerError");
        }

        String openTime = null;
        if (bodyObj.has("openTime") && !bodyObj.isNull("openTime")) {
            openTime = bodyObj.getString("openTime");
        }

        String closeTime = null;
        if (bodyObj.has("closeTime") && !bodyObj.isNull("closeTime")) {
            closeTime = bodyObj.getString("closeTime");
        }

        String reason = null;
        if (bodyObj.has("reason") && !bodyObj.isNull("reason")) {
            reason = bodyObj.getString("reason");
        }

        createTemporaryClosedPeriodDTO request = new createTemporaryClosedPeriodDTO(
                bodyObj.getString("startDate"),
                bodyObj.getString("endDate"),
                openTime,
                closeTime,
                reason
        );

        JSONObject toReturn = layer.createTemporaryClosedPeriod(userCompanyId, request);

        return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                .entity(toReturn.toString())
                .type(MediaType.APPLICATION_JSON)
                .build();
    }

    @PUT
    @Path("update")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response update(@HeaderParam("Authorization") String authHeader, String body, @QueryParam("id") Integer periodId) {
        JSONObject bodyObj = new JSONObject(body);

        // 1. Auth header check
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

        // 3. Role check
        String userRoles = JWT.getRolesFromAccessToken(jwtToken);
        boolean hasPermission = RoleChecker.hasAllRoles(userRoles, "client", "owner");
        if (!hasPermission) {
            return buildErrorResponse(403, "Forbidden");
        }

        Integer userCompanyId = JWT.getCompanyIdFromAccessToken(jwtToken);

        Boolean isCompanyExist = CompaniesService.validateCompanyExist(userCompanyId);

        if (!isCompanyExist) {
            return buildErrorResponse(400, "CompanyNotExist");
        } else if (isCompanyExist == null) {
            return buildErrorResponse(500, "InternalServerError");
        }

        String openTime = null;
        if (bodyObj.has("openTime") && !bodyObj.isNull("openTime")) {
            openTime = bodyObj.getString("openTime");
        }

        String closeTime = null;
        if (bodyObj.has("closeTime") && !bodyObj.isNull("closeTime")) {
            closeTime = bodyObj.getString("closeTime");
        }

        String reason = null;
        if (bodyObj.has("reason") && !bodyObj.isNull("reason")) {
            reason = bodyObj.getString("reason");
        }

        createTemporaryClosedPeriodDTO request = new createTemporaryClosedPeriodDTO(
                bodyObj.getString("startDate"),
                bodyObj.getString("endDate"),
                openTime,
                closeTime,
                reason
        );

        if (periodId == null || periodId <= 0) {
            return buildErrorResponse(400, "InvalidParam");
        }

        JSONObject toReturn = layer.updateTemporaryClosedPeriod(periodId, userCompanyId, request);

        return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                .entity(toReturn.toString())
                .type(MediaType.APPLICATION_JSON)
                .build();
    }

    @DELETE
    @Path("delete")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response delete(@HeaderParam("Authorization") String authHeader, @QueryParam("id") Integer periodId) {

        // 1. Auth header check
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

        // 3. Role check
        String userRoles = JWT.getRolesFromAccessToken(jwtToken);
        boolean hasPermission = RoleChecker.hasAllRoles(userRoles, "client", "owner");
        if (!hasPermission) {
            return buildErrorResponse(403, "Forbidden");
        }

        Integer userCompanyId = JWT.getCompanyIdFromAccessToken(jwtToken);

        Boolean isCompanyExist = CompaniesService.validateCompanyExist(userCompanyId);

        if (!isCompanyExist) {
            return buildErrorResponse(400, "CompanyNotExist");
        } else if (isCompanyExist == null) {
            return buildErrorResponse(500, "InternalServerError");
        }

        if (periodId == null || periodId <= 0) {
            return buildErrorResponse(400, "InvalidParam");
        }

        JSONObject toReturn = layer.deleteTemporaryClosedPeriod(periodId);

        return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                .entity(toReturn.toString())
                .type(MediaType.APPLICATION_JSON)
                .build();
    }

    @GET
    @Path("weekly")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response getWeeklyTemporaryClosedPeriods(@HeaderParam("Authorization") String authHeader, @QueryParam("start") String weekStart) {

        // 1. Auth header check
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

        // 3. Role check
        String userRoles = JWT.getRolesFromAccessToken(jwtToken);
        boolean hasPermission = RoleChecker.hasAllRoles(userRoles, "client", "owner");
        if (!hasPermission) {
            return buildErrorResponse(403, "Forbidden");
        }

        Integer userCompanyId = JWT.getCompanyIdFromAccessToken(jwtToken);

        Boolean isCompanyExist = CompaniesService.validateCompanyExist(userCompanyId);

        if (!isCompanyExist) {
            return buildErrorResponse(400, "CompanyNotExist");
        } else if (isCompanyExist == null) {
            return buildErrorResponse(500, "InternalServerError");
        }

        JSONObject toReturn = layer.getWeeklyTemporaryClosedPeriods(userCompanyId, weekStart);

        return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                .entity(toReturn.toString())
                .type(MediaType.APPLICATION_JSON)
                .build();
    }
}
