package org.example.objects;

import lombok.AllArgsConstructor;
import lombok.Getter;


@Getter
@AllArgsConstructor
public class LoginData {
    private String email;
    private String password;
}