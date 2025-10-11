package com.vizsgaremek.bookr.config;


import io.github.cdimascio.dotenv.Dotenv;

/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

/**
 *
 * @author vben
 */
public class EnvConfig {
    private static final Dotenv dotenv = Dotenv.load();

    public static String getJwtSecret() {
        return dotenv.get("JWT_SECRET");
    }

    public static long getJwtExpirationDays() {
        return Long.parseLong(dotenv.get("JWT_EXPIRATION_DAYS", "1"));
    }
}