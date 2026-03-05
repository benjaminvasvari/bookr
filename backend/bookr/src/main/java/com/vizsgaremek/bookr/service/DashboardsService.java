package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.DTO.OwnerPanelDTO.ActiveClientsDTO;
import com.vizsgaremek.bookr.DTO.OwnerPanelDTO.AverageRatingDTO;
import com.vizsgaremek.bookr.DTO.OwnerPanelDTO.TodayBookingsCountDTO;
import com.vizsgaremek.bookr.DTO.OwnerPanelDTO.UpcomingAppointmentsDTO;
import com.vizsgaremek.bookr.DTO.OwnerPanelDTO.WeeklyRevenueDTO;
import com.vizsgaremek.bookr.model.Appointments;
import com.vizsgaremek.bookr.model.Reviews;
import com.vizsgaremek.bookr.security.JWT;
import com.vizsgaremek.bookr.util.DateFormatterUtil;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 *
 * @author vben
 */
public class DashboardsService {

    private Appointments Appointments = new Appointments();
    private Reviews Reviews = new Reviews();
    private CompaniesService CompaniesService = new CompaniesService();
    private ServiceCategoryService ServiceCategoryService = new ServiceCategoryService();

    public JSONObject getOwnerDashboard(String jwtToken) {

        try {
            JSONObject toReturn = new JSONObject();
            JSONObject result = new JSONObject();

            String status = "success";
            Integer statusCode = 200;

            int ownerId = JWT.getUserIdFromAccessToken(jwtToken);

            Integer companyId = CompaniesService.getCompanyIdByOwnerId(ownerId);

            if (companyId == null) {
                JSONObject error = new JSONObject();
                error.put("statusCode", 404);
                error.put("message", "Company not found with ownerId: " + ownerId);
                return error;
            }

            // ActiveClients
            ActiveClientsDTO activeClients = Appointments.getActiveClients(companyId);
            JSONObject activeClientsObject = new JSONObject();

            activeClientsObject.put("activeClients", activeClients.getActiveCount());
            activeClientsObject.put("newClientsThisWeek", activeClients.getNewClientsThisWeek());

            result.put("activeClientsData", activeClientsObject);

            // weeklyRevenue
            WeeklyRevenueDTO weeklyRevenue = Appointments.getWeeklyRevenue(companyId);
            JSONObject weeklyRevenueObject = new JSONObject();

            weeklyRevenueObject.put("thisWeek", weeklyRevenue.getThisWeek());
            weeklyRevenueObject.put("lastWeek", weeklyRevenue.getLastWeek());
            weeklyRevenueObject.put("currency", weeklyRevenue.getCurrency());

            result.put("weeklyRevenueData", weeklyRevenueObject);

            // UpcomingAppointments
            ArrayList<UpcomingAppointmentsDTO> upcomingAppointmentsList = Appointments.getDashboardUpcomingAppointments(companyId, 3);
            if (upcomingAppointmentsList != null) {
                JSONArray upcomingAppointmentsArray = new JSONArray();

                for (UpcomingAppointmentsDTO record : upcomingAppointmentsList) {
                    JSONObject upcomingAppointmentObj = new JSONObject();

                    upcomingAppointmentObj.put("appointmentId", record.getAppointmentId());
                    upcomingAppointmentObj.put("startTime", record.getStartTime());
                    upcomingAppointmentObj.put("endTime", record.getEndTime());
                    upcomingAppointmentObj.put("status", record.getStatus());
                    upcomingAppointmentObj.put("serviceName", record.getServiceName());
                    upcomingAppointmentObj.put("clientName", record.getClientName());
                    upcomingAppointmentObj.put("relativeDate", record.getRelativeDate());

                    upcomingAppointmentsArray.put(upcomingAppointmentObj);
                }

                result.put("upcomingAppointmentsData", upcomingAppointmentsArray);
            } else {
                result.put("upcomingAppointmentsData", new JSONArray());
            }

            // Services By Categories
            JSONArray servicesByCategories = ServiceCategoryService.getServiceCategoriesWithServicesByCompanyId(companyId);

            result.put("servicesByCategories", servicesByCategories);

            // todayBookings
            TodayBookingsCountDTO todayBookings = Appointments.getTodayBookingsCount(companyId);
            JSONObject todayBookingsObj = new JSONObject();

            todayBookingsObj.put("todayCount", todayBookings.getTodayCount());
            todayBookingsObj.put("yesterdayCount", todayBookings.getYesterdayCount());

            result.put("todayBookingsCount", todayBookingsObj);

            // Average Rating
            AverageRatingDTO ratings = Reviews.getAverageReviewsByCompany(companyId);
            JSONObject ratingsObj = new JSONObject();

            ratingsObj.put("averageRating", ratings.getAverageRating());
            ratingsObj.put("totalReviews", ratings.getTotalReviews());

            result.put("averageRating", ratingsObj);

            // 4. REVIEWS
            List<Reviews> reviewsList = Reviews.getReviewsByCompanyId(companyId, 2);
            JSONArray reviews = new JSONArray();
            for (Reviews review : reviewsList) {
                JSONObject reviewObj = new JSONObject();
                reviewObj.put("id", review.getId());
                reviewObj.put("userName", review.getUserName());
                reviewObj.put("userImage", review.getUserImage());
                reviewObj.put("rating", review.getRating());
                reviewObj.put("comment", review.getComment());
                reviewObj.put("date", DateFormatterUtil.format(review.getCreatedAt(), DateFormatterUtil.DATE_HU));
                reviews.put(reviewObj);
            }

            result.put("reviewsLimited", reviews);

            toReturn.put("result", result);
            toReturn.put("status", status);
            toReturn.put("statusCode", statusCode);
            return toReturn;

        } catch (Exception e) {
            e.printStackTrace();
            JSONObject error = new JSONObject();
            error.put("statusCode", 500);
            error.put("message", "Internal server error: " + e.getMessage());
            return error;
        }
    }
}
