/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.DTO;

/**
 *
 * @author vben
 */
public class checkStaffInviteTokenDTO {

    private String result;
    private Integer userId;
    private String expiresAt;
    private String email;
    private Integer companyId;
    private String position;

    public checkStaffInviteTokenDTO(String result, Integer userId, String expiresAt, String email, Integer companyId, String position) {
        this.result = result;
        this.userId = userId;
        this.expiresAt = expiresAt;
        this.email = email;
        this.companyId = companyId;
        this.position = position;
    }

    public String getResult() {
        return result;
    }

    public Integer getUserId() {
        return userId;
    }

    public String getExpiresAt() {
        return expiresAt;
    }

    public String getEmail() {
        return email;
    }

    public Integer getCompanyId() {
        return companyId;
    }

    public String getPosition() {
        return position;
    }

}
