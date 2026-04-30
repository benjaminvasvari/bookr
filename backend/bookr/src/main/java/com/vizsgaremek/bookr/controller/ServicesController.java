/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/WebServices/GenericResource.java to edit this template
 */
package com.vizsgaremek.bookr.controller;

import com.vizsgaremek.bookr.model.Services;
import com.vizsgaremek.bookr.security.JWT;
import com.vizsgaremek.bookr.service.ServicesService;

import static com.vizsgaremek.bookr.util.ErrorResponseBuilder.buildErrorResponse;

import com.vizsgaremek.bookr.util.RoleChecker;

import javax.ws.rs.core.Context;
import javax.ws.rs.core.UriInfo;
import javax.ws.rs.Produces;
import javax.ws.rs.Consumes;
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
@Path("services")
public class ServicesController {

    private ServicesService layer = new ServicesService();
    private RoleChecker RoleChecker = new RoleChecker();
    private Services Services = new Services();

    @Context
    private UriInfo context;

    /**
     * Creates a new instance of ServicesController
     */
    public ServicesController() {
    }

    /**
     * Retrieves representation of an instance of
     * com.vizsgaremek.bookr.controller.ServicesController
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
     * PUT method for updating or creating an instance of ServicesController
     *
     * @param content representation for the resource
     */
    @PUT
    @Consumes(MediaType.APPLICATION_XML)
    public void putXml(String content) {
    }

    @GET
    @Path("getSalesTopServices")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getSalesRevenueChart(@HeaderParam("Authorization") String authHeader, @QueryParam("companyId") Integer companyId, @QueryParam("period") String period) {

        JSONObject errorResponse = new JSONObject();

        // Extract token from "Bearer <token>"
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("Missing or invalid Authorization header");
            return buildErrorResponse(401, "missingToken");
        }

        // Validation
        if (companyId == null || companyId <= 0) {
            errorResponse.put("status", "InvalidParam");
            errorResponse.put("statusCode", 400);
            return Response.status(Response.Status.BAD_REQUEST).entity(errorResponse.toString()).type(MediaType.APPLICATION_JSON).build();
        }

        if (period == null || (!period.equals("week") && !period.equals("month") && !period.equals("year"))) {
            errorResponse.put("status", "InvalidParam");
            errorResponse.put("statusCode", 400);
            return Response.status(Response.Status.BAD_REQUEST).entity(errorResponse.toString()).type(MediaType.APPLICATION_JSON).build();
        }

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

            JSONObject toReturn = layer.getSalesTopServices(companyId, period);
            return Response.status(Integer.parseInt(toReturn.get("statusCode").toString())).entity(toReturn.toString()).type(MediaType.APPLICATION_JSON).build();
        }

    }

    @GET
    @Path("getStaffServicesDetailed")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getStaffServicesDetailed(@HeaderParam("Authorization") String authHeader) {

        JSONObject errorResponse = new JSONObject();

        // Extract token from "Bearer <token>"
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("Missing or invalid Authorization header");
            return buildErrorResponse(401, "missingToken");
        }

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

            Integer companyId = JWT.getCompanyIdFromAccessToken(jwtToken);

            // Validation
            if (companyId == null || companyId <= 0) {
                errorResponse.put("status", "InvalidParam");
                errorResponse.put("statusCode", 400);
                return Response.status(Response.Status.BAD_REQUEST).entity(errorResponse.toString()).type(MediaType.APPLICATION_JSON).build();
            }

            String userRoles = JWT.getRolesFromAccessToken(jwtToken);
            boolean hasPermission = RoleChecker.hasAllRoles(userRoles, "client", "staff");

            Integer userId = JWT.getUserIdFromAccessToken(jwtToken);

            if (!hasPermission) {
                return buildErrorResponse(403, "forbidden");
            }

            JSONObject toReturn = layer.getStaffServicesDetailed(userId, companyId);
            return Response.status(Integer.parseInt(toReturn.get("statusCode").toString())).entity(toReturn.toString()).type(MediaType.APPLICATION_JSON).build();
        }

    }

    @GET
    @Path("getStaffServices")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getServicesByCompanyIdForStaff(@HeaderParam("Authorization") String authHeader) {

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
        Integer companyId = JWT.getCompanyIdFromAccessToken(jwtToken);

        JSONObject toReturn = layer.getServicesByCompanyIdForStaff(userId, companyId);

        return Response.status(Integer.parseInt(toReturn.get("statusCode").toString())).entity(toReturn.toString()).type(MediaType.APPLICATION_JSON).build();
    }

    @PUT
    @Path("updateStaffServices")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response updateStaffService(@HeaderParam("Authorization") String authHeader, String body) {

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

        if (!bodyObj.has("serviceId") || bodyObj.isNull("serviceId") || !bodyObj.has("isAssigned") || bodyObj.isNull("isAssigned")) {
            return buildErrorResponse(400, "missingFields");
        }

        Integer serviceId = bodyObj.getInt("serviceId");
        Boolean isAssigned = bodyObj.getBoolean("isAssigned");

        Integer userId = JWT.getUserIdFromAccessToken(jwtToken);
        Integer companyId = JWT.getCompanyIdFromAccessToken(jwtToken);

        // service company check
        Services s = Services.getServiceShort(serviceId);
        if (s == null) {
            return buildErrorResponse(404, "ServiceNotFound");
        }
        if (!s.getCompanyIdInt().equals(companyId)) {
            return buildErrorResponse(403, "Forbidden");
        }

        JSONObject toReturn = layer.updateStaffService(userId, serviceId, isAssigned);

        return Response.status(Integer.parseInt(toReturn.get("statusCode").toString())).entity(toReturn.toString()).type(MediaType.APPLICATION_JSON).build();
    }

    @POST
    @Path("createService")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response createService(@HeaderParam("Authorization") String authHeader, String body) {

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
        boolean hasPermission = RoleChecker.hasAllRoles(userRoles, "client", "owner")
                || RoleChecker.hasAllRoles(userRoles, "client", "superadmin");
        if (!hasPermission) {
            return buildErrorResponse(403, "forbidden");
        }

        Integer companyId = JWT.getCompanyIdFromAccessToken(jwtToken);

        JSONObject bodyObj = new JSONObject(body);

        if (!bodyObj.has("name") || bodyObj.isNull("name") || bodyObj.getString("name").trim().isEmpty()) {
            return buildErrorResponse(400, "missingFields");
        }
        if (!bodyObj.has("durationMinutes") || bodyObj.isNull("durationMinutes")) {
            return buildErrorResponse(400, "missingFields");
        }
        if (!bodyObj.has("price") || bodyObj.isNull("price")) {
            return buildErrorResponse(400, "missingFields");
        }
        if (!bodyObj.has("categoryId") || bodyObj.isNull("categoryId")) {
            return buildErrorResponse(400, "missingFields");
        }

        String name = bodyObj.getString("name").trim();
        String description = bodyObj.optString("description", null);
        Integer durationMinutes = bodyObj.getInt("durationMinutes");
        Double price = bodyObj.getDouble("price");
        Integer categoryId = bodyObj.getInt("categoryId");
        Boolean isActive = bodyObj.optBoolean("isActive", true);

        JSONObject toReturn = layer.createService(companyId, name, description,
                durationMinutes, price, categoryId, isActive);

        return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                .entity(toReturn.toString())
                .type(MediaType.APPLICATION_JSON)
                .build();
    }
}
