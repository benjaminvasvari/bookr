package com.vizsgaremek.bookr.config;

/**
 * Email configuration loader Loads SMTP settings from .env file via EnvConfig
 *
 * @author vben
 */
public class EmailConfig {

    /**
     * SMTP host
     */
    public static String getSMTPHost() {
        return EnvConfig.get("SMTP_HOST", "sandbox.smtp.mailtrap.io");
    }

    /**
     * SMTP port
     */
    public static int getSMTPPort() {
        String port = EnvConfig.get("SMTP_PORT", "2525");
        return Integer.parseInt(port);
    }

    /**
     * SMTP username (email address)
     */
    public static String getSMTPUsername() {
        return EnvConfig.get("SMTP_USERNAME", "");
    }

    /**
     * SMTP password (app-specific password for Gmail)
     */
    public static String getSMTPPassword() {
        return EnvConfig.get("SMTP_PASSWORD", "");
    }

    /**
     * From email address
     */
    public static String getFromEmail() {
        return EnvConfig.get("EMAIL_FROM", "noreply@bookr.local");
    }

    /**
     * From name (sender name)
     */
    public static String getFromName() {
        return EnvConfig.get("EMAIL_FROM_NAME", "Bookr");
    }

    /**
     * Application base URL (for email links)
     */
    public static String getAppBaseUrl() {
        return EnvConfig.get("APP_BASE_URL", "http://localhost:8080");
    }

    /**
     * Is email sending enabled?
     */
    public static boolean isEmailEnabled() {
        String enabled = EnvConfig.get("EMAIL_ENABLED", "true");
        return Boolean.parseBoolean(enabled);
    }
}
