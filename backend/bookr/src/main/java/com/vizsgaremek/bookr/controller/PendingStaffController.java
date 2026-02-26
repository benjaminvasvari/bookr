/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/WebServices/GenericResource.java to edit this template
 */
package com.vizsgaremek.bookr.controller;

import com.vizsgaremek.bookr.model.PendingStaff;
import com.vizsgaremek.bookr.security.JWT;
import com.vizsgaremek.bookr.service.PendingStaffService;
import static com.vizsgaremek.bookr.util.ErrorResponseBuilder.buildErrorResponse;
import com.vizsgaremek.bookr.util.RoleChecker;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.UriInfo;
import javax.ws.rs.Consumes;
import javax.ws.rs.Produces;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PUT;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import jdk.vm.ci.code.InvalidInstalledCodeException;
import org.json.JSONObject;

/**
 * REST Web Service
 *
 * @author vben
 */
@Path("pending-staff")
public class PendingStaffController {

    private PendingStaffService layer = new PendingStaffService();
    private RoleChecker RoleChecker = new RoleChecker();

    @Context
    private UriInfo context;

    /**
     * Creates a new instance of PendingStaffController
     */
    public PendingStaffController() {
    }

    /**
     * Retrieves representation of an instance of
     * com.vizsgaremek.bookr.controller.PendingStaffController
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
     * PUT method for updating or creating an instance of PendingStaffController
     *
     * @param content representation for the resource
     */
    @PUT
    @Consumes(MediaType.APPLICATION_XML)
    public void putXml(String content) {
    }

    @POST
    @Path("invite")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response invite(@HeaderParam("Authorization") String authHeader, String body) {

        JSONObject bodyObject = new JSONObject(body);

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
                return buildErrorResponse(400, "InvalidCompany");
            }

            String userRoles = JWT.getRolesFromAccessToken(jwtToken);
            boolean hasPermission = RoleChecker.hasAllRoles(userRoles, "client", "owner");

            if (!hasPermission) {
                return buildErrorResponse(403, "forbidden");
            }

            PendingStaff invitedStaff = new PendingStaff(
                    bodyObject.getString("email"),
                    bodyObject.getString("position")
            );

            JSONObject toReturn = layer.inviteStaff(companyId, invitedStaff, jwtToken);
            return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                    .entity(toReturn.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }

    }

    @GET
    @Path("checkInvite")
    @Produces(MediaType.APPLICATION_JSON)
    public Response checkInvite(String token) {

        if (token == null) {
            return buildErrorResponse(400, "InvalidParam");
        } else {

            JSONObject toReturn = layer.checkInvite(token);
            return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                    .entity(toReturn.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }

    }

    @PUT
    @Path("accept")
    @Produces(MediaType.APPLICATION_JSON)
    public Response acceptInvite(String body) {
        JSONObject bodyObj = new JSONObject(body);
        
        String token = bodyObj.getString("token");

        if (token == null) {
            return buildErrorResponse(400, "InvalidParam");
        } else {

            JSONObject toReturn = layer.acceptInvite(token);
            return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                    .entity(toReturn.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }

    }
}
