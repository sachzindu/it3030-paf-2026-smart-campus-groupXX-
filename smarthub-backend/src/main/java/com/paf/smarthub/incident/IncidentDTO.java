package com.paf.smarthub.incident;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class IncidentDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IncidentResponse {
        private Long id;
        private String title;
        private String description;
        private IncidentEnums.IncidentCategory category;
        private IncidentEnums.IncidentPriority priority;
        private IncidentEnums.IncidentStatus status;

        private Long facilityId;
        private String facilityName;
        private String location;
        private String contactDetails;

        private Long reporterId;
        private String reporterName;
        private String reporterEmail;

        private Long assigneeId;
        private String assigneeName;

        private String resolutionNotes;
        private List<String> imageUrls;

        private boolean adminLocked;

        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IncidentCommentResponse {
        private Long id;
        private Long incidentId;
        private Long authorId;
        private String authorName;
        private String authorRole;
        private String content;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    // Notice we do NOT use this for creation directly in @RequestBody because
    // we need to support multipart/form-data for image uploads. We'll use a model attribute or manual mapping.
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateIncidentRequest {
        @NotBlank(message = "Title is required")
        private String title;

        @NotBlank(message = "Description is required")
        private String description;

        @NotNull(message = "Category is required")
        private IncidentEnums.IncidentCategory category;



        private Long facilityId;

        @NotBlank(message = "Location is required")
        private String location;

        private String contactDetails;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateIncidentRequest {
        @NotBlank(message = "Title is required")
        private String title;

        @NotBlank(message = "Description is required")
        private String description;

        @NotNull(message = "Category is required")
        private IncidentEnums.IncidentCategory category;

        @NotNull(message = "Priority is required")
        private IncidentEnums.IncidentPriority priority;

        private Long facilityId;

        @NotBlank(message = "Location is required")
        private String location;

        private String contactDetails;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateStatusRequest {
        @NotNull(message = "Status is required")
        private IncidentEnums.IncidentStatus status;
        
        private String resolutionNotes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssignTechnicianRequest {
        @NotNull(message = "Technician ID is required")
        private Long technicianId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdatePriorityRequest {
        @NotNull(message = "Priority is required")
        private IncidentEnums.IncidentPriority priority;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddCommentRequest {
        @NotBlank(message = "Comment content cannot be blank")
        private String content;
    }
}
