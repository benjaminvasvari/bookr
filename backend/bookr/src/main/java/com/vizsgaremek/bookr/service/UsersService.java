package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.security.PasswordHasher;
import com.vizsgaremek.bookr.util.ValidationUtil;
import com.vizsgaremek.bookr.model.AuditLogs;
import com.vizsgaremek.bookr.model.Tokens;
import com.vizsgaremek.bookr.model.Users;
import com.vizsgaremek.bookr.security.JWT;
import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import org.json.JSONObject;

/**
 *
 * @author vben
 */
@ApplicationScoped
public class UsersService {

    @Inject
    private AuditLogService auditLogService;

    @Inject
    private EmailService EmailService;
    
    @Inject
    private PasswordHasher PasswordHasher;

    public JSONObject getUserProfile(String token) {

        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        Integer userId = JWT.getUserIdFromAccessToken(token);
        String userRoles = JWT.getRolesFromAccessToken(token);

        // Permission Validation
        if (!userRoles.contains("client")) {
            status = "NoPermission";
            statusCode = 403;

            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
            return toReturn;
        }

        //code
        if (userId > 0) {
            Users modelResult = Users.getUserProfile(userId);

            JSONObject result = new JSONObject();
            result.put("id", modelResult.getId());
            result.put("firstName", modelResult.getFirstName());
            result.put("lastName", modelResult.getLastName());
            result.put("email", modelResult.getEmail());
            result.put("phone", modelResult.getPhone());
            result.put("imageUrl", modelResult.getImageUrl());
            result.put("createdAt", modelResult.getCreatedAt());

            toReturn.put("data", result);

        } else {
            status = "InvalidParamValue";
            statusCode = 417;
        }

        toReturn.put("status", status);
        toReturn.put("statusCode", statusCode);
        return toReturn;
    }

    public JSONObject softDeleteUser(String token) {

        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        Integer userId = JWT.getUserIdFromAccessToken(token);
        String userRoles = JWT.getRolesFromAccessToken(token);
        String userEmail = JWT.getEmailFromAccessToken(token);

        // Permission Validation
        if (!userRoles.contains("client")) {
            status = "NoPermission";
            statusCode = 403;

            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
            return toReturn;
        }

        //code
        if (userId >= 0) {
            status = "InvalidParam";
            statusCode = 417;
        } else {
            Boolean modelResult = Users.softDeleteUser(userId);

            if (modelResult == false) {
                status = "serverError";
                statusCode = 500;
            } else {
                // ========== AUDIT LOG ==========
                try {
                    auditLogService.logSimpleAction(
                            userId,
                            userRoles.split(",")[0].trim(),
                            null,
                            JWT.getCompanyIdFromAccessToken(token) != null ? JWT.getCompanyIdFromAccessToken(token) : null,
                            userEmail,
                            "user",
                            "login"
                    );

                } catch (Exception ex) {
                    // Log the error but don't fail the registration
                    ex.printStackTrace();
                }
                // ===============================
            }
            toReturn.put("result", modelResult);
        }

        toReturn.put(
                "status", status);
        toReturn.put(
                "statusCode", statusCode);
        return toReturn;
    }

    public JSONObject updateUser(Users updatedUser, String jwtToken) {

        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        Integer performedId = JWT.getUserIdFromAccessToken(jwtToken);
        String performedUserRoles = JWT.getRolesFromAccessToken(jwtToken);

        //code
        Users userToUpdate = new Users(updatedUser.getId());

        if (userToUpdate.getId() == null) {
            status = "InvalidUser";
            statusCode = 417;
        } else {
            if (ValidationUtil.isValidEmail(updatedUser.getEmail()) == false) {
                status = "InvalidEmail";
                statusCode = 417;
            } else {
                Boolean modelResult = Users.updateUser(updatedUser);
                if (modelResult == false) {
                    status = "serverError";
                    statusCode = 500;
                } else {
                    Users userFromDB = Users.getUserById(updatedUser.getId());

                    // ========== AUDIT LOG ==========
                    if (performedId == updatedUser.getId()) {

                        try {
                            AuditLogs auditLog = new AuditLogs(
                                    updatedUser.getId(),
                                    performedUserRoles.split(",")[0].trim(),
                                    userFromDB.getEmail(),
                                    "user",
                                    "updateUser"
                            );
                            auditLog.addOldValue("first_name", userFromDB.getFirstName());
                            auditLog.addOldValue("last_name", userFromDB.getLastName());
                            auditLog.addOldValue("email", userFromDB.getEmail());
                            auditLog.addOldValue("phone", userFromDB.getPhone());

                            auditLog.addNewValue("first_name", updatedUser.getFirstName());
                            auditLog.addNewValue("last_name", updatedUser.getLastName());
                            auditLog.addNewValue("email", updatedUser.getEmail());
                            auditLog.addNewValue("phone", updatedUser.getPhone());

                            auditLogService.logAudit(auditLog);

                        } catch (Exception ex) {
                            // Log the error but don't fail the registration
                            ex.printStackTrace();
                        }
                    } else if (performedUserRoles.split(",")[0].trim() == "superadmin") {
                        try {
                            AuditLogs auditLog = new AuditLogs(
                                    performedId,
                                    performedUserRoles.split(",")[0].trim(),
                                    updatedUser.getId(),
                                    userFromDB.getEmail(),
                                    "user",
                                    "updateUser"
                            );
                            auditLog.addOldValue("first_name", userFromDB.getFirstName());
                            auditLog.addOldValue("last_name", userFromDB.getLastName());
                            auditLog.addOldValue("email", userFromDB.getEmail());
                            auditLog.addOldValue("phone", userFromDB.getPhone());

                            auditLog.addNewValue("first_name", updatedUser.getFirstName());
                            auditLog.addNewValue("last_name", updatedUser.getLastName());
                            auditLog.addNewValue("email", updatedUser.getEmail());
                            auditLog.addNewValue("phone", updatedUser.getPhone());

                            auditLogService.logAudit(auditLog);

                        } catch (Exception ex) {
                            // Log the error but don't fail the registration
                            ex.printStackTrace();
                        }
                    }
                    // ==================================

                    // ========== EMAIL KÜLDÉS ==========
                    Tokens newVerifyToken = Tokens.generateEmailVerificationToken(updatedUser.getId());

                    try {
                        EmailService.sendVerificationEmail(
                                updatedUser.getEmail(),
                                updatedUser.getFirstName(),
                                newVerifyToken.getToken()
                        );
                    } catch (Exception ex) {
                        // Log the error but don't fail the registration
                        System.err.println("Failed to send verification email: " + ex.getMessage());
                        ex.printStackTrace();
                    }
                    // ===============================

                }
                toReturn.put("result", modelResult);
            }
        }

        toReturn.put("status", status);
        toReturn.put("statusCode", statusCode);
        return toReturn;
    }
    

}
