/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/WebServices/GenericResource.java to edit this template
 */
package com.vizsgaremek.bookr.controller;

import com.vizsgaremek.bookr.model.Users;
import com.vizsgaremek.bookr.security.JWT;
import com.vizsgaremek.bookr.service.AuthService;
import com.vizsgaremek.bookr.util.RoleChecker;
import javax.inject.Inject;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.UriInfo;
import javax.ws.rs.Consumes;
import javax.ws.rs.Produces;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PUT;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * REST Web Service
 *
 * @author vben
 */
@Path("auth")
public class AuthController {

    private AuthService layer = new AuthService();
    private RoleChecker RoleChecker = new RoleChecker();

    @Context
    private UriInfo context;

    /**
     * Creates a new instance of AuthController
     */
    public AuthController() {
    }

    /**
     * Retrieves representation of an instance of
     * com.vizsgaremek.bookr.controller.AuthController
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
     * PUT method for updating or creating an instance of AuthController
     *
     * @param content representation for the resource
     */
    @PUT
    @Consumes(MediaType.APPLICATION_XML)
    public void putXml(String content) {
    }

    @Inject
    private AuthService authService;

    private Response buildErrorResponse(int statusCode, String status) {
        JSONObject errorResponse = new JSONObject();
        errorResponse.put("statusCode", statusCode);
        errorResponse.put("status", status);

        return Response.status(statusCode)
                .entity(errorResponse.toString())
                .type(MediaType.APPLICATION_JSON)
                .build();
    }

    @POST
    @Path("register")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response clientRegister(String body) {
        JSONObject bodyObject = new JSONObject(body);

        Users clientRegistered = new Users(
                bodyObject.getString("firstName"),
                bodyObject.getString("lastName"),
                bodyObject.getString("email"),
                bodyObject.getString("password"),
                bodyObject.getString("phone")
        );

        JSONObject toReturn = layer.clientRegister(clientRegistered);

        return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                .entity(toReturn.toString())
                .type(MediaType.APPLICATION_JSON)
                .build();
    }

    @POST
    @Path("registerStaff")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response staffRegister(String body) {
        JSONObject bodyObject = new JSONObject(body);

        Users staffRegistered = new Users(
                bodyObject.getString("firstName"),
                bodyObject.getString("lastName"),
                bodyObject.getString("email"),
                bodyObject.getString("password"),
                bodyObject.getString("phone")
        );

        JSONObject toReturn = layer.staffRegister(staffRegistered);

        return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                .entity(toReturn.toString())
                .type(MediaType.APPLICATION_JSON)
                .build();
    }

    @POST
    @Path("login")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response login(String body) {
        JSONObject bodyObject = new JSONObject(body);

        Users loginUser = new Users(
                bodyObject.getString("email"),
                bodyObject.getString("password")
        );

        JSONObject toReturn = layer.login(loginUser);

        return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                .entity(toReturn.toString())
                .type(MediaType.APPLICATION_JSON)
                .build();
    }

    @POST
    @Path("verify")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response verifyEmail(String body) {
        try {
            JSONObject bodyObject = new JSONObject(body);
            String verifyToken = bodyObject.getString("token");

            // Service layer hívás - email verification
            JSONObject toReturn = layer.verifyEmail(verifyToken);

            return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                    .entity(toReturn.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();

        } catch (JSONException ex) {
            JSONObject error = new JSONObject();
            error.put("status", "error");
            error.put("statusCode", 400);
            error.put("message", "Invalid request format");

            return Response.status(400)
                    .entity(error.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }

    @POST
    @Path("refresh")
    @Produces(MediaType.APPLICATION_JSON)
    public Response refresh(String body) {
        try {
            JSONObject bodyObject = new JSONObject(body);
            String refreshToken = bodyObject.getString("refresh_token");

            JSONObject toReturn = layer.refreshTokens(refreshToken);

            return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                    .entity(toReturn.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();

        } catch (JSONException ex) {
            JSONObject error = new JSONObject();
            error.put("status", "error");
            error.put("statusCode", 400);
            error.put("message", "Invalid request format");

            return Response.status(400)
                    .entity(error.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }

    @POST
    @Path("logout")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response logout(
            @HeaderParam("Authorization") String authHeader) {

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

            JSONObject toReturn = layer.logout(jwtToken);
            return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                    .entity(toReturn.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }

    @POST
    @Path("resetPassRequest")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response resetPassRequest(@HeaderParam("Authorization") String authHeader, String body) {
        JSONObject bodyObject = new JSONObject(body);

        // Extract token from "Bearer <token>"
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("Missing or invalid Authorization header");
            return Response.status(401).entity("missingToken").build();
        }

        // Remove "Bearer " prefix
        String jwtToken = authHeader.substring(7);

        Boolean validJwt = JWT.validateAccessToken(jwtToken);

        String passString = bodyObject.getString("currentPassword");

        if (validJwt == null) {
            // Lejárt JWT
            return Response.status(401).entity("tokenExpired").build();
        } else if (validJwt == false) {
            // Invalid JWT
            return Response.status(401).entity("invalidToken").build();
        } else {
            // Valid token
            JSONObject toReturn = layer.changePasswordEmail(passString, jwtToken);
            return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                    .entity(toReturn.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }

    @POST
    @Path("resetPassUpdate")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response resetPassUpdate(@HeaderParam("Authorization") String authHeader, String body) {
        JSONObject bodyObject = new JSONObject(body);

        // Extract token from "Bearer <token>"
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("Missing or invalid Authorization header");
            return Response.status(401).entity("missingToken").build();
        }

        // Remove "Bearer " prefix
        String jwtToken = authHeader.substring(7);

        Boolean validJwt = JWT.validateAccessToken(jwtToken);

        String passString = bodyObject.getString("password");
        String token = bodyObject.getString("token");

        if (validJwt == null) {
            // Lejárt JWT
            return Response.status(401).entity("tokenExpired").build();
        } else if (validJwt == false) {
            // Invalid JWT
            return Response.status(401).entity("invalidToken").build();
        } else {
            // Valid token
            JSONObject toReturn = layer.resetPassUpdate(passString, token, jwtToken);
            return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                    .entity(toReturn.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }
}
