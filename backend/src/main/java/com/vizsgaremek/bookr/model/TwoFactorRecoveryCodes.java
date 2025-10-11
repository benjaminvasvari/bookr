/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.model;

import java.io.Serializable;
import java.util.Date;
import javax.persistence.Basic;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import javax.xml.bind.annotation.XmlRootElement;

/**
 *
 * @author vben
 */
@Entity
@Table(name = "two_factor_recovery_codes")
@XmlRootElement
@NamedQueries({
    @NamedQuery(name = "TwoFactorRecoveryCodes.findAll", query = "SELECT t FROM TwoFactorRecoveryCodes t"),
    @NamedQuery(name = "TwoFactorRecoveryCodes.findById", query = "SELECT t FROM TwoFactorRecoveryCodes t WHERE t.id = :id"),
    @NamedQuery(name = "TwoFactorRecoveryCodes.findByCode", query = "SELECT t FROM TwoFactorRecoveryCodes t WHERE t.code = :code"),
    @NamedQuery(name = "TwoFactorRecoveryCodes.findByUsedAt", query = "SELECT t FROM TwoFactorRecoveryCodes t WHERE t.usedAt = :usedAt"),
    @NamedQuery(name = "TwoFactorRecoveryCodes.findByIsUsed", query = "SELECT t FROM TwoFactorRecoveryCodes t WHERE t.isUsed = :isUsed"),
    @NamedQuery(name = "TwoFactorRecoveryCodes.findByCreatedAt", query = "SELECT t FROM TwoFactorRecoveryCodes t WHERE t.createdAt = :createdAt")})
public class TwoFactorRecoveryCodes implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 64)
    @Column(name = "code")
    private String code;
    @Column(name = "used_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date usedAt;
    @Basic(optional = false)
    @NotNull
    @Column(name = "is_used")
    private boolean isUsed;
    @Basic(optional = false)
    @NotNull
    @Column(name = "created_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Users userId;

    public TwoFactorRecoveryCodes() {
    }

    public TwoFactorRecoveryCodes(Integer id) {
        this.id = id;
    }

    public TwoFactorRecoveryCodes(Integer id, String code, boolean isUsed, Date createdAt) {
        this.id = id;
        this.code = code;
        this.isUsed = isUsed;
        this.createdAt = createdAt;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public Date getUsedAt() {
        return usedAt;
    }

    public void setUsedAt(Date usedAt) {
        this.usedAt = usedAt;
    }

    public boolean getIsUsed() {
        return isUsed;
    }

    public void setIsUsed(boolean isUsed) {
        this.isUsed = isUsed;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
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
        if (!(object instanceof TwoFactorRecoveryCodes)) {
            return false;
        }
        TwoFactorRecoveryCodes other = (TwoFactorRecoveryCodes) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.vizsgaremek.bookr.model.TwoFactorRecoveryCodes[ id=" + id + " ]";
    }
    
}
