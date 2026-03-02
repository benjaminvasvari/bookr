package com.vizsgaremek.bookr.model;

import com.vizsgaremek.bookr.DTO.checkStaffInviteTokenDTO;
import static com.vizsgaremek.bookr.model.Users.emf;
import static com.vizsgaremek.bookr.model.Users.formatter;
import com.vizsgaremek.bookr.util.StoredProcedureUtil;
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
@Table(name = "pending_staff")
@XmlRootElement
@NamedQueries({
    @NamedQuery(name = "PendingStaff.findAll", query = "SELECT p FROM PendingStaff p"),
    @NamedQuery(name = "PendingStaff.findById", query = "SELECT p FROM PendingStaff p WHERE p.id = :id"),
    @NamedQuery(name = "PendingStaff.findByStatus", query = "SELECT p FROM PendingStaff p WHERE p.status = :status"),
    @NamedQuery(name = "PendingStaff.findByCreatedAt", query = "SELECT p FROM PendingStaff p WHERE p.createdAt = :createdAt")})
public class PendingStaff implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    // @Pattern(regexp="[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?", message="Invalid email")//if the field contains email address consider using this annotation to enforce field validation
    @Basic(optional = false)
    @NotNull
    @Lob
    @Size(min = 1, max = 65535)
    @Column(name = "email")
    private String email;
    @Basic(optional = false)
    @NotNull
    @Lob
    @Size(min = 1, max = 65535)
    @Column(name = "position")
    private String position;
    @Size(max = 20)
    @Column(name = "status")
    private String status;
    @Basic(optional = false)
    @NotNull
    @Column(name = "created_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    @JoinColumn(name = "company_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Companies companyId;
    @JoinColumn(name = "token_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Tokens tokenId;
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    @ManyToOne
    private Users userId;

    @Transient
    private Integer companyIdInt;

    @Transient
    private Integer userIdInt;

    @Transient
    private Integer tokenIdInt;

    public PendingStaff() {
    }

    public PendingStaff(Integer id) {
        this.id = id;
    }

    public PendingStaff(Integer id, String email, String position, Date createdAt) {
        this.id = id;
        this.email = email;
        this.position = position;
        this.createdAt = createdAt;
    }

    // invite request
    public PendingStaff(String email, String position) {
        this.email = email;
        this.position = position;
    }

    public PendingStaff(Integer id, String email, Integer companyIdInt, Integer userIdInt, Integer tokenIdInt, String position, String status, Date createdAt) {
        this.id = id;
        this.email = email;
        this.companyIdInt = companyIdInt;
        this.userIdInt = userIdInt;
        this.tokenIdInt = tokenIdInt;
        this.position = position;
        this.status = status;
        this.createdAt = createdAt;
    }

    public PendingStaff(Integer companyIdInt, String position) {
        this.companyIdInt = companyIdInt;
        this.position = position;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Companies getCompanyId() {
        return companyId;
    }

    public void setCompanyId(Companies companyId) {
        this.companyId = companyId;
    }

    public Tokens getTokenId() {
        return tokenId;
    }

    public void setTokenId(Tokens tokenId) {
        this.tokenId = tokenId;
    }

    public Users getUserId() {
        return userId;
    }

    public void setUserId(Users userId) {
        this.userId = userId;
    }

    //CUSTOMS GETTERs ONLY
    public Integer getCompanyIdInt() {
        return companyIdInt;
    }

    public Integer getUserIdInt() {
        return userIdInt;
    }

    public Integer getTokenIdInt() {
        return tokenIdInt;
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
        if (!(object instanceof PendingStaff)) {
            return false;
        }
        PendingStaff other = (PendingStaff) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.vizsgaremek.bookr.model.PendingStaff[ id=" + id + " ]";
    }

    public static PendingStaff createPendingStaff(Integer userId, Integer companyId, String email, Integer tokenId, String position) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("createPendingStaff");
            spq.registerStoredProcedureParameter("emailIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("userIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("tokenIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("positionIN", String.class, ParameterMode.IN);

            spq.setParameter("emailIN", email);
            spq.setParameter("companyIdIN", companyId);
            StoredProcedureUtil.setNullableParameter(spq, "userIdIN", userId);
            spq.setParameter("tokenIdIN", tokenId);
            spq.setParameter("positionIN", position);

            spq.execute();

            Integer pendingStaffId = Integer.valueOf(spq.getSingleResult().toString());

            PendingStaff p = new PendingStaff(
                    pendingStaffId
            );

            return p;

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static String checkStaffInviteEligibility(Integer companyId, String email) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("checkStaffInviteEligibility");
            spq.registerStoredProcedureParameter("emailIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);

            spq.setParameter("emailIN", email);
            spq.setParameter("companyIdIN", companyId);

            spq.execute();

            String result = spq.getSingleResult().toString();

            return result;

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static String acceptInvite(Integer userId, String token) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("acceptPendingStaffInvite");
            spq.registerStoredProcedureParameter("tokenIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("userIdIN", Integer.class, ParameterMode.IN);

            spq.setParameter("tokenIN", token);

            StoredProcedureUtil.setNullableParameter(spq, "userIdIN", userId);

            spq.execute();

            String result = spq.getSingleResult().toString();

            return result;

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static List<PendingStaff> getPendingStaffByCompany(Integer companyId) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getPendingStaffByCompany");

            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);

            spq.setParameter("companyIdIN", companyId);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            // Empty list if no results
            if (resultList.isEmpty()) {
                return new ArrayList<>();
            }

            List<PendingStaff> staffList = new ArrayList<>();

            for (Object[] record : resultList) {
                PendingStaff staff = new PendingStaff(
                        Integer.valueOf(record[0].toString()),
                        record[1].toString(),
                        Integer.valueOf(record[2].toString()),
                        record[3] != null ? Integer.valueOf(record[3].toString()) : null,
                        Integer.valueOf(record[4].toString()),
                        record[5].toString(),
                        record[6].toString(),
                        formatter.parse(record[7].toString())
                );
                staffList.add(staff);
            }
            return staffList;

        } catch (Exception ex) {
            ex.printStackTrace();
            return new ArrayList<>();
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static PendingStaff getPendingStaffByEmailForSetUp(String email) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getPendingStaffByEmailForSetUp");

            spq.registerStoredProcedureParameter("emailIN", String.class, ParameterMode.IN);

            spq.setParameter("emailIN", email);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            // Empty list if no results
            if (resultList.isEmpty()) {
                return null;
            }

            Object[] record = resultList.get(0);

            PendingStaff staff = new PendingStaff(
                    Integer.valueOf(record[0].toString()),
                    record[1].toString()
            );

            return staff;

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }

    }

    public static String deleteInvite(Integer pendingStaffId) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("deletePendingStaffInvite");
            spq.registerStoredProcedureParameter("pendingStaffIdIN", Integer.class, ParameterMode.IN);

            spq.setParameter("pendingStaffIdIN", pendingStaffId);

            spq.execute();

            String result = spq.getSingleResult().toString();

            return result;

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
