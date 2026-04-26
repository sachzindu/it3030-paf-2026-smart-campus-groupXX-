package com.paf.smarthub.incident;

import com.paf.smarthub.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    private final IncidentService incidentService;

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    // ============================================
    // TICKETS - CREATE & READ
    // ============================================

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<IncidentDTO.IncidentResponse>> createIncident(
            @Valid @ModelAttribute IncidentDTO.CreateIncidentRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            Authentication auth) {
        
        IncidentDTO.IncidentResponse response = incidentService.createIncident(request, images, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Incident reported successfully", response));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<IncidentDTO.IncidentResponse>>> getMyIncidents(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Your incidents", incidentService.getMyIncidents(auth.getName())));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<ApiResponse<List<IncidentDTO.IncidentResponse>>> getAllIncidents(
            @RequestParam(required = false) IncidentEnums.IncidentStatus status) {
        return ResponseEntity.ok(ApiResponse.success("All incidents", incidentService.getAllIncidents(status)));
    }

    @GetMapping("/assigned")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<IncidentDTO.IncidentResponse>>> getAssignedIncidents(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Assigned incidents", incidentService.getAssignedIncidents(auth.getName())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<IncidentDTO.IncidentResponse>> getIncidentById(@PathVariable Long id, Authentication auth) {
        IncidentDTO.IncidentResponse response = incidentService.getIncidentById(id, auth.getName(), extractRole(auth));
        return ResponseEntity.ok(ApiResponse.success("Incident retrieved", response));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<IncidentDTO.IncidentResponse>> updateIncident(
            @PathVariable Long id,
            @Valid @ModelAttribute IncidentDTO.UpdateIncidentRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                "Incident updated successfully",
                incidentService.updateIncident(id, request, images, auth.getName())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteIncident(@PathVariable Long id, Authentication auth) {
        incidentService.deleteIncident(id, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Incident deleted successfully"));
    }


    // ============================================
    // TICKETS - UPDATE
    // ============================================

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<IncidentDTO.IncidentResponse>> assignTechnician(
            @PathVariable Long id,
            @Valid @RequestBody IncidentDTO.AssignTechnicianRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Technician assigned", incidentService.assignTechnician(id, request)));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<ApiResponse<IncidentDTO.IncidentResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody IncidentDTO.UpdateStatusRequest request,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Status updated", incidentService.updateStatus(id, request, auth.getName(), extractRole(auth))));
    }

    @PutMapping("/{id}/priority")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<IncidentDTO.IncidentResponse>> updatePriority(
            @PathVariable Long id,
            @Valid @RequestBody IncidentDTO.UpdatePriorityRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Priority updated", incidentService.updatePriority(id, request)));
    }


    // ============================================
    // COMMENTS
    // ============================================

    @GetMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<List<IncidentDTO.IncidentCommentResponse>>> getComments(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Comments retrieved", incidentService.getComments(id, auth.getName(), extractRole(auth))));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<IncidentDTO.IncidentCommentResponse>> addComment(
            @PathVariable Long id,
            @Valid @RequestBody IncidentDTO.AddCommentRequest request,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Comment added", incidentService.addComment(id, request, auth.getName())));
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(@PathVariable Long commentId, Authentication auth) {
        incidentService.deleteComment(commentId, auth.getName(), extractRole(auth));
        return ResponseEntity.ok(ApiResponse.success("Comment deleted"));
    }

    // ============================================
    // HELPERS
    // ============================================

    private String extractRole(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a != null && a.startsWith("ROLE_"))
                .map(a -> a.substring(5))
                .findFirst()
                .orElse("USER");
    }
}
