package com.vizsgaremek.bookr.util;

import com.vizsgaremek.bookr.config.EnvConfig;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

public class AesEncryptionUtil {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;   // 96 bit — GCM standard
    private static final int GCM_TAG_LENGTH = 128;  // 128 bit auth tag

    private static final String SECRET_KEY;

    static {
        SECRET_KEY = EnvConfig.getTwoFactorEncryptionKey();
    }

    private static SecretKey getKey() {
        byte[] keyBytes = SECRET_KEY.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return new SecretKeySpec(keyBytes, "AES");
    }

    public static String encrypt(String plaintext) {
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, getKey(), new GCMParameterSpec(GCM_TAG_LENGTH, iv));

            byte[] encrypted = cipher.doFinal(plaintext.getBytes(java.nio.charset.StandardCharsets.UTF_8));

            // IV + ciphertext együtt kerül Base64-be
            byte[] combined = new byte[iv.length + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(encrypted, 0, combined, iv.length, encrypted.length);

            return Base64.getEncoder().encodeToString(combined);

        } catch (Exception ex) {
            ex.printStackTrace();
            throw new RuntimeException("Encryption failed", ex);
        }
    }

    public static String decrypt(String ciphertext) {
        try {
            byte[] combined = Base64.getDecoder().decode(ciphertext);

            // IV kiszedése az elejéről
            byte[] iv = new byte[GCM_IV_LENGTH];
            System.arraycopy(combined, 0, iv, 0, iv.length);

            byte[] encrypted = new byte[combined.length - iv.length];
            System.arraycopy(combined, iv.length, encrypted, 0, encrypted.length);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, getKey(), new GCMParameterSpec(GCM_TAG_LENGTH, iv));

            byte[] decrypted = cipher.doFinal(encrypted);
            return new String(decrypted, java.nio.charset.StandardCharsets.UTF_8);

        } catch (Exception ex) {
            ex.printStackTrace();
            throw new RuntimeException("Decryption failed", ex);
        }
    }
}