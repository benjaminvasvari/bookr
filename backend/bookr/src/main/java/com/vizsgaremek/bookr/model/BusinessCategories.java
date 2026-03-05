/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.model;

import static com.vizsgaremek.bookr.model.Users.emf;
import com.vizsgaremek.bookr.util.DateFormatterUtil;
import java.io.Serializable;
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
import javax.persistence.Lob;
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
@Table(name = "business_categories")
@XmlRootElement
@NamedQueries({
    @NamedQuery(name = "BusinessCategories.findAll", query = "SELECT b FROM BusinessCategories b"),
    @NamedQuery(name = "BusinessCategories.findById", query = "SELECT b FROM BusinessCategories b WHERE b.id = :id"),
    @NamedQuery(name = "BusinessCategories.findByName", query = "SELECT b FROM BusinessCategories b WHERE b.name = :name"),
    @NamedQuery(name = "BusinessCategories.findByIsActive", query = "SELECT b FROM BusinessCategories b WHERE b.isActive = :isActive"),
    @NamedQuery(name = "BusinessCategories.findByCreatedAt", query = "SELECT b FROM BusinessCategories b WHERE b.createdAt = :createdAt"),
    @NamedQuery(name = "BusinessCategories.findByUpdatedAt", query = "SELECT b FROM BusinessCategories b WHERE b.updatedAt = :updatedAt"),
    @NamedQuery(name = "BusinessCategories.findByIcon", query = "SELECT b FROM BusinessCategories b WHERE b.icon = :icon")})
public class BusinessCategories implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 100)
    @Column(name = "name")
    private String name;
    @Lob
    @Size(max = 65535)
    @Column(name = "description")
    private String description;
    @Basic(optional = false)
    @NotNull
    @Column(name = "is_active")
    private boolean isActive;
    @Basic(optional = false)
    @NotNull
    @Column(name = "created_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    @Column(name = "updated_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;
    @Size(max = 50)
    @Column(name = "icon")
    private String icon;
    @OneToMany(mappedBy = "businessCategoryId")
    private Collection<Companies> companiesCollection;

    public BusinessCategories() {
    }

    public BusinessCategories(Integer id) {
        this.id = id;
    }

    public BusinessCategories(Integer id, String name, Date createdAt) {
        this.id = id;
        this.name = name;
        this.createdAt = createdAt;
    }

    // getAllBusinessCategories
    public BusinessCategories(Integer id, String name, String description, Date createdAt, Date updatedAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // create request
    public BusinessCategories(String name, String description) {
        this.name = name;
        this.description = description;
    }

    // update request
    public BusinessCategories(Integer id, String name, String description) {
        this.id = id;
        this.name = name;
        this.description = description;
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

    public boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(boolean isActive) {
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

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    @XmlTransient
    public Collection<Companies> getCompaniesCollection() {
        return companiesCollection;
    }

    public void setCompaniesCollection(Collection<Companies> companiesCollection) {
        this.companiesCollection = companiesCollection;
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
        if (!(object instanceof BusinessCategories)) {
            return false;
        }
        BusinessCategories other = (BusinessCategories) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.vizsgaremek.bookr.model.BusinessCategories[ id=" + id + " ]";
    }

    public static List<BusinessCategories> getAllBusinessCategories() {
        EntityManager em = emf.createEntityManager();

        try {
            // Ha van stored procedure a company képekhez:
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getAllBusinessCategories");

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            // Empty list if no results
            if (resultList.isEmpty()) {
                return new ArrayList<>();
            }

            List<BusinessCategories> businessCategoriesList = new ArrayList<>();

            for (Object[] record : resultList) {
                BusinessCategories fav = new BusinessCategories(
                        Integer.valueOf(record[0].toString()),
                        record[1].toString(),
                        record[2].toString(),
                        DateFormatterUtil.parseTimestamp(record[3].toString()),
                        record[4] != null ? DateFormatterUtil.parseTimestamp(record[4].toString()) : null
                );

                businessCategoriesList.add(fav);
            }

            return businessCategoriesList;

        } catch (Exception ex) {
            ex.printStackTrace();
            return new ArrayList<>();  // Error esetén üres lista (nem null!)
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static BusinessCategories createBusinessCategory(BusinessCategories catCreated) {
        EntityManager em = emf.createEntityManager();

        try {

            StoredProcedureQuery spq = em.createStoredProcedureQuery("createBusinessCategory");
            spq.registerStoredProcedureParameter("nameIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("descriptionIN", String.class, ParameterMode.IN);

            spq.registerStoredProcedureParameter("newBusinessCategoryIdOUT", Integer.class, ParameterMode.OUT);

            spq.setParameter("nameIN", catCreated.getName());
            spq.setParameter("descriptionIN", catCreated.getDescription());

            spq.execute();

            // OUT paraméterből olvassuk ki az ID - t
            Integer newIdOUT = (Integer) spq.getOutputParameterValue("newBusinessCategoryIdOUT");

            if (newIdOUT == null) {
                System.err.println("Failed to create BusinessCategory");
                return null;
            }

            BusinessCategories company = new BusinessCategories(
                    newIdOUT
            );

            return company;

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static Boolean updateBusinessCategory(BusinessCategories updatedCat) {
        EntityManager em = emf.createEntityManager();

        try {

            StoredProcedureQuery spq = em.createStoredProcedureQuery("updateBusinessCategory");
            spq.registerStoredProcedureParameter("idIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("nameIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("descriptionIN", String.class, ParameterMode.IN);

            spq.setParameter("idIN", updatedCat.getId());
            spq.setParameter("nameIN", updatedCat.getName());
            spq.setParameter("descriptionIN", updatedCat.getDescription());

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

    public static Boolean activateBusinessCategory(Integer id) {
        EntityManager em = emf.createEntityManager();

        try {

            StoredProcedureQuery spq = em.createStoredProcedureQuery("activateBusinessCategory");
            spq.registerStoredProcedureParameter("idIN", Integer.class, ParameterMode.IN);

            spq.setParameter("idIN", id);

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

    public static Boolean deactivateBusinessCategory(Integer id) {
        EntityManager em = emf.createEntityManager();

        try {

            StoredProcedureQuery spq = em.createStoredProcedureQuery("deactivateBusinessCategory");
            spq.registerStoredProcedureParameter("idIN", Integer.class, ParameterMode.IN);

            spq.setParameter("idIN", id);

            spq.execute();

            return true;

        } catch (Exception ex) {
            ex.printStackTrace();
            return false;
        }
    }

    public static BusinessCategories getBusinessCategoryById(Integer userId) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getBusinessCategoryById");
            spq.registerStoredProcedureParameter("idIN", Integer.class, ParameterMode.IN);

            spq.setParameter("idIN", userId);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return null;
            }

            Object[] record = resultList.get(0);

            BusinessCategories cat = new BusinessCategories(
                    Integer.valueOf(record[0].toString()),
                    record[1].toString(),
                    record[2].toString(),
                    DateFormatterUtil.parseTimestamp(record[3].toString()),
                    record[4] != null ? DateFormatterUtil.parseTimestamp(record[4].toString()) : null
            );

            return cat;

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
