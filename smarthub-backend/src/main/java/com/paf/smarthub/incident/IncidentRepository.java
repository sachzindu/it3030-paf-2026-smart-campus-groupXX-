package com.paf.smarthub.incident;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentRepository extends JpaRepository<IncidentEntity, Long> {

    List<IncidentEntity> findByReporterIdOrderByCreatedAtDesc(Long reporterId);

    List<IncidentEntity> findByAssigneeIdOrderByCreatedAtDesc(Long assigneeId);

    List<IncidentEntity> findByStatusOrderByCreatedAtDesc(IncidentEnums.IncidentStatus status);
}
