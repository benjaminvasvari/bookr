/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.model.Staff;
import java.util.ArrayList;
import javax.enterprise.context.ApplicationScoped;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 *
 * @author vben
 */
@ApplicationScoped
public class StaffService {

    private static final String IMAGE_BASE_URL = "http://localhost:8080/bookr-1.0-SNAPSHOT/";

    public JSONObject getFilteredStaffByServices(Integer companyId, String serviceIds) {

        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        //code
        ArrayList<Staff> modelResult = Staff.getFilteredStaffByServices(companyId, serviceIds);

        if (modelResult == null) {
            statusCode = 500;
            status = "ModelException";
        } else if (modelResult.isEmpty()) {
            statusCode = 200;
            status = "NoRecordFound";
        } else {

            JSONArray result = new JSONArray();

            for (Staff actualStaff : modelResult) {
                JSONObject actualStaffObject = new JSONObject();

                actualStaffObject.put("id", actualStaff.getId());
                actualStaffObject.put("userId", actualStaff.getUserIdInt());
                actualStaffObject.put("displayName", actualStaff.getDisplayName());
                actualStaffObject.put("specialties", actualStaff.getSpecialties());
                actualStaffObject.put("bio", actualStaff.getBio());
                actualStaffObject.put("isActive", actualStaff.getIsActive());
                actualStaffObject.put("companyId", actualStaff.getCompanyIdInt());
                actualStaffObject.put("firstName", actualStaff.getFirstName());
                actualStaffObject.put("lastName", actualStaff.getLastName());
                
                if (actualStaff.getImageUrl() == null || actualStaff.getImageUrl().isEmpty()) {
                    actualStaffObject.put("imageUrl", JSONObject.NULL);
                } else {
                    actualStaffObject.put("imageUrl", IMAGE_BASE_URL + actualStaff.getImageUrl());
                }
                
                actualStaffObject.put("servicesCount", actualStaff.getServicesCount());

                result.put(actualStaffObject);
            }

            toReturn.put("result", result);
        }

        toReturn.put("status", status);
        toReturn.put("statusCode", statusCode);
        return toReturn;
    }
}
