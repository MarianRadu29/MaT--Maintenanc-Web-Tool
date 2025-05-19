package org.example;

import com.sun.net.httpserver.HttpServer;
import org.example.controller.AppointmentController;
import org.example.controller.AuthController;
import org.example.controller.RefreshController;
import org.example.controller.UserController;
import org.example.utils.DatabaseInitializer;
import org.example.utils.StaticFileHandler;

import java.net.InetSocketAddress;

public class Main {
    public static void main(String[] args) throws Exception {
//        DatabaseInitializer.initialize();
        HttpServer server = HttpServer.create(new InetSocketAddress(8001), 0);

        server.createContext("/api/register", new AuthController.Register());
        server.createContext("/api/login", new AuthController.Login());
        server.createContext("/api/user", new UserController.GetUserInfo());
        server.createContext("/api/refresh", new RefreshController.RefreshToken());
        server.createContext("/api/appointments/day/", new AppointmentController.GetDayAppointments());
        server.createContext("/api/appointment", new AppointmentController.SetAppointment());
        server.createContext("/api/appointment/media/", new AppointmentController.GetMedia());
        server.createContext("/api/appointments", new AppointmentController.GetAppointments());
        server.createContext("/", new StaticFileHandler("src/main/resources/public"));

        server.setExecutor(null);
        server.start();
        System.out.println("Server running on http://localhost:8001");
    }
}

// www.autocenteriasi.ro/ MODEL de front pt proiect