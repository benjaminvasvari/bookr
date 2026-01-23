/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/WebServices/GenericResource.java to edit this template
 */
package com.vizsgaremek.bookr.controller;

import com.vizsgaremek.bookr.security.JWT;
import com.vizsgaremek.bookr.service.ImagesService;
import com.vizsgaremek.bookr.util.RoleChecker;
import java.io.InputStream;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.UriInfo;
import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.Produces;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PUT;
import javax.ws.rs.PathParam;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.HttpHeaders;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.glassfish.jersey.media.multipart.FormDataParam;
import org.json.JSONObject;

/**
 * REST Web Service
 *
 * @author vben
 */
@Path("images")
public class ImagesController {

    private ImagesService layer = new ImagesService();

    private RoleChecker RoleChecker = new RoleChecker();

    @Context
    private UriInfo context;

    /**
     * Creates a new instance of ImagesController
     */
    public ImagesController() {
    }

    /**
     * Retrieves representation of an instance of
     * com.vizsgaremek.bookr.controller.ImagesController
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
     * PUT method for updating or creating an instance of ImagesController
     *
     * @param content representation for the resource
     */
    @PUT
    @Consumes(MediaType.APPLICATION_XML)
    public void putXml(String content) {
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("getCompanyImages")
    public Response getCompanyImages(@QueryParam("companyId") Integer id) {
        JSONObject toReturn = layer.getCompanyImages(id);

        return Response.status(Integer.parseInt(toReturn.get("statusCode").toString())).entity(toReturn.toString()).type(MediaType.APPLICATION_JSON).build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("getUserProfilePicture")
    public Response getUserProfilePicture(@QueryParam("userId") Integer id) {
        JSONObject toReturn = layer.getUserProfilePicture(id);

        return Response.status(Integer.parseInt(toReturn.get("statusCode").toString())).entity(toReturn.toString()).type(MediaType.APPLICATION_JSON).build();
    }

    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("companies/{companyId}")
    public Response uploadCompanyImage(
            @PathParam("companyId") Integer companyId,
            @FormDataParam("file") InputStream uploadedInputStream,
            @FormDataParam("file") FormDataContentDisposition fileDetail,
            @FormDataParam("isMain") boolean isMain,
            @HeaderParam("Authorization") String authHeader) {

        // Extract token from "Bearer <token>"
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("Missing or invalid Authorization header");
            return Response.status(401).entity("missingToken").build();
        }

        if (companyId == null || companyId <= 0) {
            return Response.status(422).entity("InvalidParamValue").build();
        }

        // Remove "Bearer " prefix
        String jwtToken = authHeader.substring(7);

        Boolean validJwt = JWT.validateAccessToken(jwtToken);

        if (validJwt == null) {
            // Lejárt JWT
            return Response.status(401).entity("tokenExpired").build();
        } else if (validJwt == false) {
            // Invalid JWT
            return Response.status(401).entity("invalidToken").build();
        } else {
            // Valid token

            String userRoles = JWT.getRolesFromAccessToken(jwtToken);

            boolean hasPermission = RoleChecker.hasAnyRole(userRoles, "owner", "superadmin");

            if (!hasPermission) {
                return Response.status(403).entity("Forbidden").build();

            }

            if (uploadedInputStream == null || fileDetail == null) {
                return Response.status(Response.Status.BAD_REQUEST).entity("missingFile").build();
            }

            JSONObject toReturn = layer.uploadCompanyImage(
                    companyId,
                    fileDetail.getFileName(),
                    fileDetail.getSize(),
                    fileDetail.getType(),
                    uploadedInputStream,
                    isMain
            );

            return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                    .entity(toReturn.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }
}
