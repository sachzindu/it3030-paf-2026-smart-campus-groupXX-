package com.paf.smarthub.notification;

import com.paf.smarthub.incident.IncidentEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
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
		String body = buildEmailLayout(
				"Incident Assigned",
				buildHeaderHtml(incident)
						+ buildKeyValueRow("Assigned To", assigneeName)
						+ buildKeyValueRow("Current Status", incident.getStatus().name())
						+ buildDivider()
						+ buildActionLink("View Incident", incidentLink(incident.getId()))
		);

		sendHtmlEmail(incident.getReporter().getEmail(), subject, body);
	}

	public void sendIncidentStatusEmail(IncidentEntity incident) {
		if (incident.getReporter() == null || incident.getReporter().getEmail() == null) return;

		String subject = appName + " - Incident Status Updated (#" + incident.getId() + ")";
		String responseNotes = incident.getResolutionNotes() != null ? incident.getResolutionNotes().trim() : "";
		String body = buildEmailLayout(
				"Incident Status Updated",
				buildHeaderHtml(incident)
						+ buildKeyValueRow("New Status", incident.getStatus().name())
						+ (responseNotes.isBlank() ? "" : buildKeyValueRow("Admin Response", responseNotes))
						+ buildDivider()
						+ buildActionLink("Track Incident", incidentLink(incident.getId()))
		);

		sendHtmlEmail(incident.getReporter().getEmail(), subject, body);
	}

	public void sendIncidentPriorityEmail(IncidentEntity incident) {
		if (incident.getReporter() == null || incident.getReporter().getEmail() == null) return;

		String subject = appName + " - Incident Priority Updated (#" + incident.getId() + ")";
		String body = buildEmailLayout(
				"Incident Priority Updated",
				buildHeaderHtml(incident)
						+ buildKeyValueRow("New Priority", incident.getPriority().name())
						+ buildKeyValueRow("Current Status", incident.getStatus().name())
						+ buildDivider()
						+ buildActionLink("Track Incident", incidentLink(incident.getId()))
		);

		sendHtmlEmail(incident.getReporter().getEmail(), subject, body);
	}

	public void sendIncidentAdminCommentEmail(IncidentEntity incident, String comment) {
		if (incident.getReporter() == null || incident.getReporter().getEmail() == null) return;

		String subject = appName + " - Admin Response (#" + incident.getId() + ")";
		String body = buildEmailLayout(
				"Admin Response",
				buildHeaderHtml(incident)
						+ buildKeyValueRow("Admin Response", comment.trim())
						+ buildDivider()
						+ buildActionLink("Track Incident", incidentLink(incident.getId()))
		);

		sendHtmlEmail(incident.getReporter().getEmail(), subject, body);
	}

	private String buildHeaderHtml(IncidentEntity incident) {
		return ""
				+ "<table style=\"width:100%;border-collapse:collapse;margin:0 0 12px;\">"
				+ buildKeyValueRow("Incident ID", "#" + incident.getId())
				+ buildKeyValueRow("Title", incident.getTitle())
				+ buildKeyValueRow("Category", incident.getCategory().name())
				+ buildKeyValueRow("Location", incident.getLocation())
				+ buildKeyValueRow("Priority", incident.getPriority().name())
				+ "</table>";
	}

	private String buildKeyValueRow(String label, String value) {
		return ""
				+ "<tr>"
				+ "<td style=\"padding:6px 0;color:#6b7280;font-size:13px;width:140px;\">" + escapeHtml(label) + "</td>"
				+ "<td style=\"padding:6px 0;color:#111827;font-size:14px;font-weight:600;\">" + escapeHtml(value) + "</td>"
				+ "</tr>";
	}

	private String buildDivider() {
		return "<div style=\"height:1px;background:#e5e7eb;margin:16px 0;\"></div>";
	}

	private String buildActionLink(String label, String url) {
		return ""
				+ "<a href=\"" + escapeHtml(url) + "\" "
				+ "style=\"display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;"
				+ "padding:10px 16px;border-radius:10px;font-size:14px;font-weight:600;\">"
				+ escapeHtml(label) + "</a>";
	}

	private String buildEmailLayout(String title, String content) {
		return ""
				+ "<div style=\"font-family:Arial,Helvetica,sans-serif;background:#f3f4f6;padding:24px;\">"
				+ "  <div style=\"max-width:680px;margin:0 auto;background:#ffffff;border-radius:16px;"
				+ "box-shadow:0 12px 30px rgba(15,23,42,0.08);overflow:hidden;border:1px solid #e5e7eb;\">"
				+ "    <div style=\"background:linear-gradient(135deg,#1d4ed8,#2563eb);padding:20px 24px;\">"
				+ "      <div style=\"color:#ffffff;font-size:18px;font-weight:700;\">" + escapeHtml(appName) + "</div>"
				+ "      <div style=\"color:#dbeafe;font-size:14px;margin-top:4px;\">" + escapeHtml(title) + "</div>"
				+ "    </div>"
				+ "    <div style=\"padding:24px;color:#111827;\">"
				+ content
				+ "      <p style=\"margin:18px 0 0;color:#6b7280;font-size:12px;\">"
				+ "If you did not request this, please ignore this email.</p>"
				+ "    </div>"
				+ "  </div>"
				+ "</div>";
	}

	private String incidentLink(Long id) {
		return frontendUrl + "/incidents/" + id;
	}

	private void sendHtmlEmail(String to, String subject, String htmlBody) {
		try {
			MimeMessage mimeMessage = mailSender.createMimeMessage();
			MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");
			helper.setFrom(fromAddress);
			helper.setTo(to);
			helper.setSubject(subject);
			helper.setText(htmlBody, true);
			mailSender.send(mimeMessage);
		} catch (MessagingException ex) {
			log.warn("Failed to send incident email to {}: {}", to, ex.getMessage());
		}
	}

	private String escapeHtml(String value) {
		if (value == null) return "";
		return value.replace("&", "&amp;")
				.replace("<", "&lt;")
				.replace(">", "&gt;")
				.replace("\"", "&quot;")
				.replace("'", "&#39;");
	}
}
