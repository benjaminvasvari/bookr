/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.model;

import static com.vizsgaremek.bookr.model.Users.emf;
import static com.vizsgaremek.bookr.model.Users.formatter;
import java.io.Serializable;
import java.util.ArrayList;
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
import javax.persistence.ManyToOne;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;
import javax.persistence.ParameterMode;
import javax.persistence.StoredProcedureQuery;
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
@Table(name = "favorites")
@XmlRootElement
@NamedQueries({
    @NamedQuery(name = "Favorites.findAll", query = "SELECT f FROM Favorites f"),
    @NamedQuery(name = "Favorites.findById", query = "SELECT f FROM Favorites f WHERE f.id = :id"),
    @NamedQuery(name = "Favorites.findByCreatedAt", query = "SELECT f FROM Favorites f WHERE f.createdAt = :createdAt"),
    @NamedQuery(name = "Favorites.findByDeletedAt", query = "SELECT f FROM Favorites f WHERE f.deletedAt = :deletedAt"),
    @NamedQuery(name = "Favorites.findByIsDeleted", query = "SELECT f FROM Favorites f WHERE f.isDeleted = :isDeleted")})
public class Favorites implements Serializable {

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
    @Column(name = "deleted_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date deletedAt;
    @Basic(optional = false)
    @NotNull
    @Column(name = "is_deleted")
    private boolean isDeleted;
    @JoinColumn(name = "company_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Companies companyId;
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Users userId;

    @javax.persistence.Transient
    private Integer userIdInt;

    @javax.persistence.Transient
    private Integer companyIdInt;

    public Favorites() {
    }

    public Favorites(Integer id) {
        this.id = id;
    }

    public Favorites(Integer id, Date createdAt, boolean isDeleted) {
        this.id = id;
        this.createdAt = createdAt;
        this.isDeleted = isDeleted;
    }

    public Favorites(Integer id, Integer userIdInt, Integer companyIdInt, Date createdAt) {
        this.id = id;
        this.userIdInt = userIdInt;
        this.companyIdInt = companyIdInt;
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

    public Date getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(Date deletedAt) {
        this.deletedAt = deletedAt;
    }

    public boolean getIsDeleted() {
        return isDeleted;
    }

    public void setIsDeleted(boolean isDeleted) {
        this.isDeleted = isDeleted;
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

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (id != null ? id.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof Favorites)) {
            return false;
        }
        Favorites other = (Favorites) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.vizsgaremek.bookr.model.Favorites[ id=" + id + " ]";
    }

    public static List<Favorites> getUserFavorites(Integer userId) {
        EntityManager em = emf.createEntityManager();

        try {
            // Ha van stored procedure a company képekhez:
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getUserFavorites");
            spq.registerStoredProcedureParameter("userIdIN", Integer.class, ParameterMode.IN);

            spq.setParameter("userIdIN", userId);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            // Empty list if no results
            if (resultList.isEmpty()) {
                return new ArrayList<>();  // Üres lista, nem null!
            }

            // Convert to Images list
            List<Favorites> favoritesList = new ArrayList<>();

            for (Object[] record : resultList) {
                Favorites fav = new Favorites(
                        Integer.valueOf(record[0].toString()),
                        Integer.valueOf(record[1].toString()),
                        Integer.valueOf(record[2].toString()),
                        formatter.parse(record[3].toString())
                );

                favoritesList.add(fav);
            }

            return favoritesList;

        } catch (Exception ex) {
            ex.printStackTrace();
            return new ArrayList<>();  // Error esetén üres lista (nem null!)
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static Boolean addFavorite(Integer userId, Integer companyId) {
        EntityManager em = emf.createEntityManager();

        try {

            StoredProcedureQuery spq = em.createStoredProcedureQuery("addFavorite");
            spq.registerStoredProcedureParameter("userIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);

            spq.setParameter("userIdIN", userId);
            spq.setParameter("companyIdIN", companyId);

            spq.execute();

            return true;

        } catch (Exception ex) {
            ex.printStackTrace();
            return false;
        }
    }

    public static Boolean removeFavorite(Integer userId, Integer companyId) {
        EntityManager em = emf.createEntityManager();

        try {

            StoredProcedureQuery spq = em.createStoredProcedureQuery("removeFavorite");
            spq.registerStoredProcedureParameter("userIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);

            spq.setParameter("userIdIN", userId);
            spq.setParameter("companyIdIN", companyId);

            spq.execute();

            return true;

        } catch (Exception ex) {
            ex.printStackTrace();
            return false;
        }
    }
}
