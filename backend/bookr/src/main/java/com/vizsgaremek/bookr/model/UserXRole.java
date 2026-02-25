/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.model;

import static com.vizsgaremek.bookr.model.Users.emf;
import java.io.Serializable;
import java.util.Date;
import javax.persistence.Basic;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EntityManager;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;
import javax.persistence.ParameterMode;
import javax.persistence.StoredProcedureQuery;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import javax.xml.bind.annotation.XmlRootElement;

/**
 *
 * @author vben
 */
@Entity
@Table(name = "user_x_role")
@XmlRootElement
@NamedQueries({
    @NamedQuery(name = "UserXRole.findAll", query = "SELECT u FROM UserXRole u"),
    @NamedQuery(name = "UserXRole.findById", query = "SELECT u FROM UserXRole u WHERE u.id = :id"),
    @NamedQuery(name = "UserXRole.findByAssignedAt", query = "SELECT u FROM UserXRole u WHERE u.assignedAt = :assignedAt"),
    @NamedQuery(name = "UserXRole.findByUnAssignedAt", query = "SELECT u FROM UserXRole u WHERE u.unAssignedAt = :unAssignedAt"),
    @NamedQuery(name = "UserXRole.findByIsUnAssigned", query = "SELECT u FROM UserXRole u WHERE u.isUnAssigned = :isUnAssigned")})
public class UserXRole implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Column(name = "assigned_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date assignedAt;
    @Column(name = "un_assigned_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date unAssignedAt;
    @Column(name = "is_un_assigned")
    private Boolean isUnAssigned;
    @JoinColumn(name = "role_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Roles roleId;
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Users userId;

    public UserXRole() {
    }

    public UserXRole(Integer id) {
        this.id = id;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Date getAssignedAt() {
        return assignedAt;
    }

    public void setAssignedAt(Date assignedAt) {
        this.assignedAt = assignedAt;
    }

    public Date getUnAssignedAt() {
        return unAssignedAt;
    }

    public void setUnAssignedAt(Date unAssignedAt) {
        this.unAssignedAt = unAssignedAt;
    }

    public Boolean getIsUnAssigned() {
        return isUnAssigned;
    }

    public void setIsUnAssigned(Boolean isUnAssigned) {
        this.isUnAssigned = isUnAssigned;
    }

    public Roles getRoleId() {
        return roleId;
    }

    public void setRoleId(Roles roleId) {
        this.roleId = roleId;
    }

    public Users getUserId() {
        return userId;
    }

    public void setUserId(Users userId) {
        this.userId = userId;
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
        if (!(object instanceof UserXRole)) {
            return false;
        }
        UserXRole other = (UserXRole) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.vizsgaremek.bookr.model.UserXRole[ id=" + id + " ]";
    }

    public static Boolean assignRole(Integer userId, Integer roleId) {
        EntityManager em = emf.createEntityManager();

        try {

            StoredProcedureQuery spq = em.createStoredProcedureQuery("assignRole");
            spq.registerStoredProcedureParameter("userIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("roleIdIN", Integer.class, ParameterMode.IN);

            spq.setParameter("userIdIN", userId);
            spq.setParameter("roleIdIN", roleId);

            spq.execute();

            return true;

        } catch (Exception ex) {
            ex.printStackTrace();
            return false;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }
}
