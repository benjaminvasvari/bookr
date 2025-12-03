/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.Logger to edit this template
 */
package com.vizsgaremek.bookr.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 *
 * @author vben
 */
public class Logger {

    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public enum Level {
        INFO, WARN, ERROR
    }

    /**
     * Log message to console
     */
    public static void log(Level level, String message) {
        String timestamp = LocalDateTime.now().format(formatter);
        String logMessage = String.format("[%s] %s - %s",
                level, timestamp, message);

        // Console output
        if (level == Level.ERROR) {
            System.err.println(logMessage);
        } else {
            System.out.println(logMessage);
        }
    }

    /**
     * Log message with exception stack trace (ERROR level only)
     */
    public static void log(Level level, String message, Throwable throwable) {
        log(level, message);

        if (level == Level.ERROR && throwable != null) {
            throwable.printStackTrace();
        }
    }
}
