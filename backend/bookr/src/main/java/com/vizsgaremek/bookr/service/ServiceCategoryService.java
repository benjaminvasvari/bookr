/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.model.ServiceCategories;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 *
 * @author vben
 */
public class ServiceCategoryService {

    private ServiceCategories layer = new ServiceCategories();
    private CompaniesService CompaniesService = new CompaniesService();

    private String formatDuration(int minutes) {
        if (minutes < 60) {
            return minutes + " perc";
        } else if (minutes == 60) {
            return "1 óra";
        } else if (minutes % 60 == 0) {
            return (minutes / 60) + " óra";
        } else {
            int hours = minutes / 60;
            int remainingMinutes = minutes % 60;
            return remainingMinutes + " perc - " + hours + " óra";
        }
    }

    public JSONArray getServiceCategoriesWithServicesByCompanyId(Integer id) {

        try {

            List<ServiceCategories> modelResult = layer.getServiceCategoriesWithServicesByCompanyId(id);

            Map<Integer, JSONObject> categoriesMap = new LinkedHashMap<>();

            for (ServiceCategories service : modelResult) {
                int categoryId = service.getCategoryId();

                if (!categoriesMap.containsKey(categoryId)) {
                    JSONObject category = new JSONObject();
                    category.put("id", categoryId);
                    category.put("name", service.getCategoryName());
                    category.put("description", service.getCategoryDescription());
                    category.put("services", new JSONArray());

                    categoriesMap.put(categoryId, category);
                }

                JSONObject category = categoriesMap.get(categoryId);

                if (service.getServiceId() != null) {
                    JSONObject serviceObj = new JSONObject();

                    serviceObj.put("id", service.getServiceId() != null ? service.getServiceId() : JSONObject.NULL);
                    serviceObj.put("name", service.getServiceName() != null ? service.getServiceName() : JSONObject.NULL);
                    serviceObj.put("duration", service.getServiceDurationMinutes() != null ? formatDuration(service.getServiceDurationMinutes()) : JSONObject.NULL);
                    serviceObj.put("price", service.getServicePrice() != null ? service.getServicePrice() : JSONObject.NULL);
                    serviceObj.put("currency", service.getServiceCurrency() != null ? service.getServiceCurrency() : JSONObject.NULL);

                    category.getJSONArray("services").put(serviceObj);
                }

            }

            JSONArray result = new JSONArray();
            for (JSONObject category : categoriesMap.values()) {
                result.put(category);
            }

            return result;

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public JSONObject createServiceCategory(Integer companyId, String name, String description) {

        JSONObject toReturn = new JSONObject();

        Boolean companyExist = CompaniesService.validateCompanyExist(companyId);
        if (!companyExist) {
            toReturn.put("statusCode", 404);
            toReturn.put("status", "NotFound");
            toReturn.put("message", "Company not found with ID: " + companyId);
            return toReturn;
        }

        Integer newCategoryId = layer.createServiceCategory(companyId, name, description);

        if (newCategoryId == null) {
            toReturn.put("statusCode", 500);
            toReturn.put("status", "ModelException");
            toReturn.put("message", "Internal server error");
        } else {
            toReturn.put("statusCode", 201);
            toReturn.put("status", "success");
            toReturn.put("categoryId", newCategoryId);
        }

        return toReturn;
    }

}
