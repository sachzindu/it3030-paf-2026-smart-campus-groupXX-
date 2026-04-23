package com.paf.smarthub.notification;

import com.paf.smarthub.incident.IncidentEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

	private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

	private final JavaMailSender mailSender;

	@Value("${app.mail.from}")
	private String fromAddress;

	@Value("${app.name:SmartHub}")
	private String appName;

	@Value("${app.frontend.url:http://localhost:5173}")
	private String frontendUrl;

	public NotificationService(JavaMailSender mailSender) {
		this.mailSender = mailSender;
	}

	public void sendIncidentAssignedEmail(IncidentEntity incident) {
		if (incident.getReporter() == null || incident.getReporter().getEmail() == null) return;

		String assigneeName = incident.getAssignee() != null ? incident.getAssignee().getName() : "Unassigned";
		String subject = appName + " - Incident Assigned (#" + incident.getId() + ")";
		String body = buildHeader(incident)
				+ "Assigned To: " + assigneeName + "\n"
				+ "Current Status: " + incident.getStatus() + "\n\n"
				+ "You can track updates here: " + incidentLink(incident.getId()) + "\n";

		sendEmail(incident.getReporter().getEmail(), subject, body);
	}

	public void sendIncidentStatusEmail(IncidentEntity incident) {
		if (incident.getReporter() == null || incident.getReporter().getEmail() == null) return;

		String subject = appName + " - Incident Status Updated (#" + incident.getId() + ")";
		String body = buildHeader(incident)
				+ "New Status: " + incident.getStatus() + "\n"
				+ (incident.getResolutionNotes() != null && !incident.getResolutionNotes().isBlank()
				? "Admin Response: " + incident.getResolutionNotes().trim() + "\n"
				: "")
				+ "\nTrack the incident here: " + incidentLink(incident.getId()) + "\n";

		sendEmail(incident.getReporter().getEmail(), subject, body);
	}

	public void sendIncidentPriorityEmail(IncidentEntity incident) {
		if (incident.getReporter() == null || incident.getReporter().getEmail() == null) return;

		String subject = appName + " - Incident Priority Updated (#" + incident.getId() + ")";
		String body = buildHeader(incident)
				+ "New Priority: " + incident.getPriority() + "\n"
				+ "Current Status: " + incident.getStatus() + "\n\n"
				+ "Track the incident here: " + incidentLink(incident.getId()) + "\n";

		sendEmail(incident.getReporter().getEmail(), subject, body);
	}

	public void sendIncidentAdminCommentEmail(IncidentEntity incident, String comment) {
		if (incident.getReporter() == null || incident.getReporter().getEmail() == null) return;

		String subject = appName + " - Admin Response (#" + incident.getId() + ")";
		String body = buildHeader(incident)
				+ "Admin Response: " + comment.trim() + "\n\n"
				+ "Track the incident here: " + incidentLink(incident.getId()) + "\n";

		sendEmail(incident.getReporter().getEmail(), subject, body);
	}

	private String buildHeader(IncidentEntity incident) {
		return "Incident: #" + incident.getId() + "\n"
				+ "Title: " + incident.getTitle() + "\n"
				+ "Category: " + incident.getCategory() + "\n"
				+ "Location: " + incident.getLocation() + "\n"
				+ "Priority: " + incident.getPriority() + "\n\n";
	}

	private String incidentLink(Long id) {
		return frontendUrl + "/incidents/" + id;
	}

	private void sendEmail(String to, String subject, String body) {
		try {
			SimpleMailMessage message = new SimpleMailMessage();
			message.setFrom(fromAddress);
			message.setTo(to);
			message.setSubject(subject);
			message.setText(body);
			mailSender.send(message);
		} catch (Exception ex) {
			log.warn("Failed to send incident email to {}: {}", to, ex.getMessage());
		}
	}
}
