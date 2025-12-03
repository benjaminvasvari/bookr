/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.error.exception;

/**
 * Base exception for all Bookr application errors Extends RuntimeException so
 * no forced try-catch needed
 *
 * @author vben
 */
public class BookrException extends RuntimeException {

    private final String errorCode;
    private final int statusCode;
    private final Object details;

    /**
     * Constructor without details
     */
    public BookrException(String errorCode, int statusCode, String message) {
        this(errorCode, statusCode, message, null);
    }

    /**
     * Constructor with details
     */
    public BookrException(String errorCode, int statusCode, String message, Object details) {
        super(message);
        this.errorCode = errorCode;
        this.statusCode = statusCode;
        this.details = details;
    }

    // Getters
    public String getErrorCode() {
        return errorCode;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public Object getDetails() {
        return details;
    }
}
