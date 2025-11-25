package com.vizsgaremek.bookr.model;

import java.io.Serializable;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import javax.persistence.Basic;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.Lob;
import javax.persistence.ManyToOne;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import javax.persistence.Transient;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import javax.xml.bind.annotation.XmlRootElement;
import org.json.JSONObject;

/**
 * AuditLog entity for tracking user actions in the system
 * Uses Fluent API (builder pattern) for easy construction
 * 
 * @author vben
 */
@Entity
@Table(name = "audit_logs")
@XmlRootElement
@NamedQueries({
    @NamedQuery(name = "AuditLogs.findAll", query = "SELECT a FROM AuditLogs a"),
    @NamedQuery(name = "AuditLogs.findById", query = "SELECT a FROM AuditLogs a WHERE a.id = :id"),
    @NamedQuery(name = "AuditLogs.findByUserId", query = "SELECT a FROM AuditLogs a WHERE a.userId = :userId"),
    @NamedQuery(name = "AuditLogs.findByEmail", query = "SELECT a FROM AuditLogs a WHERE a.email = :email"),
    @NamedQuery(name = "AuditLogs.findByEntityType", query = "SELECT a FROM AuditLogs a WHERE a.entityType = :entityType"),
    @NamedQuery(name = "AuditLogs.findByAction", query = "SELECT a FROM AuditLogs a WHERE a.action = :action"),
    @NamedQuery(name = "AuditLogs.findByCreatedAt", query = "SELECT a FROM AuditLogs a WHERE a.createdAt = :createdAt")})
public class AuditLogs implements Serializable {

    private static final long serialVersionUID = 1L;
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    
    @Basic(optional = false)
    @NotNull
    @Column(name = "user_id")
    private Integer userId;
    
    @Column(name = "company_id")
    private Integer companyId;
    
    @Size(max = 200)
    @Column(name = "email")
    private String email;
    
    @Size(max = 50)
    @Column(name = "entity_type")
    private String entityType;
    
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 100)
    @Column(name = "action")
    private String action;
    
    @Lob
    @Column(name = "old_values", columnDefinition = "JSON")
    private String oldValues;
    
    @Lob
    @Column(name = "new_values", columnDefinition = "JSON")
    private String newValues;
    
    @Basic(optional = false)
    @NotNull
    @Column(name = "created_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    
    // Transient fields for Fluent API (not stored in database)
    @Transient
    private Map<String, Object> oldValuesMap;
    
    @Transient
    private Map<String, Object> newValuesMap;

    // Constructors
    public AuditLogs() {
        this.oldValuesMap = new HashMap<>();
        this.newValuesMap = new HashMap<>();
        this.createdAt = new Date();
    }

    public AuditLogs(Integer id) {
        this();
        this.id = id;
    }

    /**
     * Constructor with required fields
     * @param userId The ID of the user performing the action
     * @param email The email of the user
     * @param entityType The type of entity (e.g., "user", "appointment", "company")
     * @param action The action performed (e.g., "create", "update", "delete", "login")
     */
    public AuditLogs(Integer userId, String email, String entityType, String action) {
        this();
        this.userId = userId;
        this.email = email;
        this.entityType = entityType;
        this.action = action;
    }

    // Fluent API methods for building the object
    
    /**
     * Set the user ID (Fluent API)
     */
    public AuditLogs setUserId(Integer userId) {
        this.userId = userId;
        return this;
    }
    
    /**
     * Set the company ID (Fluent API)
     */
    public AuditLogs setCompanyId(Integer companyId) {
        this.companyId = companyId;
        return this;
    }
    
    /**
     * Set the email (Fluent API)
     */
    public AuditLogs setEmail(String email) {
        this.email = email;
        return this;
    }
    
    /**
     * Set the entity type (Fluent API)
     */
    public AuditLogs setEntityType(String entityType) {
        this.entityType = entityType;
        return this;
    }
    
    /**
     * Set the action (Fluent API)
     */
    public AuditLogs setAction(String action) {
        this.action = action;
        return this;
    }
    
    /**
     * Add a single old value (Fluent API)
     */
    public AuditLogs addOldValue(String key, Object value) {
        if (this.oldValuesMap == null) {
            this.oldValuesMap = new HashMap<>();
        }
        this.oldValuesMap.put(key, value);
        return this;
    }
    
    /**
     * Add a single new value (Fluent API)
     */
    public AuditLogs addNewValue(String key, Object value) {
        if (this.newValuesMap == null) {
            this.newValuesMap = new HashMap<>();
        }
        this.newValuesMap.put(key, value);
        return this;
    }
    
    /**
     * Set all old values at once from a Map (Fluent API)
     */
    public AuditLogs setOldValuesMap(Map<String, Object> oldValues) {
        this.oldValuesMap = new HashMap<>(oldValues);
        return this;
    }
    
    /**
     * Set all new values at once from a Map (Fluent API)
     */
    public AuditLogs setNewValuesMap(Map<String, Object> newValues) {
        this.newValuesMap = new HashMap<>(newValues);
        return this;
    }
    
    /**
     * Build and finalize the audit log by converting Maps to JSON strings
     * Call this before persisting the entity
     */
    public AuditLogs build() {
        if (this.oldValuesMap != null && !this.oldValuesMap.isEmpty()) {
            this.oldValues = new JSONObject(this.oldValuesMap).toString();
        }
        if (this.newValuesMap != null && !this.newValuesMap.isEmpty()) {
            this.newValues = new JSONObject(this.newValuesMap).toString();
        }
        return this;
    }

    // Standard Getters
    public Integer getId() {
        return id;
    }

    public Integer getUserId() {
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

    public String getOldValues() {
        return oldValues;
    }

    public String getNewValues() {
        return newValues;
    }

    public Date getCreatedAt() {
        return createdAt;
    }
    
    public Map<String, Object> getOldValuesMap() {
        if (oldValuesMap == null && oldValues != null && !oldValues.isEmpty()) {
            try {
                JSONObject json = new JSONObject(oldValues);
                oldValuesMap = json.toMap();
            } catch (Exception e) {
                oldValuesMap = new HashMap<>();
            }
        }
        return oldValuesMap;
    }
    
    public Map<String, Object> getNewValuesMap() {
        if (newValuesMap == null && newValues != null && !newValues.isEmpty()) {
            try {
                JSONObject json = new JSONObject(newValues);
                newValuesMap = json.toMap();
            } catch (Exception e) {
                newValuesMap = new HashMap<>();
            }
        }
        return newValuesMap;
    }

    // Standard Setters
    public void setId(Integer id) {
        this.id = id;
    }

    public void setOldValues(String oldValues) {
        this.oldValues = oldValues;
    }

    public void setNewValues(String newValues) {
        this.newValues = newValues;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    /**
     * Convert old values Map to JSONObject for database storage
     * @return JSONObject or null if no old values
     */
    public JSONObject getOldValuesAsJson() {
        if (oldValuesMap == null || oldValuesMap.isEmpty()) {
            if (oldValues != null && !oldValues.isEmpty()) {
                try {
                    return new JSONObject(oldValues);
                } catch (Exception e) {
                    return null;
                }
            }
            return null;
        }
        return new JSONObject(oldValuesMap);
    }

    /**
     * Convert new values Map to JSONObject for database storage
     * @return JSONObject or null if no new values
     */
    public JSONObject getNewValuesAsJson() {
        if (newValuesMap == null || newValuesMap.isEmpty()) {
            if (newValues != null && !newValues.isEmpty()) {
                try {
                    return new JSONObject(newValues);
                } catch (Exception e) {
                    return null;
                }
            }
            return null;
        }
        return new JSONObject(newValuesMap);
    }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (id != null ? id.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        if (!(object instanceof AuditLogs)) {
            return false;
        }
        AuditLogs other = (AuditLogs) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "AuditLogs{" +
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