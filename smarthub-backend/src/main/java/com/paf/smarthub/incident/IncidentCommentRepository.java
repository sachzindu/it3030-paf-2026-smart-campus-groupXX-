package com.paf.smarthub.incident;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentCommentRepository extends JpaRepository<IncidentCommentEntity, Long> {

    List<IncidentCommentEntity> findByIncidentIdOrderByCreatedAtAsc(Long incidentId);
}
