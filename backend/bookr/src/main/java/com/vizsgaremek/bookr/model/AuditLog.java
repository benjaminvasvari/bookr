package com.vizsgaremek.bookr.model;

import java.sql.Timestamp;
import java.util.HashMap;
import java.util.Map;
import org.json.JSONObject;

/**
 * AuditLog model for tracking user actions in the system
 * Uses Fluent API (builder pattern) for easy construction
 * 
 * @author vben
 */
public class AuditLog {
    private int id;
    private int userId;
    private Integer companyId; // nullable
    private String email;
    private String entityType;
    private String action;
    private Map<String, Object> oldValues;
    private Map<String, Object> newValues;
    private Timestamp createdAt;

    // Constructors
    public AuditLog() {
        this.oldValues = new HashMap<>();
        this.newValues = new HashMap<>();
    }

    /**
     * Constructor with required fields
     * @param userId The ID of the user performing the action
     * @param email The email of the user
     * @param entityType The type of entity (e.g., "user", "appointment", "company")
     * @param action The action performed (e.g., "create", "update", "delete", "login")
     */
    public AuditLog(int userId, String email, String entityType, String action) {
        this();
        this.userId = userId;
        this.email = email;
        this.entityType = entityType;
        this.action = action;
    }

    // Fluent API methods for building the object
    
    /**
     * Set the company ID (Fluent API)
     */
    public AuditLog setCompanyId(Integer companyId) {
        this.companyId = companyId;
        return this;
    }
    
    /**
     * Set the entity type (Fluent API)
     */
    public AuditLog setEntityType(String entityType) {
        this.entityType = entityType;
        return this;
    }
    
    /**
     * Set the action (Fluent API)
     */
    public AuditLog setAction(String action) {
        this.action = action;
        return this;
    }
    
    /**
     * Add a single old value (Fluent API)
     */
    public AuditLog addOldValue(String key, Object value) {
        this.oldValues.put(key, value);
        return this;
    }
    
    /**
     * Add a single new value (Fluent API)
     */
    public AuditLog addNewValue(String key, Object value) {
        this.newValues.put(key, value);
        return this;
    }
    
    /**
     * Set all old values at once from a Map (Fluent API)
     */
    public AuditLog setOldValues(Map<String, Object> oldValues) {
        this.oldValues = new HashMap<>(oldValues);
        return this;
    }
    
    /**
     * Set all new values at once from a Map (Fluent API)
     */
    public AuditLog setNewValues(Map<String, Object> newValues) {
        this.newValues = new HashMap<>(newValues);
        return this;
    }

    // Getters
    public int getId() {
        return id;
    }

    public int getUserId() {
        return userId;
    }

    public Integer getCompanyId() {
        return companyId;
    }

    public String getEmail() {
        return email;
    }

    public String getEntityType() {
        return entityType;
    }

    public String getAction() {
        return action;
    }

    public Map<String, Object> getOldValues() {
        return oldValues;
    }

    public Map<String, Object> getNewValues() {
        return newValues;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    // Setters (non-fluent for basic properties)
    public void setId(int id) {
        this.id = id;
    }

    public void setUserId(int userId) {
        this.userId = userId;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }

    /**
     * Convert old values Map to JSONObject for database storage
     * @return JSONObject or null if no old values
     */
    public JSONObject getOldValuesAsJson() {
        if (oldValues == null || oldValues.isEmpty()) {
            return null;
        }
        return new JSONObject(oldValues);
    }

    /**
     * Convert new values Map to JSONObject for database storage
     * @return JSONObject or null if no new values
     */
    public JSONObject getNewValuesAsJson() {
        if (newValues == null || newValues.isEmpty()) {
            return null;
        }
        return new JSONObject(newValues);
    }

    @Override
    public String toString() {
        return "AuditLog{" +
                "id=" + id +
                ", userId=" + userId +
                ", companyId=" + companyId +
                ", email='" + email + '\'' +
                ", entityType='" + entityType + '\'' +
                ", action='" + action + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}