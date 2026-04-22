package com.paf.smarthub.facility;

import com.paf.smarthub.shared.entity.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

/**
 * Represents a bookable campus resource: lecture halls, labs,
 * meeting rooms, auditoriums, or equipment (projectors, cameras, etc.).
 *
 * Each resource has metadata including type, capacity, location,
 * availability windows, and operational status.
 */
@Entity
@Table(name = "facilities", indexes = {
        @Index(name = "idx_facility_type", columnList = "facility_type"),
        @Index(name = "idx_facility_status", columnList = "status"),
        @Index(name = "idx_facility_location", columnList = "location"),
        @Index(name = "idx_facility_name", columnList = "name", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacilityEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * High-level classification of this resource.
     * Determines which additional fields are relevant (e.g., capacity for rooms,
     * assetType for equipment).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "facility_type", nullable = false, length = 20)
    private FacilityEnums.FacilityType facilityType;

    /**
     * Sub-type for equipment resources. Null for room-type facilities.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "asset_type", length = 20)
    private FacilityEnums.AssetType assetType;

    /**
     * Maximum number of people the resource can accommodate.
     * Primarily relevant for rooms and halls; null for equipment.
     */
    @Column
    private Integer capacity;

    /**
     * Physical location description (e.g., "Block A, Floor 3, Room 301").
     */
    @Column(nullable = false, length = 255)
    private String location;

    /**
     * Operational status — OUT_OF_SERVICE resources cannot be booked.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private FacilityEnums.FacilityStatus status = FacilityEnums.FacilityStatus.ACTIVE;

    /**
     * Daily availability window start. Bookings must fall within this window.
     */
    @Column(name = "available_from")
    private LocalTime availableFrom;

    /**
     * Daily availability window end. Bookings must fall within this window.
     */
    @Column(name = "available_to")
    private LocalTime availableTo;

    /**
     * Optional image URL for the facility.
     */
    @Column(name = "image_url", length = 512)
    private String imageUrl;
}
