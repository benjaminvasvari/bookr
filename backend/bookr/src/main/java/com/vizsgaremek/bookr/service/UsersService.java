package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.model.Users;
import com.vizsgaremek.bookr.model.RegistrationResult;
import com.vizsgaremek.bookr.model.AuditLogs;
import com.vizsgaremek.bookr.config.PasswordHasher;
import com.vizsgaremek.bookr.config.ValidationUtil;
import com.vizsgaremek.bookr.security.JWT;
import org.json.JSONObject;

/**
 *
 * @author vben
 */
public class UsersService {

    private final PasswordHasher passwordHasher;
    private final AuditLogService auditLogService;
    private final EmailService emailService;

    public UsersService() {
        this.passwordHasher = new PasswordHasher();
        this.auditLogService = new AuditLogService();
        this.emailService = new EmailService();
    }

    

}
