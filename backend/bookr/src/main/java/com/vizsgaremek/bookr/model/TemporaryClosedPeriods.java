/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.model;

import com.vizsgaremek.bookr.DTO.OwnerPanelDTO.createTemporaryClosedPeriodDTO;
import static com.vizsgaremek.bookr.model.Users.emf;
import com.vizsgaremek.bookr.util.DateFormatterUtil;
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
import javax.xml.bind.annotation.XmlRootElement;

/**
 *
 * @author vben
 */
@Entity
@Table(name = "temporary_closed_periods")
@XmlRootElement
@NamedQueries({
    @NamedQuery(name = "TemporaryClosedPeriods.findAll", query = "SELECT t FROM TemporaryClosedPeriods t"),
    @NamedQuery(name = "TemporaryClosedPeriods.findById", query = "SELECT t FROM TemporaryClosedPeriods t WHERE t.id = :id"),
    @NamedQuery(name = "TemporaryClosedPeriods.findByStartDate", query = "SELECT t FROM TemporaryClosedPeriods t WHERE t.startDate = :startDate"),
    @NamedQuery(name = "TemporaryClosedPeriods.findByEndDate", query = "SELECT t FROM TemporaryClosedPeriods t WHERE t.endDate = :endDate"),
    @NamedQuery(name = "TemporaryClosedPeriods.findByOpenTime", query = "SELECT t FROM TemporaryClosedPeriods t WHERE t.openTime = :openTime"),
    @NamedQuery(name = "TemporaryClosedPeriods.findByCloseTime", query = "SELECT t FROM TemporaryClosedPeriods t WHERE t.closeTime = :closeTime"),
    @NamedQuery(name = "TemporaryClosedPeriods.findByReason", query = "SELECT t FROM TemporaryClosedPeriods t WHERE t.reason = :reason"),
    @NamedQuery(name = "TemporaryClosedPeriods.findByCreatedAt", query = "SELECT t FROM TemporaryClosedPeriods t WHERE t.createdAt = :createdAt"),
    @NamedQuery(name = "TemporaryClosedPeriods.findByUpdatedAt", query = "SELECT t FROM TemporaryClosedPeriods t WHERE t.updatedAt = :updatedAt"),
    @NamedQuery(name = "TemporaryClosedPeriods.findByIsDeleted", query = "SELECT t FROM TemporaryClosedPeriods t WHERE t.isDeleted = :isDeleted")})
public class TemporaryClosedPeriods implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Basic(optional = false)
    @NotNull
    @Column(name = "start_date")
    @Temporal(TemporalType.DATE)
    private Date startDate;
    @Basic(optional = false)
    @NotNull
    @Column(name = "end_date")
    @Temporal(TemporalType.DATE)
    private Date endDate;
    @Column(name = "open_time")
    @Temporal(TemporalType.TIME)
    private Date openTime;
    @Column(name = "close_time")
    @Temporal(TemporalType.TIME)
    private Date closeTime;
    @Column(name = "reason")
    private String reason;
    @Basic(optional = false)
    @NotNull
    @Column(name = "created_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    @Column(name = "updated_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;
    @Basic(optional = false)
    @NotNull
    @Column(name = "is_deleted")
    private Boolean isDeleted;
    @Column(name = "deleted_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date deletedAt;
    @JoinColumn(name = "company_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Companies companyId;

    @Transient
    private Integer companyIdInt;

    @Transient
    private String startDateStr;
    @Transient
    private String endDateStr;
    @Transient
    private String openTimeStr;
    @Transient
    private String closeTimeStr;
    @Transient
    private String createdAtStr;
    @Transient
    private String updatedAtStr;
    @Transient
    private String deletedAtStr;

    public TemporaryClosedPeriods() {
    }

    public TemporaryClosedPeriods(Integer id) {
        this.id = id;
    }

    public TemporaryClosedPeriods(Integer id, Date startDate, Date endDate, Date createdAt) {
        this.id = id;
        this.startDate = startDate;
        this.endDate = endDate;
        this.createdAt = createdAt;
    }

    public TemporaryClosedPeriods(Integer id, Integer companyIdInt, String startDateStr, String endDateStr, String openTimeStr, String closeTimeStr, String reason, String createdAtStr, String updatedAtStr) {
        this.id = id;
        this.companyIdInt = companyIdInt;
        this.startDateStr = startDateStr;
        this.endDateStr = endDateStr;
        this.openTimeStr = openTimeStr;
        this.closeTimeStr = closeTimeStr;
        this.reason = reason;
        this.createdAtStr = createdAtStr;
        this.updatedAtStr = updatedAtStr;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Date getStartDate() {
        return startDate;
    }

    public void setStartDate(Date startDate) {
        this.startDate = startDate;
    }

    public Date getEndDate() {
        return endDate;
    }

    public void setEndDate(Date endDate) {
        this.endDate = endDate;
    }

    public Date getOpenTime() {
        return openTime;
    }

    public void setOpenTime(Date openTime) {
        this.openTime = openTime;
    }

    public Date getCloseTime() {
        return closeTime;
    }

    public void setCloseTime(Date closeTime) {
        this.closeTime = closeTime;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
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

    public Boolean getIsDeleted() {
        return isDeleted;
    }

    public void setIsDeleted(Boolean isDeleted) {
        this.isDeleted = isDeleted;
    }

    public Date getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(Date deletedAt) {
        this.deletedAt = deletedAt;
    }

    public Companies getCompanyId() {
        return companyId;
    }

    public void setCompanyId(Companies companyId) {
        this.companyId = companyId;
    }

    // CUSTOMS
    public Integer getCompanyIdInt() {
        return companyIdInt;
    }

    public void setCompanyIdInt(Integer companyIdInt) {
        this.companyIdInt = companyIdInt;
    }

    public String getStartDateStr() {
        return startDateStr;
    }

    public String getEndDateStr() {
        return endDateStr;
    }

    public String getOpenTimeStr() {
        return openTimeStr;
    }

    public String getCloseTimeStr() {
        return closeTimeStr;
    }

    public String getCreatedAtStr() {
        return createdAtStr;
    }

    public String getUpdatedAtStr() {
        return updatedAtStr;
    }

    public String getDeletedAtStr() {
        return deletedAtStr;
    }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (id != null ? id.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        if (!(object instanceof TemporaryClosedPeriods)) {
            return false;
        }
        TemporaryClosedPeriods other = (TemporaryClosedPeriods) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.vizsgaremek.bookr.model.TemporaryClosedPeriods[ id=" + id + " ]";
    }

    public static List<TemporaryClosedPeriods> getTemporaryClosedPeriods(Integer id) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getTemporaryClosedPeriods");
            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);
            spq.setParameter("companyIdIN", id);
            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return new ArrayList<>();
            }

            List<TemporaryClosedPeriods> closedPeriodList = new ArrayList<>();

            for (Object[] record : resultList) {
                TemporaryClosedPeriods period = new TemporaryClosedPeriods(
                        Integer.valueOf(record[0].toString()),
                        Integer.valueOf(record[1].toString()),
                        record[2].toString(),
                        record[3].toString(),
                        record[4] != null ? record[4].toString() : null,
                        record[5] != null ? record[5].toString() : null,
                        record[6] != null ? record[6].toString() : null,
                        record[7].toString(),
                        record[8] != null ? record[8].toString() : null
                );

                closedPeriodList.add(period);
            }

            return closedPeriodList;

        } catch (Exception ex) {
            ex.printStackTrace();
            return new ArrayList<>();
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static createTemporaryClosedPeriodDTO createTemporaryClosedPeriod(Integer id, createTemporaryClosedPeriodDTO request) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("createTemporaryClosedPeriod");
            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("startDateIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("endDateIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("openTimeIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("closeTimeIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("reasonIN", String.class, ParameterMode.IN);

            spq.setParameter("companyIdIN", id);
            spq.setParameter("startDateIN", request.getStartDate());
            spq.setParameter("endDateIN", request.getEndDate());
            StoredProcedureUtil.setNullableParameter(spq, "openTimeIN", request.getOpenTime());
            StoredProcedureUtil.setNullableParameter(spq, "closeTimeIN", request.getCloseTime());
            StoredProcedureUtil.setNullableParameter(spq, "reasonIN", request.getReason());

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return null;
            }

            Object[] record = resultList.get(0);

            createTemporaryClosedPeriodDTO dolog = new createTemporaryClosedPeriodDTO(
                    Integer.valueOf(record[0].toString()),
                    record[1].toString(),
                    record[2].toString(),
                    record[3] != null ? record[3].toString() : null,
                    record[4] != null ? record[4].toString() : null,
                    record[5] != null ? record[5].toString() : null
            );

            return dolog;

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static createTemporaryClosedPeriodDTO updateTemporaryClosedPeriod(Integer periodId, createTemporaryClosedPeriodDTO request) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("updateTemporaryClosedPeriod");
            spq.registerStoredProcedureParameter("idIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("startDateIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("endDateIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("openTimeIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("closeTimeIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("reasonIN", String.class, ParameterMode.IN);

            spq.setParameter("idIN", periodId);
            spq.setParameter("startDateIN", request.getStartDate());
            spq.setParameter("endDateIN", request.getEndDate());
            StoredProcedureUtil.setNullableParameter(spq, "openTimeIN", request.getOpenTime());
            StoredProcedureUtil.setNullableParameter(spq, "closeTimeIN", request.getCloseTime());
            StoredProcedureUtil.setNullableParameter(spq, "reasonIN", request.getReason());

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return null;
            }

            Object[] record = resultList.get(0);

            createTemporaryClosedPeriodDTO dolog = new createTemporaryClosedPeriodDTO(
                    Integer.valueOf(record[0].toString()),
                    record[1].toString(),
                    record[2].toString(),
                    record[3] != null ? record[3].toString() : null,
                    record[4] != null ? record[4].toString() : null,
                    record[5] != null ? record[5].toString() : null
            );

            return dolog;

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static boolean deleteTemporaryClosedPeriod(Integer periodId) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("deleteTemporaryClosedPeriod");
            spq.registerStoredProcedureParameter("idIN", Integer.class, ParameterMode.IN);

            spq.setParameter("idIN", periodId);

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
