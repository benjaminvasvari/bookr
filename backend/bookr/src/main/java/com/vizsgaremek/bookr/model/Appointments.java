/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.model;

import com.vizsgaremek.bookr.DTO.OwnerPanelDTO;
import static com.vizsgaremek.bookr.model.OpeningHours.timeFormatter;
import static com.vizsgaremek.bookr.model.Users.emf;
import static com.vizsgaremek.bookr.model.Users.formatter;
import java.io.Serializable;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
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
import javax.persistence.Transient;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;
import org.json.JSONArray;
import org.json.JSONObject;

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
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 11)
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
    @Basic(optional = false)
    @NotNull
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
    @JoinColumn(name = "service_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Services serviceId;
    @JoinColumn(name = "staff_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Staff staffId;
    @JoinColumn(name = "client_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Users clientId;
    @JoinColumn(name = "cancelled_by", referencedColumnName = "id")
    @ManyToOne
    private Users cancelledBy;
    @OneToMany(mappedBy = "appointmentId")
    private Collection<Reviews> reviewsCollection;

    @Transient
    private String serviceName;

    @Transient
    private Integer durationMinutes;

    @Transient
    private String clientName;

    @Transient
    private String clientPhone;

    @Transient
    private String clientEmail;

    @Transient
    private Integer companyIdInt;

    @Transient
    private String companyName;

    @Transient
    private String staffName;

    @Transient
    private String companyAddress;

    @Transient
    private String companyPhone;

    @Transient
    private String companyEmail;

    @Transient
    private Integer serviceIdInt;

    @Transient
    private Integer staffIdInt;

    @Transient
    private Integer clientIdInt;

    @Transient
    private Integer cancelledByInt;

    @Transient
    private Date date;

    @Transient
    private String dayOfWeek;

    @Transient
    private String reason;

    @Transient
    private String imageUrl;

    @Transient
    private Boolean isAvailable;

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

    // 
    public Appointments(Date date, String dayOfWeek, String reason) {
        this.date = date;
        this.dayOfWeek = dayOfWeek;
        this.reason = reason;

    }

    public Appointments(Date startTime, Date endTime, Boolean isAvailable, String reason) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.isAvailable = isAvailable;
        this.reason = reason;
    }

    public Appointments(Integer id, Date startTime, Date endTime, Integer serviceIdInt, Integer durationMinutes) {
        this.id = id;
        this.startTime = startTime;
        this.endTime = endTime;
        this.serviceIdInt = serviceIdInt;
        this.durationMinutes = durationMinutes;
    }

    public Appointments(Integer id, String companyName, String serviceName, String staffName, Integer durationMinutes, String companyAddress, String companyPhone, String companyEmail) {
        this.id = id;
        this.companyName = companyName;
        this.serviceName = serviceName;
        this.staffName = staffName;
        this.durationMinutes = durationMinutes;
        this.companyAddress = companyAddress;
        this.companyPhone = companyPhone;
        this.companyEmail = companyEmail;
    }

    public Appointments(Integer id, Date startTime, String serviceName, String clientName, String imageUrl) {
        this.id = id;
        this.startTime = startTime;
        this.serviceName = serviceName;
        this.clientName = clientName;
        this.imageUrl = imageUrl;
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

    // CUSTOMS
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

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getStaffName() {
        return staffName;
    }

    public void setStaffName(String staffName) {
        this.staffName = staffName;
    }

    public String getCompanyAddress() {
        return companyAddress;
    }

    public void setCompanyAddress(String companyAddress) {
        this.companyAddress = companyAddress;
    }

    public String getCompanyPhone() {
        return companyPhone;
    }

    public void setCompanyPhone(String companyPhone) {
        this.companyPhone = companyPhone;
    }

    public String getCompanyEmail() {
        return companyEmail;
    }

    public void setCompanyEmail(String companyEmail) {
        this.companyEmail = companyEmail;
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

    public Date getDate() {
        return date;
    }

    public void setDate(Date date) {
        this.date = date;
    }

    public String getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(String dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Boolean getIsAvailable() {
        return isAvailable;
    }

    public void setIsAvailable(Boolean isAvailable) {
        this.isAvailable = isAvailable;
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

    public static ArrayList<Appointments> getUnavailableDatesInRange(Integer companyId, Integer staffId, LocalDate dateFrom, LocalDate dateTo) {

        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getUnavailableDatesInRange");

            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("staffIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("dateFromIN", Date.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("dateToIN", Date.class, ParameterMode.IN);

            spq.setParameter("companyIdIN", companyId);
            spq.setParameter("staffIdIN", staffId);
            spq.setParameter("dateFromIN", java.sql.Date.valueOf(dateFrom));
            spq.setParameter("dateToIN", java.sql.Date.valueOf(dateTo));

            spq.execute();

            List<Object[]> resultList = spq.getResultList();
            ArrayList<Appointments> toReturn = new ArrayList<>();

            for (Object[] record : resultList) {

                Appointments a = new Appointments(
                        (Date) record[0],
                        record[1].toString(),
                        record[2] != null ? record[2].toString() : ""
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

    public static Appointments getWorkingHoursForDate(Integer companyId, Integer staffId, Date date) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getWorkingHoursForDate");

            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("staffIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("dateIN", Date.class, ParameterMode.IN);

            spq.setParameter("companyIdIN", companyId);
            spq.setParameter("staffIdIN", staffId);
            spq.setParameter("dateIN", date);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return null;
            }

            // Csak az első rekord kell (LIMIT 1 a stored procedure-ben)
            Object[] record = resultList.get(0);

            Appointments workingHours = new Appointments(
                    record[0] != null ? timeFormatter.parse(record[0].toString()) : null, // startTime
                    record[1] != null ? timeFormatter.parse(record[1].toString()) : null, // endTime
                    Boolean.parseBoolean(record[2].toString()),
                    record[3] != null ? record[3].toString() : null // reason
            );

            return workingHours;

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static ArrayList<Appointments> getOccupiedSlotsForDate(Integer staffId, Date date) {
        EntityManager em = emf.createEntityManager();
        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getOccupiedSlotsForDate");
            spq.registerStoredProcedureParameter("staffIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("dateIN", Date.class, ParameterMode.IN);
            spq.setParameter("staffIdIN", staffId);
            spq.setParameter("dateIN", date);
            spq.execute();

            List<Object[]> resultList = spq.getResultList();
            ArrayList<Appointments> toReturn = new ArrayList<>();

            for (Object[] record : resultList) {
                Appointments a = new Appointments();

                // appointment_id
                a.setId(Integer.valueOf(record[0].toString()));

                // start_time és end_time - Timestamp típusként jön vissza
                Timestamp startTimestamp = (Timestamp) record[1];
                Timestamp endTimestamp = (Timestamp) record[2];
                a.setStartTime(new Date(startTimestamp.getTime()));
                a.setEndTime(new Date(endTimestamp.getTime()));

                // service_id
                a.setServiceIdInt(Integer.valueOf(record[3].toString()));

                // duration_minutes
                a.setDurationMinutes(Integer.valueOf(record[6].toString()));

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

    public static Integer createAppointment(Integer companyId, Integer serviceId, Integer staffId,
            Integer clientId, Timestamp startTime, Timestamp endTime,
            String notes, BigDecimal price) {
        EntityManager em = emf.createEntityManager();
        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("createAppointment");

            // IN paraméterek
            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("serviceIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("staffIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("clientIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("startTimeIN", Timestamp.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("endTimeIN", Timestamp.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("notesIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("priceIN", BigDecimal.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("currencyIN", String.class, ParameterMode.IN);

            // OUT paraméter ← ÚJ
            spq.registerStoredProcedureParameter("newAppointmentIdOUT", Integer.class, ParameterMode.OUT);

            spq.setParameter("companyIdIN", companyId);
            spq.setParameter("serviceIdIN", serviceId);
            spq.setParameter("staffIdIN", staffId);
            spq.setParameter("clientIdIN", clientId);
            spq.setParameter("startTimeIN", startTime);
            spq.setParameter("endTimeIN", endTime);
            spq.setParameter("notesIN", notes);
            spq.setParameter("priceIN", price);
            spq.setParameter("currencyIN", "HUF");

            spq.execute();

            // OUT paraméterből olvassuk ki az ID-t
            Integer appointmentId = (Integer) spq.getOutputParameterValue("newAppointmentIdOUT");

            if (appointmentId == null) {
                System.err.println("createAppointment: Failed to create appointment");
                return null;
            }

            System.out.println("Successfully created appointment with ID: " + appointmentId);
            return appointmentId;

        } catch (Exception ex) {
            System.err.println("Error in createAppointment: " + ex.getMessage());
            ex.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static Appointments getInfoForBookingEmail(Integer appointmentId) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getInfoForBookingEmail");

            spq.registerStoredProcedureParameter("appointmentIdIN", Integer.class, ParameterMode.IN);

            spq.setParameter("appointmentIdIN", appointmentId);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return null;
            }

            // Csak az első rekord kell (LIMIT 1 a stored procedure-ben)
            Object[] record = resultList.get(0);

            Appointments workingHours = new Appointments(
                    Integer.valueOf(record[0].toString()),
                    record[1].toString(),
                    record[2].toString(),
                    record[3].toString(),
                    Integer.valueOf(record[4].toString()),
                    record[5].toString(),
                    record[6].toString(),
                    record[7].toString()
            );

            return workingHours;

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static JSONObject getAppointmentsByClient(Integer clientId, Integer page, Integer amount, Boolean isUpcoming) {
        EntityManager em = emf.createEntityManager();
        SimpleDateFormat dateFormatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

        try {

            StoredProcedureQuery spq = em.createStoredProcedureQuery("getAppointmentsByClient");
            spq.registerStoredProcedureParameter("clientIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("isUpcomingIN", Boolean.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("limitIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("offsetIN", Integer.class, ParameterMode.IN);

            spq.registerStoredProcedureParameter("countOUT", Integer.class, ParameterMode.OUT);

            spq.setParameter("clientIdIN", clientId);
            spq.setParameter("isUpcomingIN", isUpcoming);
            spq.setParameter("limitIN", page);
            spq.setParameter("offsetIN", (page - 1) * amount);

            spq.execute();

            int count = Integer.parseInt(spq.getOutputParameterValue("countOUT").toString());

            List<Object[]> resultList = spq.getResultList();
            JSONObject toReturn = new JSONObject();
            JSONArray appointments = new JSONArray();

            for (Object[] record : resultList) {

                JSONObject a = new JSONObject();

                a.put("appointmentId", Integer.valueOf(record[0].toString()));
                a.put("companyId", Integer.valueOf(record[1].toString()));
                a.put("staffId", Integer.valueOf(record[2].toString()));
                a.put("clientId", Integer.valueOf(record[3].toString()));
                a.put("serviceId", Integer.valueOf(record[4].toString()));
                a.put("startTime", dateFormatter.format((java.sql.Timestamp) record[5]));
                a.put("endTime", dateFormatter.format((java.sql.Timestamp) record[6]));
                a.put("status", record[7].toString());
                a.put("createdAt", dateFormatter.format((java.sql.Timestamp) record[8]));
                a.put("updatedAt", record[9] != null ? dateFormatter.format((java.sql.Timestamp) record[9]) : null);

                appointments.put(a);
            }

            toReturn.put("result", appointments);
            toReturn.put("appointmentsCount", count);

            return toReturn;

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static OwnerPanelDTO.WeeklyRevenueDTO getWeeklyRevenue(Integer companyId) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getDashboardWeeklyRevenue");

            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);

            spq.setParameter("companyIdIN", companyId);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return null;
            }

            Object[] record = resultList.get(0);

            OwnerPanelDTO.WeeklyRevenueDTO weeklyRevenue = new OwnerPanelDTO.WeeklyRevenueDTO(
                    record[0].toString(),
                    record[1].toString(),
                    record[2].toString()
            );

            return weeklyRevenue;

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static OwnerPanelDTO.ActiveClientsDTO getActiveClients(Integer companyId) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getDashboardActiveClients");

            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);

            spq.setParameter("companyIdIN", companyId);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return null;
            }

            Object[] record = resultList.get(0);

            OwnerPanelDTO.ActiveClientsDTO activeClients = new OwnerPanelDTO.ActiveClientsDTO(
                    Integer.valueOf(record[0].toString()),
                    Integer.valueOf(record[1].toString())
            );

            return activeClients;

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static ArrayList<OwnerPanelDTO.UpcomingAppointmentsDTO> getDashboardUpcomingAppointments(Integer companyId, Integer limit) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getDashboardUpcomingAppointments");
            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("limitIN", Integer.class, ParameterMode.IN);

            spq.setParameter("companyIdIN", companyId);
            spq.setParameter("limitIN", limit);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();
            ArrayList<OwnerPanelDTO.UpcomingAppointmentsDTO> toReturn = new ArrayList<>();

            for (Object[] record : resultList) {
                OwnerPanelDTO.UpcomingAppointmentsDTO a = new OwnerPanelDTO.UpcomingAppointmentsDTO(
                        Integer.valueOf(record[0].toString()),
                        record[1].toString(),
                        record[2].toString(),
                        record[3].toString(),
                        record[4].toString(),
                        record[5].toString(),
                        record[6].toString()
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

    public static OwnerPanelDTO.TodayBookingsCountDTO getTodayBookingsCount(Integer companyId) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getDashboardTodayBookingsCount");

            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);

            spq.setParameter("companyIdIN", companyId);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return null;
            }

            Object[] record = resultList.get(0);

            OwnerPanelDTO.TodayBookingsCountDTO todayBookingsCOunt = new OwnerPanelDTO.TodayBookingsCountDTO(
                    Integer.valueOf(record[0].toString()),
                    Integer.valueOf(record[1].toString())
            );

            return todayBookingsCOunt;

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static ArrayList<OwnerPanelDTO.AllFutureAppointmentsByCompanyDTO> getAllFutureAppointmentsByCompany(Integer companyId) {
        EntityManager em = emf.createEntityManager();
        DateTimeFormatter dateOnlyFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        SimpleDateFormat timeParser = new SimpleDateFormat("HH:mm:ss");

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getAllFutureAppointmentsByCompany");
            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);
            spq.setParameter("companyIdIN", companyId);
            spq.execute();

            List<Object[]> resultList = spq.getResultList();
            ArrayList<OwnerPanelDTO.AllFutureAppointmentsByCompanyDTO> toReturn = new ArrayList<>();

            for (Object[] record : resultList) {
                OwnerPanelDTO.AllFutureAppointmentsByCompanyDTO a = new OwnerPanelDTO.AllFutureAppointmentsByCompanyDTO(
                        Integer.valueOf(record[0].toString()),
                        LocalDate.parse(record[1].toString(), dateOnlyFormatter),
                        timeParser.parse(record[2].toString()), // "12:00:00"
                        timeParser.parse(record[3].toString()), // "13:00:00"
                        record[4].toString(),
                        record[5].toString(),
                        record[6] != null ? record[6].toString() : null,
                        record[7].toString(),
                        record[8] != null ? record[8].toString() : null,
                        Integer.valueOf(record[9].toString()),
                        record[10].toString(),
                        Double.parseDouble(record[11].toString()),
                        record[12].toString(),
                        formatter.parse(record[13].toString()) // created_at még teljes datetime
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

    public static ArrayList<Appointments> getUpcomingAppointmentsByStaffLimited(Integer staffId, Integer limit) {
        EntityManager em = emf.createEntityManager();
        DateTimeFormatter dateOnlyFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        SimpleDateFormat timeParser = new SimpleDateFormat("HH:mm:ss");

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getUpcomingAppointmentsByStaffLimited");
            spq.registerStoredProcedureParameter("staffIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("limitIN", Integer.class, ParameterMode.IN);

            spq.setParameter("staffIdIN", staffId);
            spq.setParameter("limitIN", limit);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();
            ArrayList<Appointments> toReturn = new ArrayList<>();

            for (Object[] record : resultList) {
                Appointments a = new Appointments(
                        Integer.valueOf(record[0].toString()),
                        timeParser.parse(record[1].toString()), // "12:00:00"
                        record[2].toString(),
                        record[3].toString(),
                        record[4] != null ? record[4].toString() : null
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

    public static OwnerPanelDTO.SalesOverviewRevenueDTO getSalesOverviewRevenueByCompany(Integer companyId, String period) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getSalesOverviewRevenue");

            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("periodIN", String.class, ParameterMode.IN);

            spq.setParameter("companyIdIN", companyId);
            spq.setParameter("periodIN", period);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return null;
            }

            Object[] record = resultList.get(0);

            OwnerPanelDTO.SalesOverviewRevenueDTO dolog = new OwnerPanelDTO.SalesOverviewRevenueDTO(
                    Double.parseDouble(record[0].toString()),
                    Double.parseDouble(record[1].toString()),
                    record[2].toString()
            );

            return dolog;

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static OwnerPanelDTO.SalesOverviewAvgBasketDTO getSalesOverviewAvgBasket(Integer companyId, String period) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getSalesOverviewAvgBasket");

            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("periodIN", String.class, ParameterMode.IN);

            spq.setParameter("companyIdIN", companyId);
            spq.setParameter("periodIN", period);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return null;
            }

            Object[] record = resultList.get(0);

            OwnerPanelDTO.SalesOverviewAvgBasketDTO dolog = new OwnerPanelDTO.SalesOverviewAvgBasketDTO(
                    Integer.valueOf(record[0].toString()),
                    Integer.valueOf(record[1].toString()),
                    record[2].toString()
            );

            return dolog;

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static OwnerPanelDTO.SalesOverviewBookingsCount getSalesOverviewBookingsCount(Integer companyId, String period) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getSalesOverviewBookingsCount");

            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("periodIN", String.class, ParameterMode.IN);

            spq.setParameter("companyIdIN", companyId);
            spq.setParameter("periodIN", period);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return null;
            }

            Object[] record = resultList.get(0);

            OwnerPanelDTO.SalesOverviewBookingsCount dolog = new OwnerPanelDTO.SalesOverviewBookingsCount(
                    Integer.valueOf(record[0].toString()),
                    Integer.valueOf(record[1].toString())
            );

            return dolog;

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static OwnerPanelDTO.SalesOverviewReturningClientsDTO getSalesOverviewReturningClients(Integer companyId, String period) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getSalesOverviewReturningClients");

            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("periodIN", String.class, ParameterMode.IN);

            spq.setParameter("companyIdIN", companyId);
            spq.setParameter("periodIN", period);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return null;
            }

            Object[] record = resultList.get(0);

            OwnerPanelDTO.SalesOverviewReturningClientsDTO dolog = new OwnerPanelDTO.SalesOverviewReturningClientsDTO(
                    Integer.valueOf(record[0].toString()),
                    Integer.valueOf(record[1].toString()),
                    Integer.valueOf(record[2].toString()),
                    Integer.valueOf(record[3].toString())
            );

            return dolog;

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static ArrayList<OwnerPanelDTO.SalesRevenueChartDTO> getSalesRevenueChart(Integer companyId, String period) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getSalesRevenueChart");

            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("periodIN", String.class, ParameterMode.IN);

            spq.setParameter("companyIdIN", companyId);
            spq.setParameter("periodIN", period);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();
            ArrayList<OwnerPanelDTO.SalesRevenueChartDTO> toReturn = new ArrayList<>();

            for (Object[] record : resultList) {
                OwnerPanelDTO.SalesRevenueChartDTO s = new OwnerPanelDTO.SalesRevenueChartDTO(
                        record[0].toString(),
                        record[1].toString(),
                        record[2] != null ? Double.parseDouble(record[2].toString()) : null,
                        record[3].toString()
                );
                toReturn.add(s);
            }
            return toReturn;

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
