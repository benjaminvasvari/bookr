package com.vizsgaremek.bookr.security;

import com.vizsgaremek.bookr.config.EnvConfig;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import javax.enterprise.context.ApplicationScoped;
import org.bouncycastle.crypto.generators.Argon2BytesGenerator;
import org.bouncycastle.crypto.params.Argon2Parameters;

/**
 * Jelszó hashelés Argon2id algoritmussal Konfigurációt az EnvConfig-ból olvassa
 */
@ApplicationScoped
public class PasswordHasher {

    private final int SALT_LENGTH;
    private final int HASH_LENGTH;
    private final int ITERATIONS;
    private final int MEMORY;
    private final int PARALLELISM;

    private final SecureRandom secureRandom;

    public PasswordHasher() {
        // Paraméterek beolvasása EnvConfig-ból
        this.SALT_LENGTH = EnvConfig.getArgon2SaltLength();
        this.HASH_LENGTH = EnvConfig.getArgon2HashLength();
        this.ITERATIONS = EnvConfig.getArgon2Iterations();
        this.MEMORY = EnvConfig.getArgon2Memory();
        this.PARALLELISM = EnvConfig.getArgon2Parallelism();

        this.secureRandom = new SecureRandom();
    }

    /**
     * Jelszó hashelése Argon2id-vel
     */
    public String hashPassword(String password) {
        byte[] salt = generateSalt();
        byte[] hash = argon2Hash(password, salt);

        // Formátum: $argon2id$v=19$m=65536,t=3,p=1$salt$hash
        return String.format("$argon2id$v=19$m=%d,t=%d,p=%d$%s$%s",
                MEMORY, ITERATIONS, PARALLELISM,
                Base64.getEncoder().withoutPadding().encodeToString(salt),
                Base64.getEncoder().withoutPadding().encodeToString(hash));
    }

    /**
     * Jelszó ellenőrzése
     */
    public boolean verifyPassword(String password, String hashedPassword) {
        String[] parts = hashedPassword.split("\\$");

        if (parts.length != 6 || !parts[1].equals("argon2id")) {
            return false;
        }

        // Paraméterek kiolvasása a hash-ből
        String[] params = parts[3].split(",");
        int storedMemory = Integer.parseInt(params[0].substring(2));
        int storedIterations = Integer.parseInt(params[1].substring(2));
        int storedParallelism = Integer.parseInt(params[2].substring(2));

        byte[] salt = Base64.getDecoder().decode(parts[4]);
        byte[] expectedHash = Base64.getDecoder().decode(parts[5]);

        // Hash újraszámítása a tárolt paraméterekkel
        byte[] actualHash = argon2Hash(password, salt, storedMemory, storedIterations, storedParallelism);

        return slowEquals(expectedHash, actualHash);
    }

    private byte[] generateSalt() {
        byte[] salt = new byte[SALT_LENGTH];
        secureRandom.nextBytes(salt);
        return salt;
    }

    private byte[] argon2Hash(String password, byte[] salt) {
        return argon2Hash(password, salt, MEMORY, ITERATIONS, PARALLELISM);
    }

    private byte[] argon2Hash(String password, byte[] salt, int memory, int iterations, int parallelism) {
        Argon2Parameters params = new Argon2Parameters.Builder(Argon2Parameters.ARGON2_id)
                .withSalt(salt)
                .withIterations(iterations)
                .withMemoryAsKB(memory)
                .withParallelism(parallelism)
                .build();

        Argon2BytesGenerator generator = new Argon2BytesGenerator();
        generator.init(params);

        byte[] hash = new byte[HASH_LENGTH];
        generator.generateBytes(password.getBytes(StandardCharsets.UTF_8), hash);

        return hash;
    }

    /**
     * Timing attack elleni védelem
     */
    private boolean slowEquals(byte[] a, byte[] b) {
        int diff = a.length ^ b.length;
        for (int i = 0; i < a.length && i < b.length; i++) {
            diff |= a[i] ^ b[i];
        }
        return diff == 0;
    }
}
