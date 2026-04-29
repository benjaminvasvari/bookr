/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/WebServices/GenericResource.java to edit this template
 */
package com.vizsgaremek.bookr.controller;

import com.vizsgaremek.bookr.security.JWT;
import com.vizsgaremek.bookr.service.ServiceCategoryService;

import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.UriInfo;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import com.vizsgaremek.bookr.util.RoleChecker;
import org.json.JSONArray;
import org.json.JSONObject;

import static com.vizsgaremek.bookr.util.ErrorResponseBuilder.buildErrorResponse;

/**
 * REST Web Service
 *
 * @author vben
 */
@Path("serviceCategory")
public class ServiceCategoryController {

    private ServiceCategoryService layer = new ServiceCategoryService();
    private RoleChecker RoleChecker = new RoleChecker();

    @Context
    private UriInfo context;

    /**
     * Creates a new instance of ServiceCategoryController
     */
    public ServiceCategoryController() {
    }

    /**
     * Retrieves representation of an instance of
     * com.vizsgaremek.bookr.controller.ServiceCategoryController
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
     * ServiceCategoryController
     *
     * @param content representation for the resource
     */
    @PUT
    @Consumes(MediaType.APPLICATION_XML)
    public void putXml(String content) {
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("getServiceCategoriesWithServicesByCompanyId")
    public Response getServiceCategoriesWithServicesByCompanyId(@QueryParam("id") Integer id) {
        try {
            // Service réteg továbbra is JSONArray-t ad vissza
            JSONArray categories = layer.getServiceCategoriesWithServicesByCompanyId(id);

            // Becsomagoljuk JSONObject-be
            JSONObject response = new JSONObject();

            if (categories != null) {
                response.put("statusCode", 200);
                response.put("message", "Categories retrieved successfully");
                response.put("data", categories);
            } else {
                response.put("statusCode", 404);
                response.put("message", "Company not found");
                response.put("data", new JSONArray());
            }

            return Response
                    .status(response.getInt("statusCode"))
                    .entity(response.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();

        } catch (Exception e) {
            e.printStackTrace();

            JSONObject errorResponse = new JSONObject();
            errorResponse.put("statusCode", 500);
            errorResponse.put("message", "Internal server error: " + e.getMessage());
            errorResponse.put("data", new JSONArray());

            return Response
                    .status(500)
                    .entity(errorResponse.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }

    @POST
    @Path("createServiceCategory")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response createServiceCategory(@HeaderParam("Authorization") String authHeader, String body) {

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

        String name = bodyObj.getString("name").trim();
        String description = bodyObj.optString("description", null);

        JSONObject toReturn = layer.createServiceCategory(companyId, name, description);

        return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                .entity(toReturn.toString())
                .type(MediaType.APPLICATION_JSON)
                .build();
    }
}
