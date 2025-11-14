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
@Table(name = "service_category_map")
@XmlRootElement
@NamedQueries({
    @NamedQuery(name = "ServiceCategoryMap.findAll", query = "SELECT s FROM ServiceCategoryMap s"),
    @NamedQuery(name = "ServiceCategoryMap.findById", query = "SELECT s FROM ServiceCategoryMap s WHERE s.id = :id"),
    @NamedQuery(name = "ServiceCategoryMap.findByCreatedAt", query = "SELECT s FROM ServiceCategoryMap s WHERE s.createdAt = :createdAt")})
public class ServiceCategoryMap implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Basic(optional = false)
    @NotNull
    @Column(name = "created_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    @JoinColumn(name = "category_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private ServiceCategories categoryId;
    @JoinColumn(name = "service_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Services serviceId;

    public ServiceCategoryMap() {
    }

    public ServiceCategoryMap(Integer id) {
        this.id = id;
    }

    public ServiceCategoryMap(Integer id, Date createdAt) {
        this.id = id;
        this.createdAt = createdAt;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public ServiceCategories getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(ServiceCategories categoryId) {
        this.categoryId = categoryId;
    }

    public Services getServiceId() {
        return serviceId;
    }

    public void setServiceId(Services serviceId) {
        this.serviceId = serviceId;
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
        if (!(object instanceof ServiceCategoryMap)) {
            return false;
        }
        ServiceCategoryMap other = (ServiceCategoryMap) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.vizsgaremek.bookr.model.ServiceCategoryMap[ id=" + id + " ]";
    }
    
}
