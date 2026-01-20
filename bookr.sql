-- phpMyAdmin SQL Dump
-- version 5.1.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3307
-- Generation Time: Jan 20, 2026 at 12:04 PM
-- Server version: 5.7.24
-- PHP Version: 8.3.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bookr`
--
CREATE DATABASE IF NOT EXISTS `bookr` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci;
USE `bookr`;

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `activateStaff` (IN `staffIdIN` INT)   BEGIN
    -- Ellenőrzi, hogy a staff létezik
    IF NOT EXISTS (
        SELECT 1 FROM `staff` 
        WHERE `id` = staffIdIN
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Staff not found';
    END IF;
    
    -- Ellenőrzi, hogy tényleg inaktív-e
    IF EXISTS (
        SELECT 1 FROM `staff` 
        WHERE `id` = staffIdIN 
          AND `is_active` = TRUE
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Staff is already active';
    END IF;
    
    -- Staff aktiválása
    UPDATE `staff`
    SET 
        `is_active` = TRUE,
        `updated_at` = NOW()
    WHERE `id` = staffIdIN;
    
    -- Visszajelzés
    SELECT 'SUCCESS' AS result, 'Staff activated successfully' AS message, staffIdIN AS staff_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `activateUser` (IN `userIdIN` INT)   BEGIN
    UPDATE `users`
    SET 
        `is_active` = TRUE,
        `updated_at` = NOW()
    WHERE `id` = userIdIN
      AND `is_deleted` = FALSE;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `activateUserByRegToken` (IN `tokenIN` VARCHAR(100))   BEGIN
    DECLARE tokenUserId INT DEFAULT NULL;
    DECLARE tokenExpired BOOLEAN DEFAULT FALSE;
    DECLARE tokenRevoked BOOLEAN DEFAULT FALSE;
    
    -- Token validálás a tokens táblából
    SELECT 
        `user_id`,
        `expires_at` < NOW() AS is_expired,
        `is_revoked`
    INTO 
        tokenUserId,
        tokenExpired,
        tokenRevoked
    FROM `tokens`
    WHERE `token` = tokenIN
      AND `type` = 'email_verify'
    LIMIT 1;
    
    -- Ellenőrzések
    IF tokenUserId IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid or non-existent token';
    END IF;
    
    IF tokenExpired THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Token has expired (24 hours)';
    END IF;
    
    IF tokenRevoked THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Token has already been used';
    END IF;
    
    -- User aktiválása
    UPDATE `users`
    SET 
        `is_active` = TRUE,
        `register_finished_at` = NOW(),
        `updated_at` = NOW()
    WHERE `id` = tokenUserId
      AND `is_deleted` = FALSE;
    
    -- Token revoke (már felhasználtuk)
    UPDATE `tokens`
    SET 
        `is_revoked` = TRUE,
        `revoked_at` = NOW()
    WHERE `token` = tokenIN
      AND `type` = 'email_verify';
    
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `addFavorite` (IN `userIdIN` INT, IN `companyIdIN` INT)   BEGIN
    DECLARE existingFavoriteId INT DEFAULT NULL;
    DECLARE isCurrentlyDeleted TINYINT DEFAULT 0;
    
    -- Ellenőrzi, hogy a user létezik és aktív
    IF NOT EXISTS (
        SELECT 1 FROM `users` 
        WHERE `id` = userIdIN 
          AND `is_deleted` = FALSE 
          AND `is_active` = TRUE
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User not found or inactive';
    END IF;
    
    -- Ellenőrzi, hogy a company létezik és aktív
    IF NOT EXISTS (
        SELECT 1 FROM `companies` 
        WHERE `id` = companyIdIN 
          AND `is_deleted` = FALSE 
          AND `is_active` = TRUE
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Company not found or inactive';
    END IF;
    
    -- Ellenőrzi, hogy van-e már favorite (akár deleted, akár aktív)
    SELECT `id`, `is_deleted` 
    INTO existingFavoriteId, isCurrentlyDeleted
    FROM `favorites`
    WHERE `user_id` = userIdIN
      AND `company_id` = companyIdIN
    LIMIT 1;
    
    -- Ha van aktív favorite, akkor error
    IF existingFavoriteId IS NOT NULL AND isCurrentlyDeleted = FALSE THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Company is already in favorites';
    END IF;
    
    -- Ha volt deleted favorite, akkor újraaktiválja
    IF existingFavoriteId IS NOT NULL AND isCurrentlyDeleted = TRUE THEN
        UPDATE `favorites`
        SET 
            `is_deleted` = FALSE,
            `deleted_at` = NULL,
            `created_at` = NOW()  -- Frissíti a created_at-ot újraaktiváláskor
        WHERE `id` = existingFavoriteId;
        
        SELECT 'SUCCESS' AS result, 'Favorite reactivated' AS message, existingFavoriteId AS favorite_id;
    ELSE
        -- Új favorite létrehozása
        INSERT INTO `favorites` (
            `user_id`,
            `company_id`,
            `created_at`,
            `is_deleted`
        )
        VALUES (
            userIdIN,
            companyIdIN,
            NOW(),
            FALSE
        );
        
        SELECT 'SUCCESS' AS result, 'Favorite added' AS message, LAST_INSERT_ID() AS favorite_id;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `assignCompanyToUser` (IN `userIdIN` INT, IN `companyIdIN` INT)   BEGIN
    UPDATE `users`
    SET 
        `company_id` = companyIdIN,
        `updated_at` = NOW()
    WHERE `id` = userIdIN
      AND `is_deleted` = FALSE;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `assignRole` (IN `userIdIN` INT, IN `roleIdIN` INT)   BEGIN
    -- Régi szerepkör lezárása
    UPDATE `user_x_role`
    SET 
        `un_assigned_at` = NOW(),
        `is_un_assigned` = TRUE
    WHERE `user_id` = userIdIN
      AND `is_un_assigned` = FALSE;
    
    -- Új szerepkör hozzárendelése
    INSERT INTO `user_x_role` (
        `user_id`,
        `role_id`,
        `assigned_at`
    )
    VALUES (
        userIdIN,
        roleIdIN,
        NOW()
    );
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `assignServiceToCategory` (IN `serviceIdIN` INT, IN `categoryIdIN` INT)   BEGIN
    DECLARE serviceCompanyId INT;
    DECLARE categoryCompanyId INT;
    
    -- Ellenőrzi, hogy a szolgáltatás létezik és melyik céghez tartozik
    SELECT `company_id` INTO serviceCompanyId
    FROM `services`
    WHERE `id` = serviceIdIN
      AND `is_deleted` = FALSE;
    
    IF serviceCompanyId IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Service not found';
    END IF;
    
    -- Ellenőrzi, hogy a kategória létezik és melyik céghez tartozik
    SELECT `company_id` INTO categoryCompanyId
    FROM `service_categories`
    WHERE `id` = categoryIdIN;
    
    IF categoryCompanyId IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Category not found';
    END IF;
    
    -- Ellenőrzi, hogy ugyanahhoz a céghez tartoznak-e
    IF serviceCompanyId != categoryCompanyId THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Service and category must belong to the same company';
    END IF;
    
    -- Ellenőrzi, hogy már létezik-e a kapcsolat
    IF EXISTS (
        SELECT 1 
        FROM `service_category_map`
        WHERE `service_id` = serviceIdIN
          AND `category_id` = categoryIdIN
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Service is already assigned to this category';
    END IF;
    
    -- Kapcsolat létrehozása
    INSERT INTO `service_category_map` (
        `service_id`,
        `category_id`
    )
    VALUES (
        serviceIdIN,
        categoryIdIN
    );
    
    SELECT 'SUCCESS' AS result, 'Service assigned to category' AS message;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `assignServiceToStaff` (IN `staffIdIN` INT, IN `serviceIdIN` INT)   BEGIN
    -- Ellenőrzi, hogy már létezik-e a kapcsolat
    INSERT INTO `staff_services` (
        `staff_id`,
        `service_id`
    )
    SELECT staffIdIN, serviceIdIN
    WHERE NOT EXISTS (
        SELECT 1 
        FROM `staff_services` 
        WHERE `staff_id` = staffIdIN 
          AND `service_id` = serviceIdIN
    );
    
    -- Visszaadjuk, hogy sikeres volt-e
    SELECT ROW_COUNT() AS rows_affected;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `cancelAppointment` (IN `appointmentIdIN` INT, IN `cancelledByIN` INT, IN `cancelReasonIN` TEXT)   BEGIN
    UPDATE `appointments`
    SET 
        `status` = 'cancelled',
        `cancelled_by` = cancelledByIN,
        `cancelled_reason` = cancelReasonIN,
        `cancelled_at` = NOW(),
        `updated_at` = NOW()
    WHERE `id` = appointmentIdIN;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `checkById` (IN `idIN` INT)   BEGIN

SELECT
	id,
    is_deleted,
    is_active
    
    FROM companies
    WHERE
    	id = idIN
        AND is_deleted = 0
        AND is_active = 1;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `checkCompany` (IN `idIN` INT)   BEGIN

	SELECT 
    	`companies`.`is_deleted`,
        `companies`.`is_active`
    FROM `companies`
	WHERE `companies`.`id` = idIN
    LIMIT 1;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `checkUser` (IN `idIN` INT)   BEGIN

	SELECT 
    	`users`.`is_deleted`,
        `users`.`is_active`
    FROM `users`
    WHERE `users`.`id` = idIN
    LIMIT 1;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `cleanExpiredTokens` ()   BEGIN
    DELETE FROM `tokens`
    WHERE `expires_at` < NOW()
       OR `is_revoked` = TRUE;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `completeAppointment` (IN `appointmentIdIN` INT, IN `internalNotesIN` TEXT)   BEGIN
    -- Ellenőrzi hogy confirmed vagy in_progress státuszú-e
    IF (SELECT status FROM appointments WHERE id = appointmentIdIN) IN ('confirmed', 'in_progress') THEN
        UPDATE `appointments`
        SET 
            `status` = 'completed',
            `internal_notes` = internalNotesIN,
            `updated_at` = NOW()
        WHERE `id` = appointmentIdIN;
        
        SELECT 'SUCCESS' AS result, 'Appointment completed' AS message;
    ELSE
        SELECT 'ERROR' AS result, 'Appointment cannot be completed' AS message;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `confirmAppointment` (IN `appointmentIdIN` INT, IN `confirmedByIN` INT)   BEGIN
    -- Ellenőrzi hogy pending státuszú-e
    IF (SELECT status FROM appointments WHERE id = appointmentIdIN) = 'pending' THEN
        UPDATE `appointments`
        SET 
            `status` = 'confirmed',
            `updated_at` = NOW()
        WHERE `id` = appointmentIdIN;
        
        SELECT 'SUCCESS' AS result, 'Appointment confirmed' AS message;
    ELSE
        SELECT 'ERROR' AS result, 'Appointment is not in pending status' AS message;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createAppointment` (IN `companyIdIN` INT, IN `serviceIdIN` INT, IN `staffIdIN` INT, IN `clientIdIN` INT, IN `startTimeIN` DATETIME, IN `endTimeIN` DATETIME, IN `notesIN` TEXT, IN `priceIN` DECIMAL(10,2), IN `currencyIN` VARCHAR(10), OUT `newAppointmentIdOUT` INT)   BEGIN
    DECLARE newAppointmentId INT;
    
    -- Validáljuk a foglalási időpontot
    CALL validateBookingTime(companyIdIN, startTimeIN);
    
    INSERT INTO `appointments` (
        `company_id`,
        `service_id`,
        `staff_id`,
        `client_id`,
        `start_time`,
        `end_time`,
        `status`,
        `notes`,
        `price`,
        `currency`
    )
    VALUES (
        companyIdIN,
        serviceIdIN,
        staffIdIN,
        clientIdIN,
        startTimeIN,
        endTimeIN,
        'pending',
        notesIN,
        priceIN,
        currencyIN
    );
    
    -- Új appointment ID lekérése
    SET newAppointmentId = LAST_INSERT_ID();
    
    -- OUT paraméterbe is visszaadjuk
    SET newAppointmentIdOUT = newAppointmentId;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createCompany` (IN `nameIN` VARCHAR(255), IN `descriptionIN` TEXT, IN `addressIN` TEXT, IN `cityIN` VARCHAR(100), IN `postalCodeIN` VARCHAR(20), IN `countryIN` VARCHAR(100), IN `phoneIN` VARCHAR(30), IN `emailIN` VARCHAR(100), IN `websiteIN` VARCHAR(255), IN `ownerIdIN` INT, IN `allowSameDayBookingIN` TINYINT(1), IN `minimumBookingHoursAheadIN` INT)   BEGIN
    DECLARE newCompanyId INT;
    
    -- Validáció: Ha same-day booking tiltva, akkor minimum_hours_ahead NULL lehet
    IF allowSameDayBookingIN = FALSE THEN
        SET minimumBookingHoursAheadIN = NULL;
    END IF;
    
    -- Validáció: Ha same-day booking engedélyezve, akkor minimum_hours_ahead kötelező
    IF allowSameDayBookingIN = TRUE AND (minimumBookingHoursAheadIN IS NULL OR minimumBookingHoursAheadIN < 1) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'If same-day booking is allowed, minimum_booking_hours_ahead must be at least 1';
    END IF;
    
    -- Cég létrehozása
    INSERT INTO companies (
        name,
        description,
        address,
        city,
        postal_code,
        country,
        phone,
        email,
        website,
        owner_id,
        allow_same_day_booking,
        minimum_booking_hours_ahead
    )
    VALUES (
        nameIN,
        descriptionIN,
        addressIN,
        cityIN,
        postalCodeIN,
        countryIN,
        phoneIN,
        emailIN,
        websiteIN,
        ownerIdIN,
        allowSameDayBookingIN,
        minimumBookingHoursAheadIN
    );
    
    -- Új company ID lekérése
    SET newCompanyId = LAST_INSERT_ID();
    
    -- Owner user company_id frissítése
    UPDATE users
    SET 
        company_id = newCompanyId,
        updated_at = NOW()
    WHERE id = ownerIdIN;
    
    -- Visszaadjuk az új company ID-t
    SELECT newCompanyId AS company_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createOpeningHours` (IN `companyIdIN` INT, IN `mondayOpenIN` TIME, IN `mondayCloseIN` TIME, IN `mondayClosedIN` TINYINT(1), IN `tuesdayOpenIN` TIME, IN `tuesdayCloseIN` TIME, IN `tuesdayClosedIN` TINYINT(1), IN `wednesdayOpenIN` TIME, IN `wednesdayCloseIN` TIME, IN `wednesdayClosedIN` TINYINT(1), IN `thursdayOpenIN` TIME, IN `thursdayCloseIN` TIME, IN `thursdayClosedIN` TINYINT(1), IN `fridayOpenIN` TIME, IN `fridayCloseIN` TIME, IN `fridayClosedIN` TINYINT(1), IN `saturdayOpenIN` TIME, IN `saturdayCloseIN` TIME, IN `saturdayClosedIN` TINYINT(1), IN `sundayOpenIN` TIME, IN `sundayCloseIN` TIME, IN `sundayClosedIN` TINYINT(1))   BEGIN
    -- Hétfő
    INSERT INTO `opening_hours` (`company_id`, `day_of_week`, `open_time`, `close_time`, `is_closed`)
    VALUES (companyIdIN, 'monday', IF(mondayClosedIN = TRUE, NULL, mondayOpenIN), IF(mondayClosedIN = TRUE, NULL, mondayCloseIN), mondayClosedIN);
    
    -- Kedd
    INSERT INTO `opening_hours` (`company_id`, `day_of_week`, `open_time`, `close_time`, `is_closed`)
    VALUES (companyIdIN, 'tuesday', IF(tuesdayClosedIN = TRUE, NULL, tuesdayOpenIN), IF(tuesdayClosedIN = TRUE, NULL, tuesdayCloseIN), tuesdayClosedIN);
    
    -- Szerda
    INSERT INTO `opening_hours` (`company_id`, `day_of_week`, `open_time`, `close_time`, `is_closed`)
    VALUES (companyIdIN, 'wednesday', IF(wednesdayClosedIN = TRUE, NULL, wednesdayOpenIN), IF(wednesdayClosedIN = TRUE, NULL, wednesdayCloseIN), wednesdayClosedIN);
    
    -- Csütörtök
    INSERT INTO `opening_hours` (`company_id`, `day_of_week`, `open_time`, `close_time`, `is_closed`)
    VALUES (companyIdIN, 'thursday', IF(thursdayClosedIN = TRUE, NULL, thursdayOpenIN), IF(thursdayClosedIN = TRUE, NULL, thursdayCloseIN), thursdayClosedIN);
    
    -- Péntek
    INSERT INTO `opening_hours` (`company_id`, `day_of_week`, `open_time`, `close_time`, `is_closed`)
    VALUES (companyIdIN, 'friday', IF(fridayClosedIN = TRUE, NULL, fridayOpenIN), IF(fridayClosedIN = TRUE, NULL, fridayCloseIN), fridayClosedIN);
    
    -- Szombat
    INSERT INTO `opening_hours` (`company_id`, `day_of_week`, `open_time`, `close_time`, `is_closed`)
    VALUES (companyIdIN, 'saturday', IF(saturdayClosedIN = TRUE, NULL, saturdayOpenIN), IF(saturdayClosedIN = TRUE, NULL, saturdayCloseIN), saturdayClosedIN);
    
    -- Vasárnap
    INSERT INTO `opening_hours` (`company_id`, `day_of_week`, `open_time`, `close_time`, `is_closed`)
    VALUES (companyIdIN, 'sunday', IF(sundayClosedIN = TRUE, NULL, sundayOpenIN), IF(sundayClosedIN = TRUE, NULL, sundayCloseIN), sundayClosedIN);
    
    -- Visszaadjuk, hogy sikerült
    SELECT 'SUCCESS' AS result, 'Opening hours created for all days' AS message;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createReview` (IN `companyIdIN` INT, IN `clientIdIN` INT, IN `appointmentIdIN` INT, IN `ratingIN` INT, IN `commentIN` TEXT)   BEGIN
    DECLARE newReviewId INT;
    
    -- Értékelés létrehozása
    INSERT INTO `reviews` (
        `company_id`,
        `client_id`,
        `appointment_id`,
        `rating`,
        `comment`
    )
    VALUES (
        companyIdIN,
        clientIdIN,
        appointmentIdIN,
        ratingIN,
        commentIN
    );
    
    -- Új review ID lekérése
    SET newReviewId = LAST_INSERT_ID();
    
    -- Visszaadjuk az új review ID-t
    SELECT newReviewId AS review_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createService` (IN `companyIdIN` INT, IN `nameIN` VARCHAR(255), IN `descriptionIN` TEXT, IN `durationMinutesIN` INT, IN `priceIN` DECIMAL(10,2), IN `currencyIN` VARCHAR(10))   BEGIN
    DECLARE newServiceId INT;
    
    -- Szolgáltatás létrehozása
    INSERT INTO `services` (
        `company_id`,
        `name`,
        `description`,
        `duration_minutes`,
        `price`,
        `currency`
    )
    VALUES (
        companyIdIN,
        nameIN,
        descriptionIN,
        durationMinutesIN,
        priceIN,
        currencyIN
    );
    
    -- Új service ID lekérése
    SET newServiceId = LAST_INSERT_ID();
    
    -- Visszaadjuk az új service ID-t
    SELECT newServiceId AS service_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createServiceCategory` (IN `companyIdIN` INT, IN `nameIN` VARCHAR(255), IN `descriptionIN` TEXT)   BEGIN
    DECLARE newCategoryId INT;
    
    -- Kategória létrehozása
    INSERT INTO `service_categories` (
        `company_id`,
        `name`,
        `description`
    )
    VALUES (
        companyIdIN,
        nameIN,
        descriptionIN
    );
    
    -- Új kategória ID lekérése
    SET newCategoryId = LAST_INSERT_ID();
    
    -- Visszaadjuk az új kategória ID-t
    SELECT newCategoryId AS category_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createStaff` (IN `userIdIN` INT, IN `companyIdIN` INT, IN `displayNameIN` VARCHAR(255), IN `specialtiesIN` TEXT, IN `bioIN` TEXT)   BEGIN
    DECLARE newStaffId INT;
    
    -- Staff létrehozása
    INSERT INTO `staff` (
        `user_id`,
        `company_id`,
        `display_name`,
        `specialties`,
        `bio`
    )
    VALUES (
        userIdIN,
        companyIdIN,
        displayNameIN,
        specialtiesIN,
        bioIN
    );
    
    -- Új staff ID lekérése
    SET newStaffId = LAST_INSERT_ID();
    
    -- User company_id frissítése
    UPDATE `users`
    SET 
        `company_id` = companyIdIN,
        `updated_at` = NOW()
    WHERE `id` = userIdIN;
    
    -- Visszaadjuk az új staff ID-t
    SELECT newStaffId AS staff_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createStaffException` (IN `staffIdIN` INT, IN `dateIN` DATE, IN `startTimeIN` TIME, IN `endTimeIN` TIME, IN `typeIN` ENUM('day_off','custom_hours'), IN `noteIN` TEXT)   BEGIN
    DECLARE newExceptionId INT;
    
    -- Ellenőrzi, hogy a staff létezik
    IF NOT EXISTS (
        SELECT 1 FROM `staff` WHERE `id` = staffIdIN
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Staff not found';
    END IF;
    
    -- Ellenőrzi, hogy a dátum jövőbeli-e (opcionális, lehet kihagyni)
    IF dateIN < CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot create exception for past dates';
    END IF;
    
    -- Ellenőrzi, hogy nincs-e már exception erre a napra
    IF EXISTS (
        SELECT 1 FROM `staff_exceptions`
        WHERE `staff_id` = staffIdIN
          AND `date` = dateIN
          AND `is_deleted` = FALSE
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Exception already exists for this date. Delete it first or use a different date.';
    END IF;
    
    -- Validáció: day_off esetén start/end time legyen NULL
    IF typeIN = 'day_off' AND (startTimeIN IS NOT NULL OR endTimeIN IS NOT NULL) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'day_off type requires start_time and end_time to be NULL';
    END IF;
    
    -- Validáció: custom_hours esetén start/end time kötelező
    IF typeIN = 'custom_hours' AND (startTimeIN IS NULL OR endTimeIN IS NULL) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'custom_hours type requires both start_time and end_time';
    END IF;
    
    -- Validáció: custom_hours esetén start < end
    IF typeIN = 'custom_hours' AND startTimeIN >= endTimeIN THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'start_time must be before end_time';
    END IF;
    
    -- Exception létrehozása
    INSERT INTO `staff_exceptions` (
        `staff_id`,
        `date`,
        `start_time`,
        `end_time`,
        `type`,
        `note`
    )
    VALUES (
        staffIdIN,
        dateIN,
        startTimeIN,
        endTimeIN,
        typeIN,
        noteIN
    );
    
    -- Új exception ID lekérése
    SET newExceptionId = LAST_INSERT_ID();
    
    -- Visszajelzés
    SELECT 'SUCCESS' AS result, 
           'Staff exception created' AS message,
           newExceptionId AS exception_id,
           staffIdIN AS staff_id,
           dateIN AS date,
           typeIN AS type;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createStaffWorkingHours` (IN `staffIdIN` INT, IN `mondayStartIN` TIME, IN `mondayEndIN` TIME, IN `mondayAvailableIN` TINYINT(1), IN `tuesdayStartIN` TIME, IN `tuesdayEndIN` TIME, IN `tuesdayAvailableIN` TINYINT(1), IN `wednesdayStartIN` TIME, IN `wednesdayEndIN` TIME, IN `wednesdayAvailableIN` TINYINT(1), IN `thursdayStartIN` TIME, IN `thursdayEndIN` TIME, IN `thursdayAvailableIN` TINYINT(1), IN `fridayStartIN` TIME, IN `fridayEndIN` TIME, IN `fridayAvailableIN` TINYINT(1), IN `saturdayStartIN` TIME, IN `saturdayEndIN` TIME, IN `saturdayAvailableIN` TINYINT(1), IN `sundayStartIN` TIME, IN `sundayEndIN` TIME, IN `sundayAvailableIN` TINYINT(1))   BEGIN
    -- Ellenőrzi, hogy a staff létezik
    IF NOT EXISTS (
        SELECT 1 FROM `staff` WHERE `id` = staffIdIN
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Staff not found';
    END IF;
    
    -- Ellenőrzi, hogy nincs-e már working hours beállítva
    IF EXISTS (
        SELECT 1 FROM `staff_working_hours` WHERE `staff_id` = staffIdIN
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Working hours already exist for this staff. Use update procedure instead.';
    END IF;
    
    -- Hétfő
    INSERT INTO `staff_working_hours` (
        `staff_id`, `day_of_week`, `start_time`, `end_time`, `is_available`
    )
    VALUES (
        staffIdIN, 
        'monday', 
        IF(mondayAvailableIN = TRUE, mondayStartIN, NULL),
        IF(mondayAvailableIN = TRUE, mondayEndIN, NULL),
        mondayAvailableIN
    );
    
    -- Kedd
    INSERT INTO `staff_working_hours` (
        `staff_id`, `day_of_week`, `start_time`, `end_time`, `is_available`
    )
    VALUES (
        staffIdIN, 
        'tuesday', 
        IF(tuesdayAvailableIN = TRUE, tuesdayStartIN, NULL),
        IF(tuesdayAvailableIN = TRUE, tuesdayEndIN, NULL),
        tuesdayAvailableIN
    );
    
    -- Szerda
    INSERT INTO `staff_working_hours` (
        `staff_id`, `day_of_week`, `start_time`, `end_time`, `is_available`
    )
    VALUES (
        staffIdIN, 
        'wednesday', 
        IF(wednesdayAvailableIN = TRUE, wednesdayStartIN, NULL),
        IF(wednesdayAvailableIN = TRUE, wednesdayEndIN, NULL),
        wednesdayAvailableIN
    );
    
    -- Csütörtök
    INSERT INTO `staff_working_hours` (
        `staff_id`, `day_of_week`, `start_time`, `end_time`, `is_available`
    )
    VALUES (
        staffIdIN, 
        'thursday', 
        IF(thursdayAvailableIN = TRUE, thursdayStartIN, NULL),
        IF(thursdayAvailableIN = TRUE, thursdayEndIN, NULL),
        thursdayAvailableIN
    );
    
    -- Péntek
    INSERT INTO `staff_working_hours` (
        `staff_id`, `day_of_week`, `start_time`, `end_time`, `is_available`
    )
    VALUES (
        staffIdIN, 
        'friday', 
        IF(fridayAvailableIN = TRUE, fridayStartIN, NULL),
        IF(fridayAvailableIN = TRUE, fridayEndIN, NULL),
        fridayAvailableIN
    );
    
    -- Szombat
    INSERT INTO `staff_working_hours` (
        `staff_id`, `day_of_week`, `start_time`, `end_time`, `is_available`
    )
    VALUES (
        staffIdIN, 
        'saturday', 
        IF(saturdayAvailableIN = TRUE, saturdayStartIN, NULL),
        IF(saturdayAvailableIN = TRUE, saturdayEndIN, NULL),
        saturdayAvailableIN
    );
    
    -- Vasárnap
    INSERT INTO `staff_working_hours` (
        `staff_id`, `day_of_week`, `start_time`, `end_time`, `is_available`
    )
    VALUES (
        staffIdIN, 
        'sunday', 
        IF(sundayAvailableIN = TRUE, sundayStartIN, NULL),
        IF(sundayAvailableIN = TRUE, sundayEndIN, NULL),
        sundayAvailableIN
    );
    
    -- Visszajelzés
    SELECT 'SUCCESS' AS result, 'Working hours created for all 7 days' AS message, staffIdIN AS staff_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `deactivateStaff` (IN `staffIdIN` INT)   BEGIN
    -- Ellenőrzi, hogy a staff létezik
    IF NOT EXISTS (
        SELECT 1 FROM `staff` 
        WHERE `id` = staffIdIN
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Staff not found';
    END IF;
    
    -- Ellenőrzi, hogy már nem inaktív-e
    IF EXISTS (
        SELECT 1 FROM `staff` 
        WHERE `id` = staffIdIN 
          AND `is_active` = FALSE
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Staff is already inactive';
    END IF;
    
    -- Staff deaktiválása
    UPDATE `staff`
    SET 
        `is_active` = FALSE,
        `updated_at` = NOW()
    WHERE `id` = staffIdIN;
    
    -- Visszajelzés
    SELECT 'SUCCESS' AS result, 'Staff deactivated successfully' AS message, staffIdIN AS staff_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `deactivateUser` (IN `userIdIN` INT)   BEGIN
    UPDATE `users`
    SET 
        `is_active` = FALSE,
        `updated_at` = NOW()
    WHERE `id` = userIdIN
      AND `is_deleted` = FALSE;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `deleteCompanyImage` (IN `imageIdIN` INT, IN `companyIdIN` INT)   BEGIN
    -- Ellenőrzi, hogy a kép létezik és a céghez tartozik
    IF NOT EXISTS (
        SELECT 1 
        FROM `images` 
        WHERE `id` = imageIdIN 
          AND `company_id` = companyIdIN
          AND `is_deleted` = FALSE
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Image not found or does not belong to this company';
    END IF;
    
    -- Soft delete - kép törlése
    UPDATE `images`
    SET 
        `is_deleted` = TRUE,
        `deleted_at` = NOW()
    WHERE `id` = imageIdIN
      AND `company_id` = companyIdIN;
    
    SELECT 'SUCCESS' AS result, 'Image deleted' AS message;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `deleteOpeningHours` (IN `companyIdIN` INT)   BEGIN
    -- Összes nyitvatartás törlése egy céghez
    DELETE FROM `opening_hours`
    WHERE `company_id` = companyIdIN;
    
    -- Visszaadjuk hány rekordot töröltünk
    SELECT ROW_COUNT() AS rows_deleted;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `deleteService` (IN `serviceIdIN` INT)   BEGIN
    -- Soft delete - szolgáltatás törlése
    UPDATE `services`
    SET 
        `is_deleted` = TRUE,
        `deleted_at` = NOW(),
        `is_active` = FALSE,
        `updated_at` = NOW()
    WHERE `id` = serviceIdIN
      AND `is_deleted` = FALSE;
    
    -- Ellenőrzi, hogy sikerült-e
    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Service not found or already deleted';
    END IF;
    
    SELECT 'SUCCESS' AS result, 'Service deleted' AS message;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `deleteStaffException` (IN `exceptionIdIN` INT)   BEGIN
    -- Ellenőrzi, hogy a exception létezik és nem törölt
    IF NOT EXISTS (
        SELECT 1 FROM `staff_exceptions`
        WHERE `id` = exceptionIdIN
          AND `is_deleted` = FALSE
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Exception not found or already deleted';
    END IF;
    
    -- Soft delete - exception törlése
    UPDATE `staff_exceptions`
    SET 
        `is_deleted` = TRUE,
        `deleted_at` = NOW()
    WHERE `id` = exceptionIdIN;
    
    -- Visszajelzés
    SELECT 'SUCCESS' AS result, 
           'Staff exception deleted' AS message,
           exceptionIdIN AS exception_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `deleteUserImage` (IN `userIdIN` INT)   BEGIN
    -- Ellenőrzi, hogy van-e aktív kép
    IF NOT EXISTS (
        SELECT 1 
        FROM `images` 
        WHERE `user_id` = userIdIN
          AND `is_deleted` = FALSE
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No active profile image found for this user';
    END IF;
    
    -- Soft delete - user profil kép törlése
    UPDATE `images`
    SET 
        `is_deleted` = TRUE,
        `deleted_at` = NOW()
    WHERE `user_id` = userIdIN
      AND `is_deleted` = FALSE;
    
    SELECT 'SUCCESS' AS result, 'User profile image deleted' AS message;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `generateEmailVerificationToken` (IN `userIdIN` INT)   BEGIN
    DECLARE newToken VARCHAR(64);
    DECLARE tokenExpiry DATETIME;
    
    -- Token generálás (biztonságos, egyedi)
    SET newToken = MD5(CONCAT(userIdIN, NOW(), RAND()));
    
    -- Lejárat: 24 óra múlva
    SET tokenExpiry = DATE_ADD(NOW(), INTERVAL 24 HOUR);
    
    -- Token mentése a tokens táblába
    INSERT INTO `tokens` (
        `user_id`,
        `token`,
        `type`,
        `expires_at`,
        `is_revoked`,
        `created_at`
    )
    VALUES (
        userIdIN,
        newToken,
        'email_verify',
        tokenExpiry,
        FALSE,
        NOW()
    );
    
    -- Token visszaadása
    SELECT newToken AS token, tokenExpiry AS expires_at;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `generatePasswordResetToken` (IN `idIN` INT(100))   BEGIN
    DECLARE newToken VARCHAR(64);
    DECLARE tokenExpiry DATETIME;
    
    -- Token generálás (biztonságos, egyedi)
    SET newToken = MD5(CONCAT(idIN, NOW(), RAND()));
    
    -- Lejárat: 15 perc múlva
    SET tokenExpiry = DATE_ADD(NOW(), INTERVAL 15 MINUTE);
    
    -- Token mentése a tokens táblába
    INSERT INTO `tokens` (
        `user_id`,
        `token`,
        `type`,
        `expires_at`,
        `is_revoked`,
        `created_at`
    )
    VALUES (
        idIN,
        newToken,
        'password_reset',
        tokenExpiry,
        FALSE,
        NOW()
    );
    
    -- Token visszaadása
    SELECT newToken AS token, tokenExpiry AS expires_at;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getActiveServicesByCompany` (IN `companyIdIN` INT)   BEGIN
    SELECT 
        s.*,
        GROUP_CONCAT(DISTINCT sc.name SEPARATOR ', ') AS categories
    FROM `services` s
    LEFT JOIN `service_category_map` scm ON s.id = scm.service_id
    LEFT JOIN `service_categories` sc ON scm.category_id = sc.id
    WHERE s.company_id = companyIdIN
      AND s.is_active = TRUE
      AND s.is_deleted = FALSE
    GROUP BY s.id
    ORDER BY s.name;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllBusinessCategories` ()   BEGIN
    SELECT 
        id,
        name,
        description,
        icon
    FROM business_categories
    WHERE is_active = 1
    ORDER BY name ASC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAppointmentsByClient` (IN `clientIdIN` INT, IN `statusFilterIN` VARCHAR(20), IN `limitIN` INT, IN `offsetIN` INT)   BEGIN
    SELECT 
        a.*,
        s.name AS service_name,
        s.duration_minutes,
        c.name AS company_name,
        CONCAT(u.first_name, ' ', u.last_name) AS staff_name
    FROM `appointments` a
    INNER JOIN `services` s ON a.service_id = s.id
    INNER JOIN `companies` c ON a.company_id = c.id
    LEFT JOIN `staff` st ON a.staff_id = st.id
    LEFT JOIN `users` u ON st.user_id = u.id
    WHERE a.client_id = clientIdIN
      AND (statusFilterIN IS NULL OR a.status = statusFilterIN)
    ORDER BY a.start_time DESC
    LIMIT limitIN OFFSET offsetIN;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAppointmentsByStaff` (IN `staffIdIN` INT, IN `dateFromIN` DATE, IN `dateToIN` DATE)   BEGIN
    SELECT 
        a.*,
        s.name AS service_name,
        s.duration_minutes,
        CONCAT(u.first_name, ' ', u.last_name) AS client_name,
        u.phone AS client_phone,
        u.email AS client_email
    FROM `appointments` a
    INNER JOIN `services` s ON a.service_id = s.id
    INNER JOIN `users` u ON a.client_id = u.id
    WHERE a.staff_id = staffIdIN
      AND DATE(a.start_time) BETWEEN dateFromIN AND dateToIN
      AND a.status NOT IN ('cancelled')
    ORDER BY a.start_time ASC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAvailableTimeSlots` (IN `companyIdIN` INT, IN `staffIdIN` INT, IN `dateIN` DATE)   BEGIN
    -- Egyszerűsített verzió: visszaadja az aznapi foglalásokat
    -- A backend logika fogja kiszámolni a szabad időpontokat
    SELECT 
    	`id`,
        `companyId`,
        `start_time`,
        `end_time`
    FROM `appointments`
    WHERE `company_id` = companyIdIN
      AND (`staff_id` = staffIdIN OR staffIdIN IS NULL)
      AND DATE(`start_time`) = dateIN
      AND `status` NOT IN ('cancelled')
    ORDER BY `start_time`;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAverageRatingByCompany` (IN `companyIdIN` INT)   BEGIN
    SELECT 
        ROUND(AVG(rating), 2) AS average_rating,
        COUNT(*) AS total_reviews,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) AS five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) AS four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) AS three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) AS two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) AS one_star
    FROM `reviews`
    WHERE company_id = companyIdIN
      AND is_deleted = FALSE;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getClientAppointments` (IN `clientIdIN` INT, IN `includeHistoryIN` INT)   BEGIN
    SELECT 
        a.id,
        a.start_time,
        a.end_time,
        a.status,
        a.notes,
        a.price,
        a.currency,
        a.created_at,
        s.name AS service_name,
        s.duration_minutes,
        c.name AS company_name,
        c.address AS company_address,
        c.city AS company_city,
        c.phone AS company_phone,
        CONCAT(staff_user.first_name, ' ', staff_user.last_name) AS staff_name,
        i.url AS company_image_url
    FROM `appointments` a
    INNER JOIN `services` s ON a.service_id = s.id
    INNER JOIN `companies` c ON a.company_id = c.id
    LEFT JOIN `staff` st ON a.staff_id = st.id
    LEFT JOIN `users` staff_user ON st.user_id = staff_user.id
    LEFT JOIN `images` i ON c.id = i.company_id AND i.is_main = 1
    WHERE a.client_id = clientIdIN
      AND (
        includeHistoryIN = TRUE 
        OR (includeHistoryIN = FALSE AND a.start_time >= NOW())
      )
    ORDER BY a.start_time DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getCompaniesForListing` (IN `cityIN` VARCHAR(100), IN `isActiveIN` TINYINT(1), IN `limitIN` INT, IN `offsetIN` INT)   BEGIN
    SELECT 
        c.id,
        c.name,
        c.description,
        c.address,
        c.city,
        c.postal_code,
        c.country,
        c.phone,
        c.email,
        c.website,
        c.is_active,
        ROUND(AVG(r.rating), 2) AS average_rating,
        COUNT(r.id) AS total_reviews,
        i.url AS main_image_url
    FROM `companies` c
    LEFT JOIN `reviews` r ON c.id = r.company_id AND r.is_deleted = FALSE
    LEFT JOIN `images` i ON c.id = i.company_id AND i.is_main = 1
    WHERE c.is_deleted = FALSE
      AND (cityIN IS NULL OR c.city = cityIN)
      AND (isActiveIN IS NULL OR c.is_active = isActiveIN)
    GROUP BY c.id
    ORDER BY c.name ASC
    LIMIT limitIN OFFSET offsetIN;
    
    SELECT COUNT(*) AS total_companies
    FROM `companies` c
    WHERE c.is_deleted = FALSE
      AND (cityIN IS NULL OR c.city = cityIN)
      AND (isActiveIN IS NULL OR c.is_active = isActiveIN);
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getCompanyBookingAdvanceDays` (IN `companyIdIN` INT)   BEGIN

	SELECT 
    	`companies`.`id`,
    	`companies`.`booking_advance_days`
    FROM `companies`
    WHERE `companies`.`id` = companyIdIN AND `companies`.`is_deleted` = false AND `companies`.`is_active` = true;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getCompanyById` (IN `idIN` INT)   BEGIN 
    SELECT 
        id,
        name,
        description,
        address,
        city,
        postal_code,
        country,
        phone,
        email,
        website,
        booking_advance_days,
        cancellation_hours,
        created_at,
        updated_at,
        is_active
    FROM companies c
    WHERE id = idIN 
      AND is_deleted = FALSE
    LIMIT 1;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getCompanyDataById` (IN `companyIdIN` INT)   BEGIN
    SELECT 
        `companies`.`id`,
        `companies`.`name`,
        `companies`.`description`,
        `companies`.`address`,
        `companies`.`city`,
        `companies`.`postal_code`,
        `companies`.`country`,
        `companies`.`phone`,
        `companies`.`email`,
        `companies`.`website`,
        `companies`.`business_category_id`,
        
        -- CATEGORY NAME a business_categories táblából
        `business_categories`.`name` AS category,
        
        -- IMAGE_URL: Main image
        COALESCE(
            (
                SELECT `images`.url 
                FROM `images`
                WHERE `images`.`company_id` = `companies`.`id` 
                  AND `images`.`is_deleted` = 0 
                  AND `images`.`is_main` = 1 
                LIMIT 1
            ),
            'https://via.placeholder.com/400x300?text=No+Image'
        ) AS "image_url",
        
        -- RATING és REVIEW_COUNT
        ROUND(COALESCE(AVG(`reviews`.`rating`), 0), 1) AS 'rating',
        COUNT(`reviews`.`id`) AS "review_count"
        
    FROM `companies`
    LEFT JOIN `business_categories` ON `companies`.`business_category_id` = `business_categories`.`id`
    LEFT JOIN `reviews` ON `reviews`.`company_id` = `companies`.`id` AND `reviews`.`is_deleted` = 0
    WHERE `companies`.`id` = companyIdIN
      AND `companies`.`is_deleted` = 0
      AND `companies`.`is_active` = 1
    GROUP BY `companies`.`id`, `companies`.`name`, `companies`.`description`, `companies`.`address`, 					 `companies`.`city`, `companies`.`postal_code`, 
             `companies`.`country`, `companies`.`phone`, `companies`.`email`, `companies`.`website`, 					 `companies`.`business_category_id`, `business_categories`.`name`
    LIMIT 1;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getCompanyNotMainImages` (IN `companyIdIN` INT)   BEGIN
    SELECT 
        id,
        url,
        is_main,
        uploaded_at
    FROM `images`
    WHERE company_id = companyIdIN AND `is_deleted` = FALSE AND `images`.`is_main` = false
    ORDER BY `is_main` DESC, `id` ASC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getCompanyReviews` (IN `companyIdIN` INT, IN `limitIN` INT, IN `offsetIN` INT)   BEGIN
    -- Result set 1: Reviews listája
    SELECT 
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        CONCAT(u.first_name, ' ', u.last_name) AS client_name,
        a.start_time AS appointment_date,
        s.name AS service_name
    FROM `reviews` r
    INNER JOIN `users` u ON r.client_id = u.id
    LEFT JOIN `appointments` a ON r.appointment_id = a.id
    LEFT JOIN `services` s ON a.service_id = s.id
    WHERE r.company_id = companyIdIN
      AND r.is_deleted = FALSE
    ORDER BY r.created_at DESC
    LIMIT limitIN OFFSET offsetIN;
    
    -- Result set 2: Total count
    SELECT COUNT(*) AS total_reviews
    FROM `reviews`
    WHERE company_id = companyIdIN
      AND is_deleted = FALSE;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getCompanyShort` (IN `companyIdIN` INT)   BEGIN
    SELECT 
        `companies`.`id`,
        `companies`.`name`,
        `companies`.`address`,
        `companies`.`postal_code`,
        `companies`.`city`,
        `companies`.`country`,
        ROUND(COALESCE(AVG(`reviews`.`rating`), 0), 1) AS 'rating',
        COUNT(`reviews`.`id`) AS "review_count",
        `images`.`url` AS "imageUrl"
    FROM `companies`
    LEFT JOIN `reviews` ON `reviews`.`company_id` = `companies`.`id` 
                        AND `reviews`.`is_deleted` = FALSE
    INNER JOIN `images` ON `images`.`company_id` = `companies`.`id`
    WHERE `companies`.`id` = companyIdIN AND `images`.`is_main` = true AND `images`.`is_deleted` = false
    GROUP BY `companies`.`id`, 
             `companies`.`name`, 
             `companies`.`address`, 
             `companies`.`postal_code`, 
             `companies`.`city`, 
             `companies`.`country`,
             `images`.`url`;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getFeaturedCompanies` (IN `limitIN` INT)   BEGIN
    SELECT 
        c.id,
        c.name,
        ROUND(COALESCE(AVG(r.rating), 0), 1) AS rating,
        COUNT(r.id) AS reviewCount,
        CONCAT(c.address, ', ', c.postal_code, ' ', c.city, ', ', c.country) AS address,
        COALESCE(
            (SELECT i.url 
             FROM images i 
             WHERE i.company_id = c.id 
               AND i.is_deleted = 0 
               AND i.is_main = 1 
             LIMIT 1
            ), 
            'https://via.placeholder.com/400x300'
        ) AS imageUrl
    FROM companies c
    LEFT JOIN reviews r ON r.company_id = c.id AND r.is_deleted = 0
    WHERE c.is_deleted = 0 AND c.is_active = 1
    GROUP BY c.id, c.name, c.address, c.postal_code, c.city, c.country
    HAVING reviewCount > 0
    ORDER BY reviewCount DESC, rating DESC
    LIMIT limitIN;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getInfoForBookingEmail` (IN `appointmentIdIN` INT)   BEGIN

    SELECT
        appointments.id AS appointment_id,
        companies.name AS company_name,
        services.name AS service_name,
        CONCAT(users.first_name, ' ', users.last_name) AS staff_name,
        services.duration_minutes AS service_duration,
        companies.address AS company_address,
        companies.phone AS company_phone,
        companies.email AS company_email

    FROM appointments
        INNER JOIN services ON appointments.service_id = services.id
        INNER JOIN companies ON appointments.company_id = companies.id
        LEFT JOIN staff ON appointments.staff_id = staff.id
        LEFT JOIN users ON staff.user_id = users.id

WHERE appointments.id = appointmentIdIN
LIMIT 1;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getNewCompanies` (IN `limitIN` INT)   BEGIN
    SELECT 
        c.id,
        c.name,
        ROUND(COALESCE(AVG(r.rating), 0), 1) AS rating,
        COUNT(r.id) AS reviewCount,
        CONCAT(c.address, ', ', c.postal_code, ' ', c.city, ', ', c.country) AS address,
        COALESCE(
            (SELECT i.url 
             FROM images i 
             WHERE i.company_id = c.id 
               AND i.is_deleted = 0 
               AND i.is_main = 1 
             LIMIT 1
            ), 
            'https://via.placeholder.com/400x300'
        ) AS imageUrl
    FROM companies c
    LEFT JOIN reviews r ON r.company_id = c.id AND r.is_deleted = 0
    WHERE c.is_deleted = 0 AND c.is_active = 1
    GROUP BY c.id, c.name, c.address, c.postal_code, c.city, c.country, c.created_at
    ORDER BY c.created_at DESC
    LIMIT limitIN;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getOccupiedSlotsForDate` (IN `staffIdIN` INT, IN `dateIN` DATE)   BEGIN

    SELECT 
        a.id AS appointment_id,
        a.start_time,
        a.end_time,
        a.service_id,
        a.client_id,
        s.name AS service_name,
        s.duration_minutes
    FROM appointments a
    INNER JOIN services s ON a.service_id = s.id
    WHERE a.staff_id = staffIdIN
      AND DATE(a.start_time) = dateIN
      AND a.status NOT IN ('cancelled', 'no_show')
    ORDER BY a.start_time;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getOpeningHours` (IN `companyIdIN` INT)   BEGIN
    SELECT 
        `day_of_week`,
        `open_time`,
        `close_time`,
        `is_closed`
    FROM `opening_hours`
    WHERE `company_id` = companyIdIN
    ORDER BY 
        FIELD(`day_of_week`, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getPassword` (IN `idIN` INT)   BEGIN

	SELECT 
    	`users`.`password` AS "passwordHash"
    FROM `users`
    WHERE `users`.`id` = idIN AND `users`.`is_deleted` = false AND `users`.`is_active` = true
    LIMIT 1;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getReviewsByCompanyId` (IN `companyIdIN` INT)   BEGIN
    SELECT 
        r.id,
        CONCAT(u.first_name, " ", u.last_name) AS user_name,
        i.url AS user_image,
        r.rating,
        r.comment,
        r.created_at
    FROM reviews r
    INNER JOIN users u ON r.client_id = u.id
    LEFT JOIN images i ON i.user_id = u.id 
                       AND i.is_deleted = 0 
                       AND i.is_main = 1
    WHERE r.company_id = companyIdIN
      AND r.is_deleted = 0
    ORDER BY r.created_at DESC
    LIMIT 10;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getServiceById` (IN `serviceIdIN` INT)   BEGIN
    SELECT 
        s.id,
        s.company_id,
        s.name,
        s.description,
        s.duration_minutes,
        s.price,
        s.currency,
        s.is_active,
        s.created_at,
        s.updated_at,
        GROUP_CONCAT(DISTINCT sc.name SEPARATOR ', ') AS categories,
        GROUP_CONCAT(DISTINCT sc.id SEPARATOR ',') AS category_ids
    FROM `services` s
    LEFT JOIN `service_category_map` scm ON s.id = scm.service_id
    LEFT JOIN `service_categories` sc ON scm.category_id = sc.id
    WHERE s.id = serviceIdIN
      AND s.is_deleted = FALSE
    GROUP BY s.id
    LIMIT 1;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getServiceCategories` (IN `companyIdIN` INT)   BEGIN
    SELECT 
        `id`,
        `company_id`,
        `name`,
        `description`,
        `created_at`,
        `updated_at`
    FROM `service_categories`
    WHERE `company_id` = companyIdIN
    ORDER BY `name` ASC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getServiceCategoriesWithServicesByCompanyId` (IN `companyIdIN` INT)   BEGIN
    SELECT 
        sc.id AS category_id,
        sc.name AS category_name,
        sc.description AS category_description,
        s.id AS service_id,
        s.name AS service_name,
        s.duration_minutes,
        s.price,
        s.currency
    FROM service_categories sc
    LEFT JOIN service_category_map scm ON sc.id = scm.category_id
    LEFT JOIN services s ON scm.service_id = s.id 
        AND s.is_deleted = 0 
        AND s.is_active = 1
    WHERE sc.company_id = companyIdIN
    ORDER BY sc.id, s.name;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getServicesByCategory` (IN `categoryIdIN` INT)   BEGIN
    SELECT 
        s.id,
        s.company_id,
        s.name,
        s.description,
        s.duration_minutes,
        s.price,
        s.currency,
        s.is_active,
        s.created_at,
        s.updated_at
    FROM `services` s
    INNER JOIN `service_category_map` scm ON s.id = scm.service_id
    WHERE scm.category_id = categoryIdIN
      AND s.is_deleted = FALSE
      AND s.is_active = TRUE
    ORDER BY s.name ASC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getServicesByCompanyId` (IN `companyIdIN` INT)   BEGIN

SELECT 
    s.id,
    s.name,
    s.description,
    s.duration_minutes,
    s.price,
    s.currency,
    s.is_active,
    s.created_at,
    s.updated_at,
    GROUP_CONCAT(DISTINCT sc.name SEPARATOR ', ') AS categories
FROM `services` s
LEFT JOIN `service_category_map` scm ON s.id = scm.service_id
LEFT JOIN `service_categories` sc ON scm.category_id = sc.id
WHERE s.company_id = companyIdIN
  AND s.is_deleted = FALSE
GROUP BY s.id, s.name, s.description, s.duration_minutes, s.price, s.currency, 
         s.is_active, s.created_at, s.updated_at
ORDER BY s.is_active DESC, s.name ASC;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getStaffByCompany` (IN `companyIdIN` INT, IN `isActiveIN` TINYINT(1))   BEGIN
    SELECT 
        s.*,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.is_active AS user_is_active
    FROM `staff` s
    INNER JOIN `users` u ON s.user_id = u.id
    WHERE s.company_id = companyIdIN
      AND (isActiveIN IS NULL OR s.is_active = isActiveIN)
      AND u.is_deleted = FALSE
    ORDER BY s.display_name;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getStaffByCompanyAndServices` (IN `companyIdIN` INT, IN `serviceIdsIN` VARCHAR(255))   BEGIN
    -- Service ID-k száma (hány szolgáltatást kell tudnia)
    DECLARE serviceCount INT;
    
    -- Számoljuk meg hány service ID van
    SET serviceCount = (LENGTH(serviceIdsIN) - LENGTH(REPLACE(serviceIdsIN, ',', '')) + 1);
    
    -- Staff-ok akik MINDEN serviceId-t tudják
    SELECT 
        s.id,
        s.user_id,
        s.display_name,
        s.specialties,
        s.bio,
        s.is_active,
        s.company_id,
        u.first_name,
        u.last_name,
        (SELECT i.url 
         FROM images i 
         WHERE i.user_id = u.id 
           AND i.is_deleted = 0 
         LIMIT 1
        ) AS imageUrl,  -- NULL ha nincs kép
        (SELECT COUNT(DISTINCT ss.service_id) 
         FROM staff_services ss 
         WHERE ss.staff_id = s.id
        ) AS services_count
        
    FROM staff s
    INNER JOIN users u ON s.user_id = u.id
    
    WHERE s.company_id = companyIdIN
      AND s.is_active = 1
      AND u.is_deleted = 0
      AND u.is_active = 1
      
      -- Csak azok akik MINDEN serviceId-t tudják
      AND (
          SELECT COUNT(DISTINCT ss2.service_id)
          FROM staff_services ss2
          WHERE ss2.staff_id = s.id
            AND FIND_IN_SET(ss2.service_id, serviceIdsIN) > 0
      ) = serviceCount
      
    ORDER BY s.display_name;
    
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getStaffById` (IN `staffIdIN` INT)   BEGIN
    SELECT 
        -- Staff alapadatok
        s.id AS staff_id,
        s.display_name,
        s.specialties,
        s.bio,
        s.is_active AS staff_is_active,
        s.created_at AS staff_created_at,
        s.updated_at AS staff_updated_at,
        
        -- User adatok
        u.id AS user_id,
        u.first_name,
        u.last_name,
        CONCAT(u.first_name, ' ', u.last_name) AS full_name,
        u.email,
        u.phone,
        u.is_active AS user_is_active,
        
        -- Company adatok
        c.id AS company_id,
        c.name AS company_name,
        c.address AS company_address,
        c.city AS company_city,
        c.postal_code AS company_postal_code,
        c.country AS company_country,
        
        -- Profil kép
        COALESCE(
            (
                SELECT i.url 
                FROM `images` i 
                WHERE i.user_id = u.id 
                  AND i.is_deleted = 0 
                LIMIT 1
            ),
            'https://via.placeholder.com/200x200?text=No+Image'
        ) AS profile_image_url,
        
        -- Hozzárendelt szolgáltatások száma
        (
            SELECT COUNT(DISTINCT ss.service_id)
            FROM `staff_services` ss
            WHERE ss.staff_id = s.id
        ) AS services_count
        
    FROM `staff` s
    INNER JOIN `users` u ON s.user_id = u.id
    INNER JOIN `companies` c ON s.company_id = c.id
    
    WHERE s.id = staffIdIN
    LIMIT 1;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getStaffExceptions` (IN `staffIdIN` INT, IN `dateFromIN` DATE, IN `dateToIN` DATE)   BEGIN
    -- Ellenőrzi, hogy a staff létezik
    IF NOT EXISTS (
        SELECT 1 FROM `staff` WHERE `id` = staffIdIN
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Staff not found';
    END IF;
    
    -- Exceptions lekérése
    SELECT 
        `id`,
        `staff_id`,
        `date`,
        `start_time`,
        `end_time`,
        `type`,
        `note`,
        `created_at`
    FROM `staff_exceptions`
    WHERE `staff_id` = staffIdIN
      AND `is_deleted` = FALSE
      -- Ha dateFromIN megvan, akkor >= dateFromIN
      AND (dateFromIN IS NULL OR `date` >= dateFromIN)
      -- Ha dateToIN megvan, akkor <= dateToIN
      AND (dateToIN IS NULL OR `date` <= dateToIN)
    ORDER BY `date` ASC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getStaffServicesActive` (IN `staffIdIN` INT)   BEGIN
    SELECT 
        s.*,
        GROUP_CONCAT(DISTINCT sc.name SEPARATOR ', ') AS categories
    FROM `staff_services` ss
    INNER JOIN `services` s ON ss.service_id = s.id
    LEFT JOIN `service_category_map` scm ON s.id = scm.service_id
    LEFT JOIN `service_categories` sc ON scm.category_id = sc.id
    WHERE ss.staff_id = staffIdIN
      AND s.is_active = TRUE
      AND s.is_deleted = FALSE
    GROUP BY s.id
    ORDER BY s.name;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getStaffServicesDetailed` (IN `staffIdIN` INT)   BEGIN
    SELECT 
        -- Service alapadatok
        s.id AS service_id,
        s.name AS service_name,
        s.description,
        s.duration_minutes,
        s.price,
        s.currency,
        s.is_active,
        
        -- Kategóriák
        GROUP_CONCAT(DISTINCT sc.name ORDER BY sc.name SEPARATOR ', ') AS categories,
        GROUP_CONCAT(DISTINCT sc.id ORDER BY sc.id SEPARATOR ',') AS category_ids,
        
        -- Staff mapping info
        ss.created_at AS assigned_at
        
    FROM `staff_services` ss
    INNER JOIN `services` s ON ss.service_id = s.id
    LEFT JOIN `service_category_map` scm ON s.id = scm.service_id
    LEFT JOIN `service_categories` sc ON scm.category_id = sc.id
    
    WHERE ss.staff_id = staffIdIN
      AND s.is_deleted = FALSE
    
    GROUP BY 
        s.id, s.name, s.description, s.duration_minutes, 
        s.price, s.currency, s.is_active, ss.created_at
    
    ORDER BY s.is_active DESC, s.name ASC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getStaffWorkingHours` (IN `staffIdIN` INT)   BEGIN
    -- Ellenőrzi, hogy a staff létezik
    IF NOT EXISTS (
        SELECT 1 FROM `staff` WHERE `id` = staffIdIN
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Staff not found';
    END IF;
    
    -- Working hours lekérése hétfő-vasárnap sorrendben
    SELECT 
        `id`,
        `staff_id`,
        `day_of_week`,
        `start_time`,
        `end_time`,
        `is_available`,
        `created_at`,
        `updated_at`
    FROM `staff_working_hours`
    WHERE `staff_id` = staffIdIN
    ORDER BY 
        FIELD(`day_of_week`, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getTodayAppointments` (IN `companyIdIN` INT, IN `staffIdIN` INT)   BEGIN
    SELECT 
        a.id,
        a.start_time,
        a.end_time,
        a.status,
        a.notes,
        a.price,
        a.currency,
        s.name AS service_name,
        s.duration_minutes,
        CONCAT(u.first_name, ' ', u.last_name) AS client_name,
        u.phone AS client_phone,
        u.email AS client_email,
        CONCAT(staff_user.first_name, ' ', staff_user.last_name) AS staff_name
    FROM `appointments` a
    INNER JOIN `services` s ON a.service_id = s.id
    INNER JOIN `users` u ON a.client_id = u.id
    LEFT JOIN `staff` st ON a.staff_id = st.id
    LEFT JOIN `users` staff_user ON st.user_id = staff_user.id
    WHERE a.company_id = companyIdIN
      AND DATE(a.start_time) = CURDATE()
      AND (staffIdIN IS NULL OR a.staff_id = staffIdIN)
      AND a.status NOT IN ('cancelled')
    ORDER BY a.start_time ASC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getTopRecommendations` (IN `limitIN` INT)   BEGIN
    SELECT 
        c.id,
        c.name,
        ROUND(COALESCE(AVG(r.rating), 0), 1) AS rating,
        COUNT(r.id) AS reviewCount,
        CONCAT(c.address, ', ', c.postal_code, ' ', c.city, ', ', c.country) AS address,
        COALESCE(
            (SELECT `images`.`url`
             FROM `images`
             WHERE `images`.`company_id` = c.`id` 
               AND `images`.`is_deleted` = 0 
               AND `images`.`is_main` = 1 
             LIMIT 1
            ), 
            'https://via.placeholder.com/400x300'
        ) AS imageUrl
    FROM companies c
    LEFT JOIN reviews r ON r.company_id = c.id AND r.is_deleted = 0
    WHERE c.is_deleted = 0 AND c.is_active = 1
    GROUP BY c.id, c.name, c.address, c.postal_code, c.city, c.country
    ORDER BY rating DESC, reviewCount DESC
    LIMIT limitIN;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getUnavailableDatesInRange` (IN `companyIdIN` INT, IN `staffIdIN` INT, IN `dateFromIN` DATE, IN `dateToIN` DATE)   BEGIN
    DECLARE currentDate DATE;
    DECLARE dayName VARCHAR(20);
    DECLARE isCompanyOpen BOOLEAN;
    DECLARE isStaffWorking BOOLEAN;
    DECLARE hasException BOOLEAN;
    DECLARE exceptionType VARCHAR(20);
    
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_unavailable_dates (
        unavailable_date DATE,
        day_name VARCHAR(20),
        reason VARCHAR(100)
    );
    
    DELETE FROM temp_unavailable_dates;
    
    SET currentDate = dateFromIN;
   
    WHILE currentDate <= dateToIN DO
        SET dayName = LOWER(DATE_FORMAT(currentDate, '%W'));
        SET isCompanyOpen = FALSE;
        SET isStaffWorking = FALSE;
        SET hasException = FALSE;
        SET exceptionType = NULL;
       
        SELECT (oh.is_closed = FALSE AND oh.open_time IS NOT NULL)
        INTO isCompanyOpen
        FROM opening_hours oh
        WHERE oh.company_id = companyIdIN
          AND oh.day_of_week = dayName
        LIMIT 1;
       
        SELECT (swh.is_available = TRUE AND swh.start_time IS NOT NULL)
        INTO isStaffWorking
        FROM staff_working_hours swh
        WHERE swh.staff_id = staffIdIN
          AND swh.day_of_week = dayName
        LIMIT 1;
       
        SELECT TRUE, se.type
        INTO hasException, exceptionType
        FROM staff_exceptions se
        WHERE se.staff_id = staffIdIN
          AND se.date = currentDate
          AND se.is_deleted = FALSE
        LIMIT 1;
       
        IF currentDate < CURDATE() THEN
            INSERT INTO temp_unavailable_dates VALUES (currentDate, dayName, 'Past date');
           
        ELSEIF hasException = TRUE AND exceptionType = 'day_off' THEN
            INSERT INTO temp_unavailable_dates VALUES (currentDate, dayName, 'Staff day off');
           
        ELSEIF isCompanyOpen = FALSE THEN
            INSERT INTO temp_unavailable_dates VALUES (currentDate, dayName, 'Company closed');
           
        ELSEIF isStaffWorking = FALSE THEN
            INSERT INTO temp_unavailable_dates VALUES (currentDate, dayName, 'Staff not working');
        END IF;
       
        SET currentDate = DATE_ADD(currentDate, INTERVAL 1 DAY);
    END WHILE;
   
    SELECT * FROM temp_unavailable_dates ORDER BY unavailable_date;
   
    DROP TEMPORARY TABLE IF EXISTS temp_unavailable_dates;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getUserActiveSessions` (IN `userIdIN` INT)   BEGIN
    SELECT 
        `id`,
        `token`,
        `expires_at`,
        `created_at`,
        `ip_address`,
        `user_agent`
    FROM `tokens`
    WHERE `user_id` = userIdIN
      AND `is_revoked` = FALSE
      AND `expires_at` > NOW()
    ORDER BY `created_at` DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getUserByEmail` (IN `emailIN` VARCHAR(100))   BEGIN
    SELECT 
        u.*,
        GROUP_CONCAT(r.name SEPARATOR ', ') AS role_names,
        GROUP_CONCAT(r.description SEPARATOR '; ') AS role_descriptions
    FROM `users` u
    INNER JOIN `user_x_role` uxr ON u.id = uxr.user_id
    INNER JOIN `roles` r ON uxr.role_id = r.id
    WHERE u.email = emailIN
      AND u.is_deleted = FALSE
      AND uxr.is_un_assigned = FALSE
    GROUP BY u.id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getUserById` (IN `userIdIN` INT)   BEGIN
    SELECT 
        users.id,
        users.first_name,
        users.last_name,
        users.email,
        users.phone,
        images.url,
        users.company_id,
        GROUP_CONCAT(roles.name SEPARATOR ', ') AS role_names,
        users.created_at,
        users.last_login,
        users.is_deleted,
        users.is_active
    FROM users
    INNER JOIN user_x_role ON users.id = user_x_role.user_id
    INNER JOIN roles ON user_x_role.role_id = roles.id
    LEFT JOIN companies ON users.company_id = companies.id
    LEFT JOIN images ON users.id = images.user_id
    WHERE users.id = userIdIN
      AND user_x_role.is_un_assigned = FALSE
    GROUP BY users.id, images.id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getUserByRegToken` (IN `tokenIN` VARCHAR(100))   BEGIN
    -- Tokens táblából joinolva users-hez
    SELECT 
        u.`id`,
        u.`email`,
        u.`register_finished_at`,
        u.`is_active`,
        t.`expires_at`,
        t.`is_revoked`,
        t.`expires_at` < NOW() AS is_expired
    FROM `tokens` t
    INNER JOIN `users` u ON t.`user_id` = u.`id`
    WHERE t.`token` = tokenIN
      AND t.`type` = 'email_verify'
      AND u.`is_deleted` = FALSE
    LIMIT 1;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getUserFavorites` (IN `userIdIN` INT)   BEGIN
    SELECT 
        f.id AS favorite_id,
        f.created_at AS favorited_at,
        c.id AS company_id,
        c.name AS company_name,
        c.description,
        c.address,
        c.city,
        c.postal_code,
        c.country,
        c.phone,
        c.email,
        c.website,
        bc.name AS category,
        bc.icon AS category_icon,
        
        -- Rating és review count
        ROUND(COALESCE(AVG(r.rating), 0), 1) AS average_rating,
        COUNT(DISTINCT r.id) AS total_reviews,
        
        -- Main image URL
        COALESCE(
            (
                SELECT i.url 
                FROM `images` i 
                WHERE i.company_id = c.id 
                  AND i.is_deleted = 0 
                  AND i.is_main = 1 
                LIMIT 1
            ),
            'https://via.placeholder.com/400x300?text=No+Image'
        ) AS image_url
        
    FROM `favorites` f
    INNER JOIN `companies` c ON f.company_id = c.id
    LEFT JOIN `business_categories` bc ON c.business_category_id = bc.id
    LEFT JOIN `reviews` r ON c.id = r.company_id AND r.is_deleted = 0
    
    WHERE f.user_id = userIdIN
      AND f.is_deleted = FALSE
      AND c.is_deleted = FALSE
      AND c.is_active = TRUE
    
    GROUP BY 
        f.id, f.created_at, c.id, c.name, c.description, c.address, 
        c.city, c.postal_code, c.country, c.phone, c.email, c.website,
        bc.name, bc.icon
    
    ORDER BY f.created_at DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getUserProfile` (IN `userIdIN` INT)   BEGIN
    SELECT 
        users.id,
        users.first_name,
        users.last_name,
        users.email,
        users.phone,
        images.url,
        users.created_at
    FROM users
    LEFT JOIN images ON users.id = images.user_id
    WHERE users.id = userIdIN
      AND users.is_deleted = FALSE
      AND users.is_active = TRUE
      AND images.is_deleted = false;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getUserProfilePicture` (IN `userIdIN` INT)   BEGIN
    SELECT 
        `id`,
        `user_id`,
        `url`,
        `uploaded_at`
    FROM `images`
    WHERE `user_id` = userIdIN
      AND `is_deleted` = FALSE
    LIMIT 1;  -- Max 1 user kép lehet
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getUsers` (IN `companyIdIN` INT, IN `roleIdIN` INT, IN `isActiveIN` BOOLEAN, IN `limitIN` INT, IN `offsetIN` INT)   BEGIN
    SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.company_id,
        u.is_active,
        u.last_login,
        u.created_at,
        GROUP_CONCAT(DISTINCT r.name SEPARATOR ', ') AS role_names,
        c.name AS company_name
    FROM `users` u
    INNER JOIN `user_x_role` uxr ON u.id = uxr.user_id
    INNER JOIN `roles` r ON uxr.role_id = r.id
    LEFT JOIN `companies` c ON u.company_id = c.id
    WHERE u.is_deleted = FALSE
      AND uxr.is_un_assigned = FALSE
      AND (companyIdIN IS NULL OR u.company_id = companyIdIN)
      AND (roleIdIN IS NULL OR uxr.role_id = roleIdIN)
      AND (isActiveIN IS NULL OR u.is_active = isActiveIN)
    GROUP BY u.id
    ORDER BY u.created_at DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getWorkingHoursForDate` (IN `companyIdIN` INT, IN `staffIdIN` INT, IN `dateIN` DATE)   BEGIN
    DECLARE dayName VARCHAR(20);
    DECLARE companyOpen TIME;
    DECLARE companyClose TIME;
    DECLARE companyIsClosed BOOLEAN;
    DECLARE staffStart TIME;
    DECLARE staffEnd TIME;
    DECLARE staffIsAvailable BOOLEAN;
    DECLARE hasException BOOLEAN DEFAULT FALSE;
    DECLARE exceptionType VARCHAR(20);
    DECLARE exceptionStart TIME;
    DECLARE exceptionEnd TIME;
    
    DECLARE finalStartTime TIME DEFAULT NULL;
    DECLARE finalEndTime TIME DEFAULT NULL;
    DECLARE finalIsAvailable BOOLEAN DEFAULT TRUE;
    DECLARE finalReason VARCHAR(100) DEFAULT NULL;
    
    SET dayName = LOWER(DATE_FORMAT(dateIN, '%W'));
    
    SELECT 
        oh.open_time,
        oh.close_time,
        oh.is_closed
    INTO 
        companyOpen,
        companyClose,
        companyIsClosed
    FROM opening_hours oh
    WHERE oh.company_id = companyIdIN
      AND oh.day_of_week = dayName
    LIMIT 1;
    
    SELECT 
        swh.start_time,
        swh.end_time,
        swh.is_available
    INTO 
        staffStart,
        staffEnd,
        staffIsAvailable
    FROM staff_working_hours swh
    WHERE swh.staff_id = staffIdIN
      AND swh.day_of_week = dayName
    LIMIT 1;
    
    SELECT 
        TRUE,
        se.type,
        se.start_time,
        se.end_time
    INTO 
        hasException,
        exceptionType,
        exceptionStart,
        exceptionEnd
    FROM staff_exceptions se
    WHERE se.staff_id = staffIdIN
      AND se.date = dateIN
      AND se.is_deleted = FALSE
    LIMIT 1;
    
    IF hasException = TRUE AND exceptionType = 'day_off' THEN
        SET finalStartTime = NULL;
        SET finalEndTime = NULL;
        SET finalIsAvailable = FALSE;
        SET finalReason = 'Staff day off';
        
    ELSEIF companyIsClosed = TRUE THEN
        SET finalStartTime = NULL;
        SET finalEndTime = NULL;
        SET finalIsAvailable = FALSE;
        SET finalReason = 'Company closed';
        
    ELSEIF staffIsAvailable = FALSE THEN
        SET finalStartTime = NULL;
        SET finalEndTime = NULL;
        SET finalIsAvailable = FALSE;
        SET finalReason = 'Staff not working';
        
    ELSE
        IF hasException = TRUE AND exceptionType = 'custom_hours' THEN
            SET staffStart = exceptionStart;
            SET staffEnd = exceptionEnd;
        END IF;
        
        SET finalStartTime = GREATEST(companyOpen, staffStart);
        SET finalEndTime = LEAST(companyClose, staffEnd);
        SET finalIsAvailable = TRUE;
        SET finalReason = NULL;
    END IF;
    
    SELECT 
        finalStartTime AS start_time,
        finalEndTime AS end_time,
        finalIsAvailable AS is_available,
        finalReason AS reason;
    
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `isFavorite` (IN `userIdIN` INT, IN `companyIdIN` INT)   BEGIN
    SELECT 
        CASE 
            WHEN COUNT(*) > 0 THEN 1
            ELSE 0
        END AS is_favorite,
        MAX(created_at) AS favorited_at
    FROM `favorites`
    WHERE `user_id` = userIdIN
      AND `company_id` = companyIdIN
      AND `is_deleted` = FALSE;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `logAudit` (IN `performedByUserIdIN` INT, IN `performedByRoleIN` VARCHAR(50), IN `affectedUserIdIN` INT, IN `companyIdIN` INT, IN `emailIN` VARCHAR(200), IN `entityTypeIN` VARCHAR(50), IN `actionIN` VARCHAR(100), IN `oldValuesIN` JSON, IN `newValuesIN` JSON)   BEGIN
    INSERT INTO audit_logs (
        performed_by_user_id,
        performed_by_role,
        affected_user_id,
        company_id,
        email,
        entity_type,
        action,
        old_values,
        new_values,
        created_at
    )
    VALUES (
        performedByUserIdIN,
        performedByRoleIN,
        affectedUserIdIN,
        companyIdIN,
        emailIN,
        entityTypeIN,
        actionIN,
        oldValuesIN,
        newValuesIN,
        NOW()
    );
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `login` (IN `emailIN` VARCHAR(200))   BEGIN
    SELECT 
        `users`.`id`,
        `users`.`first_name`,
        `users`.`last_name`,
        `users`.`email`,
        `users`.`password`,
       	`users`.`phone`,
        `users`.`company_id`,
        `images`.`url` AS "imageUrl",  -- Ez lehet NULL, ha nincs kép!
        GROUP_CONCAT(`roles`.`name` SEPARATOR ', ') AS "roles"
    FROM `users`
    INNER JOIN `user_x_role` ON `user_x_role`.`user_id` = `users`.`id`
    INNER JOIN `roles` ON `roles`.`id` = `user_x_role`.`role_id`
    
    -- ================================================================
    -- JAVÍTÁS: INNER JOIN → LEFT JOIN
    -- ================================================================
    LEFT JOIN `images` ON `images`.`user_id` = `users`.id 
                       AND `images`.`is_deleted` = FALSE
    -- ================================================================
    
    WHERE `users`.`email` = emailIN
      AND `users`.`is_deleted` = FALSE
      AND `user_x_role`.`is_un_assigned` = FALSE
    GROUP BY `users`.`id`, `images`.`id`
    LIMIT 1;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `regenerateAuthSecret` (IN `userIdIN` INT, IN `newAuthSecretIN` VARCHAR(16))   BEGIN
    UPDATE `users`
    SET 
        `auth_secret` = newAuthSecretIN,
        `updated_at` = NOW()
    WHERE `id` = userIdIN
      AND `is_deleted` = FALSE;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `register` (IN `firstNameIN` VARCHAR(100), IN `lastNameIN` VARCHAR(100), IN `emailIN` VARCHAR(100), IN `passwordIN` TEXT, IN `phoneIN` VARCHAR(30), IN `roleNameIN` VARCHAR(50), IN `companyIdIN` INT)   BEGIN
    DECLARE newUserId INT;
    DECLARE roleId INT;
    DECLARE regToken VARCHAR(64);
    
    -- Reg token generálása
    SET regToken = MD5(CONCAT(emailIN, NOW(), RAND()));
    
    -- Role ID lekérése a role name alapján
    SELECT `id` INTO roleId 
    FROM `roles` 
    WHERE `name` = roleNameIN 
    LIMIT 1;
    
    -- Ellenőrzés: létezik-e a role
    IF roleId IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid role name';
    END IF;
    
    -- User létrehozása (reg_token NÉLKÜL!)
    INSERT INTO `users` (
        `first_name`,
        `last_name`,
        `email`,
        `password`,
        `phone`,
        `company_id`,
        `is_active`
    )
    VALUES (
        firstNameIN,
        lastNameIN,
        emailIN,
        passwordIN,
        phoneIN,
        companyIdIN,
        FALSE
    );
    
    -- Új user ID lekérése
    SET newUserId = LAST_INSERT_ID();
    
    -- Szerepkör hozzárendelése a user_x_role táblában
    INSERT INTO `user_x_role` (
        `user_id`,
        `role_id`,
        `assigned_at`
    )
    VALUES (
        newUserId,
        roleId,
        NOW()
    );
    
    -- Images tábla insert NULL url-lel
INSERT INTO `images` (
    `user_id`,
    `url`,
    `uploaded_at`
)
VALUES (
    newUserId,
    NULL,
    NOW()
);
    
    -- Token mentése a tokens táblába
    INSERT INTO `tokens` (
        `user_id`,
        `token`,
        `type`,
        `expires_at`,
        `is_revoked`,
        `created_at`
    )
    VALUES (
        newUserId,
        regToken,
        'email_verify',
        DATE_ADD(NOW(), INTERVAL 24 HOUR),
        FALSE,
        NOW()
    );
    
    -- Visszaadjuk az új user ID-t és a reg token-t
    SELECT newUserId AS user_id, regToken AS reg_token;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `registerOwner` (IN `firstNameIN` VARCHAR(100), IN `lastNameIN` VARCHAR(100), IN `emailIN` VARCHAR(100), IN `passwordIN` TEXT, IN `phoneIN` VARCHAR(30), IN `authSecretIN` VARCHAR(16), IN `companyNameIN` VARCHAR(255), IN `companyDescriptionIN` TEXT, IN `companyAddressIN` TEXT, IN `companyCityIN` VARCHAR(100), IN `companyPostalCodeIN` VARCHAR(20), IN `companyCountryIN` VARCHAR(100), IN `companyPhoneIN` VARCHAR(30), IN `companyEmailIN` VARCHAR(100), IN `companyWebsiteIN` VARCHAR(255))   BEGIN
    DECLARE newUserId INT;
    DECLARE ownerRoleId INT;
    DECLARE regToken VARCHAR(64);
    DECLARE newCompanyId INT;
    
    SET regToken = MD5(CONCAT(emailIN, NOW(), RAND()));
    
    SELECT `id` INTO ownerRoleId 
    FROM `roles` 
    WHERE `name` = 'owner' 
    LIMIT 1;
    
    -- User létrehozása (reg_token NÉLKÜL!)
    INSERT INTO `users` (
        `guid`,
        `first_name`,
        `last_name`,
        `email`,
        `password`,
        `phone`,
        `auth_secret`,
        `company_id`,
        `is_active`
    )
    VALUES (
        UUID(),
        firstNameIN,
        lastNameIN,
        emailIN,
        passwordIN,
        phoneIN,
        authSecretIN,
        NULL,
        FALSE
    );
    
    SET newUserId = LAST_INSERT_ID();
    
    INSERT INTO `user_x_role` (
        `user_id`,
        `role_id`,
        `assigned_at`
    )
    VALUES (
        newUserId,
        ownerRoleId,
        NOW()
    );
    
    INSERT INTO `companies` (
        `name`,
        `description`,
        `address`,
        `city`,
        `postal_code`,
        `country`,
        `phone`,
        `email`,
        `website`,
        `owner_id`,
        `is_active`
    )
    VALUES (
        companyNameIN,
        companyDescriptionIN,
        companyAddressIN,
        companyCityIN,
        companyPostalCodeIN,
        IFNULL(companyCountryIN, 'Hungary'),
        companyPhoneIN,
        companyEmailIN,
        companyWebsiteIN,
        newUserId,
        TRUE
    );
    
    SET newCompanyId = LAST_INSERT_ID();
    
    UPDATE `users`
    SET `company_id` = newCompanyId
    WHERE `id` = newUserId;
    
    -- Token a tokens táblába
    INSERT INTO `tokens` (
        `user_id`,
        `token`,
        `type`,
        `expires_at`,
        `is_revoked`,
        `created_at`
    )
    VALUES (
        newUserId,
        regToken,
        'email_verify',
        DATE_ADD(NOW(), INTERVAL 24 HOUR),
        FALSE,
        NOW()
    );
    
    INSERT INTO `audit_logs` (
    `performed_by_user_id`,
    `performed_by_role`,
    `affected_user_id`,
    `company_id`,
    `email`,
    `entity_type`,
    `action`,
    `old_values`,
    `new_values`,
    `created_at`
)
VALUES (
    newUserId,
    'owner',                -- Owner role
    newUserId,
    newCompanyId,           -- Van cég ID!
    emailIN,
    'user',
    'register',
    NULL,
    JSON_OBJECT(
        'user_id', newUserId,
        'company_id', newCompanyId,  -- Ez is benne van
        'email', emailIN,
        'role', 'owner',
        'first_name', firstNameIN,
        'last_name', lastNameIN,
        'company_name', companyNameIN  -- Cég neve is
    ),
    NOW()
);
    
    SELECT newUserId AS user_id, newCompanyId AS company_id, regToken AS reg_token;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `registerStaff` (IN `firstNameIN` VARCHAR(100), IN `lastNameIN` VARCHAR(100), IN `emailIN` VARCHAR(100), IN `passwordIN` TEXT, IN `phoneIN` VARCHAR(30), IN `companyIdIN` INT, IN `authSecretIN` VARCHAR(32))   BEGIN
    DECLARE newUserId INT;
    DECLARE staffRoleId INT;
    DECLARE regToken VARCHAR(64);
    DECLARE newStaffId INT;
    
    SET regToken = MD5(CONCAT(emailIN, NOW(), RAND()));
    
    SELECT `id` INTO staffRoleId 
    FROM `roles` 
    WHERE `name` = 'staff' 
    LIMIT 1;
    
    -- User létrehozása (reg_token NÉLKÜL!)
    INSERT INTO `users` (
        `guid`,
        `first_name`,
        `last_name`,
        `email`,
        `password`,
        `phone`,
        `auth_secret`,
        `company_id`,
        `is_active`
    )
    VALUES (
        UUID(),
        firstNameIN,
        lastNameIN,
        emailIN,
        passwordIN,
        phoneIN,
        authSecretIN,
        companyIdIN,
        FALSE
    );
    
    SET newUserId = LAST_INSERT_ID();
    
    INSERT INTO `user_x_role` (
        `user_id`,
        `role_id`,
        `assigned_at`
    )
    VALUES (
        newUserId,
        staffRoleId,
        NOW()
    );
    
    INSERT INTO `staff` (
        `user_id`,
        `company_id`,
        `is_active`
    )
    VALUES (
        newUserId,
        companyIdIN,
        FALSE
    );
    
    SET newStaffId = LAST_INSERT_ID();
    
    -- Token a tokens táblába
    INSERT INTO `tokens` (
        `user_id`,
        `token`,
        `type`,
        `expires_at`,
        `is_revoked`,
        `created_at`
    )
    VALUES (
        newUserId,
        regToken,
        'email_verify',
        DATE_ADD(NOW(), INTERVAL 24 HOUR),
        FALSE,
        NOW()
    );
    
    -- ...procedure vége előtt...
INSERT INTO `audit_logs` (
    `performed_by_user_id`,
    `performed_by_role`,
    `affected_user_id`,
    `company_id`,
    `email`,
    `entity_type`,
    `action`,
    `old_values`,
    `new_values`,
    `created_at`
)
VALUES (
    newUserId,
    'staff',                -- Staff role
    newUserId,
    companyIdIN,           -- Van cég ID (paraméterben jön)
    emailIN,
    'user',
    'register',
    NULL,
    JSON_OBJECT(
        'user_id', newUserId,
        'staff_id', newStaffId,     -- Staff ID is
        'company_id', companyIdIN,
        'email', emailIN,
        'role', 'staff',
        'first_name', firstNameIN,
        'last_name', lastNameIN
    ),
    NOW()
);
    
    SELECT newUserId AS user_id, newStaffId AS staff_id, regToken AS reg_token;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `removeFavorite` (IN `userIdIN` INT, IN `companyIdIN` INT)   BEGIN
    DECLARE favoriteCount INT DEFAULT 0;
    
    -- Ellenőrzi, hogy van-e aktív favorite
    SELECT COUNT(*) INTO favoriteCount
    FROM `favorites`
    WHERE `user_id` = userIdIN
      AND `company_id` = companyIdIN
      AND `is_deleted` = FALSE;
    
    -- Ha nincs aktív favorite, akkor error
    IF favoriteCount = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Favorite not found or already removed';
    END IF;
    
    -- Soft delete a favorite-ot
    UPDATE `favorites`
    SET 
        `is_deleted` = TRUE,
        `deleted_at` = NOW()
    WHERE `user_id` = userIdIN
      AND `company_id` = companyIdIN
      AND `is_deleted` = FALSE;
    
    -- Visszajelzés
    SELECT 'SUCCESS' AS result, 'Favorite removed' AS message, ROW_COUNT() AS rows_affected;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `removeServiceFromStaff` (IN `staffIdIN` INT, IN `serviceIdIN` INT)   BEGIN
    -- Ellenőrzi, hogy létezik-e a kapcsolat
    IF NOT EXISTS (
        SELECT 1 
        FROM `staff_services`
        WHERE `staff_id` = staffIdIN
          AND `service_id` = serviceIdIN
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Service is not assigned to this staff member';
    END IF;
    
    -- Kapcsolat törlése
    DELETE FROM `staff_services`
    WHERE `staff_id` = staffIdIN
      AND `service_id` = serviceIdIN;
    
    SELECT 'SUCCESS' AS result, 'Service removed from staff' AS message;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `rescheduleAppointment` (IN `appointmentIdIN` INT, IN `newStartTimeIN` DATETIME, IN `newEndTimeIN` DATETIME, IN `rescheduledByIN` INT, IN `reasonIN` TEXT)   BEGIN
    DECLARE oldStartTime DATETIME;
    DECLARE oldEndTime DATETIME;
    DECLARE clientId INT;
    DECLARE reschedulerRole VARCHAR(50);
    
    -- Régi időpontok és client ID lementése
    SELECT start_time, end_time, client_id
    INTO oldStartTime, oldEndTime, clientId
    FROM appointments 
    WHERE id = appointmentIdIN;
    
    -- Reschedule végző user role lekérése
    SELECT r.name INTO reschedulerRole
    FROM users u
    INNER JOIN user_x_role uxr ON u.id = uxr.user_id
    INNER JOIN roles r ON uxr.role_id = r.id
    WHERE u.id = rescheduledByIN
      AND uxr.is_un_assigned = FALSE
    LIMIT 1;
    
    -- Időpont frissítése
    UPDATE `appointments`
    SET 
        `start_time` = newStartTimeIN,
        `end_time` = newEndTimeIN,
        `updated_at` = NOW()
    WHERE `id` = appointmentIdIN;
    
    -- Audit log bejegyzés az ÚJ struktúrával
    INSERT INTO `audit_logs` (
        performed_by_user_id,
        performed_by_role,
        affected_user_id,
        company_id,
        entity_type,
        action,
        old_values,
        new_values
    ) VALUES (
        rescheduledByIN,
        reschedulerRole,
        clientId,  -- Az érintett client
        NULL,
        'appointment',
        'reschedule',
        JSON_OBJECT('start_time', oldStartTime, 'end_time', oldEndTime, 'reason', reasonIN),
        JSON_OBJECT('start_time', newStartTimeIN, 'end_time', newEndTimeIN)
    );
    
    SELECT 'SUCCESS' AS result, 'Appointment rescheduled' AS message;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `resendEmailVerification` (IN `emailIN` VARCHAR(100))   BEGIN
    DECLARE userId INT DEFAULT NULL;
    DECLARE userIsActive BOOLEAN DEFAULT FALSE;
    DECLARE lastTokenTime DATETIME DEFAULT NULL;
    DECLARE newToken VARCHAR(64);
    DECLARE minutesSinceLastToken INT DEFAULT 0;
    
    -- User lekérése email alapján
    SELECT 
        `id`,
        `is_active`
    INTO 
        userId,
        userIsActive
    FROM `users`
    WHERE `email` = emailIN
      AND `is_deleted` = FALSE
    LIMIT 1;
    
    -- Ellenőrzés 1: User létezik?
    IF userId IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User not found';
    END IF;
    
    -- Ellenőrzés 2: User már aktív?
    IF userIsActive = TRUE THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User is already active';
    END IF;
    
    -- Ellenőrzés 3: Rate limiting - legutóbbi token mikor lett generálva?
    SELECT 
        `created_at`,
        TIMESTAMPDIFF(MINUTE, `created_at`, NOW()) AS minutes_ago
    INTO 
        lastTokenTime,
        minutesSinceLastToken
    FROM `tokens`
    WHERE `user_id` = userId
      AND `type` = 'email_verify'
    ORDER BY `created_at` DESC
    LIMIT 1;
    
    -- Ha volt token és még nincs 5 perc
    IF lastTokenTime IS NOT NULL AND minutesSinceLastToken < 5 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Please wait 5 minutes before requesting a new verification email';
    END IF;
    
    -- Régi email_verify tokenek revoke-olása (tisztítás)
    UPDATE `tokens`
    SET 
        `is_revoked` = TRUE,
        `revoked_at` = NOW()
    WHERE `user_id` = userId
      AND `type` = 'email_verify'
      AND `is_revoked` = FALSE;
    
    -- Új token generálása
    SET newToken = MD5(CONCAT(emailIN, NOW(), RAND()));
    
    -- Új token mentése
    INSERT INTO `tokens` (
        `user_id`,
        `token`,
        `type`,
        `expires_at`,
        `is_revoked`,
        `created_at`
    )
    VALUES (
        userId,
        newToken,
        'email_verify',
        DATE_ADD(NOW(), INTERVAL 24 HOUR),
        FALSE,
        NOW()
    );
    
    -- Audit log (opcionális)
    INSERT INTO `audit_logs` (
        `user_id`,
        `company_id`,
        `email`,
        `entity_type`,
        `action`,
        `old_values`,
        `new_values`,
        `created_at`
    )
    VALUES (
        userId,
        NULL,
        emailIN,
        'user',
        'resend_email_verification',
        NULL,
        JSON_OBJECT('token_count', ROW_COUNT()),
        NOW()
    );
    
    -- Sikeres visszajelzés
    SELECT 
        'SUCCESS' AS result,
        'Verification email has been resent' AS message,
        newToken AS token,
        DATE_ADD(NOW(), INTERVAL 24 HOUR) AS expires_at,
        userId AS user_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `resetPasswordWithToken` (IN `tokenIN` VARCHAR(64), IN `newPasswordIN` TEXT)   BEGIN
    DECLARE tokenUserId INT DEFAULT NULL;
    
    -- Token validálás + user_id lekérése
    SELECT t.`user_id`
    INTO tokenUserId
    FROM `tokens` t
    WHERE t.`token` = tokenIN
      AND t.`type` = 'password_reset'
      AND t.`expires_at` > NOW()
      AND t.`is_revoked` = FALSE
    LIMIT 1;
    
    -- Ha nincs valid token, hibát dobunk
    IF tokenUserId IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid or expired reset token';
    END IF;
    
    -- Jelszó frissítése
    UPDATE `users`
    SET 
        `password` = newPasswordIN,
        `updated_at` = NOW()
    WHERE `id` = tokenUserId
      AND `is_deleted` = FALSE;
    
    -- Token revoke
    UPDATE `tokens`
    SET 
        `is_revoked` = TRUE,
        `revoked_at` = NOW()
    WHERE `token` = tokenIN
      AND `type` = 'password_reset';
    
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `revokeAllUserTokens` (IN `userIdIN` INT)   BEGIN
    UPDATE `tokens`
    SET 
        `is_revoked` = TRUE,
        `revoked_at` = NOW()
    WHERE `user_id` = userIdIN
      AND `is_revoked` = FALSE;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `revokeRefreshToken` (IN `tokenIN` VARCHAR(500))   BEGIN
    UPDATE `tokens`
    SET 
        `is_revoked` = TRUE,
        `revoked_at` = NOW()
    WHERE `token` = tokenIN;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `saveRefreshToken` (IN `userIdIN` INT, IN `tokenIN` VARCHAR(500), IN `expiresAtIN` DATETIME, IN `ipAddressIN` VARCHAR(45), IN `userAgentIN` TEXT)   BEGIN
    INSERT INTO `tokens` (
        `user_id`,
        `token`,
        `expires_at`,
        `ip_address`,
        `user_agent`
    )
    VALUES (
        userIdIN,
        tokenIN,
        expiresAtIN,
        ipAddressIN,
        userAgentIN
    );
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `searchCompaniesByService` (IN `serviceNameIN` VARCHAR(255), IN `cityIN` VARCHAR(100), IN `limitIN` INT, IN `offsetIN` INT)   BEGIN

SELECT DISTINCT
    c.id,
    c.name,
    c.description,
    c.city,
    c.address,
    c.phone,
    c.email,
    ROUND(AVG(r.rating), 2) AS average_rating,
    COUNT(DISTINCT r.id) AS total_reviews,
    i.url AS main_image_url,
    s.name AS service_name,
    s.price,
    s.currency,
    s.duration_minutes
FROM `companies` c
INNER JOIN `services` s ON c.id = s.company_id
LEFT JOIN `reviews` r ON c.id = r.company_id AND r.is_deleted = FALSE
LEFT JOIN `images` i ON c.id = i.company_id AND i.is_main = 1
WHERE c.is_deleted = FALSE
  AND c.is_active = TRUE
  AND s.is_deleted = FALSE
  AND s.is_active = TRUE
  AND s.name LIKE CONCAT('%', serviceNameIN, '%')
  AND (cityIN IS NULL OR c.city = cityIN)
GROUP BY c.id, c.name, c.description, c.city, c.address, c.phone, c.email,
         i.url, s.id, s.name, s.price, s.currency, s.duration_minutes
ORDER BY average_rating DESC, c.name ASC
LIMIT limitIN OFFSET offsetIN;

SELECT COUNT(DISTINCT c.id) AS total_companies
FROM `companies` c
INNER JOIN `services` s ON c.id = s.company_id
WHERE c.is_deleted = FALSE
  AND c.is_active = TRUE
  AND s.is_deleted = FALSE
  AND s.is_active = TRUE
  AND s.name LIKE CONCAT('%', serviceNameIN, '%')
  AND (cityIN IS NULL OR c.city = cityIN);
  
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `setCompanyMainImage` (IN `imageIdIN` INT, IN `companyIdIN` INT)   BEGIN
    -- Ellenőrzi, hogy a kép létezik és a céghez tartozik
    IF NOT EXISTS (
        SELECT 1 
        FROM `images` 
        WHERE `id` = imageIdIN 
          AND `company_id` = companyIdIN
          AND `is_deleted` = FALSE
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Image not found or does not belong to this company';
    END IF;
    
    -- Leveszi a main flag-et az összes képről
    UPDATE `images`
    SET `is_main` = FALSE
    WHERE `company_id` = companyIdIN
      AND `is_deleted` = FALSE;
    
    -- Beállítja az új main képet
    UPDATE `images`
    SET `is_main` = TRUE
    WHERE `id` = imageIdIN;
    
    SELECT 'SUCCESS' AS result, 'Main image updated' AS message;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `softDeleteUser` (IN `userIdIN` INT)   BEGIN
    UPDATE `users`
    SET 
        `is_deleted` = TRUE,
        `deleted_at` = NOW(),
        `is_active` = FALSE
    WHERE `id` = userIdIN;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateAppointmentStatus` (IN `appointmentIdIN` INT, IN `newStatusIN` ENUM('pending','confirmed','cancelled','completed','no_show','in_progress'))   BEGIN
    UPDATE `appointments`
    SET 
        `status` = newStatusIN,
        `updated_at` = NOW()
    WHERE `id` = appointmentIdIN;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateCompany` (IN `companyIdIN` INT, IN `nameIN` VARCHAR(255), IN `descriptionIN` TEXT, IN `addressIN` TEXT, IN `cityIN` VARCHAR(100), IN `postalCodeIN` VARCHAR(20), IN `countryIN` VARCHAR(100), IN `phoneIN` VARCHAR(30), IN `emailIN` VARCHAR(100), IN `websiteIN` VARCHAR(255), IN `bookingAdvanceDaysIN` INT, IN `cancellationHoursIN` INT, IN `allowSameDayBookingIN` TINYINT(1), IN `minimumBookingHoursAheadIN` INT)   BEGIN
    -- Validáció: Ha same-day booking tiltva, akkor minimum_hours_ahead NULL legyen
    IF allowSameDayBookingIN = FALSE THEN
        SET minimumBookingHoursAheadIN = NULL;
    END IF;
    
    -- Validáció: Ha same-day booking engedélyezve, akkor minimum_hours_ahead kötelező
    IF allowSameDayBookingIN = TRUE AND (minimumBookingHoursAheadIN IS NULL OR minimumBookingHoursAheadIN < 1) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'If same-day booking is allowed, minimum_booking_hours_ahead must be at least 1';
    END IF;
    
    UPDATE companies
    SET 
        name = nameIN,
        description = descriptionIN,
        address = addressIN,
        city = cityIN,
        postal_code = postalCodeIN,
        country = countryIN,
        phone = phoneIN,
        email = emailIN,
        website = websiteIN,
        booking_advance_days = bookingAdvanceDaysIN,
        cancellation_hours = cancellationHoursIN,
        allow_same_day_booking = allowSameDayBookingIN,
        minimum_booking_hours_ahead = minimumBookingHoursAheadIN,
        updated_at = NOW()
    WHERE id = companyIdIN
      AND is_deleted = FALSE;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateEmail` (IN `userIdIN` INT, IN `newEmailIN` VARCHAR(100))   BEGIN
    DECLARE verifyToken VARCHAR(64);
    
    -- Token generálás
    SET verifyToken = MD5(CONCAT(newEmailIN, NOW(), RAND()));
    
    -- Email frissítése (inaktív lesz, újra kell aktiválni)
    UPDATE `users`
    SET 
        `email` = newEmailIN,
        `is_active` = FALSE,
        `updated_at` = NOW()
    WHERE `id` = userIdIN
      AND `is_deleted` = FALSE;
    
    -- Új verification token
    INSERT INTO `tokens` (
        `user_id`,
        `token`,
        `type`,
        `expires_at`,
        `is_revoked`,
        `created_at`
    )
    VALUES (
        userIdIN,
        verifyToken,
        'email_verify',
        DATE_ADD(NOW(), INTERVAL 24 HOUR),
        FALSE,
        NOW()
    );
    
    -- Token visszaadása
    SELECT verifyToken AS reg_token;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateLastLogin` (IN `userIdIN` INT)   BEGIN
    UPDATE `users`
    SET `last_login` = NOW()
    WHERE `id` = userIdIN
      AND `is_deleted` = FALSE;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateOpeningHoursDay` (IN `companyIdIN` INT, IN `dayOfWeekIN` VARCHAR(20), IN `openTimeIN` TIME, IN `closeTimeIN` TIME, IN `isClosedIN` TINYINT(1))   BEGIN
    UPDATE `opening_hours`
    SET 
        `open_time` = IF(isClosedIN = TRUE, NULL, openTimeIN),
        `close_time` = IF(isClosedIN = TRUE, NULL, closeTimeIN),
        `is_closed` = isClosedIN,
        `updated_at` = NOW()
    WHERE `company_id` = companyIdIN
      AND `day_of_week` = dayOfWeekIN;
      
    IF ROW_COUNT() = 0 THEN
        INSERT INTO `opening_hours` (
            `company_id`,
            `day_of_week`,
            `open_time`,
            `close_time`,
            `is_closed`
        )
        VALUES (
            companyIdIN,
            dayOfWeekIN,
            IF(isClosedIN = TRUE, NULL, openTimeIN),
            IF(isClosedIN = TRUE, NULL, closeTimeIN),
            isClosedIN
        );
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updatePassword` (IN `userIdIN` INT, IN `newPasswordIN` TEXT)   BEGIN
    UPDATE `users`
    SET 
        `password` = newPasswordIN,
        `updated_at` = NOW()
    WHERE `id` = userIdIN
      AND `is_deleted` = FALSE;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateService` (IN `serviceIdIN` INT, IN `nameIN` VARCHAR(255), IN `descriptionIN` TEXT, IN `durationMinutesIN` INT, IN `priceIN` DECIMAL(10,2), IN `currencyIN` VARCHAR(10), IN `isActiveIN` TINYINT(1))   BEGIN
    UPDATE `services`
    SET 
        `name` = nameIN,
        `description` = descriptionIN,
        `duration_minutes` = durationMinutesIN,
        `price` = priceIN,
        `currency` = currencyIN,
        `is_active` = isActiveIN,
        `updated_at` = NOW()
    WHERE `id` = serviceIdIN
      AND `is_deleted` = FALSE;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateServiceCategory` (IN `categoryIdIN` INT, IN `nameIN` VARCHAR(255), IN `descriptionIN` TEXT)   BEGIN
    -- Kategória frissítése
    UPDATE `service_categories`
    SET 
        `name` = nameIN,
        `description` = descriptionIN,
        `updated_at` = NOW()
    WHERE `id` = categoryIdIN;
    
    -- Ellenőrzi, hogy sikerült-e
    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Category not found';
    END IF;
    
    SELECT 'SUCCESS' AS result, 'Category updated' AS message;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateStaff` (IN `staffIdIN` INT, IN `displayNameIN` VARCHAR(255), IN `specialtiesIN` TEXT, IN `bioIN` TEXT)   BEGIN
    -- Ellenőrzi, hogy a staff létezik
    IF NOT EXISTS (
        SELECT 1 FROM `staff` 
        WHERE `id` = staffIdIN
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Staff not found';
    END IF;
    
    -- Staff adatok frissítése
    UPDATE `staff`
    SET 
        `display_name` = displayNameIN,
        `specialties` = specialtiesIN,
        `bio` = bioIN,
        `updated_at` = NOW()
    WHERE `id` = staffIdIN;
    
    -- Visszajelzés
    SELECT 'SUCCESS' AS result, 'Staff updated successfully' AS message, staffIdIN AS staff_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateStaffWorkingHours` (IN `staffIdIN` INT, IN `dayOfWeekIN` VARCHAR(20), IN `startTimeIN` TIME, IN `endTimeIN` TIME, IN `isAvailableIN` TINYINT(1))   BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM `staff` WHERE `id` = staffIdIN
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Staff not found';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM `staff_working_hours`
        WHERE `staff_id` = staffIdIN
          AND `day_of_week` = dayOfWeekIN
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Working hours not found for this day. Use createStaffWorkingHours first.';
    END IF;
    
    UPDATE `staff_working_hours`
    SET 
        `start_time` = IF(isAvailableIN = TRUE, startTimeIN, NULL),
        `end_time` = IF(isAvailableIN = TRUE, endTimeIN, NULL),
        `is_available` = isAvailableIN,
        `updated_at` = NOW()
    WHERE `staff_id` = staffIdIN
      AND `day_of_week` = dayOfWeekIN;
    
    SELECT 'SUCCESS' AS result, 
           CONCAT('Working hours updated for ', dayOfWeekIN) AS message,
           staffIdIN AS staff_id,
           dayOfWeekIN AS day_of_week;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateUser` (IN `userIdIN` INT, IN `firstNameIN` VARCHAR(100), IN `lastNameIN` VARCHAR(100), IN `phoneIN` VARCHAR(30))   BEGIN
    UPDATE `users`
    SET 
        `first_name` = firstNameIN,
        `last_name` = lastNameIN,
        `phone` = phoneIN,
        `updated_at` = NOW()
    WHERE `id` = userIdIN
      AND `is_deleted` = FALSE;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `uploadCompanyImage` (IN `companyIdIN` INT, IN `urlIN` TEXT, IN `isMainIN` TINYINT(1))   BEGIN
    DECLARE currentImageCount INT;
    
    -- Ellenőrzi, hogy hány aktív képe van a cégnek
    SELECT COUNT(*) INTO currentImageCount
    FROM `images`
    WHERE `company_id` = companyIdIN
      AND `is_deleted` = FALSE;
    
    -- Maximum 4 kép lehet
    IF currentImageCount >= 4 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Maximum 4 images allowed per company';
    END IF;
    
    -- Ha main képnek jelöljük, akkor a többi képről levesszük a main flag-et
    IF isMainIN = TRUE THEN
        UPDATE `images`
        SET `is_main` = FALSE
        WHERE `company_id` = companyIdIN
          AND `is_deleted` = FALSE;
    END IF;
    
    -- Új kép feltöltése
    INSERT INTO `images` (
        `company_id`,
        `user_id`,
        `url`,
        `is_main`
    )
    VALUES (
        companyIdIN,
        NULL,
        urlIN,
        isMainIN
    );
    
    -- Visszaadjuk az új kép ID-t
    SELECT LAST_INSERT_ID() AS image_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `uploadUserImage` (IN `userIdIN` INT, IN `urlIN` TEXT)   BEGIN
    -- Régi profil kép soft delete (ha van)
    UPDATE `images`
    SET 
        `is_deleted` = TRUE,
        `deleted_at` = NOW()
    WHERE `user_id` = userIdIN
      AND `is_deleted` = FALSE;
    
    -- Új profil kép feltöltése
    INSERT INTO `images` (
        `company_id`,
        `user_id`,
        `url`,
        `is_main`
    )
    VALUES (
        NULL,
        userIdIN,
        urlIN,
        0  -- User képnél nincs értelme, de 0-ra állítjuk
    );
    
    -- Visszaadjuk az új kép ID-t
    SELECT LAST_INSERT_ID() AS image_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `validateBookingTime` (IN `companyIdIN` INT, IN `requestedStartTimeIN` DATETIME)   BEGIN
    DECLARE companyAllowSameDay TINYINT(1);
    DECLARE companyMinHoursAhead INT;
    DECLARE companyMaxAdvanceDays INT;
    DECLARE currentTime DATETIME;
    DECLARE requestedDate DATE;
    DECLARE currentDate DATE;
    DECLARE hoursDifference DECIMAL(10,2);
    DECLARE daysDifference INT;
    
    -- Jelenlegi időpont
    SET currentTime = NOW();
    SET currentDate = DATE(currentTime);
    SET requestedDate = DATE(requestedStartTimeIN);
    
    -- Company beállítások lekérése
    SELECT 
        allow_same_day_booking,
        minimum_booking_hours_ahead,
        booking_advance_days
    INTO 
        companyAllowSameDay,
        companyMinHoursAhead,
        companyMaxAdvanceDays
    FROM companies
    WHERE id = companyIdIN
      AND is_deleted = FALSE
      AND is_active = TRUE;
    
    -- Ellenőrzés: Létezik-e a cég
    IF companyAllowSameDay IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Company not found or inactive';
    END IF;
    
    -- Ellenőrzés: Múltbeli időpont
    IF requestedStartTimeIN <= currentTime THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot book appointments in the past';
    END IF;
    
    -- Számítások
    SET hoursDifference = TIMESTAMPDIFF(HOUR, currentTime, requestedStartTimeIN);
    SET daysDifference = DATEDIFF(requestedDate, currentDate);
    
    -- Ellenőrzés: Aznapi foglalás
    IF daysDifference = 0 THEN
        -- Aznapi foglalás - ellenőrizzük hogy engedélyezett-e
        IF companyAllowSameDay = FALSE THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Same-day booking is not allowed for this company';
        END IF;
        
        -- Aznapi foglalás - minimum órák előtte
        IF hoursDifference < companyMinHoursAhead THEN
            SET @errorMsg = CONCAT(
                'Appointments must be booked at least ', 
                companyMinHoursAhead, 
                ' hours in advance. You are trying to book in ', 
                ROUND(hoursDifference, 1), 
                ' hours.'
            );
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = @errorMsg;
        END IF;
    END IF;
    
    -- Ellenőrzés: Maximum előre foglalható napok
    IF daysDifference > companyMaxAdvanceDays THEN
        SET @errorMsg = CONCAT(
            'Bookings can only be made up to ', 
            companyMaxAdvanceDays, 
            ' days in advance. You are trying to book ', 
            daysDifference, 
            ' days ahead.'
        );
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = @errorMsg;
    END IF;
    
    -- Minden rendben - visszaad sikeres választ
    SELECT 
        'SUCCESS' AS result,
        'Booking time is valid' AS message,
        requestedStartTimeIN AS requested_time,
        hoursDifference AS hours_ahead,
        daysDifference AS days_ahead;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `validatePasswordResetToken` (IN `tokenIN` VARCHAR(64))   BEGIN
    DECLARE tokenUserId INT DEFAULT NULL;
    DECLARE tokenExpired BOOLEAN DEFAULT FALSE;
    DECLARE tokenRevoked BOOLEAN DEFAULT FALSE;
    DECLARE userEmail VARCHAR(100);
    
    -- Token validálás
    SELECT 
        t.`user_id`,
        t.`expires_at` < NOW() AS is_expired,
        t.`is_revoked`,
        u.`email`
    INTO 
        tokenUserId,
        tokenExpired,
        tokenRevoked,
        userEmail
    FROM `tokens` t
    INNER JOIN `users` u ON t.`user_id` = u.`id`
    WHERE t.`token` = tokenIN
      AND t.`type` = 'password_reset'
    LIMIT 1;
    
    -- Ellenőrzések
    IF tokenUserId IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid or non-existent token';
    END IF;
    
    IF tokenExpired THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Token has expired (15 minutes)';
    END IF;
    
    IF tokenRevoked THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Token has already been used';
    END IF;
    
    -- Token valid, visszaadjuk a user email-t (hogy lássa a frontend)
    SELECT 
        'SUCCESS' AS result,
        'Token is valid' AS message,
        tokenUserId AS user_id,
        userEmail AS email;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `validateRefreshToken` (IN `tokenIN` VARCHAR(500))   BEGIN
    SELECT *
    FROM `tokens`
    WHERE `token` = tokenIN
      AND `is_revoked` = FALSE
      AND `expires_at` > NOW();
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `verifyAuthSecret` (IN `userIdIN` INT, IN `authSecretIN` VARCHAR(16))   BEGIN
    SELECT COUNT(*) AS is_valid
    FROM `users`
    WHERE `id` = userIdIN
      AND `auth_secret` = authSecretIN
      AND `is_deleted` = FALSE
      AND `is_active` = TRUE;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `status` enum('pending','confirmed','cancelled','completed','no_show','in_progress') COLLATE utf8mb4_hungarian_ci NOT NULL DEFAULT 'pending',
  `notes` text COLLATE utf8mb4_hungarian_ci,
  `internal_notes` text COLLATE utf8mb4_hungarian_ci COMMENT 'Visible only to staff/admin',
  `price` decimal(10,2) NOT NULL,
  `currency` varchar(10) COLLATE utf8mb4_hungarian_ci NOT NULL,
  `cancelled_by` int(11) DEFAULT NULL,
  `cancelled_reason` text COLLATE utf8mb4_hungarian_ci,
  `cancelled_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`id`, `company_id`, `service_id`, `staff_id`, `client_id`, `start_time`, `end_time`, `status`, `notes`, `internal_notes`, `price`, `currency`, `cancelled_by`, `cancelled_reason`, `cancelled_at`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, 27, '2024-02-05 10:00:00', '2024-02-05 11:00:00', 'completed', 'Első alkalom', NULL, '8900.00', 'HUF', NULL, NULL, NULL, '2024-01-28 14:00:00', NULL),
(2, 1, 2, 1, 28, '2024-02-06 14:00:00', '2024-02-06 15:30:00', 'completed', NULL, NULL, '15900.00', 'HUF', NULL, NULL, NULL, '2024-01-29 10:00:00', NULL),
(3, 1, 3, 1, 29, '2024-02-08 11:00:00', '2024-02-08 12:15:00', 'completed', NULL, NULL, '12900.00', 'HUF', NULL, NULL, NULL, '2024-02-01 09:00:00', NULL),
(4, 1, 1, 1, 30, '2024-02-12 09:00:00', '2024-02-12 10:00:00', 'completed', NULL, NULL, '8900.00', 'HUF', NULL, NULL, NULL, '2024-02-05 16:00:00', NULL),
(5, 1, 2, 1, 31, '2024-02-14 15:00:00', '2024-02-14 16:30:00', 'completed', 'Valentin napi időpont', NULL, '15900.00', 'HUF', NULL, NULL, NULL, '2024-02-07 11:00:00', NULL),
(6, 1, 6, 1, 32, '2024-02-19 10:30:00', '2024-02-19 11:00:00', 'completed', NULL, NULL, '3900.00', 'HUF', NULL, NULL, NULL, '2024-02-12 13:00:00', NULL),
(7, 1, 3, 1, 33, '2024-02-21 13:00:00', '2024-02-21 14:15:00', 'completed', NULL, NULL, '12900.00', 'HUF', NULL, NULL, NULL, '2024-02-14 15:00:00', NULL),
(8, 1, 1, 1, 27, '2024-02-26 11:00:00', '2024-02-26 12:00:00', 'completed', 'Visszatérő ügyfél', NULL, '8900.00', 'HUF', NULL, NULL, NULL, '2024-02-19 10:00:00', NULL),
(9, 1, 2, 1, 34, '2024-03-04 10:00:00', '2024-03-04 11:30:00', 'completed', NULL, NULL, '15900.00', 'HUF', NULL, NULL, NULL, '2024-02-26 14:00:00', NULL),
(10, 1, 3, 1, 35, '2024-03-07 14:00:00', '2024-03-07 15:15:00', 'completed', NULL, NULL, '12900.00', 'HUF', NULL, NULL, NULL, '2024-03-01 09:00:00', NULL),
(11, 1, 1, 1, 28, '2024-03-11 09:30:00', '2024-03-11 10:30:00', 'completed', NULL, NULL, '8900.00', 'HUF', NULL, NULL, NULL, '2024-03-04 16:00:00', NULL),
(12, 1, 2, 1, 36, '2024-03-14 11:00:00', '2024-03-14 12:30:00', 'no_show', 'Nem jelent meg', NULL, '15900.00', 'HUF', NULL, NULL, NULL, '2024-03-07 10:00:00', NULL),
(13, 1, 6, 1, 29, '2024-03-18 10:00:00', '2024-03-18 10:30:00', 'completed', NULL, NULL, '3900.00', 'HUF', NULL, NULL, NULL, '2024-03-11 14:00:00', NULL),
(14, 1, 3, 1, 37, '2024-03-21 15:00:00', '2024-03-21 16:15:00', 'completed', NULL, NULL, '12900.00', 'HUF', NULL, NULL, NULL, '2024-03-14 11:00:00', NULL),
(15, 1, 1, 1, 30, '2024-03-25 09:00:00', '2024-03-25 10:00:00', 'completed', NULL, NULL, '8900.00', 'HUF', NULL, NULL, NULL, '2024-03-18 13:00:00', NULL),
(16, 1, 2, 1, 27, '2024-04-03 14:00:00', '2024-04-03 15:30:00', 'completed', NULL, NULL, '15900.00', 'HUF', NULL, NULL, NULL, '2024-03-27 10:00:00', '2026-01-14 09:16:13'),
(17, 1, 3, 1, 31, '2024-04-08 11:00:00', '2024-04-08 12:15:00', 'completed', NULL, NULL, '12900.00', 'HUF', NULL, NULL, NULL, '2024-04-01 14:00:00', '2026-01-14 09:16:13'),
(18, 1, 1, 1, 32, '2024-04-11 10:00:00', '2024-04-11 11:00:00', 'no_show', NULL, NULL, '8900.00', 'HUF', NULL, NULL, NULL, '2024-04-05 09:00:00', '2026-01-14 09:16:13'),
(19, 1, 2, 1, 33, '2024-04-15 13:00:00', '2024-04-15 14:30:00', 'no_show', NULL, NULL, '15900.00', 'HUF', NULL, NULL, NULL, '2024-04-08 16:00:00', '2026-01-14 09:16:13'),
(20, 1, 4, 2, 34, '2024-02-07 11:00:00', '2024-02-07 11:45:00', 'completed', NULL, NULL, '4900.00', 'HUF', NULL, NULL, NULL, '2024-02-01 10:00:00', NULL),
(21, 1, 5, 2, 35, '2024-02-09 15:00:00', '2024-02-09 16:00:00', 'completed', NULL, NULL, '6900.00', 'HUF', NULL, NULL, NULL, '2024-02-02 14:00:00', NULL),
(22, 1, 4, 2, 36, '2024-02-13 10:30:00', '2024-02-13 11:15:00', 'completed', NULL, NULL, '4900.00', 'HUF', NULL, NULL, NULL, '2024-02-06 09:00:00', NULL),
(23, 1, 5, 2, 37, '2024-02-16 14:00:00', '2024-02-16 15:00:00', 'completed', NULL, NULL, '6900.00', 'HUF', NULL, NULL, NULL, '2024-02-09 11:00:00', NULL),
(24, 1, 6, 2, 27, '2024-02-20 11:00:00', '2024-02-20 11:30:00', 'completed', NULL, NULL, '3900.00', 'HUF', NULL, NULL, NULL, '2024-02-13 15:00:00', NULL),
(25, 1, 4, 2, 28, '2024-02-23 16:00:00', '2024-02-23 16:45:00', 'completed', NULL, NULL, '4900.00', 'HUF', NULL, NULL, NULL, '2024-02-16 10:00:00', NULL),
(26, 1, 5, 2, 29, '2024-02-27 13:00:00', '2024-02-27 14:00:00', 'completed', NULL, NULL, '6900.00', 'HUF', NULL, NULL, NULL, '2024-02-20 14:00:00', NULL),
(27, 1, 4, 2, 30, '2024-03-05 15:00:00', '2024-03-05 15:45:00', 'completed', NULL, NULL, '4900.00', 'HUF', NULL, NULL, NULL, '2024-02-27 09:00:00', NULL),
(28, 1, 5, 2, 31, '2024-03-08 10:00:00', '2024-03-08 11:00:00', 'completed', NULL, NULL, '6900.00', 'HUF', NULL, NULL, NULL, '2024-03-01 16:00:00', NULL),
(29, 1, 6, 2, 32, '2024-03-12 14:30:00', '2024-03-12 15:00:00', 'completed', NULL, NULL, '3900.00', 'HUF', NULL, NULL, NULL, '2024-03-05 11:00:00', NULL),
(30, 1, 4, 2, 33, '2024-03-15 11:00:00', '2024-03-15 11:45:00', 'completed', NULL, NULL, '4900.00', 'HUF', NULL, NULL, NULL, '2024-03-08 10:00:00', NULL),
(31, 1, 5, 2, 34, '2024-03-19 16:00:00', '2024-03-19 17:00:00', 'completed', NULL, NULL, '6900.00', 'HUF', NULL, NULL, NULL, '2024-03-12 14:00:00', NULL),
(32, 1, 4, 2, 35, '2024-03-22 10:30:00', '2024-03-22 11:15:00', 'completed', NULL, NULL, '4900.00', 'HUF', NULL, NULL, NULL, '2024-03-15 09:00:00', NULL),
(33, 1, 5, 2, 36, '2024-03-26 15:00:00', '2024-03-26 16:00:00', 'cancelled', 'Ügyfél lemondta', NULL, '6900.00', 'HUF', NULL, NULL, NULL, '2024-03-19 11:00:00', NULL),
(34, 1, 4, 2, 37, '2024-04-05 14:00:00', '2024-04-05 14:45:00', 'completed', NULL, NULL, '4900.00', 'HUF', NULL, NULL, NULL, '2024-03-29 10:00:00', '2026-01-14 09:16:13'),
(35, 1, 5, 2, 27, '2024-04-09 11:00:00', '2024-04-09 12:00:00', 'completed', NULL, NULL, '6900.00', 'HUF', NULL, NULL, NULL, '2024-04-02 15:00:00', '2026-01-14 09:16:13'),
(36, 1, 6, 2, 28, '2024-04-12 10:00:00', '2024-04-12 10:30:00', 'no_show', NULL, NULL, '3900.00', 'HUF', NULL, NULL, NULL, '2024-04-06 09:00:00', '2026-01-14 09:16:13'),
(37, 1, 4, 2, 29, '2024-04-16 16:00:00', '2024-04-16 16:45:00', 'no_show', NULL, NULL, '4900.00', 'HUF', NULL, NULL, NULL, '2024-04-09 14:00:00', '2026-01-14 09:16:13'),
(38, 2, 7, 3, 30, '2024-02-06 10:00:00', '2024-02-06 11:00:00', 'completed', NULL, NULL, '11900.00', 'HUF', NULL, NULL, NULL, '2024-01-30 14:00:00', NULL),
(39, 2, 8, 3, 31, '2024-02-10 14:00:00', '2024-02-10 15:15:00', 'completed', NULL, NULL, '13900.00', 'HUF', NULL, NULL, NULL, '2024-02-03 10:00:00', NULL),
(40, 2, 10, 3, 32, '2024-02-15 11:00:00', '2024-02-15 11:45:00', 'completed', NULL, NULL, '8900.00', 'HUF', NULL, NULL, NULL, '2024-02-08 15:00:00', NULL),
(41, 2, 7, 3, 33, '2024-02-20 09:00:00', '2024-02-20 10:00:00', 'completed', NULL, NULL, '11900.00', 'HUF', NULL, NULL, NULL, '2024-02-13 09:00:00', NULL),
(42, 2, 12, 3, 34, '2024-02-24 15:00:00', '2024-02-24 16:30:00', 'completed', NULL, NULL, '24900.00', 'HUF', NULL, NULL, NULL, '2024-02-17 11:00:00', NULL),
(43, 2, 8, 3, 35, '2024-03-01 10:00:00', '2024-03-01 11:15:00', 'completed', NULL, NULL, '13900.00', 'HUF', NULL, NULL, NULL, '2024-02-23 14:00:00', NULL),
(44, 2, 7, 3, 36, '2024-03-06 14:00:00', '2024-03-06 15:00:00', 'completed', NULL, NULL, '11900.00', 'HUF', NULL, NULL, NULL, '2024-02-28 10:00:00', NULL),
(45, 2, 10, 3, 37, '2024-03-12 11:30:00', '2024-03-12 12:15:00', 'completed', NULL, NULL, '8900.00', 'HUF', NULL, NULL, NULL, '2024-03-05 16:00:00', NULL),
(46, 2, 7, 3, 27, '2024-03-18 09:00:00', '2024-03-18 10:00:00', 'completed', NULL, NULL, '11900.00', 'HUF', NULL, NULL, NULL, '2024-03-11 09:00:00', NULL),
(47, 2, 8, 3, 28, '2024-03-22 15:00:00', '2024-03-22 16:15:00', 'completed', NULL, NULL, '13900.00', 'HUF', NULL, NULL, NULL, '2024-03-15 14:00:00', NULL),
(48, 2, 7, 3, 29, '2024-04-02 10:00:00', '2024-04-02 11:00:00', 'completed', NULL, NULL, '11900.00', 'HUF', NULL, NULL, NULL, '2024-03-26 10:00:00', '2026-01-14 09:16:13'),
(49, 2, 10, 3, 30, '2024-04-08 14:00:00', '2024-04-08 14:45:00', 'no_show', NULL, NULL, '8900.00', 'HUF', NULL, NULL, NULL, '2024-04-01 15:00:00', '2026-01-14 09:16:13'),
(50, 2, 9, 4, 31, '2024-02-08 13:00:00', '2024-02-08 14:30:00', 'completed', NULL, NULL, '16900.00', 'HUF', NULL, NULL, NULL, '2024-02-01 11:00:00', NULL),
(51, 2, 7, 4, 32, '2024-02-14 15:00:00', '2024-02-14 16:00:00', 'completed', NULL, NULL, '11900.00', 'HUF', NULL, NULL, NULL, '2024-02-07 14:00:00', NULL),
(52, 2, 11, 4, 33, '2024-02-19 09:00:00', '2024-02-19 12:00:00', 'completed', 'VIP csomag', NULL, '35900.00', 'HUF', NULL, NULL, NULL, '2024-02-12 10:00:00', NULL),
(53, 2, 10, 4, 34, '2024-02-22 14:00:00', '2024-02-22 14:45:00', 'completed', NULL, NULL, '8900.00', 'HUF', NULL, NULL, NULL, '2024-02-15 15:00:00', NULL),
(54, 2, 7, 4, 35, '2024-02-28 16:00:00', '2024-02-28 17:00:00', 'completed', NULL, NULL, '11900.00', 'HUF', NULL, NULL, NULL, '2024-02-21 09:00:00', NULL),
(55, 2, 9, 4, 36, '2024-03-05 13:00:00', '2024-03-05 14:30:00', 'completed', NULL, NULL, '16900.00', 'HUF', NULL, NULL, NULL, '2024-02-27 11:00:00', NULL),
(56, 2, 7, 4, 37, '2024-03-11 15:00:00', '2024-03-11 16:00:00', 'completed', NULL, NULL, '11900.00', 'HUF', NULL, NULL, NULL, '2024-03-04 14:00:00', NULL),
(57, 2, 10, 4, 27, '2024-03-16 08:30:00', '2024-03-16 09:15:00', 'completed', NULL, NULL, '8900.00', 'HUF', NULL, NULL, NULL, '2024-03-09 10:00:00', NULL),
(58, 2, 11, 4, 28, '2024-03-20 10:00:00', '2024-03-20 13:00:00', 'completed', NULL, NULL, '35900.00', 'HUF', NULL, NULL, NULL, '2024-03-13 15:00:00', NULL),
(59, 2, 9, 4, 29, '2024-03-27 14:00:00', '2024-03-27 15:30:00', 'completed', NULL, NULL, '16900.00', 'HUF', NULL, NULL, NULL, '2024-03-20 09:00:00', NULL),
(60, 2, 7, 4, 30, '2024-04-04 16:00:00', '2024-04-04 17:00:00', 'completed', NULL, NULL, '11900.00', 'HUF', NULL, NULL, NULL, '2024-03-28 11:00:00', '2026-01-14 09:16:13'),
(61, 2, 10, 4, 31, '2024-04-10 13:00:00', '2024-04-10 13:45:00', 'no_show', NULL, NULL, '8900.00', 'HUF', NULL, NULL, NULL, '2024-04-03 14:00:00', '2026-01-14 09:16:13'),
(62, 3, 13, 5, 32, '2024-02-09 11:00:00', '2024-02-09 11:45:00', 'completed', NULL, NULL, '6900.00', 'HUF', NULL, NULL, NULL, '2024-02-02 10:00:00', NULL),
(63, 3, 15, 5, 33, '2024-02-16 14:00:00', '2024-02-16 15:30:00', 'completed', NULL, NULL, '12900.00', 'HUF', NULL, NULL, NULL, '2024-02-09 15:00:00', NULL),
(64, 3, 17, 5, 34, '2024-02-23 10:00:00', '2024-02-23 12:30:00', 'completed', NULL, NULL, '22900.00', 'HUF', NULL, NULL, NULL, '2024-02-16 11:00:00', NULL),
(65, 3, 13, 5, 35, '2024-03-02 15:00:00', '2024-03-02 15:45:00', 'completed', NULL, NULL, '6900.00', 'HUF', NULL, NULL, NULL, '2024-02-24 14:00:00', NULL),
(66, 3, 16, 5, 36, '2024-03-09 11:00:00', '2024-03-09 13:00:00', 'completed', NULL, NULL, '17900.00', 'HUF', NULL, NULL, NULL, '2024-03-02 10:00:00', NULL),
(67, 3, 13, 5, 37, '2024-03-16 14:00:00', '2024-03-16 14:45:00', 'completed', NULL, NULL, '6900.00', 'HUF', NULL, NULL, NULL, '2024-03-09 15:00:00', NULL),
(68, 3, 17, 5, 27, '2024-03-23 10:00:00', '2024-03-23 12:30:00', 'completed', NULL, NULL, '22900.00', 'HUF', NULL, NULL, NULL, '2024-03-16 11:00:00', NULL),
(69, 3, 13, 5, 28, '2024-04-06 11:00:00', '2024-04-06 11:45:00', 'completed', NULL, NULL, '6900.00', 'HUF', NULL, NULL, NULL, '2024-03-30 10:00:00', '2026-01-14 09:16:13'),
(70, 3, 15, 5, 29, '2024-04-13 14:00:00', '2024-04-13 15:30:00', 'no_show', NULL, NULL, '12900.00', 'HUF', NULL, NULL, NULL, '2024-04-06 15:00:00', '2026-01-14 09:16:13'),
(71, 3, 14, 6, 30, '2024-02-11 12:00:00', '2024-02-11 12:30:00', 'completed', NULL, NULL, '4500.00', 'HUF', NULL, NULL, NULL, '2024-02-04 10:00:00', NULL),
(72, 3, 15, 6, 31, '2024-02-18 16:00:00', '2024-02-18 17:30:00', 'completed', NULL, NULL, '12900.00', 'HUF', NULL, NULL, NULL, '2024-02-11 14:00:00', NULL),
(73, 3, 14, 6, 32, '2024-02-25 13:00:00', '2024-02-25 13:30:00', 'completed', NULL, NULL, '4500.00', 'HUF', NULL, NULL, NULL, '2024-02-18 11:00:00', NULL),
(74, 3, 17, 6, 33, '2024-03-03 15:00:00', '2024-03-03 17:30:00', 'completed', NULL, NULL, '22900.00', 'HUF', NULL, NULL, NULL, '2024-02-25 10:00:00', NULL),
(75, 3, 14, 6, 34, '2024-03-10 12:00:00', '2024-03-10 12:30:00', 'completed', NULL, NULL, '4500.00', 'HUF', NULL, NULL, NULL, '2024-03-03 15:00:00', NULL),
(76, 3, 16, 6, 35, '2024-03-17 16:00:00', '2024-03-17 18:00:00', 'completed', NULL, NULL, '17900.00', 'HUF', NULL, NULL, NULL, '2024-03-10 11:00:00', NULL),
(77, 3, 14, 6, 36, '2024-03-24 13:00:00', '2024-03-24 13:30:00', 'completed', NULL, NULL, '4500.00', 'HUF', NULL, NULL, NULL, '2024-03-17 14:00:00', NULL),
(78, 3, 15, 6, 37, '2024-04-07 15:00:00', '2024-04-07 16:30:00', 'completed', NULL, NULL, '12900.00', 'HUF', NULL, NULL, NULL, '2024-03-31 10:00:00', '2026-01-14 09:16:13'),
(79, 3, 14, 6, 27, '2024-04-14 12:00:00', '2024-04-14 12:30:00', 'no_show', NULL, NULL, '4500.00', 'HUF', NULL, NULL, NULL, '2024-04-07 15:00:00', '2026-01-14 09:16:13'),
(80, 4, 18, 7, 28, '2024-02-12 10:00:00', '2024-02-12 12:00:00', 'completed', NULL, NULL, '11900.00', 'HUF', NULL, NULL, NULL, '2024-02-05 14:00:00', NULL),
(81, 4, 20, 7, 29, '2024-02-19 14:00:00', '2024-02-19 15:30:00', 'completed', NULL, NULL, '8900.00', 'HUF', NULL, NULL, NULL, '2024-02-12 11:00:00', NULL),
(82, 4, 21, 7, 30, '2024-02-26 11:00:00', '2024-02-26 12:00:00', 'completed', NULL, NULL, '6900.00', 'HUF', NULL, NULL, NULL, '2024-02-19 15:00:00', NULL),
(83, 4, 19, 7, 31, '2024-03-04 09:00:00', '2024-03-04 11:30:00', 'completed', NULL, NULL, '14900.00', 'HUF', NULL, NULL, NULL, '2024-02-26 10:00:00', NULL),
(84, 4, 20, 7, 32, '2024-03-11 15:00:00', '2024-03-11 16:30:00', 'completed', NULL, NULL, '8900.00', 'HUF', NULL, NULL, NULL, '2024-03-04 14:00:00', NULL),
(85, 4, 18, 7, 33, '2024-03-18 10:00:00', '2024-03-18 12:00:00', 'completed', NULL, NULL, '11900.00', 'HUF', NULL, NULL, NULL, '2024-03-11 11:00:00', NULL),
(86, 4, 21, 7, 34, '2024-03-25 14:00:00', '2024-03-25 15:00:00', 'completed', NULL, NULL, '6900.00', 'HUF', NULL, NULL, NULL, '2024-03-18 15:00:00', NULL),
(87, 4, 20, 7, 35, '2024-04-08 11:00:00', '2024-04-08 12:30:00', 'completed', NULL, NULL, '8900.00', 'HUF', NULL, NULL, NULL, '2024-04-01 10:00:00', '2026-01-14 09:16:13'),
(88, 4, 18, 8, 36, '2024-02-15 11:00:00', '2024-02-15 13:00:00', 'completed', NULL, NULL, '11900.00', 'HUF', NULL, NULL, NULL, '2024-02-08 14:00:00', NULL),
(89, 4, 22, 8, 37, '2024-02-22 15:00:00', '2024-02-22 16:15:00', 'completed', NULL, NULL, '8900.00', 'HUF', NULL, NULL, NULL, '2024-02-15 11:00:00', NULL),
(90, 4, 21, 8, 27, '2024-02-29 13:00:00', '2024-02-29 14:00:00', 'completed', NULL, NULL, '6900.00', 'HUF', NULL, NULL, NULL, '2024-02-22 10:00:00', NULL),
(91, 4, 20, 8, 28, '2024-03-07 16:00:00', '2024-03-07 17:30:00', 'completed', NULL, NULL, '8900.00', 'HUF', NULL, NULL, NULL, '2024-02-29 15:00:00', NULL),
(92, 4, 18, 8, 29, '2024-03-14 11:00:00', '2024-03-14 13:00:00', 'completed', NULL, NULL, '11900.00', 'HUF', NULL, NULL, NULL, '2024-03-07 11:00:00', NULL),
(93, 4, 22, 8, 30, '2024-03-21 14:00:00', '2024-03-21 15:15:00', 'completed', NULL, NULL, '8900.00', 'HUF', NULL, NULL, NULL, '2024-03-14 14:00:00', NULL),
(94, 4, 21, 8, 31, '2024-04-11 15:00:00', '2024-04-11 16:00:00', 'no_show', NULL, NULL, '6900.00', 'HUF', NULL, NULL, NULL, '2024-04-04 10:00:00', '2026-01-14 09:16:13'),
(95, 5, 23, 9, 32, '2024-02-13 07:00:00', '2024-02-13 08:00:00', 'completed', NULL, NULL, '8900.00', 'HUF', NULL, NULL, NULL, '2024-02-06 10:00:00', NULL),
(96, 5, 26, 9, 33, '2024-02-20 08:00:00', '2024-02-20 09:00:00', 'completed', NULL, NULL, '3900.00', 'HUF', NULL, NULL, NULL, '2024-02-13 14:00:00', NULL),
(97, 5, 23, 9, 34, '2024-02-27 07:30:00', '2024-02-27 08:30:00', 'completed', NULL, NULL, '8900.00', 'HUF', NULL, NULL, NULL, '2024-02-20 11:00:00', NULL),
(98, 5, 27, 9, 35, '2024-03-05 09:00:00', '2024-03-05 09:45:00', 'completed', NULL, NULL, '3500.00', 'HUF', NULL, NULL, NULL, '2024-02-27 15:00:00', NULL),
(99, 5, 23, 9, 36, '2024-03-12 07:00:00', '2024-03-12 08:00:00', 'completed', NULL, NULL, '8900.00', 'HUF', NULL, NULL, NULL, '2024-03-05 10:00:00', NULL),
(100, 5, 26, 9, 37, '2024-03-19 08:30:00', '2024-03-19 09:30:00', 'completed', NULL, NULL, '3900.00', 'HUF', NULL, NULL, NULL, '2024-03-12 14:00:00', NULL),
(101, 5, 23, 9, 27, '2024-04-09 07:00:00', '2024-04-09 08:00:00', 'completed', NULL, NULL, '8900.00', 'HUF', NULL, NULL, NULL, '2024-04-02 10:00:00', '2026-01-14 09:16:13'),
(102, 5, 25, 10, 28, '2024-02-14 18:00:00', '2024-02-14 18:45:00', 'completed', NULL, NULL, '2900.00', 'HUF', NULL, NULL, NULL, '2024-02-07 11:00:00', NULL),
(103, 5, 23, 10, 29, '2024-02-21 19:00:00', '2024-02-21 20:00:00', 'completed', NULL, NULL, '8900.00', 'HUF', NULL, NULL, NULL, '2024-02-14 15:00:00', NULL),
(104, 5, 27, 10, 30, '2024-02-28 17:00:00', '2024-02-28 17:45:00', 'completed', NULL, NULL, '3500.00', 'HUF', NULL, NULL, NULL, '2024-02-21 10:00:00', NULL),
(105, 5, 25, 10, 31, '2024-03-06 18:30:00', '2024-03-06 19:15:00', 'completed', NULL, NULL, '2900.00', 'HUF', NULL, NULL, NULL, '2024-02-28 14:00:00', NULL),
(106, 5, 26, 10, 32, '2024-03-13 19:00:00', '2024-03-13 20:00:00', 'completed', NULL, NULL, '3900.00', 'HUF', NULL, NULL, NULL, '2024-03-06 11:00:00', NULL),
(107, 5, 23, 10, 33, '2024-03-20 17:00:00', '2024-03-20 18:00:00', 'completed', NULL, NULL, '8900.00', 'HUF', NULL, NULL, NULL, '2024-03-13 15:00:00', NULL),
(108, 5, 25, 10, 34, '2024-04-10 18:00:00', '2024-04-10 18:45:00', 'no_show', NULL, NULL, '2900.00', 'HUF', NULL, NULL, NULL, '2024-04-03 10:00:00', '2026-01-14 09:16:13'),
(109, 6, 28, 11, 35, '2024-02-28 11:00:00', '2024-02-28 12:15:00', 'completed', NULL, NULL, '3900.00', 'HUF', NULL, NULL, NULL, '2024-02-21 10:00:00', NULL),
(110, 6, 29, 11, 36, '2024-03-06 15:00:00', '2024-03-06 16:00:00', 'completed', NULL, NULL, '3900.00', 'HUF', NULL, NULL, NULL, '2024-02-28 14:00:00', NULL),
(111, 6, 30, 11, 37, '2024-03-13 12:00:00', '2024-03-13 13:30:00', 'completed', NULL, NULL, '4500.00', 'HUF', NULL, NULL, NULL, '2024-03-06 11:00:00', NULL),
(112, 6, 31, 11, 27, '2024-03-20 16:00:00', '2024-03-20 16:45:00', 'completed', NULL, NULL, '2900.00', 'HUF', NULL, NULL, NULL, '2024-03-13 15:00:00', NULL),
(113, 6, 32, 11, 28, '2024-03-27 14:00:00', '2024-03-27 15:00:00', 'completed', NULL, NULL, '3900.00', 'HUF', NULL, NULL, NULL, '2024-03-20 10:00:00', NULL),
(114, 6, 28, 11, 29, '2024-04-03 11:00:00', '2024-04-03 12:15:00', 'completed', NULL, NULL, '3900.00', 'HUF', NULL, NULL, NULL, '2024-03-27 14:00:00', NULL),
(115, 6, 29, 11, 30, '2024-04-10 15:00:00', '2024-04-10 16:00:00', 'completed', NULL, NULL, '3900.00', 'HUF', NULL, NULL, NULL, '2024-04-03 11:00:00', '2026-01-14 09:16:13'),
(116, 6, 30, 11, 31, '2024-04-17 12:00:00', '2024-04-17 13:30:00', 'no_show', NULL, NULL, '4500.00', 'HUF', NULL, NULL, NULL, '2024-04-10 10:00:00', '2026-01-14 09:16:13'),
(117, 7, 33, 12, 32, '2024-02-17 10:00:00', '2024-02-17 11:00:00', 'completed', NULL, NULL, '9900.00', 'HUF', NULL, NULL, NULL, '2024-02-10 14:00:00', NULL),
(118, 7, 35, 12, 33, '2024-02-24 14:00:00', '2024-02-24 15:00:00', 'completed', NULL, NULL, '11900.00', 'HUF', NULL, NULL, NULL, '2024-02-17 11:00:00', NULL),
(119, 7, 36, 12, 34, '2024-03-02 11:30:00', '2024-03-02 12:15:00', 'completed', NULL, NULL, '7900.00', 'HUF', NULL, NULL, NULL, '2024-02-24 15:00:00', NULL),
(120, 7, 34, 12, 35, '2024-03-09 15:00:00', '2024-03-09 16:30:00', 'completed', NULL, NULL, '13900.00', 'HUF', NULL, NULL, NULL, '2024-03-02 10:00:00', NULL),
(121, 7, 37, 12, 36, '2024-03-16 10:00:00', '2024-03-16 11:15:00', 'completed', NULL, NULL, '12900.00', 'HUF', NULL, NULL, NULL, '2024-03-09 14:00:00', NULL),
(122, 7, 33, 12, 37, '2024-03-23 14:00:00', '2024-03-23 15:00:00', 'completed', NULL, NULL, '9900.00', 'HUF', NULL, NULL, NULL, '2024-03-16 11:00:00', NULL),
(123, 7, 35, 12, 27, '2024-04-06 11:00:00', '2024-04-06 12:00:00', 'completed', NULL, NULL, '11900.00', 'HUF', NULL, NULL, NULL, '2024-03-30 10:00:00', '2026-01-14 09:16:13'),
(124, 7, 36, 12, 28, '2024-04-13 15:00:00', '2024-04-13 15:45:00', 'no_show', NULL, NULL, '7900.00', 'HUF', NULL, NULL, NULL, '2024-04-06 14:00:00', '2026-01-14 09:16:13'),
(125, 8, 38, 13, 29, '2024-02-13 11:00:00', '2024-02-13 11:30:00', 'completed', NULL, NULL, '4500.00', 'HUF', NULL, NULL, NULL, '2024-02-06 10:00:00', NULL),
(126, 8, 39, 13, 30, '2024-02-20 15:00:00', '2024-02-20 15:45:00', 'completed', NULL, NULL, '5900.00', 'HUF', NULL, NULL, NULL, '2024-02-13 14:00:00', NULL),
(127, 8, 41, 13, 31, '2024-02-27 12:00:00', '2024-02-27 12:30:00', 'completed', NULL, NULL, '3900.00', 'HUF', NULL, NULL, NULL, '2024-02-20 11:00:00', NULL),
(128, 8, 42, 13, 32, '2024-03-05 14:00:00', '2024-03-05 15:30:00', 'completed', 'VIP csomag', NULL, '12900.00', 'HUF', NULL, NULL, NULL, '2024-02-27 15:00:00', NULL),
(129, 8, 38, 13, 33, '2024-03-12 11:30:00', '2024-03-12 12:00:00', 'completed', NULL, NULL, '4500.00', 'HUF', NULL, NULL, NULL, '2024-03-05 10:00:00', NULL),
(130, 8, 40, 13, 34, '2024-03-19 16:00:00', '2024-03-19 16:30:00', 'completed', NULL, NULL, '4900.00', 'HUF', NULL, NULL, NULL, '2024-03-12 14:00:00', NULL),
(131, 8, 39, 13, 35, '2024-03-26 13:00:00', '2024-03-26 13:45:00', 'completed', NULL, NULL, '5900.00', 'HUF', NULL, NULL, NULL, '2024-03-19 11:00:00', NULL),
(132, 8, 41, 13, 36, '2024-04-09 12:00:00', '2024-04-09 12:30:00', 'completed', NULL, NULL, '3900.00', 'HUF', NULL, NULL, NULL, '2024-04-02 10:00:00', '2026-01-14 09:16:13'),
(133, 8, 38, 13, 37, '2024-04-16 11:00:00', '2024-04-16 11:30:00', 'no_show', NULL, NULL, '4500.00', 'HUF', NULL, NULL, NULL, '2024-04-09 15:00:00', '2026-01-14 09:16:13'),
(134, 9, 43, 14, 27, '2024-02-18 11:00:00', '2024-02-18 12:00:00', 'completed', NULL, NULL, '9900.00', 'HUF', NULL, NULL, NULL, '2024-02-11 10:00:00', NULL),
(135, 9, 44, 14, 28, '2024-02-25 14:00:00', '2024-02-25 15:15:00', 'completed', NULL, NULL, '11900.00', 'HUF', NULL, NULL, NULL, '2024-02-18 14:00:00', NULL),
(136, 9, 45, 14, 29, '2024-03-03 10:30:00', '2024-03-03 11:15:00', 'completed', NULL, NULL, '6900.00', 'HUF', NULL, NULL, NULL, '2024-02-25 11:00:00', NULL),
(137, 9, 46, 14, 30, '2024-03-10 15:00:00', '2024-03-10 16:00:00', 'completed', NULL, NULL, '10900.00', 'HUF', NULL, NULL, NULL, '2024-03-03 15:00:00', NULL),
(138, 9, 47, 14, 31, '2024-03-17 11:00:00', '2024-03-17 11:45:00', 'completed', NULL, NULL, '5900.00', 'HUF', NULL, NULL, NULL, '2024-03-10 10:00:00', NULL),
(139, 9, 43, 14, 32, '2024-03-24 14:00:00', '2024-03-24 15:00:00', 'completed', NULL, NULL, '9900.00', 'HUF', NULL, NULL, NULL, '2024-03-17 14:00:00', NULL),
(140, 9, 44, 14, 33, '2024-04-07 11:00:00', '2024-04-07 12:15:00', 'completed', NULL, NULL, '11900.00', 'HUF', NULL, NULL, NULL, '2024-03-31 10:00:00', '2026-01-14 09:16:13'),
(141, 9, 45, 14, 34, '2024-04-14 10:30:00', '2024-04-14 11:15:00', 'no_show', NULL, NULL, '6900.00', 'HUF', NULL, NULL, NULL, '2024-04-07 15:00:00', '2026-01-14 09:16:13'),
(142, 10, 48, 15, 35, '2024-02-21 12:00:00', '2024-02-21 13:30:00', 'completed', NULL, NULL, '15900.00', 'HUF', NULL, NULL, NULL, '2024-02-14 10:00:00', NULL),
(143, 10, 49, 15, 36, '2024-02-28 15:00:00', '2024-02-28 16:00:00', 'completed', NULL, NULL, '13900.00', 'HUF', NULL, NULL, NULL, '2024-02-21 14:00:00', NULL),
(144, 10, 50, 15, 37, '2024-03-06 13:00:00', '2024-03-06 14:00:00', 'completed', NULL, NULL, '4900.00', 'HUF', NULL, NULL, NULL, '2024-02-28 11:00:00', NULL),
(145, 10, 51, 15, 27, '2024-03-13 11:00:00', '2024-03-13 13:00:00', 'completed', 'Zen spa rituálé', NULL, '29900.00', 'HUF', NULL, NULL, NULL, '2024-03-06 15:00:00', NULL),
(146, 10, 52, 15, 28, '2024-03-20 14:00:00', '2024-03-20 14:45:00', 'completed', NULL, NULL, '5900.00', 'HUF', NULL, NULL, NULL, '2024-03-13 10:00:00', NULL),
(147, 10, 54, 15, 29, '2024-03-27 12:00:00', '2024-03-27 15:00:00', 'completed', 'Teljes Zen csomag', NULL, '42900.00', 'HUF', NULL, NULL, NULL, '2024-03-20 14:00:00', NULL),
(148, 10, 48, 15, 30, '2024-04-10 13:00:00', '2024-04-10 14:30:00', 'completed', NULL, NULL, '15900.00', 'HUF', NULL, NULL, NULL, '2024-04-03 10:00:00', '2026-01-14 09:16:13'),
(149, 10, 49, 15, 31, '2024-04-17 15:00:00', '2024-04-17 16:00:00', 'no_show', NULL, NULL, '13900.00', 'HUF', NULL, NULL, NULL, '2024-04-10 14:00:00', '2026-01-14 09:16:13'),
(153, 2, 7, 4, 41, '2026-01-23 12:00:00', '2026-01-23 13:00:00', 'pending', '', NULL, '11900.00', 'HUF', NULL, NULL, NULL, '2026-01-17 18:56:15', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `performed_by_user_id` int(11) NOT NULL,
  `performed_by_role` varchar(50) COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `affected_user_id` int(11) DEFAULT NULL,
  `company_id` int(11) DEFAULT NULL,
  `email` varchar(200) COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `entity_type` varchar(50) COLLATE utf8mb4_hungarian_ci DEFAULT NULL COMMENT 'appointment, user, company, service, etc.',
  `action` varchar(100) COLLATE utf8mb4_hungarian_ci NOT NULL COMMENT 'create, update, delete, login, etc.',
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `performed_by_user_id`, `performed_by_role`, `affected_user_id`, `company_id`, `email`, `entity_type`, `action`, `old_values`, `new_values`, `created_at`, `user_id`) VALUES
(1, 41, 'client', 41, NULL, 'admin@admin.hu', 'user', 'register', NULL, '{\"role\": \"client\", \"email\": \"admin@admin.hu\", \"user_id\": 41, \"last_name\": \"Admin\", \"first_name\": \"Admin\"}', '2026-01-17 17:19:35', 0),
(2, 41, 'client', NULL, NULL, 'admin@admin.hu', 'user', 'register', NULL, '{\"role\": \"client\", \"email\": \"admin@admin.hu\", \"user_id\": 41, \"last_name\": \"Admin\", \"first_name\": \"Admin\"}', '2026-01-17 17:19:35', 0),
(3, 41, NULL, NULL, NULL, 'admin@admin.hu', 'user', 'email_verified', NULL, NULL, '2026-01-17 17:36:57', 0),
(4, 41, 'client', NULL, NULL, 'admin@admin.hu', 'user', 'login', NULL, NULL, '2026-01-17 17:37:52', 0),
(5, 41, 'client', NULL, NULL, 'admin@admin.hu', 'user', 'login', NULL, NULL, '2026-01-17 17:56:11', 0),
(6, 41, 'client', NULL, NULL, 'admin@admin.hu', 'user', 'login', NULL, NULL, '2026-01-17 18:09:44', 0),
(7, 41, 'client', NULL, NULL, 'admin@admin.hu', 'user', 'login', NULL, NULL, '2026-01-17 18:46:36', 0),
(8, 24, NULL, NULL, NULL, 'vasvariben@gmail.com', 'user', 'login', NULL, NULL, '2026-01-18 20:46:23', 0),
(9, 41, 'client', NULL, NULL, 'admin@admin.hu', 'user', 'login', NULL, NULL, '2026-01-18 20:47:27', 0),
(10, 41, NULL, NULL, NULL, 'admin@admin.hu', 'user', 'login', NULL, NULL, '2026-01-18 20:49:01', 0);

-- --------------------------------------------------------

--
-- Table structure for table `business_categories`
--

CREATE TABLE `business_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_hungarian_ci NOT NULL,
  `description` text COLLATE utf8mb4_hungarian_ci,
  `icon` varchar(50) COLLATE utf8mb4_hungarian_ci DEFAULT NULL COMMENT 'Icon class vagy emoji',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `business_categories`
--

INSERT INTO `business_categories` (`id`, `name`, `description`, `icon`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Szépségszalon', 'Kozmetikai és szépségápolási szolgáltatások', '💅', 1, '2024-01-01 09:00:00', NULL),
(2, 'Wellness és Spa', 'Wellness, spa és masszázs szolgáltatások', '💆', 1, '2024-01-01 09:00:00', NULL),
(3, 'Fodrászat', 'Fodrász és hajápolási szolgáltatások', '💇', 1, '2024-01-01 09:00:00', NULL),
(4, 'Körömstúdió', 'Műköröm és manikűr szolgáltatások', '💅', 1, '2024-01-01 09:00:00', NULL),
(5, 'Fitness', 'Fitness, jóga és edzőterem szolgáltatások', '💪', 1, '2024-01-01 09:00:00', NULL),
(6, 'Egészségügy', 'Orvosi rendelő, gyógytorna és egészségügyi szolgáltatások', '🏥', 1, '2024-01-01 09:00:00', NULL),
(7, 'Fogorvos', 'Fogászati szolgáltatások', '🦷', 1, '2024-01-01 09:00:00', NULL),
(8, 'Állatorvos', 'Állatorvosi rendelő és szolgáltatások', '🐕', 1, '2024-01-01 09:00:00', NULL),
(9, 'Autószerviz', 'Autószerelés és karbantartás', '🚗', 1, '2024-01-01 09:00:00', NULL),
(10, 'Oktatás', 'Magánoktatás, tanfolyamok', '📚', 1, '2024-01-01 09:00:00', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `companies`
--

CREATE TABLE `companies` (
  `id` int(11) NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_hungarian_ci NOT NULL,
  `description` text COLLATE utf8mb4_hungarian_ci,
  `address` text COLLATE utf8mb4_hungarian_ci,
  `city` varchar(100) COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `postal_code` varchar(20) COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_hungarian_ci DEFAULT 'Hungary',
  `phone` varchar(30) COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `website` varchar(255) COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `business_category_id` int(11) DEFAULT NULL,
  `owner_id` int(11) NOT NULL,
  `booking_advance_days` int(11) DEFAULT '30' COMMENT 'How many days in advance bookings can be made',
  `cancellation_hours` int(11) DEFAULT '24' COMMENT 'How many hours before appointment can be canceled',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `allow_same_day_booking` tinyint(1) DEFAULT '1' COMMENT 'Can clients book appointments on the same day? TRUE = yes, FALSE = only next day onwards',
  `minimum_booking_hours_ahead` int(11) DEFAULT '2' COMMENT 'If same-day booking allowed, minimum hours in advance (e.g. 2 hours). Only used if allow_same_day_booking = TRUE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `companies`
--

INSERT INTO `companies` (`id`, `name`, `description`, `address`, `city`, `postal_code`, `country`, `phone`, `email`, `website`, `business_category_id`, `owner_id`, `booking_advance_days`, `cancellation_hours`, `created_at`, `updated_at`, `deleted_at`, `is_deleted`, `is_active`, `allow_same_day_booking`, `minimum_booking_hours_ahead`) VALUES
(1, 'Bella Beauty Szalon', 'Modern szépségszalon a belvárosban, teljes körű kozmetikai szolgáltatásokkal', 'Váci utca 15.', 'Budapest', '1052', 'Hungary', '+36301111001', 'info@bellasalon.hu', 'www.bellasalon.hu', 1, 2, 30, 24, '2024-02-01 09:30:00', NULL, NULL, 0, 1, 1, 2),
(2, 'Harmónia Wellness Centrum', 'Wellness központ masszázzsal és spa kezelésekkel', 'Thermal utca 8.', 'Budapest', '1039', 'Hungary', '+36301111002', 'info@harmoniawellness.hu', 'www.harmoniawellness.hu', 2, 3, 30, 24, '2024-02-05 10:30:00', NULL, NULL, 0, 1, 1, 2),
(3, 'StyleCut Hair Studio', 'Trendi frizurák és hajkezelések minden korosztálynak', 'Rákóczi út 56.', 'Budapest', '1074', 'Hungary', '+36301111003', 'idopont@stylecut.hu', 'www.stylecut.hu', 3, 4, 21, 24, '2024-02-10 11:30:00', NULL, NULL, 0, 1, 1, 2),
(4, 'Perfect Nails Studio', 'Professzionális körömépítés és díszítés', 'Ferenciek tere 3.', 'Budapest', '1053', 'Hungary', '+36301111004', 'booking@perfectnails.hu', 'www.perfectnails.hu', 4, 5, 21, 12, '2024-02-15 12:30:00', NULL, NULL, 0, 1, 1, 2),
(5, 'FitZone Edzőterem', 'Modern edzőterem személyi edzőkkel és csoportos órákkal', 'Október 6. utca 22.', 'Budapest', '1051', 'Hungary', '+36301111005', 'info@fitzone.hu', 'www.fitzone.hu', 5, 6, 7, 6, '2024-02-20 13:30:00', NULL, NULL, 0, 1, 1, 2),
(6, 'Yoga & Balance Stúdió', 'Jóga és meditációs stúdió minden szintű gyakorlóknak', 'Bem rakpart 15.', 'Budapest', '1011', 'Hungary', '+36301111006', 'hello@yogabalance.hu', 'www.yogabalance.hu', 5, 7, 14, 12, '2024-02-25 14:30:00', NULL, NULL, 0, 1, 1, 2),
(7, 'Relaxa Masszázsszalon', 'Professzionális masszázs szolgáltatások nyugodt környezetben', 'Kossuth utca 12.', 'Debrecen', '4024', 'Hungary', '+36301111007', 'info@relaxa.hu', 'www.relaxa.hu', 2, 8, 14, 12, '2024-03-01 15:30:00', NULL, NULL, 0, 1, 1, 2),
(8, 'BarberShop Budapest', 'Férfi fodrászat és borbély szolgáltatások', 'Wesselényi utca 18.', 'Budapest', '1077', 'Hungary', '+36301111008', 'booking@barbershop.hu', 'www.barbershop-bp.hu', 3, 9, 14, 12, '2024-03-05 16:30:00', NULL, NULL, 0, 1, 1, 2),
(9, 'Naturál Szépségstúdió', 'Természetes alapanyagokkal dolgozó családias szalon', 'Fő utca 23.', 'Győr', '9021', 'Hungary', '+36301111009', 'hello@naturalszepseg.hu', 'www.naturalszepseg.hu', 1, 10, 21, 24, '2024-03-10 17:30:00', NULL, NULL, 0, 1, 1, 2),
(10, 'ZenSpa Központ', 'Ázsiai ihletésű spa és wellness központ', 'Dózsa György út 34.', 'Szeged', '6720', 'Hungary', '+36301111010', 'reception@zenspa.hu', 'www.zenspa.hu', 2, 11, 60, 48, '2024-03-15 18:30:00', NULL, NULL, 0, 1, 1, 2);

-- --------------------------------------------------------

--
-- Table structure for table `favorites`
--

CREATE TABLE `favorites` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL COMMENT 'A felhasználó aki kedvencnek jelölte',
  `company_id` int(11) NOT NULL COMMENT 'A kedvencnek jelölt cég',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Mikor lett kedvenc',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT 'Mikor lett törölve',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Soft delete flag'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `favorites`
--

INSERT INTO `favorites` (`id`, `user_id`, `company_id`, `created_at`, `deleted_at`, `is_deleted`) VALUES
(1, 27, 1, '2024-02-06 14:00:00', NULL, 0),
(2, 27, 2, '2024-02-07 15:00:00', NULL, 0),
(3, 27, 7, '2024-03-23 14:30:00', NULL, 0),
(4, 27, 10, '2024-03-14 14:00:00', NULL, 0),
(5, 28, 1, '2024-02-07 10:00:00', NULL, 0),
(6, 28, 3, '2024-03-02 15:00:00', NULL, 0),
(7, 28, 6, '2024-03-28 16:00:00', NULL, 0),
(8, 28, 10, '2024-03-21 15:00:00', NULL, 0),
(9, 29, 1, '2024-02-09 15:00:00', NULL, 0),
(10, 29, 4, '2024-02-27 14:00:00', NULL, 0),
(11, 29, 8, '2024-02-14 13:00:00', NULL, 0),
(12, 30, 1, '2024-02-13 11:00:00', NULL, 0),
(13, 30, 2, '2024-02-07 15:00:00', NULL, 0),
(14, 30, 4, '2024-02-27 14:00:00', NULL, 0),
(15, 30, 9, '2024-03-11 17:00:00', NULL, 0),
(16, 31, 1, '2024-02-15 09:00:00', NULL, 0),
(17, 31, 2, '2024-02-11 10:00:00', NULL, 0),
(18, 31, 3, '2024-02-18 17:00:00', NULL, 0),
(19, 32, 1, '2024-02-19 10:30:00', NULL, 0),
(20, 32, 3, '2024-02-10 14:00:00', NULL, 0),
(21, 32, 5, '2024-02-14 10:00:00', NULL, 0),
(22, 32, 7, '2024-02-18 12:00:00', NULL, 0),
(23, 33, 1, '2024-02-21 13:30:00', NULL, 0),
(24, 33, 2, '2024-02-21 11:00:00', NULL, 0),
(25, 33, 5, '2024-02-21 11:00:00', NULL, 0),
(26, 33, 8, '2024-03-13 12:00:00', NULL, 0),
(27, 34, 1, '2024-03-04 11:00:00', NULL, 0),
(28, 34, 3, '2024-02-24 15:00:00', NULL, 0),
(29, 34, 7, '2024-03-03 13:00:00', NULL, 0),
(30, 35, 1, '2024-03-07 14:30:00', NULL, 0),
(31, 35, 3, '2024-03-03 17:00:00', NULL, 0),
(32, 35, 6, '2024-03-01 14:00:00', NULL, 0),
(33, 35, 10, '2024-02-22 14:00:00', NULL, 0),
(34, 36, 2, '2024-03-05 13:30:00', NULL, 0),
(35, 36, 4, '2024-02-15 14:00:00', NULL, 0),
(36, 36, 6, '2024-03-07 17:00:00', NULL, 0),
(37, 37, 1, '2024-03-21 15:30:00', NULL, 0),
(38, 37, 2, '2024-03-11 15:30:00', NULL, 0),
(39, 37, 6, '2024-03-14 15:00:00', NULL, 0),
(40, 37, 9, '2024-02-19 13:00:00', NULL, 0),
(41, 38, 5, '2024-03-10 09:00:00', NULL, 0),
(42, 38, 8, '2024-03-15 13:00:00', NULL, 0),
(43, 39, 3, '2024-03-12 10:00:00', NULL, 0),
(44, 39, 9, '2024-03-18 14:00:00', NULL, 0),
(45, 40, 4, '2024-03-20 11:00:00', NULL, 0),
(46, 40, 7, '2024-03-25 12:00:00', NULL, 0),
(47, 40, 10, '2024-03-28 13:00:00', NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `images`
--

CREATE TABLE `images` (
  `id` int(11) NOT NULL,
  `company_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `url` text COLLATE utf8mb4_hungarian_ci,
  `is_main` tinyint(4) NOT NULL DEFAULT '0',
  `uploaded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `images`
--

INSERT INTO `images` (`id`, `company_id`, `user_id`, `url`, `is_main`, `uploaded_at`, `deleted_at`, `is_deleted`) VALUES
(1, 1, 2, 'https://storage.bookr.hu/companies/bella-beauty/main-facade.jpg', 1, '2024-02-01 08:30:00', NULL, 0),
(2, 1, 2, 'https://storage.bookr.hu/companies/bella-beauty/interior-1.jpg', 0, '2024-02-01 08:35:00', NULL, 0),
(3, 1, 2, 'https://storage.bookr.hu/companies/bella-beauty/treatment-room.jpg', 0, '2024-02-01 08:40:00', NULL, 0),
(4, 2, 3, 'https://storage.bookr.hu/companies/harmonia-wellness/main-entrance.jpg', 1, '2024-02-05 09:30:00', NULL, 0),
(5, 2, 3, 'https://storage.bookr.hu/companies/harmonia-wellness/spa-pool.jpg', 0, '2024-02-05 09:35:00', NULL, 0),
(6, 2, 3, 'https://storage.bookr.hu/companies/harmonia-wellness/massage-room.jpg', 0, '2024-02-05 09:40:00', NULL, 0),
(7, 3, 4, 'https://storage.bookr.hu/companies/stylecut/main-salon.jpg', 1, '2024-02-10 10:30:00', NULL, 0),
(8, 3, 4, 'https://storage.bookr.hu/companies/stylecut/washing-area.jpg', 0, '2024-02-10 10:35:00', NULL, 0),
(9, 4, 5, 'https://storage.bookr.hu/companies/perfect-nails/main-studio.jpg', 1, '2024-02-15 11:30:00', NULL, 0),
(10, 4, 5, 'https://storage.bookr.hu/companies/perfect-nails/work-station.jpg', 0, '2024-02-15 11:35:00', NULL, 0),
(11, 4, 5, 'https://storage.bookr.hu/companies/perfect-nails/waiting-area.jpg', 0, '2024-02-15 11:40:00', NULL, 0),
(12, 5, 6, 'https://storage.bookr.hu/companies/fitzone/main-gym.jpg', 1, '2024-02-20 12:30:00', NULL, 0),
(13, 5, 6, 'https://storage.bookr.hu/companies/fitzone/cardio-area.jpg', 0, '2024-02-20 12:35:00', NULL, 0),
(14, 5, 6, 'https://storage.bookr.hu/companies/fitzone/weights-area.jpg', 0, '2024-02-20 12:40:00', NULL, 0),
(15, 6, 7, 'https://storage.bookr.hu/companies/yoga-balance/main-studio.jpg', 1, '2024-02-25 13:30:00', NULL, 0),
(16, 6, 7, 'https://storage.bookr.hu/companies/yoga-balance/meditation-room.jpg', 0, '2024-02-25 13:35:00', NULL, 0),
(17, 7, 8, 'https://storage.bookr.hu/companies/relaxa/main-reception.jpg', 1, '2024-03-01 14:30:00', NULL, 0),
(18, 7, 8, 'https://storage.bookr.hu/companies/relaxa/massage-room-1.jpg', 0, '2024-03-01 14:35:00', NULL, 0),
(19, 7, 8, 'https://storage.bookr.hu/companies/relaxa/relax-area.jpg', 0, '2024-03-01 14:40:00', NULL, 0),
(20, 8, 9, 'https://storage.bookr.hu/companies/barbershop/main-shop.jpg', 1, '2024-03-05 15:30:00', NULL, 0),
(21, 8, 9, 'https://storage.bookr.hu/companies/barbershop/barber-chair.jpg', 0, '2024-03-05 15:35:00', NULL, 0),
(22, 9, 10, 'https://storage.bookr.hu/companies/natural/main-studio.jpg', 1, '2024-03-10 16:30:00', NULL, 0),
(23, 9, 10, 'https://storage.bookr.hu/companies/natural/treatment-area.jpg', 0, '2024-03-10 16:35:00', NULL, 0),
(24, 9, 10, 'https://storage.bookr.hu/companies/natural/products.jpg', 0, '2024-03-10 16:40:00', NULL, 0),
(25, 10, 11, 'https://storage.bookr.hu/companies/zenspa/main-lobby.jpg', 1, '2024-03-15 17:30:00', NULL, 0),
(26, 10, 11, 'https://storage.bookr.hu/companies/zenspa/spa-pool.jpg', 0, '2024-03-15 17:35:00', NULL, 0),
(27, 10, 11, 'https://storage.bookr.hu/companies/zenspa/zen-garden.jpg', 0, '2024-03-15 17:40:00', NULL, 0),
(28, 1, 2, 'https://storage.bookr.hu/services/basic-facial/result.jpg', 1, '2024-02-01 11:05:00', NULL, 0),
(29, 1, 2, 'https://storage.bookr.hu/services/premium-facial/luxury.jpg', 1, '2024-02-01 11:10:00', NULL, 0),
(30, 1, 2, 'https://storage.bookr.hu/services/hyaluronic-treatment/before-after.jpg', 1, '2024-02-01 11:15:00', NULL, 0),
(31, 1, 2, 'https://storage.bookr.hu/services/manicure/nails-1.jpg', 1, '2024-02-01 11:20:00', NULL, 0),
(32, 1, 2, 'https://storage.bookr.hu/services/gel-polish/gel-nails.jpg', 1, '2024-02-01 11:25:00', NULL, 0),
(33, 2, 3, 'https://storage.bookr.hu/services/swedish-massage/massage-room.jpg', 1, '2024-02-05 12:05:00', NULL, 0),
(34, 2, 3, 'https://storage.bookr.hu/services/aromatherapy/essential-oils.jpg', 1, '2024-02-05 12:10:00', NULL, 0),
(35, 2, 3, 'https://storage.bookr.hu/services/hot-stone/stones.jpg', 1, '2024-02-05 12:15:00', NULL, 0),
(36, 2, 3, 'https://storage.bookr.hu/services/spa-package/full-spa.jpg', 1, '2024-02-05 12:20:00', NULL, 0),
(37, 3, 4, 'https://storage.bookr.hu/services/womens-haircut/style-1.jpg', 1, '2024-02-10 13:05:00', NULL, 0),
(38, 3, 4, 'https://storage.bookr.hu/services/mens-haircut/modern-cut.jpg', 1, '2024-02-10 13:10:00', NULL, 0),
(39, 3, 4, 'https://storage.bookr.hu/services/hair-coloring-short/color-result.jpg', 1, '2024-02-10 13:15:00', NULL, 0),
(40, 3, 4, 'https://storage.bookr.hu/services/highlights/balayage.jpg', 1, '2024-02-10 13:20:00', NULL, 0),
(41, 4, 5, 'https://storage.bookr.hu/services/gel-nails/gel-extensions.jpg', 1, '2024-02-15 14:05:00', NULL, 0),
(42, 4, 5, 'https://storage.bookr.hu/services/porcelain-nails/porcelain-set.jpg', 1, '2024-02-15 14:10:00', NULL, 0),
(43, 4, 5, 'https://storage.bookr.hu/services/nail-art/creative-design.jpg', 1, '2024-02-15 14:15:00', NULL, 0),
(44, 5, 6, 'https://storage.bookr.hu/services/personal-training/pt-session.jpg', 1, '2024-02-20 15:05:00', NULL, 0),
(45, 5, 6, 'https://storage.bookr.hu/services/spinning/spin-class.jpg', 1, '2024-02-20 15:10:00', NULL, 0),
(46, 5, 6, 'https://storage.bookr.hu/services/crossfit/wod.jpg', 1, '2024-02-20 15:15:00', NULL, 0),
(47, 6, 7, 'https://storage.bookr.hu/services/hatha-yoga/class.jpg', 1, '2024-02-25 16:05:00', NULL, 0),
(48, 6, 7, 'https://storage.bookr.hu/services/vinyasa-yoga/flow.jpg', 1, '2024-02-25 16:10:00', NULL, 0),
(49, 6, 7, 'https://storage.bookr.hu/services/meditation/meditate.jpg', 1, '2024-02-25 16:15:00', NULL, 0),
(50, 1, 12, 'https://storage.bookr.hu/staff/eszter-kozmetikus/profile.jpg', 1, '2024-02-01 12:05:00', NULL, 0),
(51, 1, 13, 'https://storage.bookr.hu/staff/kati-koromspecialista/profile.jpg', 1, '2024-02-01 12:10:00', NULL, 0),
(52, 2, 14, 'https://storage.bookr.hu/staff/marta-masszor/profile.jpg', 1, '2024-02-05 13:05:00', NULL, 0),
(53, 2, 15, 'https://storage.bookr.hu/staff/julia-spa-specialist/profile.jpg', 1, '2024-02-05 13:10:00', NULL, 0),
(54, 3, 16, 'https://storage.bookr.hu/staff/anna-fodrasz/profile.jpg', 1, '2024-02-10 14:05:00', NULL, 0),
(55, 3, 17, 'https://storage.bookr.hu/staff/peter-szinezo/profile.jpg', 1, '2024-02-10 14:10:00', NULL, 0),
(56, 4, 18, 'https://storage.bookr.hu/staff/zsuzsanna-mukorom/profile.jpg', 1, '2024-02-15 15:05:00', NULL, 0),
(57, 4, 19, 'https://storage.bookr.hu/staff/viktoria-nail-artist/profile.jpg', 1, '2024-02-15 15:10:00', NULL, 0),
(58, 5, 20, 'https://storage.bookr.hu/staff/gabor-personal-trainer/profile.jpg', 1, '2024-02-20 16:05:00', NULL, 0),
(59, 5, 21, 'https://storage.bookr.hu/staff/laura-fitness-instructor/profile.jpg', 1, '2024-02-20 16:10:00', NULL, 0),
(60, 6, 22, 'https://storage.bookr.hu/staff/emese-yoga-oktato/profile.jpg', 1, '2024-02-25 17:05:00', NULL, 0),
(61, 7, 23, 'https://storage.bookr.hu/staff/istvan-masszor/profile.jpg', 1, '2024-03-01 18:05:00', NULL, 0),
(62, 8, 24, 'https://storage.bookr.hu/staff/daniel-barber/profile.jpg', 1, '2024-03-05 19:05:00', NULL, 0),
(63, 9, 25, 'https://storage.bookr.hu/staff/reka-bio-kozmetikus/profile.jpg', 1, '2024-03-10 20:05:00', NULL, 0),
(64, 10, 26, 'https://storage.bookr.hu/staff/tamas-thai-specialist/profile.jpg', 1, '2024-03-15 21:05:00', NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `notification_settings`
--

CREATE TABLE `notification_settings` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `appointment_confirmation` tinyint(1) DEFAULT '1',
  `appointment_reminder` tinyint(1) DEFAULT '1',
  `appointment_cancellation` tinyint(1) DEFAULT '1',
  `marketing_emails` tinyint(1) DEFAULT '0',
  `updated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `notification_settings`
--

INSERT INTO `notification_settings` (`id`, `user_id`, `appointment_confirmation`, `appointment_reminder`, `appointment_cancellation`, `marketing_emails`, `updated_at`, `created_at`) VALUES
(1, 1, 1, 1, 1, 0, NULL, '2024-01-15 09:00:00'),
(2, 2, 1, 1, 1, 1, NULL, '2024-01-20 10:00:00'),
(3, 3, 1, 1, 1, 1, NULL, '2024-01-20 10:00:00'),
(4, 4, 1, 1, 1, 0, NULL, '2024-01-20 10:00:00'),
(5, 5, 1, 1, 1, 1, NULL, '2024-01-20 10:00:00'),
(6, 6, 1, 1, 1, 0, NULL, '2024-01-20 10:00:00'),
(7, 7, 1, 1, 1, 1, NULL, '2024-01-20 10:00:00'),
(8, 8, 1, 1, 1, 0, NULL, '2024-01-20 10:00:00'),
(9, 9, 1, 1, 1, 1, NULL, '2024-01-20 10:00:00'),
(10, 10, 1, 1, 1, 0, NULL, '2024-01-20 10:00:00'),
(11, 11, 1, 1, 1, 1, NULL, '2024-01-20 10:00:00'),
(12, 12, 1, 1, 1, 0, NULL, '2024-02-01 13:00:00'),
(13, 13, 1, 1, 1, 0, NULL, '2024-02-01 13:00:00'),
(14, 14, 1, 1, 1, 0, NULL, '2024-02-05 14:00:00'),
(15, 15, 1, 1, 1, 0, NULL, '2024-02-05 14:00:00'),
(16, 16, 1, 1, 1, 0, NULL, '2024-02-10 15:00:00'),
(17, 17, 1, 1, 1, 0, NULL, '2024-02-10 15:00:00'),
(18, 18, 1, 1, 1, 0, NULL, '2024-02-15 16:00:00'),
(19, 19, 1, 1, 1, 0, NULL, '2024-02-15 16:00:00'),
(20, 20, 1, 1, 1, 0, NULL, '2024-02-20 17:00:00'),
(21, 21, 1, 1, 1, 0, NULL, '2024-02-20 17:00:00'),
(22, 22, 1, 1, 1, 0, NULL, '2024-02-25 18:00:00'),
(23, 23, 1, 1, 1, 0, NULL, '2024-03-01 19:00:00'),
(24, 24, 1, 1, 1, 0, NULL, '2024-03-05 20:00:00'),
(25, 25, 1, 1, 1, 0, NULL, '2024-03-10 21:00:00'),
(26, 26, 1, 1, 1, 0, NULL, '2024-03-15 22:00:00'),
(27, 27, 1, 1, 1, 1, NULL, '2024-01-25 09:00:00'),
(28, 28, 1, 1, 1, 0, NULL, '2024-01-25 09:00:00'),
(29, 29, 1, 0, 1, 0, NULL, '2024-01-25 09:00:00'),
(30, 30, 1, 1, 1, 1, NULL, '2024-01-25 09:00:00'),
(31, 31, 1, 1, 1, 0, NULL, '2024-01-25 09:00:00'),
(32, 32, 1, 1, 1, 1, NULL, '2024-01-25 09:00:00'),
(33, 33, 1, 1, 1, 1, NULL, '2024-01-25 09:00:00'),
(34, 34, 0, 0, 1, 0, NULL, '2024-01-25 09:00:00'),
(35, 35, 1, 1, 1, 1, NULL, '2024-01-25 09:00:00'),
(36, 36, 1, 1, 1, 0, NULL, '2024-01-25 09:00:00'),
(37, 37, 1, 0, 1, 0, NULL, '2024-01-25 09:00:00'),
(38, 38, 1, 1, 1, 1, NULL, '2024-01-25 09:00:00'),
(39, 39, 1, 1, 1, 0, NULL, '2024-01-25 09:00:00'),
(40, 40, 1, 1, 1, 0, NULL, '2024-01-25 09:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `opening_hours`
--

CREATE TABLE `opening_hours` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `day_of_week` enum('monday','tuesday','wednesday','thursday','friday','saturday','sunday') COLLATE utf8mb4_hungarian_ci NOT NULL,
  `open_time` time DEFAULT NULL,
  `close_time` time DEFAULT NULL,
  `is_closed` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `opening_hours`
--

INSERT INTO `opening_hours` (`id`, `company_id`, `day_of_week`, `open_time`, `close_time`, `is_closed`, `created_at`, `updated_at`) VALUES
(1, 1, 'monday', '09:00:00', '18:00:00', 0, '2024-02-01 09:00:00', NULL),
(2, 1, 'tuesday', '09:00:00', '18:00:00', 0, '2024-02-01 09:00:00', NULL),
(3, 1, 'wednesday', '09:00:00', '18:00:00', 0, '2024-02-01 09:00:00', NULL),
(4, 1, 'thursday', '09:00:00', '18:00:00', 0, '2024-02-01 09:00:00', NULL),
(5, 1, 'friday', '09:00:00', '18:00:00', 0, '2024-02-01 09:00:00', NULL),
(6, 1, 'saturday', '09:00:00', '14:00:00', 0, '2024-02-01 09:00:00', NULL),
(7, 1, 'sunday', NULL, NULL, 1, '2024-02-01 09:00:00', NULL),
(8, 2, 'monday', '08:00:00', '20:00:00', 0, '2024-02-05 10:00:00', NULL),
(9, 2, 'tuesday', '08:00:00', '20:00:00', 0, '2024-02-05 10:00:00', NULL),
(10, 2, 'wednesday', '08:00:00', '20:00:00', 0, '2024-02-05 10:00:00', NULL),
(11, 2, 'thursday', '08:00:00', '20:00:00', 0, '2024-02-05 10:00:00', NULL),
(12, 2, 'friday', '08:00:00', '20:00:00', 0, '2024-02-05 10:00:00', NULL),
(13, 2, 'saturday', '09:00:00', '18:00:00', 0, '2024-02-05 10:00:00', NULL),
(14, 2, 'sunday', '10:00:00', '16:00:00', 0, '2024-02-05 10:00:00', NULL),
(15, 3, 'monday', NULL, NULL, 1, '2024-02-10 11:00:00', NULL),
(16, 3, 'tuesday', '10:00:00', '19:00:00', 0, '2024-02-10 11:00:00', NULL),
(17, 3, 'wednesday', '10:00:00', '19:00:00', 0, '2024-02-10 11:00:00', NULL),
(18, 3, 'thursday', '10:00:00', '19:00:00', 0, '2024-02-10 11:00:00', NULL),
(19, 3, 'friday', '10:00:00', '19:00:00', 0, '2024-02-10 11:00:00', NULL),
(20, 3, 'saturday', '09:00:00', '17:00:00', 0, '2024-02-10 11:00:00', NULL),
(21, 3, 'sunday', NULL, NULL, 1, '2024-02-10 11:00:00', NULL),
(22, 4, 'monday', '09:00:00', '19:00:00', 0, '2024-02-15 12:00:00', NULL),
(23, 4, 'tuesday', '09:00:00', '19:00:00', 0, '2024-02-15 12:00:00', NULL),
(24, 4, 'wednesday', '09:00:00', '19:00:00', 0, '2024-02-15 12:00:00', NULL),
(25, 4, 'thursday', '09:00:00', '19:00:00', 0, '2024-02-15 12:00:00', NULL),
(26, 4, 'friday', '09:00:00', '19:00:00', 0, '2024-02-15 12:00:00', NULL),
(27, 4, 'saturday', '10:00:00', '16:00:00', 0, '2024-02-15 12:00:00', NULL),
(28, 4, 'sunday', NULL, NULL, 1, '2024-02-15 12:00:00', NULL),
(29, 5, 'monday', '06:00:00', '22:00:00', 0, '2024-02-20 13:00:00', NULL),
(30, 5, 'tuesday', '06:00:00', '22:00:00', 0, '2024-02-20 13:00:00', NULL),
(31, 5, 'wednesday', '06:00:00', '22:00:00', 0, '2024-02-20 13:00:00', NULL),
(32, 5, 'thursday', '06:00:00', '22:00:00', 0, '2024-02-20 13:00:00', NULL),
(33, 5, 'friday', '06:00:00', '22:00:00', 0, '2024-02-20 13:00:00', NULL),
(34, 5, 'saturday', '08:00:00', '20:00:00', 0, '2024-02-20 13:00:00', NULL),
(35, 5, 'sunday', '08:00:00', '20:00:00', 0, '2024-02-20 13:00:00', NULL),
(36, 6, 'monday', '07:00:00', '21:00:00', 0, '2024-02-25 14:00:00', NULL),
(37, 6, 'tuesday', '07:00:00', '21:00:00', 0, '2024-02-25 14:00:00', NULL),
(38, 6, 'wednesday', '07:00:00', '21:00:00', 0, '2024-02-25 14:00:00', NULL),
(39, 6, 'thursday', '07:00:00', '21:00:00', 0, '2024-02-25 14:00:00', NULL),
(40, 6, 'friday', '07:00:00', '21:00:00', 0, '2024-02-25 14:00:00', NULL),
(41, 6, 'saturday', '08:00:00', '18:00:00', 0, '2024-02-25 14:00:00', NULL),
(42, 6, 'sunday', '09:00:00', '15:00:00', 0, '2024-02-25 14:00:00', NULL),
(43, 7, 'monday', '10:00:00', '20:00:00', 0, '2024-03-01 15:00:00', NULL),
(44, 7, 'tuesday', '10:00:00', '20:00:00', 0, '2024-03-01 15:00:00', NULL),
(45, 7, 'wednesday', '10:00:00', '20:00:00', 0, '2024-03-01 15:00:00', NULL),
(46, 7, 'thursday', '10:00:00', '20:00:00', 0, '2024-03-01 15:00:00', NULL),
(47, 7, 'friday', '10:00:00', '20:00:00', 0, '2024-03-01 15:00:00', NULL),
(48, 7, 'saturday', '10:00:00', '18:00:00', 0, '2024-03-01 15:00:00', NULL),
(49, 7, 'sunday', NULL, NULL, 1, '2024-03-01 15:00:00', NULL),
(50, 8, 'monday', NULL, NULL, 1, '2024-03-05 16:00:00', NULL),
(51, 8, 'tuesday', '10:00:00', '19:00:00', 0, '2024-03-05 16:00:00', NULL),
(52, 8, 'wednesday', '10:00:00', '19:00:00', 0, '2024-03-05 16:00:00', NULL),
(53, 8, 'thursday', '10:00:00', '19:00:00', 0, '2024-03-05 16:00:00', NULL),
(54, 8, 'friday', '10:00:00', '19:00:00', 0, '2024-03-05 16:00:00', NULL),
(55, 8, 'saturday', '09:00:00', '18:00:00', 0, '2024-03-05 16:00:00', NULL),
(56, 8, 'sunday', NULL, NULL, 1, '2024-03-05 16:00:00', NULL),
(57, 9, 'monday', '09:00:00', '18:00:00', 0, '2024-03-10 17:00:00', NULL),
(58, 9, 'tuesday', '09:00:00', '18:00:00', 0, '2024-03-10 17:00:00', NULL),
(59, 9, 'wednesday', '09:00:00', '18:00:00', 0, '2024-03-10 17:00:00', NULL),
(60, 9, 'thursday', '09:00:00', '18:00:00', 0, '2024-03-10 17:00:00', NULL),
(61, 9, 'friday', '09:00:00', '18:00:00', 0, '2024-03-10 17:00:00', NULL),
(62, 9, 'saturday', '09:00:00', '14:00:00', 0, '2024-03-10 17:00:00', NULL),
(63, 9, 'sunday', NULL, NULL, 1, '2024-03-10 17:00:00', NULL),
(64, 10, 'monday', '09:00:00', '21:00:00', 0, '2024-03-15 18:00:00', NULL),
(65, 10, 'tuesday', '09:00:00', '21:00:00', 0, '2024-03-15 18:00:00', NULL),
(66, 10, 'wednesday', '09:00:00', '21:00:00', 0, '2024-03-15 18:00:00', NULL),
(67, 10, 'thursday', '09:00:00', '21:00:00', 0, '2024-03-15 18:00:00', NULL),
(68, 10, 'friday', '09:00:00', '21:00:00', 0, '2024-03-15 18:00:00', NULL),
(69, 10, 'saturday', '09:00:00', '21:00:00', 0, '2024-03-15 18:00:00', NULL),
(70, 10, 'sunday', '09:00:00', '21:00:00', 0, '2024-03-15 18:00:00', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `appointment_id` int(11) DEFAULT NULL,
  `rating` int(11) NOT NULL COMMENT '1-5 stars',
  `comment` text COLLATE utf8mb4_hungarian_ci,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`id`, `company_id`, `client_id`, `appointment_id`, `rating`, `comment`, `updated_at`, `deleted_at`, `is_deleted`, `created_at`) VALUES
(1, 1, 27, 1, 5, 'Fantasztikus élmény volt! Eszter nagyon profin dolgozott, teljesen elégedett vagyok az arckezeléssel.', NULL, NULL, 0, '2024-02-06 13:00:00'),
(2, 1, 28, 2, 5, 'Prémium arckezelés tényleg prémium! Csak ajánlani tudom.', NULL, NULL, 0, '2024-02-07 09:00:00'),
(3, 1, 29, 3, 4, 'Nagyon jó szolgáltatás, kicsit hosszú volt a várakozás.', NULL, NULL, 0, '2024-02-09 14:00:00'),
(4, 1, 30, 4, 5, 'Visszatérő ügyfél leszek! Kiváló!', NULL, NULL, 0, '2024-02-13 10:00:00'),
(5, 1, 31, 5, 5, 'Valentin napra tökéletes meglepetés volt!', NULL, NULL, 0, '2024-02-15 08:00:00'),
(6, 1, 34, 21, 5, 'Kati köröm specialista, csak ajánlani tudom!', NULL, NULL, 0, '2024-02-08 13:00:00'),
(7, 1, 35, 22, 4, 'Szép munka, visszajövök!', NULL, NULL, 0, '2024-02-10 15:00:00'),
(8, 1, 36, 23, 5, 'Profi manikűr, elégedett vagyok.', NULL, NULL, 0, '2024-02-14 11:00:00'),
(9, 1, 37, 24, 4, 'Jó élmény volt, ajánlom!', NULL, NULL, 0, '2024-02-17 09:00:00'),
(10, 2, 30, 39, 5, 'Luxus élmény! A hot stone masszázs csodálatos volt.', NULL, NULL, 0, '2024-02-07 14:00:00'),
(11, 2, 31, 40, 5, 'Márta arany kezű masszőr! Teljesen ellazultam.', NULL, NULL, 0, '2024-02-11 09:00:00'),
(12, 2, 32, 41, 4, 'Nagyon jó, de kicsit drága.', NULL, NULL, 0, '2024-02-16 13:00:00'),
(13, 2, 33, 42, 5, 'Minden alkalommal tökéletes!', NULL, NULL, 0, '2024-02-21 10:00:00'),
(14, 2, 34, 43, 5, 'A SPA csomag felülmúlta a várakozásaimat!', NULL, NULL, 0, '2024-02-25 09:00:00'),
(15, 2, 31, 50, 5, 'Júlia masszázsa fantasztikus volt!', NULL, NULL, 0, '2024-02-09 15:00:00'),
(16, 2, 32, 51, 4, 'Kellemes környezet és kedves személyzet.', NULL, NULL, 0, '2024-02-15 10:00:00'),
(17, 2, 33, 52, 5, 'A VIP csomag minden forintot megért!', NULL, NULL, 0, '2024-02-20 14:00:00'),
(18, 3, 32, 60, 5, 'Anna csodát művelt a hajammal! Imádom az új frizurámat.', NULL, NULL, 0, '2024-02-10 13:00:00'),
(19, 3, 33, 61, 4, 'Szép hajfestés, kicsit hosszú volt a folyamat.', NULL, NULL, 0, '2024-02-17 10:00:00'),
(20, 3, 34, 62, 5, 'A melírozás tökéletesen sikerült!', NULL, NULL, 0, '2024-02-24 14:00:00'),
(21, 3, 35, 63, 5, 'Profi munka, visszajövök!', NULL, NULL, 0, '2024-03-03 16:00:00'),
(22, 3, 36, 64, 4, 'Jó élmény, ajánlom!', NULL, NULL, 0, '2024-03-10 13:00:00'),
(23, 3, 30, 69, 5, 'Péter profi fodrász, csak ajánlani tudom!', NULL, NULL, 0, '2024-02-12 09:00:00'),
(24, 3, 31, 70, 4, 'Szép munka, elégedett vagyok.', NULL, NULL, 0, '2024-02-19 16:00:00'),
(25, 3, 32, 71, 5, 'Gyors és precíz férfi hajvágás!', NULL, NULL, 0, '2024-02-26 10:00:00'),
(26, 4, 28, 78, 5, 'Zsuzsanna műköröm építése fantasztikus! Tartós és gyönyörű.', NULL, NULL, 0, '2024-02-13 14:00:00'),
(27, 4, 29, 79, 5, 'Professzionális munka, csak ajánlani tudom!', NULL, NULL, 0, '2024-02-20 15:00:00'),
(28, 4, 30, 80, 4, 'Szép gél lakk, kicsit drága.', NULL, NULL, 0, '2024-02-27 13:00:00'),
(29, 4, 31, 81, 5, 'A porcelán műköröm gyönyörű lett!', NULL, NULL, 0, '2024-03-05 12:00:00'),
(30, 4, 32, 82, 5, 'Műköröm töltés tökéletes!', NULL, NULL, 0, '2024-03-12 16:00:00'),
(31, 4, 36, 86, 5, 'Viktória remek körömművész!', NULL, NULL, 0, '2024-02-16 13:00:00'),
(32, 4, 37, 87, 4, 'SPA pedikűr élmény volt!', NULL, NULL, 0, '2024-02-23 16:00:00'),
(33, 5, 32, 93, 5, 'Gábor fantasztikus személyi edző! Motiváló és szakértő.', NULL, NULL, 0, '2024-02-14 09:00:00'),
(34, 5, 33, 94, 5, 'CrossFit óra brutál volt, de imádtam!', NULL, NULL, 0, '2024-02-21 10:00:00'),
(35, 5, 34, 95, 4, 'Jó edzés, visszajövök!', NULL, NULL, 0, '2024-02-28 09:00:00'),
(36, 5, 35, 96, 5, 'TRX edzés kihívás volt, de megérte!', NULL, NULL, 0, '2024-03-06 10:00:00'),
(37, 5, 28, 100, 5, 'Laura spinning órája energikus és motiváló!', NULL, NULL, 0, '2024-02-15 19:00:00'),
(38, 5, 29, 101, 4, 'Jó edzés, ajánlom!', NULL, NULL, 0, '2024-02-22 10:00:00'),
(39, 6, 35, 107, 5, 'Emese jóga órája békét és harmóniát hoz. Csodálatos élmény!', NULL, NULL, 0, '2024-03-01 13:00:00'),
(40, 6, 36, 108, 5, 'Vinyasa flow jóga energizáló volt!', NULL, NULL, 0, '2024-03-07 16:00:00'),
(41, 6, 37, 109, 5, 'Yin jóga tökéletes relaxáció!', NULL, NULL, 0, '2024-03-14 14:00:00'),
(42, 6, 27, 110, 4, 'Meditációs óra nyugtató volt.', NULL, NULL, 0, '2024-03-21 17:00:00'),
(43, 6, 28, 111, 5, 'Pilates óra kihívás, de imádtam!', NULL, NULL, 0, '2024-03-28 15:00:00'),
(44, 7, 32, 115, 5, 'István masszázsa felülmúlhatatlan! Profin dolgozik.', NULL, NULL, 0, '2024-02-18 11:00:00'),
(45, 7, 33, 116, 5, 'Sportmasszázs után mint újjászületett!', NULL, NULL, 0, '2024-02-25 15:00:00'),
(46, 7, 34, 117, 4, 'Talpmasszázs kellemes volt.', NULL, NULL, 0, '2024-03-03 12:00:00'),
(47, 7, 35, 118, 5, 'Svéd masszázs 90 perc luxus!', NULL, NULL, 0, '2024-03-10 16:00:00'),
(48, 7, 36, 119, 5, 'Aromaterápiás masszázs csodálatos!', NULL, NULL, 0, '2024-03-17 11:00:00'),
(49, 8, 29, 123, 5, 'Dániel a legjobb barber! Klasszikus hajvágás tökéletes.', NULL, NULL, 0, '2024-02-14 12:00:00'),
(50, 8, 30, 124, 5, 'Modern férfi vágás profi munka!', NULL, NULL, 0, '2024-02-21 15:00:00'),
(51, 8, 31, 125, 4, 'Szakáll formázás jó volt.', NULL, NULL, 0, '2024-02-28 12:00:00'),
(52, 8, 32, 126, 5, 'VIP csomag minden forintot megért!', NULL, NULL, 0, '2024-03-06 15:00:00'),
(53, 8, 33, 127, 5, 'Hajvágás gyors és precíz!', NULL, NULL, 0, '2024-03-13 11:30:00'),
(54, 9, 27, 131, 5, 'Réka bio arckezelése csodálatos! Természetes és hatékony.', NULL, NULL, 0, '2024-02-19 12:00:00'),
(55, 9, 28, 132, 5, 'Organikus testkezelés luxus élmény!', NULL, NULL, 0, '2024-02-26 15:00:00'),
(56, 9, 29, 133, 4, 'Natúr hámlasztás kellemes volt.', NULL, NULL, 0, '2024-03-04 11:00:00'),
(57, 9, 30, 134, 5, 'Bio masszázs felfrissítő!', NULL, NULL, 0, '2024-03-11 16:00:00'),
(58, 9, 31, 135, 4, 'Öko manikűr szép munka.', NULL, NULL, 0, '2024-03-18 11:00:00'),
(59, 10, 35, 139, 5, 'Tamás thai masszázsa csodálatos! Ázsiai élmény Budapesten.', NULL, NULL, 0, '2024-02-22 13:00:00'),
(60, 10, 36, 140, 5, 'Shiatsu masszázs professzionális!', NULL, NULL, 0, '2024-02-29 16:00:00'),
(61, 10, 37, 141, 4, 'Meditációs óra nyugtató.', NULL, NULL, 0, '2024-03-07 14:00:00'),
(62, 10, 27, 142, 5, 'Zen spa rituálé elképesztő élmény!', NULL, NULL, 0, '2024-03-14 13:00:00'),
(63, 10, 28, 143, 5, 'Infra szauna relaxáló!', NULL, NULL, 0, '2024-03-21 14:00:00'),
(64, 10, 29, 144, 5, 'Teljes Zen csomag felülmúlhatatlan! Három óra mennyország!', NULL, NULL, 0, '2024-03-28 15:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_hungarian_ci NOT NULL,
  `description` text COLLATE utf8mb4_hungarian_ci,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`, `updated_at`, `deleted_at`, `is_deleted`, `created_at`) VALUES
(1, 'superadmin', 'Teljes hozzáférés az összes rendszer funkcióhoz és minden céghez', NULL, NULL, 0, '2024-01-01 10:00:00'),
(2, 'admin', 'Cég szintű adminisztrátor, teljes hozzáférés a saját céghez', NULL, NULL, 0, '2024-01-01 10:00:00'),
(3, 'staff', 'Munkatárs, aki szolgáltatásokat nyújt és időpontokat kezel', NULL, NULL, 0, '2024-01-01 10:00:00'),
(4, 'client', 'Ügyfél, aki időpontokat foglal', NULL, NULL, 0, '2024-01-01 10:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

CREATE TABLE `services` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_hungarian_ci NOT NULL,
  `description` text COLLATE utf8mb4_hungarian_ci,
  `duration_minutes` int(11) NOT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `currency` varchar(10) COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`id`, `company_id`, `name`, `description`, `duration_minutes`, `price`, `currency`, `is_active`, `created_at`, `updated_at`, `deleted_at`, `is_deleted`) VALUES
(1, 1, 'Basic arckezelés', 'Alapos arctisztítás, pakolás, arcmasszázs', 60, '8900.00', 'HUF', 1, '2024-02-01 12:00:00', NULL, NULL, 0),
(2, 1, 'Prémium arckezelés', 'Luxus arckezelés anti-aging hatással', 90, '15900.00', 'HUF', 1, '2024-02-01 12:00:00', NULL, NULL, 0),
(3, 1, 'Hialuronsavas kezelés', 'Intenzív hidratáló arckezelés', 75, '12900.00', 'HUF', 1, '2024-02-01 12:00:00', NULL, NULL, 0),
(4, 1, 'Manikűr', 'Kéz- és körömápolás', 45, '4900.00', 'HUF', 1, '2024-02-01 12:00:00', NULL, NULL, 0),
(5, 1, 'Gél lakk', 'Tartós géllakk kézre', 60, '6900.00', 'HUF', 1, '2024-02-01 12:00:00', NULL, NULL, 0),
(6, 1, 'Szempillafestés', 'Természetes szempilla festés', 30, '3900.00', 'HUF', 1, '2024-02-01 12:00:00', NULL, NULL, 0),
(7, 2, 'Svéd masszázs', 'Klasszikus relaxáló masszázs', 60, '11900.00', 'HUF', 1, '2024-02-05 13:00:00', NULL, NULL, 0),
(8, 2, 'Aromaterápiás masszázs', 'Illóolajos masszázs kezelés', 75, '13900.00', 'HUF', 1, '2024-02-05 13:00:00', NULL, NULL, 0),
(9, 2, 'Hot stone masszázs', 'Forró kő masszázs', 90, '16900.00', 'HUF', 1, '2024-02-05 13:00:00', NULL, NULL, 0),
(10, 2, 'Talpmasszázs', 'Reflexológiai talpmasszázs', 45, '8900.00', 'HUF', 1, '2024-02-05 13:00:00', NULL, NULL, 0),
(11, 2, 'Teljes SPA csomag', 'Komplex spa élmény 3 órában', 180, '35900.00', 'HUF', 1, '2024-02-05 13:00:00', NULL, NULL, 0),
(12, 2, 'Arckezelés gold maszkkal', 'Luxus arany arckezelés', 90, '24900.00', 'HUF', 1, '2024-02-05 13:00:00', NULL, NULL, 0),
(13, 3, 'Női hajvágás', 'Professzionális női hajvágás', 45, '6900.00', 'HUF', 1, '2024-02-10 14:00:00', NULL, NULL, 0),
(14, 3, 'Férfi hajvágás', 'Modern férfi frizura', 30, '4500.00', 'HUF', 1, '2024-02-10 14:00:00', NULL, NULL, 0),
(15, 3, 'Hajfestés rövid hajra', 'Teljes hajfestés rövid hajra', 90, '12900.00', 'HUF', 1, '2024-02-10 14:00:00', NULL, NULL, 0),
(16, 3, 'Hajfestés hosszú hajra', 'Teljes hajfestés hosszú hajra', 120, '17900.00', 'HUF', 1, '2024-02-10 14:00:00', NULL, NULL, 0),
(17, 3, 'Melírozás', 'Melír vagy balayage', 150, '22900.00', 'HUF', 1, '2024-02-10 14:00:00', NULL, NULL, 0),
(18, 4, 'Zselés műköröm', 'Teljes zselés műköröm építés', 120, '11900.00', 'HUF', 1, '2024-02-15 15:00:00', NULL, NULL, 0),
(19, 4, 'Porcelán műköröm', 'Porcelán műköröm építés', 150, '14900.00', 'HUF', 1, '2024-02-15 15:00:00', NULL, NULL, 0),
(20, 4, 'Műköröm töltés', 'Műköröm karbantartás', 90, '8900.00', 'HUF', 1, '2024-02-15 15:00:00', NULL, NULL, 0),
(21, 4, 'Gél lakk manikűr', 'Manikűr géllakkal', 60, '6900.00', 'HUF', 1, '2024-02-15 15:00:00', NULL, NULL, 0),
(22, 4, 'SPA pedikűr', 'Luxus pedikűr kezelés', 75, '8900.00', 'HUF', 1, '2024-02-15 15:00:00', NULL, NULL, 0),
(23, 5, 'Személyi edzés 1 alkalom', 'Egyéni személyi edzés', 60, '8900.00', 'HUF', 1, '2024-02-20 16:00:00', NULL, NULL, 0),
(24, 5, 'Személyi edzés 5 alkalom', '5 alkalmas személyi edzés bérlet', 300, '39900.00', 'HUF', 1, '2024-02-20 16:00:00', NULL, NULL, 0),
(25, 5, 'Spinning óra', 'Csoportos spinning', 45, '2900.00', 'HUF', 1, '2024-02-20 16:00:00', NULL, NULL, 0),
(26, 5, 'CrossFit edzés', 'Funkcionális crossfit', 60, '3900.00', 'HUF', 1, '2024-02-20 16:00:00', NULL, NULL, 0),
(27, 5, 'TRX edzés', 'TRX funkcionális tréning', 45, '3500.00', 'HUF', 1, '2024-02-20 16:00:00', NULL, NULL, 0),
(28, 6, 'Hatha jóga', 'Klasszikus hatha jóga óra', 75, '3900.00', 'HUF', 1, '2024-02-25 17:00:00', NULL, NULL, 0),
(29, 6, 'Vinyasa flow jóga', 'Dinamikus jóga óra', 60, '3900.00', 'HUF', 1, '2024-02-25 17:00:00', NULL, NULL, 0),
(30, 6, 'Yin jóga', 'Lassú, meditatív jóga', 90, '4500.00', 'HUF', 1, '2024-02-25 17:00:00', NULL, NULL, 0),
(31, 6, 'Meditációs óra', 'Vezetett meditáció', 45, '2900.00', 'HUF', 1, '2024-02-25 17:00:00', NULL, NULL, 0),
(32, 6, 'Pilates óra', 'Pilates edzés', 60, '3900.00', 'HUF', 1, '2024-02-25 17:00:00', NULL, NULL, 0),
(33, 7, 'Svéd masszázs 60 perc', 'Klasszikus svéd masszázs', 60, '9900.00', 'HUF', 1, '2024-03-01 18:00:00', NULL, NULL, 0),
(34, 7, 'Svéd masszázs 90 perc', 'Hosszú svéd masszázs', 90, '13900.00', 'HUF', 1, '2024-03-01 18:00:00', NULL, NULL, 0),
(35, 7, 'Sportmasszázs', 'Sportolóknak ajánlott', 60, '11900.00', 'HUF', 1, '2024-03-01 18:00:00', NULL, NULL, 0),
(36, 7, 'Talpmasszázs', 'Reflexológia', 45, '7900.00', 'HUF', 1, '2024-03-01 18:00:00', NULL, NULL, 0),
(37, 7, 'Aromaterápiás masszázs', 'Illóolajos kezelés', 75, '12900.00', 'HUF', 1, '2024-03-01 18:00:00', NULL, NULL, 0),
(38, 8, 'Klasszikus férfi vágás', 'Hagyományos férfi hajvágás', 30, '4500.00', 'HUF', 1, '2024-03-05 19:00:00', NULL, NULL, 0),
(39, 8, 'Modern férfi vágás', 'Trendi férfi frizura', 45, '5900.00', 'HUF', 1, '2024-03-05 19:00:00', NULL, NULL, 0),
(40, 8, 'Borotválás', 'Hagyományos borotválás', 30, '4900.00', 'HUF', 1, '2024-03-05 19:00:00', NULL, NULL, 0),
(41, 8, 'Szakáll formázás', 'Szakáll igazítás és ápolás', 30, '3900.00', 'HUF', 1, '2024-03-05 19:00:00', NULL, NULL, 0),
(42, 8, 'VIP csomag', 'Vágás, borotválás, masszázs', 90, '12900.00', 'HUF', 1, '2024-03-05 19:00:00', NULL, NULL, 0),
(43, 9, 'Bio arckezelés', 'Természetes alapanyagú arckezelés', 60, '9900.00', 'HUF', 1, '2024-03-10 20:00:00', NULL, NULL, 0),
(44, 9, 'Organikus testkezelés', 'Teljes test kezelés bio termékekkel', 75, '11900.00', 'HUF', 1, '2024-03-10 20:00:00', NULL, NULL, 0),
(45, 9, 'Natúr hámlasztás', 'Természetes peeling kezelés', 45, '6900.00', 'HUF', 1, '2024-03-10 20:00:00', NULL, NULL, 0),
(46, 9, 'Bio masszázs', 'Természetes olajos masszázs', 60, '10900.00', 'HUF', 1, '2024-03-10 20:00:00', NULL, NULL, 0),
(47, 9, 'Öko manikűr', 'Vegán köröm kezelés', 45, '5900.00', 'HUF', 1, '2024-03-10 20:00:00', NULL, NULL, 0),
(48, 10, 'Thai masszázs', 'Hagyományos thai masszázs', 90, '15900.00', 'HUF', 1, '2024-03-15 21:00:00', NULL, NULL, 0),
(49, 10, 'Shiatsu masszázs', 'Japán nyomásontos masszázs', 60, '13900.00', 'HUF', 1, '2024-03-15 21:00:00', NULL, NULL, 0),
(50, 10, 'Meditációs óra', 'Vezetett meditáció', 60, '4900.00', 'HUF', 1, '2024-03-15 21:00:00', NULL, NULL, 0),
(51, 10, 'Zen spa rituálé', 'Komplex ázsiai spa élmény', 120, '29900.00', 'HUF', 1, '2024-03-15 21:00:00', NULL, NULL, 0),
(52, 10, 'Infra szauna', 'Infra szauna használat', 45, '5900.00', 'HUF', 1, '2024-03-15 21:00:00', NULL, NULL, 0),
(53, 10, 'Gyógyfürdő belépő', 'Ásványvizes gyógyfürdő', 90, '6900.00', 'HUF', 1, '2024-03-15 21:00:00', NULL, NULL, 0),
(54, 10, 'Teljes Zen csomag', 'Masszázs + szauna + fürdő', 180, '42900.00', 'HUF', 1, '2024-03-15 21:00:00', NULL, NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `service_categories`
--

CREATE TABLE `service_categories` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_hungarian_ci NOT NULL,
  `description` text COLLATE utf8mb4_hungarian_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `service_categories`
--

INSERT INTO `service_categories` (`id`, `company_id`, `name`, `description`, `created_at`, `updated_at`) VALUES
(1, 1, 'Arcápolás', 'Professzionális arckezelések minden bőrtípusra', '2024-02-01 10:00:00', NULL),
(2, 1, 'Testkezelések', 'Testformáló és relaxáló testkezelések', '2024-02-01 10:00:00', NULL),
(3, 1, 'Körömápolás', 'Manikűr, pedikűr és műköröm', '2024-02-01 10:00:00', NULL),
(4, 1, 'Szempilla és szemöldök', 'Szempilla és szemöldök szépítés', '2024-02-01 10:00:00', NULL),
(5, 1, 'Szőrtelenítés', 'Tartós és hagyományos szőrtelenítés', '2024-02-01 10:00:00', NULL),
(6, 2, 'Masszázsok', 'Különböző típusú masszázs kezelések', '2024-02-05 11:00:00', NULL),
(7, 2, 'Spa kezelések', 'Luxus spa és wellness kezelések', '2024-02-05 11:00:00', NULL),
(8, 2, 'Aromaterápia', 'Illóolajos kezelések és terápiák', '2024-02-05 11:00:00', NULL),
(9, 2, 'Arckezelések', 'Prémium arcápoló kezelések', '2024-02-05 11:00:00', NULL),
(10, 3, 'Női hajvágás', 'Női frizurák és hajvágások', '2024-02-10 12:00:00', NULL),
(11, 3, 'Férfi hajvágás', 'Férfi frizurák és hajvágások', '2024-02-10 12:00:00', NULL),
(12, 3, 'Hajfestés', 'Hajszínezés és melírozás', '2024-02-10 12:00:00', NULL),
(13, 3, 'Hajkezelések', 'Ápoló és regeneráló hajkezelések', '2024-02-10 12:00:00', NULL),
(14, 4, 'Műköröm', 'Zselés és porcelán műköröm', '2024-02-15 13:00:00', NULL),
(15, 4, 'Gél lakk', 'Tartós géllakk kezelések', '2024-02-15 13:00:00', NULL),
(16, 4, 'Körömművészet', 'Körömdekorációk és díszítések', '2024-02-15 13:00:00', NULL),
(17, 4, 'Pedikűr', 'Lábápolás és pedikűr', '2024-02-15 13:00:00', NULL),
(18, 5, 'Személyi edzés', 'Egyéni edzéstervek személyi edzővel', '2024-02-20 14:00:00', NULL),
(19, 5, 'Csoportos órák', 'Változatos csoportos edzések', '2024-02-20 14:00:00', NULL),
(20, 5, 'Funkcionális tréning', 'Funkcionális edzések', '2024-02-20 14:00:00', NULL),
(21, 5, 'Spinning', 'Spinning és cardio edzések', '2024-02-20 14:00:00', NULL),
(22, 6, 'Jóga órák', 'Különböző stílusú jóga órák', '2024-02-25 15:00:00', NULL),
(23, 6, 'Meditáció', 'Meditációs foglalkozások', '2024-02-25 15:00:00', NULL),
(24, 6, 'Pilates', 'Pilates edzések', '2024-02-25 15:00:00', NULL),
(25, 6, 'Légzéstechnika', 'Légzőgyakorlatok és relaxáció', '2024-02-25 15:00:00', NULL),
(26, 7, 'Svéd masszázs', 'Klasszikus svéd masszázs kezelések', '2024-03-01 16:00:00', NULL),
(27, 7, 'Sportmasszázs', 'Sportolóknak ajánlott masszázsok', '2024-03-01 16:00:00', NULL),
(28, 7, 'Talpmasszázs', 'Reflexológia és talpmasszázs', '2024-03-01 16:00:00', NULL),
(29, 7, 'Aromaterápiás masszázs', 'Illóolajos masszázs kezelések', '2024-03-01 16:00:00', NULL),
(30, 8, 'Férfi hajvágás', 'Klasszikus és modern férfi frizurák', '2024-03-05 17:00:00', NULL),
(31, 8, 'Borotválás', 'Hagyományos borotválás', '2024-03-05 17:00:00', NULL),
(32, 8, 'Szakáll formázás', 'Szakáll nyírás és ápolás', '2024-03-05 17:00:00', NULL),
(33, 8, 'VIP csomagok', 'Komplett csomagok férfiaknak', '2024-03-05 17:00:00', NULL),
(34, 9, 'Bio kozmetika', 'Természetes alapanyagú kezelések', '2024-03-10 18:00:00', NULL),
(35, 9, 'Arcápolás', 'Organikus arckezelések', '2024-03-10 18:00:00', NULL),
(36, 9, 'Testápolás', 'Természetes testkezelések', '2024-03-10 18:00:00', NULL),
(37, 9, 'Masszázs', 'Bio olajos masszázsok', '2024-03-10 18:00:00', NULL),
(38, 10, 'Ázsiai masszázsok', 'Thai, Shiatsu és egyéb ázsiai technikák', '2024-03-15 19:00:00', NULL),
(39, 10, 'Meditáció', 'Meditációs szekciók és tanfolyamok', '2024-03-15 19:00:00', NULL),
(40, 10, 'Spa rituálék', 'Komplex spa élmények', '2024-03-15 19:00:00', NULL),
(41, 10, 'Szauna és gőzfürdő', 'Hagyományos és infra szauna', '2024-03-15 19:00:00', NULL),
(42, 10, 'Gyógyfürdő', 'Ásványvizes gyógyfürdő kezelések', '2024-03-15 19:00:00', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `service_category_map`
--

CREATE TABLE `service_category_map` (
  `id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `service_category_map`
--

INSERT INTO `service_category_map` (`id`, `service_id`, `category_id`, `created_at`) VALUES
(1, 1, 1, '2024-02-01 11:30:00'),
(2, 2, 1, '2024-02-01 11:30:00'),
(3, 3, 1, '2024-02-01 11:30:00'),
(4, 4, 3, '2024-02-01 11:30:00'),
(5, 5, 3, '2024-02-01 11:30:00'),
(6, 6, 4, '2024-02-01 11:30:00'),
(7, 7, 6, '2024-02-05 12:30:00'),
(8, 8, 6, '2024-02-05 12:30:00'),
(9, 8, 8, '2024-02-05 12:30:00'),
(10, 9, 6, '2024-02-05 12:30:00'),
(11, 10, 6, '2024-02-05 12:30:00'),
(12, 11, 7, '2024-02-05 12:30:00'),
(13, 12, 9, '2024-02-05 12:30:00'),
(14, 13, 10, '2024-02-10 13:30:00'),
(15, 14, 11, '2024-02-10 13:30:00'),
(16, 15, 12, '2024-02-10 13:30:00'),
(17, 16, 12, '2024-02-10 13:30:00'),
(18, 17, 12, '2024-02-10 13:30:00'),
(19, 18, 14, '2024-02-15 14:30:00'),
(20, 19, 14, '2024-02-15 14:30:00'),
(21, 20, 14, '2024-02-15 14:30:00'),
(22, 21, 15, '2024-02-15 14:30:00'),
(23, 22, 17, '2024-02-15 14:30:00'),
(24, 23, 18, '2024-02-20 15:30:00'),
(25, 24, 18, '2024-02-20 15:30:00'),
(26, 25, 21, '2024-02-20 15:30:00'),
(27, 26, 20, '2024-02-20 15:30:00'),
(28, 27, 20, '2024-02-20 15:30:00'),
(29, 28, 22, '2024-02-25 16:30:00'),
(30, 29, 22, '2024-02-25 16:30:00'),
(31, 30, 22, '2024-02-25 16:30:00'),
(32, 31, 23, '2024-02-25 16:30:00'),
(33, 32, 24, '2024-02-25 16:30:00'),
(34, 33, 26, '2024-03-01 17:30:00'),
(35, 34, 26, '2024-03-01 17:30:00'),
(36, 35, 27, '2024-03-01 17:30:00'),
(37, 36, 28, '2024-03-01 17:30:00'),
(38, 37, 29, '2024-03-01 17:30:00'),
(39, 38, 30, '2024-03-05 18:30:00'),
(40, 39, 30, '2024-03-05 18:30:00'),
(41, 40, 31, '2024-03-05 18:30:00'),
(42, 41, 32, '2024-03-05 18:30:00'),
(43, 42, 33, '2024-03-05 18:30:00'),
(44, 43, 34, '2024-03-10 19:30:00'),
(45, 43, 35, '2024-03-10 19:30:00'),
(46, 44, 34, '2024-03-10 19:30:00'),
(47, 44, 36, '2024-03-10 19:30:00'),
(48, 45, 34, '2024-03-10 19:30:00'),
(49, 46, 37, '2024-03-10 19:30:00'),
(50, 47, 35, '2024-03-10 19:30:00'),
(51, 48, 38, '2024-03-15 20:30:00'),
(52, 49, 38, '2024-03-15 20:30:00'),
(53, 50, 39, '2024-03-15 20:30:00'),
(54, 51, 40, '2024-03-15 20:30:00'),
(55, 52, 41, '2024-03-15 20:30:00'),
(56, 53, 42, '2024-03-15 20:30:00'),
(57, 54, 40, '2024-03-15 20:30:00'),
(58, 54, 41, '2024-03-15 20:30:00'),
(59, 54, 42, '2024-03-15 20:30:00');

-- --------------------------------------------------------

--
-- Table structure for table `staff`
--

CREATE TABLE `staff` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `display_name` varchar(255) COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `specialties` text COLLATE utf8mb4_hungarian_ci,
  `bio` text COLLATE utf8mb4_hungarian_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `staff`
--

INSERT INTO `staff` (`id`, `user_id`, `company_id`, `display_name`, `specialties`, `bio`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 12, 1, 'Eszter - Senior Kozmetikus', 'Arckezelés, Bőrápolás, Anti-aging', '10+ éves tapasztalat a szépségiparban. Szakértő vagyok az arckezelések területén.', 1, '2024-02-01 13:00:00', NULL),
(2, 13, 1, 'Kati - Körömspecialista', 'Manikűr, Pedikűr, Műköröm, Gél lakk', 'Körömápolás specialista vagyok, imádom a kreatív körömművészetet.', 1, '2024-02-01 13:00:00', NULL),
(3, 14, 2, 'Márta - Masszőr', 'Svéd masszázs, Aromaterápia, Relaxációs masszázs', 'Certificált masszőr vagyok, aki a teljes körű ellazulást helyezi előtérbe.', 1, '2024-02-05 14:00:00', NULL),
(4, 15, 2, 'Júlia - Spa Specialista', 'Hot stone, Thai masszázs, Sportmasszázs', '8 éve foglalkozom masszázzsal. Sportolóknak és aktív életmódot élőknek ajánlom szolgáltatásaimat.', 1, '2024-02-05 14:00:00', NULL),
(5, 16, 3, 'Anna - Fodrász', 'Női hajvágás, Hajfestés, Melírozás', 'Kreatív fodrász vagyok, aki imádja a trendi frizurákat és a színezési technikákat.', 1, '2024-02-10 15:00:00', NULL),
(6, 17, 3, 'Péter - Színező specialista', 'Hajfestés, Balayage, Ombre', 'A hajszínezés a szenvedélyem. Modern technikákkal dolgozom.', 1, '2024-02-10 15:00:00', NULL),
(7, 18, 4, 'Zsuzsanna - Műköröm építő', 'Zselés műköröm, Porcelán köröm, Babyboomer', 'Műköröm specialista vagyok 7 éves tapasztalattal.', 1, '2024-02-15 16:00:00', NULL),
(8, 19, 4, 'Viktória - Nail Artist', 'Körömművészet, Gél lakk, Díszítés', 'Kreatív körömművész vagyok, egyedi dizájnokat készítek.', 1, '2024-02-15 16:00:00', NULL),
(9, 20, 5, 'Gábor - Személyi edző', 'Erőnléti edzés, CrossFit, TRX', 'Személyi edző vagyok 12 éves tapasztalattal. Segítek elérni a céljaidat!', 1, '2024-02-20 17:00:00', NULL),
(10, 21, 5, 'Laura - Fitness instruktor', 'Spinning, Csoportos órák, Funkcionális tréning', 'Csoportos órák specialistája vagyok, motiválni szeretek!', 1, '2024-02-20 17:00:00', NULL),
(11, 22, 6, 'Emese - Jóga oktató', 'Hatha jóga, Vinyasa, Yin jóga, Meditáció', 'Certificált jóga oktató vagyok. A test-lélek-szellem harmóniája a célom.', 1, '2024-02-25 18:00:00', NULL),
(12, 23, 7, 'István - Masszőr', 'Svéd masszázs, Sportmasszázs, Talpmasszázs', 'Professzionális masszőr vagyok, specializációm a sportmasszázs.', 1, '2024-03-01 19:00:00', NULL),
(13, 24, 8, 'Dániel - Barber', 'Férfi hajvágás, Borotválás, Szakáll formázás', 'Hagyományos borbély vagyok modern technikákkal. Férfi frizurák specialistája.', 1, '2024-03-05 20:00:00', NULL),
(14, 25, 9, 'Réka - Bio kozmetikus', 'Bio arckezelés, Természetes termékek, Organikus kezelések', 'Természetes szépségápolás híve vagyok. Csak bio termékekkel dolgozom.', 1, '2024-03-10 21:00:00', NULL),
(15, 26, 10, 'Tamás - Ázsiai masszázs specialista', 'Thai masszázs, Shiatsu, Meditáció', 'Ázsiai masszázs technikák szakértője vagyok. 15 éve praktizálom a thai masszázst.', 1, '2024-03-15 22:00:00', NULL);

--
-- Triggers `staff`
--
DELIMITER $$
CREATE TRIGGER `after_staff_update_audit` AFTER UPDATE ON `staff` FOR EACH ROW BEGIN
    IF NEW.is_active != OLD.is_active THEN
        INSERT INTO `audit_logs` (
            `performed_by_user_id`,
            `performed_by_role`,
            `affected_user_id`,
            `company_id`,
            `email`,
            `entity_type`,
            `action`,
            `old_values`,
            `new_values`,
            `created_at`
        )
        VALUES (
            NEW.user_id,
            'staff',
            NEW.user_id,
            NEW.company_id,
            (SELECT email FROM users WHERE id = NEW.user_id),
            'staff',
            IF(NEW.is_active = TRUE, 'activate', 'deactivate'),
            JSON_OBJECT('is_active', OLD.is_active),
            JSON_OBJECT('is_active', NEW.is_active),
            NOW()
        );
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `staff_exceptions`
--

CREATE TABLE `staff_exceptions` (
  `id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `type` enum('day_off','custom_hours') COLLATE utf8mb4_hungarian_ci NOT NULL COMMENT 'teljes szabi vagy egyedi időablak',
  `note` text COLLATE utf8mb4_hungarian_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `staff_exceptions`
--

INSERT INTO `staff_exceptions` (`id`, `staff_id`, `date`, `start_time`, `end_time`, `type`, `note`, `created_at`, `deleted_at`, `is_deleted`) VALUES
(1, 1, '2024-03-08', NULL, NULL, 'day_off', 'Nőnap - pihenőnap', '2024-02-20 09:00:00', NULL, 0),
(2, 1, '2024-03-15', '09:00:00', '13:00:00', 'custom_hours', 'Csak délelőtt - délután orvosi vizit', '2024-02-20 09:00:00', NULL, 0),
(3, 1, '2024-04-01', NULL, NULL, 'day_off', 'Húsvéti hétfő', '2024-02-20 09:00:00', NULL, 0),
(4, 2, '2024-03-20', NULL, NULL, 'day_off', 'Családi program', '2024-02-20 09:00:00', NULL, 0),
(5, 2, '2024-03-25', '14:00:00', '18:00:00', 'custom_hours', 'Csak délután - reggel vizsgaidőszak', '2024-02-20 09:00:00', NULL, 0),
(6, 2, '2024-04-02', NULL, NULL, 'day_off', 'Húsvét utáni pihenőnap', '2024-02-20 09:00:00', NULL, 0),
(7, 3, '2024-03-11', NULL, NULL, 'day_off', 'Betegszabadság', '2024-02-25 10:00:00', NULL, 0),
(8, 3, '2024-03-29', NULL, NULL, 'day_off', 'Nagypéntek', '2024-02-25 10:00:00', NULL, 0),
(9, 3, '2024-04-05', '09:00:00', '13:00:00', 'custom_hours', 'Rövid műszak - délután továbbképzés', '2024-02-25 10:00:00', NULL, 0),
(10, 4, '2024-03-18', NULL, NULL, 'day_off', 'Családi esemény', '2024-02-25 10:00:00', NULL, 0),
(11, 4, '2024-03-28', '08:00:00', '20:00:00', 'custom_hours', 'Extra hosszú műszak - kolléga helyettesítése', '2024-02-25 10:00:00', NULL, 0),
(12, 4, '2024-04-10', NULL, NULL, 'day_off', 'Szabadság', '2024-02-25 10:00:00', NULL, 0),
(13, 5, '2024-03-12', NULL, NULL, 'day_off', 'Továbbképzés Bécsben', '2024-03-01 11:00:00', NULL, 0),
(14, 5, '2024-03-22', '14:00:00', '18:00:00', 'custom_hours', 'Csak délután - reggel fogorvos', '2024-03-01 11:00:00', NULL, 0),
(15, 5, '2024-04-08', NULL, NULL, 'day_off', 'Tavaszi szabadság', '2024-03-01 11:00:00', NULL, 0),
(16, 6, '2024-03-14', NULL, NULL, 'day_off', 'Nemzeti ünnep utáni pihenő', '2024-03-01 11:00:00', NULL, 0),
(17, 6, '2024-03-27', '11:00:00', '15:00:00', 'custom_hours', 'Rövid műszak - esti program', '2024-03-01 11:00:00', NULL, 0),
(18, 6, '2024-04-12', NULL, NULL, 'day_off', 'Szabadság', '2024-03-01 11:00:00', NULL, 0),
(19, 7, '2024-03-08', NULL, NULL, 'day_off', 'Nőnap - szabadnap', '2024-03-05 12:00:00', NULL, 0),
(20, 7, '2024-03-21', '09:00:00', '13:00:00', 'custom_hours', 'Délelőtt - köröm szakmai nap délután', '2024-03-05 12:00:00', NULL, 0),
(21, 7, '2024-04-03', NULL, NULL, 'day_off', 'Húsvéti szabadság', '2024-03-05 12:00:00', NULL, 0),
(22, 8, '2024-03-13', NULL, NULL, 'day_off', 'Betegszabadság', '2024-03-05 12:00:00', NULL, 0),
(23, 8, '2024-03-26', '13:00:00', '19:00:00', 'custom_hours', 'Délutáni műszak - reggel vizsgaidőszak', '2024-03-05 12:00:00', NULL, 0),
(24, 8, '2024-04-09', NULL, NULL, 'day_off', 'Családi program', '2024-03-05 12:00:00', NULL, 0),
(25, 9, '2024-03-16', NULL, NULL, 'day_off', 'Nemzeti ünnep utáni pihenő', '2024-03-10 13:00:00', NULL, 0),
(26, 9, '2024-03-30', NULL, NULL, 'day_off', 'Nagyszombat', '2024-03-10 13:00:00', NULL, 0),
(27, 9, '2024-04-06', '08:00:00', '14:00:00', 'custom_hours', 'Később kezdés - korábbi zárás', '2024-03-10 13:00:00', NULL, 0),
(28, 10, '2024-03-19', NULL, NULL, 'day_off', 'Fitness verseny - résztvevő', '2024-03-10 13:00:00', NULL, 0),
(29, 10, '2024-03-28', '16:00:00', '22:00:00', 'custom_hours', 'Későbbi kezdés - délelőtt szeminarium', '2024-03-10 13:00:00', NULL, 0),
(30, 10, '2024-04-11', NULL, NULL, 'day_off', 'Szabadság', '2024-03-10 13:00:00', NULL, 0),
(31, 11, '2024-03-17', NULL, NULL, 'day_off', 'Jóga retreat vezetése máshol', '2024-03-12 14:00:00', NULL, 0),
(32, 11, '2024-03-24', '14:00:00', '18:00:00', 'custom_hours', 'Csak délután - reggel meditációs workshop', '2024-03-12 14:00:00', NULL, 0),
(33, 11, '2024-04-07', NULL, NULL, 'day_off', 'Húsvéti vasárnap', '2024-03-12 14:00:00', NULL, 0),
(34, 12, '2024-03-09', NULL, NULL, 'day_off', 'Betegszabadság', '2024-03-14 15:00:00', NULL, 0),
(35, 12, '2024-03-23', '09:00:00', '14:00:00', 'custom_hours', 'Rövid műszak - délután családi program', '2024-03-14 15:00:00', NULL, 0),
(36, 12, '2024-04-04', NULL, NULL, 'day_off', 'Húsvéti csütörtök', '2024-03-14 15:00:00', NULL, 0),
(37, 13, '2024-03-15', NULL, NULL, 'day_off', 'Nemzeti ünnep', '2024-03-16 16:00:00', NULL, 0),
(38, 13, '2024-03-31', NULL, NULL, 'day_off', 'Húsvét', '2024-03-16 16:00:00', NULL, 0),
(39, 13, '2024-04-13', '12:00:00', '19:00:00', 'custom_hours', 'Későbbi kezdés - reggel barber verseny', '2024-03-16 16:00:00', NULL, 0),
(40, 14, '2024-03-10', NULL, NULL, 'day_off', 'Bio kozmetikum konferencia', '2024-03-18 17:00:00', NULL, 0),
(41, 14, '2024-03-25', '10:00:00', '14:00:00', 'custom_hours', 'Rövid műszak - délután tanfolyam', '2024-03-18 17:00:00', NULL, 0),
(42, 14, '2024-04-14', NULL, NULL, 'day_off', 'Tavaszi szabadság', '2024-03-18 17:00:00', NULL, 0),
(43, 15, '2024-03-07', NULL, NULL, 'day_off', 'Thai masszázs továbbképzés', '2024-03-20 18:00:00', NULL, 0),
(44, 15, '2024-03-29', '13:00:00', '19:00:00', 'custom_hours', 'Délutáni műszak - reggel meditációs tanfolyam', '2024-03-20 18:00:00', NULL, 0),
(45, 15, '2024-04-15', NULL, NULL, 'day_off', 'Húsvéti pihenő', '2024-03-20 18:00:00', NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `staff_services`
--

CREATE TABLE `staff_services` (
  `id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `staff_services`
--

INSERT INTO `staff_services` (`id`, `staff_id`, `service_id`, `created_at`) VALUES
(1, 1, 1, '2024-02-01 13:00:00'),
(2, 1, 2, '2024-02-01 13:00:00'),
(3, 1, 3, '2024-02-01 13:00:00'),
(4, 1, 6, '2024-02-01 13:00:00'),
(5, 2, 4, '2024-02-01 13:00:00'),
(6, 2, 5, '2024-02-01 13:00:00'),
(7, 2, 6, '2024-02-01 13:00:00'),
(8, 3, 7, '2024-02-05 13:30:00'),
(9, 3, 8, '2024-02-05 13:30:00'),
(10, 3, 10, '2024-02-05 13:30:00'),
(11, 3, 12, '2024-02-05 13:30:00'),
(12, 4, 7, '2024-02-05 13:30:00'),
(13, 4, 9, '2024-02-05 13:30:00'),
(14, 4, 10, '2024-02-05 13:30:00'),
(15, 4, 11, '2024-02-05 13:30:00'),
(16, 5, 13, '2024-02-10 14:30:00'),
(17, 5, 15, '2024-02-10 14:30:00'),
(18, 5, 16, '2024-02-10 14:30:00'),
(19, 5, 17, '2024-02-10 14:30:00'),
(20, 6, 14, '2024-02-10 14:30:00'),
(21, 6, 15, '2024-02-10 14:30:00'),
(22, 6, 16, '2024-02-10 14:30:00'),
(23, 6, 17, '2024-02-10 14:30:00'),
(24, 7, 18, '2024-02-15 15:30:00'),
(25, 7, 19, '2024-02-15 15:30:00'),
(26, 7, 20, '2024-02-15 15:30:00'),
(27, 7, 21, '2024-02-15 15:30:00'),
(28, 8, 18, '2024-02-15 15:30:00'),
(29, 8, 20, '2024-02-15 15:30:00'),
(30, 8, 21, '2024-02-15 15:30:00'),
(31, 8, 22, '2024-02-15 15:30:00'),
(32, 9, 23, '2024-02-20 16:30:00'),
(33, 9, 24, '2024-02-20 16:30:00'),
(34, 9, 26, '2024-02-20 16:30:00'),
(35, 9, 27, '2024-02-20 16:30:00'),
(36, 10, 23, '2024-02-20 16:30:00'),
(37, 10, 24, '2024-02-20 16:30:00'),
(38, 10, 25, '2024-02-20 16:30:00'),
(39, 10, 26, '2024-02-20 16:30:00'),
(40, 10, 27, '2024-02-20 16:30:00'),
(41, 11, 28, '2024-02-25 17:30:00'),
(42, 11, 29, '2024-02-25 17:30:00'),
(43, 11, 30, '2024-02-25 17:30:00'),
(44, 11, 31, '2024-02-25 17:30:00'),
(45, 11, 32, '2024-02-25 17:30:00'),
(46, 12, 33, '2024-03-01 18:30:00'),
(47, 12, 34, '2024-03-01 18:30:00'),
(48, 12, 35, '2024-03-01 18:30:00'),
(49, 12, 36, '2024-03-01 18:30:00'),
(50, 12, 37, '2024-03-01 18:30:00'),
(51, 13, 38, '2024-03-05 19:30:00'),
(52, 13, 39, '2024-03-05 19:30:00'),
(53, 13, 40, '2024-03-05 19:30:00'),
(54, 13, 41, '2024-03-05 19:30:00'),
(55, 13, 42, '2024-03-05 19:30:00'),
(56, 14, 43, '2024-03-10 20:30:00'),
(57, 14, 44, '2024-03-10 20:30:00'),
(58, 14, 45, '2024-03-10 20:30:00'),
(59, 14, 46, '2024-03-10 20:30:00'),
(60, 14, 47, '2024-03-10 20:30:00'),
(61, 15, 48, '2024-03-15 21:30:00'),
(62, 15, 49, '2024-03-15 21:30:00'),
(63, 15, 50, '2024-03-15 21:30:00'),
(64, 15, 51, '2024-03-15 21:30:00'),
(65, 15, 52, '2024-03-15 21:30:00'),
(66, 15, 53, '2024-03-15 21:30:00'),
(67, 15, 54, '2024-03-15 21:30:00');

-- --------------------------------------------------------

--
-- Table structure for table `staff_working_hours`
--

CREATE TABLE `staff_working_hours` (
  `id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `day_of_week` enum('monday','tuesday','wednesday','thursday','friday','saturday','sunday') COLLATE utf8mb4_hungarian_ci NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `is_available` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `staff_working_hours`
--

INSERT INTO `staff_working_hours` (`id`, `staff_id`, `day_of_week`, `start_time`, `end_time`, `is_available`, `created_at`, `updated_at`) VALUES
(1, 1, 'monday', '09:00:00', '17:00:00', 1, '2024-02-01 12:30:00', NULL),
(2, 1, 'tuesday', '09:00:00', '17:00:00', 1, '2024-02-01 12:30:00', NULL),
(3, 1, 'wednesday', '09:00:00', '17:00:00', 1, '2024-02-01 12:30:00', NULL),
(4, 1, 'thursday', '09:00:00', '17:00:00', 1, '2024-02-01 12:30:00', NULL),
(5, 1, 'friday', '09:00:00', '17:00:00', 1, '2024-02-01 12:30:00', NULL),
(6, 1, 'saturday', NULL, NULL, 0, '2024-02-01 12:30:00', NULL),
(7, 1, 'sunday', NULL, NULL, 0, '2024-02-01 12:30:00', NULL),
(8, 2, 'monday', NULL, NULL, 0, '2024-02-01 12:30:00', NULL),
(9, 2, 'tuesday', '10:00:00', '18:00:00', 1, '2024-02-01 12:30:00', NULL),
(10, 2, 'wednesday', '10:00:00', '18:00:00', 1, '2024-02-01 12:30:00', NULL),
(11, 2, 'thursday', '10:00:00', '18:00:00', 1, '2024-02-01 12:30:00', NULL),
(12, 2, 'friday', '10:00:00', '18:00:00', 1, '2024-02-01 12:30:00', NULL),
(13, 2, 'saturday', '10:00:00', '18:00:00', 1, '2024-02-01 12:30:00', NULL),
(14, 2, 'sunday', NULL, NULL, 0, '2024-02-01 12:30:00', NULL),
(15, 3, 'monday', '09:00:00', '17:00:00', 1, '2024-02-05 13:30:00', NULL),
(16, 3, 'tuesday', '09:00:00', '17:00:00', 1, '2024-02-05 13:30:00', NULL),
(17, 3, 'wednesday', '09:00:00', '17:00:00', 1, '2024-02-05 13:30:00', NULL),
(18, 3, 'thursday', '09:00:00', '17:00:00', 1, '2024-02-05 13:30:00', NULL),
(19, 3, 'friday', '09:00:00', '17:00:00', 1, '2024-02-05 13:30:00', NULL),
(20, 3, 'saturday', NULL, NULL, 0, '2024-02-05 13:30:00', NULL),
(21, 3, 'sunday', NULL, NULL, 0, '2024-02-05 13:30:00', NULL),
(22, 4, 'monday', NULL, NULL, 0, '2024-02-05 13:30:00', NULL),
(23, 4, 'tuesday', '12:00:00', '20:00:00', 1, '2024-02-05 13:30:00', NULL),
(24, 4, 'wednesday', '08:00:00', '16:00:00', 1, '2024-02-05 13:30:00', NULL),
(25, 4, 'thursday', '12:00:00', '20:00:00', 1, '2024-02-05 13:30:00', NULL),
(26, 4, 'friday', '08:00:00', '16:00:00', 1, '2024-02-05 13:30:00', NULL),
(27, 4, 'saturday', '08:00:00', '16:00:00', 1, '2024-02-05 13:30:00', NULL),
(28, 4, 'sunday', NULL, NULL, 0, '2024-02-05 13:30:00', NULL),
(29, 5, 'monday', '10:00:00', '18:00:00', 1, '2024-02-10 14:30:00', NULL),
(30, 5, 'tuesday', '10:00:00', '18:00:00', 1, '2024-02-10 14:30:00', NULL),
(31, 5, 'wednesday', '10:00:00', '18:00:00', 1, '2024-02-10 14:30:00', NULL),
(32, 5, 'thursday', '10:00:00', '18:00:00', 1, '2024-02-10 14:30:00', NULL),
(33, 5, 'friday', '10:00:00', '18:00:00', 1, '2024-02-10 14:30:00', NULL),
(34, 5, 'saturday', '09:00:00', '14:00:00', 1, '2024-02-10 14:30:00', NULL),
(35, 5, 'sunday', NULL, NULL, 0, '2024-02-10 14:30:00', NULL),
(36, 6, 'monday', NULL, NULL, 0, '2024-02-10 14:30:00', NULL),
(37, 6, 'tuesday', '11:00:00', '19:00:00', 1, '2024-02-10 14:30:00', NULL),
(38, 6, 'wednesday', '11:00:00', '19:00:00', 1, '2024-02-10 14:30:00', NULL),
(39, 6, 'thursday', '11:00:00', '19:00:00', 1, '2024-02-10 14:30:00', NULL),
(40, 6, 'friday', '11:00:00', '19:00:00', 1, '2024-02-10 14:30:00', NULL),
(41, 6, 'saturday', '11:00:00', '19:00:00', 1, '2024-02-10 14:30:00', NULL),
(42, 6, 'sunday', NULL, NULL, 0, '2024-02-10 14:30:00', NULL),
(43, 7, 'monday', '09:00:00', '18:00:00', 1, '2024-02-15 15:30:00', NULL),
(44, 7, 'tuesday', '09:00:00', '18:00:00', 1, '2024-02-15 15:30:00', NULL),
(45, 7, 'wednesday', '09:00:00', '18:00:00', 1, '2024-02-15 15:30:00', NULL),
(46, 7, 'thursday', '09:00:00', '18:00:00', 1, '2024-02-15 15:30:00', NULL),
(47, 7, 'friday', '09:00:00', '18:00:00', 1, '2024-02-15 15:30:00', NULL),
(48, 7, 'saturday', '09:00:00', '15:00:00', 1, '2024-02-15 15:30:00', NULL),
(49, 7, 'sunday', NULL, NULL, 0, '2024-02-15 15:30:00', NULL),
(50, 8, 'monday', NULL, NULL, 0, '2024-02-15 15:30:00', NULL),
(51, 8, 'tuesday', '10:00:00', '19:00:00', 1, '2024-02-15 15:30:00', NULL),
(52, 8, 'wednesday', '10:00:00', '19:00:00', 1, '2024-02-15 15:30:00', NULL),
(53, 8, 'thursday', '10:00:00', '19:00:00', 1, '2024-02-15 15:30:00', NULL),
(54, 8, 'friday', '10:00:00', '19:00:00', 1, '2024-02-15 15:30:00', NULL),
(55, 8, 'saturday', '10:00:00', '19:00:00', 1, '2024-02-15 15:30:00', NULL),
(56, 8, 'sunday', NULL, NULL, 0, '2024-02-15 15:30:00', NULL),
(57, 9, 'monday', '06:00:00', '14:00:00', 1, '2024-02-20 16:30:00', NULL),
(58, 9, 'tuesday', '06:00:00', '14:00:00', 1, '2024-02-20 16:30:00', NULL),
(59, 9, 'wednesday', '06:00:00', '14:00:00', 1, '2024-02-20 16:30:00', NULL),
(60, 9, 'thursday', '06:00:00', '14:00:00', 1, '2024-02-20 16:30:00', NULL),
(61, 9, 'friday', '06:00:00', '14:00:00', 1, '2024-02-20 16:30:00', NULL),
(62, 9, 'saturday', NULL, NULL, 0, '2024-02-20 16:30:00', NULL),
(63, 9, 'sunday', NULL, NULL, 0, '2024-02-20 16:30:00', NULL),
(64, 10, 'monday', '14:00:00', '22:00:00', 1, '2024-02-20 16:30:00', NULL),
(65, 10, 'tuesday', '14:00:00', '22:00:00', 1, '2024-02-20 16:30:00', NULL),
(66, 10, 'wednesday', '14:00:00', '22:00:00', 1, '2024-02-20 16:30:00', NULL),
(67, 10, 'thursday', '14:00:00', '22:00:00', 1, '2024-02-20 16:30:00', NULL),
(68, 10, 'friday', '14:00:00', '22:00:00', 1, '2024-02-20 16:30:00', NULL),
(69, 10, 'saturday', '08:00:00', '16:00:00', 1, '2024-02-20 16:30:00', NULL),
(70, 10, 'sunday', NULL, NULL, 0, '2024-02-20 16:30:00', NULL),
(71, 11, 'monday', NULL, NULL, 0, '2024-02-25 17:30:00', NULL),
(72, 11, 'tuesday', NULL, NULL, 0, '2024-02-25 17:30:00', NULL),
(73, 11, 'wednesday', '10:00:00', '18:00:00', 1, '2024-02-25 17:30:00', NULL),
(74, 11, 'thursday', '10:00:00', '18:00:00', 1, '2024-02-25 17:30:00', NULL),
(75, 11, 'friday', '10:00:00', '18:00:00', 1, '2024-02-25 17:30:00', NULL),
(76, 11, 'saturday', '10:00:00', '18:00:00', 1, '2024-02-25 17:30:00', NULL),
(77, 11, 'sunday', '10:00:00', '18:00:00', 1, '2024-02-25 17:30:00', NULL),
(78, 12, 'monday', '09:00:00', '18:00:00', 1, '2024-03-01 18:30:00', NULL),
(79, 12, 'tuesday', '09:00:00', '18:00:00', 1, '2024-03-01 18:30:00', NULL),
(80, 12, 'wednesday', '09:00:00', '18:00:00', 1, '2024-03-01 18:30:00', NULL),
(81, 12, 'thursday', '09:00:00', '18:00:00', 1, '2024-03-01 18:30:00', NULL),
(82, 12, 'friday', '09:00:00', '18:00:00', 1, '2024-03-01 18:30:00', NULL),
(83, 12, 'saturday', '10:00:00', '15:00:00', 1, '2024-03-01 18:30:00', NULL),
(84, 12, 'sunday', NULL, NULL, 0, '2024-03-01 18:30:00', NULL),
(85, 13, 'monday', NULL, NULL, 0, '2024-03-05 19:30:00', NULL),
(86, 13, 'tuesday', '10:00:00', '19:00:00', 1, '2024-03-05 19:30:00', NULL),
(87, 13, 'wednesday', '10:00:00', '19:00:00', 1, '2024-03-05 19:30:00', NULL),
(88, 13, 'thursday', '10:00:00', '19:00:00', 1, '2024-03-05 19:30:00', NULL),
(89, 13, 'friday', '10:00:00', '19:00:00', 1, '2024-03-05 19:30:00', NULL),
(90, 13, 'saturday', '10:00:00', '19:00:00', 1, '2024-03-05 19:30:00', NULL),
(91, 13, 'sunday', NULL, NULL, 0, '2024-03-05 19:30:00', NULL),
(92, 14, 'monday', '10:00:00', '18:00:00', 1, '2024-03-10 20:30:00', NULL),
(93, 14, 'tuesday', '10:00:00', '18:00:00', 1, '2024-03-10 20:30:00', NULL),
(94, 14, 'wednesday', '10:00:00', '18:00:00', 1, '2024-03-10 20:30:00', NULL),
(95, 14, 'thursday', '10:00:00', '18:00:00', 1, '2024-03-10 20:30:00', NULL),
(96, 14, 'friday', '10:00:00', '18:00:00', 1, '2024-03-10 20:30:00', NULL),
(97, 14, 'saturday', NULL, NULL, 0, '2024-03-10 20:30:00', NULL),
(98, 14, 'sunday', NULL, NULL, 0, '2024-03-10 20:30:00', NULL),
(99, 15, 'monday', '11:00:00', '19:00:00', 1, '2024-03-15 21:30:00', NULL),
(100, 15, 'tuesday', '11:00:00', '19:00:00', 1, '2024-03-15 21:30:00', NULL),
(101, 15, 'wednesday', '11:00:00', '19:00:00', 1, '2024-03-15 21:30:00', NULL),
(102, 15, 'thursday', '11:00:00', '19:00:00', 1, '2024-03-15 21:30:00', NULL),
(103, 15, 'friday', '11:00:00', '19:00:00', 1, '2024-03-15 21:30:00', NULL),
(104, 15, 'saturday', '11:00:00', '19:00:00', 1, '2024-03-15 21:30:00', NULL),
(105, 15, 'sunday', NULL, NULL, 0, '2024-03-15 21:30:00', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `temporary_closed_periods`
--

CREATE TABLE `temporary_closed_periods` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `open_time` time DEFAULT NULL,
  `close_time` time DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `temporary_closed_periods`
--

INSERT INTO `temporary_closed_periods` (`id`, `company_id`, `start_date`, `end_date`, `open_time`, `close_time`, `created_at`, `updated_at`) VALUES
(1, 1, '2024-03-29', '2024-04-01', NULL, NULL, '2024-02-15 09:00:00', NULL),
(2, 1, '2024-05-01', '2024-05-01', NULL, NULL, '2024-03-20 10:00:00', NULL),
(3, 1, '2024-07-15', '2024-07-28', NULL, NULL, '2024-05-10 12:00:00', NULL),
(4, 1, '2024-12-24', '2024-12-26', NULL, NULL, '2024-10-01 08:00:00', NULL),
(5, 1, '2024-12-31', '2024-12-31', '09:00:00', '14:00:00', '2024-10-01 08:00:00', NULL),
(6, 2, '2024-03-28', '2024-04-02', NULL, NULL, '2024-02-20 10:00:00', NULL),
(7, 2, '2024-05-01', '2024-05-01', NULL, NULL, '2024-03-25 11:00:00', NULL),
(8, 2, '2024-08-01', '2024-08-14', NULL, NULL, '2024-06-01 13:00:00', NULL),
(9, 2, '2024-12-23', '2024-12-27', NULL, NULL, '2024-10-05 09:00:00', NULL),
(10, 2, '2024-12-31', '2024-12-31', '10:00:00', '15:00:00', '2024-10-05 09:00:00', NULL),
(11, 3, '2024-03-29', '2024-04-01', NULL, NULL, '2024-02-25 11:00:00', NULL),
(12, 3, '2024-05-01', '2024-05-01', NULL, NULL, '2024-03-30 12:00:00', NULL),
(13, 3, '2024-08-05', '2024-08-18', NULL, NULL, '2024-06-10 14:00:00', NULL),
(14, 3, '2024-12-24', '2024-12-25', NULL, NULL, '2024-10-10 10:00:00', NULL),
(15, 3, '2024-12-31', '2024-12-31', '08:00:00', '13:00:00', '2024-10-10 10:00:00', NULL),
(16, 4, '2024-03-29', '2024-04-01', NULL, NULL, '2024-03-01 12:00:00', NULL),
(17, 4, '2024-05-01', '2024-05-01', NULL, NULL, '2024-04-01 12:00:00', NULL),
(18, 4, '2024-08-01', '2024-08-10', NULL, NULL, '2024-06-15 15:00:00', NULL),
(19, 4, '2024-12-24', '2024-12-26', NULL, NULL, '2024-10-15 11:00:00', NULL),
(20, 4, '2024-12-31', '2025-01-01', NULL, NULL, '2024-10-15 11:00:00', NULL),
(21, 5, '2024-03-31', '2024-04-01', NULL, NULL, '2024-03-05 13:00:00', NULL),
(22, 5, '2024-05-01', '2024-05-01', NULL, NULL, '2024-04-05 13:00:00', NULL),
(23, 5, '2024-12-25', '2024-12-25', NULL, NULL, '2024-10-20 12:00:00', NULL),
(24, 5, '2025-01-01', '2025-01-01', NULL, NULL, '2024-10-20 12:00:00', NULL),
(25, 1, '2024-03-29', '2024-04-01', NULL, NULL, '2024-02-15 09:00:00', NULL),
(26, 1, '2024-05-01', '2024-05-01', NULL, NULL, '2024-03-20 10:00:00', NULL),
(27, 1, '2024-07-15', '2024-07-28', NULL, NULL, '2024-05-10 12:00:00', NULL),
(28, 1, '2024-12-24', '2024-12-26', NULL, NULL, '2024-10-01 08:00:00', NULL),
(29, 1, '2024-12-31', '2024-12-31', '09:00:00', '14:00:00', '2024-10-01 08:00:00', NULL),
(30, 2, '2024-03-28', '2024-04-02', NULL, NULL, '2024-02-20 10:00:00', NULL),
(31, 2, '2024-05-01', '2024-05-01', NULL, NULL, '2024-03-25 11:00:00', NULL),
(32, 2, '2024-08-01', '2024-08-14', NULL, NULL, '2024-06-01 13:00:00', NULL),
(33, 2, '2024-12-23', '2024-12-27', NULL, NULL, '2024-10-05 09:00:00', NULL),
(34, 2, '2024-12-31', '2024-12-31', '10:00:00', '15:00:00', '2024-10-05 09:00:00', NULL),
(35, 3, '2024-03-29', '2024-04-01', NULL, NULL, '2024-02-25 11:00:00', NULL),
(36, 3, '2024-05-01', '2024-05-01', NULL, NULL, '2024-03-30 12:00:00', NULL),
(37, 3, '2024-08-05', '2024-08-18', NULL, NULL, '2024-06-10 14:00:00', NULL),
(38, 3, '2024-12-24', '2024-12-25', NULL, NULL, '2024-10-10 10:00:00', NULL),
(39, 3, '2024-12-31', '2024-12-31', '08:00:00', '13:00:00', '2024-10-10 10:00:00', NULL),
(40, 4, '2024-03-29', '2024-04-01', NULL, NULL, '2024-03-01 12:00:00', NULL),
(41, 4, '2024-05-01', '2024-05-01', NULL, NULL, '2024-04-01 12:00:00', NULL),
(42, 4, '2024-08-01', '2024-08-10', NULL, NULL, '2024-06-15 15:00:00', NULL),
(43, 4, '2024-12-24', '2024-12-26', NULL, NULL, '2024-10-15 11:00:00', NULL),
(44, 4, '2024-12-31', '2025-01-01', NULL, NULL, '2024-10-15 11:00:00', NULL),
(45, 5, '2024-03-31', '2024-04-01', NULL, NULL, '2024-03-05 13:00:00', NULL),
(46, 5, '2024-05-01', '2024-05-01', NULL, NULL, '2024-04-05 13:00:00', NULL),
(47, 5, '2024-12-25', '2024-12-25', NULL, NULL, '2024-10-20 12:00:00', NULL),
(48, 5, '2025-01-01', '2025-01-01', NULL, NULL, '2024-10-20 12:00:00', NULL),
(49, 6, '2024-03-29', '2024-04-01', NULL, NULL, '2024-03-10 14:00:00', NULL),
(50, 6, '2024-05-01', '2024-05-01', NULL, NULL, '2024-04-10 14:00:00', NULL),
(51, 6, '2024-08-10', '2024-08-23', NULL, NULL, '2024-06-20 16:00:00', NULL),
(52, 6, '2024-12-24', '2024-12-26', NULL, NULL, '2024-10-25 13:00:00', NULL),
(53, 7, '2024-03-29', '2024-04-01', NULL, NULL, '2024-03-12 15:00:00', NULL),
(54, 7, '2024-05-01', '2024-05-01', NULL, NULL, '2024-04-12 15:00:00', NULL),
(55, 7, '2024-07-01', '2024-07-31', NULL, NULL, '2024-05-20 17:00:00', NULL),
(56, 7, '2024-12-22', '2025-01-05', NULL, NULL, '2024-10-30 15:00:00', NULL),
(57, 8, '2024-03-31', '2024-04-01', NULL, NULL, '2024-03-15 16:00:00', NULL),
(58, 8, '2024-05-01', '2024-05-01', NULL, NULL, '2024-04-15 16:00:00', NULL),
(59, 8, '2024-08-05', '2024-08-18', NULL, NULL, '2024-06-25 18:00:00', NULL),
(60, 8, '2024-12-24', '2024-12-25', NULL, NULL, '2024-11-01 16:00:00', NULL),
(61, 8, '2024-12-31', '2024-12-31', '09:00:00', '14:00:00', '2024-11-01 16:00:00', NULL),
(62, 9, '2024-03-29', '2024-04-01', NULL, NULL, '2024-03-18 17:00:00', NULL),
(63, 9, '2024-05-01', '2024-05-01', NULL, NULL, '2024-04-18 17:00:00', NULL),
(64, 9, '2024-08-01', '2024-08-14', NULL, NULL, '2024-06-30 19:00:00', NULL),
(65, 9, '2024-12-24', '2024-12-26', NULL, NULL, '2024-11-05 17:00:00', NULL),
(66, 10, '2024-03-29', '2024-04-01', NULL, NULL, '2024-03-20 18:00:00', NULL),
(67, 10, '2024-05-01', '2024-05-01', NULL, NULL, '2024-04-20 18:00:00', NULL),
(68, 10, '2024-08-15', '2024-08-30', NULL, NULL, '2024-07-01 20:00:00', NULL),
(69, 10, '2024-12-24', '2024-12-26', NULL, NULL, '2024-11-10 18:00:00', NULL),
(70, 10, '2024-12-31', '2025-01-02', NULL, NULL, '2024-11-10 18:00:00', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tokens`
--

CREATE TABLE `tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(500) COLLATE utf8mb4_hungarian_ci NOT NULL,
  `type` varchar(100) COLLATE utf8mb4_hungarian_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_revoked` tinyint(1) DEFAULT '0',
  `revoked_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `tokens`
--

INSERT INTO `tokens` (`id`, `user_id`, `token`, `type`, `expires_at`, `is_revoked`, `revoked_at`, `created_at`) VALUES
(1, 41, '2167128bbb99cb495237b30503044763', 'email_verify', '2026-01-18 18:19:35', 1, '2026-01-17 18:36:57', '2026-01-17 18:19:35');

-- --------------------------------------------------------

--
-- Table structure for table `two_factor_recovery_codes`
--

CREATE TABLE `two_factor_recovery_codes` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `code` varchar(64) COLLATE utf8mb4_hungarian_ci NOT NULL COMMENT 'Hashed recovery code',
  `used_at` datetime DEFAULT NULL,
  `is_used` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `guid` char(36) COLLATE utf8mb4_hungarian_ci NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_hungarian_ci NOT NULL,
  `password` text COLLATE utf8mb4_hungarian_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_hungarian_ci NOT NULL,
  `company_id` int(11) DEFAULT NULL COMMENT 'NULL for superadmins or independent clients',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `last_login` datetime DEFAULT NULL,
  `register_finished_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Admins can deactivate users',
  `two_factor_enabled` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Whether 2FA is enabled',
  `two_factor_secret` varchar(32) COLLATE utf8mb4_hungarian_ci DEFAULT NULL COMMENT 'TOTP secret key (encrypted)',
  `two_factor_confirmed_at` datetime DEFAULT NULL COMMENT 'When 2FA was confirmed/activated',
  `two_factor_recovery_codes` longtext COLLATE utf8mb4_hungarian_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `guid`, `first_name`, `last_name`, `email`, `password`, `phone`, `company_id`, `created_at`, `updated_at`, `deleted_at`, `is_deleted`, `last_login`, `register_finished_at`, `is_active`, `two_factor_enabled`, `two_factor_secret`, `two_factor_confirmed_at`, `two_factor_recovery_codes`) VALUES
(1, '390fde34-f069-11f0-bb19-94e23c940cf4', 'Admin', 'Rendszer', 'admin@bookr.hu', '$2y$10$abcdefghijklmnopqrstuv', '+36301111111', NULL, '2024-01-15 10:00:00', NULL, NULL, 0, NULL, '2024-01-15 10:00:00', 1, 0, NULL, NULL, NULL),
(2, '3915b990-f069-11f0-bb19-94e23c940cf4', 'Kovács', 'Anna', 'anna.kovacs@szepseg.hu', '$2y$10$hash1', '+36301234501', 1, '2024-02-01 09:00:00', '2024-02-01 10:00:00', NULL, 0, NULL, '2024-02-01 09:00:00', 1, 0, NULL, NULL, NULL),
(3, '3915c0e4-f069-11f0-bb19-94e23c940cf4', 'Nagy', 'Péter', 'peter.nagy@wellness.hu', '$2y$10$hash2', '+36301234502', 2, '2024-02-05 10:00:00', '2024-02-05 11:00:00', NULL, 0, NULL, '2024-02-05 10:00:00', 1, 0, NULL, NULL, NULL),
(4, '3915c388-f069-11f0-bb19-94e23c940cf4', 'Szabó', 'Eszter', 'eszter.szabo@fodrasz.hu', '$2y$10$hash3', '+36301234503', 3, '2024-02-10 11:00:00', '2024-02-10 12:00:00', NULL, 0, NULL, '2024-02-10 11:00:00', 1, 0, NULL, NULL, NULL),
(5, '3915c4f5-f069-11f0-bb19-94e23c940cf4', 'Tóth', 'Márton', 'marton.toth@nails.hu', '$2y$10$hash4', '+36301234504', 4, '2024-02-15 12:00:00', '2024-02-15 13:00:00', NULL, 0, NULL, '2024-02-15 12:00:00', 1, 0, NULL, NULL, NULL),
(6, '3915c64a-f069-11f0-bb19-94e23c940cf4', 'Varga', 'Katalin', 'katalin.varga@fitness.hu', '$2y$10$hash5', '+36301234505', 5, '2024-02-20 13:00:00', '2024-02-20 14:00:00', NULL, 0, NULL, '2024-02-20 13:00:00', 1, 0, NULL, NULL, NULL),
(7, '3915c78b-f069-11f0-bb19-94e23c940cf4', 'Horváth', 'László', 'laszlo.horvath@yoga.hu', '$2y$10$hash6', '+36301234506', 6, '2024-02-25 14:00:00', '2024-02-25 15:00:00', NULL, 0, NULL, '2024-02-25 14:00:00', 1, 0, NULL, NULL, NULL),
(8, '3915c8cc-f069-11f0-bb19-94e23c940cf4', 'Kiss', 'Mónika', 'monika.kiss@massage.hu', '$2y$10$hash7', '+36301234507', 7, '2024-03-01 15:00:00', '2024-03-01 16:00:00', NULL, 0, NULL, '2024-03-01 15:00:00', 1, 0, NULL, NULL, NULL),
(9, '3915cd0c-f069-11f0-bb19-94e23c940cf4', 'Molnár', 'Gábor', 'gabor.molnar@barber.hu', '$2y$10$hash8', '+36301234508', 8, '2024-03-05 16:00:00', '2024-03-05 17:00:00', NULL, 0, NULL, '2024-03-05 16:00:00', 1, 0, NULL, NULL, NULL),
(10, '3915cec7-f069-11f0-bb19-94e23c940cf4', 'Farkas', 'Judit', 'judit.farkas@beauty.hu', '$2y$10$hash9', '+36301234509', 9, '2024-03-10 17:00:00', '2024-03-10 18:00:00', NULL, 0, NULL, '2024-03-10 17:00:00', 1, 0, NULL, NULL, NULL),
(11, '3915d0c2-f069-11f0-bb19-94e23c940cf4', 'Balogh', 'Tamás', 'tamas.balogh@spa.hu', '$2y$10$hash10', '+36301234510', 10, '2024-03-15 18:00:00', '2024-03-15 19:00:00', NULL, 0, NULL, '2024-03-15 18:00:00', 1, 0, NULL, NULL, NULL),
(12, '391b3432-f069-11f0-bb19-94e23c940cf4', 'Lukács', 'Réka', 'reka.lukacs@staff.hu', '$2y$10$staff1', '+36302345601', 1, '2024-02-02 09:00:00', '2024-02-02 10:00:00', NULL, 0, NULL, '2024-02-02 09:00:00', 1, 0, NULL, NULL, NULL),
(13, '391ebe24-f069-11f0-bb19-94e23c940cf4', 'Papp', 'Nikolett', 'nikolett.papp@staff.hu', '$2y$10$staff2', '+36302345602', 1, '2024-02-02 10:00:00', '2024-02-02 11:00:00', NULL, 0, NULL, '2024-02-02 10:00:00', 1, 0, NULL, NULL, NULL),
(14, '391ec2f9-f069-11f0-bb19-94e23c940cf4', 'Simon', 'Dóra', 'dora.simon@staff.hu', '$2y$10$staff3', '+36302345603', 2, '2024-02-02 11:00:00', '2024-02-06 10:00:00', NULL, 0, NULL, '2024-02-02 11:00:00', 1, 0, NULL, NULL, NULL),
(15, '391ec4f4-f069-11f0-bb19-94e23c940cf4', 'Takács', 'Beáta', 'beata.takacs@staff.hu', '$2y$10$staff4', '+36302345604', 2, '2024-02-06 09:00:00', '2024-02-06 11:00:00', NULL, 0, NULL, '2024-02-06 09:00:00', 1, 0, NULL, NULL, NULL),
(16, '391ec642-f069-11f0-bb19-94e23c940cf4', 'Németh', 'Zsuzsanna', 'zsuzsanna.nemeth@staff.hu', '$2y$10$staff5', '+36302345605', 3, '2024-02-06 10:00:00', '2024-02-11 10:00:00', NULL, 0, NULL, '2024-02-06 10:00:00', 1, 0, NULL, NULL, NULL),
(17, '391ec741-f069-11f0-bb19-94e23c940cf4', 'Lakatos', 'Andrea', 'andrea.lakatos@staff.hu', '$2y$10$staff6', '+36302345606', 3, '2024-02-06 11:00:00', '2024-02-11 11:00:00', NULL, 0, NULL, '2024-02-06 11:00:00', 1, 0, NULL, NULL, NULL),
(18, '391ec822-f069-11f0-bb19-94e23c940cf4', 'Juhász', 'Vivien', 'vivien.juhasz@staff.hu', '$2y$10$staff7', '+36302345607', 4, '2024-02-11 09:00:00', '2024-02-16 10:00:00', NULL, 0, NULL, '2024-02-11 09:00:00', 1, 0, NULL, NULL, NULL),
(19, '391ec906-f069-11f0-bb19-94e23c940cf4', 'Mészáros', 'Petra', 'petra.meszaros@staff.hu', '$2y$10$staff8', '+36302345608', 4, '2024-02-11 10:00:00', '2024-02-16 11:00:00', NULL, 0, NULL, '2024-02-11 10:00:00', 1, 0, NULL, NULL, NULL),
(20, '391ec9dd-f069-11f0-bb19-94e23c940cf4', 'Fekete', 'Noémi', 'noemi.fekete@staff.hu', '$2y$10$staff9', '+36302345609', 5, '2024-02-11 11:00:00', '2024-02-21 10:00:00', NULL, 0, NULL, '2024-02-11 11:00:00', 1, 0, NULL, NULL, NULL),
(21, '391ecab8-f069-11f0-bb19-94e23c940cf4', 'Bodnár', 'Krisztina', 'krisztina.bodnar@staff.hu', '$2y$10$staff10', '+36302345610', 5, '2024-02-16 09:00:00', '2024-02-21 11:00:00', NULL, 0, NULL, '2024-02-16 09:00:00', 1, 0, NULL, NULL, NULL),
(22, '391ecb94-f069-11f0-bb19-94e23c940cf4', 'Rácz', 'Melinda', 'melinda.racz@staff.hu', '$2y$10$staff11', '+36302345611', 6, '2024-02-16 10:00:00', '2024-02-26 10:00:00', NULL, 0, NULL, '2024-02-16 10:00:00', 1, 0, NULL, NULL, NULL),
(23, '391ecc6d-f069-11f0-bb19-94e23c940cf4', 'Szilágyi', 'Bence', 'bence.szilagyi@staff.hu', '$2y$10$staff12', '+36302345612', 7, '2024-02-21 09:00:00', '2024-03-01 10:00:00', NULL, 0, NULL, '2024-02-21 09:00:00', 1, 0, NULL, NULL, NULL),
(24, '391ecd40-f069-11f0-bb19-94e23c940cf4', 'Kovács', 'Dániel', 'daniel.kovacs@staff.hu', '$2y$10$staff13', '+36302345613', 8, '2024-02-21 10:00:00', '2024-03-05 10:00:00', NULL, 0, NULL, '2024-02-21 10:00:00', 1, 0, NULL, NULL, NULL),
(25, '391ece17-f069-11f0-bb19-94e23c940cf4', 'Nagy', 'Roland', 'roland.nagy@staff.hu', '$2y$10$staff14', '+36302345614', 9, '2024-02-21 11:00:00', '2024-03-10 10:00:00', NULL, 0, NULL, '2024-02-21 11:00:00', 1, 0, NULL, NULL, NULL),
(26, '391eceef-f069-11f0-bb19-94e23c940cf4', 'Barta', 'Lilla', 'lilla.barta@staff.hu', '$2y$10$staff15', '+36302345615', 10, '2024-02-26 09:00:00', '2024-03-15 10:00:00', NULL, 0, NULL, '2024-02-26 09:00:00', 1, 0, NULL, NULL, NULL),
(27, '39221d73-f069-11f0-bb19-94e23c940cf4', 'Kovács', 'János', 'janos.kovacs@gmail.com', '$2y$10$client1', '+36203456701', NULL, '2024-03-20 10:00:00', NULL, NULL, 0, NULL, '2024-03-20 10:00:00', 1, 0, NULL, NULL, NULL),
(28, '39222174-f069-11f0-bb19-94e23c940cf4', 'Nagy', 'Éva', 'eva.nagy@gmail.com', '$2y$10$client2', '+36203456702', NULL, '2024-03-21 11:00:00', NULL, NULL, 0, NULL, '2024-03-21 11:00:00', 1, 0, NULL, NULL, NULL),
(29, '392222b5-f069-11f0-bb19-94e23c940cf4', 'Szabó', 'Gergő', 'gergo.szabo@gmail.com', '$2y$10$client3', '+36203456703', NULL, '2024-03-22 12:00:00', NULL, NULL, 0, NULL, '2024-03-22 12:00:00', 1, 0, NULL, NULL, NULL),
(30, '392223b1-f069-11f0-bb19-94e23c940cf4', 'Tóth', 'Klaudia', 'klaudia.toth@freemail.hu', '$2y$10$client4', '+36203456704', NULL, '2024-03-23 13:00:00', NULL, NULL, 0, NULL, '2024-03-23 13:00:00', 1, 0, NULL, NULL, NULL),
(31, '39222481-f069-11f0-bb19-94e23c940cf4', 'Varga', 'Zsolt', 'zsolt.varga@citromail.hu', '$2y$10$client5', '+36203456705', NULL, '2024-03-24 14:00:00', NULL, NULL, 0, NULL, '2024-03-24 14:00:00', 1, 0, NULL, NULL, NULL),
(32, '39222545-f069-11f0-bb19-94e23c940cf4', 'Horváth', 'Barbara', 'barbara.horvath@gmail.com', '$2y$10$client6', '+36203456706', NULL, '2024-03-25 15:00:00', NULL, NULL, 0, NULL, '2024-03-25 15:00:00', 1, 0, NULL, NULL, NULL),
(33, '39222606-f069-11f0-bb19-94e23c940cf4', 'Kiss', 'Márk', 'mark.kiss@yahoo.com', '$2y$10$client7', '+36203456707', NULL, '2024-03-26 16:00:00', NULL, NULL, 0, NULL, '2024-03-26 16:00:00', 1, 0, NULL, NULL, NULL),
(34, '392226c5-f069-11f0-bb19-94e23c940cf4', 'Molnár', 'Linda', 'linda.molnar@outlook.com', '$2y$10$client8', '+36203456708', NULL, '2024-03-27 17:00:00', NULL, NULL, 0, NULL, '2024-03-27 17:00:00', 1, 0, NULL, NULL, NULL),
(35, '39222791-f069-11f0-bb19-94e23c940cf4', 'Farkas', 'Dávid', 'david.farkas@gmail.com', '$2y$10$client9', '+36203456709', NULL, '2024-03-28 18:00:00', NULL, NULL, 0, NULL, '2024-03-28 18:00:00', 1, 0, NULL, NULL, NULL),
(36, '392228e7-f069-11f0-bb19-94e23c940cf4', 'Balogh', 'Csilla', 'csilla.balogh@freemail.hu', '$2y$10$client10', '+36203456710', NULL, '2024-03-29 19:00:00', NULL, NULL, 0, NULL, '2024-03-29 19:00:00', 1, 0, NULL, NULL, NULL),
(37, '39222a2c-f069-11f0-bb19-94e23c940cf4', 'Lukács', 'Tamás', 'tamas.lukacs@gmail.com', '$2y$10$client11', '+36203456711', NULL, '2024-03-30 10:00:00', NULL, NULL, 0, NULL, '2024-03-30 10:00:00', 1, 0, NULL, NULL, NULL),
(38, '39222b04-f069-11f0-bb19-94e23c940cf4', 'Papp', 'Bernadett', 'bernadett.papp@citromail.hu', '$2y$10$client12', '+36203456712', NULL, '2024-03-31 11:00:00', NULL, NULL, 0, NULL, '2024-03-31 11:00:00', 1, 0, NULL, NULL, NULL),
(39, '39222bc4-f069-11f0-bb19-94e23c940cf4', 'Simon', 'Balázs', 'balazs.simon@yahoo.com', '$2y$10$client13', '+36203456713', NULL, '2024-04-01 12:00:00', NULL, NULL, 0, NULL, '2024-04-01 12:00:00', 1, 0, NULL, NULL, NULL),
(40, '39222c81-f069-11f0-bb19-94e23c940cf4', 'Takács', 'Nikoletta', 'nikoletta.takacs@gmail.com', '$2y$10$client14', '+36203456714', NULL, '2024-04-02 13:00:00', NULL, NULL, 0, NULL, '2024-04-02 13:00:00', 1, 0, NULL, NULL, NULL),
(41, 'b1f05ffe-f3c8-11f0-9e1f-41a67f8a3877', 'Admin', 'Admin', 'admin@admin.hu', '$argon2id$v=19$m=65536,t=3,p=1$LLsNAuCcRNfRp7IRoTHZ3Q$9HKsULfkadqFiGugB7h094MFOuCTBwyO9VULnDtb2ok', '+3670123252', NULL, '2026-01-17 18:19:35', '2026-01-17 18:36:57', NULL, 0, '2026-01-18 21:47:27', '2026-01-17 18:36:57', 1, 0, NULL, NULL, NULL);

--
-- Triggers `users`
--
DELIMITER $$
CREATE TRIGGER `after_user_update_audit` AFTER UPDATE ON `users` FOR EACH ROW BEGIN
    DECLARE userRole VARCHAR(50);
    
    -- Ha soft delete történt
    IF NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE THEN
        -- User role lekérése
        SELECT r.name INTO userRole
        FROM user_x_role uxr
        INNER JOIN roles r ON uxr.role_id = r.id
        WHERE uxr.user_id = NEW.id
          AND uxr.is_un_assigned = FALSE
        LIMIT 1;
        
        -- Audit log bejegyzés
        INSERT INTO `audit_logs` (
            `performed_by_user_id`,
            `performed_by_role`,
            `affected_user_id`,
            `company_id`,
            `email`,
            `entity_type`,
            `action`,
            `old_values`,
            `new_values`,
            `created_at`
        )
        VALUES (
            NEW.id,  -- Magát törölte (vagy egy admin, de azt nem tudjuk)
            userRole,
            NEW.id,
            NEW.company_id,
            NEW.email,
            'user',
            'soft_delete',
            JSON_OBJECT('is_deleted', OLD.is_deleted),
            JSON_OBJECT('is_deleted', NEW.is_deleted, 'deleted_at', NEW.deleted_at),
            NOW()
        );
    END IF;
    
    -- Ha deaktiválás történt
    IF NEW.is_active = FALSE AND OLD.is_active = TRUE THEN
        SELECT r.name INTO userRole
        FROM user_x_role uxr
        INNER JOIN roles r ON uxr.role_id = r.id
        WHERE uxr.user_id = NEW.id
          AND uxr.is_un_assigned = FALSE
        LIMIT 1;
        
        INSERT INTO `audit_logs` (
            `performed_by_user_id`,
            `performed_by_role`,
            `affected_user_id`,
            `company_id`,
            `email`,
            `entity_type`,
            `action`,
            `old_values`,
            `new_values`,
            `created_at`
        )
        VALUES (
            NEW.id,
            userRole,
            NEW.id,
            NEW.company_id,
            NEW.email,
            'user',
            'deactivate',
            JSON_OBJECT('is_active', OLD.is_active),
            JSON_OBJECT('is_active', NEW.is_active),
            NOW()
        );
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `users_before_insert_guid` BEFORE INSERT ON `users` FOR EACH ROW BEGIN
    IF NEW.guid IS NULL OR NEW.guid = '' OR NEW.guid = '-' OR LENGTH(NEW.guid) != 36 THEN
        SET NEW.guid = UUID();
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `users_before_update_guid` BEFORE UPDATE ON `users` FOR EACH ROW BEGIN
    IF NEW.guid IS NULL OR NEW.guid = '' OR NEW.guid = '-' OR LENGTH(NEW.guid) != 36 THEN
        IF OLD.guid IS NOT NULL AND OLD.guid != '' AND OLD.guid != '-' AND LENGTH(OLD.guid) = 36 THEN
            SET NEW.guid = OLD.guid;
        ELSE
            SET NEW.guid = UUID();
        END IF;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `user_x_role`
--

CREATE TABLE `user_x_role` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `assigned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `un_assigned_at` timestamp NULL DEFAULT NULL,
  `is_un_assigned` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `user_x_role`
--

INSERT INTO `user_x_role` (`id`, `user_id`, `role_id`, `assigned_at`, `un_assigned_at`, `is_un_assigned`) VALUES
(1, 1, 1, '2024-01-15 09:00:00', NULL, 0),
(2, 1, 4, '2024-01-15 09:00:00', NULL, 0),
(3, 2, 2, '2024-02-01 08:00:00', NULL, 0),
(4, 2, 4, '2024-02-01 08:00:00', NULL, 0),
(5, 3, 2, '2024-02-05 09:00:00', NULL, 0),
(6, 3, 4, '2024-02-05 09:00:00', NULL, 0),
(7, 4, 2, '2024-02-10 10:00:00', NULL, 0),
(8, 4, 4, '2024-02-10 10:00:00', NULL, 0),
(9, 5, 2, '2024-02-15 11:00:00', NULL, 0),
(10, 5, 4, '2024-02-15 11:00:00', NULL, 0),
(11, 6, 2, '2024-02-20 12:00:00', NULL, 0),
(12, 6, 4, '2024-02-20 12:00:00', NULL, 0),
(13, 7, 2, '2024-02-25 13:00:00', NULL, 0),
(14, 7, 4, '2024-02-25 13:00:00', NULL, 0),
(15, 8, 2, '2024-03-01 14:00:00', NULL, 0),
(16, 8, 4, '2024-03-01 14:00:00', NULL, 0),
(17, 9, 2, '2024-03-05 15:00:00', NULL, 0),
(18, 9, 4, '2024-03-05 15:00:00', NULL, 0),
(19, 10, 2, '2024-03-10 16:00:00', NULL, 0),
(20, 10, 4, '2024-03-10 16:00:00', NULL, 0),
(21, 11, 2, '2024-03-15 17:00:00', NULL, 0),
(22, 11, 4, '2024-03-15 17:00:00', NULL, 0),
(23, 12, 3, '2024-02-02 08:00:00', NULL, 0),
(24, 12, 4, '2024-02-02 08:00:00', NULL, 0),
(25, 13, 3, '2024-02-02 09:00:00', NULL, 0),
(26, 13, 4, '2024-02-02 09:00:00', NULL, 0),
(27, 14, 3, '2024-02-02 10:00:00', NULL, 0),
(28, 14, 4, '2024-02-02 10:00:00', NULL, 0),
(29, 15, 3, '2024-02-06 08:00:00', NULL, 0),
(30, 15, 4, '2024-02-06 08:00:00', NULL, 0),
(31, 16, 3, '2024-02-06 09:00:00', NULL, 0),
(32, 16, 4, '2024-02-06 09:00:00', NULL, 0),
(33, 17, 3, '2024-02-06 10:00:00', NULL, 0),
(34, 17, 4, '2024-02-06 10:00:00', NULL, 0),
(35, 18, 3, '2024-02-11 08:00:00', NULL, 0),
(36, 18, 4, '2024-02-11 08:00:00', NULL, 0),
(37, 19, 3, '2024-02-11 09:00:00', NULL, 0),
(38, 19, 4, '2024-02-11 09:00:00', NULL, 0),
(39, 20, 3, '2024-02-11 10:00:00', NULL, 0),
(40, 20, 4, '2024-02-11 10:00:00', NULL, 0),
(41, 21, 3, '2024-02-16 08:00:00', NULL, 0),
(42, 21, 4, '2024-02-16 08:00:00', NULL, 0),
(43, 22, 3, '2024-02-16 09:00:00', NULL, 0),
(44, 22, 4, '2024-02-16 09:00:00', NULL, 0),
(45, 23, 3, '2024-02-21 08:00:00', NULL, 0),
(46, 23, 4, '2024-02-21 08:00:00', NULL, 0),
(47, 24, 3, '2024-02-21 09:00:00', NULL, 0),
(48, 24, 4, '2024-02-21 09:00:00', NULL, 0),
(49, 25, 3, '2024-02-21 10:00:00', NULL, 0),
(50, 25, 4, '2024-02-21 10:00:00', NULL, 0),
(51, 26, 3, '2024-02-26 08:00:00', NULL, 0),
(52, 26, 4, '2024-02-26 08:00:00', NULL, 0),
(53, 27, 4, '2024-03-20 09:00:00', NULL, 0),
(54, 28, 4, '2024-03-21 10:00:00', NULL, 0),
(55, 29, 4, '2024-03-22 11:00:00', NULL, 0),
(56, 30, 4, '2024-03-23 12:00:00', NULL, 0),
(57, 31, 4, '2024-03-24 13:00:00', NULL, 0),
(58, 32, 4, '2024-03-25 14:00:00', NULL, 0),
(59, 33, 4, '2024-03-26 15:00:00', NULL, 0),
(60, 34, 4, '2024-03-27 16:00:00', NULL, 0),
(61, 35, 4, '2024-03-28 17:00:00', NULL, 0),
(62, 36, 4, '2024-03-29 18:00:00', NULL, 0),
(63, 37, 4, '2024-03-30 09:00:00', NULL, 0),
(64, 38, 4, '2024-03-31 09:00:00', NULL, 0),
(65, 39, 4, '2024-04-01 10:00:00', NULL, 0),
(66, 40, 4, '2024-04-02 11:00:00', NULL, 0),
(67, 41, 4, '2026-01-17 17:19:35', NULL, 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `company_id` (`company_id`),
  ADD KEY `service_id` (`service_id`),
  ADD KEY `staff_id` (`staff_id`),
  ADD KEY `client_id` (`client_id`),
  ADD KEY `cancelled_by` (`cancelled_by`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`performed_by_user_id`),
  ADD KEY `company_id` (`company_id`),
  ADD KEY `fk_audit_affected_user` (`affected_user_id`);

--
-- Indexes for table `business_categories`
--
ALTER TABLE `business_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_name` (`name`);

--
-- Indexes for table `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `owner_id` (`owner_id`),
  ADD KEY `fk_companies_business_category` (`business_category_id`);

--
-- Indexes for table `favorites`
--
ALTER TABLE `favorites`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_company_id` (`company_id`),
  ADD KEY `idx_is_deleted` (`is_deleted`);

--
-- Indexes for table `images`
--
ALTER TABLE `images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `company_id` (`company_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `notification_settings`
--
ALTER TABLE `notification_settings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `opening_hours`
--
ALTER TABLE `opening_hours`
  ADD PRIMARY KEY (`id`),
  ADD KEY `company_id` (`company_id`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `company_id` (`company_id`),
  ADD KEY `client_id` (`client_id`),
  ADD KEY `appointment_id` (`appointment_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`),
  ADD KEY `company_id` (`company_id`);

--
-- Indexes for table `service_categories`
--
ALTER TABLE `service_categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `company_id` (`company_id`);

--
-- Indexes for table `service_category_map`
--
ALTER TABLE `service_category_map`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_service_category` (`service_id`,`category_id`),
  ADD KEY `service_id` (`service_id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `company_id` (`company_id`);

--
-- Indexes for table `staff_exceptions`
--
ALTER TABLE `staff_exceptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `staff_id` (`staff_id`);

--
-- Indexes for table `staff_services`
--
ALTER TABLE `staff_services`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_staff_service` (`staff_id`,`service_id`),
  ADD KEY `staff_id` (`staff_id`),
  ADD KEY `service_id` (`service_id`);

--
-- Indexes for table `staff_working_hours`
--
ALTER TABLE `staff_working_hours`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_staff_day` (`staff_id`,`day_of_week`),
  ADD KEY `staff_id` (`staff_id`);

--
-- Indexes for table `temporary_closed_periods`
--
ALTER TABLE `temporary_closed_periods`
  ADD PRIMARY KEY (`id`),
  ADD KEY `company_id` (`company_id`);

--
-- Indexes for table `tokens`
--
ALTER TABLE `tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_token` (`token`(255)),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- Indexes for table `two_factor_recovery_codes`
--
ALTER TABLE `two_factor_recovery_codes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `code` (`code`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `unique_guid` (`guid`),
  ADD KEY `fk_users_company_id` (`company_id`),
  ADD KEY `idx_users_guid` (`guid`);

--
-- Indexes for table `user_x_role`
--
ALTER TABLE `user_x_role`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_role` (`user_id`,`role_id`),
  ADD KEY `role_id` (`role_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=154;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `business_categories`
--
ALTER TABLE `business_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `companies`
--
ALTER TABLE `companies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `favorites`
--
ALTER TABLE `favorites`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT for table `images`
--
ALTER TABLE `images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT for table `notification_settings`
--
ALTER TABLE `notification_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `opening_hours`
--
ALTER TABLE `opening_hours`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=71;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT for table `service_categories`
--
ALTER TABLE `service_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `service_category_map`
--
ALTER TABLE `service_category_map`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;

--
-- AUTO_INCREMENT for table `staff`
--
ALTER TABLE `staff`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT for table `staff_exceptions`
--
ALTER TABLE `staff_exceptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `staff_services`
--
ALTER TABLE `staff_services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=68;

--
-- AUTO_INCREMENT for table `staff_working_hours`
--
ALTER TABLE `staff_working_hours`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=106;

--
-- AUTO_INCREMENT for table `temporary_closed_periods`
--
ALTER TABLE `temporary_closed_periods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=71;

--
-- AUTO_INCREMENT for table `tokens`
--
ALTER TABLE `tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `two_factor_recovery_codes`
--
ALTER TABLE `two_factor_recovery_codes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT for table `user_x_role`
--
ALTER TABLE `user_x_role`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=68;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`),
  ADD CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`),
  ADD CONSTRAINT `appointments_ibfk_3` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`),
  ADD CONSTRAINT `appointments_ibfk_4` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `appointments_ibfk_5` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`performed_by_user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `audit_logs_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`),
  ADD CONSTRAINT `fk_audit_affected_user` FOREIGN KEY (`affected_user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_audit_performed_by` FOREIGN KEY (`performed_by_user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `companies`
--
ALTER TABLE `companies`
  ADD CONSTRAINT `companies_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_companies_business_category` FOREIGN KEY (`business_category_id`) REFERENCES `business_categories` (`id`);

--
-- Constraints for table `favorites`
--
ALTER TABLE `favorites`
  ADD CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `favorites_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `images`
--
ALTER TABLE `images`
  ADD CONSTRAINT `images_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`),
  ADD CONSTRAINT `images_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `notification_settings`
--
ALTER TABLE `notification_settings`
  ADD CONSTRAINT `notification_settings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `opening_hours`
--
ALTER TABLE `opening_hours`
  ADD CONSTRAINT `opening_hours_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`);

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`),
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `reviews_ibfk_3` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`);

--
-- Constraints for table `services`
--
ALTER TABLE `services`
  ADD CONSTRAINT `services_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`);

--
-- Constraints for table `service_categories`
--
ALTER TABLE `service_categories`
  ADD CONSTRAINT `service_categories_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`);

--
-- Constraints for table `service_category_map`
--
ALTER TABLE `service_category_map`
  ADD CONSTRAINT `service_category_map_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`),
  ADD CONSTRAINT `service_category_map_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `service_categories` (`id`);

--
-- Constraints for table `staff`
--
ALTER TABLE `staff`
  ADD CONSTRAINT `staff_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `staff_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`);

--
-- Constraints for table `staff_exceptions`
--
ALTER TABLE `staff_exceptions`
  ADD CONSTRAINT `staff_exceptions_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`);

--
-- Constraints for table `staff_services`
--
ALTER TABLE `staff_services`
  ADD CONSTRAINT `staff_services_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`),
  ADD CONSTRAINT `staff_services_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`);

--
-- Constraints for table `staff_working_hours`
--
ALTER TABLE `staff_working_hours`
  ADD CONSTRAINT `staff_working_hours_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`);

--
-- Constraints for table `temporary_closed_periods`
--
ALTER TABLE `temporary_closed_periods`
  ADD CONSTRAINT `temporary_closed_periods_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`);

--
-- Constraints for table `tokens`
--
ALTER TABLE `tokens`
  ADD CONSTRAINT `tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `two_factor_recovery_codes`
--
ALTER TABLE `two_factor_recovery_codes`
  ADD CONSTRAINT `two_factor_recovery_codes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_company_id` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`);

--
-- Constraints for table `user_x_role`
--
ALTER TABLE `user_x_role`
  ADD CONSTRAINT `user_x_role_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `user_x_role_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);

DELIMITER $$
--
-- Events
--
CREATE DEFINER=`root`@`localhost` EVENT `updateExpiredAppointments` ON SCHEDULE EVERY 1 HOUR STARTS '2025-12-12 10:16:13' ON COMPLETION NOT PRESERVE ENABLE DO BEGIN
    -- Pending appointmentek amelyek már lejártak -> no_show
    UPDATE `appointments`
    SET 
        `status` = 'no_show',
        `updated_at` = NOW()
    WHERE `status` = 'pending'
      AND `start_time` < DATE_SUB(NOW(), INTERVAL 1 HOUR);
    
    -- Confirmed appointmentek amelyek véget értek -> completed
    UPDATE `appointments`
    SET 
        `status` = 'completed',
        `updated_at` = NOW()
    WHERE `status` = 'confirmed'
      AND `end_time` < NOW();
END$$

CREATE DEFINER=`root`@`localhost` EVENT `deactivateInactiveUsers` ON SCHEDULE EVERY 1 MONTH STARTS '2025-12-12 10:15:05' ON COMPLETION NOT PRESERVE DISABLE DO BEGIN
    -- Userek akik 180 napja nem jelentkeztek be
    UPDATE `users`
    SET 
        `is_active` = FALSE,
        `updated_at` = NOW()
    WHERE `last_login` < DATE_SUB(NOW(), INTERVAL 180 DAY)
      AND `is_active` = TRUE
      AND `is_deleted` = FALSE;
END$$

CREATE DEFINER=`root`@`localhost` EVENT `cleanOldAuditLogs` ON SCHEDULE EVERY 1 WEEK STARTS '2025-12-12 10:13:56' ON COMPLETION NOT PRESERVE ENABLE DO BEGIN
    -- Régi audit logok törlése (365 napnál régebbiek)
    DELETE FROM `audit_logs`
    WHERE `created_at` < DATE_SUB(NOW(), INTERVAL 365 DAY);
    
END$$

CREATE DEFINER=`root`@`localhost` EVENT `cleanupExpiredTokens` ON SCHEDULE EVERY 1 DAY STARTS '2025-12-12 02:00:00' ON COMPLETION NOT PRESERVE ENABLE COMMENT 'Automatikusan törli a lejárt vagy revoked tokeneket' DO BEGIN
    -- Futtatjuk a meglévő eljárást
    CALL cleanExpiredTokens();
    
    -- Opcionális: audit log
    INSERT INTO audit_logs (
        user_id,
        company_id,
        email,
        entity_type,
        action,
        old_values,
        new_values,
        created_at
    )
    VALUES (
        1,  -- superadmin
        NULL,
        'system@bookr.hu',
        'tokens',
        'cleanup_expired',
        NULL,
        JSON_OBJECT('deleted_count', ROW_COUNT()),
        NOW()
    );
END$$

DELIMITER ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
