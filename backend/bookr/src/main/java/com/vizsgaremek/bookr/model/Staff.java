/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.model;

import static com.vizsgaremek.bookr.model.Users.emf;
import static com.vizsgaremek.bookr.model.Users.formatter;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import javax.persistence.Basic;
import javax.persistence.CascadeType;
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
import javax.validation.constraints.Size;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;

/**
 *
 * @author vben
 */
@Entity
@Table(name = "staff")
@XmlRootElement
@NamedQueries({
    @NamedQuery(name = "Staff.findAll", query = "SELECT s FROM Staff s"),
    @NamedQuery(name = "Staff.findById", query = "SELECT s FROM Staff s WHERE s.id = :id"),
    @NamedQuery(name = "Staff.findByDisplayName", query = "SELECT s FROM Staff s WHERE s.displayName = :displayName"),
    @NamedQuery(name = "Staff.findByColor", query = "SELECT s FROM Staff s WHERE s.color = :color"),
    @NamedQuery(name = "Staff.findByIsActive", query = "SELECT s FROM Staff s WHERE s.isActive = :isActive"),
    @NamedQuery(name = "Staff.findByIsDeleted", query = "SELECT s FROM Staff s WHERE s.isDeleted = :isDeleted"),
    @NamedQuery(name = "Staff.findByCreatedAt", query = "SELECT s FROM Staff s WHERE s.createdAt = :createdAt"),
    @NamedQuery(name = "Staff.findByUpdatedAt", query = "SELECT s FROM Staff s WHERE s.updatedAt = :updatedAt")})
public class Staff implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Size(max = 255)
    @Column(name = "display_name")
    private String displayName;
    @Lob
    @Size(max = 65535)
    @Column(name = "specialties")
    private String specialties;
    @Lob
    @Size(max = 65535)
    @Column(name = "bio")
    private String bio;
    @Size(max = 7)
    @Column(name = "color")
    private String color;
    @Column(name = "is_active")
    private Boolean isActive;
    @Column(name = "is_deleted")
    private Boolean isDeleted;
    @Column(name = "created_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    @Column(name = "updated_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "staffId")
    private Collection<Appointments> appointmentsCollection;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "staffId")
    private Collection<StaffExceptions> staffExceptionsCollection;
    @JoinColumn(name = "company_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Companies companyId;
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Users userId;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "staffId")
    private Collection<StaffServices> staffServicesCollection;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "staffId")
    private Collection<StaffWorkingHours> staffWorkingHoursCollection;

    @Transient
    private Integer userIdInt;

    @Transient
    private Integer companyIdInt;

    @Transient
    private Integer servicesCount;

    @Transient
    private String imageUrl;

    @Transient
    private String firstName;

    @Transient
    private String lastName;

    public Staff() {
    }

    public Staff(Integer id) {
        this.id = id;
    }

    // getFilteredStaffByServices
    public Staff(Integer id, Integer userIdInt, String displayName, String specialties, String bio, Boolean isActive, Integer companyIdInt, String firstName, String lastName, String imageUrl, Integer servicesCount) {
        this.id = id;
        this.userIdInt = userIdInt;
        this.displayName = displayName;
        this.specialties = specialties;
        this.bio = bio;
        this.isActive = isActive;
        this.companyIdInt = companyIdInt;
        this.firstName = firstName;
        this.lastName = lastName;
        this.imageUrl = imageUrl;
        this.servicesCount = servicesCount;
    }

    // getStaffShort
    public Staff(Integer id, Integer userIdInt, Integer companyIdInt, String displayName, Boolean isActive, Boolean isDeleted, String imageUrl) {
        this.id = id;
        this.userIdInt = userIdInt;
        this.companyIdInt = companyIdInt;
        this.displayName = displayName;
        this.isActive = isActive;
        this.isDeleted = isDeleted;
        this.imageUrl = imageUrl;
    }

    // getAllActiveStaffByCompany
    public Staff(Integer id, Integer userIdInt, String displayName, String specialties, String bio, String color, Date createdAt, Date updatedAt, String firstName, String lastName, String imageUrl) {
        this.id = id;
        this.userIdInt = userIdInt;
        this.displayName = displayName;
        this.specialties = specialties;
        this.bio = bio;
        this.color = color;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.firstName = firstName;
        this.lastName = lastName;
        this.imageUrl = imageUrl;

    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getSpecialties() {
        return specialties;
    }

    public void setSpecialties(String specialties) {
        this.specialties = specialties;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Boolean getIsDeleted() {
        return isDeleted;
    }

    public void setIsDeleted(Boolean isDeleted) {
        this.isDeleted = isDeleted;
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

    @XmlTransient
    public Collection<Appointments> getAppointmentsCollection() {
        return appointmentsCollection;
    }

    public void setAppointmentsCollection(Collection<Appointments> appointmentsCollection) {
        this.appointmentsCollection = appointmentsCollection;
    }

    @XmlTransient
    public Collection<StaffExceptions> getStaffExceptionsCollection() {
        return staffExceptionsCollection;
    }

    public void setStaffExceptionsCollection(Collection<StaffExceptions> staffExceptionsCollection) {
        this.staffExceptionsCollection = staffExceptionsCollection;
    }

    public Companies getCompanyId() {
        return companyId;
    }

    public void setCompanyId(Companies companyId) {
        this.companyId = companyId;
    }

    public Users getUserId() {
        return userId;
    }

    public void setUserId(Users userId) {
        this.userId = userId;
    }

    // CUSTOM GET/SET
    public Integer getUserIdInt() {
        return userIdInt;
    }

    public void setUserIdInt(Integer userIdInt) {
        this.userIdInt = userIdInt;
    }

    public Integer getCompanyIdInt() {
        return companyIdInt;
    }

    public void setCompanyIdInt(Integer companyIdInt) {
        this.companyIdInt = companyIdInt;
    }

    public Integer getServicesCount() {
        return servicesCount;
    }

    public void setServicesCount(Integer servicesCount) {
        this.servicesCount = servicesCount;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    @XmlTransient
    public Collection<StaffServices> getStaffServicesCollection() {
        return staffServicesCollection;
    }

    public void setStaffServicesCollection(Collection<StaffServices> staffServicesCollection) {
        this.staffServicesCollection = staffServicesCollection;
    }

    @XmlTransient
    public Collection<StaffWorkingHours> getStaffWorkingHoursCollection() {
        return staffWorkingHoursCollection;
    }

    public void setStaffWorkingHoursCollection(Collection<StaffWorkingHours> staffWorkingHoursCollection) {
        this.staffWorkingHoursCollection = staffWorkingHoursCollection;
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
        if (!(object instanceof Staff)) {
            return false;
        }
        Staff other = (Staff) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.vizsgaremek.bookr.model.Staff[ id=" + id + " ]";
    }

    public static ArrayList<Staff> getFilteredStaffByServices(Integer companyId, String serviceIds) {
        EntityManager em = emf.createEntityManager();

        try {

            StoredProcedureQuery spq = em.createStoredProcedureQuery("getStaffByCompanyAndServices");

            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("serviceIdsIN", String.class, ParameterMode.IN);

            spq.setParameter("companyIdIN", companyId);
            spq.setParameter("serviceIdsIN", serviceIds);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();
            ArrayList<Staff> toReturn = new ArrayList();

            for (Object[] record : resultList) {

                Staff s = new Staff(
                        Integer.valueOf(record[0].toString()),
                        Integer.valueOf(record[1].toString()),
                        record[2].toString(),
                        record[3] != null ? record[3].toString() : null,
                        record[4] != null ? record[4].toString() : null,
                        Boolean.parseBoolean(record[5].toString()),
                        Integer.valueOf(record[6].toString()),
                        record[7].toString(),
                        record[8].toString(),
                        record[9] != null ? record[9].toString() : null,
                        Integer.valueOf(record[10].toString())
                );

                toReturn.add(s);

            }

            return toReturn;

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;

        } finally {
            em.close();
        }
    }

    public static Staff getStaffShort(Integer staffId) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getStaffShort");

            spq.registerStoredProcedureParameter("staffIdIN", Integer.class, ParameterMode.IN);

            spq.setParameter("staffIdIN", staffId);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return null;
            }

            // Csak az első rekord kell (LIMIT 1 a stored procedure-ben)
            Object[] record = resultList.get(0);

            Staff s = new Staff(
                    Integer.valueOf(record[0].toString()),
                    Integer.valueOf(record[1].toString()),
                    Integer.valueOf(record[2].toString()),
                    record[3].toString(),
                    Boolean.parseBoolean(record[4].toString()),
                    Boolean.parseBoolean(record[5].toString()),
                    record[6] == null ? null : record[6].toString() // imageUrl
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

    public static ArrayList<Staff> getAllActiveStaffByCompany(Integer companyId) {
        EntityManager em = emf.createEntityManager();

        try {

            StoredProcedureQuery spq = em.createStoredProcedureQuery("getAllActiveStaffByCompany");

            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);

            spq.setParameter("companyIdIN", companyId);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();
            ArrayList<Staff> toReturn = new ArrayList();

            for (Object[] record : resultList) {

                Staff s = new Staff(
                        Integer.valueOf(record[0].toString()),
                        Integer.valueOf(record[1].toString()),
                        record[2].toString(),
                        record[3] != null ? record[3].toString() : null,
                        record[4] != null ? record[4].toString() : null,
                        record[5] != null ? record[5].toString() : null,
                        formatter.parse(record[6].toString()),
                        record[7] != null ? formatter.parse(record[7].toString()) : null,
                        record[8].toString(),
                        record[9].toString(),
                        record[10] != null ? record[10].toString() : null
                );

                toReturn.add(s);

            }

            return toReturn;

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;

        } finally {
            em.close();
        }
    }

    public static Staff createStaff(Integer userId, Integer companyId, String position) {
        EntityManager em = emf.createEntityManager();

        try {

            StoredProcedureQuery spq = em.createStoredProcedureQuery("createStaff");

            spq.registerStoredProcedureParameter("userIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("specialtiesIN", String.class, ParameterMode.IN);

            spq.setParameter("userIdIN", userId);
            spq.setParameter("companyIdIN", companyId);
            spq.setParameter("specialtiesIN", position);

            spq.execute();

            Integer staffId = Integer.valueOf(spq.getSingleResult().toString());

            Staff staff = new Staff(
                    staffId
            );

            return staff;

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;

        } finally {
            em.close();
        }
    }
}
