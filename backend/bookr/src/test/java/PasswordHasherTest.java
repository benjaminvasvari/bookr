import com.vizsgaremek.bookr.security.PasswordHasher;
import org.junit.Before;
import org.junit.Test;

import static org.junit.Assert.*;

public class PasswordHasherTest {

    private PasswordHasher hasher;

    @Before
    public void setup() {
        hasher = new PasswordHasher();
    }

    // ===== HASH FORMÁTUM =====

    @Test
    public void hash_nemNull() {
        String hash = hasher.hashPassword("Teszt123!");
        assertNotNull(hash);
    }

    @Test
    public void hash_argon2id_formatum() {
        String hash = hasher.hashPassword("Teszt123!");
        assertTrue(hash.startsWith("$argon2id$"));
    }

    @Test
    public void hash_hat_szegmens() {
        String hash = hasher.hashPassword("Teszt123!");
        // $argon2id$v=19$m=...$salt$hash → split '$' → 6 rész
        String[] parts = hash.split("\\$");
        assertEquals(6, parts.length);
    }

    // ===== VERIFY HELYES JELSZÓ =====

    @Test
    public void verify_helyes_jelszo_true() {
        String password = "Helyes_Jelszo1!";
        String hash = hasher.hashPassword(password);
        assertTrue(hasher.verifyPassword(password, hash));
    }

    @Test
    public void verify_helytelen_jelszo_false() {
        String hash = hasher.hashPassword("HelyesJelszo1!");
        assertFalse(hasher.verifyPassword("RosszJelszo1!", hash));
    }

    @Test
    public void verify_ures_jelszo_false() {
        String hash = hasher.hashPassword("HelyesJelszo1!");
        assertFalse(hasher.verifyPassword("", hash));
    }

    @Test
    public void verify_kis_nagy_betu_kulonbseg() {
        String hash = hasher.hashPassword("Jelszo123!");
        assertFalse(hasher.verifyPassword("jelszo123!", hash));
    }

    // ===== KÉT HASH KÜLÖNBÖZŐ (random salt) =====

    @Test
    public void ugyanaz_jelszo_kulonbozo_hash() {
        String password = "UgyanazonJelszo1!";
        String hash1 = hasher.hashPassword(password);
        String hash2 = hasher.hashPassword(password);
        assertNotEquals(hash1, hash2);
    }

    @Test
    public void kulonbozo_hash_mindketto_verify_igaz() {
        String password = "UgyanazonJelszo1!";
        String hash1 = hasher.hashPassword(password);
        String hash2 = hasher.hashPassword(password);
        assertTrue(hasher.verifyPassword(password, hash1));
        assertTrue(hasher.verifyPassword(password, hash2));
    }

    // ===== HIBÁS HASH FORMÁTUM =====

    @Test
    public void verify_invalid_hash_false() {
        assertFalse(hasher.verifyPassword("Jelszo123!", "ez_nem_valid_hash"));
    }

    @Test
    public void verify_ures_hash_false() {
        assertFalse(hasher.verifyPassword("Jelszo123!", ""));
    }

    // ===== SPECIÁLIS KARAKTEREK =====

    @Test
    public void hash_es_verify_specialis_karakterek() {
        String password = "P@$$w0rd!#&*()";
        String hash = hasher.hashPassword(password);
        assertTrue(hasher.verifyPassword(password, hash));
    }

    @Test
    public void hash_es_verify_unicode() {
        String password = "Jelszó123!Á";
        String hash = hasher.hashPassword(password);
        assertTrue(hasher.verifyPassword(password, hash));
    }

    // ===== HOSSZÚ JELSZÓ =====

    @Test
    public void hash_es_verify_hosszu_jelszo() {
        String password = "A1!" + "a".repeat(100);
        String hash = hasher.hashPassword(password);
        assertTrue(hasher.verifyPassword(password, hash));
    }
}