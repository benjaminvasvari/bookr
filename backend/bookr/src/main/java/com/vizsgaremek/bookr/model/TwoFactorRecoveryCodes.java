package com.vizsgaremek.bookr.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import javax.persistence.Basic;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;
import javax.persistence.ParameterMode;
import javax.persistence.Persistence;
import javax.persistence.StoredProcedureQuery;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import javax.xml.bind.annotation.XmlRootElement;

@Entity
@Table(name = "two_factor_recovery_codes")
@XmlRootElement
@NamedQueries({
        @NamedQuery(name = "TwoFactorRecoveryCodes.findAll", query = "SELECT t FROM TwoFactorRecoveryCodes t"),
        @NamedQuery(name = "TwoFactorRecoveryCodes.findById", query = "SELECT t FROM TwoFactorRecoveryCodes t WHERE t.id = :id"),
        @NamedQuery(name = "TwoFactorRecoveryCodes.findByCode", query = "SELECT t FROM TwoFactorRecoveryCodes t WHERE t.code = :code"),
        @NamedQuery(name = "TwoFactorRecoveryCodes.findByUsedAt", query = "SELECT t FROM TwoFactorRecoveryCodes t WHERE t.usedAt = :usedAt"),
        @NamedQuery(name = "TwoFactorRecoveryCodes.findByIsUsed", query = "SELECT t FROM TwoFactorRecoveryCodes t WHERE t.isUsed = :isUsed"),
        @NamedQuery(name = "TwoFactorRecoveryCodes.findByCreatedAt", query = "SELECT t FROM TwoFactorRecoveryCodes t WHERE t.createdAt = :createdAt")
})
public class TwoFactorRecoveryCodes implements Serializable {

    private static final long serialVersionUID = 1L;
    static EntityManagerFactory emf = Persistence.createEntityManagerFactory("com.vizsgaremek_bookr_war_1.0-SNAPSHOTPU");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;

    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 64)
    @Column(name = "code")
    private String code;

    @Column(name = "used_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date usedAt;

    @Basic(optional = false)
    @NotNull
    @Column(name = "is_used")
    private boolean isUsed;

    @Basic(optional = false)
    @NotNull
    @Column(name = "created_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;

    @JoinColumn(name = "user_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Users userId;

    public TwoFactorRecoveryCodes() {
    }

    public TwoFactorRecoveryCodes(Integer id) {
        this.id = id;
    }

    public TwoFactorRecoveryCodes(Integer id, String code, boolean isUsed, Date createdAt) {
        this.id = id;
        this.code = code;
        this.isUsed = isUsed;
        this.createdAt = createdAt;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public Date getUsedAt() {
        return usedAt;
    }

    public void setUsedAt(Date usedAt) {
        this.usedAt = usedAt;
    }

    public boolean getIsUsed() {
        return isUsed;
    }

    public void setIsUsed(boolean isUsed) {
        this.isUsed = isUsed;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
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
        if (!(object instanceof TwoFactorRecoveryCodes)) {
            return false;
        }
        TwoFactorRecoveryCodes other = (TwoFactorRecoveryCodes) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.vizsgaremek.bookr.model.TwoFactorRecoveryCodes[ id=" + id + " ]";
    }

    // --- Static DB methods ---

    public static boolean saveAll(Integer userId, List<String> hashedCodes) {
        EntityManager em = emf.createEntityManager();
        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("saveRecoveryCodes");
            spq.registerStoredProcedureParameter("userIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("code1", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("code2", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("code3", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("code4", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("code5", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("code6", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("code7", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("code8", String.class, ParameterMode.IN);

            spq.setParameter("userIdIN", userId);
            spq.setParameter("code1", hashedCodes.get(0));
            spq.setParameter("code2", hashedCodes.get(1));
            spq.setParameter("code3", hashedCodes.get(2));
            spq.setParameter("code4", hashedCodes.get(3));
            spq.setParameter("code5", hashedCodes.get(4));
            spq.setParameter("code6", hashedCodes.get(5));
            spq.setParameter("code7", hashedCodes.get(6));
            spq.setParameter("code8", hashedCodes.get(7));

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

    public static List<TwoFactorRecoveryCodes> getUnusedByUserId(Integer userId) {
        EntityManager em = emf.createEntityManager();
        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getUnusedRecoveryCodes");
            spq.registerStoredProcedureParameter("userIdIN", Integer.class, ParameterMode.IN);
            spq.setParameter("userIdIN", userId);
            spq.execute();

            List<Object[]> resultList = spq.getResultList();
            List<TwoFactorRecoveryCodes> codes = new ArrayList<>();

            for (Object[] record : resultList) {
                TwoFactorRecoveryCodes code = new TwoFactorRecoveryCodes(
                        Integer.valueOf(record[0].toString()),
                        record[1].toString(),
                        (boolean) record[2],
                        (Date) record[3]
                );
                codes.add(code);
            }

            return codes;

        } catch (Exception ex) {
            ex.printStackTrace();
            return new ArrayList<>();
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static boolean deleteAllByUserId(Integer userId) {
        EntityManager em = emf.createEntityManager();
        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("deleteRecoveryCodes");
            spq.registerStoredProcedureParameter("userIdIN", Integer.class, ParameterMode.IN);
            spq.setParameter("userIdIN", userId);
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
}