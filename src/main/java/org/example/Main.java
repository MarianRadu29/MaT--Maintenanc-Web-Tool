package org.example;

import com.sun.net.httpserver.HttpServer;
import io.github.cdimascio.dotenv.Dotenv;
import org.example.controller.*;
import org.example.utils.StaticFileHandler;

import java.net.InetSocketAddress;

public class Main {
    private final static int PORT;

    static {
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
        PORT = Integer.parseInt(dotenv.get("PORT","8081"));
    }

    public static void main(String[] args) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

        setupRoutes(server);

        server.start();
        System.out.println("Server running on http://localhost:" + PORT);
    }

    public static void setupRoutes(HttpServer server) {

        server.createContext("/api/register", new AuthController.Register());
        server.createContext("/api/login", new AuthController.Login());
        server.createContext("/api/logout",new AuthController.Logout());
        server.createContext("/api/session", new AuthController.Session());
        server.createContext("/api/user", new UserController.GetUserInfo());
        server.createContext("/api/user/",new UserController.UpdateUserRole());
        server.createContext("/api/users", new UserController.GetUsers());
        server.createContext("/api/user/update", new UserController.UpdateUserInfo());
        server.createContext("/api/user/delete/",new UserController.DeleteUser());
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
        server.createContext("/", new StaticFileHandler("src/main/java/org/example/view"));
    }
}