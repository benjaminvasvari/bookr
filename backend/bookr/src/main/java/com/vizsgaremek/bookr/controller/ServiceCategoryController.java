/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/WebServices/GenericResource.java to edit this template
 */
package com.vizsgaremek.bookr.controller;

import com.vizsgaremek.bookr.service.ServiceCategoryService;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.UriInfo;
import javax.ws.rs.Produces;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PUT;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * REST Web Service
 *
 * @author vben
 */
@Path("services")
public class ServiceCategoryController {

    private ServiceCategoryService layer = new ServiceCategoryService();

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
    @Path("services")
    public Response getServiceCategoriesWithServicesByCompanyId(@QueryParam("companyId") Integer id) {
        try {
            // Service réteg továbbra is JSONArray-t ad vissza
            JSONArray categories = layer.getServiceCategoriesWithServicesByCompanyId(id);

            // Becsomagoljuk JSONObject-be
            JSONObject response = new JSONObject();

            if (categories != null && categories.length() > 0) {
                response.put("statusCode", 200);
                response.put("message", "Categories retrieved successfully");
                response.put("data", categories);
            } else {
                response.put("statusCode", 400);
                response.put("message", "InvalidParam");
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
}
