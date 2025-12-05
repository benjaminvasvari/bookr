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

            // 2.
            List<ServiceCategories> ServiceCategory = ServiceCategories.getServiceCategoriesWithServicesByCompanyId(id);

            Map<Integer, JSONObject> categoriesMap = new LinkedHashMap<>();

            for (ServiceCategories service : ServiceCategory) {
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

                    serviceObj.put("id", service.getServiceId());
                    serviceObj.put("name", service.getServiceName());
                    serviceObj.put("duration", formatDuration(service.getServiceDurationMinutes()));
                    serviceObj.put("price", service.getServicePrice());
                    serviceObj.put("currency", service.getServiceCurrency());

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

}
