package com.paf.smarthub.auth.controller;

import com.paf.smarthub.auth.dto.*;
import com.paf.smarthub.auth.service.UserService;
import com.paf.smarthub.shared.dto.ApiResponse;
import com.paf.smarthub.shared.enums.Role;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for authentication and user management endpoints.
 *
 * Public:
 *   - POST /api/auth/signup  — register a new USER account
 *   - POST /api/auth/login   — authenticate any role
 *   - OAuth2 login flow is handled by Spring Security filter chain
 *
 * Authenticated:
 *   - GET /api/auth/me — get current user profile
 *
 * Admin only:
 *   - GET /api/auth/users — list all users
 *   - GET /api/auth/users/{id} — get user by ID
 *   - PUT /api/auth/users/{id}/role — update user role
 *   - GET /api/auth/users/role/{role} — get users by role
 *   - PUT /api/auth/users/{id}/disable — disable user
 *   - PUT /api/auth/users/{id}/enable — enable user
 *   - DELETE /api/auth/users/{id} — delete user
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    // ==================== Public Endpoints ====================

    /**
     * Register a new user account (USER role only).
     */
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<AuthResponse>> signup(@Valid @RequestBody SignupRequest request) {
        AuthResponse authResponse = userService.registerUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Account created successfully", authResponse));
    }

    /**
     * Authenticate a user with email/password.
     * Works for all roles (USER, ADMIN, TECHNICIAN).
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse authResponse = userService.authenticateUser(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
    }

    // ==================== Authenticated User Endpoints ====================

    /**
     * Get the currently authenticated user's profile.
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        UserDTO user = userService.getCurrentUser(email);
        return ResponseEntity.ok(ApiResponse.success("User profile retrieved successfully", user));
    }

    // ==================== Admin Endpoints ====================

    /**
     * Get all users in the system.
     */
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getAllUsers() {
        List<UserDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully", users));
    }

    /**
     * Create a new user account with a specific role (ADMIN only).
     * Used for adding technicians and users to the system.
     */
    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> createUser(
            @Valid @RequestBody AdminCreateUserRequest request,
            Authentication authentication) {
        String adminEmail = authentication.getName();
        UserDTO createdUser = userService.adminCreateUser(request, adminEmail);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User created successfully", createdUser));
    }

    /**
     * Update a user's name and/or role (ADMIN only).
     */
    @PutMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody AdminUpdateUserRequest request,
            Authentication authentication) {
        String adminEmail = authentication.getName();
        UserDTO updatedUser = userService.adminUpdateUser(id, request, adminEmail);
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", updatedUser));
    }

    /**
     * Get a specific user by ID.
     */
    @GetMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> getUserById(@PathVariable Long id) {
        UserDTO user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success("User retrieved successfully", user));
    }

    /**
     * Get all users with a specific role.
     * Useful for listing available technicians when assigning to incident tickets.
     */
    @GetMapping("/users/role/{role}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getUsersByRole(@PathVariable Role role) {
        List<UserDTO> users = userService.getUsersByRole(role);
        return ResponseEntity.ok(
                ApiResponse.success("Users with role " + role + " retrieved successfully", users));
    }

    /**
     * Update a user's role.
     */
    @PutMapping("/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody RoleUpdateRequest request,
            Authentication authentication) {
        String adminEmail = authentication.getName();
        UserDTO updatedUser = userService.updateUserRole(id, request.getRole(), adminEmail);
        return ResponseEntity.ok(
                ApiResponse.success("User role updated successfully", updatedUser));
    }

    /**
     * Disable a user account.
     */
    @PutMapping("/users/{id}/disable")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> disableUser(
            @PathVariable Long id,
            Authentication authentication) {
        String adminEmail = authentication.getName();
        UserDTO disabledUser = userService.disableUser(id, adminEmail);
        return ResponseEntity.ok(
                ApiResponse.success("User account disabled successfully", disabledUser));
    }

    /**
     * Enable a previously disabled user account.
     */
    @PutMapping("/users/{id}/enable")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> enableUser(@PathVariable Long id) {
        UserDTO enabledUser = userService.enableUser(id);
        return ResponseEntity.ok(
                ApiResponse.success("User account enabled successfully", enabledUser));
    }

    /**
     * Permanently delete a user account.
     */
    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable Long id,
            Authentication authentication) {
        String adminEmail = authentication.getName();
        userService.deleteUser(id, adminEmail);
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully"));
    }
}
