/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/WebServices/GenericResource.java to edit this template
 */
package com.vizsgaremek.bookr.controller;

import com.vizsgaremek.bookr.model.Users;
import com.vizsgaremek.bookr.service.AuthService;
import javax.inject.Inject;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.UriInfo;
import javax.ws.rs.Consumes;
import javax.ws.rs.Produces;
import javax.ws.rs.GET;
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

        JSONObject toReturn = authService.clientRegister(clientRegistered);

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

        JSONObject toReturn = authService.staffRegister(staffRegistered);

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

        JSONObject toReturn = authService.login(loginUser);

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
            JSONObject toReturn = authService.verifyEmail(verifyToken);

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
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response refresh(String body) {
        try {
            JSONObject bodyObject = new JSONObject(body);
            String refreshToken = bodyObject.getString("refresh_token");

            JSONObject toReturn = authService.refreshTokens(refreshToken);

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
    @Produces(MediaType.APPLICATION_JSON)
    public Response logout(String body) {
        JSONObject bodyObject = new JSONObject(body);

        // companyId nullable field kezelése
        Integer companyId = bodyObject.has("companyId") && !bodyObject.isNull("companyId")
                ? bodyObject.getInt("companyId")
                : null;

        Users loggedoutUser = new Users(
                bodyObject.getInt("id"),
                bodyObject.getString("email"),
                companyId // ← null-t is elfogad
        );

        JSONObject toReturn = authService.logout(loggedoutUser);
        return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                .entity(toReturn.toString())
                .type(MediaType.APPLICATION_JSON)
                .build();
    }
}
