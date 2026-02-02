package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.security.PasswordHasher;
import com.vizsgaremek.bookr.util.ValidationUtil;
import com.vizsgaremek.bookr.model.AuditLogs;
import com.vizsgaremek.bookr.model.Tokens;
import com.vizsgaremek.bookr.model.Users;
import com.vizsgaremek.bookr.security.JWT;
import com.vizsgaremek.bookr.util.FileStorageUtil;
import javax.enterprise.context.ApplicationScoped;
import org.json.JSONObject;

/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
/**
 *
 * @author vben
 */
@ApplicationScoped
public class AuthService {

    private EmailService emailService = new EmailService();
    private AuditLogService auditLogService = new AuditLogService();
    private UsersService UsersService = new UsersService();
    private TokensService TokensService = new TokensService();

    private final PasswordHasher passwordHasher = new PasswordHasher();

    public JSONObject clientRegister(Users clientRegistered) {
        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        // Validálás
        if (ValidationUtil.isValidEmail(clientRegistered.getEmail()) == false) {
            status = "InvalidEmail";
            statusCode = 417;

        } else if (ValidationUtil.isValidPassword(clientRegistered.getPassword()) == false) {
            status = "InvalidPassword";
            statusCode = 417;

        } else {
            // ========== JELSZÓ HASHELÉS ==========
            String plainPassword = clientRegistered.getPassword();
            String hashedPassword = passwordHasher.hashPassword(plainPassword);

            // Hashelt jelszó beállítása a User objektumba
            clientRegistered.setPassword(hashedPassword);
            // =====================================

            // Mentés adatbázisba a hashelt jelszóval
            Users registrationResult = Users.clientRegister(clientRegistered);

            if (registrationResult == null) {
                status = "serverError";
                statusCode = 500;
            } else {
                // ========== AUDIT LOG ==========
                try {
                    AuditLogs auditLog = new AuditLogs(
                            registrationResult.getId(),
                            "client",
                            clientRegistered.getEmail(),
                            "user",
                            "register"
                    );
                    auditLog.addNewValue("user_id", registrationResult.getId());
                    auditLog.addNewValue("email", clientRegistered.getEmail());
                    auditLog.addNewValue("first_name", clientRegistered.getFirstName());
                    auditLog.addNewValue("last_name", clientRegistered.getLastName());
                    auditLog.addNewValue("role", "client");

                    auditLogService.logAudit(auditLog);
                } catch (Exception ex) {
                    // Log the error but don't fail the registration
                    ex.printStackTrace();
                }
                // ===============================

                // ========== EMAIL KÜLDÉS ==========
                try {
                    emailService.sendVerificationEmail(
                            clientRegistered.getEmail(),
                            clientRegistered.getFirstName(),
                            registrationResult.getRegToken()
                    );
                } catch (Exception ex) {
                    // Log the error but don't fail the registration
                    System.err.println("Failed to send verification email: " + ex.getMessage());
                    ex.printStackTrace();
                }
                // ==================================

                toReturn.put("userId", registrationResult.getId());
                toReturn.put("regToken", registrationResult.getRegToken());
            }
        }

        toReturn.put("status", status);
        toReturn.put("statusCode", statusCode);
        return toReturn;
    }

    public JSONObject staffRegister(Users staffRegistered) {
        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        // Validálás
        if (ValidationUtil.isValidEmail(staffRegistered.getEmail()) == false) {
            status = "InvalidEmail";
            statusCode = 417;

        } else if (ValidationUtil.isValidPassword(staffRegistered.getPassword()) == false) {
            status = "InvalidPassword";
            statusCode = 417;

        } else {
            // ========== JELSZÓ HASHELÉS ==========
            String plainPassword = staffRegistered.getPassword();
            String hashedPassword = passwordHasher.hashPassword(plainPassword);

            // Hashelt jelszó beállítása a User objektumba
            staffRegistered.setPassword(hashedPassword);
            // =====================================

            // Mentés adatbázisba a hashelt jelszóval
            Users registrationResult = Users.staffRegister(staffRegistered);

            if (registrationResult == null) {
                status = "serverError";
                statusCode = 500;
            } else {
                // ========== AUDIT LOG ==========
                try {
                    AuditLogs auditLog = new AuditLogs(
                            registrationResult.getId(),
                            "client",
                            staffRegistered.getEmail(),
                            "user",
                            "register"
                    );
                    auditLog.setCompanyId(staffRegistered.getCompanyId() != null ? staffRegistered.getCompanyId() : null);
                    auditLog.addNewValue("user_id", registrationResult.getId());
                    auditLog.addNewValue("email", staffRegistered.getEmail());
                    auditLog.addNewValue("first_name", staffRegistered.getFirstName());
                    auditLog.addNewValue("last_name", staffRegistered.getLastName());
                    auditLog.addNewValue("role", "staff");
                    auditLog.addNewValue("company_id", staffRegistered.getCompanyId() != null ? staffRegistered.getCompanyId() : null);

                    auditLogService.logAudit(auditLog);
                } catch (Exception ex) {
                    // Log the error but don't fail the registration
                    ex.printStackTrace();
                }
                // ===============================

                // ========== EMAIL KÜLDÉS ==========
                try {
                    emailService.sendVerificationEmail(
                            staffRegistered.getEmail(),
                            staffRegistered.getFirstName(),
                            registrationResult.getRegToken()
                    );
                } catch (Exception ex) {
                    // Log the error but don't fail the registration
                    System.err.println("Failed to send verification email: " + ex.getMessage());
                    ex.printStackTrace();
                }
                // ==================================

                toReturn.put("userId", registrationResult.getId());
                toReturn.put("regToken", registrationResult.getRegToken());
            }
        }

        toReturn.put("status", status);
        toReturn.put("statusCode", statusCode);
        return toReturn;
    }

    public JSONObject login(Users loginUser) {
        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        // ========== 1. EMAIL VALIDÁLÁS ==========
        if (!ValidationUtil.isValidEmail(loginUser.getEmail())) {
            status = "InvalidEmail";
            statusCode = 400;
            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
            return toReturn;
        }

        // ========== 2. JELSZÓ FORMÁTUM VALIDÁLÁS ==========
        // A plain password amit a frontend küld
        String plainPassword = loginUser.getPassword();

        if (!ValidationUtil.isValidPassword(plainPassword)) {
            status = "InvalidPassword";
            statusCode = 400;
            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
            return toReturn;
        }

        // ========== 3. USER CHECK ==========
        Boolean isUserExist = UsersService.validateUserExistByEmail(loginUser.getEmail());

        // Ha nem található user ezzel az email címmel
        if (isUserExist == null) {
            status = "InternalServerError";
            statusCode = 500;
            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
            return toReturn;
        }
        if (!isUserExist) {
            status = "NotFound";
            statusCode = 404;
            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
            return toReturn;
        }

        Boolean isTokensOK = TokensService.validateUserLoginPermissionToken(loginUser.getEmail());
        if (isTokensOK == null) {
            status = "InternalServerError";
            statusCode = 500;
            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
            return toReturn;
        }
        if (!isTokensOK) {
            status = "emailVerifyNeed";
            statusCode = 418;
            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
            return toReturn;
        }

        // ========== 4. USER LEKÉRÉSE EMAIL ALAPJÁN ==========
        Users userFromDB = Users.login(loginUser);

        // Ha nem található user ezzel az email címmel
        if (userFromDB == null) {
            status = "UserNotFound";
            statusCode = 404;
            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
            return toReturn;
        }

        // ========== 5. JELSZÓ ELLENŐRZÉS ==========
        String hashedPasswordFromDB = userFromDB.getPassword();

        boolean passwordMatches = passwordHasher.verifyPassword(plainPassword, hashedPasswordFromDB);

        if (!passwordMatches) {
            status = "InvalidCredentials";
            statusCode = 401; // Unauthorized
            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
            return toReturn;
        }

        // ========== 6. JWT TOKEN GENERÁLÁS ==========
        String accessToken = JWT.createAccessToken(userFromDB);
        String refreshToken = JWT.createRefreshToken(userFromDB);

        // ========== 7. VÁLASZ ÖSSZEÁLLÍTÁSA ==========
        JSONObject userData = new JSONObject();
        userData.put("id", userFromDB.getId());
        userData.put("firstName", userFromDB.getFirstName());
        userData.put("lastName", userFromDB.getLastName());
        userData.put("email", userFromDB.getEmail());
        userData.put("phone", userFromDB.getPhone());

        // Company ID kezelése (lehet null)
        if (userFromDB.getCompanyId() != null) {
            userData.put("companyId", userFromDB.getCompanyId());
        } else {
            userData.put("companyId", JSONObject.NULL);
        }

        // User Avatar kezelése (lehet null)
        if (userFromDB.getImageUrl() != null) {
            userData.put("avatarUrl", FileStorageUtil.buildFullUrl(userFromDB.getImageUrl()));
        } else {
            userData.put("avatarUrl", JSONObject.NULL);
        }

        // Roles String (comma-separated role names)
        userData.put("roles", userFromDB.getRolesString());

        // JWT Tokens
        userData.put("accessToken", accessToken);
        userData.put("refreshToken", refreshToken);

        toReturn.put("user", userData);
        toReturn.put("status", status);
        toReturn.put("statusCode", statusCode);

        // ========== UPDATE LAST LOGIN IN DB==========
        Users.updateLastLogin(userFromDB.getId());

        // ========== AUDIT LOG ==========
        try {
            auditLogService.logSimpleAction(
                    userFromDB.getId(),
                    userFromDB.getRoleName(),
                    null,
                    userFromDB.getCompanyId() != null ? userFromDB.getCompanyId() : null,
                    userFromDB.getEmail(),
                    "user",
                    "login"
            );
        } catch (Exception ex) {
            // Log the error but don't fail the login
            ex.printStackTrace();
        }
        // ===============================

        return toReturn;
    }

    public JSONObject verifyEmail(String token) {

        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        // ========== 1. TOKEN FORMÁTUM VALIDÁLÁS ==========
        if (token == null || token.trim().isEmpty()) {
            status = "MissingToken";
            statusCode = 400;
            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
            return toReturn;
        }

        // Token hossz validálás 
        if (token.length() != 32) {
            status = "InvalidTokenFormat";
            statusCode = 400;
            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
            return toReturn;
        }

        // Csak hexadecimális karakterek (ha SHA256 hash-t használsz)
        if (!token.matches("^[a-f0-9]{32}$")) {
            status = "InvalidTokenFormat";
            statusCode = 400;
            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
            return toReturn;
        }
        // =================================================

        try {
            // ========== 2. USER LEKÉRÉSE TOKEN ALAPJÁN (audit log-hoz) ==========
            Users user = Users.getUserByRegToken(token);

            // Ha nincs ilyen token
            if (user == null) {
                status = "InvalidToken";
                statusCode = 400;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                return toReturn;
            }
            // ====================================================================

            // ========== 3. ELLENŐRZÉS: MÁR AKTIVÁLVA VAN-E ==========
            if (user.getIsActive() && user.getRegisterFinishedAt() != null) {
                status = "AlreadyVerified";
                statusCode = 409;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                return toReturn;
            }
            // ========================================================

            // ========== 4. USER AKTIVÁLÁS (DB művelet) ==========
            Boolean isActivated = Users.activateUserByRegToken(token);

            if (isActivated == null || !isActivated) {
                status = "ActivationFailed";
                statusCode = 500;
            } else {

                // ========== 5. AUDIT LOG ==========
                try {
                    auditLogService.logSimpleAction(
                            user.getId(),
                            user.getRoleName(),
                            null,
                            user.getCompanyId() != null ? user.getCompanyId() : null,
                            user.getEmail(),
                            "user",
                            "email_verified"
                    );
                } catch (Exception ex) {
                    ex.printStackTrace();
                }
                // ==================================
            }

        } catch (Exception e) {
            status = "serverError";
            statusCode = 500;
            e.printStackTrace();
        }

        toReturn.put("status", status);
        toReturn.put("statusCode", statusCode);

        return toReturn;
    }

    public JSONObject refreshTokens(String refreshToken) {
        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        try {
            // 1. Token validálás
            Boolean isValid = JWT.validateRefreshToken(refreshToken);

            if (isValid == null) {
                status = "TokenExpired";
                statusCode = 401;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                return toReturn;
            }

            if (!isValid) {
                status = "InvalidToken";

                statusCode = 401;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                return toReturn;
            }

            // 2. User ID kinyerése
            Integer userId = JWT.getUserIdFromRefreshToken(refreshToken);

            if (userId == null) {

                status = "InvalidToken";
                statusCode = 401;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                return toReturn;
            }

            // 3. User lekérése adatbázisból
            Users userFromDB = Users.getUserById(userId);

            if (userFromDB == null) {
                status = "UserNotFound";
                statusCode = 404;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                return toReturn;
            }

            // 4. User aktív-e? Nincs törölve?
            if (!userFromDB.getIsActive() || userFromDB.getIsDeleted()) {
                status = "UserInactive";
                statusCode = 403;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                return toReturn;
            }
            // 5. ÚJ tokenek generálása
            String newAccessToken = JWT.createAccessToken(userFromDB);
            String newRefreshToken = JWT.createRefreshToken(userFromDB);

            // 6. Válasz összeállítása
            toReturn.put("accessToken", newAccessToken);
            toReturn.put("refreshToken", newRefreshToken);
            toReturn.put("expiresIn", 900); // 15 perc másodpercben
        } catch (Exception e) {
            status = "ServerError";
            statusCode = 500;
            e.printStackTrace();
        }

        toReturn.put("status", status);
        toReturn.put("statusCode", statusCode);
        return toReturn;
    }

    public JSONObject logout(Users loggedoutUser) {
        JSONObject toReturn = new JSONObject();

        try {
            auditLogService.logSimpleAction(
                    loggedoutUser.getId(),
                    loggedoutUser.getRoleName(),
                    null,
                    loggedoutUser.getCompanyId() != null ? loggedoutUser.getCompanyId() : null,
                    loggedoutUser.getEmail(),
                    "user",
                    "login"
            );

            toReturn.put("status", "success");
            toReturn.put("statusCode", 200);
            toReturn.put("message", "Successfully logged out");

        } catch (Exception ex) {
            ex.printStackTrace();
            toReturn.put("status", "InternalServerError");
            toReturn.put("statusCode", 500);
            toReturn.put("message", "An unexpected error occurred: " + ex.getMessage());
        }

        return toReturn;
    }

    public Boolean checkPassword(String passwordString, Integer userId) {

        Boolean toReturn;

        try {

            String passwordHash = Users.getPassword(userId);

            toReturn = passwordHasher.verifyPassword(passwordString, passwordHash);

            return toReturn;

        } catch (Exception ex) {
            toReturn = null;
            return toReturn;
        }
    }

    public JSONObject changePasswordEmail(String currentPassword, String jwt) {
        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        try {
            // ========== JWT PARSING ==========
            Integer userId = JWT.getUserIdFromAccessToken(jwt);
            String userEmail = JWT.getEmailFromAccessToken(jwt);

            if (userId == null || userEmail == null) {
                toReturn.put("status", "InvalidToken");
                toReturn.put("statusCode", 401);
                return toReturn;
            }

            // ========== JELSZÓ ELLENŐRZÉS (CSAK EGYSZER!) ==========
            Boolean isPasswordValid = checkPassword(currentPassword, userId);

            if (isPasswordValid == null) {
                // Szerver hiba (pl. DB kapcsolat probléma)
                status = "InternalServerError";
                statusCode = 500;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                return toReturn;
            }

            if (!isPasswordValid) {
                // Helytelen jelszó
                status = "InvalidPassword";
                statusCode = 401;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                return toReturn;
            }

            // ========== RESET TOKEN GENERÁLÁS ==========
            Tokens resetTokenResult = Tokens.generatePasswordResetToken(userId);

            if (resetTokenResult == null || resetTokenResult.getToken() == null) {
                status = "serverError";
                statusCode = 500;
                toReturn.put("status", status);
                toReturn.put("statusCode", statusCode);
                return toReturn;
            }

            // ========== AUDIT LOG ==========
            try {
                AuditLogs auditLog = new AuditLogs(
                        userId,
                        "client",
                        userEmail,
                        "user",
                        "password_reset_request"
                );
                auditLogService.logAudit(auditLog);
            } catch (Exception ex) {
                // Log the error but don't fail the process
                ex.printStackTrace();
            }

            // ========== PASSWORD RESET EMAIL KÜLDÉS ==========
            try {
                Users user = Users.getUserById(userId);

                if (user == null) {
                    status = "UserNotFound";
                    statusCode = 404;
                    toReturn.put("status", status);
                    toReturn.put("statusCode", statusCode);
                    return toReturn;
                }

                emailService.sendPasswordResetEmail(
                        userEmail,
                        resetTokenResult.getToken()
                );

            } catch (Exception ex) {
                ex.printStackTrace();

                status = "EmailSendFailed";
                statusCode = 500;
            }

        } catch (Exception ex) {
            ex.printStackTrace();

            status = "InternalServerError";
            statusCode = 500;
        }

        toReturn.put("status", status);
        toReturn.put("statusCode", statusCode);
        return toReturn;
    }

    public JSONObject resetPassUpdate(String newPassword, String token, String jwt) {
        JSONObject toReturn = new JSONObject();

        // ========== JWT validáció ==========
        Integer userId = JWT.getUserIdFromAccessToken(jwt);
        String userEmail = JWT.getEmailFromAccessToken(jwt);

        try {

            if (userId == null || userEmail == null) {
                toReturn.put("status", "InvalidToken");
                toReturn.put("statusCode", 401);
                toReturn.put("message", "Invalid authentication token");
                return toReturn;
            }

            // ========== Jelszó validáció ==========
            if (newPassword == null || newPassword.trim().isEmpty()) {
                toReturn.put("status", "InvalidPassword");
                toReturn.put("statusCode", 400);
                toReturn.put("message", "Password cannot be empty");
                return toReturn;
            }

            // Jelszó hash
            String newPasswordHash = passwordHasher.hashPassword(newPassword);

            // ========== Jelszó frissítés ==========
            boolean success = Users.resetPasswordWithToken(token, newPasswordHash);

            if (!success) {
                // Token invalid, expired, vagy már használt
                toReturn.put("status", "InvalidResetToken");
                toReturn.put("statusCode", 400);
                return toReturn;
            }

            // ========== Siker ==========
            toReturn.put("status", "success");
            toReturn.put("statusCode", 200);

        } catch (Exception ex) {
            ex.printStackTrace();
            toReturn.put("status", "InternalServerError");
            toReturn.put("statusCode", 500);
            toReturn.put("message", "An unexpected error occurred");
            return toReturn;
        }

        // ========== Audit log ==========
        try {
            AuditLogs auditLog = new AuditLogs(
                    userId,
                    "client",
                    userEmail,
                    "user",
                    "password_reset"
            );
            auditLogService.logAudit(auditLog);
        } catch (Exception ex) {
            System.err.println("Audit log failed: " + ex.getMessage());
            ex.printStackTrace();
        }

        return toReturn;
    }
}
