/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/WebServices/GenericResource.java to edit this template
 */
package com.vizsgaremek.bookr.controller;

import com.vizsgaremek.bookr.security.JWT;
import com.vizsgaremek.bookr.service.CompaniesService;
import com.vizsgaremek.bookr.service.DashboardsService;
import static com.vizsgaremek.bookr.util.ErrorResponseBuilder.buildErrorResponse;
import com.vizsgaremek.bookr.util.RoleChecker;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.UriInfo;
import javax.ws.rs.Produces;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
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
@Path("dashboards")
public class DashboardsController {

    private RoleChecker RoleChecker = new RoleChecker();
    private CompaniesService CompaniesService = new CompaniesService();
    private DashboardsService layer = new DashboardsService();

    @Context
    private UriInfo context;

    /**
     * Creates a new instance of OwnerDashboardController
     */
    public DashboardsController() {
    }

    /**
     * Retrieves representation of an instance of
 com.vizsgaremek.bookr.controller.DashboardsController
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
 DashboardsController
     *
     * @param content representation for the resource
     */
    @PUT
    @Consumes(MediaType.APPLICATION_XML)
    public void putXml(String content) {
    }

    @GET
    @Path("owner")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response getOwnerDashboard(@HeaderParam("Authorization") String authHeader) {

        // 1. Auth header check
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

        // 3. Role check
        String userRoles = JWT.getRolesFromAccessToken(jwtToken);
        boolean hasPermission = RoleChecker.hasAllRoles(userRoles, "client", "owner");
        if (!hasPermission) {
            return buildErrorResponse(403, "forbidden");
        }

        // 4. Kötelező mezők validálása
        Integer userCompanyId = JWT.getCompanyIdFromAccessToken(jwtToken);

        if (userCompanyId == null || userCompanyId <= 0) {
            return buildErrorResponse(400, "invalidCompany");
        }

        Boolean isCompanyExist = CompaniesService.validateCompanyExist(userCompanyId);

        if (!isCompanyExist) {
            return buildErrorResponse(400, "CompanyNotExist");
        } else if (isCompanyExist == null) {
            return buildErrorResponse(500, "InternalServerError");
        }

        JSONObject toReturn = layer.getOwnerDashboard(jwtToken);

        return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                .entity(toReturn.toString())
                .type(MediaType.APPLICATION_JSON)
                .build();
    }

}
