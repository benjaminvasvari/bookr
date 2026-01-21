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
import javax.persistence.Lob;
import javax.persistence.ManyToOne;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;
import javax.persistence.ParameterMode;
import javax.persistence.StoredProcedureQuery;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import javax.xml.bind.annotation.XmlRootElement;

/**
 *
 * @author vben
 */
@Entity
@Table(name = "images")
@XmlRootElement
@NamedQueries({
    @NamedQuery(name = "Images.findAll", query = "SELECT i FROM Images i"),
    @NamedQuery(name = "Images.findById", query = "SELECT i FROM Images i WHERE i.id = :id"),
    @NamedQuery(name = "Images.findByIsMain", query = "SELECT i FROM Images i WHERE i.isMain = :isMain"),
    @NamedQuery(name = "Images.findByUploadedAt", query = "SELECT i FROM Images i WHERE i.uploadedAt = :uploadedAt")})
public class Images implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Basic(optional = false)
    @NotNull
    @Lob
    @Size(min = 1, max = 65535)
    @Column(name = "url")
    private String url;
    @Basic(optional = false)
    @NotNull
    @Column(name = "is_main")
    private boolean isMain;
    @Basic(optional = false)
    @NotNull
    @Column(name = "uploaded_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date uploadedAt;
    @Column(name = "deleted_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date deletedAt;
    @Basic(optional = false)
    @NotNull
    @Column(name = "is_deleted")
    private boolean isDeleted;
    @Column(name = "company_id", insertable = false, updatable = false)
    private Integer companyIdInt;
    @Column(name = "user_id", insertable = false, updatable = false)
    private Integer userIdInt;
    @JoinColumn(name = "company_id", referencedColumnName = "id")
    @ManyToOne
    private Companies companyId;
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    @ManyToOne
    private Users userId;

    public Images() {
    }

    public Images(Integer id) {
        this.id = id;
    }

    // getCompanyImages conttructor
    public Images(Integer id, String url, boolean isMain, Date uploadedAt) {
        this.id = id;
        this.url = url;
        this.isMain = isMain;
        this.uploadedAt = uploadedAt;
    }

    public Images(Integer id, String url, Date uploadedAt, Integer companyIdInt, Integer userIdInt) {
        this.id = id;
        this.url = url;
        this.uploadedAt = uploadedAt;
        this.companyIdInt = companyIdInt;
        this.userIdInt = userIdInt;
    }
    
    

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public boolean getIsMain() {
        return isMain;
    }

    public void setIsMain(boolean isMain) {
        this.isMain = isMain;
    }

    public Date getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(Date uploadedAt) {
        this.uploadedAt = uploadedAt;
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

    public Integer getCompanyIdInt() {
        return companyIdInt;
    }

    public void setCompanyIdInt(Integer companyIdInt) {
        this.companyIdInt = companyIdInt;
    }

    public Integer getUserIdInt() {
        return userIdInt;
    }

    public void setUserIdInt(Integer userIdInt) {
        this.userIdInt = userIdInt;
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

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (id != null ? id.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof Images)) {
            return false;
        }
        Images other = (Images) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.vizsgaremek.bookr.model.Images[ id=" + id + " ]";
    }

    /**
     * Get images for a company (max 4) Returns images only from active,
     * non-deleted companies
     *
     * @param companyId Company ID
     * @return List of images (can be empty)
     */
    public static List<Images> getCompanyNotMainImages(Integer companyId) {
        EntityManager em = emf.createEntityManager();

        try {
            // Ha van stored procedure a company képekhez:
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getCompanyNotMainImages");
            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);
            spq.setParameter("companyIdIN", companyId);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            // Empty list if no results
            if (resultList.isEmpty()) {
                return new ArrayList<>();  // Üres lista, nem null!
            }

            // Convert to Images list
            List<Images> imagesList = new ArrayList<>();

            for (Object[] record : resultList) {
                Images img = new Images(
                        Integer.valueOf(record[0].toString()), // id
                        record[1] == null ? null : record[1].toString(), // url
                        Boolean.parseBoolean(record[2].toString()), // is_main
                        record[3] == null ? null : formatter.parse(record[3].toString()) // uploaded_at
                );

                imagesList.add(img);  // Hozzáadjuk a listához!
            }

            return imagesList;  // Az ÖSSZES képet visszaadjuk!

        } catch (Exception ex) {
            ex.printStackTrace();
            return new ArrayList<>();  // Error esetén üres lista (nem null!)
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static Images getUserProfilePicture(Integer userId) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getUserProfilePicture");
            spq.registerStoredProcedureParameter("userIdIN", Integer.class, ParameterMode.IN);

            spq.setParameter("userIdIN", userId);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return null;
            }

            // Stored procedure returns: id, user_id, url, uploaded_at
            Object[] record = resultList.get(0);

            Images image = new Images(
                    Integer.valueOf(record[0].toString()), // id
                    record[1].toString(), // url
                    record[2] == null ? null : formatter.parse(record[2].toString()), // uploaded_at
                    null, // companyIdInt - user profile picture has no company
                    Integer.valueOf(record[3].toString()) // userIdInt
            );

            return image;

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