package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.model.TwoFactorRecoveryCodes;
import com.vizsgaremek.bookr.model.Users;
import com.vizsgaremek.bookr.util.AesEncryptionUtil;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import com.warrenstrange.googleauth.GoogleAuthenticatorQRGenerator;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;

public class TwoFactorService {

    private static final GoogleAuthenticator gAuth = new GoogleAuthenticator();
    private static final int RECOVERY_CODE_COUNT = 8;
    private static final String ISSUER = "Bookr";

    // -------------------------------------------------------
    // SETUP — secret generálás + QR URL visszaadás
    // -------------------------------------------------------

    public static String generateSecret() {
        GoogleAuthenticatorKey key = gAuth.createCredentials();
        return key.getKey(); // Base32 plain secret
    }

    public static String getQrUrl(String email, String plainSecret) {
        return GoogleAuthenticatorQRGenerator.getOtpAuthTotpURL(ISSUER, email,
                new GoogleAuthenticatorKey.Builder(plainSecret).build());
    }

    // -------------------------------------------------------
    // CONFIRM — TOTP kód ellenőrzés + 2FA bekapcsolás
    // -------------------------------------------------------

    public static boolean verifyCode(String plainSecret, int code) {
        return gAuth.authorize(plainSecret, code);
    }

    public static boolean enableTwoFactor(Integer userId, String plainSecret) {
        String encryptedSecret = AesEncryptionUtil.encrypt(plainSecret);
        return Users.enableTwoFactor(userId, encryptedSecret);
    }

    // -------------------------------------------------------
    // RECOVERY CODES — generálás + mentés
    // -------------------------------------------------------

    /**
     * Generál 8 plain recovery code-ot, elmenti hashelt formában,
     * visszaadja a plain kódokat (user csak egyszer látja)
     */
    public static List<String> generateAndSaveRecoveryCodes(Integer userId) {
        List<String> plainCodes = new ArrayList<>();
        List<String> hashedCodes = new ArrayList<>();

        SecureRandom random = new SecureRandom();

        for (int i = 0; i < RECOVERY_CODE_COUNT; i++) {
            // XXXX-XXXX-XXXX formátum — olvasható, de elég véletlenszerű
            String code = String.format("%04X-%04X-%04X",
                    random.nextInt(0xFFFF),
                    random.nextInt(0xFFFF),
                    random.nextInt(0xFFFF));
            plainCodes.add(code);
            hashedCodes.add(hashRecoveryCode(code));
        }

        boolean saved = TwoFactorRecoveryCodes.saveAll(userId, hashedCodes);
        if (!saved) {
            return null;
        }

        return plainCodes;
    }

    // -------------------------------------------------------
    // STATUS — 2FA állapot lekérdezés
    // -------------------------------------------------------

    public static Users getTwoFactorStatus(Integer userId) {
        return Users.getTwoFactorStatus(userId);
    }

    // -------------------------------------------------------
    // DISABLE
    // -------------------------------------------------------

    public static boolean disableTwoFactor(Integer userId, int totpCode) {
        Users user = Users.getTwoFactorStatus(userId);
        if (user == null || !user.getTwoFactorEnabled()) {
            return false;
        }

        String plainSecret = AesEncryptionUtil.decrypt(user.getTwoFactorSecret());
        if (!verifyCode(plainSecret, totpCode)) {
            return false;
        }

        // Recovery code-ok törlése + 2FA kikapcsolása
        TwoFactorRecoveryCodes.deleteAllByUserId(userId);
        return Users.disableTwoFactor(userId);
    }

    // -------------------------------------------------------
    // HELPER
    // -------------------------------------------------------

    private static String hashRecoveryCode(String plainCode) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(plainCode.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception ex) {
            throw new RuntimeException("Recovery code hashing failed", ex);
        }
    }
}