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
import javax.xml.bind.annotation.XmlRootElement;

/**
 *
 * @author vben
 */
@Entity
@Table(name = "temporary_closed_periods")
@XmlRootElement
@NamedQueries({
    @NamedQuery(name = "TemporaryClosedPeriods.findAll", query = "SELECT t FROM TemporaryClosedPeriods t"),
    @NamedQuery(name = "TemporaryClosedPeriods.findById", query = "SELECT t FROM TemporaryClosedPeriods t WHERE t.id = :id"),
    @NamedQuery(name = "TemporaryClosedPeriods.findByStartDate", query = "SELECT t FROM TemporaryClosedPeriods t WHERE t.startDate = :startDate"),
    @NamedQuery(name = "TemporaryClosedPeriods.findByEndDate", query = "SELECT t FROM TemporaryClosedPeriods t WHERE t.endDate = :endDate"),
    @NamedQuery(name = "TemporaryClosedPeriods.findByOpenTime", query = "SELECT t FROM TemporaryClosedPeriods t WHERE t.openTime = :openTime"),
    @NamedQuery(name = "TemporaryClosedPeriods.findByCloseTime", query = "SELECT t FROM TemporaryClosedPeriods t WHERE t.closeTime = :closeTime"),
    @NamedQuery(name = "TemporaryClosedPeriods.findByCreatedAt", query = "SELECT t FROM TemporaryClosedPeriods t WHERE t.createdAt = :createdAt"),
    @NamedQuery(name = "TemporaryClosedPeriods.findByUpdatedAt", query = "SELECT t FROM TemporaryClosedPeriods t WHERE t.updatedAt = :updatedAt")})
public class TemporaryClosedPeriods implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Basic(optional = false)
    @NotNull
    @Column(name = "start_date")
    @Temporal(TemporalType.DATE)
    private Date startDate;
    @Basic(optional = false)
    @NotNull
    @Column(name = "end_date")
    @Temporal(TemporalType.DATE)
    private Date endDate;
    @Column(name = "open_time")
    @Temporal(TemporalType.TIME)
    private Date openTime;
    @Column(name = "close_time")
    @Temporal(TemporalType.TIME)
    private Date closeTime;
    @Basic(optional = false)
    @NotNull
    @Column(name = "created_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    @Column(name = "updated_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;
    @JoinColumn(name = "company_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Companies companyId;

    public TemporaryClosedPeriods() {
    }

    public TemporaryClosedPeriods(Integer id) {
        this.id = id;
    }

    public TemporaryClosedPeriods(Integer id, Date startDate, Date endDate, Date createdAt) {
        this.id = id;
        this.startDate = startDate;
        this.endDate = endDate;
        this.createdAt = createdAt;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Date getStartDate() {
        return startDate;
    }

    public void setStartDate(Date startDate) {
        this.startDate = startDate;
    }

    public Date getEndDate() {
        return endDate;
    }

    public void setEndDate(Date endDate) {
        this.endDate = endDate;
    }

    public Date getOpenTime() {
        return openTime;
    }

    public void setOpenTime(Date openTime) {
        this.openTime = openTime;
    }

    public Date getCloseTime() {
        return closeTime;
    }

    public void setCloseTime(Date closeTime) {
        this.closeTime = closeTime;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Companies getCompanyId() {
        return companyId;
    }

    public void setCompanyId(Companies companyId) {
        this.companyId = companyId;
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
        if (!(object instanceof TemporaryClosedPeriods)) {
            return false;
        }
        TemporaryClosedPeriods other = (TemporaryClosedPeriods) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.vizsgaremek.bookr.model.TemporaryClosedPeriods[ id=" + id + " ]";
    }
    
}
