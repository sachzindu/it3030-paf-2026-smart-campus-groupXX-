package com.paf.smarthub.auth.security;

import com.paf.smarthub.auth.entity.User;
import com.paf.smarthub.auth.repository.UserRepository;
import com.paf.smarthub.shared.enums.AuthProvider;
import com.paf.smarthub.shared.enums.Role;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

/**
 * Handles successful OAuth2 login by generating a JWT token and redirecting
 * the user to the frontend application with the token as a query parameter.
 *
 * Also acts as a safety net: if the user wasn't persisted by CustomOAuth2UserService
 * (e.g., due to transaction timing), this handler will create the user record.
 */
@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(OAuth2LoginSuccessHandler.class);

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final String frontendUrl;
    private final List<String> adminEmails;

    public OAuth2LoginSuccessHandler(
            JwtTokenProvider jwtTokenProvider,
            UserRepository userRepository,
            @Value("${app.frontend.url}") String frontendUrl,
            @Value("${app.admin.emails:}") String adminEmailsConfig) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
        this.frontendUrl = frontendUrl;
        this.adminEmails = adminEmailsConfig.isEmpty()
                ? List.of()
                : Arrays.asList(adminEmailsConfig.split(","));
    }

    @Override
    @Transactional
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        String email = oauth2User.getAttribute("email");

        if (email == null) {
            log.error("Email not found in OAuth2 user attributes");
            getRedirectStrategy().sendRedirect(request, response,
                    frontendUrl + "/login?error=email_not_found");
            return;
        }

        // Look up the user — or create them if not yet persisted
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            // Safety net: create the user record here if CustomOAuth2UserService
            // didn't persist it (transaction timing, schema issues, etc.)
            String name = oauth2User.getAttribute("name");
            String pictureUrl = oauth2User.getAttribute("picture");
            String googleId = oauth2User.getAttribute("sub");

            Role assignedRole = adminEmails.stream()
                    .map(String::trim)
                    .anyMatch(adminEmail -> adminEmail.equalsIgnoreCase(email))
                    ? Role.ADMIN
                    : Role.USER;

            user = User.builder()
                    .email(email)
                    .name(name != null ? name : "Unknown")
                    .profileImageUrl(pictureUrl)
                    .googleId(googleId)
                    .role(assignedRole)
                    .authProvider(AuthProvider.GOOGLE)
                    .enabled(true)
                    .build();

            user = userRepository.save(user);
            log.info("Created user in success handler (fallback): {} with role: {}", email, assignedRole);
        }

        if (!user.isEnabled()) {
            log.warn("Disabled user attempted OAuth2 login: {}", email);
            getRedirectStrategy().sendRedirect(request, response,
                    frontendUrl + "/login?error=account_disabled");
            return;
        }

        // Generate JWT with email and the user's actual role from the DB
        String token = jwtTokenProvider.generateToken(email, user.getRole().name());

        String targetUrl = UriComponentsBuilder
                .fromUriString(frontendUrl + "/oauth2/callback")
                .queryParam("token", token)
                .build()
                .toUriString();

        log.info("OAuth2 login successful for user: {} (role: {}). Redirecting to frontend.",
                email, user.getRole());

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
