/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.model;

import static com.vizsgaremek.bookr.model.Users.emf;
import com.vizsgaremek.bookr.util.DateFormatterUtil;
import java.io.Serializable;
import java.util.Date;
import java.util.List;
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

    //CUSTOM
    public Integer getUserIdInt() {
        return userIdInt;
    }

    public void setUserIdInt(Integer userIdInt) {
        this.userIdInt = userIdInt;
    }

    @Transient
    private Integer userIdInt;

    public NotificationSettings() {
    }

    public NotificationSettings(Integer id) {
        this.id = id;
    }

    public NotificationSettings(Integer id, Date createdAt) {
        this.id = id;
        this.createdAt = createdAt;
    }

    public NotificationSettings(Integer id, Integer userIdInt, Boolean appointmentConfirmation, Boolean appointmentReminder, Boolean appointmentCancellation, Boolean marketingEmails, Date updatedAt, Date createdAt) {
        this.id = id;
        this.userIdInt = userIdInt;
        this.appointmentConfirmation = appointmentConfirmation;
        this.appointmentReminder = appointmentReminder;
        this.appointmentCancellation = appointmentCancellation;
        this.marketingEmails = marketingEmails;
        this.updatedAt = updatedAt;
        this.createdAt = createdAt;
    }

    public NotificationSettings(Integer id, Boolean appointmentConfirmation, Boolean appointmentReminder, Boolean appointmentCancellation, Boolean marketingEmails) {
        this.id = id;
        this.appointmentConfirmation = appointmentConfirmation;
        this.appointmentReminder = appointmentReminder;
        this.appointmentCancellation = appointmentCancellation;
        this.marketingEmails = marketingEmails;
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

    public static Boolean updateNotificationSetting(NotificationSettings updatedSetting) {
        EntityManager em = emf.createEntityManager();

        try {

            StoredProcedureQuery spq = em.createStoredProcedureQuery("updateNotificationSetting");
            spq.registerStoredProcedureParameter("idIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("confIN", Boolean.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("remindIN", Boolean.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("cancellIN", Boolean.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("marketingIN", Boolean.class, ParameterMode.IN);

            spq.setParameter("idIN", updatedSetting.getId());
            spq.setParameter("confIN", updatedSetting.getAppointmentConfirmation());
            spq.setParameter("remindIN", updatedSetting.getAppointmentReminder());
            spq.setParameter("cancellIN", updatedSetting.getAppointmentCancellation());
            spq.setParameter("marketingIN", updatedSetting.getMarketingEmails());

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

    public static NotificationSettings getAllNotificationSettings(Integer userId) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getAllNotificationSettings");
            spq.registerStoredProcedureParameter("userIdIN", Integer.class, ParameterMode.IN);

            spq.setParameter("userIdIN", userId);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            // If no user found, return null
            if (resultList.isEmpty()) {
                return null;
            }

            Object[] record = resultList.get(0);

            NotificationSettings s = new NotificationSettings(
                    Integer.valueOf(record[0].toString()),
                    Integer.valueOf(record[1].toString()),
                    Boolean.parseBoolean(record[2].toString()),
                    Boolean.parseBoolean(record[3].toString()),
                    Boolean.parseBoolean(record[4].toString()),
                    Boolean.parseBoolean(record[5].toString()),
                    record[7] != null ? null : DateFormatterUtil.parseTimestamp(record[6].toString()),
                    DateFormatterUtil.parseTimestamp(record[7].toString())
            );

            return s;

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }
}
