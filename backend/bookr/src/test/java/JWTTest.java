import com.vizsgaremek.bookr.model.Users;
import com.vizsgaremek.bookr.security.JWT;
import org.junit.BeforeClass;
import org.junit.Test;

import static org.junit.Assert.*;

public class JWTTest {

    private static Users testUser;

    @BeforeClass
    public static void setup() {
        testUser = new Users();
        testUser.setId(42);
        testUser.setEmail("teszt@example.com");
        testUser.setRolesString("owner");
        testUser.setCompanyIdInt(1);
    }

    // ===== ACCESS TOKEN =====

    @Test
    public void accessToken_letrehozas_nemNull() {
        String token = JWT.createAccessToken(testUser);
        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    public void accessToken_valid() {
        String token = JWT.createAccessToken(testUser);
        Boolean result = JWT.validateAccessToken(token);
        assertEquals(Boolean.TRUE, result);
    }

    @Test
    public void accessToken_userId_kinyerheto() {
        String token = JWT.createAccessToken(testUser);
        Integer userId = JWT.getUserIdFromAccessToken(token);
        assertEquals(Integer.valueOf(42), userId);
    }

    @Test
    public void accessToken_email_kinyerheto() {
        String token = JWT.createAccessToken(testUser);
        String email = JWT.getEmailFromAccessToken(token);
        assertEquals("teszt@example.com", email);
    }

    @Test
    public void accessToken_companyId_kinyerheto() {
        String token = JWT.createAccessToken(testUser);
        Integer companyId = JWT.getCompanyIdFromAccessToken(token);
        assertEquals(Integer.valueOf(1), companyId);
    }

    @Test
    public void accessToken_role_kinyerheto() {
        String token = JWT.createAccessToken(testUser);
        String role = JWT.getRolesFromAccessToken(token);
        assertEquals("owner", role);
    }

    @Test
    public void accessToken_bestRole_kinyerheto() {
        String token = JWT.createAccessToken(testUser);
        String bestRole = JWT.getUserBestRoleFromAccessToken(token);
        assertEquals("owner", bestRole);
    }

    @Test
    public void accessToken_hamis_token_invalid() {
        Boolean result = JWT.validateAccessToken("ez.nem.valid");
        assertEquals(Boolean.FALSE, result);
    }

    @Test
    public void accessToken_ures_string_invalid() {
        Boolean result = JWT.validateAccessToken("");
        assertEquals(Boolean.FALSE, result);
    }

    @Test
    public void accessToken_null_kezeles() {
        Integer userId = JWT.getUserIdFromAccessToken(null);
        assertNull(userId);
    }

    @Test
    public void accessToken_refreshTokentel_nem_valid() {
        // refresh token-t access tokenként validálva false-t kell kapni
        String refreshToken = JWT.createRefreshToken(testUser);
        Boolean result = JWT.validateAccessToken(refreshToken);
        assertEquals(Boolean.FALSE, result);
    }

    // ===== REFRESH TOKEN =====

    @Test
    public void refreshToken_letrehozas_nemNull() {
        String token = JWT.createRefreshToken(testUser);
        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    public void refreshToken_valid() {
        String token = JWT.createRefreshToken(testUser);
        Boolean result = JWT.validateRefreshToken(token);
        assertEquals(Boolean.TRUE, result);
    }

    @Test
    public void refreshToken_userId_kinyerheto() {
        String token = JWT.createRefreshToken(testUser);
        Integer userId = JWT.getUserIdFromRefreshToken(token);
        assertEquals(Integer.valueOf(42), userId);
    }

    @Test
    public void refreshToken_accessTokennel_nem_valid() {
        String accessToken = JWT.createAccessToken(testUser);
        Boolean result = JWT.validateRefreshToken(accessToken);
        assertEquals(Boolean.FALSE, result);
    }

    // ===== JTI =====

    @Test
    public void accessToken_jti_egyedi() {
        String token1 = JWT.createAccessToken(testUser);
        String token2 = JWT.createAccessToken(testUser);
        String jti1 = JWT.getJtiFromAccessToken(token1);
        String jti2 = JWT.getJtiFromAccessToken(token2);
        assertNotNull(jti1);
        assertNotNull(jti2);
        assertNotEquals(jti1, jti2);
    }

    // ===== NULL COMPANY ID =====

    @Test
    public void accessToken_nullCompanyId_kezeles() {
        Users userBezCeg = new Users();
        userBezCeg.setId(99);
        userBezCeg.setEmail("client@example.com");
        userBezCeg.setRolesString("client");
        userBezCeg.setCompanyIdInt(null);

        String token = JWT.createAccessToken(userBezCeg);
        assertNotNull(token);

        Integer companyId = JWT.getCompanyIdFromAccessToken(token);
        assertNull(companyId);
    }
}