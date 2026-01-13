/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.util;

import javax.enterprise.context.ApplicationScoped;
import java.util.Arrays;
import java.util.List;

/**
 *
 * @author vben
 */
@ApplicationScoped
public class RoleChecker {
    
    // Role konstansok - egyszerűbb kezelhetőség miatt
    public static final String SUPERADMIN = "superadmin";
    public static final String ADMIN = "admin";
    public static final String OWNER = "owner";
    public static final String STAFF = "staff";
    public static final String CLIENT = "client";
    
    /**
     * Ellenőrzi, hogy a user rendelkezik-e legalább az egyik megadott role-lal.
     * 
     * @param userRoles A user role-jainak listája (comma-separated string vagy List)
     * @param requiredRoles A szükséges role-ok (legalább egyik kell)
     * @return true, ha van match
     */
    public boolean hasAnyRole(String userRoles, String... requiredRoles) {
        if (userRoles == null || userRoles.isEmpty()) {
            return false;
        }
        
        List<String> userRoleList = Arrays.asList(userRoles.toLowerCase().split(",\\s*"));
        
        return Arrays.stream(requiredRoles)
                .map(String::toLowerCase)
                .anyMatch(userRoleList::contains);
    }
    
    /**
     * Ellenőrzi, hogy a user rendelkezik-e MINDEGYIK megadott role-lal.
     * 
     * @param userRoles A user role-jainak listája
     * @param requiredRoles A szükséges role-ok (mindegyik kell)
     * @return true, ha minden role megvan
     */
    public boolean hasAllRoles(String userRoles, String... requiredRoles) {
        if (userRoles == null || userRoles.isEmpty()) {
            return false;
        }
        
        List<String> userRoleList = Arrays.asList(userRoles.toLowerCase().split(",\\s*"));
        
        return Arrays.stream(requiredRoles)
                .map(String::toLowerCase)
                .allMatch(userRoleList::contains);
    }
    
    /**
     * Ellenőrzi, hogy a user superadmin-e.
     */
    public boolean isSuperadmin(String userRoles) {
        return hasAnyRole(userRoles, SUPERADMIN);
    }
    
    /**
     * Ellenőrzi, hogy a user admin vagy superadmin-e.
     */
    public boolean isAdminOrAbove(String userRoles) {
        return hasAnyRole(userRoles, SUPERADMIN, ADMIN, OWNER);
    }
    
    /**
     * Ellenőrzi, hogy a user owner, admin vagy superadmin-e.
     */
    public boolean isOwnerOrAbove(String userRoles) {
        return hasAnyRole(userRoles, SUPERADMIN, ADMIN, OWNER);
    }
    
    /**
     * Ellenőrzi, hogy a user staff, owner, admin vagy superadmin-e.
     */
    public boolean isStaffOrAbove(String userRoles) {
        return hasAnyRole(userRoles, SUPERADMIN, ADMIN, OWNER, STAFF);
    }
}
