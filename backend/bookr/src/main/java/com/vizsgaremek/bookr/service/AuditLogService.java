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
        if (auditLog.getUserId() == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        
        if (auditLog.getEmail() == null || auditLog.getEmail().isEmpty()) {
            throw new IllegalArgumentException("Email cannot be null or empty");
        }
        
        if (auditLog.getAction() == null || auditLog.getAction().isEmpty()) {
            throw new IllegalArgumentException("Action cannot be null or empty");
        }
        
        // MODEL layer handles database communication
        auditLog.logAudit();
    }

    /**
     * Egyszerű logolás action nélkül old/new values
     */
    public void logSimpleAction(Integer userId, Integer companyId, String email, 
                                String entityType, String action) {
        AuditLogs auditLog = new AuditLogs(userId, email, entityType, action);
        auditLog.setCompanyId(companyId);
        
        logAudit(auditLog);
    }
}