package com.vizsgaremek.bookr.controller;

import com.vizsgaremek.bookr.error.mapper.BookrExceptionMapper;

import javax.ws.rs.ApplicationPath;
import javax.ws.rs.core.Application;
import java.util.HashSet;
import java.util.Set;

/**
 * JAX-RS Application Configuration
 * Explicitly registers all providers and controllers
 */
@ApplicationPath("api")
public class ApplicationConfig extends Application {
    
    @Override
    public Set<Class<?>> getClasses() {
        Set<Class<?>> resources = new HashSet<>();
        
        // Exception Mapper
        resources.add(BookrExceptionMapper.class);
        
        // Controllers
        resources.add(AuthController.class);
        resources.add(CompaniesController.class);
        resources.add(ImagesController.class);
        resources.add(UsersController.class);
        
        
        return resources;
    }
}