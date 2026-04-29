/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.DTO.OwnerPanelDTO;
import com.vizsgaremek.bookr.DTO.staffPanelDTO;
import com.vizsgaremek.bookr.model.Services;

import java.util.ArrayList;

import com.vizsgaremek.bookr.model.Staff;
import com.vizsgaremek.bookr.model.Users;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 *
 * @author vben
 */
public class ServicesService {

    private Services layer = new Services();
    private CompaniesService CompaniesService = new CompaniesService();

    public JSONObject getSalesTopServices(Integer companyId, String period) {

        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        Boolean companyExist = CompaniesService.validateCompanyExist(companyId);

        if (!companyExist) {
            JSONObject error = new JSONObject();
            error.put("statusCode", 404);
            error.put("status", "NotFound");
            error.put("message", "Company not found with ID: " + companyId);
            return error;
        }

        // Model hívás
        ArrayList<OwnerPanelDTO.SalesTopServicesDTO> modelResult = layer.getSalesTopServices(companyId, period);

        if (modelResult == null) {
            statusCode = 500;
            status = "ModelException";
            toReturn.put("message", "Internal server error");

        } else {
            ArrayList resultList = new ArrayList();

            for (OwnerPanelDTO.SalesTopServicesDTO record : modelResult) {
                JSONObject datObj = new JSONObject();
                datObj.put("serviceId", record.getServiceId());
                datObj.put("serviceName", record.getServiceName());
                datObj.put("clientCount", record.getClientCount());
                datObj.put("totalRevenue", record.getTotalRevenue());
                datObj.put("currency", record.getCurrency());

                resultList.add(datObj);
            }

            toReturn.put("result", resultList);
        }

        toReturn.put("status", status);
        toReturn.put("statusCode", statusCode);

        return toReturn;
    }

    public JSONObject getStaffServicesDetailed(Integer userId, Integer companyId) {

        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        Boolean companyExist = CompaniesService.validateCompanyExist(companyId);

        if (!companyExist) {
            JSONObject error = new JSONObject();
            error.put("statusCode", 404);
            error.put("status", "NotFound");
            error.put("message", "Company not found with ID: " + companyId);
            return error;
        }

        Integer staffId = Staff.getStaffIdByUserId(userId);

        // Model hívás
        ArrayList<staffPanelDTO.getDetailedServicesDTO> modelResult = layer.getStaffServicesDetailed(staffId);

        if (modelResult == null) {
            statusCode = 500;
            status = "ModelException";
            toReturn.put("message", "Internal server error");

        } else {
            ArrayList resultList = new ArrayList();

            for (staffPanelDTO.getDetailedServicesDTO record : modelResult) {
                JSONObject datObj = new JSONObject();
                datObj.put("serviceId", record.getServiceId());
                datObj.put("serviceName", record.getServiceName());
                datObj.put("description", record.getDescription());
                datObj.put("durationMinutes", record.getDurationMinutes());
                datObj.put("price", record.getPrice());
                datObj.put("currency", record.getCurrency());
                datObj.put("isActive", record.getIsActive());
                datObj.put("category", record.getCategory());
                datObj.put("categoryId", record.getCategoryId());
                datObj.put("assignedAt", record.getAssignedAt());

                resultList.add(datObj);
            }

            toReturn.put("result", resultList);
        }

        toReturn.put("status", status);
        toReturn.put("statusCode", statusCode);

        return toReturn;
    }

    public JSONObject getServicesByCompanyIdForStaff(Integer userId, Integer companyId) {

        JSONObject toReturn = new JSONObject();

        try {
            Integer staffId = Staff.getStaffIdByUserId(userId);

            ArrayList<staffPanelDTO.getServicesByCompanyIdForStaffDTO> modelResult = layer.getServicesByCompanyIdForStaff(companyId, staffId);

            JSONArray data = new JSONArray();

            for (staffPanelDTO.getServicesByCompanyIdForStaffDTO record : modelResult) {
                JSONObject item = new JSONObject();
                item.put("id", record.getId());
                item.put("name", record.getName());
                item.put("description", record.getDescription() != null ? record.getDescription() : JSONObject.NULL);
                item.put("durationMinutes", record.getDurationMinutes());
                item.put("price", record.getPrice() != null ? record.getPrice() : JSONObject.NULL);
                item.put("currency", record.getCurrency() != null ? record.getCurrency() : JSONObject.NULL);
                item.put("isActive", record.getIsActive());
                item.put("categories", record.getCategories() != null ? record.getCategories() : JSONObject.NULL);
                item.put("isAssigned", record.getIsAssigned());
                data.put(item);
            }

            toReturn.put("status", "success");
            toReturn.put("statusCode", 200);
            toReturn.put("data", data);

        } catch (Exception ex) {
            ex.printStackTrace();
            toReturn.put("status", "error");
            toReturn.put("statusCode", 500);
        }

        return toReturn;
    }

    public JSONObject updateStaffService(Integer userId, Integer serviceId, Boolean isAssigned) {

        JSONObject toReturn = new JSONObject();

        try {
            Integer staffId = Staff.getStaffIdByUserId(userId);

            if (isAssigned) {
                layer.assignServiceToStaff(staffId, serviceId);
            } else {
                layer.removeServiceFromStaff(staffId, serviceId);
            }

            toReturn.put("status", "success");
            toReturn.put("statusCode", 200);

        } catch (Exception ex) {
            ex.printStackTrace();
            toReturn.put("status", "error");
            toReturn.put("statusCode", 500);
        }

        return toReturn;
    }

    public JSONObject createService(Integer companyId, String name, String description,
            Integer durationMinutes, Double price,
            Integer categoryId, Boolean isActive) {

        JSONObject toReturn = new JSONObject();

        Boolean companyExist = CompaniesService.validateCompanyExist(companyId);
        if (!companyExist) {
            toReturn.put("statusCode", 404);
            toReturn.put("status", "NotFound");
            toReturn.put("message", "Company not found with ID: " + companyId);
            return toReturn;
        }

        Integer newServiceId = layer.createService(companyId, name, description,
                durationMinutes, price, categoryId, isActive);

        if (newServiceId == null) {
            toReturn.put("statusCode", 500);
            toReturn.put("status", "ModelException");
            toReturn.put("message", "Internal server error");
        } else {
            toReturn.put("statusCode", 201);
            toReturn.put("status", "success");
            toReturn.put("serviceId", newServiceId);
        }

        return toReturn;
    }
}
