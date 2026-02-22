/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.model.AuditLogs;
import com.vizsgaremek.bookr.model.Companies;
import com.vizsgaremek.bookr.model.PendingStaff;
import com.vizsgaremek.bookr.model.Tokens;
import com.vizsgaremek.bookr.model.Users;
import com.vizsgaremek.bookr.security.JWT;
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
    private AuditLogService AuditLogService = new AuditLogService();
    private EmailService EmailService = new EmailService();

    private static EntityManagerFactory emf = Persistence.createEntityManagerFactory("com.vizsgaremek_bookr_war_1.0-SNAPSHOTPU");

    public JSONObject inviteStaff(Integer companyId, PendingStaff request, String token) {

        EntityManager em = null;

        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

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
}
