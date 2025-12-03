/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.error.exception;


/**
 * Exception for validation errors (HTTP 400) Examples: invalid ID, missing
 * required fields, format errors
 *
 * @author vben
 */
public class ValidationException extends BookrException {

    public ValidationException(String message) {
        super("VALIDATION_ERROR", 400, message);
    }

    public ValidationException(String message, Object details) {
        super("VALIDATION_ERROR", 400, message, details);
    }

    /**
     * Factory method for invalid ID errors
     */
    public static ValidationException invalidId(String entityName, Object id) {
        return new ValidationException(
                entityName + " ID must be a positive number",
                new ValidationDetails("id", id, "must be > 0")
        );
    }

    /**
     * Factory method for missing required field
     */
    public static ValidationException missingField(String fieldName) {
        return new ValidationException(
                "Required field is missing: " + fieldName,
                new ValidationDetails(fieldName, null, "required")
        );
    }

    /**
     * Inner class for validation error details
     */
    public static class ValidationDetails {

        private final String field;
        private final Object value;
        private final String constraint;

        public ValidationDetails(String field, Object value, String constraint) {
            this.field = field;
            this.value = value;
            this.constraint = constraint;
        }

        @Override
        public String toString() {
            return String.format("ValidationDetails{field='%s', value=%s, constraint='%s'}",
                    field, value, constraint);
        }

        // Getters (needed for JSON serialization later)
        public String getField() {
            return field;
        }

        public Object getValue() {
            return value;
        }

        public String getConstraint() {
            return constraint;
        }
    }
}
