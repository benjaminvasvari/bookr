/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/WebServices/GenericResource.java to edit this template
 */
package com.vizsgaremek.bookr.controller;

import com.vizsgaremek.bookr.security.JWT;
import com.vizsgaremek.bookr.service.FavoritesService;
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
import javax.ws.rs.PathParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.json.JSONObject;

/**
 * REST Web Service
 *
 * @author vben
 */
@Path("favorites")
public class FavoritesController {

    private FavoritesService layer = new FavoritesService();
    private RoleChecker RoleChecker = new RoleChecker();

    @Context
    private UriInfo context;

    /**
     * Creates a new instance of FavoritesController
     */
    public FavoritesController() {
    }

    /**
     * Retrieves representation of an instance of
     * com.vizsgaremek.bookr.controller.FavoritesController
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
     * PUT method for updating or creating an instance of FavoritesController
     *
     * @param content representation for the resource
     */
    @PUT
    @Consumes(MediaType.APPLICATION_XML)
    public void putXml(String content) {
    }

    /**
     * Helper metódus az egységes hiba válaszok készítéséhez
     *
     * @param statusCode HTTP status kód
     * @param status Hibaüzenet/státusz
     * @return Response objektum JSON formátumban
     */
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
    @Path("getFavorites")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response getUserFavorites(@HeaderParam("Authorization") String authHeader) {

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

            JSONObject toReturn = layer.getUserFavorites(jwtToken);
            return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                    .entity(toReturn.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }

    @POST
    @Path("addFavorite/{companyId}")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response addFavorite(@PathParam("companyId") Integer companyId, @HeaderParam("Authorization") String authHeader) {

        // Extract token from "Bearer <token>"
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("Missing or invalid Authorization header");
            return buildErrorResponse(401, "missingToken");
        }

        if (companyId <= 0) {
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

            boolean hasPermission = RoleChecker.hasAnyRole(userRoles, "client");

            if (!hasPermission) {
                return buildErrorResponse(403, "forbidden");
            }

            JSONObject toReturn = layer.addFavorite(jwtToken, companyId);
            return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                    .entity(toReturn.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }

    @DELETE
    @Path("removeFavorite/{companyId}")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response removeFavorite(@PathParam("companyId") Integer companyId, @HeaderParam("Authorization") String authHeader) {

        // Extract token from "Bearer <token>"
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("Missing or invalid Authorization header");
            return buildErrorResponse(401, "missingToken");
        }

        if (companyId <= 0) {
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

            boolean hasPermission = RoleChecker.hasAnyRole(userRoles, "client");

            if (!hasPermission) {
                return buildErrorResponse(403, "forbidden");
            }

            JSONObject toReturn = layer.removeFavorite(jwtToken, companyId);
            return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                    .entity(toReturn.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }
}
