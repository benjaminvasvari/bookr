/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.util;

import java.util.regex.Pattern;

/**
 *
 * @author vben
 */
public class ValidationUtil {

    // Kötelező: local@domain.tld struktúra, domain-ben legalább egy pont
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@" +
        "(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$"
    );

    // +36 vagy 06 prefix, majd 2 jegyű körzetszám, majd 7 jegyű szám (szóközök/kötőjelek opcionálisan)
    private static final Pattern PHONE_PATTERN = Pattern.compile(
        "^(\\+36|06)(20|30|31|50|70|71)[0-9]{7}$"
    );

    // http://, https://, www. mind elfogadott; kötelező legalább egy pont a domainban
    private static final Pattern URL_PATTERN = Pattern.compile(
        "^(https?://|www\\.)" +
        "[a-zA-Z0-9-]+(\\.[a-zA-Z0-9-]+)+" +
        "([/?#][^\\s]*)?$"
    );

    private static final int PASSWORD_MIN_LENGTH = 8;
    private static final int PASSWORD_MAX_LENGTH = 128;

    /**
     * Email cím validálása.
     * Követelmények:
     * - Nem üres
     * - Maximum 254 karakter
     * - local@domain.tld struktúra
     * - Domain részben kötelező legalább egy pont (pl. gmail.com)
     */
    public static boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }

        email = email.trim();

        if (email.length() > 254) {
            return false;
        }

        return EMAIL_PATTERN.matcher(email).matches();
    }

    /**
     * Magyar telefonszám validálása.
     * Elfogadott formátumok:
     * - +36701234567  (nemzetközi)
     * - 06701234567   (belföldi)
     * Elfogadott mobilszolgáltatók: 20, 30, 31, 50, 70, 71
     */
    public static boolean isValidHungarianPhone(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return false;
        }

        // Szóközök és kötőjelek eltávolítása az ellenőrzés előtt
        String normalized = phone.trim().replaceAll("[\\s-]", "");

        return PHONE_PATTERN.matcher(normalized).matches();
    }

    /**
     * Weboldal URL validálása.
     * Elfogadott formátumok:
     * - https://pelda.hu
     * - http://pelda.hu
     * - www.pelda.hu
     * Elvárt: legalább egy pont a domainban.
     */
    public static boolean isValidUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return false;
        }

        url = url.trim();

        if (url.length() > 2048) {
            return false;
        }

        return URL_PATTERN.matcher(url).matches();
    }

    /**
     * Jelszó validálása.
     * Követelmények:
     * - Minimum 8 karakter
     * - Maximum 128 karakter
     * - Legalább 1 kisbetű
     * - Legalább 1 nagybetű
     * - Legalább 1 szám
     * - Legalább 1 speciális karakter
     */
    public static boolean isValidPassword(String password) {
        if (password == null) {
            return false;
        }

        if (password.length() < PASSWORD_MIN_LENGTH || password.length() > PASSWORD_MAX_LENGTH) {
            return false;
        }

        boolean hasLowerCase = false;
        boolean hasUpperCase = false;
        boolean hasDigit = false;
        boolean hasSpecialChar = false;

        for (char c : password.toCharArray()) {
            if (Character.isLowerCase(c)) {
                hasLowerCase = true;
            } else if (Character.isUpperCase(c)) {
                hasUpperCase = true;
            } else if (Character.isDigit(c)) {
                hasDigit = true;
            } else if (isSpecialCharacter(c)) {
                hasSpecialChar = true;
            }
        }

        return hasLowerCase && hasUpperCase && hasDigit && hasSpecialChar;
    }

    private static boolean isSpecialCharacter(char c) {
        return "!@#$%^&*()_+-=[]{}|;:,.<>?".indexOf(c) >= 0;
    }
}