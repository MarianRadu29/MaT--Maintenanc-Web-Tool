package org.example.utils;

import io.github.cdimascio.dotenv.Dotenv;
import jakarta.mail.*;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;

import java.util.Properties;

public class EmailSender {

    private static final String fromEmail;
    private static final String password;

    static{
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
        fromEmail = dotenv.get("EMAIL_FROM");
        password = dotenv.get("EMAIL_PASSWORD");
    }
    public static void sendEmail(String toEmail, String subject, String body) {
        Properties props = new Properties();
        props.put("mail.smtp.host", "smtp.gmail.com");
        props.put("mail.smtp.port", "587");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");

        Session session = Session.getInstance(props, new Authenticator() {
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(fromEmail, password);
            }
        });
        try {
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(fromEmail));
            message.setRecipients(
                    Message.RecipientType.TO, InternetAddress.parse(toEmail));
            message.setSubject(subject);

            message.setContent(body, "text/html; charset=utf-8");

            Transport.send(message);
        } catch (MessagingException e) {
            e.printStackTrace();
        }
    }
}

