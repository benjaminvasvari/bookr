/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.DTO;

import java.util.Map;

/**
 *
 * @author vben
 */
public class CompanyRegisterRequest {

    // Company data
    private String name;
    private String description;
    private String address;
    private String city;
    private String postalCode;
    private String country;
    private String phone;
    private String email;
    private String website;

    private Integer businessCategoryId;

    private Integer bookingAdvanceDays;
    private Integer cancellationHours;
    private Integer minimumBookingHoursAhead;

    // openingHours data
    private Map<String, String> openingHours;

    // GETTERS
    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public String getAddress() {
        return address;
    }

    public String getCity() {
        return city;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public String getCountry() {
        return country;
    }

    public String getPhone() {
        return phone;
    }

    public String getEmail() {
        return email;
    }

    public String getWebsite() {
        return website;
    }

    public Integer getBusinessCategoryId() {
        return businessCategoryId;
    }

    public Integer getBookingAdvanceDays() {
        return bookingAdvanceDays;
    }

    public Integer getCancellationHours() {
        return cancellationHours;
    }

    public Integer getMinimumBookingHoursAhead() {
        return minimumBookingHoursAhead;
    }

    public Map<String, String> getOpeningHours() {
        return openingHours;
    }

}
