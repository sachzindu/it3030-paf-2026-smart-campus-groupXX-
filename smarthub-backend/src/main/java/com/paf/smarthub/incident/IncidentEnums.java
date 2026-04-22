package com.paf.smarthub.incident;

public class IncidentEnums {

    public enum IncidentCategory {
        HARDWARE,
        SOFTWARE,
        FACILITY,
        NETWORKING,
        OTHER
    }

    public enum IncidentPriority {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    /**
     * OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED
     * Admin/Technician can reject.
     */
    public enum IncidentStatus {
        OPEN,
        IN_PROGRESS,
        RESOLVED,
        CLOSED,
        REJECTED
    }
}
