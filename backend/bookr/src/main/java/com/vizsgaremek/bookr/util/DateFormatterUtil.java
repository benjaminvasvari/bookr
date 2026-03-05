package com.vizsgaremek.bookr.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Date;

/**
 * Központosított, thread-safe dátum/idő formatter konstansok.
 * A java.time.DateTimeFormatter immutable és thread-safe,
 * szemben a java.text.SimpleDateFormat-tal, ezért statikus konstansként
 * biztonságosan használható párhuzamos JAX-RS kérések esetén is.
 */
public final class DateFormatterUtil {

    /** "yyyy-MM-dd HH:mm:ss" – DB timestamp parse/format (pl. created_at) */
    public static final DateTimeFormatter TIMESTAMP = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /** "HH:mm" – nyitvatartási idők és foglalási időpontok */
    public static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm");

    /** "HH:mm:ss" – másodpercet tartalmazó időpontok (pl. foglalás start/end) */
    public static final DateTimeFormatter TIME_FULL = DateTimeFormatter.ofPattern("HH:mm:ss");

    /** "yyyy-MM-dd" – dátum JSON mezőkhöz */
    public static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /** "yyyy. MM. dd." – olvasható megjelenítéshez (értékelések, email) */
    public static final DateTimeFormatter DATE_HU = DateTimeFormatter.ofPattern("yyyy. MM. dd.");

    private DateFormatterUtil() { /* nem példányosítható */ }

    /**
     * java.util.Date (ill. Timestamp) → formázott String.
     * Helyettesíti: simpleDateFormat.format(date)
     */
    public static String format(Date date, DateTimeFormatter dtf) {
        if (date == null) return null;
        return date.toInstant().atZone(ZoneId.systemDefault()).format(dtf);
    }

    /**
     * "yyyy-MM-dd HH:mm:ss" String → java.util.Date.
     * Helyettesíti: Users.formatter.parse(str)
     */
    public static Date parseTimestamp(String str) {
        if (str == null) return null;
        LocalDateTime ldt = LocalDateTime.parse(str, TIMESTAMP);
        return Date.from(ldt.atZone(ZoneId.systemDefault()).toInstant());
    }

    /**
     * "HH:mm" String → java.util.Date.
     * Helyettesíti: OpeningHours.timeFormatter.parse(str)
     */
    public static Date parseTime(String str) {
        if (str == null) return null;
        LocalTime lt = LocalTime.parse(str, TIME);
        return Date.from(lt.atDate(LocalDate.of(1970, 1, 1)).atZone(ZoneId.systemDefault()).toInstant());
    }

    /**
     * "HH:mm:ss" String → java.util.Date.
     * Helyettesíti: SimpleDateFormat("HH:mm:ss").parse(str)
     */
    public static Date parseTimeFull(String str) {
        if (str == null) return null;
        LocalTime lt = LocalTime.parse(str, TIME_FULL);
        return Date.from(lt.atDate(LocalDate.of(1970, 1, 1)).atZone(ZoneId.systemDefault()).toInstant());
    }
}
