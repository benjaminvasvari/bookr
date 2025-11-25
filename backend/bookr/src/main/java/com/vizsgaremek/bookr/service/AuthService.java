package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.config.PasswordHasher;
import com.vizsgaremek.bookr.config.ValidationUtil;
import com.vizsgaremek.bookr.model.AuditLogs;
import com.vizsgaremek.bookr.model.RegistrationResult;
import com.vizsgaremek.bookr.model.Users;
import com.vizsgaremek.bookr.security.JWT;
import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import org.json.JSONObject;

/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
/**
 *
 * @author vben
 */
@ApplicationScoped  // CDI injection-höz
public class AuthService {

    @Inject
    private EmailService emailService;

    @Inject
    private AuditLogService auditLogService;

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
            RegistrationResult registrationResult = Users.clientRegister(clientRegistered);

            if (registrationResult == null) {
                status = "serverError";
                statusCode = 500;
            } else {
                // ========== AUDIT LOG ==========
                try {
                    AuditLogs auditLog = new AuditLogs(
                            registrationResult.getUserId(),
                            clientRegistered.getEmail(),
                            "user",
                            "register"
                    )
                            .addNewValue("user_id", registrationResult.getUserId())
                            .addNewValue("email", clientRegistered.getEmail())
                            .addNewValue("first_name", clientRegistered.getFirstName())
                            .addNewValue("last_name", clientRegistered.getLastName())
                            .addNewValue("role", "client");

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

                toReturn.put("userId", registrationResult.getUserId());
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
            RegistrationResult registrationResult = Users.staffRegister(staffRegistered);

            if (registrationResult == null) {
                status = "serverError";
                statusCode = 500;
            } else {
                // ========== AUDIT LOG ==========
                try {
                    AuditLogs auditLog = new AuditLogs(
                            registrationResult.getUserId(),
                            staffRegistered.getEmail(),
                            "user",
                            "register"
                    )
                            .setCompanyId(staffRegistered.getCompanyId() != null ? staffRegistered.getCompanyId().getId() : null)
                            .addNewValue("user_id", registrationResult.getUserId())
                            .addNewValue("email", staffRegistered.getEmail())
                            .addNewValue("first_name", staffRegistered.getFirstName())
                            .addNewValue("last_name", staffRegistered.getLastName())
                            .addNewValue("role", "staff")
                            .addNewValue("company_id", staffRegistered.getCompanyId() != null ? staffRegistered.getCompanyId().getId() : null);

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

                toReturn.put("userId", registrationResult.getUserId());
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

        // ========== 3. USER LEKÉRÉSE EMAIL ALAPJÁN ==========
        Users userFromDB = Users.login(loginUser);

        // Ha nem található user ezzel az email címmel
        if (userFromDB == null) {
            status = "UserNotFound";
            statusCode = 404;
            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
            return toReturn;
        }

        // ========== 4. JELSZÓ ELLENŐRZÉS ==========
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

        // Company ID kezelése (lehet null)
        if (userFromDB.getCompanyId() != null) {
            userData.put("companyId", userFromDB.getCompanyId().getId());
        } else {
            userData.put("companyId", JSONObject.NULL);
        }

        // Role ID
        if (userFromDB.getRoleId() != null) {
            userData.put("roleId", userFromDB.getRoleId().getId());
        } else {
            userData.put("roleId", JSONObject.NULL);
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
                    userFromDB.getCompanyId() != null ? userFromDB.getCompanyId().getId() : null,
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
                statusCode = 400;
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
                            user.getCompanyId() != null ? user.getCompanyId().getId() : null,
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

}
