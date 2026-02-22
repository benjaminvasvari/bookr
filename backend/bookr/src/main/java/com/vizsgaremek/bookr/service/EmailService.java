package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.config.EmailConfig;
import com.vizsgaremek.bookr.util.EmailHtmlTemplates;
import java.io.UnsupportedEncodingException;
import jakarta.mail.*;
import jakarta.mail.internet.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Properties;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import javax.enterprise.context.ApplicationScoped;

/**
 * Email Service for sending emails asynchronously Uses JavaMail API with SMTP
 *
 * @author vben
 */
@ApplicationScoped
public class EmailService {

    private static final ExecutorService emailExecutor = Executors.newFixedThreadPool(5);

    private EmailHtmlTemplates EmailHtmlTemplates = new EmailHtmlTemplates();

    public void sendVerificationEmail(String toEmail, String firstName, String regToken) {
        if (!EmailConfig.isEmailEnabled()) {
            System.out.println("Email sending is disabled. Would send verification email to: " + toEmail);
            return;
        }

        // Send email asynchronously
        emailExecutor.submit(() -> {
            try {
                String verificationLink = EmailConfig.getAppBaseUrl() + "/verify-email?token=" + regToken;
                String htmlContent = EmailHtmlTemplates.createVerificationEmailHTML(firstName, verificationLink);

                sendEmail(
                        toEmail,
                        "Erősítsd meg email címedet - Bookr",
                        htmlContent
                );

                System.out.println("✅ Verification email sent to: " + toEmail);

            } catch (Exception e) {
                System.err.println("❌ Failed to send verification email to: " + toEmail);
                e.printStackTrace();
            }
        });
    }

    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        if (!EmailConfig.isEmailEnabled()) {
            System.out.println("Email sending is disabled. Would send password reset email to: " + toEmail);
            return;
        }

        // Send email asynchronously
        emailExecutor.submit(() -> {
            try {
                String resetLink = EmailConfig.getAppBaseUrl() + "/reset-password?token=" + resetToken;
                String htmlContent = EmailHtmlTemplates.createPasswordResetEmailHTML(resetLink);

                sendEmail(
                        toEmail,
                        "Jelszó visszaállítás - Bookr",
                        htmlContent
                );

                System.out.println("✅ Password reset email sent to: " + toEmail);

            } catch (Exception e) {
                System.err.println("❌ Failed to send password reset email to: " + toEmail);
                e.printStackTrace();
            }
        });
    }

    public void sendAppointmentConfirmationEmail(
            String toEmail,
            String clientName,
            String companyName,
            String serviceName,
            String staffName,
            String appointmentStart,
            String appointmentEnd,
            Integer duration,
            BigDecimal price,
            String companyAddress,
            String companyPhone,
            String notes
    ) {
        if (!EmailConfig.isEmailEnabled()) {
            System.out.println("Email sending is disabled.");
            return;
        }

        // Send email asynchronously
        emailExecutor.submit(() -> {
            try {
                String htmlContent = EmailHtmlTemplates.createAppointmentConfirmationEmailHTML(
                        clientName,
                        companyName,
                        serviceName,
                        staffName,
                        appointmentStart,
                        appointmentEnd,
                        duration,
                        price,
                        companyAddress,
                        companyPhone,
                        notes
                );

                sendEmail(
                        toEmail,
                        "Időpont megerősítése - " + companyName + " - Bookr",
                        htmlContent
                );

                System.out.println("✅ Appointment confirmation email sent");

            } catch (Exception e) {
                System.err.println("❌ Failed to send appointment confirmation email");
                e.printStackTrace();
            }
        });
    }

    public void sendStaffInviteEmail(String toEmail, String invitedName, String companyName, String companyCity, String ownerName, String positonName, String invToken, LocalDate expiresAt) throws MessagingException, UnsupportedEncodingException {
        if (!EmailConfig.isEmailEnabled()) {
            System.out.println("Email sending is disabled. Would send staff invite email to: " + toEmail);
            return;
        }

        String expiresAtFormatted = expiresAt.format(DateTimeFormatter.ofPattern("yyyy. MM. dd."));

        String inviteeName = invitedName != null ? invitedName : null;

        String subject = (inviteeName != null)
                ? "🎉 " + inviteeName + ", meghívtak a(z) " + companyName + " csapatába – Bookr"
                : "🎉 Meghívó: Csatlakozz a(z) " + companyName + " csapatához – Bookr";

        String invLink = EmailConfig.getAppBaseUrl() + "/staff-invite-accept?token=" + invToken;
        String htmlContent = EmailHtmlTemplates.createStaffInvitationEmailHTML(inviteeName, companyName, companyCity, ownerName, positonName, invLink, expiresAtFormatted);

        sendEmail(toEmail, subject, htmlContent);

        System.out.println("✅ Staff invite email sent to: " + toEmail);
    }

    /**
     * Send email via SMTP
     */
    private void sendEmail(String toEmail, String subject, String htmlContent)
            throws MessagingException, UnsupportedEncodingException {
        // SMTP Properties
        Properties props = new Properties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.host", EmailConfig.getSMTPHost());
        props.put("mail.smtp.port", EmailConfig.getSMTPPort());

        // Create session with authentication
        Session session = Session.getInstance(props, new Authenticator() {
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(
                        EmailConfig.getSMTPUsername(),
                        EmailConfig.getSMTPPassword()
                );
            }
        });

        // Create message
        Message message = new MimeMessage(session);
        message.setFrom(new InternetAddress(
                EmailConfig.getFromEmail(),
                EmailConfig.getFromName()
        ));
        message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail));
        message.setSubject(subject);

        // Set HTML content
        message.setContent(htmlContent, "text/html; charset=UTF-8");

        // Send email
        Transport.send(message);
    }

    /**
     * Shutdown the email executor gracefully
     */
    public static void shutdown() {
        emailExecutor.shutdown();
    }
}
