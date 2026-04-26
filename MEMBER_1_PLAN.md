# Member 1: Facilities Catalogue & Resource Management - Implementation Plan

**Target Score: 85-95/100**

---

## 📋 PROJECT OVERVIEW

**Module:** Facilities & Assets Catalogue + Resource Management  
**Responsible Endpoints:** 8-10 REST API endpoints (minimum 4 required)  
**React Components:** 5-7 reusable components  
**Database:** MySQL (FreeSQLDatabase)  
**Timeline:** 7 days to completion  

---

## 🎯 MARKING RUBRIC ALIGNMENT

### Individual Assessment (60 Marks Total)

#### 1. REST API (30 Marks - Individual)
- **Endpoint Naming (5 Marks):** Follow RESTful conventions strictly
- **REST Architectural Styles (10 Marks):** Implement all 6 REST constraints
- **HTTP Methods & Status Codes (10 Marks):** Use correct GET, POST, PUT/PATCH, DELETE, 200, 201, 204, 400, 404
- **Code Quality (5 Marks):** Clean, well-documented, follows Spring Boot best practices

#### 2. Client Web Application (15 Marks - Individual)
- **Architectural Design (5 Marks):** Modular components, follows React best practices
- **Requirement Satisfaction (5 Marks):** All features working seamlessly
- **UI/UX (5 Marks):** Visually appealing, intuitive, good user experience

#### 3. Group Contribution
- **Documentation (15 Marks):** Facilities section in final report
- **Version Control (10 Marks):** Meaningful commits reflecting your work
- **Authentication (10 Marks):** OAuth role-based access (as part of group)
- **Innovation (10 Marks):** Add unique features to stand out

---

## 📝 PART 1: REST API IMPLEMENTATION (Backend)

### 1.1 Core Endpoints (8-10 endpoints)

#### GET Endpoints
```
✓ GET /api/facilities                          - List all facilities (with filters)
✓ GET /api/facilities/{id}                    - Get facility details
✓ GET /api/facilities/search                  - Search facilities (by name, type, location)
✓ GET /api/facilities/available               - Get available facilities (time-based)
✓ GET /api/facilities/{id}/availability       - Check availability calendar
```

#### POST Endpoints
```
✓ POST /api/facilities                         - Create new facility (ADMIN only)
✓ POST /api/facilities/{id}/check-availability - Check conflict for booking
```

#### PUT/PATCH Endpoints
```
✓ PUT /api/facilities/{id}                    - Update facility (ADMIN only)
✓ PATCH /api/facilities/{id}/status           - Change facility status
```

#### DELETE Endpoints
```
✓ DELETE /api/facilities/{id}                 - Delete facility (ADMIN only)
```

### 1.2 Request/Response DTOs

**FacilityDTO.java**
```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class FacilityDTO {
    private Long id;
    private String name;
    private String description;
    private FacilityType type;           // LECTURE_HALL, LAB, MEETING_ROOM, EQUIPMENT
    private String location;              // Building + Room number
    private Integer capacity;             // Max occupancy
    private FacilityStatus status;        // ACTIVE, OUT_OF_SERVICE, MAINTENANCE
    private List<String> amenities;       // Projector, WiFi, etc.
    private String imageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

**FacilitySearchRequest.java**
```java
@Data
public class FacilitySearchRequest {
    private String name;
    private FacilityType type;
    private Integer minCapacity;
    private Integer maxCapacity;
    private String location;
    private FacilityStatus status;
    private LocalDate availableDate;
    private LocalTime startTime;
    private LocalTime endTime;
}
```

**AvailabilityCheckRequest.java**
```java
@Data
@Valid
public class AvailabilityCheckRequest {
    @NotNull
    private Long facilityId;
    
    @NotNull
    @FutureOrPresent
    private LocalDate bookingDate;
    
    @NotNull
    private LocalTime startTime;
    
    @NotNull
    private LocalTime endTime;
}
```

**AvailabilityCheckResponse.java**
```java
@Data
@AllArgsConstructor
public class AvailabilityCheckResponse {
    private Boolean isAvailable;
    private List<ConflictingBooking> conflicts;
    private String message;
}
```

### 1.3 Controller Implementation

**FacilityController.java** (8-10 endpoints)

```java
@RestController
@RequestMapping("/api/facilities")
@RequiredArgsConstructor
public class FacilityController {

    private final FacilityService facilityService;
    private final FacilityMapper facilityMapper;

    // 1. GET all facilities with pagination & filters
    @GetMapping
    public ResponseEntity<Page<FacilityDTO>> getAllFacilities(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(required = false) FacilityType type,
        @RequestParam(required = false) FacilityStatus status
    ) {
        return ResponseEntity.ok(facilityService.getAllFacilities(page, size, type, status));
    }

    // 2. GET facility by ID
    @GetMapping("/{id}")
    public ResponseEntity<FacilityDTO> getFacilityById(@PathVariable Long id) {
        return ResponseEntity.ok(facilityService.getFacilityById(id));
    }

    // 3. SEARCH facilities with complex criteria
    @PostMapping("/search")
    public ResponseEntity<List<FacilityDTO>> searchFacilities(
        @Valid @RequestBody FacilitySearchRequest request
    ) {
        return ResponseEntity.ok(facilityService.searchFacilities(request));
    }

    // 4. CHECK availability for a facility
    @PostMapping("/{id}/check-availability")
    public ResponseEntity<AvailabilityCheckResponse> checkAvailability(
        @PathVariable Long id,
        @Valid @RequestBody AvailabilityCheckRequest request
    ) {
        return ResponseEntity.ok(facilityService.checkAvailability(id, request));
    }

    // 5. GET availability calendar
    @GetMapping("/{id}/availability")
    public ResponseEntity<AvailabilityCalendar> getAvailabilityCalendar(
        @PathVariable Long id,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month
    ) {
        return ResponseEntity.ok(facilityService.getAvailabilityCalendar(id, month));
    }

    // 6. CREATE new facility (ADMIN only)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FacilityDTO> createFacility(
        @Valid @RequestBody CreateFacilityRequest request
    ) {
        FacilityDTO created = facilityService.createFacility(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // 7. UPDATE facility (ADMIN only)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FacilityDTO> updateFacility(
        @PathVariable Long id,
        @Valid @RequestBody UpdateFacilityRequest request
    ) {
        return ResponseEntity.ok(facilityService.updateFacility(id, request));
    }

    // 8. PATCH facility status (ADMIN only)
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FacilityDTO> updateFacilityStatus(
        @PathVariable Long id,
        @RequestParam FacilityStatus newStatus
    ) {
        return ResponseEntity.ok(facilityService.updateFacilityStatus(id, newStatus));
    }

    // 9. DELETE facility (ADMIN only)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteFacility(@PathVariable Long id) {
        facilityService.deleteFacility(id);
        return ResponseEntity.noContent().build();
    }

    // 10. GET available facilities list
    @GetMapping("/available/now")
    public ResponseEntity<List<FacilityDTO>> getAvailableFacilitiesNow() {
        return ResponseEntity.ok(facilityService.getAvailableFacilitiesNow());
    }
}
```

### 1.4 Service Layer (Business Logic)

**FacilityService.java**

```java
@Service
@RequiredArgsConstructor
public class FacilityService {

    private final FacilityRepository facilityRepository;
    private final BookingRepository bookingRepository;
    private final FacilityMapper mapper;

    // List all with filtering
    public Page<FacilityDTO> getAllFacilities(int page, int size, 
            FacilityType type, FacilityStatus status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        
        Page<FacilityEntity> facilities;
        if (type != null && status != null) {
            facilities = facilityRepository.findByTypeAndStatus(type, status, pageable);
        } else if (type != null) {
            facilities = facilityRepository.findByType(type, pageable);
        } else if (status != null) {
            facilities = facilityRepository.findByStatus(status, pageable);
        } else {
            facilities = facilityRepository.findAll(pageable);
        }
        
        return facilities.map(mapper::toDTO);
    }

    // Get by ID with error handling
    public FacilityDTO getFacilityById(Long id) {
        FacilityEntity facility = facilityRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Facility not found with id: " + id));
        return mapper.toDTO(facility);
    }

    // Search with complex criteria
    public List<FacilityDTO> searchFacilities(FacilitySearchRequest request) {
        Specification<FacilityEntity> spec = Specification.where(null);

        if (request.getName() != null) {
            spec = spec.and((root, query, cb) -> 
                cb.like(cb.lower(root.get("name")), "%" + request.getName().toLowerCase() + "%"));
        }
        if (request.getType() != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("type"), request.getType()));
        }
        if (request.getMinCapacity() != null) {
            spec = spec.and((root, query, cb) -> 
                cb.greaterThanOrEqualTo(root.get("capacity"), request.getMinCapacity()));
        }
        if (request.getMaxCapacity() != null) {
            spec = spec.and((root, query, cb) -> 
                cb.lessThanOrEqualTo(root.get("capacity"), request.getMaxCapacity()));
        }
        if (request.getLocation() != null) {
            spec = spec.and((root, query, cb) -> 
                cb.like(cb.lower(root.get("location")), "%" + request.getLocation().toLowerCase() + "%"));
        }

        return facilityRepository.findAll(spec).stream()
            .map(mapper::toDTO)
            .collect(Collectors.toList());
    }

    // Check availability (prevents double booking)
    public AvailabilityCheckResponse checkAvailability(Long facilityId, 
            AvailabilityCheckRequest request) {
        FacilityEntity facility = facilityRepository.findById(facilityId)
            .orElseThrow(() -> new ResourceNotFoundException("Facility not found"));

        if (!facility.getStatus().equals(FacilityStatus.ACTIVE)) {
            return new AvailabilityCheckResponse(false, Collections.emptyList(), 
                "Facility is not available");
        }

        List<BookingEntity> conflicts = bookingRepository.findConflictingBookings(
            facilityId,
            request.getBookingDate(),
            request.getStartTime(),
            request.getEndTime()
        );

        boolean isAvailable = conflicts.isEmpty();
        List<ConflictingBooking> conflictDetails = conflicts.stream()
            .map(b -> new ConflictingBooking(b.getId(), b.getStartTime(), b.getEndTime()))
            .collect(Collectors.toList());

        return new AvailabilityCheckResponse(
            isAvailable,
            conflictDetails,
            isAvailable ? "Facility is available" : "Conflicts found"
        );
    }

    // Create new facility
    @Transactional
    public FacilityDTO createFacility(CreateFacilityRequest request) {
        // Validate input
        if (request.getCapacity() <= 0) {
            throw new ValidationException("Capacity must be greater than 0");
        }

        FacilityEntity facility = mapper.toEntity(request);
        facility.setStatus(FacilityStatus.ACTIVE);
        facility.setCreatedAt(LocalDateTime.now());
        
        FacilityEntity saved = facilityRepository.save(facility);
        return mapper.toDTO(saved);
    }

    // Update facility
    @Transactional
    public FacilityDTO updateFacility(Long id, UpdateFacilityRequest request) {
        FacilityEntity facility = facilityRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Facility not found"));

        if (request.getName() != null) facility.setName(request.getName());
        if (request.getDescription() != null) facility.setDescription(request.getDescription());
        if (request.getCapacity() != null) facility.setCapacity(request.getCapacity());
        if (request.getLocation() != null) facility.setLocation(request.getLocation());
        
        facility.setUpdatedAt(LocalDateTime.now());
        FacilityEntity updated = facilityRepository.save(facility);
        return mapper.toDTO(updated);
    }

    // Change status
    @Transactional
    public FacilityDTO updateFacilityStatus(Long id, FacilityStatus newStatus) {
        FacilityEntity facility = facilityRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Facility not found"));
        
        facility.setStatus(newStatus);
        facility.setUpdatedAt(LocalDateTime.now());
        FacilityEntity updated = facilityRepository.save(facility);
        return mapper.toDTO(updated);
    }

    // Delete facility
    @Transactional
    public void deleteFacility(Long id) {
        FacilityEntity facility = facilityRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Facility not found"));
        
        // Check if facility has active bookings
        long activeBookings = bookingRepository.countByFacilityAndStatusNot(
            facility, BookingStatus.CANCELLED);
        
        if (activeBookings > 0) {
            throw new ValidationException("Cannot delete facility with active bookings");
        }
        
        facilityRepository.deleteById(id);
    }
}
```

### 1.5 Repository Layer

**FacilityRepository.java**
```java
@Repository
public interface FacilityRepository extends JpaRepository<FacilityEntity, Long>, 
        JpaSpecificationExecutor<FacilityEntity> {
    
    Page<FacilityEntity> findByType(FacilityType type, Pageable pageable);
    Page<FacilityEntity> findByStatus(FacilityStatus status, Pageable pageable);
    Page<FacilityEntity> findByTypeAndStatus(FacilityType type, FacilityStatus status, Pageable pageable);
    
    List<FacilityEntity> findByStatus(FacilityStatus status);
}
```

**Custom BookingRepository Query**
```java
@Query("""
    SELECT b FROM BookingEntity b 
    WHERE b.facility.id = :facilityId 
    AND b.bookingDate = :bookingDate
    AND b.status IN ('APPROVED', 'PENDING')
    AND (b.startTime < :endTime AND b.endTime > :startTime)
""")
List<BookingEntity> findConflictingBookings(
    Long facilityId,
    LocalDate bookingDate,
    LocalTime startTime,
    LocalTime endTime
);
```

### 1.6 Exception Handling

**Custom Exceptions**
```java
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}

public class ValidationException extends RuntimeException {
    public ValidationException(String message) {
        super(message);
    }
}
```

**Global Exception Handler**
```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ApiResponse("NOT_FOUND", ex.getMessage(), null));
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ApiResponse> handleValidation(ValidationException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ApiResponse("VALIDATION_ERROR", ex.getMessage(), null));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
            errors.put(error.getField(), error.getDefaultMessage())
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ApiResponse("VALIDATION_ERROR", "Invalid input", errors));
    }
}
```

---

## 🎨 PART 2: REACT FRONTEND IMPLEMENTATION

### 2.1 Component Structure

```
src/components/Facilities/
├── FacilityList.jsx              # Main list with filters & pagination
├── FacilityCard.jsx              # Reusable facility card component
├── FacilityDetail.jsx            # Detailed facility view
├── FacilityForm.jsx              # Create/Update facility form (ADMIN)
├── AvailabilityChecker.jsx       # Check availability for booking
├── FacilitySearch.jsx            # Advanced search component
└── FacilityFilter.jsx            # Filter sidebar
```

### 2.2 Main Components

**FacilityList.jsx** (Main Page)
```jsx
import React, { useState, useEffect } from 'react';
import { api } from '../api/axios';
import FacilityCard from './FacilityCard';
import FacilityFilter from './FacilityFilter';
import Loading from '../common/Loading';
import ErrorMessage from '../common/ErrorMessage';

function FacilityList() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({
    type: '',
    status: 'ACTIVE',
    capacity: ''
  });

  // Fetch facilities with filters
  useEffect(() => {
    fetchFacilities();
  }, [page, filters]);

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        size: 10,
        ...(filters.type && { type: filters.type }),
        ...(filters.status && { status: filters.status })
      });

      const response = await api.get(`/api/facilities?${params}`);
      setFacilities(response.data.content);
      setTotalPages(response.data.totalPages);
      setError(null);
    } catch (err) {
      setError('Failed to load facilities');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(0);
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="facility-list-container">
      <div className="facilities-header">
        <h1>🏢 Available Facilities</h1>
        <p className="subtitle">Browse and manage campus facilities</p>
      </div>

      <div className="content-wrapper">
        {/* Sidebar Filter */}
        <aside className="filter-sidebar">
          <FacilityFilter onFilterChange={handleFilterChange} />
        </aside>

        {/* Main Content */}
        <main className="facilities-grid">
          {facilities.length > 0 ? (
            <>
              <div className="facilities-cards">
                {facilities.map((facility) => (
                  <FacilityCard key={facility.id} facility={facility} />
                ))}
              </div>

              {/* Pagination */}
              <div className="pagination">
                <button 
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                  className="btn-secondary"
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {page + 1} of {totalPages}
                </span>
                <button 
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                  className="btn-primary"
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <div className="no-results">
              <p>No facilities found matching your criteria</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default FacilityList;
```

**FacilityCard.jsx** (Reusable Card)
```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AvailabilityChecker from './AvailabilityChecker';
import './FacilityCard.css';

function FacilityCard({ facility }) {
  const navigate = useNavigate();
  const [showAvailability, setShowAvailability] = useState(false);

  return (
    <div className="facility-card">
      {/* Image */}
      <div className="card-image">
        <img 
          src={facility.imageUrl || '/placeholder-facility.jpg'} 
          alt={facility.name}
        />
        <span className={`status-badge ${facility.status.toLowerCase()}`}>
          {facility.status}
        </span>
      </div>

      {/* Content */}
      <div className="card-content">
        <h3>{facility.name}</h3>
        <p className="description">{facility.description}</p>

        {/* Details */}
        <div className="facility-details">
          <div className="detail-item">
            <span className="icon">📍</span>
            <span>{facility.location}</span>
          </div>
          <div className="detail-item">
            <span className="icon">👥</span>
            <span>{facility.capacity} capacity</span>
          </div>
          <div className="detail-item">
            <span className="icon">🏷️</span>
            <span>{facility.type}</span>
          </div>
        </div>

        {/* Amenities */}
        {facility.amenities && facility.amenities.length > 0 && (
          <div className="amenities">
            {facility.amenities.map((amenity, idx) => (
              <span key={idx} className="amenity-tag">{amenity}</span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="card-actions">
          <button 
            className="btn-primary"
            onClick={() => navigate(`/facilities/${facility.id}`)}
          >
            View Details
          </button>
          <button 
            className="btn-secondary"
            onClick={() => setShowAvailability(!showAvailability)}
          >
            Check Availability
          </button>
        </div>
      </div>

      {/* Availability Checker Modal */}
      {showAvailability && (
        <AvailabilityChecker 
          facilityId={facility.id}
          onClose={() => setShowAvailability(false)}
        />
      )}
    </div>
  );
}

export default FacilityCard;
```

**FacilityFilter.jsx** (Advanced Filters)
```jsx
import React, { useState } from 'react';

function FacilityFilter({ onFilterChange }) {
  const [filters, setFilters] = useState({
    type: '',
    status: 'ACTIVE',
    capacity: ''
  });

  const handleChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="filter-container">
      <h3>🔍 Filters</h3>

      {/* Type Filter */}
      <div className="filter-group">
        <label htmlFor="type">Facility Type</label>
        <select 
          id="type"
          value={filters.type}
          onChange={(e) => handleChange('type', e.target.value)}
        >
          <option value="">All Types</option>
          <option value="LECTURE_HALL">Lecture Hall</option>
          <option value="LAB">Laboratory</option>
          <option value="MEETING_ROOM">Meeting Room</option>
          <option value="EQUIPMENT">Equipment</option>
        </select>
      </div>

      {/* Status Filter */}
      <div className="filter-group">
        <label htmlFor="status">Status</label>
        <select 
          id="status"
          value={filters.status}
          onChange={(e) => handleChange('status', e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="OUT_OF_SERVICE">Out of Service</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>
      </div>

      {/* Capacity Filter */}
      <div className="filter-group">
        <label htmlFor="capacity">Min. Capacity</label>
        <input 
          id="capacity"
          type="number"
          min="0"
          placeholder="Capacity"
          value={filters.capacity}
          onChange={(e) => handleChange('capacity', e.target.value)}
        />
      </div>

      {/* Reset Button */}
      <button 
        className="btn-secondary btn-block"
        onClick={() => {
          const reset = { type: '', status: 'ACTIVE', capacity: '' };
          setFilters(reset);
          onFilterChange(reset);
        }}
      >
        Reset Filters
      </button>
    </div>
  );
}

export default FacilityFilter;
```

### 2.3 Styling (FacilityCard.css)

```css
.facility-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.facility-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.card-image {
  position: relative;
  height: 200px;
  overflow: hidden;
  background: #f0f0f0;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.out_of_service {
  background: #f8d7da;
  color: #721c24;
}

.card-content {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-content h3 {
  margin: 0 0 8px;
  font-size: 1.25rem;
  color: #333;
}

.description {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 12px;
  line-height: 1.4;
}

.facility-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 12px 0;
  padding: 12px 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
  font-size: 0.9rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #555;
}

.amenities {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 12px 0;
}

.amenity-tag {
  background: #e7f3ff;
  color: #0066cc;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 0.8rem;
}

.card-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: auto;
}

.btn-primary, .btn-secondary {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background: #e0e0e0;
}
```

---

## 📊 PART 3: DATABASE SCHEMA

**FacilityEntity.java**
```java
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

    @ElementCollection
    @CollectionTable(name = "facility_amenities", joinColumns = @JoinColumn(name = "facility_id"))
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

    @OneToMany(mappedBy = "facility", cascade = CascadeType.REMOVE)
    private List<BookingEntity> bookings = new ArrayList<>();
}
```

**Enums**
```java
public enum FacilityType {
    LECTURE_HALL("Lecture Hall"),
    LAB("Laboratory"),
    MEETING_ROOM("Meeting Room"),
    EQUIPMENT("Equipment");

    private String displayName;
    FacilityType(String displayName) {
        this.displayName = displayName;
    }
}

public enum FacilityStatus {
    ACTIVE("Active"),
    OUT_OF_SERVICE("Out of Service"),
    MAINTENANCE("Maintenance");

    private String displayName;
    FacilityStatus(String displayName) {
        this.displayName = displayName;
    }
}
```

---

## ✅ IMPLEMENTATION CHECKLIST

### Phase 1: Backend Setup (Days 1-2)
- [ ] Create FacilityEntity with all fields
- [ ] Create FacilityRepository with custom queries
- [ ] Create DTOs (FacilityDTO, request/response classes)
- [ ] Create FacilityController with 10 endpoints
- [ ] Create FacilityService with business logic
- [ ] Create exception handlers
- [ ] Write validation logic
- [ ] Test all endpoints with Postman

### Phase 2: Frontend Setup (Days 3-4)
- [ ] Create FacilityList component with pagination
- [ ] Create FacilityCard reusable component
- [ ] Create FacilityFilter component
- [ ] Create FacilityDetail page
- [ ] Add CSS styling (responsive design)
- [ ] Integrate with API using axios
- [ ] Add loading & error states
- [ ] Test all functionality

### Phase 3: Admin Features (Days 5-6)
- [ ] Create FacilityForm for CREATE/UPDATE
- [ ] Implement admin-only routes with role check
- [ ] Add delete functionality
- [ ] Add status update functionality
- [ ] Test with ADMIN role
- [ ] Add validation & error messages

### Phase 4: Testing & Optimization (Day 7)
- [ ] Unit tests for service layer
- [ ] Integration tests for endpoints
- [ ] Postman collection for all endpoints
- [ ] Frontend manual testing
- [ ] Performance optimization
- [ ] Code cleanup & documentation
- [ ] Screenshot preparation for viva

---

## 📋 POSTMAN COLLECTION (Testing)

Create a Postman collection with these test cases:

```json
{
  "GET /api/facilities": "List all facilities with pagination",
  "GET /api/facilities?type=LECTURE_HALL": "Filter by type",
  "GET /api/facilities/1": "Get single facility",
  "POST /api/facilities/1/check-availability": "Check booking conflict",
  "POST /api/facilities": "Create facility (ADMIN)",
  "PUT /api/facilities/1": "Update facility (ADMIN)",
  "PATCH /api/facilities/1/status": "Change status (ADMIN)",
  "DELETE /api/facilities/1": "Delete facility (ADMIN)",
  "POST /api/facilities/search": "Advanced search"
}
```

---

## 🚀 EXTRAS FOR FULL MARKS (Innovation)

Add one or more of these features:

### 1. Facility Availability Calendar
```javascript
// Show month/week view of availability
- Interactive calendar
- Color-coded availability
- Hover to see bookings
```

### 2. QR Code for Facilities
```javascript
- Generate QR code for each facility
- Scan to view details & book
```

### 3. Facility Analytics (Admin)
```javascript
- Most booked facilities
- Peak hours
- Usage statistics
```

### 4. Image Upload for Facilities
```javascript
- Upload facility photos
- Image gallery
- Drag & drop support
```

### 5. Facility Ratings & Reviews
```javascript
- Users can rate facilities
- Leave comments
- Average rating display
```

---

## 📝 DOCUMENTATION (For Final Report)

Create these documents:

### 1. Facilities Module Design Document
- Functional requirements
- Database schema diagram
- API endpoint specifications
- Use cases for facilities

### 2. Endpoint Documentation
```markdown
# Facility Management Endpoints

## GET /api/facilities
- Purpose: List all facilities
- Parameters: page, size, type, status
- Response: Page<FacilityDTO>
- Status Codes: 200 OK

## POST /api/facilities
- Purpose: Create new facility
- Access: ADMIN only
- Request Body: CreateFacilityRequest
- Response: FacilityDTO
- Status Codes: 201 Created, 400 Bad Request, 403 Forbidden
```

### 3. Testing Evidence
- Screenshots of Postman tests
- Test results (pass/fail)
- Response examples

---

## 🎯 SCORING BREAKDOWN (Target: 85-95/100)

### REST API (30 marks) → Target: 28/30
- ✅ Endpoint Naming (5/5) - RESTful conventions
- ✅ REST Styles (9/10) - All 6 constraints
- ✅ HTTP Methods & Status Codes (9/10) - Correct usage
- ✅ Code Quality (5/5) - Clean, documented code

### Client Web Application (15 marks) → Target: 14/15
- ✅ Architecture (5/5) - Modular components
- ✅ Requirements (4/5) - All features working
- ✅ UI/UX (5/5) - Visually appealing, intuitive

### Documentation (15 marks) → Part of group
- ✅ Clear facilities section
- ✅ Endpoint documentation
- ✅ Architecture diagrams

### Version Control (10 marks) → Part of group
- ✅ Meaningful commits
- ✅ Clear commit messages
- ✅ Professional branching

### Innovation (10 marks) → +3 to +5 bonus
- ✅ Add 1-2 unique features
- ✅ Stand out from basic requirements

**Total: 28 + 14 + (group contributions) = 85-95/100**

---

## 📅 TIMELINE

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Setup & Planning | Day 1 | Schema, DTOs, Controller sketch |
| Backend Dev | Days 2-3 | All 10 endpoints working |
| Frontend Dev | Days 4-5 | All components + styling |
| Admin Features | Day 6 | Create/Update/Delete with ADMIN checks |
| Testing & Polish | Day 7 | Tests, documentation, screenshots |

---

## ⚠️ IMPORTANT REMINDERS

1. **HTTP Status Codes** - Use correctly:
   - 200 OK (successful GET, PUT, PATCH)
   - 201 Created (successful POST)
   - 204 No Content (DELETE)
   - 400 Bad Request (validation error)
   - 404 Not Found (resource missing)
   - 403 Forbidden (no permission)

2. **REST Conventions** - Strictly follow:
   - Use nouns (facilities) not verbs (getFacilities)
   - Use HTTP methods properly (GET read, POST create, PUT update, DELETE delete)
   - Consistent naming across endpoints

3. **Error Handling** - Always include:
   - Custom exceptions
   - Global exception handler
   - Meaningful error messages
   - Proper HTTP status codes

4. **Code Quality** - Ensure:
   - No hardcoding
   - Proper validation
   - Comments for complex logic
   - Consistent formatting
   - No SQL injection (use parameterized queries)

5. **Git Commits** - Make meaningful commits:
   - "Add facility search endpoint" ✅
   - "Update" ❌
   - One commit per feature
   - Push regularly

6. **Testing** - Test everything:
   - Test all 10 endpoints
   - Test error cases
   - Test with Postman
   - Screenshot results

---

## 📞 SUMMARY

**You will implement:**
- ✅ 10 REST API endpoints (CRUD + Search + Availability Check)
- ✅ 6-7 React components (List, Card, Detail, Filter, Form, etc.)
- ✅ Complete business logic with validation
- ✅ Proper error handling & HTTP status codes
- ✅ Admin-only features with role-based access
- ✅ Clean, documented code following Spring Boot & React best practices
- ✅ 1-2 innovative features for extra marks

**This will give you 85-95/100 for your individual contribution!**

---

**Good luck! 🚀 You've got this!**
