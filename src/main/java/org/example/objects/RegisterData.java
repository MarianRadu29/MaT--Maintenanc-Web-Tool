package org.example.objects;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterData extends LoginData {
    private String firstName;
    private String lastName;
    private String phoneNumber;

    public RegisterData(String firstName, String lastName, String password, String email, String phoneNumber) {
        super(email, password);
        this.phoneNumber = phoneNumber;
        this.firstName = firstName;
        this.lastName = lastName;
    }
}
