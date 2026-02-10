/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.model;

import static com.vizsgaremek.bookr.model.Users.emf;
import com.vizsgaremek.bookr.util.StoredProcedureUtil;
import java.io.Serializable;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import javax.persistence.Basic;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EntityManager;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.Lob;
import javax.persistence.ManyToOne;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;
import javax.persistence.ParameterMode;
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
    @NamedQuery(name = "AuditLogs.findByCreatedAt", query = "SELECT a FROM AuditLogs a WHERE a.createdAt = :createdAt"),
    @NamedQuery(name = "AuditLogs.findByAffectedUserId", query = "SELECT a FROM AuditLogs a WHERE a.affectedUserId = :affectedUserId")})
public class AuditLogs implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Size(max = 50)
    @Column(name = "performed_by_role")
    private String performedByRole;
    // @Pattern(regexp="[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?", message="Invalid email")//if the field contains email address consider using this annotation to enforce field validation
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
    @Size(max = 1073741824)
    @Column(name = "old_values")
    private String oldValues;
    @Lob
    @Size(max = 1073741824)
    @Column(name = "new_values")
    private String newValues;
    @Basic(optional = false)
    @NotNull
    @Column(name = "created_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    @Column(name = "affected_user_id")
    private Integer affectedUserId;
    @JoinColumn(name = "company_id", referencedColumnName = "id")
    @ManyToOne
    private Companies companyId;
    @JoinColumn(name = "performed_by_user_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Users performedByUserId;
    @JoinColumn(name = "affected_entity_id", referencedColumnName = "id")
    @ManyToOne
    private Users affectedEntityId;

    @Transient
    private Map<String, Object> oldValuesMap;

    @Transient
    private Map<String, Object> newValuesMap;

    @Transient
    private Integer performedByUserIdInt;

    @Transient
    private Integer affectedEntityIdInt;

    @Transient
    private Integer companyIdInt;

    public AuditLogs() {
        this.oldValuesMap = new HashMap<>();
        this.newValuesMap = new HashMap<>();
        this.createdAt = new Date();
    }

    public AuditLogs(Integer id) {
        this.id = id;
    }

    public AuditLogs(Integer performedByUserIdInt, String performedByRole, String email, String entityType, String action) {
        this.performedByUserIdInt = performedByUserIdInt;
        this.performedByRole = performedByRole;
        this.email = email;
        this.entityType = entityType;
        this.action = action;
    }

    public AuditLogs(Integer performedByUserIdInt, String performedByRole, Integer affectedEntityId, String email, String entityType, String action) {
        this.performedByUserIdInt = performedByUserIdInt;
        this.performedByRole = performedByRole;
        this.affectedEntityIdInt = affectedEntityIdInt;
        this.email = email;
        this.entityType = entityType;
        this.action = action;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getPerformedByRole() {
        return performedByRole;
    }

    public void setPerformedByRole(String performedByRole) {
        this.performedByRole = performedByRole;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getOldValues() {
        return oldValues;
    }

    public void setOldValues(String oldValues) {
        this.oldValues = oldValues;
    }

    public String getNewValues() {
        return newValues;
    }

    public void setNewValues(String newValues) {
        this.newValues = newValues;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Integer getAffectedUserId() {
        return affectedUserId;
    }

    public void setAffectedUserId(Integer affectedUserId) {
        this.affectedUserId = affectedUserId;
    }

    public Companies getCompanyId() {
        return companyId;
    }

    public void setCompanyId(Companies companyId) {
        this.companyId = companyId;
    }

    public Users getPerformedByUserId() {
        return performedByUserId;
    }

    public void setPerformedByUserId(Users performedByUserId) {
        this.performedByUserId = performedByUserId;
    }

    public Users getAffectedEntityId() {
        return affectedEntityId;
    }

    public void setAffectedEntityId(Users affectedEntityId) {
        this.affectedEntityId = affectedEntityId;
    }

    public void setOldValuesMap(Map<String, Object> oldValuesMap) {
        this.oldValuesMap = oldValuesMap;
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

    public void setNewValuesMap(Map<String, Object> newValuesMap) {
        this.newValuesMap = newValuesMap;
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

    public Integer getAffectedEntityIdInt() {
        return affectedEntityIdInt;
    }

    public void setAffectedEntityIdInt(Integer affectedEntityIdInt) {
        this.affectedEntityIdInt = affectedEntityIdInt;
    }

    public Integer getPerformedByUserIdInt() {
        return performedByUserIdInt;
    }

    public void setPerformedByUserIdInt(Integer performedByUserIdInt) {
        this.performedByUserIdInt = performedByUserIdInt;
    }

    public Integer getCompanyIdInt() {
        return companyIdInt;
    }

    public void setCompanyIdInt(Integer companyIdInt) {
        this.companyIdInt = companyIdInt;
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

            // Set required parameters (ezek mindig vannak)
            spq.setParameter("performedByUserIdIN", this.performedByUserIdInt);
            spq.setParameter("actionIN", this.action);

            // Az összes nullable paraméter - HELPER METÓDUSSAL
            StoredProcedureUtil.setNullableParameter(spq, "performedByRoleIN", (this.performedByRole != null && !this.performedByRole.isEmpty()) ? this.performedByRole : null);

            StoredProcedureUtil.setNullableParameter(spq, "affectedUserIdIN", this.affectedEntityIdInt);

            StoredProcedureUtil.setNullableParameter(spq, "companyIdIN", this.companyIdInt);

            StoredProcedureUtil.setNullableParameter(spq, "emailIN", (this.email != null && !this.email.isEmpty()) ? this.email : null);

            StoredProcedureUtil.setNullableParameter(spq, "entityTypeIN", (this.entityType != null && !this.entityType.isEmpty()) ? this.entityType : null);

            StoredProcedureUtil.setNullableParameter(spq, "oldValuesIN", (this.oldValues != null && !this.oldValues.isEmpty()) ? this.oldValues : null);

            StoredProcedureUtil.setNullableParameter(spq, "newValuesIN", (this.newValues != null && !this.newValues.isEmpty()) ? this.newValues : null);

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
