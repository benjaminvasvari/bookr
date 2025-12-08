/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/WebServices/GenericResource.java to edit this template
 */
package com.vizsgaremek.bookr.controller;

import com.vizsgaremek.bookr.service.CompaniesService;
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
import org.json.JSONObject;

/**
 * REST Web Service
 *
 * @author vben
 */
@Path("companies")
public class CompaniesController {

    private CompaniesService layer = new CompaniesService();

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
}
