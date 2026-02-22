/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/WebServices/GenericResource.java to edit this template
 */
package com.vizsgaremek.bookr.controller;

import com.vizsgaremek.bookr.DTO.CompanyRegisterRequest;
import com.vizsgaremek.bookr.security.JWT;
import com.vizsgaremek.bookr.service.CompaniesService;
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
@Path("companies")
public class CompaniesController {

    private CompaniesService layer = new CompaniesService();
    private RoleChecker RoleChecker = new RoleChecker();

    @Context
    private UriInfo context;

    /**
     * Creates a new instance of CompaniesController
     */
    public CompaniesController() {
    }

    /**
     * Retrieves representation of an instance of
     * com.vizsgaremek.bookr.controller.CompaniesController
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
     * PUT method for updating or creating an instance of CompaniesController
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
    @Path("loadCompanyById")
    @Produces(MediaType.APPLICATION_JSON)
    public Response loadCompanyById(@QueryParam("id") Integer id) {
        JSONObject toReturn = layer.loadCompanyById(id);

        // Ellenőrizzük: van-e statusCode (hiba)?
        if (toReturn.has("statusCode")) {
            // HIBA VÁLASZ
            int statusCode = toReturn.getInt("statusCode");
            return Response.status(statusCode)
                    .entity(toReturn.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        } else {
            // SIKERES VÁLASZ (200 OK)
            return Response.ok(toReturn.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("top")
    public Response getTopRecommendations(@QueryParam("limit") Integer limit) {
        JSONObject toReturn = layer.getTopRecommendations(limit);

        return Response.status(Integer.parseInt(toReturn.get("statusCode").toString())).entity(toReturn.toString()).type(MediaType.APPLICATION_JSON).build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("new")
    public Response getNewCompanies(@QueryParam("limit") Integer limit) {
        JSONObject toReturn = layer.getNewCompanies(limit);

        return Response.status(Integer.parseInt(toReturn.get("statusCode").toString())).entity(toReturn.toString()).type(MediaType.APPLICATION_JSON).build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("featured")
    public Response getFeaturedCompanies(@QueryParam("limit") Integer limit) {
        JSONObject toReturn = layer.getFeaturedCompanies(limit);

        return Response.status(Integer.parseInt(toReturn.get("statusCode").toString())).entity(toReturn.toString()).type(MediaType.APPLICATION_JSON).build();
    }

    @GET
    @Path("short")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getCompanyShort(@QueryParam("id") Integer id) {
        JSONObject toReturn = layer.getCompanyShort(id);

        // Ellenőrizzük: van-e statusCode (hiba)?
        if (toReturn.has("statusCode")) {
            // HIBA VÁLASZ
            int statusCode = toReturn.getInt("statusCode");
            return Response.status(statusCode)
                    .entity(toReturn.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        } else {
            // SIKERES VÁLASZ (200 OK)
            return Response.ok(toReturn.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }

    @POST
    @Path("createFull")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response createFull(@HeaderParam("Authorization") String authHeader, CompanyRegisterRequest request) {

        
        // 1. Auth header check
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return buildErrorResponse(401, "missingToken");
        }
        
        // 2. Request body check
        if (request == null) {
            return buildErrorResponse(400, "missingBody");
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
        boolean hasPermission = RoleChecker.hasAnyRole(userRoles, "client");
        if (!hasPermission) {
            return buildErrorResponse(403, "forbidden");
        }

        // 4. Kötelező mezők validálása
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            return buildErrorResponse(400, "companyNameRequired");
        }
        if (request.getBusinessCategoryId() == null) {
            return buildErrorResponse(400, "businessCategoryRequired");
        }
        if (request.getOpeningHours() == null || request.getOpeningHours().isEmpty()) {
            return buildErrorResponse(400, "openingHoursRequired");
        }

        // 5. Service hívás
        JSONObject toReturn = layer.createFull(jwtToken, request);

        return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                .entity(toReturn.toString())
                .type(MediaType.APPLICATION_JSON)
                .build();
    }

}
