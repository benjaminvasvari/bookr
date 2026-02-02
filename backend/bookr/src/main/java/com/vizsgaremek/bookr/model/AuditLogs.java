/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.model;

import java.io.Serializable;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import javax.persistence.Basic;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.Lob;
import javax.persistence.ManyToOne;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;
import javax.persistence.ParameterMode;
import javax.persistence.Persistence;
import javax.persistence.StoredProcedureQuery;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import javax.persistence.Transient;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import javax.xml.bind.annotation.XmlRootElement;
import org.json.JSONObject;

/**
 *
 * @author vben
 */
@Entity
@Table(name = "audit_logs")
@XmlRootElement
@NamedQueries({
    @NamedQuery(name = "AuditLogs.findAll", query = "SELECT a FROM AuditLogs a"),
    @NamedQuery(name = "AuditLogs.findById", query = "SELECT a FROM AuditLogs a WHERE a.id = :id"),
    @NamedQuery(name = "AuditLogs.findByPerformedByRole", query = "SELECT a FROM AuditLogs a WHERE a.performedByRole = :performedByRole"),
    @NamedQuery(name = "AuditLogs.findByEmail", query = "SELECT a FROM AuditLogs a WHERE a.email = :email"),
    @NamedQuery(name = "AuditLogs.findByEntityType", query = "SELECT a FROM AuditLogs a WHERE a.entityType = :entityType"),
    @NamedQuery(name = "AuditLogs.findByAction", query = "SELECT a FROM AuditLogs a WHERE a.action = :action"),
    @NamedQuery(name = "AuditLogs.findByCreatedAt", query = "SELECT a FROM AuditLogs a WHERE a.createdAt = :createdAt")})
public class AuditLogs implements Serializable {

    static EntityManagerFactory emf = Persistence.createEntityManagerFactory("com.vizsgaremek_bookr_war_1.0-SNAPSHOTPU");

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;

    @Basic(optional = false)
    @NotNull
    @Column(name = "performed_by_user_id")
    private Integer performedByUserId;

    @Size(max = 50)
    @Column(name = "performed_by_role")
    private String performedByRole;

    @Column(name = "affected_entity_id")
    private Integer affectedEntityId;

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

    // Transient fields for easier JSON handling
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

    public AuditLogs(Integer performedByUserId, String performedByRole, String email, String entityType, String action) {
        this.performedByUserId = performedByUserId;
        this.performedByRole = performedByRole;
        this.email = email;
        this.entityType = entityType;
        this.action = action;
    }

    public AuditLogs(Integer performedByUserId, String performedByRole, Integer affectedEntityId, String email, String entityType, String action) {
        this.performedByUserId = performedByUserId;
        this.performedByRole = performedByRole;
        this.affectedEntityId = affectedEntityId;
        this.email = email;
        this.entityType = entityType;
        this.action = action;
    }

    // ========== GETTERS ==========
    public Integer getId() {
        return id;
    }

    public Integer getPerformedByUserId() {
        return performedByUserId;
    }

    public String getPerformedByRole() {
        return performedByRole;
    }

    public Integer getAffectedEntityId() {
        return affectedEntityId;
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

    // ========== SETTERS ==========
    public void setId(Integer id) {
        this.id = id;
    }

    public void setPerformedByUserId(Integer performedByUserId) {
        this.performedByUserId = performedByUserId;
    }

    public void setPerformedByRole(String performedByRole) {
        this.performedByRole = performedByRole;
    }

    public void setAffectedEntityId(Integer affectedUserId) {
        this.affectedEntityId = affectedUserId;
    }

    public void setCompanyId(Integer companyId) {
        this.companyId = companyId;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    public void setAction(String action) {
        this.action = action;
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

    public void setOldValuesMap(Map<String, Object> oldValuesMap) {
        this.oldValuesMap = oldValuesMap;
    }

    public void setNewValuesMap(Map<String, Object> newValuesMap) {
        this.newValuesMap = newValuesMap;
    }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (id != null ? id.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
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
        return "com.vizsgaremek.bookr.model.AuditLogs[ id=" + id + " ]";
    }


    public void addOldValue(String key, Object value) {
        if (this.oldValuesMap == null) {
            this.oldValuesMap = new HashMap<>();
        }
        this.oldValuesMap.put(key, value);
    }

    public void addNewValue(String key, Object value) {
        if (this.newValuesMap == null) {
            this.newValuesMap = new HashMap<>();
        }
        this.newValuesMap.put(key, value);
    }

    public void logAudit() {
        EntityManager em = emf.createEntityManager();

        try {
            // Convert Maps to JSON strings before saving
            if (this.oldValuesMap != null && !this.oldValuesMap.isEmpty()) {
                this.oldValues = new JSONObject(this.oldValuesMap).toString();
            }
            if (this.newValuesMap != null && !this.newValuesMap.isEmpty()) {
                this.newValues = new JSONObject(this.newValuesMap).toString();
            }

            StoredProcedureQuery spq = em.createStoredProcedureQuery("logAudit");

            // Register parameters according to the new stored procedure signature
            spq.registerStoredProcedureParameter("performedByUserIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("performedByRoleIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("affectedUserIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("emailIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("entityTypeIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("actionIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("oldValuesIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("newValuesIN", String.class, ParameterMode.IN);

            // Set required parameters
            spq.setParameter("performedByUserIdIN", this.performedByUserId);
            spq.setParameter("actionIN", this.action);

            // Handle nullable performedByRole
            if (this.performedByRole != null && !this.performedByRole.isEmpty()) {
                spq.setParameter("performedByRoleIN", this.performedByRole);
            } else {
                spq.unwrap(org.hibernate.procedure.ProcedureCall.class)
                        .getParameterRegistration("performedByRoleIN")
                        .enablePassingNulls(true);
                spq.setParameter("performedByRoleIN", null);
            }

            // Handle nullable affectedUserId
            if (this.affectedEntityId != null) {
                spq.setParameter("affectedUserIdIN", this.affectedEntityId);
            } else {
                spq.unwrap(org.hibernate.procedure.ProcedureCall.class)
                        .getParameterRegistration("affectedUserIdIN")
                        .enablePassingNulls(true);
                spq.setParameter("affectedUserIdIN", null);
            }

            // Handle nullable companyId
            if (this.companyId != null) {
                spq.setParameter("companyIdIN", this.companyId);
            } else {
                spq.unwrap(org.hibernate.procedure.ProcedureCall.class)
                        .getParameterRegistration("companyIdIN")
                        .enablePassingNulls(true);
                spq.setParameter("companyIdIN", null);
            }

            // Handle nullable email
            if (this.email != null && !this.email.isEmpty()) {
                spq.setParameter("emailIN", this.email);
            } else {
                spq.unwrap(org.hibernate.procedure.ProcedureCall.class)
                        .getParameterRegistration("emailIN")
                        .enablePassingNulls(true);
                spq.setParameter("emailIN", null);
            }

            // Handle nullable entityType
            if (this.entityType != null && !this.entityType.isEmpty()) {
                spq.setParameter("entityTypeIN", this.entityType);
            } else {
                spq.unwrap(org.hibernate.procedure.ProcedureCall.class)
                        .getParameterRegistration("entityTypeIN")
                        .enablePassingNulls(true);
                spq.setParameter("entityTypeIN", null);
            }

            // Handle nullable oldValues
            if (this.oldValues != null && !this.oldValues.isEmpty()) {
                spq.setParameter("oldValuesIN", this.oldValues);
            } else {
                spq.unwrap(org.hibernate.procedure.ProcedureCall.class)
                        .getParameterRegistration("oldValuesIN")
                        .enablePassingNulls(true);
                spq.setParameter("oldValuesIN", null);
            }

            // Handle nullable newValues
            if (this.newValues != null && !this.newValues.isEmpty()) {
                spq.setParameter("newValuesIN", this.newValues);
            } else {
                spq.unwrap(org.hibernate.procedure.ProcedureCall.class)
                        .getParameterRegistration("newValuesIN")
                        .enablePassingNulls(true);
                spq.setParameter("newValuesIN", null);
            }

            spq.execute();

        } catch (Exception ex) {
            ex.printStackTrace();
            throw new RuntimeException("Failed to log audit entry", ex);
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }
}
