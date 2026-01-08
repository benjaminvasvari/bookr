/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.model.Appointments;
import java.util.ArrayList;
import java.util.Date;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 *
 * @author vben
 */
public class AppointmentsService {
    
        public JSONObject getFilteredStaffByServices(Integer staffId, Date dateFrom, Date dateTo) {

        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        //code
        ArrayList<Appointments> modelResult = Appointments.getAppointmentsByStaff(staffId, dateFrom, dateTo);

        if (modelResult == null) {
            statusCode = 500;
            status = "ModelException";
        } else if (modelResult.isEmpty()) {
            statusCode = 200;
            status = "NoRecordFound";
        } else {

            JSONArray result = new JSONArray();

            for (Appointments actualAppointment : modelResult) {
                JSONObject actualAppointmentObject = new JSONObject();

                actualAppointmentObject.put("id", actualAppointment.getId());
                actualAppointmentObject.put("userId", actualAppointment.getUserIdInt());
                actualAppointmentObject.put("displayName", actualAppointment.getDisplayName());
                actualAppointmentObject.put("specialties", actualAppointment.getSpecialties());
                actualAppointmentObject.put("bio", actualAppointment.getBio());
                actualAppointmentObject.put("isActive", actualAppointment.getIsActive());
                actualAppointmentObject.put("companyId", actualAppointment.getCompanyIdInt());
                actualAppointmentObject.put("firstName", actualAppointment.getFirstName());
                actualAppointmentObject.put("lastName", actualAppointment.getLastName());
                
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
