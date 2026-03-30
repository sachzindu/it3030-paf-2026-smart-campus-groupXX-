package com.paf.smarthub.auth.dto;

import com.paf.smarthub.shared.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data transfer object for user profile information.
 * Used in API responses to avoid exposing internal entity details.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {

    private Long id;
    private String email;
    private String name;
    private String profileImageUrl;
    private Role role;
    private boolean enabled;
}
