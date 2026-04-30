/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/WebServices/GenericResource.java to edit this template
 */
package com.vizsgaremek.bookr.controller;

import com.vizsgaremek.bookr.DTO.OwnerPanelDTO.updateOpeningHoursDTO;
import com.vizsgaremek.bookr.security.JWT;
import com.vizsgaremek.bookr.service.CompaniesService;
import com.vizsgaremek.bookr.service.OpeningHoursService;
import static com.vizsgaremek.bookr.util.ErrorResponseBuilder.buildErrorResponse;
import com.vizsgaremek.bookr.util.RoleChecker;
import java.util.Objects;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.UriInfo;
import javax.ws.rs.Consumes;
import javax.ws.rs.Produces;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
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
@Path("openinghours")
public class OpeninghoursController {

    private OpeningHoursService layer = new OpeningHoursService();
    private RoleChecker RoleChecker = new RoleChecker();
    private CompaniesService CompaniesService = new CompaniesService();

    @Context
    private UriInfo context;

    /**
     * Creates a new instance of OpeninghoursController
     */
    public OpeninghoursController() {
    }

    /**
     * Retrieves representation of an instance of
     * com.vizsgaremek.bookr.controller.OpeninghoursController
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
     * PUT method for updating or creating an instance of OpeninghoursController
     *
     * @param content representation for the resource
     */
    @PUT
    @Consumes(MediaType.APPLICATION_XML)
    public void putXml(String content) {
    }

    @GET
    @Path("getForOwnerPanel")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response getForOwnerPanel(@HeaderParam("Authorization") String authHeader) {

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
            return buildErrorResponse(403, "Forbidden");
        }

        Integer userCompanyId = JWT.getCompanyIdFromAccessToken(jwtToken);

        Boolean isCompanyExist = CompaniesService.validateCompanyExist(userCompanyId);

        if (!isCompanyExist) {
            return buildErrorResponse(400, "CompanyNotExist");
        } else if (isCompanyExist == null) {
            return buildErrorResponse(500, "InternalServerError");
        }

        JSONObject toReturn = layer.getOpeningHours(userCompanyId);

        return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                .entity(toReturn.toString())
                .type(MediaType.APPLICATION_JSON)
                .build();
    }

    @PUT
    @Path("update")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response update(@HeaderParam("Authorization") String authHeader, updateOpeningHoursDTO request) {

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

        if (request == null) {
            return buildErrorResponse(400, "InvalidParam");
        }

        // 3. Role check
        String userRoles = JWT.getRolesFromAccessToken(jwtToken);
        boolean hasPermission = RoleChecker.hasAllRoles(userRoles, "client", "owner");
        if (!hasPermission) {
            return buildErrorResponse(403, "Forbidden");
        }

        Integer userCompanyId = JWT.getCompanyIdFromAccessToken(jwtToken);

        Boolean isCompanyExist = CompaniesService.validateCompanyExist(userCompanyId);

        if (!isCompanyExist) {
            return buildErrorResponse(400, "CompanyNotExist");
        } else if (isCompanyExist == null) {
            return buildErrorResponse(500, "InternalServerError");
        }

        JSONObject toReturn = layer.updateOpeningHours(userCompanyId, request);

        return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                .entity(toReturn.toString())
                .type(MediaType.APPLICATION_JSON)
                .build();
    }
}
