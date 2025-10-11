
import com.vizsgaremek.bookr.config.EnvConfig;

/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

/**
 *
 * @author vben
 */
public class TestEnv {
    public static void main(String[] args) {
        String secret = EnvConfig.getJwtSecret();
        long expiration = EnvConfig.getJwtExpirationDays();

        System.out.println("✅ .env betöltve:");
        System.out.println("JWT_SECRET = " + secret);
        System.out.println("JWT_EXPIRATION_DAYS = " + expiration);
    }
}
