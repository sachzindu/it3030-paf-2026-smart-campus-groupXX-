package com.paf.smarthub.shared.enums;

/**
 * Application-wide roles for role-based access control.
 * USER: default role for all authenticated users
 * ADMIN: can manage resources, approve/reject bookings, manage tickets & users
 * TECHNICIAN: can be assigned to incident tickets and update resolutions
 */
public enum Role {
    USER,
    ADMIN,
    TECHNICIAN
}
