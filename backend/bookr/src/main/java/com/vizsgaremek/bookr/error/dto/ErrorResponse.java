/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.error.dto;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * DTO for error responses This structure will be serialized to JSON by JAX-RS
 *
 * @author vben
 */
public class ErrorResponse {

    private String status = "error";
    private int statusCode;
    private ErrorDetail error;
    private String timestamp;

    /**
     * Constructor
     */
    public ErrorResponse(int statusCode, String code, String message, Object details) {
        this.statusCode = statusCode;
        this.error = new ErrorDetail(code, message, details);
        this.timestamp = LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"));
    }

    // Getters (required for JSON serialization)
    public String getStatus() {
        return status;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public ErrorDetail getError() {
        return error;
    }

    public String getTimestamp() {
        return timestamp;
    }

    /**
     * Inner class for error details
     */
    public static class ErrorDetail {

        private String code;
        private String message;
        private Object details;

        public ErrorDetail(String code, String message, Object details) {
            this.code = code;
            this.message = message;
            this.details = details;
        }

        // Getters (required for JSON serialization)
        public String getCode() {
            return code;
        }

        public String getMessage() {
            return message;
        }

        public Object getDetails() {
            return details;
        }
    }
}
