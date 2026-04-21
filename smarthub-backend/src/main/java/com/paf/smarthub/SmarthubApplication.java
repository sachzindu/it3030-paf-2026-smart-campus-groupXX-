package com.paf.smarthub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = "com.paf.smarthub")
public class SmarthubApplication {

	public static void main(String[] args) {
		SpringApplication.run(SmarthubApplication.class, args);
	}

}



