/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.error.exception;

/**
 * Exception for resource not found errors (HTTP 404)
 * Examples: entity doesn't exist, inactive/deleted entities
 * 
 * @author vben
 */
public class NotFoundException extends BookrException {
    
    public NotFoundException(String message) {
        super("NOT_FOUND", 404, message);
    }
    
    public NotFoundException(String message, Object details) {
        super("NOT_FOUND", 404, message, details);
    }
    
    /**
     * Factory method for entity not found
     */
    public static NotFoundException entity(String entityName, Integer id) {
        return new NotFoundException(
            entityName + " with ID " + id + " not found",
            new EntityDetails(entityName, id)
        );
    }
    
    /**
     * Factory method for inactive/deleted entity
     */
    public static NotFoundException entityInactive(String entityName, Integer id) {
        return new NotFoundException(
            entityName + " with ID " + id + " is inactive or deleted",
            new EntityDetails(entityName, id)
        );
    }
    
    /**
     * Inner class for entity error details
     */
    public static class EntityDetails {
        private final String entityType;
        private final Integer entityId;
        
        public EntityDetails(String entityType, Integer entityId) {
            this.entityType = entityType;
            this.entityId = entityId;
        }
        
        @Override
        public String toString() {
            return String.format("EntityDetails{entityType='%s', entityId=%d}", 
                entityType, entityId);
        }
        
        // Getters
        public String getEntityType() { return entityType; }
        public Integer getEntityId() { return entityId; }
    }
}