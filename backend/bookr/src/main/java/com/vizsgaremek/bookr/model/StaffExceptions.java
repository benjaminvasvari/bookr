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
import javax.persistence.Lob;
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
@Table(name = "staff_exceptions")
@XmlRootElement
@NamedQueries({
    @NamedQuery(name = "StaffExceptions.findAll", query = "SELECT s FROM StaffExceptions s"),
    @NamedQuery(name = "StaffExceptions.findById", query = "SELECT s FROM StaffExceptions s WHERE s.id = :id"),
    @NamedQuery(name = "StaffExceptions.findByDate", query = "SELECT s FROM StaffExceptions s WHERE s.date = :date"),
    @NamedQuery(name = "StaffExceptions.findByStartTime", query = "SELECT s FROM StaffExceptions s WHERE s.startTime = :startTime"),
    @NamedQuery(name = "StaffExceptions.findByEndTime", query = "SELECT s FROM StaffExceptions s WHERE s.endTime = :endTime"),
    @NamedQuery(name = "StaffExceptions.findByType", query = "SELECT s FROM StaffExceptions s WHERE s.type = :type"),
    @NamedQuery(name = "StaffExceptions.findByCreatedAt", query = "SELECT s FROM StaffExceptions s WHERE s.createdAt = :createdAt"),
    @NamedQuery(name = "StaffExceptions.findByDeletedAt", query = "SELECT s FROM StaffExceptions s WHERE s.deletedAt = :deletedAt"),
    @NamedQuery(name = "StaffExceptions.findByIsDeleted", query = "SELECT s FROM StaffExceptions s WHERE s.isDeleted = :isDeleted")})
public class StaffExceptions implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Basic(optional = false)
    @NotNull
    @Column(name = "date")
    @Temporal(TemporalType.DATE)
    private Date date;
    @Column(name = "start_time")
    @Temporal(TemporalType.TIME)
    private Date startTime;
    @Column(name = "end_time")
    @Temporal(TemporalType.TIME)
    private Date endTime;
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 12)
    @Column(name = "type")
    private String type;
    @Lob
    @Size(max = 65535)
    @Column(name = "note")
    private String note;
    @Column(name = "created_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    @Column(name = "deleted_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date deletedAt;
    @Basic(optional = false)
    @NotNull
    @Column(name = "is_deleted")
    private boolean isDeleted;
    @JoinColumn(name = "staff_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Staff staffId;

    public StaffExceptions() {
    }

    public StaffExceptions(Integer id) {
        this.id = id;
    }

    public StaffExceptions(Integer id, Date date, String type, boolean isDeleted) {
        this.id = id;
        this.date = date;
        this.type = type;
        this.isDeleted = isDeleted;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Date getDate() {
        return date;
    }

    public void setDate(Date date) {
        this.date = date;
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

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Date getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(Date deletedAt) {
        this.deletedAt = deletedAt;
    }

    public boolean getIsDeleted() {
        return isDeleted;
    }

    public void setIsDeleted(boolean isDeleted) {
        this.isDeleted = isDeleted;
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
        if (!(object instanceof StaffExceptions)) {
            return false;
        }
        StaffExceptions other = (StaffExceptions) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.vizsgaremek.bookr.model.StaffExceptions[ id=" + id + " ]";
    }
    
}
