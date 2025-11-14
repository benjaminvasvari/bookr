package com.vizsgaremek.bookr.model;

/**
 * Registration result object containing the new user's ID and registration token
 * Returned by registration stored procedures (registerClient, registerStaff, registerOwner)
 * 
 * @author vben
 */
public class RegistrationResult {
    private int userId;
    private String regToken;
    
    // Constructors
    public RegistrationResult() {
    }
    
    public RegistrationResult(int userId, String regToken) {
        this.userId = userId;
        this.regToken = regToken;
    }
    
    // Getters and Setters
    public int getUserId() {
        return userId;
    }
    
    public void setUserId(int userId) {
        this.userId = userId;
    }
    
    public String getRegToken() {
        return regToken;
    }
    
    public void setRegToken(String regToken) {
        this.regToken = regToken;
    }
    
    @Override
    public String toString() {
        return "RegistrationResult{" +
                "userId=" + userId +
                ", regToken='" + regToken + '\'' +
                '}';
    }
}