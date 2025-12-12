package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.config.ValidationUtil;
import com.vizsgaremek.bookr.model.AuditLogs;
import com.vizsgaremek.bookr.model.Users;
import com.vizsgaremek.bookr.security.JWT;
import javax.inject.Inject;
import org.json.JSONObject;

/**
 *
 * @author vben
 */
public class UsersService {

    @Inject
    private AuditLogService auditLogService;

    public JSONObject getUserProfile(String token) {

        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        Integer userId = JWT.getUserIdFromAccessToken(token);
        String userRoles = JWT.getRoleNameFromAccessToken(token);

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
        String userRoles = JWT.getRoleNameFromAccessToken(token);
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
                    AuditLogs auditLog = new AuditLogs(
                            userId,
                            userEmail,
                            userRoles.split(",")[0],
                            "deleteUser"
                    );
                    auditLogService.logAudit(auditLog);

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

        Integer userId = JWT.getUserIdFromAccessToken(jwtToken);
        String userRoles = JWT.getRoleNameFromAccessToken(jwtToken);
        String userEmail = JWT.getEmailFromAccessToken(jwtToken);

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
                Boolean modelResult = Users.updateUser(updatedUser, userId);
                if (modelResult == false) {
                    status = "serverError";
                    statusCode = 500;
                } else {
                    // ========== AUDIT LOG ==========
                    try {
                        AuditLogs auditLog = new AuditLogs(
                                userId,
                                userEmail,
                                userRoles.split(",")[0],
                                "updateUser"
                        );
                        auditLog.addOldValue("user_id", registrationResult.getUserId());
                        auditLog.addOldValue("email", clientRegistered.getEmail());
                        auditLog.addOldValue("first_name", clientRegistered.getFirstName());
                        auditLog.addOldValue("last_name", clientRegistered.getLastName());
                        auditLog.addOldValue("roles", userRoles);
                        
                        auditLog.addNewValue("user_id", registrationResult.getUserId());
                        auditLog.addNewValue("email", clientRegistered.getEmail());
                        auditLog.addNewValue("first_name", clientRegistered.getFirstName());
                        auditLog.addNewValue("last_name", clientRegistered.getLastName());
                        auditLog.addNewValue("roles", userRoles);

                        auditLogService.logAudit(auditLog);

                    } catch (Exception ex) {
                        // Log the error but don't fail the registration
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
