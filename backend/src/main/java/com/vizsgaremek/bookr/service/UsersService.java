package com.vizsgaremek.bookr.service;
import com.vizsgaremek.bookr.model.Users;
import com.vizsgaremek.bookr.config.PasswordHasher;
import com.vizsgaremek.bookr.config.ValidationUtil;
import com.vizsgaremek.bookr.config.JWT;
import org.json.JSONObject;

/**
 *
 * @author vben
 */
public class UsersService {
    private final PasswordHasher passwordHasher;
    
    public UsersService() {
        this.passwordHasher = new PasswordHasher();
    }
    
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
            Boolean modelResult = Users.clientRegister(clientRegistered);
            if (modelResult == false) {
                status = "serverError";
                statusCode = 500;
            }
            toReturn.put("result", modelResult);
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
            Boolean modelResult = Users.staffRegister(staffRegistered);
            if (modelResult == false) {
                status = "serverError";
                statusCode = 500;
            }
            toReturn.put("result", modelResult);
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
        
        Users.updateLastLogin(userFromDB.getId());
        
        return toReturn;
    }
}