package com.paf.smarthub.auth.dto;

import com.paf.smarthub.shared.enums.Role;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for an admin to update a user's name and/or role.
 * All fields are optional — only non-null fields are applied.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminUpdateUserRequest {

    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    private Role role;
}
