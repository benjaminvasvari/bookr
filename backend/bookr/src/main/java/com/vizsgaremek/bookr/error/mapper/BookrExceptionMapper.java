/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.error.mapper;

import com.vizsgaremek.bookr.error.exception.BookrException;
import com.vizsgaremek.bookr.error.dto.ErrorResponse;
import com.vizsgaremek.bookr.util.Logger;
import javax.ws.rs.core.Response;
import javax.ws.rs.ext.ExceptionMapper;
import javax.ws.rs.ext.Provider;

/**
 * JAX-RS Exception Mapper Automatically catches all BookrException instances
 * and converts them to HTTP responses
 *
 * @Provider annotation registers this class with JAX-RS
 *
 * @author vben
 */
@Provider
public class BookrExceptionMapper implements ExceptionMapper<BookrException> {

    /**
     * Converts BookrException to HTTP Response This method is automatically
     * called by JAX-RS when a BookrException is thrown
     */
    @Override
    public Response toResponse(BookrException exception) {
        // Build error response DTO
        ErrorResponse errorResponse = new ErrorResponse(
                exception.getStatusCode(),
                exception.getErrorCode(),
                exception.getMessage(),
                exception.getDetails()
        );

        // Log the exception
        logException(exception);

        // Return HTTP response with error body
        return Response
                .status(exception.getStatusCode())
                .entity(errorResponse)
                .build();
    }

    /**
     * Logs exception based on status code 4xx = INFO (client errors) 5xx =
     * ERROR (server errors) with stack trace
     */
    private void logException(BookrException exception) {
        String logMessage = String.format(
                "%s - %s%s",
                exception.getErrorCode(),
                exception.getMessage(),
                exception.getDetails() != null ? " - Details: " + exception.getDetails() : ""
        );

        if (exception.getStatusCode() >= 500) {
            // Server error - log as ERROR with stack trace
            Logger.log(Logger.Level.ERROR, logMessage, exception);
        } else if (exception.getStatusCode() >= 400) {
            // Client error - log as INFO without stack trace
            Logger.log(Logger.Level.INFO, logMessage);
        }
    }
}
