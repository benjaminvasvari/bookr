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
@Table(name = "staff_working_hours")
@XmlRootElement
@NamedQueries({
    @NamedQuery(name = "StaffWorkingHours.findAll", query = "SELECT s FROM StaffWorkingHours s"),
    @NamedQuery(name = "StaffWorkingHours.findById", query = "SELECT s FROM StaffWorkingHours s WHERE s.id = :id"),
    @NamedQuery(name = "StaffWorkingHours.findByDayOfWeek", query = "SELECT s FROM StaffWorkingHours s WHERE s.dayOfWeek = :dayOfWeek"),
    @NamedQuery(name = "StaffWorkingHours.findByStartTime", query = "SELECT s FROM StaffWorkingHours s WHERE s.startTime = :startTime"),
    @NamedQuery(name = "StaffWorkingHours.findByEndTime", query = "SELECT s FROM StaffWorkingHours s WHERE s.endTime = :endTime"),
    @NamedQuery(name = "StaffWorkingHours.findByIsAvailable", query = "SELECT s FROM StaffWorkingHours s WHERE s.isAvailable = :isAvailable"),
    @NamedQuery(name = "StaffWorkingHours.findByCreatedAt", query = "SELECT s FROM StaffWorkingHours s WHERE s.createdAt = :createdAt"),
    @NamedQuery(name = "StaffWorkingHours.findByUpdatedAt", query = "SELECT s FROM StaffWorkingHours s WHERE s.updatedAt = :updatedAt")})
public class StaffWorkingHours implements Serializable {

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
    @Column(name = "start_time")
    @Temporal(TemporalType.TIME)
    private Date startTime;
    @Column(name = "end_time")
    @Temporal(TemporalType.TIME)
    private Date endTime;
    @Column(name = "is_available")
    private Boolean isAvailable;
    @Basic(optional = false)
    @NotNull
    @Column(name = "created_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    @Column(name = "updated_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;
    @JoinColumn(name = "staff_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Staff staffId;

    public StaffWorkingHours() {
    }

    public StaffWorkingHours(Integer id) {
        this.id = id;
    }

    public StaffWorkingHours(Integer id, String dayOfWeek, Date createdAt) {
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

    public Date getStartTime() {
        return startTime;
    }

    public void setStartTime(Date startTime) {
        this.startTime = startTime;
    }

    public Date getEndTime() {
        return endTime;
    }

    public void setEndTime(Date endTime) {
        this.endTime = endTime;
    }

    public Boolean getIsAvailable() {
        return isAvailable;
    }

    public void setIsAvailable(Boolean isAvailable) {
        this.isAvailable = isAvailable;
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

    public Staff getStaffId() {
        return staffId;
    }

    public void setStaffId(Staff staffId) {
        this.staffId = staffId;
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
        if (!(object instanceof StaffWorkingHours)) {
            return false;
        }
        StaffWorkingHours other = (StaffWorkingHours) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.vizsgaremek.bookr.model.StaffWorkingHours[ id=" + id + " ]";
    }
    
}
