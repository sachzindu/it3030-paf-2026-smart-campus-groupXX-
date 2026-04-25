package com.paf.smarthub.incident;

import com.paf.smarthub.auth.entity.User;
import com.paf.smarthub.shared.entity.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * Comments on Incident tickets.
 */
@Entity
@Table(name = "incident_comments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IncidentCommentEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id", nullable = false)
    private IncidentEntity incident;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

}
