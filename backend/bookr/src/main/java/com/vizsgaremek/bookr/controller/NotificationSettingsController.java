/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/WebServices/GenericResource.java to edit this template
 */
package com.vizsgaremek.bookr.controller;

import com.vizsgaremek.bookr.model.NotificationSettings;
import com.vizsgaremek.bookr.security.JWT;
import com.vizsgaremek.bookr.service.NotificationSettingsService;
import com.vizsgaremek.bookr.util.RoleChecker;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.UriInfo;
import javax.ws.rs.Consumes;
import javax.ws.rs.Produces;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.Path;
import javax.ws.rs.PUT;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.json.JSONObject;

/**
 * REST Web Service
 *
 * @author vben
 */
@Path("notifsetting")
public class NotificationSettingsController {

    private NotificationSettingsService layer = new NotificationSettingsService();
    private RoleChecker RoleChecker = new RoleChecker();

    @Context
    private UriInfo context;

    /**
     * Creates a new instance of NotificationSettingsController
     */
    public NotificationSettingsController() {
    }

    /**
     * Retrieves representation of an instance of
     * com.vizsgaremek.bookr.controller.NotificationSettingsController
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
     * NotificationSettingsController
     *
     * @param content representation for the resource
     */
    @PUT
    @Consumes(MediaType.APPLICATION_XML)
    public void putXml(String content) {
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
    @Path("getAll")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response getAllNotificationSettings(@HeaderParam("Authorization") String authHeader) {

        // Extract token from "Bearer <token>"
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("Missing or invalid Authorization header");
            return buildErrorResponse(401, "missingToken");
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
            Integer userId = JWT.getUserIdFromAccessToken(jwtToken);

            boolean hasPermission = RoleChecker.hasAnyRole(userRoles, "client");

            if (!hasPermission) {
                return buildErrorResponse(403, "forbidden");
            }

            JSONObject toReturn = layer.getAllNotificationSettings(userId);
            return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                    .entity(toReturn.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }

    @PUT
    @Path("update")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response updateNotificationSettings(String body, @HeaderParam("Authorization") String authHeader) {
        JSONObject bodyObject = new JSONObject(body);

        // Extract token from "Bearer <token>"
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("Missing or invalid Authorization header");
            return buildErrorResponse(401, "missingToken");
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

            boolean hasPermission = RoleChecker.hasAnyRole(userRoles, "client");

            if (!hasPermission) {
                return buildErrorResponse(403, "forbidden");
            }

            NotificationSettings updatedNotif = new NotificationSettings(
                    bodyObject.getInt("id"), 
                    bodyObject.getBoolean("confirm"),
                    bodyObject.getBoolean("reminder"),
                    bodyObject.getBoolean("cancel"),
                    bodyObject.getBoolean("marketing")
            );

            JSONObject toReturn = layer.updateNotificationSettings(updatedNotif);
            return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                    .entity(toReturn.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }
}
