package org.example.objects;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserData extends RegisterData {
    private int id;
    private int roleId;

    public UserData(String firstName, String lastName, String password, String email, int id, String phoneNumber, int roleId) {
        super(firstName, lastName, password, email, phoneNumber);
        this.id = id;
        this.roleId = roleId;
    }
    @Override
    public String toString() {
        return "UserData{" +
                        "id=" + id +
                        ", roleId=" + roleId +
                        ", firstName='" + getFirstName() + '\'' +
                        ", lastName='" + getLastName() + '\'' +
                        ", password='" + getPassword() + '\'' +
                        ", email='" + getEmail() + '\'' +
                        ", phoneNumber='" + getPhoneNumber() + '\'' +
                        '}';
    }
}
