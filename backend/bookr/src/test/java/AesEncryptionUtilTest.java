import com.vizsgaremek.bookr.util.AesEncryptionUtil;
import org.junit.Test;

import static org.junit.Assert.*;

public class AesEncryptionUtilTest {

    // ===== ENCRYPT =====

    @Test
    public void encrypt_nemNull() {
        String result = AesEncryptionUtil.encrypt("titkos szöveg");
        assertNotNull(result);
    }

    @Test
    public void encrypt_nem_plaintext() {
        String plaintext = "titkos szöveg";
        String encrypted = AesEncryptionUtil.encrypt(plaintext);
        assertNotEquals(plaintext, encrypted);
    }

    @Test
    public void encrypt_ugyanaz_kulonbozo_eredmeny_random_iv() {
        String plaintext = "ugyanaz";
        String enc1 = AesEncryptionUtil.encrypt(plaintext);
        String enc2 = AesEncryptionUtil.encrypt(plaintext);
        // Random IV miatt minden titkosítás különböző
        assertNotEquals(enc1, enc2);
    }

    @Test
    public void encrypt_base64_formatum() {
        String encrypted = AesEncryptionUtil.encrypt("teszt");
        // Base64 csak [A-Za-z0-9+/=] karaktereket tartalmaz
        assertTrue(encrypted.matches("^[A-Za-z0-9+/=]+$"));
    }

    // ===== DECRYPT =====

    @Test
    public void decrypt_visszaadja_eredetit() {
        String plaintext = "titkos adat";
        String encrypted = AesEncryptionUtil.encrypt(plaintext);
        String decrypted = AesEncryptionUtil.decrypt(encrypted);
        assertEquals(plaintext, decrypted);
    }

    @Test
    public void decrypt_ures_string() {
        String encrypted = AesEncryptionUtil.encrypt("");
        String decrypted = AesEncryptionUtil.decrypt(encrypted);
        assertEquals("", decrypted);
    }

    @Test
    public void decrypt_specialis_karakterek() {
        String plaintext = "JBSWY3DPEHPK3PXP!@#$%";
        String encrypted = AesEncryptionUtil.encrypt(plaintext);
        String decrypted = AesEncryptionUtil.decrypt(encrypted);
        assertEquals(plaintext, decrypted);
    }

    @Test
    public void decrypt_unicode() {
        String plaintext = "Magyar szöveg: áéíóöőüű";
        String encrypted = AesEncryptionUtil.encrypt(plaintext);
        String decrypted = AesEncryptionUtil.decrypt(encrypted);
        assertEquals(plaintext, decrypted);
    }

    @Test
    public void decrypt_hosszu_szoveg() {
        String plaintext = "A".repeat(500);
        String encrypted = AesEncryptionUtil.encrypt(plaintext);
        String decrypted = AesEncryptionUtil.decrypt(encrypted);
        assertEquals(plaintext, decrypted);
    }

    // ===== HIBÁS INPUT =====

    @Test(expected = RuntimeException.class)
    public void decrypt_invalid_base64_exception() {
        AesEncryptionUtil.decrypt("ez nem valid base64!!!");
    }

    @Test(expected = RuntimeException.class)
    public void decrypt_modositott_ciphertext_exception() {
        String encrypted = AesEncryptionUtil.encrypt("adat");
        // Utolsó karaktert módosítjuk → GCM auth tag ellenőrzés megbukik
        String tampered = encrypted.substring(0, encrypted.length() - 4) + "XXXX";
        AesEncryptionUtil.decrypt(tampered);
    }
}