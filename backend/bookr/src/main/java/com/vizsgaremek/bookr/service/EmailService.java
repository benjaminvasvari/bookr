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
                String verificationLink = EmailConfig.getAppBaseUrl() + "/verify-email?token=" + regToken;
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
     * Create HTML email template for verification - Bookr Brand Colors
     */
    private String createVerificationEmailHTML(String firstName, String verificationLink) {
        return "<!DOCTYPE html>\n"
                + "<html lang=\"hu\">\n"
                + "<head>\n"
                + "    <meta charset=\"UTF-8\">\n"
                + "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n"
                + "    <title>Email Megerősítés - Bookr</title>\n"
                + "</head>\n"
                + "<body style=\"margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa;\">\n"
                + "    <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #f8f9fa; padding: 40px 20px;\">\n"
                + "        <tr>\n"
                + "            <td align=\"center\">\n"
                + "                <!-- Main Container -->\n"
                + "                <table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);\">\n"
                + "                    \n"
                + "                    <!-- Header with Brand Colors -->\n"
                + "                    <tr>\n"
                + "                        <td style=\"background-color: #2c3e50; padding: 50px 30px; text-align: center;\">\n"
                + "                            <!-- Logo -->\n"
                + "                            <div style=\"margin-bottom: 20px;\">\n"
                + "                                <h1 style=\"margin: 0; color: #ffffff; font-size: 48px; font-weight: 800; letter-spacing: -1px;\">\n"
                + "                                    B<span style=\"color: #38a179;\">oo</span>kr\n"
                + "                                </h1>\n"
                + "                            </div>\n"
                + "                            <p style=\"margin: 0; color: rgba(255, 255, 255, 0.8); font-size: 16px; font-weight: 500;\">Foglalási Rendszer</p>\n"
                + "                        </td>\n"
                + "                    </tr>\n"
                + "                    \n"
                + "                    <!-- Welcome Section -->\n"
                + "                    <tr>\n"
                + "                        <td style=\"padding: 50px 40px 30px;\">\n"
                + "                            <h2 style=\"margin: 0 0 16px 0; color: #2c3e50; font-size: 28px; font-weight: 700;\">Szia " + firstName + "! 👋</h2>\n"
                + "                            \n"
                + "                            <p style=\"margin: 0 0 24px 0; color: #6c757d; font-size: 16px; line-height: 1.6;\">\n"
                + "                                Örülünk, hogy csatlakoztál a <strong style=\"color: #2c3e50;\">Bookr</strong> közösséghez!\n"
                + "                            </p>\n"
                + "                            \n"
                + "                            <p style=\"margin: 0 0 32px 0; color: #6c757d; font-size: 16px; line-height: 1.6;\">\n"
                + "                                A regisztráció befejezéséhez erősítsd meg email címedet az alábbi gombra kattintva:\n"
                + "                            </p>\n"
                + "                        </td>\n"
                + "                    </tr>\n"
                + "                    \n"
                + "                    <!-- CTA Button -->\n"
                + "                    <tr>\n"
                + "                        <td align=\"center\" style=\"padding: 0 40px 40px;\">\n"
                + "                            <table cellpadding=\"0\" cellspacing=\"0\">\n"
                + "                                <tr>\n"
                + "                                    <td align=\"center\" style=\"border-radius: 12px; background-color: #38a179; box-shadow: 0 6px 20px rgba(56, 161, 121, 0.3);\">\n"
                + "                                        <a href=\"" + verificationLink + "\" style=\"display: inline-block; color: #ffffff; text-decoration: none; padding: 18px 48px; font-size: 16px; font-weight: 700; letter-spacing: 0.5px;\">\n"
                + "                                            ✉️ Email Cím Megerősítése\n"
                + "                                        </a>\n"
                + "                                    </td>\n"
                + "                                </tr>\n"
                + "                            </table>\n"
                + "                        </td>\n"
                + "                    </tr>\n"
                + "                    \n"
                + "                    <!-- Alternative Link -->\n"
                + "                    <tr>\n"
                + "                        <td style=\"padding: 0 40px 30px;\">\n"
                + "                            <div style=\"background-color: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center;\">\n"
                + "                                <p style=\"margin: 0 0 12px 0; color: #6c757d; font-size: 14px; font-weight: 600;\">\n"
                + "                                    Nem működik a gomb?\n"
                + "                                </p>\n"
                + "                                <p style=\"margin: 0; font-size: 13px; word-break: break-all;\">\n"
                + "                                    <a href=\"" + verificationLink + "\" style=\"color: #38a179; text-decoration: none; font-weight: 500;\">" + verificationLink + "</a>\n"
                + "                                </p>\n"
                + "                            </div>\n"
                + "                        </td>\n"
                + "                    </tr>\n"
                + "                    \n"
                + "                    <!-- Info Box -->\n"
                + "                    <tr>\n"
                + "                        <td style=\"padding: 0 40px 40px;\">\n"
                + "                            <div style=\"background: linear-gradient(135deg, #e8f5f1 0%, #d4f0e6 100%); border-left: 4px solid #38a179; padding: 20px; border-radius: 8px;\">\n"
                + "                                <p style=\"margin: 0; color: #2c3e50; font-size: 14px; line-height: 1.6;\">\n"
                + "                                    <strong>💡 Tipp:</strong> Az email megerősítése után azonnal böngészhetsz a szolgáltatások között és foglalhatsz időpontot!\n"
                + "                                </p>\n"
                + "                            </div>\n"
                + "                        </td>\n"
                + "                    </tr>\n"
                + "                    \n"
                + "                    <!-- Warning Box -->\n"
                + "                    <tr>\n"
                + "                        <td style=\"padding: 0 40px 50px;\">\n"
                + "                            <div style=\"background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; border-radius: 8px;\">\n"
                + "                                <p style=\"margin: 0; color: #856404; font-size: 13px; line-height: 1.5;\">\n"
                + "                                    ⚠️ <strong>Fontos:</strong> Ha nem te regisztráltál, hagyd figyelmen kívül ezt az emailt. A fiók automatikusan törlődik 24 óra múlva.\n"
                + "                                </p>\n"
                + "                            </div>\n"
                + "                        </td>\n"
                + "                    </tr>\n"
                + "                    \n"
                + "                    <!-- Divider -->\n"
                + "                    <tr>\n"
                + "                        <td style=\"padding: 0 40px;\">\n"
                + "                            <div style=\"height: 1px; background-color: #e9ecef;\"></div>\n"
                + "                        </td>\n"
                + "                    </tr>\n"
                + "                    \n"
                + "                    <!-- Footer -->\n"
                + "                    <tr>\n"
                + "                        <td style=\"padding: 40px; text-align: center;\">\n"
                + "                            <!-- Social/Info Icons (optional) -->\n"
                + "                            <div style=\"margin-bottom: 20px;\">\n"
                + "                                <p style=\"margin: 0 0 8px 0; color: #6c757d; font-size: 14px; font-weight: 600;\">\n"
                + "                                    Miért kaptam ezt az emailt?\n"
                + "                                </p>\n"
                + "                                <p style=\"margin: 0; color: #adb5bd; font-size: 13px; line-height: 1.5;\">\n"
                + "                                    Ezt az emailt azért kaptad, mert valaki (remélhetőleg te) regisztrált a Bookr rendszerébe ezzel az email címmel.\n"
                + "                                </p>\n"
                + "                            </div>\n"
                + "                            \n"
                + "                            <!-- Copyright -->\n"
                + "                            <p style=\"margin: 0 0 8px 0; color: #6c757d; font-size: 14px; font-weight: 600;\">\n"
                + "                                © 2025 B<span style=\"color: #38a179;\">oo</span>kr\n"
                + "                            </p>\n"
                + "                            <p style=\"margin: 0; color: #adb5bd; font-size: 12px;\">\n"
                + "                                Ez egy automatikus email, kérjük ne válaszolj rá.\n"
                + "                            </p>\n"
                + "                        </td>\n"
                + "                    </tr>\n"
                + "                    \n"
                + "                </table>\n"
                + "                \n"
                + "                <!-- Bottom Spacer -->\n"
                + "                <table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin-top: 20px;\">\n"
                + "                    <tr>\n"
                + "                        <td align=\"center\">\n"
                + "                            <p style=\"margin: 0; color: #adb5bd; font-size: 12px;\">\n"
                + "                                Bookr - Modern foglalási rendszer szalonoknak és szolgáltatóknak\n"
                + "                            </p>\n"
                + "                        </td>\n"
                + "                    </tr>\n"
                + "                </table>\n"
                + "                \n"
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
