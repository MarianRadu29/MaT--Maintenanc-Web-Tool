package org.example.objects;

import lombok.Getter;
import lombok.AllArgsConstructor;


@Getter
@AllArgsConstructor
public class LoginData {
    private String email;
    private String password;
}