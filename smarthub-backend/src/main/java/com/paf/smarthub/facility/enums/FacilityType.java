package com.paf.smarthub.facility.enums;

public enum FacilityType {
    LECTURE_HALL("Lecture Hall"),
    LAB("Laboratory"),
    MEETING_ROOM("Meeting Room"),
    EQUIPMENT("Equipment");

    private final String displayName;

    FacilityType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
