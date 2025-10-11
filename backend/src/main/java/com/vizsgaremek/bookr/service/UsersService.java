package com.vizsgaremek.bookr.service;
import com.vizsgaremek.bookr.model.Users;
import com.vizsgaremek.bookr.config.PasswordHasher;
import com.vizsgaremek.bookr.config.ValidationUtil;
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
}