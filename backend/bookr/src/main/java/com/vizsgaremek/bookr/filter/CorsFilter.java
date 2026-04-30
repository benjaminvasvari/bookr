package com.vizsgaremek.bookr.filter;

import com.vizsgaremek.bookr.config.EnvConfig;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerResponseContext;
import javax.ws.rs.container.ContainerResponseFilter;
import javax.ws.rs.ext.Provider;
import java.io.IOException;

@Provider
public class CorsFilter implements ContainerResponseFilter {

    @Override
    public void filter(ContainerRequestContext requestContext, 
                      ContainerResponseContext responseContext) throws IOException {
        
        // Allow frontend origin
        responseContext.getHeaders().add("Access-Control-Allow-Origin", EnvConfig.getAppBaseUrl());
        
        // Allow HTTP methods
        responseContext.getHeaders().add("Access-Control-Allow-Methods", 
            "GET, POST, PUT, DELETE, OPTIONS, HEAD");
        
        // Allow headers
        responseContext.getHeaders().add("Access-Control-Allow-Headers", 
            "Content-Type, Authorization, X-Requested-With");
        
        // Allow credentials (cookies, authorization headers)
        responseContext.getHeaders().add("Access-Control-Allow-Credentials", "true");
        
        // Cache preflight for 1 hour
        responseContext.getHeaders().add("Access-Control-Max-Age", "3600");
    }
}