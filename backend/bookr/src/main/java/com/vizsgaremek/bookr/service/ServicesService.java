/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.DTO.OwnerPanelDTO;
import com.vizsgaremek.bookr.model.Services;
import java.util.ArrayList;
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
}
