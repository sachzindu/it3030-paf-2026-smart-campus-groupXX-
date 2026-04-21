package com.paf.smarthub.auth.security;

import com.paf.smarthub.auth.entity.User;
import com.paf.smarthub.auth.repository.UserRepository;
import com.paf.smarthub.shared.enums.AuthProvider;
import com.paf.smarthub.shared.enums.Role;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/**
 * Custom OAuth2 user service that creates or updates user records
 * in the database after successful Google authentication.
 *
 * New users receive Role.USER by default, unless their email matches
 * a configured admin email in app.admin.emails.
 */
@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private static final Logger log = LoggerFactory.getLogger(CustomOAuth2UserService.class);

    private final UserRepository userRepository;
    private final List<String> adminEmails;

    public CustomOAuth2UserService(
            UserRepository userRepository,
            @Value("${app.admin.emails:}") String adminEmailsConfig) {
        this.userRepository = userRepository;
        this.adminEmails = adminEmailsConfig.isEmpty()
                ? List.of()
                : Arrays.asList(adminEmailsConfig.split(","));
    }

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);

        String email = oauth2User.getAttribute("email");
        String name = oauth2User.getAttribute("name");
        String pictureUrl = oauth2User.getAttribute("picture");
        String googleId = oauth2User.getAttribute("sub");

        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationException("Email not found from OAuth2 provider");
        }

        Optional<User> existingUser = userRepository.findByEmail(email);

        if (existingUser.isPresent()) {
            // Update existing user profile from Google (name and picture may change)
            User user = existingUser.get();
            user.setName(name != null ? name : user.getName());
            user.setProfileImageUrl(pictureUrl != null ? pictureUrl : user.getProfileImageUrl());
            user.setGoogleId(googleId);
            userRepository.save(user);
            log.info("Updated existing user: {} (role: {})", email, user.getRole());
        } else {
            // Create new user
            Role assignedRole = adminEmails.stream()
                    .map(String::trim)
                    .anyMatch(adminEmail -> adminEmail.equalsIgnoreCase(email))
                    ? Role.ADMIN
                    : Role.USER;

            User newUser = User.builder()
                    .email(email)
                    .name(name != null ? name : "Unknown")
                    .profileImageUrl(pictureUrl)
                    .googleId(googleId)
                    .role(assignedRole)
                    .authProvider(AuthProvider.GOOGLE)
                    .enabled(true)
                    .build();

            userRepository.save(newUser);
            log.info("Created new user: {} with role: {}", email, assignedRole);
        }

        return oauth2User;
    }
}
