/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.DTO;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;

/**
 *
 * @author vben
 */
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
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private String status;
        private String serviceName;
        private String clientName;
        private LocalDate relativeDate;

        public UpcomingAppointmentsDTO(Integer appointmentId, LocalDateTime startTime, LocalDateTime endTime, String status, String serviceName, String clientName, LocalDate relativeDate) {
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

        public LocalDateTime getStartTime() {
            return startTime;
        }

        public LocalDateTime getEndTime() {
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

        public LocalDate getRelativeDate() {
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

    public static class getAllFutureAppointmentsByCompanyDTO {

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

        public getAllFutureAppointmentsByCompanyDTO(Integer appoinmentId, LocalDate appointmentDate, Date startTime, Date endTime, String serviceName, String staffName, String staffImage, String clientName, String clientImage, Integer durationMinutes, String status, Double price, String currency, Date createAt) {
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
}
