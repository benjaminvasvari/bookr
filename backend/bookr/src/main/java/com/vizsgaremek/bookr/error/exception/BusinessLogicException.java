/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.error.exception;


/**
 * Exception for business logic violations (HTTP 422)
 * Examples: operation not allowed, constraint violations
 * 
 * @author vben
 */
public class BusinessLogicException extends BookrException {
    
    public BusinessLogicException(String message) {
        super("BUSINESS_LOGIC_ERROR", 422, message);
    }
    
    public BusinessLogicException(String errorCode, String message) {
        super(errorCode, 422, message);
    }
    
    public BusinessLogicException(String errorCode, String message, Object details) {
        super(errorCode, 422, message, details);
    }
}