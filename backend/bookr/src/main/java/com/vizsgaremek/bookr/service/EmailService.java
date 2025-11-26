package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.config.EmailConfig;
import java.io.UnsupportedEncodingException;
import jakarta.mail.*;
import jakarta.mail.internet.*;
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

    /**
     * Send verification email asynchronously
     *
     * @param toEmail Recipient email address
     * @param firstName Recipient first name
     * @param regToken Registration token for verification
     */
    public void sendVerificationEmail(String toEmail, String firstName, String regToken) {
        if (!EmailConfig.isEmailEnabled()) {
            System.out.println("Email sending is disabled. Would send verification email to: " + toEmail);
            return;
        }

        // Send email asynchronously
        emailExecutor.submit(() -> {
            try {
                String verificationLink = EmailConfig.getAppBaseUrl() + "/api/auth/verify?token=" + regToken;
                String htmlContent = createVerificationEmailHTML(firstName, verificationLink);

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
     * Create HTML email template for verification
     */
    private String createVerificationEmailHTML(String firstName, String verificationLink) {
        return "<!DOCTYPE html>\n"
                + "<html lang=\"hu\">\n"
                + "<head>\n"
                + "    <meta charset=\"UTF-8\">\n"
                + "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n"
                + "    <title>Email Megerősítés</title>\n"
                + "</head>\n"
                + "<body style=\"margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;\">\n"
                + "    <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #f4f4f4; padding: 20px 0;\">\n"
                + "        <tr>\n"
                + "            <td align=\"center\">\n"
                + "                <!-- Main Container -->\n"
                + "                <table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);\">\n"
                + "                    \n"
                + "                    <!-- Header -->\n"
                + "                    <tr>\n"
                + "                        <td style=\"background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;\">\n"
                + "                            <h1 style=\"margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;\">📅 Bookr</h1>\n"
                + "                            <p style=\"margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;\">Foglalási Rendszer</p>\n"
                + "                        </td>\n"
                + "                    </tr>\n"
                + "                    \n"
                + "                    <!-- Content -->\n"
                + "                    <tr>\n"
                + "                        <td style=\"padding: 40px 30px;\">\n"
                + "                            <h2 style=\"margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;\">Szia " + firstName + "! 👋</h2>\n"
                + "                            \n"
                + "                            <p style=\"margin: 0 0 20px 0; color: #555555; font-size: 16px; line-height: 1.6;\">\n"
                + "                                Köszönjük, hogy regisztráltál a <strong>Bookr</strong> rendszerébe!\n"
                + "                            </p>\n"
                + "                            \n"
                + "                            <p style=\"margin: 0 0 30px 0; color: #555555; font-size: 16px; line-height: 1.6;\">\n"
                + "                                A regisztráció befejezéséhez kérjük, erősítsd meg email címedet az alábbi gombra kattintva:\n"
                + "                            </p>\n"
                + "                            \n"
                + "                            <!-- Button -->\n"
                + "                            <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">\n"
                + "                                <tr>\n"
                + "                                    <td align=\"center\" style=\"padding: 10px 0 30px 0;\">\n"
                + "                                        <a href=\"" + verificationLink + "\" style=\"display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); transition: transform 0.2s;\">\n"
                + "                                            ✉️ Email Cím Megerősítése\n"
                + "                                        </a>\n"
                + "                                    </td>\n"
                + "                                </tr>\n"
                + "                            </table>\n"
                + "                            \n"
                + "                            <!-- Alternative Link -->\n"
                + "                            <p style=\"margin: 0 0 10px 0; color: #888888; font-size: 14px; line-height: 1.6;\">\n"
                + "                                Ha a gomb nem működik, másold be ezt a linket a böngésződbe:\n"
                + "                            </p>\n"
                + "                            <p style=\"margin: 0 0 30px 0; word-break: break-all;\">\n"
                + "                                <a href=\"" + verificationLink + "\" style=\"color: #667eea; text-decoration: none; font-size: 14px;\">" + verificationLink + "</a>\n"
                + "                            </p>\n"
                + "                            \n"
                + "                            <!-- Warning Box -->\n"
                + "                            <div style=\"background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;\">\n"
                + "                                <p style=\"margin: 0; color: #856404; font-size: 14px; line-height: 1.6;\">\n"
                + "                                    ⚠️ <strong>Fontos:</strong> Ha nem te regisztráltál, kérjük hagyd figyelmen kívül ezt az emailt.\n"
                + "                                </p>\n"
                + "                            </div>\n"
                + "                        </td>\n"
                + "                    </tr>\n"
                + "                    \n"
                + "                    <!-- Footer -->\n"
                + "                    <tr>\n"
                + "                        <td style=\"background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;\">\n"
                + "                            <p style=\"margin: 0 0 10px 0; color: #6c757d; font-size: 14px;\">\n"
                + "                                © 2025 Bookr - Foglalási Rendszer\n"
                + "                            </p>\n"
                + "                            <p style=\"margin: 0; color: #adb5bd; font-size: 12px;\">\n"
                + "                                Ez egy automatikus email, kérjük ne válaszolj rá.\n"
                + "                            </p>\n"
                + "                        </td>\n"
                + "                    </tr>\n"
                + "                    \n"
                + "                </table>\n"
                + "            </td>\n"
                + "        </tr>\n"
                + "    </table>\n"
                + "</body>\n"
                + "</html>";
    }

    /**
     * Shutdown the email executor gracefully
     */
    public static void shutdown() {
        emailExecutor.shutdown();
    }
}
