package com.etendoerp.mainui;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SPAController {

    @RequestMapping(value = {"/{path:[^\\.]*}", "/*/{path:[^\\.]*}", "/*/*/{path:[^\\.]*}", "/*/*/*/{path:[^\\.]*}"})
    public String redirect() {
        return "forward:/index.html";
    }
}
