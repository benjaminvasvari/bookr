package com.vizsgaremek.bookr.DTO;

public class staffPanelDTO {

    public static class getDetailedServicesDTO {

        private Integer serviceId;
        private String serviceName;
        private String description;
        private Integer durationMinutes;
        private Double price;
        private String currency;
        private Boolean isActive;
        private String category;
        private Integer categoryId;
        private String assignedAt;

        public getDetailedServicesDTO(Integer serviceId, String serviceName, String description, Integer durationMinutes, Double price, String currency, Boolean isActive, String category, Integer categoryId, String assignedAt) {
            this.serviceId = serviceId;
            this.serviceName = serviceName;
            this.description = description;
            this.durationMinutes = durationMinutes;
            this.price = price;
            this.currency = currency;
            this.isActive = isActive;
            this.category = category;
            this.categoryId = categoryId;
            this.assignedAt = assignedAt;
        }

        public Integer getServiceId() {
            return serviceId;
        }

        public String getServiceName() {
            return serviceName;
        }

        public String getDescription() {
            return description;
        }

        public Integer getDurationMinutes() {
            return durationMinutes;
        }

        public Double getPrice() {
            return price;
        }

        public String getCurrency() {
            return currency;
        }

        public Boolean getIsActive() {
            return isActive;
        }

        public String getCategory() {
            return category;
        }

        public Integer getCategoryId() {
            return categoryId;
        }

        public String getAssignedAt() {
            return assignedAt;
        }
    }

    public static class getTodayAppointmentsByStaffDTO {

        private Integer id;
        private String startTime;
        private String endTime;
        private String status;
        private String note;
        private String internalNotes;
        private Double price;
        private String currency;
        private String serviceName;
        private Integer durationMinutes;
        private String clientName;
        private String clientPhone;
        private String clientEmail;

        public getTodayAppointmentsByStaffDTO(Integer id, String startTime, String endTime, String status, String note, String internalNotes, Double price, String currency, String serviceName, Integer durationMinutes, String clientName, String clientPhone, String clientEmail) {
            this.id = id;
            this.startTime = startTime;
            this.endTime = endTime;
            this.status = status;
            this.note = note;
            this.internalNotes = internalNotes;
            this.price = price;
            this.currency = currency;
            this.serviceName = serviceName;
            this.durationMinutes = durationMinutes;
            this.clientName = clientName;
            this.clientPhone = clientPhone;
            this.clientEmail = clientEmail;
        }

        public Integer getId() {
            return id;
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

        public String getNote() {
            return note;
        }

        public String getInternalNotes() {
            return internalNotes;
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
