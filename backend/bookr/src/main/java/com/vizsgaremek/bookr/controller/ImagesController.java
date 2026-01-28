package com.vizsgaremek.bookr.controller;

import com.vizsgaremek.bookr.security.JWT;
import com.vizsgaremek.bookr.service.ImagesService;
import com.vizsgaremek.bookr.util.RoleChecker;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.UriInfo;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.json.JSONObject;
import java.io.InputStream;
import org.apache.commons.fileupload.FileItemIterator;
import org.apache.commons.fileupload.FileItemStream;
import org.apache.commons.fileupload.servlet.ServletFileUpload;

/**
 *
 * @author vben
 */
@Path("images")
public class ImagesController {

    private ImagesService layer = new ImagesService();
    private RoleChecker RoleChecker = new RoleChecker();

    @Context
    private UriInfo context;

    public ImagesController() {
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
    @Produces(MediaType.APPLICATION_JSON)
    @Path("getCompanyImages")
    public Response getCompanyImages(@QueryParam("companyId") Integer id) {
        JSONObject toReturn = layer.getCompanyImages(id);
        return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                .entity(toReturn.toString())
                .type(MediaType.APPLICATION_JSON)
                .build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("getUserProfilePicture")
    public Response getUserProfilePicture(@QueryParam("userId") Integer id) {
        JSONObject toReturn = layer.getUserProfilePicture(id);
        return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                .entity(toReturn.toString())
                .type(MediaType.APPLICATION_JSON)
                .build();
    }

    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("companies/{companyId}")
    public Response uploadCompanyImage(
            @PathParam("companyId") Integer companyId,
            @Context HttpServletRequest request,
            @HeaderParam("Authorization") String authHeader) {

        try {

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return buildErrorResponse(401, "missingToken");
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

                boolean hasPermission = RoleChecker.hasAnyRole(userRoles, "owner", "superadmin");

                if (!hasPermission) {
                    return buildErrorResponse(403, "forbidden");
                }

                // Apache Commons FileUpload
                ServletFileUpload upload = new ServletFileUpload();
                FileItemIterator iterator = upload.getItemIterator(request);

                InputStream fileInputStream = null;
                String filename = null;
                String contentType = null;
                long fileSize = 0;
                boolean isMain = false;

                while (iterator.hasNext()) {
                    FileItemStream item = iterator.next();
                    String fieldName = item.getFieldName();

                    if (!item.isFormField()) {
                        // File field
                        filename = item.getName();
                        contentType = item.getContentType();
                        fileInputStream = item.openStream();

                        // Read to byte array to get size
                        byte[] fileBytes = org.apache.commons.io.IOUtils.toByteArray(fileInputStream);
                        fileSize = fileBytes.length;
                        fileInputStream = new java.io.ByteArrayInputStream(fileBytes);

                        System.out.println("File: " + filename + ", size: " + fileSize);

                    } else {
                        // Form field
                        if ("isMain".equals(fieldName)) {
                            String value = org.apache.commons.io.IOUtils.toString(
                                    item.openStream(), "UTF-8"
                            );
                            isMain = Boolean.parseBoolean(value);
                        }
                    }
                }

                if (fileInputStream == null) {
                    return buildErrorResponse(400, "missingFile");
                }

                // Service hívás
                JSONObject toReturn = layer.uploadCompanyImage(
                        companyId, jwtToken, filename, fileSize, contentType, fileInputStream, isMain
                );

                return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                        .entity(toReturn.toString())
                        .type(MediaType.APPLICATION_JSON)
                        .build();
            }

        } catch (Exception e) {
            e.printStackTrace();
            return buildErrorResponse(500, "internalError: " + e.getMessage());
        }
    }

    @DELETE
    @Path("companies/{companyId}/{imageId}")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response deleteCompanyImage(@PathParam("companyId") Integer companyId, @PathParam("imageId") Integer imageId, @HeaderParam("Authorization") String authHeader) {

        // Extract token from "Bearer <token>"
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("Missing or invalid Authorization header");
            return buildErrorResponse(401, "missingToken");
        }

        if (companyId <= 0 || imageId <= 0) {
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

            boolean hasPermission = RoleChecker.hasAnyRole(userRoles, "owner", "superadmin");

            if (!hasPermission) {
                return buildErrorResponse(403, "forbidden");
            }

            JSONObject toReturn = layer.softDeleteCompanyImage(jwtToken, companyId, imageId);
            return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                    .entity(toReturn.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }

    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("uploadUserImage")
    public Response uploadUserImage(
            @Context HttpServletRequest request,
            @HeaderParam("Authorization") String authHeader) {

        try {

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return buildErrorResponse(401, "missingToken");
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
                Integer userId = JWT.getUserIdFromAccessToken(jwtToken);

                boolean hasPermission = RoleChecker.hasAnyRole(userRoles, "client", "superadmin");

                if (!hasPermission) {
                    return buildErrorResponse(403, "forbidden");
                }

                // Apache Commons FileUpload
                ServletFileUpload upload = new ServletFileUpload();
                FileItemIterator iterator = upload.getItemIterator(request);

                InputStream fileInputStream = null;
                String filename = null;
                String contentType = null;
                long fileSize = 0;

                while (iterator.hasNext()) {
                    FileItemStream item = iterator.next();

                    if (!item.isFormField()) {
                        // File field
                        filename = item.getName();
                        contentType = item.getContentType();
                        fileInputStream = item.openStream();

                        // Read to byte array to get size
                        byte[] fileBytes = org.apache.commons.io.IOUtils.toByteArray(fileInputStream);
                        fileSize = fileBytes.length;
                        fileInputStream = new java.io.ByteArrayInputStream(fileBytes);

                        System.out.println("File: " + filename + ", size: " + fileSize);

                    }
                }

                if (fileInputStream == null) {
                    return buildErrorResponse(400, "missingFile");
                }

                // Service hívás
                JSONObject toReturn = layer.uploadUserImage(userId, jwtToken, filename, fileSize, contentType, fileInputStream);

                return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                        .entity(toReturn.toString())
                        .type(MediaType.APPLICATION_JSON)
                        .build();
            }

        } catch (Exception e) {
            e.printStackTrace();
            return buildErrorResponse(500, "internalError: " + e.getMessage());
        }
    }

    @DELETE
    @Path("users/{userId}/{imageId}")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response deleteUserImage(@PathParam("userId") Integer userId, @PathParam("imageId") Integer imageId, @HeaderParam("Authorization") String authHeader) {

        // Extract token from "Bearer <token>"
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("Missing or invalid Authorization header");
            return buildErrorResponse(401, "missingToken");
        }

        if (userId <= 0 || imageId <= 0) {
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

            boolean hasPermission = RoleChecker.hasAnyRole(userRoles, "client", "superadmin");

            if (!hasPermission) {
                return buildErrorResponse(403, "forbidden");
            }

            JSONObject toReturn = layer.softDeleteUserImage(jwtToken, userId, imageId);
            return Response.status(Integer.parseInt(toReturn.get("statusCode").toString()))
                    .entity(toReturn.toString())
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }
}
