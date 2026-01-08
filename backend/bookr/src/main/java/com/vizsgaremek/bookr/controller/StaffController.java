/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/WebServices/GenericResource.java to edit this template
 */
package com.vizsgaremek.bookr.controller;

import com.vizsgaremek.bookr.service.StaffService;
import java.util.ArrayList;
import java.util.List;
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
@Path("staff")
public class StaffController {

    @Context
    private UriInfo context;

    private StaffService layer = new StaffService();

    /**
     * Creates a new instance of StaffController
     */
    public StaffController() {
    }

    /**
     * Retrieves representation of an instance of
     * com.vizsgaremek.bookr.controller.StaffController
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
     * PUT method for updating or creating an instance of StaffController
     *
     * @param content representation for the resource
     */
    @PUT
    @Consumes(MediaType.APPLICATION_XML)
    public void putXml(String content) {
    }

    @GET
    @Path("by-company-and-services")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getStaffByCompanyAndServices(@QueryParam("companyId") int companyId,
            @QueryParam("serviceIds") String serviceIds) {
        JSONObject toReturn = new JSONObject();

        try {

            // Validation
            if (companyId <= 0) {
                toReturn.put("message", "Invalid companyId");
                toReturn.put("statusCode", 400);
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(toReturn.toString())
                        .type(MediaType.APPLICATION_JSON)
                        .build();
            }

            if (serviceIds == null || serviceIds.isEmpty() || serviceIds.trim().isEmpty()) {
                toReturn.put("message", "At least one serviceId is required");
                toReturn.put("statusCode", 400);
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(toReturn.toString())
                        .type(MediaType.APPLICATION_JSON)
                        .build();
            }

            // Staff lekérdezés service layer-ből
            toReturn = layer.getFilteredStaffByServices(companyId, serviceIds);

            return Response.ok(toReturn.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();

        } catch (NumberFormatException e) {
            toReturn.put("message", "Invalid serviceIds format");
            toReturn.put("statusCode", 400);
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(toReturn.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();

        } catch (Exception e) {
            e.printStackTrace();
            toReturn.put("message", "Internal server error: " + e.getMessage());
            toReturn.put("statusCode", 500);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(toReturn.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }
}
