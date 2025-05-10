package org.example.utils;

import static org.mindrot.jbcrypt.BCrypt.*;

public class BCrypt {
    public static String hashPassword(String plainPassword) {
        // gensalt(rounds) – rounds e aproximativ 10–12 pentru producție
        String salt = gensalt(12);
        return hashpw(plainPassword, salt);
    }

    public static boolean checkPassword(String plainPassword, String hashed) {
        return checkpw(plainPassword, hashed);
    }
}

