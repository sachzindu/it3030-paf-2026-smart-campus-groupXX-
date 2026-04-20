package com.paf.smarthub.facility.enums;

public enum FacilityStatus {
    ACTIVE("Active"),
    OUT_OF_SERVICE("Out of Service"),
    MAINTENANCE("Maintenance");

    private final String displayName;

    FacilityStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
