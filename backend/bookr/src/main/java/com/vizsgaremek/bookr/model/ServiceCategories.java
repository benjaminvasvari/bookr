/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.model;

import static com.vizsgaremek.bookr.model.Users.emf;
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
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;

/**
 *
 * @author vben
 */
@Entity
@Table(name = "service_categories")
@XmlRootElement
@NamedQueries({
    @NamedQuery(name = "ServiceCategories.findAll", query = "SELECT s FROM ServiceCategories s"),
    @NamedQuery(name = "ServiceCategories.findById", query = "SELECT s FROM ServiceCategories s WHERE s.id = :id"),
    @NamedQuery(name = "ServiceCategories.findByName", query = "SELECT s FROM ServiceCategories s WHERE s.name = :name"),
    @NamedQuery(name = "ServiceCategories.findByCreatedAt", query = "SELECT s FROM ServiceCategories s WHERE s.createdAt = :createdAt"),
    @NamedQuery(name = "ServiceCategories.findByUpdatedAt", query = "SELECT s FROM ServiceCategories s WHERE s.updatedAt = :updatedAt")})
public class ServiceCategories implements Serializable {

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
    @Column(name = "created_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    @Column(name = "updated_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;
    @JoinColumn(name = "company_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Companies companyId;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "categoryId")
    private Collection<ServiceCategoryMap> serviceCategoryMapCollection;

    @Transient
    private int categoryId;

    @Transient
    private String categoryName;

    @Transient
    private String categoryDescription;

    @Transient
    private Integer serviceId;

    @Transient
    private String serviceName;

    @Transient
    private int durationMinutes;

    @Transient
    private Double price;

    @Transient
    private String currency;

    public ServiceCategories() {
    }

    public ServiceCategories(Integer id) {
        this.id = id;
    }

    public ServiceCategories(Integer id, String name, Date createdAt) {
        this.id = id;
        this.name = name;
        this.createdAt = createdAt;
    }

    public ServiceCategories(int categoryId, String categoryName, String categoryDescription, Integer serviceId, String serviceName, Integer durationMinutes, Double price, String currency) {
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.categoryDescription = categoryDescription;
        this.serviceId = serviceId;
        this.serviceName = serviceName;
        this.durationMinutes = durationMinutes;
        this.price = price;
        this.currency = currency;
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

    @XmlTransient
    public Collection<ServiceCategoryMap> getServiceCategoryMapCollection() {
        return serviceCategoryMapCollection;
    }

    public void setServiceCategoryMapCollection(Collection<ServiceCategoryMap> serviceCategoryMapCollection) {
        this.serviceCategoryMapCollection = serviceCategoryMapCollection;
    }

    // Getters and setters for transient fields
    public Integer getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Integer categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public String getCategoryDescription() {
        return categoryDescription;
    }

    public void setCategoryDescription(String categoryDescription) {
        this.categoryDescription = categoryDescription;
    }

    public Integer getServiceId() {
        return serviceId;
    }

    public void setServiceId(Integer serviceId) {
        this.serviceId = serviceId;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public Integer getServiceDurationMinutes() {
        return durationMinutes;
    }

    public void setServiceDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public Double getServicePrice() {
        return price;
    }

    public void setServicePrice(Double price) {
        this.price = price;
    }

    public String getServiceCurrency() {
        return currency;
    }

    public void setServiceCurrency(String currency) {
        this.currency = currency;
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
        if (!(object instanceof ServiceCategories)) {
            return false;
        }
        ServiceCategories other = (ServiceCategories) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.vizsgaremek.bookr.model.ServiceCategories[ id=" + id + " ]";
    }

    public static List<ServiceCategories> getServiceCategoriesWithServicesByCompanyId(Integer companyId) {
        EntityManager em = emf.createEntityManager();

        try {
            // Ha van stored procedure:
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getServiceCategoriesWithServicesByCompanyId");
            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);
            spq.setParameter("companyIdIN", companyId);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            // Empty list if no results
            if (resultList.isEmpty()) {
                return new ArrayList<>();  // Üres lista, nem null!
            }

            List<ServiceCategories> serviceList = new ArrayList<>();

            for (Object[] record : resultList) {
                ServiceCategories service = new ServiceCategories(
                        Integer.parseInt(record[0].toString()),
                        record[1].toString(),
                        record[2] != null ? record[2].toString() : null, // categoryDescription 
                        Integer.valueOf(record[3].toString()), 
                        record[4].toString(),
                        Integer.valueOf(record[5].toString()),
                        record[6] != null ? Double.parseDouble(record[6].toString()) : null, // price
                        record[7] != null ? record[7].toString() : null // currency
                );

                serviceList.add(service);  // Hozzáadjuk a listához!
            }

            return serviceList;

        } catch (Exception ex) {
            ex.printStackTrace();
            return new ArrayList<>();  // Error esetén üres lista (nem null!)
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }
}
