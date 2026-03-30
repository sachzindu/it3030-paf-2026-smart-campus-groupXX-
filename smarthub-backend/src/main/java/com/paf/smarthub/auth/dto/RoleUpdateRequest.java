package com.paf.smarthub.auth.dto;

import com.paf.smarthub.shared.enums.Role;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating a user's role.
 * Used by admin endpoints.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleUpdateRequest {

    @NotNull(message = "Role is required")
    private Role role;
}
