package org.example.objects;

import lombok.Getter;

@Getter
public class User extends RegisterData {
    private int id;
    private int roleId;

    public User(String firstName, String lastName, String password, String email, int id, String phoneNumber, int roleId) {
        super(firstName, lastName, password, email, phoneNumber);
        this.id = id;
        this.roleId = roleId;
    }
}
