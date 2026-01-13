package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.config.EmailConfig;
import java.io.UnsupportedEncodingException;
import jakarta.mail.*;
import jakarta.mail.internet.*;
import java.math.BigDecimal;
import java.util.Properties;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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
     * Send password reset email asynchronously
     *
     * @param toEmail Recipient email address
     * @param resetToken Password reset token
     */
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        if (!EmailConfig.isEmailEnabled()) {
            System.out.println("Email sending is disabled. Would send password reset email to: " + toEmail);
            return;
        }

        // Send email asynchronously
        emailExecutor.submit(() -> {
            try {
                String resetLink = EmailConfig.getAppBaseUrl() + "/reset-password?token=" + resetToken;
                String htmlContent = createPasswordResetEmailHTML(resetLink);

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
                String htmlContent = createAppointmentConfirmationEmailHTML(
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
                + "                \n"
                + "                <!-- Main Container -->\n"
                + "                <table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #ffffff; border-radius: 25px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);\">\n"
                + "                    \n"
                + "                    <!-- Header with Logo -->\n"
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
                + "                            <h2 style=\"margin: 0 0 16px 0; color: #2c3e50; font-size: 28px; font-weight: 700;\">Üdv, " + firstName + "! 👋</h2>\n"
                + "                            \n"
                + "                            <p style=\"margin: 0 0 24px 0; color: #6c757d; font-size: 16px; line-height: 1.6;\">\n"
                + "                                Köszönjük, hogy csatlakoztál a <strong style=\"color: #2c3e50;\">Bookr</strong> közösséghez!\n"
                + "                            </p>\n"
                + "                            \n"
                + "                            <p style=\"margin: 0 0 32px 0; color: #6c757d; font-size: 16px; line-height: 1.6;\">\n"
                + "                                Az első lépés: <strong style=\"color: #38a179;\">Erősítsd meg az email címedet</strong> az alábbi gombra kattintva:\n"
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
                + "                                            Email Megerősítése\n"
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
                + "                            <div style=\"background: linear-gradient(135deg, #e8f5f1 0%, #d4edda 100%); border-left: 4px solid #38a179; padding: 20px; border-radius: 8px;\">\n"
                + "                                <p style=\"margin: 0; color: #2c3e50; font-size: 14px; line-height: 1.6;\">\n"
                + "                                    <strong>💡 Tipp:</strong> Ez a link 24 óráig érvényes. Ha lejár, újat kérhetsz a bejelentkezési oldalon.\n"
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
                + "                            <div style=\"margin-bottom: 20px;\">\n"
                + "                                <p style=\"margin: 0 0 8px 0; color: #6c757d; font-size: 14px; font-weight: 600;\">\n"
                + "                                    Miért kaptam ezt az emailt?\n"
                + "                                </p>\n"
                + "                                <p style=\"margin: 0; color: #adb5bd; font-size: 13px; line-height: 1.5;\">\n"
                + "                                    Ezt az emailt azért kaptad, mert regisztráltál a Bookr platformon. Ha nem te voltál, hagyd figyelmen kívül ezt az üzenetet.\n"
                + "                                </p>\n"
                + "                            </div>\n"
                + "                            \n"
                + "                            <!-- Copyright -->\n"
                + "                            <p style=\"margin: 0 0 8px 0; color: #6c757d; font-size: 14px; font-weight: 600;\">\n"
                + "                                © 2026 B<span style=\"color: #38a179;\">oo</span>kr\n"
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
     * Create HTML email template for password reset - Bookr Brand Colors
     */
    private String createPasswordResetEmailHTML(String resetLink) {
        return "<!DOCTYPE html>\n"
                + "<html lang=\"hu\">\n"
                + "<head>\n"
                + "    <meta charset=\"UTF-8\">\n"
                + "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n"
                + "    <title>Jelszó Visszaállítás - Bookr</title>\n"
                + "</head>\n"
                + "<body style=\"margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa;\">\n"
                + "    <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #f8f9fa; padding: 40px 20px;\">\n"
                + "        <tr>\n"
                + "            <td align=\"center\">\n"
                + "                \n"
                + "                <!-- Main Container -->\n"
                + "                <table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #ffffff; border-radius: 25px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);\">\n"
                + "                    \n"
                + "                    <!-- Header with Logo -->\n"
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
                + "                    <!-- Reset Section -->\n"
                + "                    <tr>\n"
                + "                        <td style=\"padding: 50px 40px 30px;\">\n"
                + "                            <h2 style=\"margin: 0 0 16px 0; color: #2c3e50; font-size: 28px; font-weight: 700;\">Jelszó Visszaállítás</h2>\n"
                + "                            \n"
                + "                            <p style=\"margin: 0 0 24px 0; color: #6c757d; font-size: 16px; line-height: 1.6;\">\n"
                + "                                Jelszó visszaállítási kérelmet kaptunk a <strong style=\"color: #2c3e50;\">Bookr</strong> fiókodhoz.\n"
                + "                            </p>\n"
                + "                            \n"
                + "                            <p style=\"margin: 0 0 32px 0; color: #6c757d; font-size: 16px; line-height: 1.6;\">\n"
                + "                                Ha te kezdeményezted ezt, kattints az alábbi gombra egy új jelszó beállításához:\n"
                + "                            </p>\n"
                + "                        </td>\n"
                + "                    </tr>\n"
                + "                    \n"
                + "                    <!-- CTA Button -->\n"
                + "                    <tr>\n"
                + "                        <td align=\"center\" style=\"padding: 0 40px 40px;\">\n"
                + "                            <table cellpadding=\"0\" cellspacing=\"0\">\n"
                + "                                <tr>\n"
                + "                                    <td align=\"center\" style=\"border-radius: 12px; background-color: #e74c3c; box-shadow: 0 6px 20px rgba(231, 76, 60, 0.3);\">\n"
                + "                                        <a href=\"" + resetLink + "\" style=\"display: inline-block; color: #ffffff; text-decoration: none; padding: 18px 48px; font-size: 16px; font-weight: 700; letter-spacing: 0.5px;\">\n"
                + "                                            Jelszó Visszaállítása\n"
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
                + "                                    <a href=\"" + resetLink + "\" style=\"color: #e74c3c; text-decoration: none; font-weight: 500;\">" + resetLink + "</a>\n"
                + "                                </p>\n"
                + "                            </div>\n"
                + "                        </td>\n"
                + "                    </tr>\n"
                + "                    \n"
                + "                    <!-- Warning Box - CRITICAL -->\n"
                + "                    <tr>\n"
                + "                        <td style=\"padding: 0 40px 40px;\">\n"
                + "                            <div style=\"background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; border-radius: 8px;\">\n"
                + "                                <p style=\"margin: 0 0 12px 0; color: #856404; font-size: 14px; line-height: 1.6; font-weight: 700;\">\n"
                + "                                    ⚠️ FONTOS BIZTONSÁGI INFORMÁCIÓK:\n"
                + "                                </p>\n"
                + "                                <ul style=\"margin: 0; padding-left: 20px; color: #856404; font-size: 13px; line-height: 1.7;\">\n"
                + "                                    <li>Ez a link <strong>15 percig</strong> érvényes</li>\n"
                + "                                    <li>Ha <strong>nem te kérted</strong> a visszaállítást, hagyd figyelmen kívül ezt az emailt</li>\n"
                + "                                    <li>A jelszavad <strong>csak akkor változik</strong>, ha rákattintasz a gombra</li>\n"
                + "                                    <li><strong>Soha ne add ki</strong> ezt a linket másoknak!</li>\n"
                + "                                </ul>\n"
                + "                            </div>\n"
                + "                        </td>\n"
                + "                    </tr>\n"
                + "                    \n"
                + "                    <!-- Info Box -->\n"
                + "                    <tr>\n"
                + "                        <td style=\"padding: 0 40px 40px;\">\n"
                + "                            <div style=\"background: linear-gradient(135deg, #fef5e7 0%, #fadbd8 100%); border-left: 4px solid #e74c3c; padding: 20px; border-radius: 8px;\">\n"
                + "                                <p style=\"margin: 0; color: #2c3e50; font-size: 14px; line-height: 1.6;\">\n"
                + "                                    <strong>💡 Tipp:</strong> Válassz erős jelszót, amely tartalmaz nagybetűt, kisbetűt, számot és speciális karaktert!\n"
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
                + "                            <div style=\"margin-bottom: 20px;\">\n"
                + "                                <p style=\"margin: 0 0 8px 0; color: #6c757d; font-size: 14px; font-weight: 600;\">\n"
                + "                                    Miért kaptam ezt az emailt?\n"
                + "                                </p>\n"
                + "                                <p style=\"margin: 0; color: #adb5bd; font-size: 13px; line-height: 1.5;\">\n"
                + "                                    Ezt az emailt azért kaptad, mert valaki (remélhetőleg te) jelszó visszaállítást kért a Bookr fiókodhoz.\n"
                + "                                </p>\n"
                + "                            </div>\n"
                + "                            \n"
                + "                            <!-- Copyright -->\n"
                + "                            <p style=\"margin: 0 0 8px 0; color: #6c757d; font-size: 14px; font-weight: 600;\">\n"
                + "                                © 2026 B<span style=\"color: #38a179;\">oo</span>kr\n"
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

    private String createAppointmentConfirmationEmailHTML(
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
        // Format datetime
        String[] startTimeParts = appointmentStart.split(" ");
        String date = startTimeParts[0];  // "2026-01-13"
        String startTime = startTimeParts[1].substring(0, 5);  // "13:24"
        
        String[] endTimeParts = appointmentEnd.split(" ");
        String endTime = endTimeParts[1].substring(0, 5);  // "13:24"

        // Format price
        String formattedPrice = String.format("%,.0f %s", price, "Ft");

        // Notes section (optional)
        String notesSection = "";
        if (notes != null && !notes.isEmpty()) {
            notesSection = "               \n<tr>\n"
                    + "                        <td style=\"padding: 0 40px 30px;\">\n"
                    + "                            <div style=\"background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 20px; border-radius: 8px;\">\n"
                    + "                                <p style=\"margin: 0 0 8px 0; color: #856404; font-size: 14px; font-weight: 700;\">\n"
                    + "                                    📝 Megjegyzésed:\n"
                    + "                                </p>\n"
                    + "                                <p style=\"margin: 0; color: #856404; font-size: 14px; line-height: 1.5;\">\n"
                    + "                                    " + notes + "\n"
                    + "                                </p>\n"
                    + "                            </div>\n"
                    + "                        </td>\n"
                    + "                    </tr>\n";
        }

        return "<!DOCTYPE html>\n"
                + "<html lang=\"hu\">\n"
                + "<head>\n"
                + "    <meta charset=\"UTF-8\">\n"
                + "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n"
                + "    <title>Időpont Megerősítése - Bookr</title>\n"
                + "</head>\n"
                + "<body style=\"margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa;\">\n"
                + "    <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #f8f9fa; padding: 40px 20px;\">\n"
                + "        <tr>\n"
                + "            <td align=\"center\">\n"
                + "                \n"
                + "                <!-- Main Container -->\n"
                + "                <table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #ffffff; border-radius: 25px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);\">\n"
                + "                    \n"
                + "                    <!-- Header with Logo -->\n"
                + "                    <tr>\n"
                + "                        <td style=\"background: linear-gradient(135deg, #38a179 0%, #2d8061 100%); padding: 50px 30px; text-align: center;\">\n"
                + "                            <!-- Success Icon -->\n"
                + "                            <div style=\"margin-bottom: 20px;\">\n"
                + "                                <div style=\"display: inline-block; background-color: rgba(255,255,255,0.2); border-radius: 50%; padding: 20px;\">\n"
                + "                                    <span style=\"font-size: 48px;\">✓</span>\n"
                + "                                </div>\n"
                + "                            </div>\n"
                + "                            \n"
                + "                            <h1 style=\"margin: 0 0 12px 0; color: #ffffff; font-size: 32px; font-weight: 800;\">\n"
                + "                                Időpont Lefoglalva!\n"
                + "                            </h1>\n"
                + "                            \n"
                + "                            <p style=\"margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 16px; font-weight: 500;\">\n"
                + "                                A foglalásod sikeresen rögzítettük\n"
                + "                            </p>\n"
                + "                        </td>\n"
                + "                    </tr>\n"
                + "                    \n"
                + "                    <!-- Greeting Section -->\n"
                + "                    <tr>\n"
                + "                        <td style=\"padding: 40px 40px 20px;\">\n"
                + "                            <p style=\"margin: 0; color: #2c3e50; font-size: 18px; font-weight: 600;\">\n"
                + "                                Kedves " + clientName + "! 👋\n"
                + "                            </p>\n"
                + "                        </td>\n"
                + "                    </tr>\n"
                + "                    \n"
                + "                    <!-- Appointment Details Box -->\n"
                + "                    <tr>\n"
                + "                        <td style=\"padding: 0 40px 30px;\">\n"
                + "                            <div style=\"background: linear-gradient(135deg, #e8f5f1 0%, #d4edda 100%); border-radius: 15px; padding: 30px; border-left: 6px solid #38a179;\">\n"
                + "                                \n"
                + "                                <!-- Company Name -->\n"
                + "                                <div style=\"margin-bottom: 24px;\">\n"
                + "                                    <p style=\"margin: 0 0 4px 0; color: #6c757d; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;\">\n"
                + "                                        🏢 SZOLGÁLTATÓ\n"
                + "                                    </p>\n"
                + "                                    <p style=\"margin: 0; color: #2c3e50; font-size: 20px; font-weight: 700;\">\n"
                + "                                        " + companyName + "\n"
                + "                                    </p>\n"
                + "                                </div>\n"
                + "                                \n"
                + "                                <!-- Divider -->\n"
                + "                                <div style=\"height: 1px; background-color: rgba(44, 62, 80, 0.1); margin: 20px 0;\"></div>\n"
                + "                                \n"
                + "                                <!-- Service -->\n"
                + "                                <div style=\"margin-bottom: 20px;\">\n"
                + "                                    <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">\n"
                + "                                        <tr>\n"
                + "                                            <td style=\"width: 30px; vertical-align: top;\">\n"
                + "                                                <span style=\"font-size: 20px;\">💆</span>\n"
                + "                                            </td>\n"
                + "                                            <td>\n"
                + "                                                <p style=\"margin: 0 0 4px 0; color: #6c757d; font-size: 13px; font-weight: 600;\">\n"
                + "                                                    Szolgáltatás\n"
                + "                                                </p>\n"
                + "                                                <p style=\"margin: 0; color: #2c3e50; font-size: 16px; font-weight: 600;\">\n"
                + "                                                    " + serviceName + "\n"
                + "                                                </p>\n"
                + "                                            </td>\n"
                + "                                        </tr>\n"
                + "                                    </table>\n"
                + "                                </div>\n"
                + "                                \n"
                + "                                <!-- Date & Time -->\n"
                + "                                <div style=\"margin-bottom: 20px;\">\n"
                + "                                    <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">\n"
                + "                                        <tr>\n"
                + "                                            <td style=\"width: 30px; vertical-align: top;\">\n"
                + "                                                <span style=\"font-size: 20px;\">📅</span>\n"
                + "                                            </td>\n"
                + "                                            <td>\n"
                + "                                                <p style=\"margin: 0 0 4px 0; color: #6c757d; font-size: 13px; font-weight: 600;\">\n"
                + "                                                    Időpont\n"
                + "                                                </p>\n"
                + "                                                <p style=\"margin: 0; color: #2c3e50; font-size: 16px; font-weight: 600;\">\n"
                + "                                                    " + date + "\n"
                + "                                                </p>\n"
                + "                                                <p style=\"margin: 4px 0 0 0; color: #38a179; font-size: 18px; font-weight: 700;\">\n"
                + "                                                    " + startTime + " - " + endTime + "\n"
                + "                                                </p>\n"
                + "                                            </td>\n"
                + "                                        </tr>\n"
                + "                                    </table>\n"
                + "                                </div>\n"
                + "                                \n"
                + "                                <!-- Staff -->\n"
                + "                                <div style=\"margin-bottom: 20px;\">\n"
                + "                                    <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">\n"
                + "                                        <tr>\n"
                + "                                            <td style=\"width: 30px; vertical-align: top;\">\n"
                + "                                                <span style=\"font-size: 20px;\">👤</span>\n"
                + "                                            </td>\n"
                + "                                            <td>\n"
                + "                                                <p style=\"margin: 0 0 4px 0; color: #6c757d; font-size: 13px; font-weight: 600;\">\n"
                + "                                                    Munkatárs\n"
                + "                                                </p>\n"
                + "                                                <p style=\"margin: 0; color: #2c3e50; font-size: 16px; font-weight: 600;\">\n"
                + "                                                    " + staffName + "\n"
                + "                                                </p>\n"
                + "                                            </td>\n"
                + "                                        </tr>\n"
                + "                                    </table>\n"
                + "                                </div>\n"
                + "                                \n"
                + "                                <!-- Duration -->\n"
                + "                                <div style=\"margin-bottom: 20px;\">\n"
                + "                                    <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">\n"
                + "                                        <tr>\n"
                + "                                            <td style=\"width: 30px; vertical-align: top;\">\n"
                + "                                                <span style=\"font-size: 20px;\">⏱️</span>\n"
                + "                                            </td>\n"
                + "                                            <td>\n"
                + "                                                <p style=\"margin: 0 0 4px 0; color: #6c757d; font-size: 13px; font-weight: 600;\">\n"
                + "                                                    Időtartam\n"
                + "                                                </p>\n"
                + "                                                <p style=\"margin: 0; color: #2c3e50; font-size: 16px; font-weight: 600;\">\n"
                + "                                                    " + duration + " perc\n"
                + "                                                </p>\n"
                + "                                            </td>\n"
                + "                                        </tr>\n"
                + "                                    </table>\n"
                + "                                </div>\n"
                + "                                \n"
                + "                                <!-- Divider -->\n"
                + "                                <div style=\"height: 2px; background-color: rgba(44, 62, 80, 0.15); margin: 24px 0;\"></div>\n"
                + "                                \n"
                + "                                <!-- Price -->\n"
                + "                                <div>\n"
                + "                                    <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">\n"
                + "                                        <tr>\n"
                + "                                            <td style=\"width: 30px; vertical-align: top;\">\n"
                + "                                                <span style=\"font-size: 20px;\">💰</span>\n"
                + "                                            </td>\n"
                + "                                            <td>\n"
                + "                                                <p style=\"margin: 0 0 4px 0; color: #6c757d; font-size: 13px; font-weight: 600;\">\n"
                + "                                                    Ár\n"
                + "                                                </p>\n"
                + "                                                <p style=\"margin: 0; color: #38a179; font-size: 24px; font-weight: 800;\">\n"
                + "                                                    " + formattedPrice + "\n"
                + "                                                </p>\n"
                + "                                            </td>\n"
                + "                                        </tr>\n"
                + "                                    </table>\n"
                + "                                </div>\n"
                + "                                \n"
                + "                            </div>\n"
                + "                        </td>\n"
                + "                    </tr>\n"
                + "                    \n"
                + notesSection
                + "                    \n"
                + "                    <!-- Location Section -->\n"
                + "                    <tr>\n"
                + "                        <td style=\"padding: 0 40px 30px;\">\n"
                + "                            <div style=\"background-color: #f8f9fa; border-radius: 12px; padding: 24px;\">\n"
                + "                                <p style=\"margin: 0 0 16px 0; color: #2c3e50; font-size: 16px; font-weight: 700;\">\n"
                + "                                    📍 Helyszín\n"
                + "                                </p>\n"
                + "                                \n"
                + "                                <p style=\"margin: 0 0 12px 0; color: #2c3e50; font-size: 15px; line-height: 1.6;\">\n"
                + "                                    <strong>" + companyName + "</strong>\n"
                + "                                </p>\n"
                + "                                \n"
                + "                                <p style=\"margin: 0 0 12px 0; color: #6c757d; font-size: 14px; line-height: 1.6;\">\n"
                + "                                    " + companyAddress + "\n"
                + "                                </p>\n"
                + "                                \n"
                + "                                <p style=\"margin: 0; color: #6c757d; font-size: 14px;\">\n"
                + "                                    📞 <a href=\"tel:" + companyPhone + "\" style=\"color: #38a179; text-decoration: none; font-weight: 600;\">" + companyPhone + "</a>\n"
                + "                                </p>\n"
                + "                            </div>\n"
                + "                        </td>\n"
                + "                    </tr>\n"
                + "                    \n"
                + "                    <!-- Important Info Box -->\n"
                + "                    <tr>\n"
                + "                        <td style=\"padding: 0 40px 40px;\">\n"
                + "                            <div style=\"background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; border-radius: 8px;\">\n"
                + "                                <p style=\"margin: 0 0 12px 0; color: #1565c0; font-size: 14px; line-height: 1.6; font-weight: 700;\">\n"
                + "                                    ℹ️ FONTOS INFORMÁCIÓK:\n"
                + "                                </p>\n"
                + "                                <ul style=\"margin: 0; padding-left: 20px; color: #1565c0; font-size: 13px; line-height: 1.7;\">\n"
                + "                                    <li>Kérjük, <strong>5-10 perccel</strong> az időpont előtt érkezz</li>\n"
                + "                                    <li>Ha mégsem tudsz eljönni, <strong>minél hamarabb</strong> lemondhatod az időpontot</li>\n"
                + "                                    <li>Időpontjaidat a <strong>Bookr alkalmazásban</strong> tudod kezelni</li>\n"
                + "                                    <li>Kérdés esetén hívd a megadott telefonszámot</li>\n"
                + "                                </ul>\n"
                + "                            </div>\n"
                + "                        </td>\n"
                + "                    </tr>\n"
                + "                    \n"
                + "                    <!-- CTA Buttons -->\n"
                + "                    <tr>\n"
                + "                        <td align=\"center\" style=\"padding: 0 40px 40px;\">\n"
                + "                            <table cellpadding=\"0\" cellspacing=\"0\" width=\"100%\">\n"
                + "                                <tr>\n"
                + "                                    <td align=\"center\">\n"
                + "                                        <!-- View in App Button -->\n"
                + "                                        <table cellpadding=\"0\" cellspacing=\"0\" style=\"margin-bottom: 12px;\">\n"
                + "                                            <tr>\n"
                + "                                                <td align=\"center\" style=\"border-radius: 12px; background-color: #38a179; box-shadow: 0 4px 12px rgba(56, 161, 121, 0.3);\">\n"
                + "                                                    <a href=\"" + EmailConfig.getAppBaseUrl() + "/appointments\" style=\"display: inline-block; color: #ffffff; text-decoration: none; padding: 16px 40px; font-size: 15px; font-weight: 700; letter-spacing: 0.5px;\">\n"
                + "                                                        📱 Időpontjaim Megtekintése\n"
                + "                                                    </a>\n"
                + "                                                </td>\n"
                + "                                            </tr>\n"
                + "                                        </table>\n"
                + "                                    </td>\n"
                + "                                </tr>\n"
                + "                            </table>\n"
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
                + "                            \n"
                + "                            <!-- Logo -->\n"
                + "                            <div style=\"margin-bottom: 20px;\">\n"
                + "                                <h3 style=\"margin: 0; color: #2c3e50; font-size: 24px; font-weight: 800;\">\n"
                + "                                    B<span style=\"color: #38a179;\">oo</span>kr\n"
                + "                                </h3>\n"
                + "                            </div>\n"
                + "                            \n"
                + "                            <p style=\"margin: 0 0 8px 0; color: #6c757d; font-size: 14px;\">\n"
                + "                                Köszönjük, hogy minket választottál! 💚\n"
                + "                            </p>\n"
                + "                            \n"
                + "                            <!-- Copyright -->\n"
                + "                            <p style=\"margin: 20px 0 8px 0; color: #6c757d; font-size: 14px; font-weight: 600;\">\n"
                + "                                © 2026 B<span style=\"color: #38a179;\">oo</span>kr\n"
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
