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
@Table(name = "opening_hours")
@XmlRootElement
@NamedQueries({
    @NamedQuery(name = "OpeningHours.findAll", query = "SELECT o FROM OpeningHours o"),
    @NamedQuery(name = "OpeningHours.findById", query = "SELECT o FROM OpeningHours o WHERE o.id = :id"),
    @NamedQuery(name = "OpeningHours.findByDayOfWeek", query = "SELECT o FROM OpeningHours o WHERE o.dayOfWeek = :dayOfWeek"),
    @NamedQuery(name = "OpeningHours.findByOpenTime", query = "SELECT o FROM OpeningHours o WHERE o.openTime = :openTime"),
    @NamedQuery(name = "OpeningHours.findByCloseTime", query = "SELECT o FROM OpeningHours o WHERE o.closeTime = :closeTime"),
    @NamedQuery(name = "OpeningHours.findByIsClosed", query = "SELECT o FROM OpeningHours o WHERE o.isClosed = :isClosed"),
    @NamedQuery(name = "OpeningHours.findByCreatedAt", query = "SELECT o FROM OpeningHours o WHERE o.createdAt = :createdAt"),
    @NamedQuery(name = "OpeningHours.findByUpdatedAt", query = "SELECT o FROM OpeningHours o WHERE o.updatedAt = :updatedAt")})
public class OpeningHours implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 9)
    @Column(name = "day_of_week")
    private String dayOfWeek;
    @Column(name = "open_time")
    @Temporal(TemporalType.TIME)
    private Date openTime;
    @Column(name = "close_time")
    @Temporal(TemporalType.TIME)
    private Date closeTime;
    @Column(name = "is_closed")
    private Boolean isClosed;
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

    public OpeningHours() {
    }

    public OpeningHours(Integer id) {
        this.id = id;
    }

    public OpeningHours(Integer id, String dayOfWeek, Date createdAt) {
        this.id = id;
        this.dayOfWeek = dayOfWeek;
        this.createdAt = createdAt;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(String dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
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

    public Boolean getIsClosed() {
        return isClosed;
    }

    public void setIsClosed(Boolean isClosed) {
        this.isClosed = isClosed;
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
        if (!(object instanceof OpeningHours)) {
            return false;
        }
        OpeningHours other = (OpeningHours) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.vizsgaremek.bookr.model.OpeningHours[ id=" + id + " ]";
    }
    
}
