/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.model.Appointments;
import com.vizsgaremek.bookr.model.Staff;
import static com.vizsgaremek.bookr.service.AppointmentsService.timeFormatter;
import com.vizsgaremek.bookr.util.FileStorageUtil;
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

    private Staff layer = new Staff();

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
                    actualStaffObject.put("imageUrl", FileStorageUtil.buildFullUrl(actualStaff.getImageUrl()));
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


    public JSONObject getStaffByCompanyAndAppointments(Integer companyId) {
        JSONObject toReturn = new JSONObject();
        String status = "success";
        Integer statusCode = 200;

        ArrayList<Staff> modelResult = layer.getAllActiveStaffByCompany(companyId);

        if (modelResult == null) {
            statusCode = 500;
            status = "ModelException";
        } else if (modelResult.isEmpty()) {
            status = "NoRecordFound";
        } else {
            JSONArray result = new JSONArray();

            for (Staff actualStaff : modelResult) {
                JSONObject staffObject = new JSONObject();
                staffObject.put("id", actualStaff.getId());
                staffObject.put("userId", actualStaff.getUserIdInt());
                staffObject.put("displayName", actualStaff.getDisplayName());
                staffObject.put("specialties", actualStaff.getSpecialties());
                staffObject.put("bio", actualStaff.getBio());
                staffObject.put("isActive", actualStaff.getIsActive());
                staffObject.put("companyId", actualStaff.getCompanyIdInt());
                staffObject.put("firstName", actualStaff.getFirstName());
                staffObject.put("lastName", actualStaff.getLastName());

                if (actualStaff.getImageUrl() == null || actualStaff.getImageUrl().isEmpty()) {
                    staffObject.put("imageUrl", JSONObject.NULL);
                } else {
                    staffObject.put("imageUrl", FileStorageUtil.buildFullUrl(actualStaff.getImageUrl()));
                }

                staffObject.put("servicesCount", actualStaff.getServicesCount());

                // Appointments lekérése az adott staffhoz
                ArrayList<Appointments> appointments = Appointments.getUpcomingAppointmentsByStaffLimited(actualStaff.getId(), 3);

                JSONArray appointmentsArray = new JSONArray();
                if (appointments != null) {
                    for (Appointments appt : appointments) {
                        JSONObject apptObject = new JSONObject();
                        apptObject.put("id", appt.getId());
                        apptObject.put("startTime", timeFormatter.format(appt.getStartTime()));
                        apptObject.put("serviceName", appt.getServiceName());
                        apptObject.put("clientName", appt.getClientName());

                        if (appt.getImageUrl() == null) {
                            apptObject.put("clientImageUrl", JSONObject.NULL);
                        } else {
                            apptObject.put("clientImageUrl", FileStorageUtil.buildFullUrl(appt.getImageUrl()));
                        }

                        appointmentsArray.put(apptObject);
                    }
                }

                staffObject.put("upcomingAppointments", appointmentsArray);
                result.put(staffObject);
            }

            toReturn.put("result", result);
        }

        toReturn.put("status", status);
        toReturn.put("statusCode", statusCode);
        return toReturn;
    }
}
