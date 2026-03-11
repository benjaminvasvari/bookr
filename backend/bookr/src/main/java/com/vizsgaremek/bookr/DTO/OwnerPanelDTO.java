package com.vizsgaremek.bookr.DTO;

import java.time.LocalDate;
import java.util.Date;
import java.util.List;
import java.util.Map;

public class OwnerPanelDTO {

    public static class WeeklyRevenueDTO {

        private String thisWeek;
        private String lastWeek;
        private String currency;

        public WeeklyRevenueDTO(String thisWeek, String lastWeek, String currency) {
            this.thisWeek = thisWeek;
            this.lastWeek = lastWeek;
            this.currency = currency;
        }

        public String getThisWeek() {
            return thisWeek;
        }

        public String getLastWeek() {
            return lastWeek;
        }

        public String getCurrency() {
            return currency;
        }
    }

    public static class ActiveClientsDTO {

        private Integer activeCount;
        private Integer newClientsThisWeek;

        public ActiveClientsDTO(Integer activeCount, Integer newClientsThisWeek) {
            this.activeCount = activeCount;
            this.newClientsThisWeek = newClientsThisWeek;
        }

        public Integer getActiveCount() {
            return activeCount;
        }

        public Integer getNewClientsThisWeek() {
            return newClientsThisWeek;
        }
    }

    public static class UpcomingAppointmentsDTO {

        private Integer appointmentId;
        private String startTime;
        private String endTime;
        private String status;
        private String serviceName;
        private String clientName;
        private String relativeDate;

        public UpcomingAppointmentsDTO(Integer appointmentId, String startTime, String endTime, String status, String serviceName, String clientName, String relativeDate) {
            this.appointmentId = appointmentId;
            this.startTime = startTime;
            this.endTime = endTime;
            this.status = status;
            this.serviceName = serviceName;
            this.clientName = clientName;
            this.relativeDate = relativeDate;
        }

        public Integer getAppointmentId() {
            return appointmentId;
        }

        public String getStartTime() {
            return startTime;
        }

        public String getEndTime() {
            return endTime;
        }

        public String getStatus() {
            return status;
        }

        public String getServiceName() {
            return serviceName;
        }

        public String getClientName() {
            return clientName;
        }

        public String getRelativeDate() {
            return relativeDate;
        }
    }

    public static class TodayBookingsCountDTO {

        private Integer todayCount;
        private Integer yesterdayCount;

        public TodayBookingsCountDTO(Integer todayCount, Integer yesterdayCount) {
            this.todayCount = todayCount;
            this.yesterdayCount = yesterdayCount;
        }

        public Integer getTodayCount() {
            return todayCount;
        }

        public Integer getYesterdayCount() {
            return yesterdayCount;
        }
    }

    public static class AverageRatingDTO {

        private Double averageRating;
        private Integer totalReviews;

        public AverageRatingDTO(Double averageRating, Integer totalReviews) {
            this.averageRating = averageRating;
            this.totalReviews = totalReviews;
        }

        public Double getAverageRating() {
            return averageRating;
        }

        public Integer getTotalReviews() {
            return totalReviews;
        }
    }

    public static class AllFutureAppointmentsByCompanyDTO {

        private Integer appoinmentId;
        private LocalDate appointmentDate;
        private Date startTime;
        private Date endTime;
        private String serviceName;
        private String staffName;
        private String staffImage;
        private String clientName;
        private String clientImage;
        private Integer durationMinutes;
        private String status;
        private Double price;
        private String currency;
        private Date createAt;

        public AllFutureAppointmentsByCompanyDTO(Integer appoinmentId, LocalDate appointmentDate, Date startTime, Date endTime, String serviceName, String staffName, String staffImage, String clientName, String clientImage, Integer durationMinutes, String status, Double price, String currency, Date createAt) {
            this.appoinmentId = appoinmentId;
            this.appointmentDate = appointmentDate;
            this.startTime = startTime;
            this.endTime = endTime;
            this.serviceName = serviceName;
            this.staffName = staffName;
            this.staffImage = staffImage;
            this.clientName = clientName;
            this.clientImage = clientImage;
            this.durationMinutes = durationMinutes;
            this.status = status;
            this.price = price;
            this.currency = currency;
            this.createAt = createAt;
        }

        public Integer getAppoinmentId() {
            return appoinmentId;
        }

        public LocalDate getAppointmentDate() {
            return appointmentDate;
        }

        public Date getStartTime() {
            return startTime;
        }

        public Date getEndTime() {
            return endTime;
        }

        public String getServiceName() {
            return serviceName;
        }

        public String getStaffName() {
            return staffName;
        }

        public String getStaffImage() {
            return staffImage;
        }

        public String getClientName() {
            return clientName;
        }

        public String getClientImage() {
            return clientImage;
        }

        public Integer getDurationMinutes() {
            return durationMinutes;
        }

        public String getStatus() {
            return status;
        }

        public Double getPrice() {
            return price;
        }

        public String getCurrency() {
            return currency;
        }

        public Date getCreateAt() {
            return createAt;
        }
    }

    public static class ClientsByCompaniesDTO {

        private Integer clientId;
        private String firstName;
        private String lastName;
        private String email;
        private String phone;
        private String imageUrl;
        private Integer totalAppointments;
        private Double totalSpending;
        private String lastVisit;
        private String internalNote;

        public ClientsByCompaniesDTO(Integer clientId, String firstName, String lastName, String email, String phone, String imageUrl, Integer totalAppointments, Double totalSpending, String lastVisit, String internalNote) {
            this.clientId = clientId;
            this.firstName = firstName;
            this.lastName = lastName;
            this.email = email;
            this.phone = phone;
            this.imageUrl = imageUrl;
            this.totalAppointments = totalAppointments;
            this.totalSpending = totalSpending;
            this.lastVisit = lastVisit;
            this.internalNote = internalNote;
        }

        public Integer getClientId() {
            return clientId;
        }

        public String getFirstName() {
            return firstName;
        }

        public String getLastName() {
            return lastName;
        }

        public String getEmail() {
            return email;
        }

        public String getPhone() {
            return phone;
        }

        public String getImageUrl() {
            return imageUrl;
        }

        public Integer getTotalAppointments() {
            return totalAppointments;
        }

        public Double getTotalSpending() {
            return totalSpending;
        }

        public String getLastVisit() {
            return lastVisit;
        }

        public String getInternalNote() {
            return internalNote;
        }
    }

    public static class ClientsByCompanyResultWrapper {

        private List<ClientsByCompaniesDTO> clients;
        private Integer totalClients;

        public ClientsByCompanyResultWrapper(List<ClientsByCompaniesDTO> clients, Integer totalClients) {
            this.clients = clients;
            this.totalClients = totalClients;
        }

        public List<ClientsByCompaniesDTO> getClients() {
            return clients;
        }

        public Integer getTotalClients() {
            return totalClients;
        }
    }

    public static class SalesOverviewRevenueDTO {

        private Double currentRevenue;
        private Double previousRevenue;
        private String currency;

        public SalesOverviewRevenueDTO(Double currentRevenue, Double previousRevenue, String currency) {
            this.currentRevenue = currentRevenue;
            this.previousRevenue = previousRevenue;
            this.currency = currency;
        }

        public Double getCurrentRevenue() {
            return currentRevenue;
        }

        public Double getPreviousRevenue() {
            return previousRevenue;
        }

        public String getCurrency() {
            return currency;
        }
    }

    public static class SalesOverviewAvgBasketDTO {

        private Integer currentAvg;
        private Integer previousAvg;
        private String currency;

        public SalesOverviewAvgBasketDTO(Integer currentAvg, Integer previousAvg, String currency) {
            this.currentAvg = currentAvg;
            this.previousAvg = previousAvg;
            this.currency = currency;
        }

        public Integer getCurrentAvg() {
            return currentAvg;
        }

        public Integer getPreviousAvg() {
            return previousAvg;
        }

        public String getCurrency() {
            return currency;
        }
    }

    public static class SalesOverviewBookingsCount {

        private Integer currentCount;
        private Integer previousCount;

        public SalesOverviewBookingsCount(Integer currentCount, Integer previousCount) {
            this.currentCount = currentCount;
            this.previousCount = previousCount;
        }

        public Integer getCurrentCount() {
            return currentCount;
        }

        public Integer getPreviousCount() {
            return previousCount;
        }
    }

    public static class SalesOverviewReturningClientsDTO {

        private int currentTotalClients;
        private int currentReturningClients;
        private int previousTotalClients;
        private int previousReturningClients;

        public SalesOverviewReturningClientsDTO(int currentTotalClients, int currentReturningClients, int previousTotalClients, int previousReturningClients) {
            this.currentTotalClients = currentTotalClients;
            this.currentReturningClients = currentReturningClients;
            this.previousTotalClients = previousTotalClients;
            this.previousReturningClients = previousReturningClients;
        }

        public int getCurrentTotalClients() {
            return currentTotalClients;
        }

        public int getCurrentReturningClients() {
            return currentReturningClients;
        }

        public int getPreviousTotalClients() {
            return previousTotalClients;
        }

        public int getPreviousReturningClients() {
            return previousReturningClients;
        }
    }

    public static class SalesRevenueChartDTO {

        private String date;
        private String dayName;
        private Double revenue;
        private String currency;

        public SalesRevenueChartDTO(String date, String dayName, Double revenue, String currency) {
            this.date = date;
            this.dayName = dayName;
            this.revenue = revenue;
            this.currency = currency;
        }

        public String getDate() {
            return date;
        }

        public String getDayName() {
            return dayName;
        }

        public Double getRevenue() {
            return revenue;
        }

        public String getCurrency() {
            return currency;
        }
    }

    public static class SalesTopServicesDTO {

        private int serviceId;
        private String serviceName;
        private int clientCount;
        private Double totalRevenue;
        private String currency;

        public SalesTopServicesDTO(int serviceId, String serviceName, int clientCount, Double totalRevenue, String currency) {
            this.serviceId = serviceId;
            this.serviceName = serviceName;
            this.clientCount = clientCount;
            this.totalRevenue = totalRevenue;
            this.currency = currency;
        }

        public int getServiceId() {
            return serviceId;
        }

        public String getServiceName() {
            return serviceName;
        }

        public int getClientCount() {
            return clientCount;
        }

        public Double getTotalRevenue() {
            return totalRevenue;
        }

        public String getCurrency() {
            return currency;
        }
    }

    public static class OwnerReviewsDTO {

        private int reviewId;
        private int rating;
        private String comment;
        private String createdAt;
        private String clientName;
        private String imageUrl;
        private String serviceName;
        private String appointmentDate;

        public OwnerReviewsDTO(int reviewId, int rating, String comment, String createdAt, String clientName, String imageUrl, String serviceName, String appointmentDate) {
            this.reviewId = reviewId;
            this.rating = rating;
            this.comment = comment;
            this.createdAt = createdAt;
            this.clientName = clientName;
            this.imageUrl = imageUrl;
            this.serviceName = serviceName;
            this.appointmentDate = appointmentDate;
        }

        public int getReviewId() {
            return reviewId;
        }

        public int getRating() {
            return rating;
        }

        public String getComment() {
            return comment;
        }

        public String getCreatedAt() {
            return createdAt;
        }

        public String getClientName() {
            return clientName;
        }

        public String getImageUrl() {
            return imageUrl;
        }

        public String getServiceName() {
            return serviceName;
        }

        public String getAppointmentDate() {
            return appointmentDate;
        }
    }

    public static class ReviewsForOwnerResultWrapper {

        private List<OwnerReviewsDTO> reviews;
        private Integer totalCount;

        public ReviewsForOwnerResultWrapper(List<OwnerReviewsDTO> reviews, Integer totalCount) {
            this.reviews = reviews;
            this.totalCount = totalCount;
        }

        public List<OwnerReviewsDTO> getReviews() {
            return reviews;
        }

        public Integer getTotalCount() {
            return totalCount;
        }
    }

    public static class OwnerReviewsRequest {

        private String search;
        private String ratingFilter;
        private String sortBy;
        private Integer page;
        private Integer pageSize;

        public OwnerReviewsRequest(String search, String ratingFilter, String sortBy, Integer page, Integer pageSize) {
            this.search = search;
            this.ratingFilter = ratingFilter;
            this.sortBy = sortBy;
            this.page = page;
            this.pageSize = pageSize;
        }

        public String getSearch() {
            return search;
        }

        public String getRatingFilter() {
            return ratingFilter;
        }

        public String getSortBy() {
            return sortBy;
        }

        public Integer getPage() {
            return page;
        }

        public Integer getPageSize() {
            return pageSize;
        }
    }

    public static class updateOpeningHoursDTO {

        private Map<String, String> openingHours;

        public Map<String, String> getOpeningHours() {
            return openingHours;
        }
    }

    public static class createTemporaryClosedPeriodDTO {

        private Integer id;
        private String startDate;
        private String endDate;
        private String openTime;
        private String closeTime;
        private String reason;

        public createTemporaryClosedPeriodDTO(String startDate, String endDate, String openTime, String closeTime, String reason) {
            this.startDate = startDate;
            this.endDate = endDate;
            this.openTime = openTime;
            this.closeTime = closeTime;
            this.reason = reason;
        }

        public createTemporaryClosedPeriodDTO(Integer id, String startDate, String endDate, String openTime, String closeTime, String reason) {
            this.id = id;
            this.startDate = startDate;
            this.endDate = endDate;
            this.openTime = openTime;
            this.closeTime = closeTime;
            this.reason = reason;
        }

        public Integer getId() {
            return id;
        }

        public String getStartDate() {
            return startDate;
        }

        public String getEndDate() {
            return endDate;
        }

        public String getOpenTime() {
            return openTime;
        }

        public String getCloseTime() {
            return closeTime;
        }

        public String getReason() {
            return reason;
        }
    }

    public static class weeklyTCPResponseDTO {

        private Integer id;
        private String startDate;
        private String endDate;
        private String openTime;
        private String closeTime;
        private String reason;

        public weeklyTCPResponseDTO(Integer id, String startDate, String endDate, String openTime, String closeTime, String reason) {
            this.id = id;
            this.startDate = startDate;
            this.endDate = endDate;
            this.openTime = openTime;
            this.closeTime = closeTime;
            this.reason = reason;
        }

        public Integer getId() {
            return id;
        }

        public String getStartDate() {
            return startDate;
        }

        public String getEndDate() {
            return endDate;
        }

        public String getOpenTime() {
            return openTime;
        }

        public String getCloseTime() {
            return closeTime;
        }

        public String getReason() {
            return reason;
        }
    }

    public static class calendarResponseDTO {

        private Integer appointmentId;
        private Integer staffId;
        private String startTime;
        private String endTime;
        private String status;
        private String notes;
        private Double price;
        private String currency;
        private String serviceName;
        private Integer durationMinutes;
        private String staffColor;
        private String staffDisplayName;
        private String clientName;
        private String clientPhone;
        private String clientEmail;

        public calendarResponseDTO(Integer appointmentId, Integer staffId, String startTime, String endTime, String status, String notes, Double price, String currency, String serviceName, Integer durationMinutes, String staffColor, String staffDisplayName, String clientName, String clientPhone, String clientEmail) {
            this.appointmentId = appointmentId;
            this.staffId = staffId;
            this.startTime = startTime;
            this.endTime = endTime;
            this.status = status;
            this.notes = notes;
            this.price = price;
            this.currency = currency;
            this.serviceName = serviceName;
            this.durationMinutes = durationMinutes;
            this.staffColor = staffColor;
            this.staffDisplayName = staffDisplayName;
            this.clientName = clientName;
            this.clientPhone = clientPhone;
            this.clientEmail = clientEmail;
        }

        public Integer getAppointmentId() {
            return appointmentId;
        }

        public Integer getStaffId() {
            return staffId;
        }

        public String getStartTime() {
            return startTime;
        }

        public String getEndTime() {
            return endTime;
        }

        public String getStatus() {
            return status;
        }

        public String getNotes() {
            return notes;
        }

        public Double getPrice() {
            return price;
        }

        public String getCurrency() {
            return currency;
        }

        public String getServiceName() {
            return serviceName;
        }

        public Integer getDurationMinutes() {
            return durationMinutes;
        }

        public String getStaffColor() {
            return staffColor;
        }

        public String getStaffDisplayName() {
            return staffDisplayName;
        }

        public String getClientName() {
            return clientName;
        }

        public String getClientPhone() {
            return clientPhone;
        }

        public String getClientEmail() {
            return clientEmail;
        }
    }
}
