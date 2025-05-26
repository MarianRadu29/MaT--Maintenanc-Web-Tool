package org.example.objects;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
@AllArgsConstructor
public class LoginData {
    private String email;
    private String password;
}