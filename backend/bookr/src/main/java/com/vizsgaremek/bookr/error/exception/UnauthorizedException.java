/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.error.exception;


/**
 * Exception for authentication errors (HTTP 401)
 * Examples: invalid token, missing token, expired token
 * 
 * @author vben
 */
public class UnauthorizedException extends BookrException {
    
    public UnauthorizedException(String message) {
        super("UNAUTHORIZED", 401, message);
    }
    
    public UnauthorizedException(String message, Object details) {
        super("UNAUTHORIZED", 401, message, details);
    }
    
    /**
     * Factory method for invalid token
     */
    public static UnauthorizedException invalidToken() {
        return new UnauthorizedException("Invalid or expired authentication token");
    }
    
    /**
     * Factory method for missing token
     */
    public static UnauthorizedException missingToken() {
        return new UnauthorizedException("Authentication token is required");
    }
}