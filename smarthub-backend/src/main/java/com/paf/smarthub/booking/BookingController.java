package com.paf.smarthub.booking;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BookingController {

    @GetMapping("/")
    public String greet(){
        return "Hello world";

    }
}
