/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/WebServices/GenericResource.java to edit this template
 */
package com.vizsgaremek.bookr.controller;

import com.vizsgaremek.bookr.DTO.OwnerPanelDTO.OwnerReviewsRequest;
import com.vizsgaremek.bookr.security.JWT;
import com.vizsgaremek.bookr.service.ReviewsService;
import static com.vizsgaremek.bookr.util.ErrorResponseBuilder.buildErrorResponse;
import com.vizsgaremek.bookr.util.RoleChecker;
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
@Path("reviews")
public class ReviewsController {

    private ReviewsService layer = new ReviewsService();
    private RoleChecker RoleChecker = new RoleChecker();

    @Context
    private UriInfo context;

    /**
     * Creates a new instance of ReviewsController
     */
    public ReviewsController() {
    }

    /**
     * Retrieves representation of an instance of
     * com.vizsgaremek.bookr.controller.ReviewsController
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
     * PUT method for updating or creating an instance of ReviewsController
     *
     * @param content representation for the resource
     */
    @PUT
    @Consumes(MediaType.APPLICATION_XML)
    public void putXml(String content) {
    }

    @GET
    @Path("getOwnerPanelReviews")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getOwnerPanelReviews(@HeaderParam("Authorization") String authHeader, @QueryParam("companyId") Integer companyId, String body) {
        JSONObject bodyObject = new JSONObject(body);
        JSONObject errorResponse = new JSONObject();

        // Extract token from "Bearer <token>"
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("Missing or invalid Authorization header");
            return buildErrorResponse(401, "missingToken");
        }

        // Validation
        if (companyId == null || companyId <= 0) {
            errorResponse.put("status", "InvalidParam");
            errorResponse.put("statusCode", 400);
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(errorResponse.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
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
            String userRoles = JWT.getRolesFromAccessToken(jwtToken);
            boolean hasPermission = RoleChecker.hasAllRoles(userRoles, "client", "owner") || RoleChecker.hasAllRoles(userRoles, "client", "superadmin");

            if (!hasPermission) {
                return buildErrorResponse(403, "forbidden");
            }

            if (bodyObject.getString("sortBy") == null || (!bodyObject.getString("sortBy").equals("newest") && !bodyObject.getString("sortBy").equals("oldest") && !bodyObject.getString("sortBy").equals("highest") && !bodyObject.getString("sortBy").equals("lowest"))) {
                errorResponse.put("status", "InvalidCredentials");
                errorResponse.put("statusCode", 400);
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(errorResponse.toString())
                        .type(MediaType.APPLICATION_JSON)
                        .build();
            }

            OwnerReviewsRequest request = new OwnerReviewsRequest(
                    bodyObject.isNull("search") ? null : bodyObject.getString("search"),
                    bodyObject.isNull("ratingFilter") ? null : bodyObject.getString("ratingFilter"),
                    bodyObject.getString("sortBy"),
                    bodyObject.getInt("page"),
                    bodyObject.getInt("pageSize")
            );

            JSONObject toReturn = layer.getOwnerReviews(companyId, request);
            return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                    .entity(toReturn.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }

    }
}
