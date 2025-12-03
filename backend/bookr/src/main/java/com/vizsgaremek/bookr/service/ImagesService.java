package com.vizsgaremek.bookr.service;

import com.vizsgaremek.bookr.model.Images;
import com.vizsgaremek.bookr.model.Companies;
import com.vizsgaremek.bookr.error.exception.ValidationException;
import com.vizsgaremek.bookr.error.exception.NotFoundException;
import com.vizsgaremek.bookr.model.Users;
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

    public Images getUserProfilePicture(Integer userId) {

        // 1. Input validation
        if (userId == null || userId <= 0) {
            throw ValidationException.invalidId("User", userId);
        }

        // 2. Company exists and active check
        Users user = Users.checkUser(userId);

        if (user == null) {
            throw NotFoundException.entity("User", userId);
        }

        if (!user.getIsActive() || user.getIsDeleted()) {
            throw NotFoundException.entityInactive("User", userId);
        }

        // 3. Get images (max 4, ordered by is_main DESC)
        Images image = Images.getUserProfilePicture(userId);

        // 4. Empty list is valid (not an error!)
        return image;
    }
}
