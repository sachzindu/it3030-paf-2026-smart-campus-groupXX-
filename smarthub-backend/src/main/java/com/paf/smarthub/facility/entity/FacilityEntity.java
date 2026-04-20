package com.paf.smarthub.facility.entity;

import com.paf.smarthub.facility.enums.FacilityStatus;
import com.paf.smarthub.facility.enums.FacilityType;
import com.paf.smarthub.booking.BookingEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing a facility/resource that can be booked.
 * Facilities include lecture halls, labs, meeting rooms, and equipment.
 */
@Entity
@Table(name = "facility")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FacilityEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FacilityType type;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private Integer capacity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FacilityStatus status = FacilityStatus.ACTIVE;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "facility_amenities",
        joinColumns = @JoinColumn(name = "facility_id")
    )
    @Column(name = "amenity")
    private List<String> amenities = new ArrayList<>();

    @Column
    private String imageUrl;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "facility", cascade = CascadeType.REMOVE, fetch = FetchType.LAZY)
    private List<BookingEntity> bookings = new ArrayList<>();
}
