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
    @Basic(optional = false)
    @NotNull
    @Column(name = "appointment_confirmation")
    private boolean appointmentConfirmation;
    @Basic(optional = false)
    @NotNull
    @Column(name = "appointment_reminder")
    private boolean appointmentReminder;
    @Basic(optional = false)
    @NotNull
    @Column(name = "appointment_cancellation")
    private boolean appointmentCancellation;
    @Basic(optional = false)
    @NotNull
    @Column(name = "marketing_emails")
    private boolean marketingEmails;
    @Column(name = "updated_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;
    @Basic(optional = false)
    @NotNull
    @Column(name = "created_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    @Lob
    @Column(name = "userId")
    private byte[] userId;
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Users userId1;

    public NotificationSettings() {
    }

    public NotificationSettings(Integer id) {
        this.id = id;
    }

    public NotificationSettings(Integer id, boolean appointmentConfirmation, boolean appointmentReminder, boolean appointmentCancellation, boolean marketingEmails, Date createdAt) {
        this.id = id;
        this.appointmentConfirmation = appointmentConfirmation;
        this.appointmentReminder = appointmentReminder;
        this.appointmentCancellation = appointmentCancellation;
        this.marketingEmails = marketingEmails;
        this.createdAt = createdAt;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public boolean getAppointmentConfirmation() {
        return appointmentConfirmation;
    }

    public void setAppointmentConfirmation(boolean appointmentConfirmation) {
        this.appointmentConfirmation = appointmentConfirmation;
    }

    public boolean getAppointmentReminder() {
        return appointmentReminder;
    }

    public void setAppointmentReminder(boolean appointmentReminder) {
        this.appointmentReminder = appointmentReminder;
    }

    public boolean getAppointmentCancellation() {
        return appointmentCancellation;
    }

    public void setAppointmentCancellation(boolean appointmentCancellation) {
        this.appointmentCancellation = appointmentCancellation;
    }

    public boolean getMarketingEmails() {
        return marketingEmails;
    }

    public void setMarketingEmails(boolean marketingEmails) {
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

    public byte[] getUserId() {
        return userId;
    }

    public void setUserId(byte[] userId) {
        this.userId = userId;
    }

    public Users getUserId1() {
        return userId1;
    }

    public void setUserId1(Users userId1) {
        this.userId1 = userId1;
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
