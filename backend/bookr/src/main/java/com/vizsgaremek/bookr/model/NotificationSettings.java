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
@Table(name = "notification_settings")
@XmlRootElement
@NamedQueries({
    @NamedQuery(name = "NotificationSettings.findAll", query = "SELECT n FROM NotificationSettings n"),
    @NamedQuery(name = "NotificationSettings.findById", query = "SELECT n FROM NotificationSettings n WHERE n.id = :id"),
    @NamedQuery(name = "NotificationSettings.findByAppointmentConfirmation", query = "SELECT n FROM NotificationSettings n WHERE n.appointmentConfirmation = :appointmentConfirmation"),
    @NamedQuery(name = "NotificationSettings.findByAppointmentReminder", query = "SELECT n FROM NotificationSettings n WHERE n.appointmentReminder = :appointmentReminder"),
    @NamedQuery(name = "NotificationSettings.findByAppointmentCancellation", query = "SELECT n FROM NotificationSettings n WHERE n.appointmentCancellation = :appointmentCancellation"),
    @NamedQuery(name = "NotificationSettings.findByMarketingEmails", query = "SELECT n FROM NotificationSettings n WHERE n.marketingEmails = :marketingEmails"),
    @NamedQuery(name = "NotificationSettings.findByUpdatedAt", query = "SELECT n FROM NotificationSettings n WHERE n.updatedAt = :updatedAt"),
    @NamedQuery(name = "NotificationSettings.findByCreatedAt", query = "SELECT n FROM NotificationSettings n WHERE n.createdAt = :createdAt")})
public class NotificationSettings implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Column(name = "appointment_confirmation")
    private Boolean appointmentConfirmation;
    @Column(name = "appointment_reminder")
    private Boolean appointmentReminder;
    @Column(name = "appointment_cancellation")
    private Boolean appointmentCancellation;
    @Column(name = "marketing_emails")
    private Boolean marketingEmails;
    @Column(name = "updated_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;
    @Basic(optional = false)
    @NotNull
    @Column(name = "created_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Users userId;

    public NotificationSettings() {
    }

    public NotificationSettings(Integer id) {
        this.id = id;
    }

    public NotificationSettings(Integer id, Date createdAt) {
        this.id = id;
        this.createdAt = createdAt;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Boolean getAppointmentConfirmation() {
        return appointmentConfirmation;
    }

    public void setAppointmentConfirmation(Boolean appointmentConfirmation) {
        this.appointmentConfirmation = appointmentConfirmation;
    }

    public Boolean getAppointmentReminder() {
        return appointmentReminder;
    }

    public void setAppointmentReminder(Boolean appointmentReminder) {
        this.appointmentReminder = appointmentReminder;
    }

    public Boolean getAppointmentCancellation() {
        return appointmentCancellation;
    }

    public void setAppointmentCancellation(Boolean appointmentCancellation) {
        this.appointmentCancellation = appointmentCancellation;
    }

    public Boolean getMarketingEmails() {
        return marketingEmails;
    }

    public void setMarketingEmails(Boolean marketingEmails) {
        this.marketingEmails = marketingEmails;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
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
        if (!(object instanceof NotificationSettings)) {
            return false;
        }
        NotificationSettings other = (NotificationSettings) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.vizsgaremek.bookr.model.NotificationSettings[ id=" + id + " ]";
    }
    
}
