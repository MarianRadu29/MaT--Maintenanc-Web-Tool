package org.example;

import com.sun.net.httpserver.HttpServer;
import org.example.controller.*;
import org.example.utils.StaticFileHandler;

import java.net.InetSocketAddress;

public class Main {
    public static void main(String[] args) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress(8001), 0);

        setupRoutes(server);

        server.start();
        System.out.println("Server running on http://localhost:8001");
    }

    public static void setupRoutes(HttpServer server) {

        server.createContext("/api/register", new AuthController.Register());
        server.createContext("/api/login", new AuthController.Login());
        server.createContext("/api/user", new UserController.GetUserInfo());
        server.createContext("/api/user/update", new UserController.UpdateUserInfo());
        server.createContext("/api/forgot-password",new AuthController.ForgotPassword());
        server.createContext("/api/validate-reset-token",new AuthController.ValidateTokenResetPassword());
        server.createContext("/api/reset-password",new AuthController.ResetPassword());
        server.createContext("/api/appointments", new AppointmentController.GetAppointments());
        server.createContext("/api/appointments/self", new AppointmentController.GetAppointmentsSelf());
        server.createContext("/api/appointments/day/", new AppointmentController.GetDayAppointments());
        server.createContext("/api/appointment", new AppointmentController.SetAppointment());
        server.createContext("/api/appointment/update", new AppointmentController.UpdateAppointment());
        server.createContext("/api/appointment/media/", new AppointmentController.GetMedia());
        server.createContext("/api/inventory", new InventoryController.GetInventory());
        server.createContext("/api/inventory/categories", new InventoryController.GetCategory());
        server.createContext("/api/inventory/add", new InventoryController.AddItem());
        server.createContext("/api/inventory/delete/", new InventoryController.DeleteItem());
        server.createContext("/api/inventory/update/", new InventoryController.UpdateItem());
        server.createContext("/api/import", new InventoryController.ImportInventory());
        server.createContext("/api/export", new InventoryController.ExportInventory());
        server.createContext("/", new StaticFileHandler("src/main/resources/public"));


        // Adaugă alte rute aici
    }
}



// www.autocenteriasi.ro/ MODEL de front pt proiect
// `dotenv` pentru a nu mai avea hardcodate datele de conectare la baza de date sau alte date sensibile
// securizare pentru XSS, CSRF, CORS

