/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.model;

import com.vizsgaremek.bookr.DTO.OwnerPanelDTO;
import static com.vizsgaremek.bookr.model.Users.emf;
import java.io.Serializable;
import java.math.BigDecimal;
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
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;

/**
 *
 * @author vben
 */
@Entity
@Table(name = "services")
@XmlRootElement
@NamedQueries({
    @NamedQuery(name = "Services.findAll", query = "SELECT s FROM Services s"),
    @NamedQuery(name = "Services.findById", query = "SELECT s FROM Services s WHERE s.id = :id"),
    @NamedQuery(name = "Services.findByName", query = "SELECT s FROM Services s WHERE s.name = :name"),
    @NamedQuery(name = "Services.findByDurationMinutes", query = "SELECT s FROM Services s WHERE s.durationMinutes = :durationMinutes"),
    @NamedQuery(name = "Services.findByPrice", query = "SELECT s FROM Services s WHERE s.price = :price"),
    @NamedQuery(name = "Services.findByCurrency", query = "SELECT s FROM Services s WHERE s.currency = :currency"),
    @NamedQuery(name = "Services.findByIsActive", query = "SELECT s FROM Services s WHERE s.isActive = :isActive"),
    @NamedQuery(name = "Services.findByCreatedAt", query = "SELECT s FROM Services s WHERE s.createdAt = :createdAt"),
    @NamedQuery(name = "Services.findByUpdatedAt", query = "SELECT s FROM Services s WHERE s.updatedAt = :updatedAt"),
    @NamedQuery(name = "Services.findByDeletedAt", query = "SELECT s FROM Services s WHERE s.deletedAt = :deletedAt"),
    @NamedQuery(name = "Services.findByIsDeleted", query = "SELECT s FROM Services s WHERE s.isDeleted = :isDeleted")})
public class Services implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 255)
    @Column(name = "name")
    private String name;
    @Lob
    @Size(max = 65535)
    @Column(name = "description")
    private String description;
    @Basic(optional = false)
    @NotNull
    @Column(name = "duration_minutes")
    private int durationMinutes;
    // @Max(value=?)  @Min(value=?)//if you know range of your decimal fields consider using these annotations to enforce field validation
    @Column(name = "price")
    private BigDecimal price;
    @Size(max = 10)
    @Column(name = "currency")
    private String currency;
    @Column(name = "is_active")
    private Boolean isActive;
    @Column(name = "created_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    @Column(name = "updated_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;
    @Column(name = "deleted_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date deletedAt;
    @Column(name = "is_deleted")
    private Boolean isDeleted;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "serviceId")
    private Collection<Appointments> appointmentsCollection;
    @JoinColumn(name = "company_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Companies companyId;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "serviceId")
    private Collection<ServiceCategoryMap> serviceCategoryMapCollection;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "serviceId")
    private Collection<StaffServices> staffServicesCollection;

    @Transient
    private Integer companyIdInt;

    public Services() {
    }

    public Services(Integer id) {
        this.id = id;
    }

    public Services(Integer id, String name, int durationMinutes) {
        this.id = id;
        this.name = name;
        this.durationMinutes = durationMinutes;
    }

    public Services(Integer id, Integer companyIdInt, String name, int durationMinutes, BigDecimal price, Boolean isDeleted) {
        this.id = id;
        this.companyIdInt = companyIdInt;
        this.name = name;
        this.durationMinutes = durationMinutes;
        this.price = price;
        this.isDeleted = isDeleted;

    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(int durationMinutes) {
        this.durationMinutes = durationMinutes;
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

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
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

    public Date getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(Date deletedAt) {
        this.deletedAt = deletedAt;
    }

    public Boolean getIsDeleted() {
        return isDeleted;
    }

    public void setIsDeleted(Boolean isDeleted) {
        this.isDeleted = isDeleted;
    }

    @XmlTransient
    public Collection<Appointments> getAppointmentsCollection() {
        return appointmentsCollection;
    }

    public void setAppointmentsCollection(Collection<Appointments> appointmentsCollection) {
        this.appointmentsCollection = appointmentsCollection;
    }

    public Companies getCompanyId() {
        return companyId;
    }

    public void setCompanyId(Companies companyId) {
        this.companyId = companyId;
    }

    @XmlTransient
    public Collection<ServiceCategoryMap> getServiceCategoryMapCollection() {
        return serviceCategoryMapCollection;
    }

    public void setServiceCategoryMapCollection(Collection<ServiceCategoryMap> serviceCategoryMapCollection) {
        this.serviceCategoryMapCollection = serviceCategoryMapCollection;
    }

    @XmlTransient
    public Collection<StaffServices> getStaffServicesCollection() {
        return staffServicesCollection;
    }

    public void setStaffServicesCollection(Collection<StaffServices> staffServicesCollection) {
        this.staffServicesCollection = staffServicesCollection;
    }

    // CUSTOM GET/SET
    public Integer getCompanyIdInt() {
        return companyIdInt;
    }

    public void setCompanyIdInt(Integer companyIdInt) {
        this.companyIdInt = companyIdInt;
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
        if (!(object instanceof Services)) {
            return false;
        }
        Services other = (Services) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.vizsgaremek.bookr.model.Services[ id=" + id + " ]";
    }

    public static Services getServiceShort(Integer id) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getServiceShort");
            spq.registerStoredProcedureParameter("idIN", Integer.class, ParameterMode.IN);
            spq.setParameter("idIN", id);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return null;
            }

            Object[] record = resultList.get(0);

            // Create Companies object with basic data
            Services service = new Services(
                    Integer.valueOf(record[0].toString()),
                    Integer.valueOf(record[1].toString()),
                    record[2].toString(),
                    Integer.valueOf(record[3].toString()),
                    new BigDecimal(record[4].toString()),
                    Boolean.valueOf(record[5].toString())
            );

            return service;

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static ArrayList<OwnerPanelDTO.SalesTopServicesDTO> getSalesTopServices(Integer companyId, String period) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getSalesTopServices");

            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("periodIN", String.class, ParameterMode.IN);

            spq.setParameter("companyIdIN", companyId);
            spq.setParameter("periodIN", period);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();
            ArrayList<OwnerPanelDTO.SalesTopServicesDTO> toReturn = new ArrayList<>();

            for (Object[] record : resultList) {
                OwnerPanelDTO.SalesTopServicesDTO s = new OwnerPanelDTO.SalesTopServicesDTO(
                        Integer.valueOf(record[0].toString()),
                        record[1].toString(),
                        Integer.valueOf(record[0].toString()),
                        Double.parseDouble(record[2].toString()),
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
