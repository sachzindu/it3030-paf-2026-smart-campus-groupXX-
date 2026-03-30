package com.paf.smarthub.auth.repository;

import com.paf.smarthub.auth.entity.User;
import com.paf.smarthub.shared.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for User entity persistence operations.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByGoogleId(String googleId);

    List<User> findByRole(Role role);

    boolean existsByEmail(String email);

    List<User> findByEnabled(boolean enabled);
}
