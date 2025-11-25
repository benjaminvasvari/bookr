package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.model.AuditLogs;
import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.ParameterMode;
import javax.persistence.Persistence;
import javax.persistence.StoredProcedureQuery;
import org.json.JSONObject;

/**
 * Service for logging audit entries to the database
 *
 * @author vben
 */
public class AuditLogService {

    private static EntityManagerFactory emf = Persistence.createEntityManagerFactory("com.vizsgaremek_bookr_war_1.0-SNAPSHOTPU");

    /**
     * Logs an audit entry to the database using the logAudit stored procedure
     *
     * @param auditLog AuditLog object containing all audit information
     */
    public void logAudit(AuditLogs auditLog) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("logAudit");

            // Register parameters
            spq.registerStoredProcedureParameter("userIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("companyIdIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("emailIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("entityTypeIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("actionIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("oldValuesIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("newValuesIN", String.class, ParameterMode.IN);

            // Set parameters
            spq.setParameter("userIdIN", auditLog.getUserId());

            // Handle nullable companyId using Hibernate API
            if (auditLog.getCompanyId() != null) {
                spq.setParameter("companyIdIN", auditLog.getCompanyId());
            } else {
                // Use Hibernate's unwrap to enable passing nulls
                spq.unwrap(org.hibernate.procedure.ProcedureCall.class)
                        .getParameterRegistration("companyIdIN")
                        .enablePassingNulls(true);
                spq.setParameter("companyIdIN", null);
            }

            spq.setParameter("emailIN", auditLog.getEmail());
            spq.setParameter("entityTypeIN", auditLog.getEntityType());
            spq.setParameter("actionIN", auditLog.getAction());

            // Handle JSON conversion for old values
            JSONObject oldValuesJson = auditLog.getOldValuesAsJson();
            if (oldValuesJson != null) {
                spq.setParameter("oldValuesIN", oldValuesJson.toString());
            } else {
                spq.unwrap(org.hibernate.procedure.ProcedureCall.class)
                        .getParameterRegistration("oldValuesIN")
                        .enablePassingNulls(true);
                spq.setParameter("oldValuesIN", null);
            }

            // Handle JSON conversion for new values
            JSONObject newValuesJson = auditLog.getNewValuesAsJson();
            if (newValuesJson != null) {
                spq.setParameter("newValuesIN", newValuesJson.toString());
            } else {
                spq.unwrap(org.hibernate.procedure.ProcedureCall.class)
                        .getParameterRegistration("newValuesIN")
                        .enablePassingNulls(true);
                spq.setParameter("newValuesIN", null);
            }

            spq.execute();

        } catch (Exception ex) {
            ex.printStackTrace();
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    /**
     * Convenience method for logging simple actions without old/new values
     *
     * @param userId The ID of the user performing the action
     * @param companyId The ID of the company (can be null)
     * @param email The email of the user
     * @param entityType The type of entity (e.g., "user", "appointment")
     * @param action The action performed (e.g., "login", "logout")
     */
    public void logSimpleAction(int userId, Integer companyId, String email, String entityType, String action) {
        AuditLogs auditLog = new AuditLogs(userId, email, entityType, action)
                .setCompanyId(companyId);
        logAudit(auditLog);
    }
}
