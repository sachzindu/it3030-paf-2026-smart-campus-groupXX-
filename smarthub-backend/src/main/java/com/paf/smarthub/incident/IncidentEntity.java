package com.paf.smarthub.incident;

import com.paf.smarthub.auth.entity.User;
import com.paf.smarthub.facility.FacilityEntity;
import com.paf.smarthub.shared.entity.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "incidents", indexes = {
        @Index(name = "idx_incident_status", columnList = "status"),
        @Index(name = "idx_incident_reporter", columnList = "reporter_id"),
        @Index(name = "idx_incident_assignee", columnList = "assignee_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IncidentEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private IncidentEnums.IncidentCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private IncidentEnums.IncidentPriority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private IncidentEnums.IncidentStatus status = IncidentEnums.IncidentStatus.PENDING;

    /**
     * Can be a specific Facility ID or a manual text location.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facility_id")
    private FacilityEntity facility;

    @Column(length = 255)
    private String location;

    @Column(name = "contact_details", length = 255)
    private String contactDetails;

    /**
     * User who reported the incident.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    /**
     * Assigned technician or staff.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private User assignee;

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    /**
     * When true, admin-side updates are locked after the first admin action.
     */
    @Column(name = "admin_locked", nullable = false)
    @Builder.Default
    private boolean adminLocked = false;

    /**
     * List of image URLs attached to the incident (up to 3).
     */
    @ElementCollection
    @CollectionTable(name = "incident_images", joinColumns = @JoinColumn(name = "incident_id"))
    @Column(name = "image_url")
    @Builder.Default
    private List<String> imageUrls = new ArrayList<>();
}
