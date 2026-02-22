package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.model.AuditLogs;
import javax.enterprise.context.ApplicationScoped;

/**
 * Service for audit log business logic and validation
 *
 * @author vben
 */
@ApplicationScoped
public class AuditLogService {

    /**
     * Logs an audit entry with validation
     */
    public void logAudit(AuditLogs auditLog) {
        // Validációk
        if (auditLog.getPerformedByUserIdInt() == null) {
            throw new IllegalArgumentException("Performed by user ID cannot be null");
        }

        if (auditLog.getAction() == null || auditLog.getAction().isEmpty()) {
            throw new IllegalArgumentException("Action cannot be null or empty");
        }

        // MODEL layer handles database communication
        auditLog.logAudit();
    }

    /**
     * Egyszerű logolás action nélkül old/new values
     *
     * @param performedByUserId Ki hajtotta végre a műveletet
     * @param performedByRole Milyen szerepkörben (client, staff, admin, stb.)
     * @param affectedEntityId Kit érintett a művelet (nullable)
     * @param companyId Cég ID (nullable)
     * @param email Email cím (nullable)
     * @param entityType Entitás típus (user, appointment, company, stb.)
     * @param action Művelet típus (login, logout, create, update, delete, stb.)
     */
    public void logSimpleAction(Integer performedByUserId, String performedByRole,
            Integer affectedEntityId, Integer companyId,
            String email, String entityType, String action) 
    {
        AuditLogs auditLog = new AuditLogs(performedByUserId, performedByRole,
                email, entityType, action);
        
        
        auditLog.setAffectedEntityIdInt(affectedEntityId);
        auditLog.setCompanyIdInt(companyId);

        logAudit(auditLog);
    }
}
