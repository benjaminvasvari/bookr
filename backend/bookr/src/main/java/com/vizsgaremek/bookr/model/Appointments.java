/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.model;

import static com.vizsgaremek.bookr.model.Users.emf;
import static com.vizsgaremek.bookr.model.Users.formatter;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collection;
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
import javax.persistence.OneToMany;
import javax.persistence.ParameterMode;
import javax.persistence.StoredProcedureQuery;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;

/**
 *
 * @author vben
 */
@Entity
@Table(name = "appointments")
@XmlRootElement
@NamedQueries({
    @NamedQuery(name = "Appointments.findAll", query = "SELECT a FROM Appointments a"),
    @NamedQuery(name = "Appointments.findById", query = "SELECT a FROM Appointments a WHERE a.id = :id"),
    @NamedQuery(name = "Appointments.findByStartTime", query = "SELECT a FROM Appointments a WHERE a.startTime = :startTime"),
    @NamedQuery(name = "Appointments.findByEndTime", query = "SELECT a FROM Appointments a WHERE a.endTime = :endTime"),
    @NamedQuery(name = "Appointments.findByStatus", query = "SELECT a FROM Appointments a WHERE a.status = :status"),
    @NamedQuery(name = "Appointments.findByPrice", query = "SELECT a FROM Appointments a WHERE a.price = :price"),
    @NamedQuery(name = "Appointments.findByCurrency", query = "SELECT a FROM Appointments a WHERE a.currency = :currency"),
    @NamedQuery(name = "Appointments.findByCancelledAt", query = "SELECT a FROM Appointments a WHERE a.cancelledAt = :cancelledAt"),
    @NamedQuery(name = "Appointments.findByCreatedAt", query = "SELECT a FROM Appointments a WHERE a.createdAt = :createdAt"),
    @NamedQuery(name = "Appointments.findByUpdatedAt", query = "SELECT a FROM Appointments a WHERE a.updatedAt = :updatedAt")})
public class Appointments implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Basic(optional = false)
    @NotNull
    @Column(name = "start_time")
    @Temporal(TemporalType.TIMESTAMP)
    private Date startTime;
    @Basic(optional = false)
    @NotNull
    @Column(name = "end_time")
    @Temporal(TemporalType.TIMESTAMP)
    private Date endTime;
    @Size(max = 11)
    @Column(name = "status")
    private String status;
    @Lob
    @Size(max = 65535)
    @Column(name = "notes")
    private String notes;
    @Lob
    @Size(max = 65535)
    @Column(name = "internal_notes")
    private String internalNotes;
    // @Max(value=?)  @Min(value=?)//if you know range of your decimal fields consider using these annotations to enforce field validation
    @Column(name = "price")
    private BigDecimal price;
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 10)
    @Column(name = "currency")
    private String currency;
    @Lob
    @Size(max = 65535)
    @Column(name = "cancelled_reason")
    private String cancelledReason;
    @Column(name = "cancelled_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date cancelledAt;
    @Column(name = "created_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    @Column(name = "updated_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;
    @JoinColumn(name = "company_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Companies companyId;
    @JoinColumn(name = "service_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Services serviceId;
    @JoinColumn(name = "staff_id", referencedColumnName = "id")
    @ManyToOne
    private Staff staffId;
    @JoinColumn(name = "client_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Users clientId;
    @JoinColumn(name = "cancelled_by", referencedColumnName = "id")
    @ManyToOne
    private Users cancelledBy;
    @OneToMany(mappedBy = "appointmentId")
    private Collection<Reviews> reviewsCollection;

    @javax.persistence.Transient
    private String serviceName;

    @javax.persistence.Transient
    private Integer durationMinutes;

    @javax.persistence.Transient
    private String clientName;

    @javax.persistence.Transient
    private String clientPhone;

    @javax.persistence.Transient
    private String clientEmail;
    
    @javax.persistence.Transient
    private Integer companyIdInt;
    
    @javax.persistence.Transient
    private Integer serviceIdInt;
    
    @javax.persistence.Transient
    private Integer staffIdInt;
    
    @javax.persistence.Transient
    private Integer clientIdInt;
    
    @javax.persistence.Transient
    private Integer cancelledByInt;

    public Appointments() {
    }

    public Appointments(Integer id) {
        this.id = id;
    }

    public Appointments(Integer id, Date startTime, Date endTime, String currency) {
        this.id = id;
        this.startTime = startTime;
        this.endTime = endTime;
        this.currency = currency;
    }
    
    // getAppointmentsByStaff
    public Appointments(Integer id, Integer companyIdInt, Integer serviceIdInt, Integer staffIdInt, Integer clientIdInt, Date startTime, Date endTime, String status, String notes, String internalNotes, BigDecimal price, String currency, Integer cancelledByInt, String cancelledReason, Date cancelledAt, Date createdAt, Date updatedAt, String serviceName, Integer durationMinutes, String clientName, String clientPhone, String clientEmail) {
        this.id = id;
        this.companyIdInt = companyIdInt;
        this.serviceIdInt = serviceIdInt;
        this.staffIdInt = staffIdInt;
        this.clientIdInt = clientIdInt;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = status;
        this.notes = notes;
        this.internalNotes = internalNotes;
        this.price = price;
        this.currency = currency;
        this.cancelledByInt = cancelledByInt;
        this.cancelledReason = cancelledReason;
        this.cancelledAt = cancelledAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.serviceName = serviceName;
        this.durationMinutes = durationMinutes;
        this.clientName = clientName;
        this.clientPhone = clientPhone;
        this.clientEmail = clientEmail;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getInternalNotes() {
        return internalNotes;
    }

    public void setInternalNotes(String internalNotes) {
        this.internalNotes = internalNotes;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getCancelledReason() {
        return cancelledReason;
    }

    public void setCancelledReason(String cancelledReason) {
        this.cancelledReason = cancelledReason;
    }

    public Date getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(Date cancelledAt) {
        this.cancelledAt = cancelledAt;
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

    public Services getServiceId() {
        return serviceId;
    }

    public void setServiceId(Services serviceId) {
        this.serviceId = serviceId;
    }

    public Staff getStaffId() {
        return staffId;
    }

    public void setStaffId(Staff staffId) {
        this.staffId = staffId;
    }

    public Users getClientId() {
        return clientId;
    }

    public void setClientId(Users clientId) {
        this.clientId = clientId;
    }

    public Users getCancelledBy() {
        return cancelledBy;
    }

    public void setCancelledBy(Users cancelledBy) {
        this.cancelledBy = cancelledBy;
    }
    
    
    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }
    
    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }
    
    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }
    
    public String getClientPhone() {
        return clientPhone;
    }

    public void setClientPhone(String clientPhone) {
        this.clientPhone = clientPhone;
    }
    
    public String getClientEmail() {
        return clientEmail;
    }

    public void setClientEmail(String clientEmail) {
        this.clientEmail = clientEmail;
    }
    
    public Integer getCompanyIdInt() {
        return companyIdInt;
    }

    public void setCompanyIdInt(Integer companyIdInt) {
        this.companyIdInt = companyIdInt;
    }
    
    public Integer getServiceIdInt() {
        return serviceIdInt;
    }

    public void setServiceIdInt(Integer serviceIdInt) {
        this.serviceIdInt = serviceIdInt;
    }
    
    public Integer getStaffIdInt() {
        return staffIdInt;
    }

    public void setStaffIdInt(Integer staffIdInt) {
        this.staffIdInt = staffIdInt;
    }
    
    public Integer getClientIdInt() {
        return clientIdInt;
    }

    public void setClientIdInt(Integer clientIdInt) {
        this.clientIdInt = clientIdInt;
    }
    
    public Integer getCancelledByInt() {
        return cancelledByInt;
    }

    public void setCancelledByInt(Integer cancelledByInt) {
        this.cancelledByInt = cancelledByInt;
    }
   
    
    

    
    @XmlTransient
    public Collection<Reviews> getReviewsCollection() {
        return reviewsCollection;
    }

    public void setReviewsCollection(Collection<Reviews> reviewsCollection) {
        this.reviewsCollection = reviewsCollection;
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
        if (!(object instanceof Appointments)) {
            return false;
        }
        Appointments other = (Appointments) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.vizsgaremek.bookr.model.Appointments[ id=" + id + " ]";
    }

    public static ArrayList<Appointments> getAvalaibleTimeSlots(Integer companyId, Integer staffId, Date month) {
        EntityManager em = emf.createEntityManager();

        try {

            StoredProcedureQuery spq = em.createStoredProcedureQuery("getAvalaibleTimeSlots");

            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("staffIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("dateIN", Date.class, ParameterMode.IN);

            spq.setParameter("companyIdIN", companyId);
            spq.setParameter("staffIdIN", staffId);
            spq.setParameter("dateIN", month);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();
            ArrayList<Appointments> toReturn = new ArrayList();

            for (Object[] record : resultList) {

                Appointments a = new Appointments(
                        Integer.valueOf(record[0].toString()),
                        Integer.valueOf(record[1].toString()),
                        Integer.valueOf(record[2].toString()),
                        Integer.valueOf(record[3].toString()),
                        Integer.valueOf(record[4].toString()),
                        formatter.parse(record[5].toString()),
                        formatter.parse(record[6].toString()),
                        record[7].toString(),
                        record[8] != null ? record[8].toString() : null, // notes
                        record[9] != null ? record[9].toString() : null, // internalNotes
                        record[10] != null ? new BigDecimal(record[10].toString()) : null, // price
                        record[11].toString(),
                        record[12] != null ? Integer.valueOf(record[12].toString()) : null, // cancelledByInt
                        record[13] != null ? record[13].toString() : null,
                        record[14] != null ? formatter.parse(record[14].toString()) : null, // cancelledAt
                        formatter.parse(record[15].toString()),
                        record[16] != null ? formatter.parse(record[16].toString()) : null, // updatedAt
                        record[17].toString(),
                        Integer.valueOf(record[18].toString()),
                        record[19].toString(),
                        record[20].toString(),
                        record[21].toString()
                );

                toReturn.add(a);

            }

            return toReturn;

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;

        } finally {
            em.close();
        }
    }
}
