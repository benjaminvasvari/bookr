/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/WebServices/GenericResource.java to edit this template
 */
package com.vizsgaremek.bookr.controller;

import com.vizsgaremek.bookr.model.Users;
import com.vizsgaremek.bookr.service.UsersService;
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
import org.json.JSONObject;

/**
 * REST Web Service
 *
 * @author vben
 */
@Path("users")
public class UsersController {

    @Context
    private UriInfo context;
    
    private UsersService layer = new UsersService();

    /**
     * Creates a new instance of UserController
     */
    public UsersController() {
    }

    /**
     * Retrieves representation of an instance of com.vizsgaremek.bookr.controller.UserController
     * @return an instance of java.lang.String
     */
    @GET
    @Produces(MediaType.APPLICATION_XML)
    public String getXml() {
        //TODO return proper representation object
        throw new UnsupportedOperationException();
    }

    /**
     * PUT method for updating or creating an instance of UserController
     * @param content representation for the resource
     */
    @PUT
    @Consumes(MediaType.APPLICATION_XML)
    public void putXml(String content) {
    }
    
    // ------- MY CODE -------
    
    
    
    @POST
    @Path("registerClient")
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
}