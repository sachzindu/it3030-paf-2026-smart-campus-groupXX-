package com.paf.smarthub.auth.service;

import com.paf.smarthub.auth.dto.*;
import com.paf.smarthub.auth.entity.User;
import com.paf.smarthub.auth.repository.UserRepository;
import com.paf.smarthub.auth.security.JwtTokenProvider;
import com.paf.smarthub.shared.enums.AuthProvider;
import com.paf.smarthub.shared.enums.Role;
import com.paf.smarthub.shared.exception.AccessDeniedException;
import com.paf.smarthub.shared.exception.DuplicateResourceException;
import com.paf.smarthub.shared.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service layer for user management operations.
 * Handles registration, authentication, profile retrieval, role updates, and account management.
 */
@Service
@Transactional
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final List<String> adminEmails;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider,
                       @Value("${app.admin.emails:}") String adminEmailsConfig) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.adminEmails = adminEmailsConfig.isEmpty()
                ? List.of()
                : Arrays.asList(adminEmailsConfig.split(","));
    }

    // ==================== Registration & Authentication ====================

    /**
     * Register a new user with email/password.
     * Checks if email is in admin emails list; if so, assigns ADMIN role.
     * Otherwise assigns the USER role.
     *
     * @param request the signup request containing name, email, password
     * @return AuthResponse with JWT token and user profile
     */
    public AuthResponse registerUser(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("User", "email", request.getEmail());
        }

        String normalizedEmail = request.getEmail().toLowerCase().trim();
        Role assignedRole = isAdminEmail(normalizedEmail) ? Role.ADMIN : Role.USER;

        User user = User.builder()
                .name(request.getName())
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(assignedRole)
                .authProvider(AuthProvider.LOCAL)
                .enabled(true)
                .build();

        User savedUser = userRepository.save(user);
        log.info("New user registered: {} (role: {})", savedUser.getEmail(), assignedRole);

        String token = jwtTokenProvider.generateToken(savedUser.getEmail(), savedUser.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getExpirationMs())
                .user(mapToDTO(savedUser))
                .build();
    }

    /**
     * Authenticate a user with email/password.
     * Works for all roles (USER, ADMIN, TECHNICIAN).
     *
     * @param request the login request containing email and password
     * @return AuthResponse with JWT token and user profile
     */
    public AuthResponse authenticateUser(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));

        // Verify the user has a password (not an OAuth2-only account)
        if (user.getPassword() == null || user.getPassword().isBlank()) {
            throw new AccessDeniedException(
                    "This account was created with Google sign-in. Please use Google to log in.");
        }

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new AccessDeniedException("Invalid email or password.");
        }

        // Verify account is enabled
        if (!user.isEnabled()) {
            throw new AccessDeniedException("Your account has been disabled. Please contact an administrator.");
        }

        String token = jwtTokenProvider.generateToken(user.getEmail(), user.getRole().name());
        log.info("User authenticated: {} (role: {})", user.getEmail(), user.getRole());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getExpirationMs())
                .user(mapToDTO(user))
                .build();
    }

  
    @Transactional(readOnly = true)
    public UserDTO getCurrentUser(String email) {
        User user = findUserByEmail(email);
        return mapToDTO(user);
    }

 
    @Transactional(readOnly = true)
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

  
    @Transactional(readOnly = true)
    public UserDTO getUserById(Long userId) {
        User user = findUserById(userId);
        return mapToDTO(user);
    }


    @Transactional(readOnly = true)
    public List<UserDTO> getUsersByRole(Role role) {
        return userRepository.findByRole(role)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ==================== Admin Operations ====================

    /**
     * Create a new user account with a specific role (admin only).
     * Used for adding technicians and users to the system.
     *
     * @param request      the admin create request containing name, email, password, role
     * @param currentEmail the admin performing the action
     * @return the created user DTO
     */
    public UserDTO adminCreateUser(AdminCreateUserRequest request, String currentEmail) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase().trim())) {
            throw new DuplicateResourceException("User", "email", request.getEmail());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail().toLowerCase().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .authProvider(AuthProvider.LOCAL)
                .enabled(true)
                .build();

        User savedUser = userRepository.save(user);
        log.info("Admin created user: {} with role: {} (by {})",
                savedUser.getEmail(), savedUser.getRole(), currentEmail);

        return mapToDTO(savedUser);
    }

    /**
     * Update a user's name and/or role (admin only).
     * Only non-null fields in the request are applied.
     * Prevents admins from demoting themselves.
     *
     * @param userId       the target user's ID
     * @param request      the update request containing optional name and role
     * @param currentEmail the admin performing the action
     * @return the updated user DTO
     */
    public UserDTO adminUpdateUser(Long userId, AdminUpdateUserRequest request, String currentEmail) {
        User targetUser = findUserById(userId);

        // Prevent self-demotion
        if (request.getRole() != null
                && targetUser.getEmail().equalsIgnoreCase(currentEmail)
                && request.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("You cannot change your own role. " +
                    "Another admin must perform this action.");
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            targetUser.setName(request.getName());
        }
        if (request.getRole() != null) {
            targetUser.setRole(request.getRole());
        }

        User savedUser = userRepository.save(targetUser);
        log.info("Admin updated user: {} (by {})", targetUser.getEmail(), currentEmail);

        return mapToDTO(savedUser);
    }

    /**
     * Update a user's role (admin only).
     * Prevents admins from demoting themselves.
     *
     * @param userId       the target user's ID
     * @param newRole      the new role to assign
     * @param currentEmail the admin performing the action (for self-demotion prevention)
     * @return the updated user DTO
     */
    public UserDTO updateUserRole(Long userId, Role newRole, String currentEmail) {
        User targetUser = findUserById(userId);

        // Prevent self-demotion
        if (targetUser.getEmail().equalsIgnoreCase(currentEmail) && newRole != Role.ADMIN) {
            throw new AccessDeniedException("You cannot change your own role. " +
                    "Another admin must perform this action.");
        }

        Role previousRole = targetUser.getRole();
        targetUser.setRole(newRole);
        User savedUser = userRepository.save(targetUser);

        log.info("User role updated: {} from {} to {} (by {})",
                targetUser.getEmail(), previousRole, newRole, currentEmail);

        return mapToDTO(savedUser);
    }

    /**
     * Disable a user account (admin only).
     * Prevents admins from disabling themselves.
     *
     * @param userId       the target user's ID
     * @param currentEmail the admin performing the action
     * @return the updated user DTO
     */
    public UserDTO disableUser(Long userId, String currentEmail) {
        User targetUser = findUserById(userId);

        if (targetUser.getEmail().equalsIgnoreCase(currentEmail)) {
            throw new AccessDeniedException("You cannot disable your own account.");
        }

        targetUser.setEnabled(false);
        User savedUser = userRepository.save(targetUser);

        log.info("User disabled: {} (by {})", targetUser.getEmail(), currentEmail);

        return mapToDTO(savedUser);
    }

   
    public UserDTO enableUser(Long userId) {
        User targetUser = findUserById(userId);
        targetUser.setEnabled(true);
        User savedUser = userRepository.save(targetUser);

        log.info("User enabled: {}", targetUser.getEmail());

        return mapToDTO(savedUser);
    }

    /**
     * Delete a user account permanently (admin only).
     * Prevents admins from deleting themselves.
     *
     * @param userId       the target user's ID
     * @param currentEmail the admin performing the action
     */
    public void deleteUser(Long userId, String currentEmail) {
        User targetUser = findUserById(userId);

        if (targetUser.getEmail().equalsIgnoreCase(currentEmail)) {
            throw new AccessDeniedException("You cannot delete your own account.");
        }

        userRepository.delete(targetUser);
        log.info("User deleted: {} (by {})", targetUser.getEmail(), currentEmail);
    }

    // ==================== Helper Methods ====================

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    private User findUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    /**
     * Check if an email is in the admin emails list.
     */
    private boolean isAdminEmail(String email) {
        return adminEmails.stream()
                .anyMatch(adminEmail -> adminEmail.trim().equalsIgnoreCase(email));
    }

    /**
     * Maps a User entity to a UserDTO.
     * This method is package-private so it can be reused by other services in the auth package.
     */
    UserDTO mapToDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .profileImageUrl(user.getProfileImageUrl())
                .role(user.getRole())
                .enabled(user.isEnabled())
                .build();
    }
}
