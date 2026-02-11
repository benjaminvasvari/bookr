/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.util;

import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.json.JSONObject;

/**
 *
 * @author vben
 */
public class ErrorResponseBuilder {

    public static Response buildErrorResponse(int statusCode, String status) {
        JSONObject errorResponse = new JSONObject();
        errorResponse.put("statusCode", statusCode);
        errorResponse.put("status", status);

        return Response.status(statusCode)
                .entity(errorResponse.toString())
                .type(MediaType.APPLICATION_JSON)
                .build();
    }

    public static JSONObject buildErrorResponseJSON(int statusCode, String status) {
        JSONObject errorResponse = new JSONObject();
        errorResponse.put("statusCode", statusCode);
        errorResponse.put("status", status);
        return errorResponse;
    }
}
