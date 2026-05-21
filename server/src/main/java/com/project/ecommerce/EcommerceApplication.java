package com.project.ecommerce;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.stream.Stream;

@SpringBootApplication
@EnableScheduling
public class EcommerceApplication {

	public static void main(String[] args) {
		loadEnv();
		SpringApplication.run(EcommerceApplication.class, args);
	}

	private static void loadEnv() {
		if (Files.exists(Paths.get(".env"))) {
			try (Stream<String> lines = Files.lines(Paths.get(".env"))) {
				lines.map(String::trim)
						.filter(line -> !line.isEmpty() && !line.startsWith("#") && line.contains("="))
						.forEach(line -> {
							String[] parts = line.split("=", 2);
							String key = parts[0].trim();
							String value = parts[1].trim();
							// Remove quotes if present
							if (value.startsWith("\"") && value.endsWith("\"")) {
								value = value.substring(1, value.length() - 1);
							} else if (value.startsWith("'") && value.endsWith("'")) {
								value = value.substring(1, value.length() - 1);
							}
							System.setProperty(key, value);
						});
			} catch (IOException e) {
				System.err.println("Could not load .env file: " + e.getMessage());
			}
		}
	}

}
