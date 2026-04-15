package com.vizsgaremek.bookr.controller;

import com.vizsgaremek.bookr.model.Users;
import com.vizsgaremek.bookr.security.JWT;
import com.vizsgaremek.bookr.service.AuditLogService;
import com.vizsgaremek.bookr.service.TwoFactorService;
import com.vizsgaremek.bookr.util.RoleChecker;

import static com.vizsgaremek.bookr.util.ErrorResponseBuilder.buildErrorResponse;

import java.util.List;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.json.JSONArray;
import org.json.JSONObject;

@Path("2fa")
public class TwoFactorController {

    private TwoFactorService layer = new TwoFactorService();
    private RoleChecker RoleChecker = new RoleChecker();
    private AuditLogService auditLogService = new AuditLogService();

    public TwoFactorController() {
    }

    @GET
    @Path("setup")
    @Produces(MediaType.APPLICATION_JSON)
    public Response setup(@HeaderParam("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return buildErrorResponse(401, "missingToken");
        }

        String jwtToken = authHeader.substring(7);
        Boolean validJwt = JWT.validateAccessToken(jwtToken);

        if (validJwt == null) {
            return buildErrorResponse(401, "tokenExpired");
        } else if (validJwt == false) {
            return buildErrorResponse(401, "invalidToken");
        }

        Integer userId = JWT.getUserIdFromAccessToken(jwtToken);
        String email = JWT.getEmailFromAccessToken(jwtToken);
        String role = JWT.getUserBestRoleFromAccessToken(jwtToken);

        if (userId == null) {
            return buildErrorResponse(400, "invalidToken");
        }

        Users twoFactorStatus = TwoFactorService.getTwoFactorStatus(userId);
        if (twoFactorStatus != null && twoFactorStatus.getTwoFactorEnabled()) {
            // ===== AUDIT LOG =====
            try {
                auditLogService.logSimpleAction(userId, role, userId, null, email, "user", "2fa_setup_blocked_already_enabled");
            } catch (Exception ex) {
                ex.printStackTrace();
            }
            // =====================
            return buildErrorResponse(409, "twoFactorAlreadyEnabled");
        }

        String plainSecret = TwoFactorService.generateSecret();
        String qrUrl = TwoFactorService.getQrUrl(email, plainSecret);

        // ===== AUDIT LOG =====
        try {
            auditLogService.logSimpleAction(userId, role, userId, null, email, "user", "2fa_setup");
        } catch (Exception ex) {
            ex.printStackTrace();
        }
        // =====================

        JSONObject response = new JSONObject();
        response.put("statusCode", 200);
        response.put("secret", plainSecret);
        response.put("qrUrl", qrUrl);

        return Response.status(200).entity(response.toString()).type(MediaType.APPLICATION_JSON).build();
    }

    @POST
    @Path("confirm")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response confirm(@HeaderParam("Authorization") String authHeader, String body) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return buildErrorResponse(401, "missingToken");
        }

        String jwtToken = authHeader.substring(7);
        Boolean validJwt = JWT.validateAccessToken(jwtToken);

        if (validJwt == null) {
            return buildErrorResponse(401, "tokenExpired");
        } else if (validJwt == false) {
            return buildErrorResponse(401, "invalidToken");
        }

        Integer userId = JWT.getUserIdFromAccessToken(jwtToken);
        String email = JWT.getEmailFromAccessToken(jwtToken);
        String role = JWT.getUserBestRoleFromAccessToken(jwtToken);

        if (userId == null) {
            return buildErrorResponse(400, "invalidToken");
        }

        JSONObject bodyObj = new JSONObject(body);

        if (!bodyObj.has("secret") || bodyObj.isNull("secret")
                || !bodyObj.has("code") || bodyObj.isNull("code")) {
            return buildErrorResponse(400, "missingFields");
        }

        String plainSecret = bodyObj.getString("secret");
        int code = bodyObj.getInt("code");

        boolean codeValid = TwoFactorService.verifyCode(plainSecret, code);
        if (!codeValid) {
            // ===== AUDIT LOG =====
            try {
                auditLogService.logSimpleAction(userId, role, userId, null, email, "user", "2fa_confirm_failed");
            } catch (Exception ex) {
                ex.printStackTrace();
            }
            // =====================
            return buildErrorResponse(400, "invalidTotpCode");
        }

        boolean enabled = TwoFactorService.enableTwoFactor(userId, plainSecret);
        if (!enabled) {
            return buildErrorResponse(500, "twoFactorEnableFailed");
        }

        List<String> recoveryCodes = TwoFactorService.generateAndSaveRecoveryCodes(userId);
        if (recoveryCodes == null) {
            return buildErrorResponse(500, "recoveryCodeSaveFailed");
        }

        // ===== AUDIT LOG =====
        try {
            auditLogService.logSimpleAction(userId, role, userId, null, email, "user", "2fa_confirmed");
        } catch (Exception ex) {
            ex.printStackTrace();
        }
        // =====================

        JSONObject response = new JSONObject();
        response.put("statusCode", 200);
        response.put("message", "Two-factor authentication enabled");
        response.put("recoveryCodes", new JSONArray(recoveryCodes));

        return Response.status(200).entity(response.toString()).type(MediaType.APPLICATION_JSON).build();
    }

    @POST
    @Path("disable")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response disable(@HeaderParam("Authorization") String authHeader, String body) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return buildErrorResponse(401, "missingToken");
        }

        String jwtToken = authHeader.substring(7);
        Boolean validJwt = JWT.validateAccessToken(jwtToken);

        if (validJwt == null) {
            return buildErrorResponse(401, "tokenExpired");
        } else if (validJwt == false) {
            return buildErrorResponse(401, "invalidToken");
        }

        Integer userId = JWT.getUserIdFromAccessToken(jwtToken);
        String email = JWT.getEmailFromAccessToken(jwtToken);
        String role = JWT.getUserBestRoleFromAccessToken(jwtToken);

        if (userId == null) {
            return buildErrorResponse(400, "invalidToken");
        }

        JSONObject bodyObj = new JSONObject(body);

        if (!bodyObj.has("code") || bodyObj.isNull("code")) {
            return buildErrorResponse(400, "missingFields");
        }

        int code = bodyObj.getInt("code");

        boolean disabled = TwoFactorService.disableTwoFactor(userId, code);
        if (!disabled) {
            // ===== AUDIT LOG =====
            try {
                auditLogService.logSimpleAction(userId, role, userId, null, email, "user", "2fa_disable_failed");
            } catch (Exception ex) {
                ex.printStackTrace();
            }
            // =====================
            return buildErrorResponse(400, "invalidTotpCodeOrNotEnabled");
        }

        // ===== AUDIT LOG =====
        try {
            auditLogService.logSimpleAction(userId, role, userId, null, email, "user", "2fa_disabled");
        } catch (Exception ex) {
            ex.printStackTrace();
        }
        // =====================

        JSONObject response = new JSONObject();
        response.put("statusCode", 200);
        response.put("message", "Two-factor authentication disabled");

        return Response.status(200).entity(response.toString()).type(MediaType.APPLICATION_JSON).build();
    }

    @GET
    @Path("status")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getStatus(@HeaderParam("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return buildErrorResponse(401, "missingToken");
        }

        String jwtToken = authHeader.substring(7);
        Boolean validJwt = JWT.validateAccessToken(jwtToken);

        if (validJwt == null) {
            return buildErrorResponse(401, "tokenExpired");
        } else if (validJwt == false) {
            return buildErrorResponse(401, "invalidToken");
        }

        Integer userId = JWT.getUserIdFromAccessToken(jwtToken);
        if (userId == null) {
            return buildErrorResponse(400, "invalidToken");
        }

        Users twoFactorStatus = TwoFactorService.getTwoFactorStatus(userId);
        if (twoFactorStatus == null) {
            return buildErrorResponse(404, "UserNotFound");
        }

        JSONObject response = new JSONObject();
        response.put("statusCode", 200);
        response.put("twoFactorEnabled", twoFactorStatus.getTwoFactorEnabled());
        response.put("confirmedAt", twoFactorStatus.getTwoFactorConfirmedAt() != null
                ? twoFactorStatus.getTwoFactorConfirmedAt().toString()
                : JSONObject.NULL);

        return Response.status(200).entity(response.toString()).type(MediaType.APPLICATION_JSON).build();
    }
}