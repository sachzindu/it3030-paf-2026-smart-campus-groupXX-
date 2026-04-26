package com.paf.smarthub.shared.config;

import com.paf.smarthub.auth.entity.User;
import com.paf.smarthub.auth.repository.UserRepository;
import com.paf.smarthub.facility.FacilityEntity;
import com.paf.smarthub.facility.FacilityEnums;
import com.paf.smarthub.facility.FacilityRepository;
import com.paf.smarthub.shared.enums.AuthProvider;
import com.paf.smarthub.shared.enums.Role;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalTime;

/**
 * Initializes test data on application startup.
 * This runs after Spring context is fully initialized, ensuring PasswordEncoder is available.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final FacilityRepository facilityRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, FacilityRepository facilityRepository,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.facilityRepository = facilityRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        initializeTestUsers();
        initializeTestFacilities();
    }

    private void initializeTestUsers() {
        // Create John Student (USER role)
        if (userRepository.findByEmail("john.student@example.com").isEmpty()) {
            User johnStudent = new User();
            johnStudent.setName("John Student");
            johnStudent.setEmail("john.student@example.com");
            johnStudent.setPassword(passwordEncoder.encode("student123"));
            johnStudent.setRole(Role.USER);
            johnStudent.setAuthProvider(AuthProvider.LOCAL);
            johnStudent.setEnabled(true);
            userRepository.save(johnStudent);
            System.out.println("✓ Created test user: john.student@example.com");
        }

        // Create Sarah Johnson (ADMIN role)
        if (userRepository.findByEmail("sarah.johnson.2026@example.com").isEmpty()) {
            User sarahAdmin = new User();
            sarahAdmin.setName("Sarah Johnson");
            sarahAdmin.setEmail("sarah.johnson.2026@example.com");
            sarahAdmin.setPassword(passwordEncoder.encode("admin123"));
            sarahAdmin.setRole(Role.ADMIN);
            sarahAdmin.setAuthProvider(AuthProvider.LOCAL);
            sarahAdmin.setEnabled(true);
            userRepository.save(sarahAdmin);
            System.out.println("✓ Created test user: sarah.johnson.2026@example.com");
        }
    }

    private void initializeTestFacilities() {
        // Main Auditorium
        if (facilityRepository.findByName("Main Auditorium").isEmpty()) {
            FacilityEntity auditorium = new FacilityEntity();
            auditorium.setName("Main Auditorium");
            auditorium.setDescription("Large auditorium for conferences and presentations");
            auditorium.setLocation("Building A, Ground Floor");
            auditorium.setFacilityType(FacilityEnums.FacilityType.AUDITORIUM);
            auditorium.setStatus(FacilityEnums.FacilityStatus.ACTIVE);
            auditorium.setCapacity(500);
            auditorium.setAvailableFrom(LocalTime.of(8, 0));
            auditorium.setAvailableTo(LocalTime.of(18, 0));
            facilityRepository.save(auditorium);
            System.out.println("✓ Created facility: Main Auditorium");
        }

        // Computer Lab 1
        if (facilityRepository.findByName("Computer Lab 1").isEmpty()) {
            FacilityEntity lab = new FacilityEntity();
            lab.setName("Computer Lab 1");
            lab.setDescription("Equipped with latest laptops and software for coding");
            lab.setLocation("Building B, 2nd Floor");
            lab.setFacilityType(FacilityEnums.FacilityType.LAB);
            lab.setStatus(FacilityEnums.FacilityStatus.ACTIVE);
            lab.setCapacity(30);
            lab.setAvailableFrom(LocalTime.of(8, 0));
            lab.setAvailableTo(LocalTime.of(17, 0));
            facilityRepository.save(lab);
            System.out.println("✓ Created facility: Computer Lab 1");
        }

        // Meeting Room A
        if (facilityRepository.findByName("Meeting Room A").isEmpty()) {
            FacilityEntity meetingRoom = new FacilityEntity();
            meetingRoom.setName("Meeting Room A");
            meetingRoom.setDescription("Equipped with projector and conference phone");
            meetingRoom.setLocation("Building A, 1st Floor");
            meetingRoom.setFacilityType(FacilityEnums.FacilityType.MEETING_ROOM);
            meetingRoom.setStatus(FacilityEnums.FacilityStatus.ACTIVE);
            meetingRoom.setCapacity(15);
            meetingRoom.setAvailableFrom(LocalTime.of(8, 0));
            meetingRoom.setAvailableTo(LocalTime.of(18, 0));
            facilityRepository.save(meetingRoom);
            System.out.println("✓ Created facility: Meeting Room A");
        }

        // Projector Cart
        if (facilityRepository.findByName("Projector Cart").isEmpty()) {
            FacilityEntity projector = new FacilityEntity();
            projector.setName("Projector Cart");
            projector.setDescription("Portable projector with mounting equipment");
            projector.setLocation("Tech Store");
            projector.setFacilityType(FacilityEnums.FacilityType.EQUIPMENT);
            projector.setStatus(FacilityEnums.FacilityStatus.ACTIVE);
            projector.setCapacity(1);
            projector.setAssetType(FacilityEnums.AssetType.PROJECTOR);
            facilityRepository.save(projector);
            System.out.println("✓ Created facility: Projector Cart");
        }

        // Lecture Hall 101
        if (facilityRepository.findByName("Lecture Hall 101").isEmpty()) {
            FacilityEntity lectureHall = new FacilityEntity();
            lectureHall.setName("Lecture Hall 101");
            lectureHall.setDescription("Standard classroom with projector and whiteboard");
            lectureHall.setLocation("Building C, 1st Floor");
            lectureHall.setFacilityType(FacilityEnums.FacilityType.LECTURE_HALL);
            lectureHall.setStatus(FacilityEnums.FacilityStatus.ACTIVE);
            lectureHall.setCapacity(60);
            lectureHall.setAvailableFrom(LocalTime.of(8, 0));
            lectureHall.setAvailableTo(LocalTime.of(18, 0));
            facilityRepository.save(lectureHall);
            System.out.println("✓ Created facility: Lecture Hall 101");
        }
    }
}

