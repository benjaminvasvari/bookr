package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.model.Images;
import com.vizsgaremek.bookr.model.Companies;
import com.vizsgaremek.bookr.error.exception.ValidationException;
import com.vizsgaremek.bookr.error.exception.NotFoundException;
import java.util.List;

/**
 * Service for image operations
 * 
 * @author vben
 */
public class ImagesService {
    
    /**
     * Get company images (max 4)
     * 
     * @param companyId Company ID
     * @return List of images (can be empty)
     * @throws ValidationException if companyId is invalid
     * @throws NotFoundException if company doesn't exist or inactive
     */
    public List<Images> getCompanyImages(Integer companyId) {
        
        // 1. Input validation
        if (companyId == null || companyId <= 0) {
            throw ValidationException.invalidId("Company", companyId);
        }
        
        // 2. Company exists and active check
        Companies company = Companies.checkCompany(companyId);
        
        if (company == null) {
            throw NotFoundException.entity("Company", companyId);
        }
        
        if (!company.getIsActive() || company.getIsDeleted()) {
            throw NotFoundException.entityInactive("Company", companyId);
        }
        
        // 3. Get images (max 4, ordered by is_main DESC)
        List<Images> images = Images.getCompanyImages(companyId);
        
        // 4. Empty list is valid (not an error!)
        return images;
    }
}