package com.paf.smarthub.facility;

/**
 * Enumerations for the Facilities & Assets Catalogue module.
 */
public class FacilityEnums {

    /**
     * Type classification for bookable resources.
     * Rooms/halls have capacity; equipment items have an AssetType.
     */
    public enum FacilityType {
        LECTURE_HALL,
        LAB,
        MEETING_ROOM,
        AUDITORIUM,
        EQUIPMENT
    }

    /**
     * Operational status of a facility/asset.
     * OUT_OF_SERVICE resources cannot be booked.
     */
    public enum FacilityStatus {
        ACTIVE,
        OUT_OF_SERVICE
    }

    /**
     * Sub-type for equipment-category resources.
     * Only applicable when FacilityType is EQUIPMENT.
     */
    public enum AssetType {
        PROJECTOR,
        CAMERA,
        MICROPHONE,
        WHITEBOARD,
        LAPTOP,
        PRINTER,
        OTHER
    }
}
