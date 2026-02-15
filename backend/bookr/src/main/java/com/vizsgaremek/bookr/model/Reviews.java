/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.model;

import com.vizsgaremek.bookr.DTO.OwnerDashboardDTO;
import com.vizsgaremek.bookr.DTO.OwnerDashboardDTO.AverageRatingDTO;
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
import javax.validation.constraints.Size;
import javax.xml.bind.annotation.XmlRootElement;

/**
 *
 * @author vben
 */
@Entity
@Table(name = "reviews")
@XmlRootElement
@NamedQueries({
    @NamedQuery(name = "Reviews.findAll", query = "SELECT r FROM Reviews r"),
    @NamedQuery(name = "Reviews.findById", query = "SELECT r FROM Reviews r WHERE r.id = :id"),
    @NamedQuery(name = "Reviews.findByRating", query = "SELECT r FROM Reviews r WHERE r.rating = :rating"),
    @NamedQuery(name = "Reviews.findByUpdatedAt", query = "SELECT r FROM Reviews r WHERE r.updatedAt = :updatedAt"),
    @NamedQuery(name = "Reviews.findByDeletedAt", query = "SELECT r FROM Reviews r WHERE r.deletedAt = :deletedAt"),
    @NamedQuery(name = "Reviews.findByIsDeleted", query = "SELECT r FROM Reviews r WHERE r.isDeleted = :isDeleted"),
    @NamedQuery(name = "Reviews.findByCreatedAt", query = "SELECT r FROM Reviews r WHERE r.createdAt = :createdAt")})
public class Reviews implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Basic(optional = false)
    @NotNull
    @Column(name = "rating")
    private int rating;
    @Lob
    @Size(max = 65535)
    @Column(name = "comment")
    private String comment;
    @Column(name = "updated_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;
    @Column(name = "deleted_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date deletedAt;
    @Column(name = "is_deleted")
    private Boolean isDeleted;
    @Basic(optional = false)
    @NotNull
    @Column(name = "created_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    @JoinColumn(name = "appointment_id", referencedColumnName = "id")
    @ManyToOne
    private Appointments appointmentId;
    @JoinColumn(name = "company_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Companies companyId;
    @JoinColumn(name = "client_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Users clientId;

    // Transient fields
    @Transient
    private String userName;

    @Transient
    private String userImage;

    public Reviews() {
    }

    public Reviews(Integer id) {
        this.id = id;
    }

    public Reviews(Integer id, int rating, Date createdAt) {
        this.id = id;
        this.rating = rating;
        this.createdAt = createdAt;
    }

    // getReviewsByCompanyId
    public Reviews(Integer id, String userName, String userImage, int rating, String comment, Date createdAt) {
        this.id = id;
        this.userName = userName;
        this.userImage = userImage;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = createdAt;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public int getRating() {
        return rating;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
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

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Appointments getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(Appointments appointmentId) {
        this.appointmentId = appointmentId;
    }

    public Companies getCompanyId() {
        return companyId;
    }

    public void setCompanyId(Companies companyId) {
        this.companyId = companyId;
    }

    public Users getClientId() {
        return clientId;
    }

    public void setClientId(Users clientId) {
        this.clientId = clientId;
    }

    // Getters and setters for transient fields
    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserImage() {
        return userImage;
    }

    public void setUserImage(String userImage) {
        this.userImage = userImage;
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
        if (!(object instanceof Reviews)) {
            return false;
        }
        Reviews other = (Reviews) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.vizsgaremek.bookr.model.Reviews[ id=" + id + " ]";
    }

    public static List<Reviews> getReviewsByCompanyId(Integer companyId) {
        EntityManager em = emf.createEntityManager();

        try {
            // Ha van stored procedure:
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getReviewsByCompanyId");
            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);
            spq.setParameter("companyIdIN", companyId);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            // Empty list if no results
            if (resultList.isEmpty()) {
                return new ArrayList<>();  // Üres lista, nem null!
            }

            // Convert to Reviews list
            List<Reviews> reviewsList = new ArrayList<>();

            for (Object[] record : resultList) {
                Reviews review = new Reviews(
                        Integer.valueOf(record[0].toString()),
                        record[1].toString(),
                        record[2] != null ? record[2].toString() : null,
                        Integer.valueOf(record[3].toString()),
                        record[4].toString(),
                        formatter.parse(record[5].toString())
                );

                reviewsList.add(review);  // Hozzáadjuk a listához!
            }

            return reviewsList;

        } catch (Exception ex) {
            ex.printStackTrace();
            return new ArrayList<>();  // Error esetén üres lista (nem null!)
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static AverageRatingDTO getAverageReviewsByCompany(Integer companyId) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getDashboardAverageRating");

            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);

            spq.setParameter("companyIdIN", companyId);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return null;
            }

            Object[] record = resultList.get(0);

            AverageRatingDTO rating = new AverageRatingDTO(
                    Double.parseDouble(record[0].toString()),
                    Integer.valueOf(record[1].toString())
            );

            return rating;

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
