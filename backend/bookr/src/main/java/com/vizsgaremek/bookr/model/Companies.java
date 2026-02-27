/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.model;

import static com.vizsgaremek.bookr.model.Users.emf;
import static com.vizsgaremek.bookr.model.Users.formatter;
import com.vizsgaremek.bookr.util.StoredProcedureUtil;
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
@Table(name = "companies")
@XmlRootElement
@NamedQueries({
    @NamedQuery(name = "Companies.findAll", query = "SELECT c FROM Companies c"),
    @NamedQuery(name = "Companies.findById", query = "SELECT c FROM Companies c WHERE c.id = :id"),
    @NamedQuery(name = "Companies.findByName", query = "SELECT c FROM Companies c WHERE c.name = :name"),
    @NamedQuery(name = "Companies.findByCity", query = "SELECT c FROM Companies c WHERE c.city = :city"),
    @NamedQuery(name = "Companies.findByPostalCode", query = "SELECT c FROM Companies c WHERE c.postalCode = :postalCode"),
    @NamedQuery(name = "Companies.findByCountry", query = "SELECT c FROM Companies c WHERE c.country = :country"),
    @NamedQuery(name = "Companies.findByPhone", query = "SELECT c FROM Companies c WHERE c.phone = :phone"),
    @NamedQuery(name = "Companies.findByEmail", query = "SELECT c FROM Companies c WHERE c.email = :email"),
    @NamedQuery(name = "Companies.findByWebsite", query = "SELECT c FROM Companies c WHERE c.website = :website"),
    @NamedQuery(name = "Companies.findByBookingAdvanceDays", query = "SELECT c FROM Companies c WHERE c.bookingAdvanceDays = :bookingAdvanceDays"),
    @NamedQuery(name = "Companies.findByCancellationHours", query = "SELECT c FROM Companies c WHERE c.cancellationHours = :cancellationHours"),
    @NamedQuery(name = "Companies.findByCreatedAt", query = "SELECT c FROM Companies c WHERE c.createdAt = :createdAt"),
    @NamedQuery(name = "Companies.findByUpdatedAt", query = "SELECT c FROM Companies c WHERE c.updatedAt = :updatedAt"),
    @NamedQuery(name = "Companies.findByDeletedAt", query = "SELECT c FROM Companies c WHERE c.deletedAt = :deletedAt"),
    @NamedQuery(name = "Companies.findByIsDeleted", query = "SELECT c FROM Companies c WHERE c.isDeleted = :isDeleted"),
    @NamedQuery(name = "Companies.findByIsActive", query = "SELECT c FROM Companies c WHERE c.isActive = :isActive"),
    @NamedQuery(name = "Companies.findByAllowSameDayBooking", query = "SELECT c FROM Companies c WHERE c.allowSameDayBooking = :allowSameDayBooking"),
    @NamedQuery(name = "Companies.findByMinimumBookingHoursAhead", query = "SELECT c FROM Companies c WHERE c.minimumBookingHoursAhead = :minimumBookingHoursAhead")})
public class Companies implements Serializable {

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
    @Lob
    @Size(max = 65535)
    @Column(name = "address")
    private String address;
    @Size(max = 100)
    @Column(name = "city")
    private String city;
    @Size(max = 20)
    @Column(name = "postal_code")
    private String postalCode;
    @Size(max = 100)
    @Column(name = "country")
    private String country;
    // @Pattern(regexp="^\\(?(\\d{3})\\)?[- ]?(\\d{3})[- ]?(\\d{4})$", message="Invalid phone/fax format, should be as xxx-xxx-xxxx")//if the field contains phone or fax number consider using this annotation to enforce field validation
    @Size(max = 30)
    @Column(name = "phone")
    private String phone;
    // @Pattern(regexp="[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?", message="Invalid email")//if the field contains email address consider using this annotation to enforce field validation
    @Size(max = 100)
    @Column(name = "email")
    private String email;
    @Size(max = 255)
    @Column(name = "website")
    private String website;
    @Column(name = "booking_advance_days")
    private Integer bookingAdvanceDays;
    @Column(name = "cancellation_hours")
    private Integer cancellationHours;
    @Basic(optional = false)
    @NotNull
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
    @Basic(optional = false)
    @NotNull
    @Column(name = "is_active")
    private boolean isActive;
    @Column(name = "allow_same_day_booking")
    private Boolean allowSameDayBooking;
    @Column(name = "minimum_booking_hours_ahead")
    private Integer minimumBookingHoursAhead;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "companyId")
    private Collection<PendingStaff> pendingStaffCollection;
    @JoinColumn(name = "business_category_id", referencedColumnName = "id")
    @ManyToOne
    private BusinessCategories businessCategoryId;
    @JoinColumn(name = "owner_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Users ownerId;
    @OneToMany(mappedBy = "companyId")
    private Collection<Users> usersCollection;

    @Transient
    private String categoryName;

    @Transient
    private String imageUrl;

    @Transient
    private Double rating;

    @Transient
    private Integer reviewCount;

    @Transient
    private Integer businessCategoryIdInt;

    @Transient
    private Integer ownerIdInt;

    @Transient
    private String ownerName;

    @Transient
    private String ownerEmail;

    public Companies() {
    }

    public Companies(Integer id) {
        this.id = id;
    }

    public Companies(Integer id, String name, Date createdAt, boolean isActive) {
        this.id = id;
        this.name = name;
        this.createdAt = createdAt;
        this.isActive = isActive;
    }

    public Companies(Integer id, String name, String description, String address, String city, String postalCode, String country, String phone, String email, String website, Integer bookingAdvanceDays, Integer cancellationHours, Date createdAt, Date updatedAt, boolean isActive) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.address = address;
        this.city = city;
        this.postalCode = postalCode;
        this.country = country;
        this.phone = phone;
        this.email = email;
        this.website = website;
        this.bookingAdvanceDays = bookingAdvanceDays;
        this.cancellationHours = cancellationHours;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.isActive = isActive;
    }

    // CheckCompany request
    public Companies(Boolean isDeleted, boolean isActive) {
        this.isDeleted = isDeleted;
        this.isActive = isActive;
    }

    public Companies(Integer id, String name, String description, String address, String city, String postalCode, String country, String phone, String email, String website, Integer businessCategoryIdInt, String categoryName, String imageUrl, Double rating, Integer reviewCount) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.address = address;
        this.city = city;
        this.postalCode = postalCode;
        this.country = country;
        this.phone = phone;
        this.email = email;
        this.website = website;
        this.businessCategoryIdInt = businessCategoryIdInt;
        this.categoryName = categoryName;
        this.imageUrl = imageUrl;
        this.rating = rating;
        this.reviewCount = reviewCount;
    }

    // get Top & New & Featured recommendations
    public Companies(Integer id, String name, Double rating, Integer reviewCount, String address, String imageUrl) {
        this.id = id;
        this.name = name;
        this.rating = rating;
        this.reviewCount = reviewCount;
        this.address = address;
        this.imageUrl = imageUrl;
    }

    // getCompnayShort response
    public Companies(Integer id, String name, String address, String postalCode, String city, String country, String categoryName, Double rating, Integer reviewCount, String imageUrl) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.postalCode = postalCode;
        this.city = city;
        this.country = country;
        this.categoryName = categoryName;
        this.rating = rating;
        this.reviewCount = reviewCount;
        this.imageUrl = imageUrl;
    }

    public Companies(Integer id, Integer bookingAdvanceDays) {
        this.id = id;
        this.bookingAdvanceDays = bookingAdvanceDays;
    }

    // createFUll request
    public Companies(String name, String description, String address, String city, String postalCode, String country, String phone, String email, String website, Integer businessCategoryIdInt, Integer ownerIdInt, Integer bookingAdvanceDays, Integer cancellationHours, Boolean allowSameDayBooking, Integer minimumBookingHoursAhead) {
        this.name = name;
        this.description = description;
        this.address = address;
        this.city = city;
        this.postalCode = postalCode;
        this.country = country;
        this.phone = phone;
        this.email = email;
        this.website = website;
        this.businessCategoryIdInt = businessCategoryIdInt;
        this.ownerIdInt = ownerIdInt;
        this.bookingAdvanceDays = bookingAdvanceDays;
        this.cancellationHours = cancellationHours;
        this.allowSameDayBooking = allowSameDayBooking;
        this.minimumBookingHoursAhead = minimumBookingHoursAhead;
    }

    // getCompanyInfoForEmail
    public Companies(String name, String ownerName, String ownerEmail) {
        this.name = name;
        this.ownerName = ownerName;
        this.ownerEmail = ownerEmail;
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

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public void setPostalCode(String postalCode) {
        this.postalCode = postalCode;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    public Integer getBookingAdvanceDays() {
        return bookingAdvanceDays;
    }

    public void setBookingAdvanceDays(Integer bookingAdvanceDays) {
        this.bookingAdvanceDays = bookingAdvanceDays;
    }

    public Integer getCancellationHours() {
        return cancellationHours;
    }

    public void setCancellationHours(Integer cancellationHours) {
        this.cancellationHours = cancellationHours;
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

    public boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(boolean isActive) {
        this.isActive = isActive;
    }

    public Boolean getAllowSameDayBooking() {
        return allowSameDayBooking;
    }

    public void setAllowSameDayBooking(Boolean allowSameDayBooking) {
        this.allowSameDayBooking = allowSameDayBooking;
    }

    public Integer getMinimumBookingHoursAhead() {
        return minimumBookingHoursAhead;
    }

    public void setMinimumBookingHoursAhead(Integer minimumBookingHoursAhead) {
        this.minimumBookingHoursAhead = minimumBookingHoursAhead;
    }

    @XmlTransient
    public Collection<PendingStaff> getPendingStaffCollection() {
        return pendingStaffCollection;
    }

    public void setPendingStaffCollection(Collection<PendingStaff> pendingStaffCollection) {
        this.pendingStaffCollection = pendingStaffCollection;
    }

    public BusinessCategories getBusinessCategoryId() {
        return businessCategoryId;
    }

    public void setBusinessCategoryId(BusinessCategories businessCategoryId) {
        this.businessCategoryId = businessCategoryId;
    }

    public Users getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Users ownerId) {
        this.ownerId = ownerId;
    }

    @XmlTransient
    public Collection<Users> getUsersCollection() {
        return usersCollection;
    }

    public void setUsersCollection(Collection<Users> usersCollection) {
        this.usersCollection = usersCollection;
    }

    // Getters and setters for transient fields
    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Double getRating() {
        return rating;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }

    public Integer getReviewCount() {
        return reviewCount;
    }

    public void setReviewCount(Integer reviewCount) {
        this.reviewCount = reviewCount;
    }

    public Integer getBusinessCategoryIdInt() {
        return businessCategoryIdInt;
    }

    public void setBusinessCategoryIdInt(Integer businessCategoryIdInt) {
        this.businessCategoryIdInt = businessCategoryIdInt;
    }

    public Integer getOwnerIdInt() {
        return ownerIdInt;
    }

    public void setOwnerIdInt(Integer ownerIdInt) {
        this.ownerIdInt = ownerIdInt;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }

    public String getOwnerEmail() {
        return ownerEmail;
    }

    public void setOwnerEmail(String ownerEmail) {
        this.ownerEmail = ownerEmail;
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
        if (!(object instanceof Companies)) {
            return false;
        }
        Companies other = (Companies) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.vizsgaremek.bookr.model.Companies[ id=" + id + " ]";
    }

    public static Companies getCompanyById(Integer id) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getCompanyById");
            spq.registerStoredProcedureParameter("idIN", Integer.class, ParameterMode.IN);

            spq.setParameter("idIN", id);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return null;
            }

            // Csak az első rekord kell (LIMIT 1 a stored procedure-ben)
            Object[] record = resultList.get(0);

            Companies company = new Companies(
                    Integer.valueOf(record[0].toString()),
                    record[1].toString(),
                    record[2].toString(),
                    record[3].toString(),
                    record[4].toString(),
                    record[5].toString(),
                    record[6].toString(),
                    record[7].toString(),
                    record[8].toString(),
                    record[9].toString(),
                    Integer.valueOf(record[10].toString()),
                    Integer.valueOf(record[11].toString()),
                    formatter.parse(record[12].toString()),
                    record[13] == null ? null : formatter.parse(record[13].toString()), // updated_at
                    Boolean.parseBoolean(record[14].toString())
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

    public static Companies checkCompany(Integer id) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("checkCompany");
            spq.registerStoredProcedureParameter("idIN", Integer.class, ParameterMode.IN);

            spq.setParameter("idIN", id);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return null;
            }

            // Csak az első rekord kell (LIMIT 1 a stored procedure-ben)
            Object[] record = resultList.get(0);

            Companies company = new Companies(
                    Boolean.parseBoolean(record[0].toString()),
                    Boolean.parseBoolean(record[1].toString())
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

    public static Companies getCompanyDataById(Integer id) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getCompanyDataById");
            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);
            spq.setParameter("companyIdIN", id);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return null;
            }

            Object[] record = resultList.get(0);

            // Create Companies object with basic data
            Companies company = new Companies(
                    Integer.valueOf(record[0].toString()),
                    record[1].toString(),
                    record[2] != null ? record[2].toString() : null,
                    record[3] != null ? record[3].toString() : null,
                    record[4] != null ? record[4].toString() : null,
                    record[5] != null ? record[5].toString() : null,
                    record[6] != null ? record[6].toString() : null,
                    record[7] != null ? record[7].toString() : null,
                    record[8] != null ? record[8].toString() : null,
                    record[9] != null ? record[9].toString() : null,
                    // Business category ID
                    record[10] != null ? Integer.valueOf(record[10].toString()) : null,
                    // Calculated/joined fields (transient)
                    record[11] != null ? record[11].toString() : null,
                    record[12] != null ? record[12].toString() : null,
                    record[13] != null ? Double.valueOf(record[13].toString()) : 0.0,
                    record[14] != null ? Integer.valueOf(record[14].toString()) : 0
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

    public static List<Companies> getTopRecommendations(Integer limit) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getTopRecommendations");
            spq.registerStoredProcedureParameter("limitIN", Integer.class, ParameterMode.IN);
            spq.setParameter("limitIN", limit);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            // Empty list if no results
            if (resultList.isEmpty()) {
                return new ArrayList<>();
            }

            List<Companies> companiesList = new ArrayList<>();

            for (Object[] record : resultList) {
                Companies company = new Companies(
                        Integer.valueOf(record[0].toString()),
                        record[1].toString(),
                        Double.parseDouble(record[2].toString()),
                        Integer.valueOf(record[3].toString()),
                        record[4].toString(),
                        record[5].toString()
                );

                companiesList.add(company);  // Hozzáadjuk a listához!
            }

            return companiesList;  // Az ÖSSZES képet visszaadjuk!

        } catch (Exception ex) {
            ex.printStackTrace();
            return new ArrayList<>();  // Error esetén üres lista (nem null!)
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static List<Companies> getNewCompanies(Integer limit) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getNewCompanies");
            spq.registerStoredProcedureParameter("limitIN", Integer.class, ParameterMode.IN);
            spq.setParameter("limitIN", limit);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            // Empty list if no results
            if (resultList.isEmpty()) {
                return new ArrayList<>();
            }

            List<Companies> companiesList = new ArrayList<>();

            for (Object[] record : resultList) {
                Companies company = new Companies(
                        Integer.valueOf(record[0].toString()),
                        record[1].toString(),
                        Double.parseDouble(record[2].toString()),
                        Integer.valueOf(record[3].toString()),
                        record[4].toString(),
                        record[5].toString()
                );

                companiesList.add(company);  // Hozzáadjuk a listához!
            }

            return companiesList;  // Az ÖSSZES képet visszaadjuk!

        } catch (Exception ex) {
            ex.printStackTrace();
            return new ArrayList<>();  // Error esetén üres lista (nem null!)
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static List<Companies> getFeaturedCompanies(Integer limit) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getFeaturedCompanies");
            spq.registerStoredProcedureParameter("limitIN", Integer.class, ParameterMode.IN);
            spq.setParameter("limitIN", limit);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            // Empty list if no results
            if (resultList.isEmpty()) {
                return new ArrayList<>();
            }

            List<Companies> companiesList = new ArrayList<>();

            for (Object[] record : resultList) {
                Companies company = new Companies(
                        Integer.valueOf(record[0].toString()),
                        record[1].toString(),
                        Double.parseDouble(record[2].toString()),
                        Integer.valueOf(record[3].toString()),
                        record[4].toString(),
                        record[5].toString()
                );

                companiesList.add(company);  // Hozzáadjuk a listához!
            }

            return companiesList;  // Az ÖSSZES képet visszaadjuk!

        } catch (Exception ex) {
            ex.printStackTrace();
            return new ArrayList<>();  // Error esetén üres lista (nem null!)
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static Companies getCompanyShort(Integer id) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getCompanyShort");
            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);
            spq.setParameter("companyIdIN", id);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return null;
            }

            Object[] record = resultList.get(0);

            // Create Companies object with basic data
            Companies company = new Companies(
                    Integer.valueOf(record[0].toString()),
                    record[1].toString(),
                    record[2].toString(),
                    record[3].toString(),
                    record[4].toString(),
                    record[5].toString(),
                    record[6].toString(),
                    Double.parseDouble(record[7].toString()),
                    Integer.valueOf(record[8].toString()),
                    record[9] == null ? null : record[9].toString()
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

    public static Companies getCompanyBookingAdvanceDays(Integer id) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getCompanyBookingAdvanceDays");

            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);

            spq.setParameter("companyIdIN", id);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return null;
            }

            Object[] record = resultList.get(0);

            // Create Companies object with basic data
            Companies company = new Companies(
                    Integer.valueOf(record[0].toString()),
                    Integer.valueOf(record[1].toString())
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

    public static Integer createFull(Companies company) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("createCompany");
            spq.registerStoredProcedureParameter("nameIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("descriptionIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("addressIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("cityIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("postalCodeIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("countryIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("phoneIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("emailIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("websiteIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("ownerIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("allowSameDayBookingIN", Boolean.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("minimumBookingHoursAheadIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("bookingAdvanceDaysIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("cancellationHoursIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("businessCategoryIdIN", Integer.class, ParameterMode.IN);

            spq.setParameter("nameIN", company.getName());
            spq.setParameter("descriptionIN", company.getDescription());
            spq.setParameter("addressIN", company.getAddress());
            spq.setParameter("cityIN", company.getCity());
            spq.setParameter("postalCodeIN", company.getPostalCode());
            spq.setParameter("countryIN", company.getCountry());
            spq.setParameter("phoneIN", company.getPhone());
            spq.setParameter("emailIN", company.getEmail());
            spq.setParameter("ownerIdIN", company.getOwnerIdInt());
            spq.setParameter("allowSameDayBookingIN", company.getAllowSameDayBooking());
            StoredProcedureUtil.setNullableParameter(spq, "minimumBookingHoursAheadIN", company.getMinimumBookingHoursAhead());
            spq.setParameter("bookingAdvanceDaysIN", company.getBookingAdvanceDays());
            spq.setParameter("cancellationHoursIN", company.getCancellationHours());
            spq.setParameter("businessCategoryIdIN", company.getBusinessCategoryIdInt());

            // Handle website Null
            if (company.getWebsite() != null && !company.getWebsite().isEmpty()) {
                spq.setParameter("websiteIN", company.getWebsite());
            } else {
                spq.unwrap(org.hibernate.procedure.ProcedureCall.class)
                        .getParameterRegistration("websiteIN")
                        .enablePassingNulls(true);
                spq.setParameter("websiteIN", null);
            }

            spq.execute();

            Object singleResult = spq.getSingleResult();

            if (singleResult == null) {
                return null;
            }

            Integer companyId = Integer.valueOf(singleResult.toString());
            return companyId;

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static Integer getCompanyIdByOwnerId(Integer userId) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getCompanyIdByOwnerId");
            spq.registerStoredProcedureParameter("userIdIN", Integer.class, ParameterMode.IN);

            spq.setParameter("userIdIN", userId);

            spq.execute();

            Object singleResult = spq.getSingleResult();

            if (singleResult == null) {
                return null;
            }

            Integer companyId = Integer.valueOf(singleResult.toString());

            return companyId;

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static Companies getCompanyInfoForEmail(Integer companyId) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getCompanyInfoForEmail");

            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);

            spq.setParameter("companyIdIN", companyId);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return null;
            }

            Object[] record = resultList.get(0);

            Companies company = new Companies(
                    record[0].toString(),
                    record[1].toString(),
                    record[2].toString()
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
}
