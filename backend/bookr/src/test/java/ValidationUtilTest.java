
import com.vizsgaremek.bookr.util.ValidationUtil;
import org.junit.Test;
import static org.junit.Assert.*;

/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

/**
 *
 * @author vben
 */
public class ValidationUtilTest {
    
    // ========== EMAIL TESZTEK ==========
    
    @Test
    public void testValidEmails() {
        assertTrue(ValidationUtil.isValidEmail("user@example.com"));
        assertTrue(ValidationUtil.isValidEmail("test.user@example.com"));
        assertTrue(ValidationUtil.isValidEmail("user+tag@example.co.uk"));
        assertTrue(ValidationUtil.isValidEmail("user_name@example.com"));
        assertTrue(ValidationUtil.isValidEmail("user123@test-domain.com"));
    }
    
    @Test
    public void testInvalidEmails() {
        assertFalse(ValidationUtil.isValidEmail(null));
        assertFalse(ValidationUtil.isValidEmail(""));
        assertFalse(ValidationUtil.isValidEmail("   "));
        assertFalse(ValidationUtil.isValidEmail("plaintext"));
        assertFalse(ValidationUtil.isValidEmail("@example.com"));
        assertFalse(ValidationUtil.isValidEmail("user@"));
        assertFalse(ValidationUtil.isValidEmail("user @example.com"));
        assertFalse(ValidationUtil.isValidEmail("user@exam ple.com"));
        assertFalse(ValidationUtil.isValidEmail("user..name@example.com"));
    }
    
    @Test
    public void testEmailWithWhitespace() {
        assertTrue(ValidationUtil.isValidEmail("  user@example.com  ")); // trim-eli
    }
    
    @Test
    public void testEmailTooLong() {
        String longEmail = "a".repeat(250) + "@example.com"; // > 254 karakter
        assertFalse(ValidationUtil.isValidEmail(longEmail));
    }
    
    // ========== JELSZÓ TESZTEK ==========
    
    @Test
    public void testValidPasswords() {
        assertTrue(ValidationUtil.isValidPassword("Password1!"));
        assertTrue(ValidationUtil.isValidPassword("MyP@ssw0rd"));
        assertTrue(ValidationUtil.isValidPassword("Str0ng#Pass"));
        assertTrue(ValidationUtil.isValidPassword("C0mpl3x!Pass"));
        assertTrue(ValidationUtil.isValidPassword("T3st@Pass123"));
    }
    
    @Test
    public void testPasswordTooShort() {
        assertFalse(ValidationUtil.isValidPassword("Pass1!"));  // csak 6 karakter
        assertFalse(ValidationUtil.isValidPassword("Abc1!"));   // csak 5 karakter
    }
    
    @Test
    public void testPasswordTooLong() {
        String longPassword = "A1!" + "a".repeat(130); // > 128 karakter
        assertFalse(ValidationUtil.isValidPassword(longPassword));
    }
    
    @Test
    public void testPasswordMissingLowerCase() {
        assertFalse(ValidationUtil.isValidPassword("PASSWORD1!"));
        assertFalse(ValidationUtil.isValidPassword("MYPASS123@"));
    }
    
    @Test
    public void testPasswordMissingUpperCase() {
        assertFalse(ValidationUtil.isValidPassword("password1!"));
        assertFalse(ValidationUtil.isValidPassword("mypass123@"));
    }
    
    @Test
    public void testPasswordMissingDigit() {
        assertFalse(ValidationUtil.isValidPassword("Password!"));
        assertFalse(ValidationUtil.isValidPassword("MyPass@word"));
    }
    
    @Test
    public void testPasswordMissingSpecialChar() {
        assertFalse(ValidationUtil.isValidPassword("Password1"));
        assertFalse(ValidationUtil.isValidPassword("MyPass123"));
    }
    
    @Test
    public void testPasswordNull() {
        assertFalse(ValidationUtil.isValidPassword(null));
    }
    
    @Test
    public void testPasswordEmpty() {
        assertFalse(ValidationUtil.isValidPassword(""));
    }
    
    @Test
    public void testPasswordWithAllSpecialChars() {
        assertTrue(ValidationUtil.isValidPassword("Pass123!@#$%^&*()_+-=[]{}|;:,.<>?"));
    }
    
    @Test
    public void testPasswordMinimumLength() {
        assertTrue(ValidationUtil.isValidPassword("Passw0rd!")); // pontosan 9 karakter
        assertTrue(ValidationUtil.isValidPassword("Test123!")); // pontosan 8 karakter
    }
    
    @Test
    public void testPasswordMaximumLength() {
        String maxPassword = "A1!" + "a".repeat(125); // pontosan 128 karakter
        assertTrue(ValidationUtil.isValidPassword(maxPassword));
    }
}
