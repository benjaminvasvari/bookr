/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.model.Tokens;
import java.util.List;

/**
 *
 * @author vben
 */
public class TokensService {

    public Boolean validateUserLoginPermissionToken(String userEmail) {

        try {

            Boolean result = true;

            List<Tokens> modelResult = Tokens.getUserTokensByEmail(userEmail);

            for (Tokens record : modelResult) {
                if (record.getType() == "email_verify") {
                    if (!record.getIsRevoked()) {
                        return false;
                    }
                }
            }

            return result;

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
    
    
}
