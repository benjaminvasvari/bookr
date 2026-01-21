/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.util;

import java.util.regex.Pattern;

/**
 *
 * @author vben
 */
public class ValidationUtil {
    
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@" +
        "(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$"
    );
    
    private static final int PASSWORD_MIN_LENGTH = 8;
    private static final int PASSWORD_MAX_LENGTH = 128;
    
    /**
     * Email cím validálása
     */
    public static boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        
        email = email.trim();
        
        if (email.length() > 254) {
            return false;
        }
        
        return EMAIL_PATTERN.matcher(email).matches();
    }
    
    /**
     * Jelszó validálása
     * Követelmények:
     * - Minimum 8 karakter
     * - Maximum 128 karakter
     * - Legalább 1 kisbetű
     * - Legalább 1 nagybetű
     * - Legalább 1 szám
     * - Legalább 1 speciális karakter
     */
    public static boolean isValidPassword(String password) {
        if (password == null) {
            return false;
        }
        
        if (password.length() < PASSWORD_MIN_LENGTH || password.length() > PASSWORD_MAX_LENGTH) {
            return false;
        }
        
        boolean hasLowerCase = false;
        boolean hasUpperCase = false;
        boolean hasDigit = false;
        boolean hasSpecialChar = false;
        
        for (char c : password.toCharArray()) {
            if (Character.isLowerCase(c)) {
                hasLowerCase = true;
            } else if (Character.isUpperCase(c)) {
                hasUpperCase = true;
            } else if (Character.isDigit(c)) {
                hasDigit = true;
            } else if (isSpecialCharacter(c)) {
                hasSpecialChar = true;
            }
        }
        
        return hasLowerCase && hasUpperCase && hasDigit && hasSpecialChar;
    }
    
    private static boolean isSpecialCharacter(char c) {
        return "!@#$%^&*()_+-=[]{}|;:,.<>?".indexOf(c) >= 0;
    }
}
