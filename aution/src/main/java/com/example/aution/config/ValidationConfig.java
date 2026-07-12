package com.example.aution.config;

import jakarta.validation.Validation;
import jakarta.validation.ValidatorFactory;
import org.hibernate.validator.HibernateValidator;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.Validator;
import org.springframework.validation.beanvalidation.SpringValidatorAdapter;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.time.Clock;

@Configuration
public class ValidationConfig implements WebMvcConfigurer {

    @Override
    public Validator getValidator() {
        ValidatorFactory factory = Validation.byProvider(HibernateValidator.class)
                .configure()
                .clockProvider(Clock::systemUTC)
                .buildValidatorFactory();

        return new SpringValidatorAdapter(factory.getValidator());
    }
}