/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/WebServices/GenericResource.java to edit this template
 */
package com.vizsgaremek.bookr.controller;

import com.vizsgaremek.bookr.service.ImagesService;
import java.io.InputStream;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.UriInfo;
import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.Produces;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PUT;
import javax.ws.rs.PathParam;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.json.JSONObject;

/**
 * REST Web Service
 *
 * @author vben
 */
@Path("images")
public class ImagesController {

    private ImagesService layer = new ImagesService();

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
            @FormDataParam("isMain") @DefaultValue("false") boolean isMain,
            @Context HttpHeaders headers) {
        
    }
}
