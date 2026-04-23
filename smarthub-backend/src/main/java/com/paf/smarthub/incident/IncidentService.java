package com.paf.smarthub.incident;

import com.paf.smarthub.auth.entity.User;
import com.paf.smarthub.auth.repository.UserRepository;
import com.paf.smarthub.facility.FacilityEntity;
import com.paf.smarthub.facility.FacilityService;
import com.paf.smarthub.notification.NotificationService;
import com.paf.smarthub.shared.enums.Role;
import com.paf.smarthub.shared.exception.AccessDeniedException;
import com.paf.smarthub.shared.exception.ResourceNotFoundException;
import com.paf.smarthub.shared.service.FileStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class IncidentService {

    private static final Logger log = LoggerFactory.getLogger(IncidentService.class);

    private final IncidentRepository incidentRepository;
    private final IncidentCommentRepository commentRepository;
    private final UserRepository userRepository;
    private final FacilityService facilityService;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;

    public IncidentService(IncidentRepository incidentRepository,
                           IncidentCommentRepository commentRepository,
                           UserRepository userRepository,
                           FacilityService facilityService,
                           FileStorageService fileStorageService,
                           NotificationService notificationService) {
        this.incidentRepository = incidentRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.facilityService = facilityService;
        this.fileStorageService = fileStorageService;
        this.notificationService = notificationService;
    }

    // ============================================
    // Tickets - Create & Read
    // ============================================

    public IncidentDTO.IncidentResponse createIncident(
            IncidentDTO.CreateIncidentRequest request,
            List<MultipartFile> images,
            String userEmail) {

        User reporter = getUserByEmail(userEmail);

        FacilityEntity facility = null;
        if (request.getFacilityId() != null) {
            facility = facilityService.findEntityById(request.getFacilityId());
        }

        // Process images
        List<String> imageUrls = new ArrayList<>();
        if (images != null) {
            if (images.size() > 3) {
                throw new IllegalArgumentException("Maximum 3 image attachments allowed.");
            }
            for (MultipartFile file : images) {
                if (!file.isEmpty()) {
                    String url = fileStorageService.storeFile(file);
                    if (url != null) {
                        imageUrls.add(url);
                    }
                }
            }
        }

        IncidentEntity entity = IncidentEntity.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .priority(request.getPriority())
                .facility(facility)
                .location(request.getLocation())
                .contactDetails(request.getContactDetails())
                .reporter(reporter)
                .imageUrls(imageUrls)
                .build();

        IncidentEntity saved = incidentRepository.save(entity);
        log.info("Incident created: #{} by {}", saved.getId(), userEmail);
        return mapToIncidentResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<IncidentDTO.IncidentResponse> getMyIncidents(String userEmail) {
        User user = getUserByEmail(userEmail);
        return incidentRepository.findByReporterIdOrderByCreatedAtDesc(user.getId())
                .stream().map(this::mapToIncidentResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<IncidentDTO.IncidentResponse> getAllIncidents(IncidentEnums.IncidentStatus status) {
        if (status != null) {
            return incidentRepository.findByStatusOrderByCreatedAtDesc(status)
                    .stream().map(this::mapToIncidentResponse).collect(Collectors.toList());
        }
        return incidentRepository.findAll()
                .stream().map(this::mapToIncidentResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<IncidentDTO.IncidentResponse> getAssignedIncidents(String userEmail) {
        User user = getUserByEmail(userEmail);
        return incidentRepository.findByAssigneeIdOrderByCreatedAtDesc(user.getId())
                .stream().map(this::mapToIncidentResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public IncidentDTO.IncidentResponse getIncidentById(Long id, String userEmail, String role) {
        IncidentEntity incident = findIncidentById(id);
        
        // Access control: User can only see their own tickets if they aren't admin/technician
        if ("USER".equals(role) && !incident.getReporter().getEmail().equalsIgnoreCase(userEmail)) {
            throw new AccessDeniedException("You can only view your own incident tickets.");
        }
        
        return mapToIncidentResponse(incident);
    }

    // ============================================
    // Tickets - Update Roles & Status
    // ============================================

    public IncidentDTO.IncidentResponse assignTechnician(Long incidentId, IncidentDTO.AssignTechnicianRequest request) {
        IncidentEntity incident = findIncidentById(incidentId);

        User technician = userRepository.findById(request.getTechnicianId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getTechnicianId()));

        if (technician.getRole() != Role.TECHNICIAN && technician.getRole() != Role.ADMIN) {
            throw new IllegalArgumentException("Assigned user must be a TECHNICIAN or ADMIN.");
        }

        incident.setAssignee(technician);
        // Automatically transition to IN_PROGRESS if currently OPEN
        if (incident.getStatus() == IncidentEnums.IncidentStatus.OPEN) {
            incident.setStatus(IncidentEnums.IncidentStatus.IN_PROGRESS);
        }

        IncidentEntity saved = incidentRepository.save(incident);
        log.info("Incident #{} assigned to technician {}", incident.getId(), technician.getEmail());

        notificationService.sendIncidentAssignedEmail(saved);
        
        return mapToIncidentResponse(saved);
    }

    public IncidentDTO.IncidentResponse updateStatus(Long incidentId, IncidentDTO.UpdateStatusRequest request, String userEmail, String role) {
        IncidentEntity incident = findIncidentById(incidentId);

        // Validation for status change
        if (request.getStatus() == IncidentEnums.IncidentStatus.RESOLVED && 
           (request.getResolutionNotes() == null || request.getResolutionNotes().isBlank())) {
            throw new IllegalArgumentException("Resolution notes are required when setting status to RESOLVED.");
        }

        if (request.getStatus() == IncidentEnums.IncidentStatus.REJECTED && 
           (request.getResolutionNotes() == null || request.getResolutionNotes().isBlank())) {
            throw new IllegalArgumentException("Reason is required when setting status to REJECTED.");
        }

        // Apply
        incident.setStatus(request.getStatus());
        if (request.getResolutionNotes() != null && !request.getResolutionNotes().isBlank()) {
            incident.setResolutionNotes(request.getResolutionNotes());
        }

        IncidentEntity saved = incidentRepository.save(incident);
        log.info("Incident #{} status updated to {} by {}", incident.getId(), saved.getStatus(), userEmail);

        if ("ADMIN".equalsIgnoreCase(role)) {
            notificationService.sendIncidentStatusEmail(saved);
        }

        return mapToIncidentResponse(saved);
    }

    public IncidentDTO.IncidentResponse updatePriority(Long incidentId, IncidentDTO.UpdatePriorityRequest request) {
        IncidentEntity incident = findIncidentById(incidentId);
        incident.setPriority(request.getPriority());
        IncidentEntity saved = incidentRepository.save(incident);
        log.info("Incident #{} priority updated to {}", incident.getId(), saved.getPriority());

        notificationService.sendIncidentPriorityEmail(saved);
        return mapToIncidentResponse(saved);
    }


    // ============================================
    // Comments
    // ============================================

    @Transactional(readOnly = true)
    public List<IncidentDTO.IncidentCommentResponse> getComments(Long incidentId, String userEmail, String role) {
        IncidentEntity incident = findIncidentById(incidentId);
        if ("USER".equals(role) && !incident.getReporter().getEmail().equalsIgnoreCase(userEmail)) {
            throw new AccessDeniedException("You can only view comments on your own incident tickets.");
        }

        return commentRepository.findByIncidentIdOrderByCreatedAtAsc(incidentId)
                .stream().map(this::mapToCommentResponse).collect(Collectors.toList());
    }

    public IncidentDTO.IncidentCommentResponse addComment(Long incidentId, IncidentDTO.AddCommentRequest request, String userEmail) {
        IncidentEntity incident = findIncidentById(incidentId);
        User author = getUserByEmail(userEmail);

        // Verify access if user
        if (author.getRole() == Role.USER && !incident.getReporter().getEmail().equalsIgnoreCase(userEmail)) {
            throw new AccessDeniedException("You can only comment on your own incident tickets.");
        }

        IncidentCommentEntity comment = IncidentCommentEntity.builder()
                .incident(incident)
                .author(author)
                .content(request.getContent().trim())
                .build();

        IncidentCommentEntity saved = commentRepository.save(comment);

        if (author.getRole() == Role.ADMIN) {
            notificationService.sendIncidentAdminCommentEmail(incident, saved.getContent());
        }
        return mapToCommentResponse(saved);
    }

    public void deleteComment(Long commentId, String userEmail, String role) {
        IncidentCommentEntity comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", commentId));

        if (!"ADMIN".equals(role) && !comment.getAuthor().getEmail().equalsIgnoreCase(userEmail)) {
            throw new AccessDeniedException("You can only delete your own comments.");
        }

        commentRepository.delete(comment);
    }

    // ============================================
    // Helpers
    // ============================================

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    private IncidentEntity findIncidentById(Long id) {
        return incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident", "id", id));
    }

    private IncidentDTO.IncidentResponse mapToIncidentResponse(IncidentEntity e) {
        return IncidentDTO.IncidentResponse.builder()
                .id(e.getId())
                .title(e.getTitle())
                .description(e.getDescription())
                .category(e.getCategory())
                .priority(e.getPriority())
                .status(e.getStatus())
                .facilityId(e.getFacility() != null ? e.getFacility().getId() : null)
                .facilityName(e.getFacility() != null ? e.getFacility().getName() : null)
                .location(e.getLocation())
                .contactDetails(e.getContactDetails())
                .reporterId(e.getReporter().getId())
                .reporterName(e.getReporter().getName())
                .reporterEmail(e.getReporter().getEmail())
                .assigneeId(e.getAssignee() != null ? e.getAssignee().getId() : null)
                .assigneeName(e.getAssignee() != null ? e.getAssignee().getName() : null)
                .resolutionNotes(e.getResolutionNotes())
                .imageUrls(e.getImageUrls())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }

    private IncidentDTO.IncidentCommentResponse mapToCommentResponse(IncidentCommentEntity c) {
        return IncidentDTO.IncidentCommentResponse.builder()
                .id(c.getId())
                .incidentId(c.getIncident().getId())
                .authorId(c.getAuthor().getId())
                .authorName(c.getAuthor().getName())
                .authorRole(c.getAuthor().getRole().name())
                .content(c.getContent())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
