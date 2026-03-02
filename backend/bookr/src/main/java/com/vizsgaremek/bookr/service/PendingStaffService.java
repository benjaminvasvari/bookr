/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.DTO.checkStaffInviteTokenDTO;
import com.vizsgaremek.bookr.config.EnvConfig;
import com.vizsgaremek.bookr.model.AuditLogs;
import com.vizsgaremek.bookr.model.Companies;
import com.vizsgaremek.bookr.model.PendingStaff;
import com.vizsgaremek.bookr.model.Staff;
import com.vizsgaremek.bookr.model.StaffWorkingHours;
import com.vizsgaremek.bookr.model.Tokens;
import com.vizsgaremek.bookr.model.UserXRole;
import com.vizsgaremek.bookr.model.Users;
import com.vizsgaremek.bookr.security.JWT;
import com.vizsgaremek.bookr.util.ErrorResponseBuilder;
import java.time.ZoneId;
import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.Persistence;
import org.json.JSONObject;

/**
 *
 * @author vben
 */
public class PendingStaffService {

    private PendingStaff layer = new PendingStaff();
    private CompaniesService CompaniesService = new CompaniesService();
    private Companies Companies = new Companies();
    private UsersService UsersService = new UsersService();
    private Tokens Tokens = new Tokens();
    private Staff Staff = new Staff();
    private AuditLogService AuditLogService = new AuditLogService();
    private EmailService EmailService = new EmailService();
    private EnvConfig EnvConfig = new EnvConfig();

    private static EntityManagerFactory emf = Persistence.createEntityManagerFactory("com.vizsgaremek_bookr_war_1.0-SNAPSHOTPU");

    public JSONObject inviteStaff(Integer companyId, PendingStaff request, String token) {

        EntityManager em = null;

        JSONObject toReturn = new JSONObject();
        String status = "created";
        Integer statusCode = 201;

        // EntityManager létrehozása
        em = emf.createEntityManager();

        // Tranzakció indítása
        em.getTransaction().begin();

        try {

            Boolean companyExist = CompaniesService.validateCompanyExist(companyId);

            if (!companyExist) {
                JSONObject error = new JSONObject();
                error.put("statusCode", 404);
                error.put("status", "NotFound");
                error.put("message", "Company not found with ID: " + companyId);
                em.getTransaction().rollback();

                return error;
            }

            String StaffInviteEligibility = layer.checkStaffInviteEligibility(companyId, request.getEmail());

            if (StaffInviteEligibility == null) {
                toReturn.put("status", "InternalServerError");
                toReturn.put("statusCode", 500);
                em.getTransaction().rollback();

                return toReturn;
            }

            switch (StaffInviteEligibility) {
                case "already_staff":
                    toReturn.put("status", "Conflict");
                    toReturn.put("statusCode", 409);
                    toReturn.put("message", "Ez a felhasználó már tagja egy cégnek.");
                    em.getTransaction().rollback();

                    return toReturn;
                case "invite_exists":
                    toReturn.put("status", "Conflict");
                    toReturn.put("statusCode", 409);
                    toReturn.put("message", "A felhasználó már megvan hívva ehhez a céghez.");
                    em.getTransaction().rollback();

                    return toReturn;
            }

            // Check user
            Boolean isUserExist = UsersService.validateUserExistByEmail(request.getEmail());
            Users userModelResult = null;

            if (isUserExist) {
                userModelResult = Users.getUserProfileByEmail(request.getEmail());

                if (userModelResult == null) {
                    toReturn.put("status", "InternalServerError");
                    toReturn.put("statusCode", 500);
                    em.getTransaction().rollback();

                    return toReturn;
                }

            }

            Tokens tokenData = Tokens.generateStaffInviteToken(isUserExist ? userModelResult.getId() : null, companyId, request.getEmail());

            // NULL ELLENŐRZÉS
            if (tokenData == null) {
                toReturn.put("status", "InternalServerError");
                toReturn.put("statusCode", 500);
                em.getTransaction().rollback();

                return toReturn;
            }

            PendingStaff pendingStaffModelResult = layer.createPendingStaff(isUserExist ? userModelResult.getId() : null, companyId, request.getEmail(), tokenData.getId(), request.getPosition());

            // NULL ELLENŐRZÉS
            if (pendingStaffModelResult == null) {
                toReturn.put("status", "InternalServerError");
                toReturn.put("statusCode", 500);
                em.getTransaction().rollback();

                return toReturn;
            }

            Companies companyData = Companies.getCompanyShort(companyId);

            if (companyData == null) {
                toReturn.put("status", "InternalServerError");
                toReturn.put("statusCode", 500);
                em.getTransaction().rollback();

                return toReturn;
            }

            Integer performedUserId = JWT.getUserIdFromAccessToken(token);

            Users ownerData = Users.getUserProfile(performedUserId);

            if (ownerData == null) {
                toReturn.put("status", "InternalServerError");
                toReturn.put("statusCode", 500);
                em.getTransaction().rollback();

                return toReturn;
            }

            // ========== AUDIT LOG ==========
            try {
                String performedUserBestRole = JWT.getUserBestRoleFromAccessToken(token);
                String performedUserEmail = JWT.getEmailFromAccessToken(token);

                AuditLogs auditLog = new AuditLogs(
                        performedUserId,
                        performedUserBestRole,
                        isUserExist ? userModelResult.getId() : null, // affected id
                        companyId,
                        performedUserEmail,
                        "staff",
                        "invite"
                );
                if (isUserExist) {
                    auditLog.addNewValue("user_id", userModelResult.getId());
                    auditLog.addNewValue("first_name", userModelResult.getFirstName());
                    auditLog.addNewValue("last_name", userModelResult.getLastName());
                }
                auditLog.addNewValue("email", request.getEmail());
                auditLog.addNewValue("position", request.getPosition());

                AuditLogService.logAudit(auditLog);
            } catch (Exception ex) {
                // Log the error but don't fail the registration
                ex.printStackTrace();
            }
            // ========== EMAIL KÜLDÉS ==========
            EmailService.sendStaffInviteEmail(
                    request.getEmail(),
                    isUserExist ? userModelResult.getFirstName() : null,
                    companyData.getName(),
                    companyData.getCity(),
                    ownerData.getLastName() + " " + ownerData.getFirstName(),
                    request.getPosition(),
                    tokenData.getToken(),
                    tokenData.getExpiresAt().toInstant().atZone(ZoneId.systemDefault()).toLocalDate()
            );
            // ==================================

            em.getTransaction().commit();

            JSONObject result = new JSONObject();

            result.put("id", pendingStaffModelResult.getId());
            result.put("firstName", isUserExist ? userModelResult.getFirstName() : JSONObject.NULL);
            result.put("lastName", isUserExist ? userModelResult.getLastName() : JSONObject.NULL);
            result.put("email", request.getEmail());
            result.put("position", request.getPosition());

            toReturn.put("result", result);
            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);

        } catch (Exception ex) {
            ex.printStackTrace();
            if (em != null && em.getTransaction().isActive()) {
                em.getTransaction().rollback();
            }
            toReturn.put("status", "InternalServerError");
            toReturn.put("statusCode", 500);
        } finally {
            if (em != null) {
                em.close();
            }
        }
        return toReturn;
    }

    public JSONObject checkInvite(String token) {

        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        try {

            // Adatbázis lekérdezés
            checkStaffInviteTokenDTO tokenCheckMResult = Tokens.checkStaffInviteToken(token);

            // NULL ELLENŐRZÉS
            if (tokenCheckMResult == null) {
                status = "NotFound";
                statusCode = 404;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                toReturn.put("message", "No company found");
                return toReturn;
            }

            Boolean companyExist = CompaniesService.validateCompanyExist(tokenCheckMResult.getCompanyId());

            if (!companyExist) {
                JSONObject error = new JSONObject();
                error.put("statusCode", 404);
                error.put("status", "NotFound");
                error.put("message", "Company not found with ID: " + tokenCheckMResult.getCompanyId());
                return error;
            }

            // Sikeres válasz összeállítása
            JSONObject result = new JSONObject();

            result.put("checkStatus", tokenCheckMResult.getResult());
            result.put("userId", tokenCheckMResult.getUserId() != null ? tokenCheckMResult.getUserId() : JSONObject.NULL);
            result.put("expiresAt", tokenCheckMResult.getExpiresAt() != null ? tokenCheckMResult.getExpiresAt() : JSONObject.NULL);
            result.put("email", tokenCheckMResult.getEmail() != null ? tokenCheckMResult.getEmail() : JSONObject.NULL);
            result.put("companyId", tokenCheckMResult.getCompanyId() != null ? tokenCheckMResult.getCompanyId() : JSONObject.NULL);
            result.put("position", tokenCheckMResult.getPosition() != null ? tokenCheckMResult.getPosition() : JSONObject.NULL);

            toReturn.put("result", result);

            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);

        } catch (Exception ex) {
            ex.printStackTrace();
            status = "InternalServerError";
            statusCode = 500;
            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
        }

        return toReturn;
    }

    public JSONObject acceptInvite(String token) {

        EntityManager em = null;

        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        // EntityManager létrehozása
        em = emf.createEntityManager();

        // Tranzakció indítása
        em.getTransaction().begin();

        try {

            // Adatbázis lekérdezés
            checkStaffInviteTokenDTO tokenCheckMResult = Tokens.checkStaffInviteToken(token);

            if (tokenCheckMResult == null) {
                em.getTransaction().rollback();
                return ErrorResponseBuilder.buildErrorResponseJSON(500, "InternalServerError");
            }

            if (!"valid".equals(tokenCheckMResult.getResult()) || tokenCheckMResult == null) {
                em.getTransaction().rollback();

                return ErrorResponseBuilder.buildErrorResponseJSON(401, "Unouthorized");

            }

            Boolean companyExist = CompaniesService.validateCompanyExist(tokenCheckMResult.getCompanyId());

            if (!companyExist) {
                em.getTransaction().rollback();
                return ErrorResponseBuilder.buildErrorResponseJSON(404, "NotFound");
            }

            String tokenRevokedStatus = Tokens.acceptPendingStaffToken(token);

            if (tokenRevokedStatus == null || "not_found".equals(tokenRevokedStatus)) {
                em.getTransaction().rollback();
                return ErrorResponseBuilder.buildErrorResponseJSON(404, "NotFound");
            }

            String pendingStaffAccept = PendingStaff.acceptInvite(tokenCheckMResult.getUserId(), token);

            if ("expired".equals(pendingStaffAccept)) {
                em.getTransaction().rollback();
                return ErrorResponseBuilder.buildErrorResponseJSON(403, "Forbidden");
            } else if ("not_found".equals(pendingStaffAccept)) {
                em.getTransaction().rollback();
                return ErrorResponseBuilder.buildErrorResponseJSON(400, "BadRequest");
            }

            Users staffUser = null;

            // IF HAS USER
            if (tokenCheckMResult.getUserId() != null && tokenCheckMResult.getUserId() > 0) {
                Staff createdStaff = Staff.createStaff(tokenCheckMResult.getUserId(), tokenCheckMResult.getCompanyId(), tokenCheckMResult.getPosition());
                staffUser = Users.getUserProfile(tokenCheckMResult.getUserId());

                if (createdStaff == null) {
                    em.getTransaction().rollback();
                    return ErrorResponseBuilder.buildErrorResponseJSON(500, "InternalServerError");
                }

                String createStaffWorkingHoursResult = StaffWorkingHours.createStaffWorkingHours(createdStaff.getId(), tokenCheckMResult.getCompanyId());

                if (createStaffWorkingHoursResult == null) {
                    em.getTransaction().rollback();
                    return ErrorResponseBuilder.buildErrorResponseJSON(500, "InternalServerError");
                }

                Boolean isUserAssignedToCompany = Users.assignCompanyToUser(tokenCheckMResult.getUserId(), tokenCheckMResult.getCompanyId());
                if (!isUserAssignedToCompany) {
                    em.getTransaction().rollback();
                    return ErrorResponseBuilder.buildErrorResponseJSON(500, "InternalServerError");
                }

                Boolean isUserAssignedToRole = UserXRole.assignRole(tokenCheckMResult.getUserId(), 3);
                if (!isUserAssignedToRole) {
                    em.getTransaction().rollback();
                    return ErrorResponseBuilder.buildErrorResponseJSON(500, "InternalServerError");
                }
            }

            // ========== EMAIL KÜLDÉS ==========
            try {
                Companies companyResult = Companies.getCompanyInfoForEmail(tokenCheckMResult.getCompanyId());

                String dashboardAddress = EnvConfig.getAppBaseUrl() + "/owner/staff";

                EmailService.sendStaffInviteAcceptedEmail(
                        companyResult.getEmail(),
                        companyResult.getOwnerName(),
                        staffUser != null ? staffUser.getLastName() + staffUser.getFirstName() : null,
                        status,
                        companyResult.getName(),
                        tokenCheckMResult.getPosition(),
                        dashboardAddress
                );
            } catch (Exception ex) {
                // Log the error but don't fail the registration
                System.err.println("Failed to send verification email: " + ex.getMessage());
                ex.printStackTrace();
            }
            // ==================================

            // ========== AUDIT LOG ==========
            try {

                AuditLogs auditLog = new AuditLogs(
                        tokenCheckMResult.getUserId() != null ? tokenCheckMResult.getUserId() : null,
                        "client",
                        tokenCheckMResult.getUserId(),
                        tokenCheckMResult.getEmail() != null ? tokenCheckMResult.getEmail() : null,
                        "staff",
                        "invite_accepted"
                );

                auditLog.addNewValue("company", tokenCheckMResult.getCompanyId());
                auditLog.addNewValue("specialty", tokenCheckMResult.getPosition());

                AuditLogService.logAudit(auditLog);

            } catch (Exception ex) {
                em.getTransaction().rollback();
                ex.printStackTrace();
                return ErrorResponseBuilder.buildErrorResponseJSON(500, "InternalServerError");
            }

            em.getTransaction().commit();

            toReturn.put("result", "accepted");

            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);

        } catch (Exception ex) {
            ex.printStackTrace();
            status = "InternalServerError";
            statusCode = 500;
            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
        }

        return toReturn;
    }

    public JSONObject deleteInvite(Integer pStaffId) {

        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        try {
            String modelResult = layer.deleteInvite(pStaffId);

            if (!"success".equals(modelResult)) {
                JSONObject error = new JSONObject();
                error.put("statusCode", 404);
                error.put("status", "NotFound");
                error.put("message", "Invite not found with ID: " + pStaffId);
                return error;
            }

            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);

        } catch (Exception ex) {
            ex.printStackTrace();
            status = "InternalServerError";
            statusCode = 500;
            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
        }

        return toReturn;
    }
}
