package com.paf.smarthub.auth.entity;

import com.paf.smarthub.shared.entity.AuditableEntity;
import com.paf.smarthub.shared.enums.AuthProvider;
import com.paf.smarthub.shared.enums.Role;
import jakarta.persistence.*;
import lombok.*;

/**
 * Represents an authenticated user in the system.
 * Users can be created via OAuth2 Google login or email/password signup.
 */
@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_user_email", columnList = "email", unique = true),
        @Index(name = "idx_user_google_id", columnList = "google_id", unique = true),
        @Index(name = "idx_user_role", columnList = "role")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(nullable = false, length = 255)
    private String name;

    /**
     * BCrypt-hashed password. Null for OAuth2-only users.
     */
    @Column(length = 255)
    private String password;

    @Column(name = "profile_image_url", length = 512)
    private String profileImageUrl;

    @Column(name = "google_id", unique = true, length = 255)
    private String googleId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Role role = Role.USER;

    /**
     * How this user account was created.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider", length = 10)
    @Builder.Default
    private AuthProvider authProvider = AuthProvider.LOCAL;

    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = true;
}
