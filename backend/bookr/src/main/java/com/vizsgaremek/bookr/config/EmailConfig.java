package com.vizsgaremek.bookr.config;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

/**
 * Email configuration loader
 * Loads SMTP settings from email.properties
 * 
 * @author vben
 */
public class EmailConfig {
    private static Properties properties;
    
    static {
        loadProperties();
    }
    
    private static void loadProperties() {
        properties = new Properties();
        try (InputStream input = EmailConfig.class.getClassLoader()
                .getResourceAsStream("email.properties")) {
            
            if (input == null) {
                System.err.println("Unable to find email.properties");
                return;
            }
            
            properties.load(input);
            
        } catch (IOException ex) {
            ex.printStackTrace();
        }
    }
    
    public static String getSMTPHost() {
        return properties.getProperty("smtp.host", "sandbox.smtp.mailtrap.io");
    }
    
    public static int getSMTPPort() {
        return Integer.parseInt(properties.getProperty("smtp.port", "2525"));
    }
    
    public static String getSMTPUsername() {
        return properties.getProperty("smtp.username");
    }
    
    public static String getSMTPPassword() {
        return properties.getProperty("smtp.password");
    }
    
    public static String getFromEmail() {
        return properties.getProperty("email.from", "noreply@bookr.local");
    }
    
    public static String getFromName() {
        return properties.getProperty("email.from.name", "Bookr");
    }
    
    public static String getAppBaseUrl() {
        return properties.getProperty("app.base.url", "http://localhost:8080");
    }
    
    public static boolean isEmailEnabled() {
        return Boolean.parseBoolean(
            properties.getProperty("email.enabled", "true")
        );
    }
}