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
import javax.persistence.Transient;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import javax.xml.bind.annotation.XmlRootElement;

/**
 *
 * @author vben
 */
@Entity
@Table(name = "tokens")
@XmlRootElement
@NamedQueries({
    @NamedQuery(name = "Tokens.findAll", query = "SELECT t FROM Tokens t"),
    @NamedQuery(name = "Tokens.findById", query = "SELECT t FROM Tokens t WHERE t.id = :id"),
    @NamedQuery(name = "Tokens.findByToken", query = "SELECT t FROM Tokens t WHERE t.token = :token"),
    @NamedQuery(name = "Tokens.findByType", query = "SELECT t FROM Tokens t WHERE t.type = :type"),
    @NamedQuery(name = "Tokens.findByExpiresAt", query = "SELECT t FROM Tokens t WHERE t.expiresAt = :expiresAt"),
    @NamedQuery(name = "Tokens.findByIsRevoked", query = "SELECT t FROM Tokens t WHERE t.isRevoked = :isRevoked"),
    @NamedQuery(name = "Tokens.findByRevokedAt", query = "SELECT t FROM Tokens t WHERE t.revokedAt = :revokedAt"),
    @NamedQuery(name = "Tokens.findByCreatedAt", query = "SELECT t FROM Tokens t WHERE t.createdAt = :createdAt")})
public class Tokens implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 500)
    @Column(name = "token")
    private String token;
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 100)
    @Column(name = "type")
    private String type;
    @Basic(optional = false)
    @NotNull
    @Column(name = "expires_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date expiresAt;
    @Basic(optional = false)
    @NotNull
    @Column(name = "is_revoked")
    private Boolean isRevoked;
    @Column(name = "revoked_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date revokedAt;
    @Basic(optional = false)
    @NotNull
    @Column(name = "created_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Users userId;
    
    @Transient
    private Integer userIdInt;

    public Tokens() {
    }

    public Tokens(Integer id) {
        this.id = id;
    }

    public Tokens(Integer id, String token, String type, Date expiresAt) {
        this.id = id;
        this.token = token;
        this.type = type;
        this.expiresAt = expiresAt;
    }

    // generateEmailVerificationToken response
    public Tokens(String token, Date expiresAt) {
        this.token = token;
        this.expiresAt = expiresAt;
    }

    // getUserTokens
    public Tokens(Integer id, String token, String type, Date expiresAt, Boolean isRevoked) {
        this.id = id;
        this.token = token;
        this.type = type;
        this.expiresAt = expiresAt;
        this.isRevoked = isRevoked;
    }

    public Tokens(Integer id, Integer userIdInt, String token, String type, Date expiresAt, Boolean isRevoked, Date revokedAt, Date createdAt) {
        this.id = id;
        this.userIdInt = userIdInt;
        this.token = token;
        this.type = type;
        this.expiresAt = expiresAt;
        this.isRevoked = isRevoked;
        this.revokedAt = revokedAt;
        this.createdAt = createdAt;
    }
    
    

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Date getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Date expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Boolean getIsRevoked() {
        return isRevoked;
    }

    public void setIsRevoked(Boolean isRevoked) {
        this.isRevoked = isRevoked;
    }

    public Date getRevokedAt() {
        return revokedAt;
    }

    public void setRevokedAt(Date revokedAt) {
        this.revokedAt = revokedAt;
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
    
    public Integer getUserIdInt() {
        return userIdInt;
    }

    public void setUserIdInt(Integer userIdInt) {
        this.userIdInt = userIdInt;
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
        if (!(object instanceof Tokens)) {
            return false;
        }
        Tokens other = (Tokens) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.vizsgaremek.bookr.model.Tokens[ id=" + id + " ]";
    }

    public static Tokens generateEmailVerificationToken(Integer userId) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("generateEmailVerificationToken");
            spq.registerStoredProcedureParameter("userIdIN", Integer.class, ParameterMode.IN);
            spq.setParameter("userIdIN", userId);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return null;
            }

            // Csak az első rekord kell (LIMIT 1 a stored procedure-ben)
            Object[] record = resultList.get(0);

            Tokens token = new Tokens(
                    record[0].toString(),
                    formatter.parse(record[1].toString())
            );

            return token;

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static Tokens generatePasswordResetToken(Integer userId) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("generatePasswordResetToken");
            spq.registerStoredProcedureParameter("idIN", Integer.class, ParameterMode.IN);
            spq.setParameter("idIN", userId);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return null;
            }

            // Csak az első rekord kell (LIMIT 1 a stored procedure-ben)
            Object[] record = resultList.get(0);

            Tokens token = new Tokens(
                    record[0].toString(),
                    formatter.parse(record[1].toString())
            );

            return token;

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static List<Tokens> getUserTokensByEmail(String userEmail) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getUserTokensByEmail");
            spq.registerStoredProcedureParameter("userEmailIN", String.class, ParameterMode.IN);
            spq.setParameter("userEmailIN", userEmail);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            // Empty list if no results
            if (resultList.isEmpty()) {
                return new ArrayList<>();
            }

            List<Tokens> tokensList = new ArrayList<>();

            for (Object[] record : resultList) {
                Tokens token = new Tokens(
                        Integer.valueOf(record[0].toString()),
                        record[1].toString(),
                        record[2].toString(),
                        formatter.parse(record[3].toString()),
                        Boolean.parseBoolean(record[4].toString())
                );

                tokensList.add(token);
            }

            return tokensList;

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static Tokens getTokenInfoByToken(String tokenIN) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getTokenInfoByToken");
            spq.registerStoredProcedureParameter("tokenIN", String.class, ParameterMode.IN);
            spq.setParameter("tokenIN", tokenIN);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return null;
            }

            // Csak az első rekord kell (LIMIT 1 a stored procedure-ben)
            Object[] record = resultList.get(0);

            Tokens token = new Tokens(
                    Integer.valueOf(record[0].toString()),
                    Integer.valueOf(record[1].toString()),
                    record[2].toString(),
                    record[3].toString(),
                    formatter.parse(record[4].toString()),
                    record[5] != null ? Boolean.parseBoolean(record[5].toString()): null,
                    formatter.parse(record[6].toString()),
                    formatter.parse(record[7].toString())
            );

            return token;

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
