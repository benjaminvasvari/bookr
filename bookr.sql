-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:8889
-- Generation Time: Feb 22, 2026 at 10:50 PM
-- Server version: 8.0.40
-- PHP Version: 8.3.14

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
CREATE DEFINER=`root`@`localhost` PROCEDURE `acceptStaffInvite` (IN `tokenIN` VARCHAR(500), IN `userIdIN` INT)   BEGIN
    DECLARE vTokenId INT DEFAULT NULL;
    DECLARE vExpiresAt DATETIME DEFAULT NULL;
    DECLARE vIsRevoked TINYINT DEFAULT 0;
    DECLARE vCompanyId INT DEFAULT NULL;
    DECLARE vPosition VARCHAR(100) DEFAULT NULL;
    DECLARE vDisplayName VARCHAR(255) DEFAULT NULL;

    -- Token keresése
    SELECT `id`, `expires_at`, `is_revoked`
    INTO vTokenId, vExpiresAt, vIsRevoked
    FROM `tokens`
    WHERE `token` = tokenIN
      AND `type` = 'staff_invite'
    LIMIT 1;

    IF vTokenId IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'not_found';
    ELSEIF vIsRevoked = 1 OR vExpiresAt < NOW() THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'expired';
    END IF;

    -- pending_staff adatok
    SELECT `company_id`, `position`
    INTO vCompanyId, vPosition
    FROM `pending_staff`
    WHERE `token_id` = vTokenId
    LIMIT 1;

    -- display_name összerakása
    SELECT CONCAT(`first_name`, ' ', `last_name`)
    INTO vDisplayName
    FROM `users`
    WHERE `id` = userIdIN;

    -- users company_id beállítása
    UPDATE `users`
    SET `company_id` = vCompanyId
    WHERE `id` = userIdIN;

    -- staff INSERT
    INSERT INTO `staff` (`user_id`, `company_id`, `display_name`, `specialties`, `is_active`, `is_deleted`)
    VALUES (userIdIN, vCompanyId, vDisplayName, vPosition, 1, 0);

    -- token visszavonása
    UPDATE `tokens`
    SET `is_revoked` = 1,
        `revoked_at` = NOW()
    WHERE `id` = vTokenId;

    -- pending_staff status frissítése
    UPDATE `pending_staff`
    SET `status` = 'accepted'
    WHERE `token_id` = vTokenId;

    SELECT 'success' AS `result`;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `activateBusinessCategory` (IN `idIN` INT)   BEGIN
    UPDATE `business_categories`
    SET 
        `is_active` = 1,
        `updated_at` = NOW()
    WHERE `id` = idIN;
END$$

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

CREATE DEFINER=`root`@`localhost` PROCEDURE `activateUserByRegToken` (IN `tokenIN` VARCHAR(500))   BEGIN
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `checkAppointment` (IN `appointmentIdIN` INT)   BEGIN
	SELECT
    	appointments.id,
        appointments.cancelled_at,
        appointments.status
    FROM appointments
    WHERE appointments.id = appointmentIdIN;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `checkCompany` (IN `idIN` INT)   BEGIN

	SELECT 
    	`companies`.`is_deleted`,
        `companies`.`is_active`
    FROM `companies`
	WHERE `companies`.`id` = idIN
    LIMIT 1;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `checkService` (IN `servicesIdIN` INT)   BEGIN
    SELECT 
			services.id,
            services.name,
            services.is_active,
            services.is_deleted
    FROM services
    WHERE services.id = servicesIdIN;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `checkStaff` (IN `staffIdIN` INT)   BEGIN
    SELECT 
    	staff.id,
        staff.is_active,
        staff.is_deleted
    FROM staff
    WHERE staff.id = staffIdIN;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `checkStaffInviteEligibility` (IN `emailIN` VARCHAR(100), IN `companyIdIN` INT)   BEGIN
    DECLARE hasPendingInvite TINYINT DEFAULT 0;
    DECLARE isAlreadyStaff TINYINT DEFAULT 0;

    SELECT COUNT(*) INTO hasPendingInvite
    FROM `pending_staff`
    WHERE `email` = emailIN
      AND `company_id` = companyIdIN
      AND `status` = 'pending';

    SELECT COUNT(*) INTO isAlreadyStaff
    FROM `staff`
    INNER JOIN `users` ON `users`.`id` = `staff`.`user_id`
    WHERE `users`.`email` = emailIN
      AND `staff`.`company_id` = companyIdIN
      AND `staff`.`is_deleted` = 0;

    SELECT
        CASE
            WHEN isAlreadyStaff   > 0 THEN 'already_staff'
            WHEN hasPendingInvite > 0 THEN 'invite_exists'
            ELSE 'eligible'
        END AS `result`;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `checkStaffInviteToken` (IN `tokenIN` VARCHAR(500))   BEGIN
    DECLARE vUserId INT DEFAULT NULL;
    DECLARE vExpiresAt DATETIME DEFAULT NULL;
    DECLARE vIsRevoked TINYINT DEFAULT 0;
    DECLARE vTokenId INT DEFAULT NULL;

    SELECT `id`, `user_id`, `expires_at`, `is_revoked`
    INTO vTokenId, vUserId, vExpiresAt, vIsRevoked
    FROM `tokens`
    WHERE `token` = tokenIN
      AND `type` = 'staff_invite'
    LIMIT 1;

    IF vTokenId IS NULL THEN
        SELECT 'not_found' AS `result`, NULL AS `user_id`, NULL AS `expires_at`,
               NULL AS `email`, NULL AS `company_id`, NULL AS `position`;

    ELSEIF vIsRevoked = 1 OR vExpiresAt < NOW() THEN
        SELECT 'expired' AS `result`, NULL AS `user_id`, NULL AS `expires_at`,
               NULL AS `email`, NULL AS `company_id`, NULL AS `position`;

    ELSE
        SELECT 
            'valid' AS `result`,
            vUserId AS `user_id`,
            vExpiresAt AS `expires_at`,
            ps.`email`,
            ps.`company_id`,
            ps.`position`
        FROM `pending_staff` ps
        WHERE ps.`token_id` = vTokenId
        LIMIT 1;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `checkUser` (IN `userIdIN` INT)   BEGIN
    SELECT 
			users.id,
            users.is_deleted,
            users.is_active
    FROM users
    WHERE users.id = userIdIN;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `checkUserByEmail` (IN `userEmailIN` VARCHAR(100))   BEGIN
    SELECT 
			users.id,
            users.is_deleted,
            users.is_active
    FROM users
    WHERE users.email = userEmailIN;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `cleanExpiredTokens` ()   BEGIN
    DELETE FROM `tokens`
    WHERE (
        `expires_at` < NOW()
        OR `is_revoked` = TRUE
    )
    AND `id` NOT IN (
        SELECT `token_id` FROM `pending_staff`
    );
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `completeAppointment` (IN `appointmentIdIN` INT, IN `internalNotesIN` TEXT)   BEGIN
    IF (SELECT `status` FROM `appointments` WHERE `id` = appointmentIdIN) = 'in_progress' THEN
        UPDATE `appointments`
        SET `status` = 'completed', `internal_notes` = internalNotesIN, `updated_at` = NOW()
        WHERE `id` = appointmentIdIN;
        SELECT 'SUCCESS' AS result, 'Appointment completed' AS message;
    ELSE
        SELECT 'ERROR' AS result, 'Appointment is not in_progress' AS message;
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
        'booked',
        notesIN,
        priceIN,
        currencyIN
    );
    
    -- Új appointment ID lekérése
    SET newAppointmentId = LAST_INSERT_ID();
    
    -- OUT paraméterbe is visszaadjuk
    SET newAppointmentIdOUT = newAppointmentId;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createBusinessCategory` (IN `nameIN` VARCHAR(100), IN `descriptionIN` TEXT, OUT `newBusinessCategoryIdOUT` INT)   BEGIN
    DECLARE newBusinessCategoryId INT;
    
    
    INSERT INTO `business_categories` (
        `name`,
        `description`
    )
    VALUES (
        nameIN,
        descriptionIN
    );
    
    SET newBusinessCategoryId = LAST_INSERT_ID();
    
    SET newBusinessCategoryIdOUT = newBusinessCategoryId;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createCompany` (IN `nameIN` VARCHAR(255), IN `descriptionIN` TEXT, IN `addressIN` TEXT, IN `cityIN` VARCHAR(100), IN `postalCodeIN` VARCHAR(20), IN `countryIN` VARCHAR(100), IN `phoneIN` VARCHAR(30), IN `emailIN` VARCHAR(100), IN `websiteIN` VARCHAR(255), IN `ownerIdIN` INT, IN `allowSameDayBookingIN` BOOLEAN, IN `minimumBookingHoursAheadIN` INT, IN `bookingAdvanceDaysIN` INT, IN `cancellationHoursIN` INT, IN `businessCategoryIdIN` INT)   BEGIN
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
        business_category_id,
        owner_id,
        booking_advance_days,
        cancellation_hours,
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
        businessCategoryIdIN,
        ownerIdIN,
        bookingAdvanceDaysIN,
        cancellationHoursIN,
        allowSameDayBookingIN,
        minimumBookingHoursAheadIN
    );
    
    -- Új company ID lekérése
    SET newCompanyId = LAST_INSERT_ID();
    
    INSERT INTO images (
        company_id,
        url,
        is_main
    )
	VALUES (
        newCompanyId,
        null,
        true
   	);
    
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `createPendingStaff` (IN `emailIN` VARCHAR(100), IN `companyIdIN` INT, IN `userIdIN` INT, IN `tokenIdIN` INT, IN `positionIN` TEXT)   BEGIN
    INSERT INTO `pending_staff` (
        `email`,
        `company_id`,
        `user_id`,
        `token_id`,
        `position`,
        `status`,
        `created_at`
    )
    VALUES (
        emailIN,
        companyIdIN,
        userIdIN,
        tokenIdIN,
        positionIN,
        'pending',
        NOW()
    );

    SELECT LAST_INSERT_ID() AS pending_staff_id;
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `deactivateBusinessCategory` (IN `idIN` INT)   BEGIN
    UPDATE `business_categories`
    SET 
        `is_active` = 0,
        `updated_at` = NOW()
    WHERE `id` = idIN;
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `generateStaffInviteToken` (IN `userIdIN` INT, IN `emailIN` VARCHAR(100), IN `companyIdIN` INT)   BEGIN
    DECLARE newToken VARCHAR(64);
    DECLARE tokenExpiry DATETIME;

    -- Token generálás
    SET newToken = MD5(CONCAT(emailIN, companyIdIN, NOW(), RAND()));
    SET tokenExpiry = DATE_ADD(NOW(), INTERVAL 7 DAY);

    -- Token mentése (user_id lehet NULL ha még nincs profil)
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
        'staff_invite',
        tokenExpiry,
        FALSE,
        NOW()
    );

    -- Visszaadás
    SELECT
        LAST_INSERT_ID() AS token_id,
        newToken AS token,
        tokenExpiry AS expires_at;
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllActiveStaffByCompany` (IN `companyIdIN` INT)   BEGIN
    SELECT 
   		`staff`.`id` AS "staff_id",
        `staff`.`user_id`,
        `staff`.`display_name`,
        `staff`.`specialties`,
        `staff`.`bio`,
        `staff`.`color`,
        `staff`.`created_at` AS "staff_created_at",
        `staff`.`updated_at` AS "staff_updated_at",
		`users`.`first_name`,
        `users`.`last_name`,
        `images`.`url` AS "image_url"
    FROM `staff`
    INNER JOIN `users` ON `staff`.`user_id` = `users`.`id`
    LEFT JOIN `images` ON `images`.`user_id` = `staff`.`user_id`
    WHERE `staff`.`company_id` = companyIdIN
      AND `staff`.`is_active` = TRUE AND `users`.`is_deleted` = FALSE AND `users`.`is_active` = TRUE AND `images`.`is_deleted` = FALSE
    ORDER BY `staff`.`display_name`;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllBusinessCategories` ()   BEGIN
    SELECT 
        `business_categories`.`id`,
        `business_categories`.`name`,
        `business_categories`.`description`,
        `business_categories`.`created_at`,
        `business_categories`.`updated_at`
    FROM `business_categories`
    WHERE `business_categories`.`is_active` = TRUE
    ORDER BY `business_categories`.`name` ASC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllFutureAppointmentsByCompany` (IN `companyIdIN` INT)   BEGIN
    SELECT 
        `appointments`.`id` AS appointment_id,
        DATE(`appointments`.`start_time`) AS appointment_date,
        TIME(`appointments`.`start_time`) AS start_time,
        TIME(`appointments`.`end_time`) AS end_time,
        `services`.`name` AS service_name,
        CONCAT(`u_staff`.`first_name`, ' ', `u_staff`.`last_name`) AS staff_name,
        `img_staff`.`url` AS staff_profile_image,
        CONCAT(`u_client`.`first_name`, ' ', `u_client`.`last_name`) AS client_name,
        `img_client`.`url` AS client_profile_image,
        `services`.`duration_minutes` AS duration,
        `appointments`.`status`,
        `appointments`.`price`,
        `appointments`.`currency`,
        `appointments`.`created_at`
    FROM `appointments`
    INNER JOIN `services` ON `appointments`.`service_id` = `services`.`id`
    INNER JOIN `staff` ON `appointments`.`staff_id` = `staff`.`id`
    INNER JOIN `users` AS `u_staff` ON `staff`.`user_id` = `u_staff`.`id`
    INNER JOIN `users` AS `u_client` ON `appointments`.`client_id` = `u_client`.`id`
    LEFT JOIN `images` AS `img_staff` ON `u_staff`.`id` = `img_staff`.`user_id` 
        AND `img_staff`.`is_deleted` = 0
    LEFT JOIN `images` AS `img_client` ON `u_client`.`id` = `img_client`.`user_id` 
        AND `img_client`.`is_deleted` = 0
    WHERE `appointments`.`company_id` = companyIdIN
      AND DATE(`appointments`.`start_time`) >= CURDATE()
    ORDER BY `appointments`.`start_time` ASC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllNotificationSettings` (IN `userIdIN` INT)   SELECT
	`notification_settings`.`id`,
    `notification_settings`.`user_id`,
    `notification_settings`.`appointment_confirmation`,
    `notification_settings`.`appointment_reminder`,
    `notification_settings`.`appointment_cancellation`,
    `notification_settings`.`marketing_emails`,
    `notification_settings`.`updated_at`,
    `notification_settings`.`created_at`
FROM `notification_settings`
WHERE `notification_settings`.`user_id` = userIdIN
LIMIT 1$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAppointmentsByClient` (IN `clientIdIN` INT, IN `isUpcomingIN` BOOLEAN, IN `limitIN` INT, IN `offsetIN` INT, OUT `countOUT` INT)   BEGIN
    -- 1. Összes találat számának lekérdezése
    SELECT COUNT(*) INTO countOUT
    FROM appointments
    WHERE client_id = clientIdIN
      AND (
          (isUpcomingIN = 1 AND start_time >= NOW())
          OR
          (isUpcomingIN = 0 AND start_time < NOW())
      );
    
    -- 2. Lapozott adatok visszaadása (ezt kell SELECT-tel visszaadni!)
    SELECT 
        a.id AS appointmentId,
        a.company_id AS companyId,
        a.staff_id AS staffId,
        a.client_id AS clientId,
        a.service_id AS serviceId,
        a.start_time AS startTime,
        a.end_time AS endTime,
        a.status,
        a.created_at AS createdAt,
        a.updated_at AS updatedAt
    FROM appointments a
    WHERE a.client_id = clientIdIN
      AND (
          (isUpcomingIN = 1 AND a.start_time >= NOW())
          OR
          (isUpcomingIN = 0 AND a.start_time < NOW())
      )
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `getClientsByCompany` (IN `companyIdIN` INT, IN `pageIN` INT, IN `pageSizeIN` INT, OUT `totalClientsOUT` INT)   BEGIN
    DECLARE offsetVal INT;
    SET offsetVal = (pageIN - 1) * pageSizeIN;

    -- Total count OUT paraméterbe
    SELECT COUNT(DISTINCT a.client_id) INTO totalClientsOUT
    FROM appointments a
    WHERE a.company_id = companyIdIN
      AND a.status != 'cancelled';

    -- Paginated clients
    SELECT
        u.id AS clientId,
        u.first_name AS firstName,
        u.last_name AS lastName,
        u.email,
        u.phone,
        img.url AS imageUrl,
        COUNT(a.id) AS totalAppointments,
        COALESCE(SUM(a.price), 0) AS totalSpending,
        MAX(a.start_time) AS lastVisit,
        (
            SELECT a2.internal_notes
            FROM appointments a2
            WHERE a2.client_id = u.id
              AND a2.company_id = companyIdIN
              AND a2.internal_notes IS NOT NULL
            ORDER BY a2.start_time DESC
            LIMIT 1
        ) AS latestInternalNote
    FROM appointments a
    INNER JOIN users u ON a.client_id = u.id
    LEFT JOIN images img ON img.user_id = u.id AND img.is_deleted = FALSE
    WHERE a.company_id = companyIdIN
      AND a.status != 'cancelled'
    GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone, img.url
    ORDER BY totalAppointments DESC
    LIMIT pageSizeIN OFFSET offsetVal;

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

CREATE DEFINER=`root`@`localhost` PROCEDURE `getCompanyIdByOwnerId` (IN `userIdIN` INT)   BEGIN

	SELECT `users`.`company_id`
    FROM `users`
    WHERE `users`.`id` = userIdIN
    LIMIT 1;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getCompanyImageCount` (IN `companyIdIN` INT)   BEGIN
    SELECT COUNT(*)
    FROM images
    WHERE images.company_id = companyIdIN
      AND is_deleted = 0;
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `getCompanyShort` (IN `companyIdIN` INT)   BEGIN
    SELECT 
        `companies`.`id`,
        `companies`.`name`,
        `companies`.`address`,
        `companies`.`postal_code`,
        `companies`.`city`,
        `companies`.`country`,
        `business_categories`.`name` AS "category",
        ROUND(COALESCE(AVG(`reviews`.`rating`), 0), 1) AS 'rating',
        COUNT(`reviews`.`id`) AS "review_count",
        `images`.`url` AS "imageUrl"
    FROM `companies`
    LEFT JOIN `reviews` ON `reviews`.`company_id` = `companies`.`id` 
                        AND `reviews`.`is_deleted` = FALSE
    INNER JOIN `images` ON `images`.`company_id` = `companies`.`id`
    INNER JOIN `business_categories` ON `business_categories`.`id` = `companies`.`business_category_id`
    WHERE `companies`.`id` = companyIdIN AND `images`.`is_main` = true AND `images`.`is_deleted` = false
    GROUP BY `companies`.`id`, 
             `companies`.`name`, 
             `companies`.`address`, 
             `companies`.`postal_code`, 
             `companies`.`city`, 
             `companies`.`country`,
             `images`.`url`;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getDashboardActiveClients` (IN `companyIdIN` INT)   BEGIN
    DECLARE weekStart DATE;
    SET weekStart = DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY);
    
    SELECT 
        -- Aktív ügyfelek (ezen a héten foglaltak)
        COUNT(DISTINCT `client_id`) AS active_count,
        
        -- Új ügyfelek (akik ezen a héten foglaltak először)
        COUNT(DISTINCT CASE 
            WHEN NOT EXISTS (
                SELECT 1 
                FROM `appointments` prev
                WHERE prev.client_id = `appointments`.client_id
                  AND prev.company_id = companyIdIN
                  AND DATE(prev.created_at) < weekStart
            ) 
            THEN `client_id`
            ELSE NULL
        END) AS new_clients_count
        
    FROM `appointments`
    WHERE `company_id` = companyIdIN
      AND DATE(`start_time`) >= weekStart
      AND `status` != 'cancelled';
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getDashboardAverageRating` (IN `companyIdIN` INT)   BEGIN
    SELECT 
        COALESCE(ROUND(AVG(`rating`), 1), 0) AS average_rating,
        COUNT(*) AS total_reviews
    FROM `reviews`
    WHERE `company_id` = companyIdIN
      AND `is_deleted` = FALSE;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getDashboardTodayBookingsCount` (IN `companyIdIN` INT)   BEGIN
    SELECT 
        COUNT(*) AS today_count,
        (SELECT COUNT(*) 
         FROM `appointments` 
         WHERE `company_id` = companyIdIN 
           AND DATE(`start_time`) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
           AND `status` != 'cancelled'
        ) AS yesterday_count
    FROM `appointments`
    WHERE `company_id` = companyIdIN
      AND DATE(`start_time`) = CURDATE()
      AND `status` != 'cancelled';
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getDashboardUpcomingAppointments` (IN `companyIdIN` INT, IN `limitIN` INT)   BEGIN
    SELECT 
        a.id AS appointment_id,
        a.start_time,
        a.end_time,
        a.status,
        s.name AS service_name,
        CONCAT(u.first_name, ' ', u.last_name) AS client_name,
        
        -- Relatív időpont (Ma/Holnap vagy dátum)
        CASE 
            WHEN DATE(a.start_time) = CURDATE() THEN 'Ma'
            WHEN DATE(a.start_time) = DATE_ADD(CURDATE(), INTERVAL 1 DAY) THEN 'Holnap'
            ELSE DATE_FORMAT(a.start_time, '%Y-%m-%d')
        END AS relative_date
        
    FROM `appointments` a
    INNER JOIN `services` s ON a.service_id = s.id
    INNER JOIN `users` u ON a.client_id = u.id
    WHERE a.company_id = companyIdIN
      AND a.start_time >= NOW()
      AND a.status NOT IN ('cancelled', 'no_show')
    ORDER BY a.start_time ASC
    LIMIT limitIN;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getDashboardWeeklyRevenue` (IN `companyIdIN` INT)   BEGIN
    DECLARE thisWeekStart DATE;
    DECLARE lastWeekStart DATE;
    DECLARE lastWeekEnd DATE;

    SET thisWeekStart = DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY);
    SET lastWeekStart = DATE_SUB(thisWeekStart, INTERVAL 7 DAY);
    SET lastWeekEnd = DATE_SUB(thisWeekStart, INTERVAL 1 DAY);

    SELECT
        COALESCE(SUM(CASE WHEN DATE(`start_time`) >= thisWeekStart THEN `price` ELSE 0 END), 0) AS this_week_revenue,
        COALESCE(SUM(CASE WHEN DATE(`start_time`) BETWEEN lastWeekStart AND lastWeekEnd THEN `price` ELSE 0 END), 0) AS last_week_revenue,
        'HUF' AS currency
    FROM `appointments`
    WHERE `company_id` = companyIdIN
      AND DATE(`start_time`) >= lastWeekStart
      AND `status` = 'completed';
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `getOwnerReviews` (IN `companyIdIN` INT, IN `searchIN` VARCHAR(100), IN `ratingFilterIN` VARCHAR(5), IN `sortByIN` ENUM('newest','oldest','highest','lowest'), IN `pageIN` INT, IN `pageSizeIN` INT, OUT `totalCountOUT` INT)   BEGIN
    DECLARE ratingInt INT DEFAULT NULL;
    DECLARE offsetVal INT;

    SET offsetVal = (pageIN - 1) * pageSizeIN;

    IF `ratingFilterIN` IS NOT NULL AND `ratingFilterIN` != '' THEN
        SET ratingInt = CAST(`ratingFilterIN` AS UNSIGNED);
    END IF;

    SELECT COUNT(*) INTO `totalCountOUT`
    FROM `reviews` `r`
    INNER JOIN `users` `u`        ON `u`.`id` = `r`.`client_id`
    INNER JOIN `appointments` `a` ON `a`.`id` = `r`.`appointment_id`
    INNER JOIN `services` `s`     ON `s`.`id` = `a`.`service_id`
    WHERE `r`.`company_id` = companyIdIN
      AND `r`.`is_deleted` = FALSE
      AND (ratingInt IS NULL OR `r`.`rating` = ratingInt)
      AND (
          `searchIN` IS NULL OR `searchIN` = ''
          OR CONCAT(`u`.`first_name`, ' ', `u`.`last_name`) LIKE CONCAT('%', `searchIN`, '%')
          OR `s`.`name` LIKE CONCAT('%', `searchIN`, '%')
      );

    SELECT
        `r`.`id`                                               AS `review_id`,
        `r`.`rating`,
        `r`.`comment`,
        `r`.`created_at`,
        CONCAT(`u`.`first_name`, ' ', `u`.`last_name`)         AS `client_name`,
        `img`.`url`                                            AS `client_image`,
        `s`.`name`                                             AS `service_name`,
        DATE(`a`.`start_time`)                                 AS `appointment_date`

    FROM `reviews` `r`
    INNER JOIN `users` `u`        ON `u`.`id` = `r`.`client_id`
    INNER JOIN `appointments` `a` ON `a`.`id` = `r`.`appointment_id`
    INNER JOIN `services` `s`     ON `s`.`id` = `a`.`service_id`
    LEFT JOIN `images` `img`      ON `img`.`user_id` = `u`.`id`
                                 AND `img`.`is_deleted` = FALSE

    WHERE `r`.`company_id` = companyIdIN
      AND `r`.`is_deleted` = FALSE
      AND (ratingInt IS NULL OR `r`.`rating` = ratingInt)
      AND (
          `searchIN` IS NULL OR `searchIN` = ''
          OR CONCAT(`u`.`first_name`, ' ', `u`.`last_name`) LIKE CONCAT('%', `searchIN`, '%')
          OR `s`.`name` LIKE CONCAT('%', `searchIN`, '%')
      )

    ORDER BY
        CASE WHEN `sortByIN` = 'newest'  THEN `r`.`created_at` END DESC,
        CASE WHEN `sortByIN` = 'oldest'  THEN `r`.`created_at` END ASC,
        CASE WHEN `sortByIN` = 'highest' THEN `r`.`rating`     END DESC,
        CASE WHEN `sortByIN` = 'lowest'  THEN `r`.`rating`     END ASC

    LIMIT pageSizeIN OFFSET offsetVal;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getPassword` (IN `idIN` INT)   BEGIN

	SELECT 
    	`users`.`password` AS "passwordHash"
    FROM `users`
    WHERE `users`.`id` = idIN AND `users`.`is_deleted` = false AND `users`.`is_active` = true
    LIMIT 1;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getReviewsByCompanyIdAll` (IN `companyIdIN` INT)   BEGIN
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `getReviewsByCompanyLimited` (IN `companyIdIN` INT, IN `limitIN` INT)   BEGIN
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
    LIMIT limitIN;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getSalesOverviewAvgBasket` (IN `companyIdIN` INT, IN `periodIN` ENUM('week','month','year'))   BEGIN
    DECLARE currentStart DATE;
    DECLARE currentEnd DATE;
    DECLARE previousStart DATE;
    DECLARE previousEnd DATE;

    IF periodIN = 'week' THEN
        SET currentStart  = DATE_SUB(CURDATE(), INTERVAL 7 DAY);
        SET currentEnd    = CURDATE();
        SET previousStart = DATE_SUB(currentStart, INTERVAL 7 DAY);
        SET previousEnd   = DATE_SUB(currentStart, INTERVAL 1 DAY);

    ELSEIF periodIN = 'month' THEN
        SET currentStart  = DATE_SUB(CURDATE(), INTERVAL 30 DAY);
        SET currentEnd    = CURDATE();
        SET previousStart = DATE_SUB(currentStart, INTERVAL 30 DAY);
        SET previousEnd   = DATE_SUB(currentStart, INTERVAL 1 DAY);

    ELSEIF periodIN = 'year' THEN
        SET currentStart  = DATE_SUB(CURDATE(), INTERVAL 365 DAY);
        SET currentEnd    = CURDATE();
        SET previousStart = DATE_SUB(currentStart, INTERVAL 365 DAY);
        SET previousEnd   = DATE_SUB(currentStart, INTERVAL 1 DAY);
    END IF;

    SELECT
        COALESCE(ROUND(AVG(CASE
            WHEN DATE(`start_time`) BETWEEN currentStart AND currentEnd
            THEN `price` END), 0), 0) AS current_avg,

        COALESCE(ROUND(AVG(CASE
            WHEN DATE(`start_time`) BETWEEN previousStart AND previousEnd
            THEN `price` END), 0), 0) AS previous_avg,

        'HUF' AS currency

    FROM `appointments`
    WHERE `company_id` = companyIdIN
      AND `status` IN ('completed', 'confirmed')
      AND DATE(`start_time`) BETWEEN previousStart AND currentEnd;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getSalesOverviewBookingsCount` (IN `companyIdIN` INT, IN `periodIN` ENUM('week','month','year'))   BEGIN
    DECLARE currentStart DATE;
    DECLARE currentEnd DATE;
    DECLARE previousStart DATE;
    DECLARE previousEnd DATE;

    IF periodIN = 'week' THEN
        SET currentStart  = DATE_SUB(CURDATE(), INTERVAL 7 DAY);
        SET currentEnd    = CURDATE();
        SET previousStart = DATE_SUB(currentStart, INTERVAL 7 DAY);
        SET previousEnd   = DATE_SUB(currentStart, INTERVAL 1 DAY);

    ELSEIF periodIN = 'month' THEN
        SET currentStart  = DATE_SUB(CURDATE(), INTERVAL 30 DAY);
        SET currentEnd    = CURDATE();
        SET previousStart = DATE_SUB(currentStart, INTERVAL 30 DAY);
        SET previousEnd   = DATE_SUB(currentStart, INTERVAL 1 DAY);

    ELSEIF periodIN = 'year' THEN
        SET currentStart  = DATE_SUB(CURDATE(), INTERVAL 365 DAY);
        SET currentEnd    = CURDATE();
        SET previousStart = DATE_SUB(currentStart, INTERVAL 365 DAY);
        SET previousEnd   = DATE_SUB(currentStart, INTERVAL 1 DAY);
    END IF;

    SELECT
        COUNT(CASE
            WHEN DATE(`created_at`) BETWEEN currentStart AND currentEnd
            THEN 1 END) AS current_count,

        COUNT(CASE
            WHEN DATE(`created_at`) BETWEEN previousStart AND previousEnd
            THEN 1 END) AS previous_count

    FROM `appointments`
    WHERE `company_id` = companyIdIN
      AND `status` NOT IN ('cancelled')
      AND DATE(`created_at`) BETWEEN previousStart AND currentEnd;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getSalesOverviewReturningClients` (IN `companyIdIN` INT, IN `periodIN` ENUM('week','month','year'))   BEGIN
    DECLARE currentStart DATE;
    DECLARE currentEnd DATE;
    DECLARE previousStart DATE;
    DECLARE previousEnd DATE;

    IF periodIN = 'week' THEN
        SET currentStart  = DATE_SUB(CURDATE(), INTERVAL 7 DAY);
        SET currentEnd    = CURDATE();
        SET previousStart = DATE_SUB(currentStart, INTERVAL 7 DAY);
        SET previousEnd   = DATE_SUB(currentStart, INTERVAL 1 DAY);

    ELSEIF periodIN = 'month' THEN
        SET currentStart  = DATE_SUB(CURDATE(), INTERVAL 30 DAY);
        SET currentEnd    = CURDATE();
        SET previousStart = DATE_SUB(currentStart, INTERVAL 30 DAY);
        SET previousEnd   = DATE_SUB(currentStart, INTERVAL 1 DAY);

    ELSEIF periodIN = 'year' THEN
        SET currentStart  = DATE_SUB(CURDATE(), INTERVAL 365 DAY);
        SET currentEnd    = CURDATE();
        SET previousStart = DATE_SUB(currentStart, INTERVAL 365 DAY);
        SET previousEnd   = DATE_SUB(currentStart, INTERVAL 1 DAY);
    END IF;

    SELECT
        COUNT(DISTINCT CASE
            WHEN DATE(`a`.`created_at`) BETWEEN currentStart AND currentEnd
            THEN `a`.`client_id` END) AS current_total_clients,

        COUNT(DISTINCT CASE
            WHEN DATE(`a`.`created_at`) BETWEEN currentStart AND currentEnd
            AND EXISTS (
                SELECT 1 FROM `appointments` `prev`
                WHERE `prev`.`client_id` = `a`.`client_id`
                  AND `prev`.`company_id` = companyIdIN
                  AND DATE(`prev`.`created_at`) < currentStart
                  AND `prev`.`status` NOT IN ('cancelled')
            )
            THEN `a`.`client_id` END) AS current_returning_clients,

        COUNT(DISTINCT CASE
            WHEN DATE(`a`.`created_at`) BETWEEN previousStart AND previousEnd
            THEN `a`.`client_id` END) AS previous_total_clients,

        COUNT(DISTINCT CASE
            WHEN DATE(`a`.`created_at`) BETWEEN previousStart AND previousEnd
            AND EXISTS (
                SELECT 1 FROM `appointments` `prev`
                WHERE `prev`.`client_id` = `a`.`client_id`
                  AND `prev`.`company_id` = companyIdIN
                  AND DATE(`prev`.`created_at`) < previousStart
                  AND `prev`.`status` NOT IN ('cancelled')
            )
            THEN `a`.`client_id` END) AS previous_returning_clients

    FROM `appointments` `a`
    WHERE `a`.`company_id` = companyIdIN
      AND `a`.`status` NOT IN ('cancelled')
      AND DATE(`a`.`created_at`) BETWEEN previousStart AND currentEnd;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getSalesOverviewRevenue` (IN `companyIdIN` INT, IN `periodIN` ENUM('week','month','year'))   BEGIN
    DECLARE currentStart DATE;
    DECLARE currentEnd DATE;
    DECLARE previousStart DATE;
    DECLARE previousEnd DATE;

    IF periodIN = 'week' THEN
        SET currentStart  = DATE_SUB(CURDATE(), INTERVAL 7 DAY);
        SET currentEnd    = CURDATE();
        SET previousStart = DATE_SUB(currentStart, INTERVAL 7 DAY);
        SET previousEnd   = DATE_SUB(currentStart, INTERVAL 1 DAY);

    ELSEIF periodIN = 'month' THEN
        SET currentStart  = DATE_SUB(CURDATE(), INTERVAL 30 DAY);
        SET currentEnd    = CURDATE();
        SET previousStart = DATE_SUB(currentStart, INTERVAL 30 DAY);
        SET previousEnd   = DATE_SUB(currentStart, INTERVAL 1 DAY);

    ELSEIF periodIN = 'year' THEN
        SET currentStart  = DATE_SUB(CURDATE(), INTERVAL 365 DAY);
        SET currentEnd    = CURDATE();
        SET previousStart = DATE_SUB(currentStart, INTERVAL 365 DAY);
        SET previousEnd   = DATE_SUB(currentStart, INTERVAL 1 DAY);
    END IF;

    SELECT
        COALESCE(SUM(CASE
            WHEN DATE(`start_time`) BETWEEN currentStart AND currentEnd
            THEN `price` ELSE 0
        END), 0) AS current_revenue,

        COALESCE(SUM(CASE
            WHEN DATE(`start_time`) BETWEEN previousStart AND previousEnd
            THEN `price` ELSE 0
        END), 0) AS previous_revenue,

        'HUF' AS currency

    FROM `appointments`
    WHERE `company_id` = companyIdIN
      AND `status` IN ('completed', 'confirmed')
      AND DATE(`start_time`) BETWEEN previousStart AND currentEnd;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getSalesRevenueChart` (IN `companyIdIN` INT, IN `periodIN` ENUM('week','month','year'))   BEGIN
    DECLARE dateFrom DATE;
    DECLARE dateTo DATE;

    IF periodIN = 'week' THEN
        SET dateFrom = DATE_SUB(CURDATE(), INTERVAL 7 DAY);
        SET dateTo   = CURDATE();

    ELSEIF periodIN = 'month' THEN
        SET dateFrom = DATE_SUB(CURDATE(), INTERVAL 30 DAY);
        SET dateTo   = CURDATE();

    ELSEIF periodIN = 'year' THEN
        SET dateFrom = DATE_SUB(CURDATE(), INTERVAL 365 DAY);
        SET dateTo   = CURDATE();
    END IF;

    IF periodIN IN ('week', 'month') THEN

        SELECT
            `d`.`day`                          AS `date`,
            DAYNAME(`d`.`day`)                 AS `day_name`,

            CASE
                WHEN EXISTS (
                    SELECT 1 FROM `temporary_closed_periods` `tcp`
                    WHERE `tcp`.`company_id` = companyIdIN
                      AND `d`.`day` BETWEEN `tcp`.`start_date` AND `tcp`.`end_date`
                      AND `tcp`.`open_time` IS NULL
                ) THEN NULL

                WHEN (
                    SELECT `oh`.`is_closed`
                    FROM `opening_hours` `oh`
                    WHERE `oh`.`company_id` = companyIdIN
                      AND `oh`.`day_of_week` = LOWER(DAYNAME(`d`.`day`))
                    LIMIT 1
                ) = 1 THEN NULL

                ELSE COALESCE((
                    SELECT SUM(`a`.`price`)
                    FROM `appointments` `a`
                    WHERE `a`.`company_id` = companyIdIN
                      AND DATE(`a`.`start_time`) = `d`.`day`
                      AND `a`.`status` IN ('completed', 'confirmed')
                ), 0)
            END AS `revenue`,

            'HUF' AS `currency`

        FROM (
            SELECT DATE_ADD(dateFrom, INTERVAL seq DAY) AS `day`
            FROM (
                SELECT 0 AS seq UNION SELECT 1 UNION SELECT 2 UNION SELECT 3
                UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7
                UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11
                UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15
                UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19
                UNION SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23
                UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 UNION SELECT 27
                UNION SELECT 28 UNION SELECT 29 UNION SELECT 30
            ) `seq`
            WHERE DATE_ADD(dateFrom, INTERVAL seq DAY) <= dateTo
        ) `d`
        ORDER BY `d`.`day` ASC;

    ELSE

        SELECT
            DATE_FORMAT(`d`.`month`, '%Y-%m') AS `month`,
            COALESCE(SUM(`a`.`price`), 0)     AS `revenue`,
            'HUF'                              AS `currency`

        FROM (
            SELECT DATE_ADD(dateFrom, INTERVAL seq MONTH) AS `month`
            FROM (
                SELECT 0 AS seq UNION SELECT 1 UNION SELECT 2 UNION SELECT 3
                UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7
                UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11
            ) `seq`
            WHERE DATE_ADD(dateFrom, INTERVAL seq MONTH) <= dateTo
        ) `d`
        LEFT JOIN `appointments` `a`
            ON `a`.`company_id` = companyIdIN
            AND DATE_FORMAT(`a`.`start_time`, '%Y-%m') = DATE_FORMAT(`d`.`month`, '%Y-%m')
            AND `a`.`status` IN ('completed', 'confirmed')
        GROUP BY `d`.`month`
        ORDER BY `d`.`month` ASC;

    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getSalesTopServices` (IN `companyIdIN` INT, IN `periodIN` ENUM('week','month','year'))   BEGIN
    DECLARE dateFrom DATE;
    DECLARE dateTo DATE;

    IF periodIN = 'week' THEN
        SET dateFrom = DATE_SUB(CURDATE(), INTERVAL 6 DAY);
        SET dateTo   = CURDATE();

    ELSEIF periodIN = 'month' THEN
        SET dateFrom = DATE_FORMAT(CURDATE(), '%Y-%m-01');
        SET dateTo   = CURDATE();

    ELSEIF periodIN = 'year' THEN
        SET dateFrom = DATE_FORMAT(CURDATE(), '%Y-01-01');
        SET dateTo   = CURDATE();
    END IF;

    SELECT
        `s`.`id`                        AS `service_id`,
        `s`.`name`                      AS `service_name`,
        COUNT(DISTINCT `a`.`client_id`) AS `client_count`,
        COALESCE(SUM(`a`.`price`), 0)   AS `total_revenue`,
        'HUF'                           AS `currency`

    FROM `appointments` `a`
    INNER JOIN `services` `s` ON `s`.`id` = `a`.`service_id`
    WHERE `a`.`company_id` = companyIdIN
      AND `a`.`status` IN ('completed', 'confirmed')
      AND DATE(`a`.`start_time`) BETWEEN dateFrom AND dateTo
    GROUP BY `s`.`id`, `s`.`name`
    ORDER BY `client_count` DESC
    LIMIT 3;
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `getServiceShort` (IN `idIN` INT)   SELECT 
	`services`.`id`,
    `services`.`company_id`,
    `services`.`name`,
    `services`.`duration_minutes`,
    `services`.`price`,
    `services`.`is_deleted`
FROM `services`
WHERE `services`.`id` = idIN
LIMIT 1$$

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

CREATE DEFINER=`root`@`localhost` PROCEDURE `getStaffShort` (IN `staffIdIN` INT)   SELECT 
	`staff`.`id`,
    `staff`.`user_id`,
    `staff`.`company_id`,
    `staff`.`display_name`,
    `staff`.`is_active`,
    `staff`.`is_deleted`,
    `images`.`url`
FROM `staff`
INNER JOIN `images` ON `images`.`user_id` = `staff`.`user_id`
WHERE `staff`.`id` = staffIdIN AND `images`.`is_deleted` = FALSE
LIMIT 1$$

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

CREATE DEFINER=`root`@`localhost` PROCEDURE `getTokenInfoByToken` (IN `tokenIN` VARCHAR(500))   BEGIN
    SELECT 
        `tokens`.`id`,
        `tokens`.`user_id`,
        `tokens`.`token`,
        `tokens`.`type`,
        `tokens`.`expires_at`,
        `tokens`.`is_revoked`,
        `tokens`.`revoked_at`,
        `tokens`.`created_at`
    FROM `tokens`
    WHERE `tokens`.`token` = tokenIN
    LIMIT 1;
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `getUpcomingAppointmentsByStaffLimited` (IN `staffIdIN` INT, IN `limitIN` INT)   BEGIN
    SELECT 
        `appointments`.`id` AS appointment_id,
        TIME(`appointments`.`start_time`) AS start_time,
        `services`.`name` AS service_name,
        CONCAT(`users`.`first_name`, ' ', `users`.`last_name`) AS client_name,
        `images`.`url` AS client_profile_image
    FROM `appointments`
    INNER JOIN `services` ON `appointments`.`service_id` = `services`.`id`
    INNER JOIN `users` ON `appointments`.`client_id` = `users`.`id`
    LEFT JOIN `images` ON `users`.`id` = `images`.`user_id` 
        AND `images`.`is_deleted` = 0
    WHERE `appointments`.`staff_id` = staffIdIN
      AND DATE(`appointments`.`start_time`) = CURDATE()
      AND `appointments`.`status` IN ('booked', 'in_progress')
    ORDER BY `appointments`.`start_time` ASC
    LIMIT limitIN;
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `getUserFavorites` (IN `userIdIN` INT)   BEGIN
    SELECT 
        `favorites`.`id`,
        `favorites`.`user_id`,
        `favorites`.`company_id`,
        `favorites`.`created_at`        
    FROM `favorites`  
    WHERE `favorites`.`user_id` = userIdIN AND `favorites`.`is_deleted` = FALSE
    
    ORDER BY `favorites`.`created_at` DESC;
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `getUserProfileByEmail` (IN `emailIN` VARCHAR(100))   BEGIN
    SELECT 
        users.id,
        users.first_name,
        users.last_name,
        users.company_id,
        users.email,
        users.phone,
        images.url,
        users.created_at
    FROM users
    LEFT JOIN images ON users.id = images.user_id
    WHERE users.email = emailIN
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `getUserTokensByEmail` (IN `userEmailIN` VARCHAR(100))   BEGIN
    SELECT 
        t.`id`,
        t.`token`,
        t.`type`,
        t.`expires_at`,
        t.`is_revoked`
    FROM `tokens` t
    INNER JOIN `users` u ON t.`user_id` = u.`id`
    WHERE u.`email` = userEmailIN
    ORDER BY t.`id` ASC;
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `logAudit` (IN `performedByUserIdIN` INT, IN `performedByRoleIN` VARCHAR(50), IN `affectedEntityIdIN` INT, IN `companyIdIN` INT, IN `emailIN` VARCHAR(100), IN `entityTypeIN` VARCHAR(50), IN `actionIN` VARCHAR(100), IN `oldValuesIN` JSON, IN `newValuesIN` JSON)   BEGIN
    INSERT INTO audit_logs (
        performed_by_user_id,
        performed_by_role,
        affected_entity_id,
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
        affectedEntityIdIN,
        companyIdIN,
        emailIN,
        entityTypeIN,
        actionIN,
        oldValuesIN,
        newValuesIN,
        NOW()
    );
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `login` (IN `emailIN` VARCHAR(100))   BEGIN
    SELECT 
        `users`.`id`,
        `users`.`first_name`,
        `users`.`last_name`,
        `users`.`email`,
        `users`.`password`,
       	`users`.`phone`,
        `users`.`company_id`,
        `images`.`url` AS "imageUrl",
        GROUP_CONCAT(`roles`.`name` SEPARATOR ', ') AS "roles"
    FROM `users`
    INNER JOIN `user_x_role` ON `user_x_role`.`user_id` = `users`.`id`
    INNER JOIN `roles` ON `roles`.`id` = `user_x_role`.`role_id`
    

    LEFT JOIN `images` ON `images`.`user_id` = `users`.id 
                       AND `images`.`is_deleted` = FALSE
    
    WHERE `users`.`email` = emailIN
      AND `users`.`is_deleted` = FALSE
      AND `user_x_role`.`is_un_assigned` = FALSE
    GROUP BY `users`.`id`, `images`.`id`
    LIMIT 1;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `registerClient` (IN `firstNameIN` VARCHAR(100), IN `lastNameIN` VARCHAR(100), IN `emailIN` VARCHAR(100), IN `passwordIN` TEXT, IN `phoneIN` VARCHAR(30))   BEGIN
    DECLARE newUserId INT;
    DECLARE roleId INT;
    DECLARE regToken VARCHAR(64);
    
    -- Reg token generálása
    SET regToken = MD5(CONCAT(emailIN, NOW(), RAND()));
    
    -- Role ID lekérése a role name alapján
    SELECT `id` INTO roleId 
    FROM `roles` 
    WHERE `name` = "client"
    LIMIT 1;
    
    -- Ellenőrzés: létezik-e a role
    IF roleId IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid role name';
    END IF;
    
    -- User létrehozása
    INSERT INTO `users` (
        `first_name`,
        `last_name`,
        `email`,
        `password`,
        `phone`,
        `is_active`
    )
    VALUES (
        firstNameIN,
        lastNameIN,
        emailIN,
        passwordIN,
        phoneIN,
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
    
    -- Notification Settings values
    INSERT INTO `notification_settings` (
        `user_id`
    )
    VALUES (
        newUserId
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `registerOwner` (IN `firstNameIN` VARCHAR(100), IN `lastNameIN` VARCHAR(100), IN `emailIN` VARCHAR(100), IN `passwordIN` TEXT, IN `phoneIN` VARCHAR(30), IN `companyNameIN` VARCHAR(255), IN `companyDescriptionIN` TEXT, IN `companyAddressIN` TEXT, IN `companyCityIN` VARCHAR(100), IN `companyPostalCodeIN` VARCHAR(20), IN `companyCountryIN` VARCHAR(100), IN `companyPhoneIN` VARCHAR(30), IN `companyEmailIN` VARCHAR(100), IN `companyWebsiteIN` VARCHAR(255))   BEGIN
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `registerStaff` (IN `firstNameIN` VARCHAR(100), IN `lastNameIN` VARCHAR(100), IN `emailIN` VARCHAR(100), IN `passwordIN` TEXT, IN `phoneIN` VARCHAR(30), IN `companyIdIN` INT)   BEGIN
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `resetPasswordWithToken` (IN `tokenIN` VARCHAR(500), IN `newPasswordIN` TEXT)   BEGIN
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateAppointmentStatus` (IN `appointmentIdIN` INT, IN `newStatusIN` ENUM('booked','in_progress','cancelled','completed','no_show'))   BEGIN
    UPDATE `appointments`
    SET `status` = newStatusIN, `updated_at` = NOW()
    WHERE `id` = appointmentIdIN;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateBusinessCategory` (IN `idIN` INT, IN `nameIN` VARCHAR(100), IN `descriptionIN` TEXT)   BEGIN
    UPDATE `business_categories`
    SET 
        `business_categories`.`name` = nameIN,
        `business_categories`.`description` = descriptionIN,
        `business_categories`.`updated_at` = NOW()
    WHERE `business_categories`.`id` = idIN
      AND `business_categories`.`is_active` = TRUE;
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateNotificationSetting` (IN `userIdIN` INT, IN `confIN` BOOLEAN, IN `remindIN` BOOLEAN, IN `cancellIN` BOOLEAN, IN `marketingIN` BOOLEAN)   BEGIN
    UPDATE `notification_settings`
    SET 
        `notification_settings`.`appointment_confirmation` = confIN,
        `notification_settings`.`appointment_reminder` = remindIN,
        `notification_settings`.`appointment_cancellation` = cancellIN,
        `notification_settings`.`marketing_emails` = marketingIN,
        `notification_settings`.`updated_at` = NOW()
    WHERE `notification_settings`.`user_id` = userIdIN;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateOpeningHoursDay` (IN `companyIdIN` INT, IN `dayOfWeekIN` ENUM('monday','tuesday','wednesday','thursday','friday','saturday','sunday'), IN `openTimeIN` TIME, IN `closeTimeIN` TIME, IN `isClosedIN` TINYINT(1))   BEGIN
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateStaffWorkingHours` (IN `staffIdIN` INT, IN `dayOfWeekIN` ENUM('monday','tuesday','wednesday','thursday','friday','saturday','sunday'), IN `startTimeIN` TIME, IN `endTimeIN` TIME, IN `isAvailableIN` TINYINT(1))   BEGIN
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateUser` (IN `userIdIN` INT, IN `firstNameIN` VARCHAR(100), IN `lastNameIN` VARCHAR(100), IN `phoneIN` VARCHAR(30), IN `emailIN` VARCHAR(100))   BEGIN
    UPDATE `users`
    SET 
        `first_name` = firstNameIN,
        `last_name` = lastNameIN,
        `phone` = phoneIN,
        `email` = emailIN,
        `updated_at` = NOW()
    WHERE `id` = userIdIN
      AND `is_deleted` = FALSE;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `uploadCompanyImage` (IN `companyIdIN` INT, IN `urlIN` TEXT, IN `isMainIN` TINYINT(1))   BEGIN
    DECLARE currentImageCount INT;
    DECLARE mainUrl VARCHAR(100);
    DECLARE isMainNull TINYINT;
    
    SET isMainNull = FALSE;
    
    -- Ellenőrzi, hogy hány aktív képe van a cégnek
    SELECT COUNT(*) INTO currentImageCount
    FROM `images`
    WHERE `company_id` = companyIdIN
      AND `is_deleted` = FALSE;
    
    -- Maximum 4 kép lehet
    IF currentImageCount >= 4 AND isMainIN = FALSE THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Maximum 4 images allowed per company';
    END IF;
    
    SELECT `url` INTO mainUrl
    FROM `images`
    WHERE `company_id` = companyIdIN 
      AND `is_deleted` = FALSE 
      AND `is_main` = TRUE;
    
    IF mainUrl IS NULL THEN
        SET isMainNull = TRUE;
    END IF;
    
    -- Ha main képnek jelöljük
    IF isMainIN = TRUE AND isMainNull = TRUE THEN
        -- Van main image de URL NULL -> csak UPDATE-eljük az URL-t
        UPDATE `images`
        SET `url` = urlIN
        WHERE `company_id` = companyIdIN 
          AND `is_main` = TRUE
          AND `is_deleted` = FALSE;
    ELSEIF isMainIN = TRUE AND isMainNull = FALSE THEN
        -- Van main image és van URL -> soft delete + új INSERT
        UPDATE `images`
        SET `is_deleted` = TRUE,
            `deleted_at` = NOW()
        WHERE `company_id` = companyIdIN 
          AND `is_main` = TRUE
          AND `is_deleted` = FALSE;
          
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
            TRUE
        );
    ELSEIF isMainIN = FALSE THEN
        -- Nem main kép -> sima INSERT
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
            FALSE
        );
    END IF;
    
    -- Visszaadjuk az új/frissített kép ID-t
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `validatePasswordResetToken` (IN `tokenIN` VARCHAR(500))   BEGIN
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

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `service_id` int NOT NULL,
  `staff_id` int NOT NULL,
  `client_id` int NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `status` enum('booked','in_progress','completed','no_show','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci NOT NULL DEFAULT 'booked',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci,
  `internal_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci COMMENT 'Visible only to staff/admin',
  `price` decimal(10,2) NOT NULL,
  `currency` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci NOT NULL,
  `cancelled_by` int DEFAULT NULL,
  `cancelled_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci,
  `cancelled_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`id`, `company_id`, `service_id`, `staff_id`, `client_id`, `start_time`, `end_time`, `status`, `notes`, `internal_notes`, `price`, `currency`, `cancelled_by`, `cancelled_reason`, `cancelled_at`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, 1, '2026-02-24 11:00:00', '2026-02-24 11:45:00', 'booked', '', NULL, 7000.00, 'HUF', NULL, NULL, NULL, '2026-02-22 23:12:41', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int NOT NULL,
  `performed_by_user_id` int NOT NULL,
  `performed_by_role` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `affected_entity_id` int DEFAULT NULL,
  `company_id` int DEFAULT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `entity_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci DEFAULT NULL COMMENT 'appointment, user, company, service, etc.',
  `action` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci NOT NULL COMMENT 'create, update, delete, login, etc.',
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `performed_by_user_id`, `performed_by_role`, `affected_entity_id`, `company_id`, `email`, `entity_type`, `action`, `old_values`, `new_values`, `created_at`) VALUES
(1, 1, 'client', NULL, NULL, 'vasvariben@gmail.com', 'user', 'register', NULL, '{\"role\": \"client\", \"email\": \"vasvariben@gmail.com\", \"user_id\": 1, \"last_name\": \"Vasvári\", \"first_name\": \"Benjámin\"}', '2026-02-22 19:40:46'),
(2, 1, NULL, NULL, NULL, 'vasvariben@gmail.com', 'user', 'email_verified', NULL, NULL, '2026-02-22 19:43:44'),
(3, 1, 'client', 1, NULL, 'vasvariben@gmail.com', 'user', 'login', NULL, NULL, '2026-02-22 19:45:30'),
(4, 1, 'superadmin', 1, NULL, 'vasvariben@gmail.com', 'user', 'login', NULL, NULL, '2026-02-22 19:46:38'),
(5, 1, 'superadmin', 1, NULL, 'vasvariben@gmail.com', 'user', 'logout', NULL, NULL, '2026-02-22 19:46:47'),
(6, 2, 'client', NULL, NULL, 'jungle@jungle.hu', 'user', 'register', NULL, '{\"role\": \"client\", \"email\": \"jungle@jungle.hu\", \"user_id\": 2, \"last_name\": \"Jungle\", \"first_name\": \"Tulaj\"}', '2026-02-22 19:47:44'),
(7, 2, NULL, NULL, NULL, 'jungle@jungle.hu', 'user', 'email_verified', NULL, NULL, '2026-02-22 19:48:36'),
(8, 2, 'client', 2, NULL, 'jungle@jungle.hu', 'user', 'login', NULL, NULL, '2026-02-22 19:48:42'),
(9, 1, 'superadmin', 1, NULL, 'vasvariben@gmail.com', 'user', 'login', NULL, NULL, '2026-02-22 19:51:38'),
(10, 1, 'vasvariben@gmail.com', 1, NULL, 'vasvariben@gmail.com', 'BusinessCategory', 'create', NULL, '{\"id\": 1, \"name\": \"Haj és Hajformázás\", \"description\": \"Hát ez egy fodrászat\"}', '2026-02-22 19:51:51'),
(11, 2, 'client', 2, NULL, 'jungle@jungle.hu', 'user', 'logout', NULL, NULL, '2026-02-22 20:24:53'),
(12, 2, 'client', 2, NULL, 'jungle@jungle.hu', 'user', 'login', NULL, NULL, '2026-02-22 20:37:53'),
(13, 2, 'client', 1, NULL, 'jungle@jungle.hu', 'company', 'create', NULL, '{\"city\": \"Pécs\", \"name\": \"Jungle Pécs\", \"email\": \"jungle@jungle.hu\", \"phone\": \"+36203482974\", \"address\": \"Koller utca 7\", \"country\": \"Magyarország\", \"ownerId\": 2, \"postalCode\": \"7626\", \"description\": \"Ahol TE vagy a lényeg! Próbáld ki bármelyik szolgáltatásunkat, nem fogsz csalódni. Szakmai tudásunk folyamatos fejlesztése nagyon fontos számunkra. Itt kerülsz TE a középpontba! Szolgáltatásaink során figyelünk az egyéniségedre, fejformádra, hajtípusodra és persze a kezelhetőségre is. Várunk sok szeretettel szalonunkban!\", \"cancellationHours\": 24, \"bookingAdvanceDays\": 90, \"businessCategoryId\": 1, \"allowSameDayBooking\": false}', '2026-02-22 20:39:33'),
(14, 2, 'client', 2, NULL, 'jungle@jungle.hu', 'user', 'logout', NULL, NULL, '2026-02-22 20:39:41'),
(15, 2, 'owner', 2, 1, 'jungle@jungle.hu', 'user', 'login', NULL, NULL, '2026-02-22 20:40:05'),
(16, 2, 'owner', 2, 1, 'jungle@jungle.hu', 'user', 'login', NULL, NULL, '2026-02-22 20:43:54'),
(17, 2, 'owner', 2, 1, 'jungle@jungle.hu', 'user', 'login', NULL, NULL, '2026-02-22 20:45:31'),
(18, 2, 'owner', NULL, 1, 'jungle@jungle.hu', 'company', 'uploadedMainImage', NULL, NULL, '2026-02-22 20:46:06'),
(19, 2, 'owner', NULL, 1, 'jungle@jungle.hu', 'company', 'uploadedImage', NULL, NULL, '2026-02-22 20:47:09'),
(20, 2, 'owner', NULL, 1, 'jungle@jungle.hu', 'company', 'uploadedImage', NULL, NULL, '2026-02-22 20:47:27'),
(21, 2, 'owner', NULL, 1, 'jungle@jungle.hu', 'company', 'uploadedImage', NULL, NULL, '2026-02-22 20:47:36'),
(22, 2, 'owner', 2, 1, 'jungle@jungle.hu', 'user', 'logout', NULL, NULL, '2026-02-22 20:53:34'),
(23, 3, 'client', NULL, NULL, 'kerekes@kriszto.hu', 'user', 'register', NULL, '{\"role\": \"client\", \"email\": \"kerekes@kriszto.hu\", \"user_id\": 3, \"last_name\": \"Kerekes\", \"first_name\": \"Krisztofer\"}', '2026-02-22 21:37:08'),
(24, 3, NULL, NULL, NULL, 'kerekes@kriszto.hu', 'user', 'email_verified', NULL, NULL, '2026-02-22 21:38:31'),
(25, 3, 'client', 3, NULL, 'kerekes@kriszto.hu', 'user', 'login', NULL, NULL, '2026-02-22 21:38:48'),
(26, 3, 'client', NULL, NULL, 'kerekes@kriszto.hu', 'user', 'uploadProfileImage', NULL, NULL, '2026-02-22 21:41:53'),
(27, 3, 'client', 3, NULL, 'kerekes@kriszto.hu', 'user', 'logout', NULL, NULL, '2026-02-22 21:42:51'),
(28, 3, 'client', 3, NULL, 'kerekes@kriszto.hu', 'user', 'login', NULL, NULL, '2026-02-22 21:43:30'),
(29, 3, 'client', 3, NULL, 'kerekes@kriszto.hu', 'user', 'logout', NULL, NULL, '2026-02-22 21:43:42'),
(30, 3, 'client', 3, NULL, 'kerekes@kriszto.hu', 'user', 'login', NULL, NULL, '2026-02-22 21:44:22'),
(31, 3, 'client', 3, NULL, 'kerekes@kriszto.hu', 'user', 'logout', NULL, NULL, '2026-02-22 21:45:59'),
(32, 3, 'staff', 3, 1, 'kerekes@kriszto.hu', 'user', 'login', NULL, NULL, '2026-02-22 21:46:11'),
(33, 1, 'superadmin', 1, NULL, 'vasvariben@gmail.com', 'user', 'login', NULL, NULL, '2026-02-22 22:12:28'),
(34, 1, 'superadmin', NULL, NULL, 'vasvariben@gmail.com', 'user', 'bookAppointment', NULL, '{\"notes\": \"\", \"price\": 7000, \"endTime\": \"2026-02-24 11:45:00.0\", \"staffId\": 1, \"clientId\": 1, \"companyId\": 1, \"serviceId\": 1, \"startTime\": \"2026-02-24 11:00:00.0\"}', '2026-02-22 22:12:41'),
(35, 1, 'superadmin', 1, NULL, 'vasvariben@gmail.com', 'user', 'logout', NULL, NULL, '2026-02-22 22:13:58'),
(36, 2, 'owner', 2, 1, 'jungle@jungle.hu', 'user', 'login', NULL, NULL, '2026-02-22 22:14:20');

-- --------------------------------------------------------

--
-- Table structure for table `business_categories`
--

CREATE TABLE `business_categories` (
  `id` int NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  `icon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `business_categories`
--

INSERT INTO `business_categories` (`id`, `name`, `description`, `is_active`, `created_at`, `updated_at`, `icon`) VALUES
(1, 'Haj és Hajformázás', 'Hát ez egy fodrászat', 1, '2026-02-22 19:51:51', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `companies`
--

CREATE TABLE `companies` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci,
  `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `postal_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `country` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci DEFAULT 'Hungary',
  `phone` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `website` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `business_category_id` int DEFAULT NULL,
  `owner_id` int NOT NULL,
  `booking_advance_days` int DEFAULT '30' COMMENT 'How many days in advance bookings can be made',
  `cancellation_hours` int DEFAULT '24' COMMENT 'How many hours before appointment can be canceled',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `allow_same_day_booking` tinyint(1) DEFAULT '1' COMMENT 'Can clients book appointments on the same day? TRUE = yes, FALSE = only next day onwards',
  `minimum_booking_hours_ahead` int DEFAULT '2' COMMENT 'If same-day booking allowed, minimum hours in advance (e.g. 2 hours). Only used if allow_same_day_booking = TRUE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `companies`
--

INSERT INTO `companies` (`id`, `name`, `description`, `address`, `city`, `postal_code`, `country`, `phone`, `email`, `website`, `business_category_id`, `owner_id`, `booking_advance_days`, `cancellation_hours`, `created_at`, `updated_at`, `deleted_at`, `is_deleted`, `is_active`, `allow_same_day_booking`, `minimum_booking_hours_ahead`) VALUES
(1, 'Jungle Pécs', 'Ahol TE vagy a lényeg! Próbáld ki bármelyik szolgáltatásunkat, nem fogsz csalódni. Szakmai tudásunk folyamatos fejlesztése nagyon fontos számunkra. Itt kerülsz TE a középpontba! Szolgáltatásaink során figyelünk az egyéniségedre, fejformádra, hajtípusodra és persze a kezelhetőségre is. Várunk sok szeretettel szalonunkban!', 'Koller utca 7', 'Pécs', '7626', 'Magyarország', '+36203482974', 'jungle@jungle.hu', NULL, 1, 2, 90, 24, '2026-02-22 21:39:33', NULL, NULL, 0, 1, 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `favorites`
--

CREATE TABLE `favorites` (
  `id` int NOT NULL,
  `user_id` int NOT NULL COMMENT 'A felhasználó aki kedvencnek jelölte',
  `company_id` int NOT NULL COMMENT 'A kedvencnek jelölt cég',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Mikor lett kedvenc',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT 'Mikor lett törölve',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Soft delete flag'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------

--
-- Table structure for table `images`
--

CREATE TABLE `images` (
  `id` int NOT NULL,
  `company_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `url` text CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci,
  `is_main` tinyint NOT NULL DEFAULT '0',
  `uploaded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `images`
--

INSERT INTO `images` (`id`, `company_id`, `user_id`, `url`, `is_main`, `uploaded_at`, `deleted_at`, `is_deleted`) VALUES
(1, NULL, 1, NULL, 0, '2026-02-22 19:40:46', NULL, 0),
(2, NULL, 2, NULL, 0, '2026-02-22 19:47:44', NULL, 0),
(3, 1, NULL, 'uploads/companies/1/7b499da7-eada-4972-a5c5-73f7f0d231fa.jpg', 1, '2026-02-22 20:39:33', NULL, 0),
(4, 1, NULL, 'uploads/companies/1/c4499e61-b454-426c-b10a-190d03e4ad3b.jpg', 0, '2026-02-22 20:47:09', NULL, 0),
(5, 1, NULL, 'uploads/companies/1/831d9701-e94c-46d6-9fa4-339530751bb3.jpg', 0, '2026-02-22 20:47:27', NULL, 0),
(6, 1, NULL, 'uploads/companies/1/770b0caf-fec5-413d-847a-03f9dbf293e5.jpg', 0, '2026-02-22 20:47:36', NULL, 0),
(7, NULL, 3, NULL, 0, '2026-02-22 21:37:08', '2026-02-22 21:41:53', 1),
(8, NULL, 3, 'uploads/users/3/885857a2-4aaf-45c5-aa90-908c10befd24.jpg', 0, '2026-02-22 21:41:53', NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `notification_settings`
--

CREATE TABLE `notification_settings` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `appointment_confirmation` tinyint(1) NOT NULL DEFAULT '1',
  `appointment_reminder` tinyint(1) NOT NULL DEFAULT '1',
  `appointment_cancellation` tinyint(1) NOT NULL DEFAULT '1',
  `marketing_emails` tinyint(1) NOT NULL DEFAULT '0',
  `updated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `userId` tinyblob
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `notification_settings`
--

INSERT INTO `notification_settings` (`id`, `user_id`, `appointment_confirmation`, `appointment_reminder`, `appointment_cancellation`, `marketing_emails`, `updated_at`, `created_at`, `userId`) VALUES
(1, 1, 1, 1, 1, 0, NULL, '2026-02-22 19:40:46', NULL),
(2, 2, 1, 1, 1, 0, NULL, '2026-02-22 19:47:44', NULL),
(3, 3, 1, 1, 1, 0, NULL, '2026-02-22 21:37:08', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `opening_hours`
--

CREATE TABLE `opening_hours` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `day_of_week` enum('monday','tuesday','wednesday','thursday','friday','saturday','sunday') CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci NOT NULL,
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
(1, 1, 'monday', NULL, NULL, 1, '2026-02-22 20:39:33', NULL),
(2, 1, 'tuesday', '08:00:00', '19:00:00', 0, '2026-02-22 20:39:33', NULL),
(3, 1, 'wednesday', '08:00:00', '19:00:00', 0, '2026-02-22 20:39:33', NULL),
(4, 1, 'thursday', '08:00:00', '19:00:00', 0, '2026-02-22 20:39:33', NULL),
(5, 1, 'friday', '08:00:00', '19:00:00', 0, '2026-02-22 20:39:33', NULL),
(6, 1, 'saturday', '08:00:00', '19:00:00', 0, '2026-02-22 20:39:33', NULL),
(7, 1, 'sunday', NULL, NULL, 1, '2026-02-22 20:39:33', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `pending_staff`
--

CREATE TABLE `pending_staff` (
  `id` int NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci NOT NULL,
  `company_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `token_id` int NOT NULL,
  `position` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `client_id` int NOT NULL,
  `appointment_id` int DEFAULT NULL,
  `rating` int NOT NULL COMMENT '1-5 stars',
  `comment` text CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int NOT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`, `updated_at`, `deleted_at`, `is_deleted`, `created_at`) VALUES
(1, 'superadmin', 'Teljes hozzáférés az összes rendszer funkcióhoz és minden céghez', NULL, NULL, 0, '2026-02-22 20:00:00'),
(2, 'owner', 'Cég szintű adminisztrátor, teljes hozzáférés a saját céghez', NULL, NULL, 0, '2026-02-22 20:00:00'),
(3, 'staff', 'Munkatárs, aki szolgáltatásokat nyújt és időpontokat kezel', NULL, NULL, 0, '2026-02-22 20:00:00'),
(4, 'client', 'Ügyfél, aki időpontokat foglal', NULL, NULL, 0, '2026-02-22 20:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

CREATE TABLE `services` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci,
  `duration_minutes` int NOT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `currency` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
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
(1, 1, 'Hajvágás / Haircut', 'füstölni fog a cut', 45, 7000.00, 'HUF', 1, '2026-02-22 22:11:56', NULL, NULL, 0),
(2, 1, 'Hosszú hajvágás / Long Haircut', 'levágják a hosszú hajad', 60, 10000.00, 'HUF', 1, '2026-02-22 22:15:45', NULL, NULL, 0),
(3, 1, 'Hajvágás & Szakáll Igazítás / Haircut & Beard Trim', 'megnyírnak mindenhol', 70, 11000.00, 'HUF', 1, '2026-02-22 22:18:09', NULL, NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `service_categories`
--

CREATE TABLE `service_categories` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `service_categories`
--

INSERT INTO `service_categories` (`id`, `company_id`, `name`, `description`, `created_at`, `updated_at`) VALUES
(1, 1, 'Férfi Hajvágás / Men\'s haircut', 'levágják a hajad ha férfi vagy', '2026-02-22 21:04:47', NULL),
(2, 1, 'Haj & Szakáll / Hair & Beard', 'hajvágás és szakáll nyírás egybekötve', '2026-02-22 21:06:20', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `service_category_map`
--

CREATE TABLE `service_category_map` (
  `id` int NOT NULL,
  `service_id` int NOT NULL,
  `category_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `service_category_map`
--

INSERT INTO `service_category_map` (`id`, `service_id`, `category_id`, `created_at`) VALUES
(1, 1, 1, '2026-02-22 21:20:00'),
(2, 2, 1, '2026-02-22 21:20:26'),
(3, 3, 2, '2026-02-22 21:20:38');

-- --------------------------------------------------------

--
-- Table structure for table `staff`
--

CREATE TABLE `staff` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `company_id` int NOT NULL,
  `display_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `specialties` text CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci,
  `bio` text CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci,
  `color` char(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `staff`
--

INSERT INTO `staff` (`id`, `user_id`, `company_id`, `display_name`, `specialties`, `bio`, `color`, `is_active`, `is_deleted`, `created_at`, `updated_at`) VALUES
(1, 3, 1, 'Kriszto', 'Senior Stylist', NULL, NULL, 1, 0, '2026-02-22 22:52:54', NULL);

--
-- Triggers `staff`
--
DELIMITER $$
CREATE TRIGGER `after_staff_insert` AFTER INSERT ON `staff` FOR EACH ROW BEGIN
    DELETE FROM `pending_staff` 
    WHERE `email` = (
        SELECT `email` FROM `users` WHERE `id` = NEW.user_id
    );
END
$$
DELIMITER ;
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
  `id` int NOT NULL,
  `staff_id` int NOT NULL,
  `date` date NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `type` enum('day_off','custom_hours') CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci NOT NULL COMMENT 'teljes szabi vagy egyedi időablak',
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------

--
-- Table structure for table `staff_services`
--

CREATE TABLE `staff_services` (
  `id` int NOT NULL,
  `staff_id` int NOT NULL,
  `service_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `staff_services`
--

INSERT INTO `staff_services` (`id`, `staff_id`, `service_id`, `created_at`) VALUES
(3, 1, 1, '2026-02-22 21:53:16');

-- --------------------------------------------------------

--
-- Table structure for table `staff_working_hours`
--

CREATE TABLE `staff_working_hours` (
  `id` int NOT NULL,
  `staff_id` int NOT NULL,
  `day_of_week` enum('monday','tuesday','wednesday','thursday','friday','saturday','sunday') CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci NOT NULL,
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
(1, 1, 'monday', NULL, NULL, 0, '2026-02-22 21:59:11', NULL),
(2, 1, 'tuesday', '08:00:00', '19:00:00', 1, '2026-02-22 21:59:11', NULL),
(3, 1, 'wednesday', '08:00:00', '19:00:00', 1, '2026-02-22 21:59:11', NULL),
(4, 1, 'thursday', '08:00:00', '19:00:00', 1, '2026-02-22 21:59:11', NULL),
(5, 1, 'friday', '08:00:00', '19:00:00', 1, '2026-02-22 21:59:11', NULL),
(6, 1, 'saturday', '08:00:00', '19:00:00', 1, '2026-02-22 21:59:11', NULL),
(7, 1, 'sunday', NULL, NULL, 0, '2026-02-22 21:59:11', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `temporary_closed_periods`
--

CREATE TABLE `temporary_closed_periods` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `open_time` time DEFAULT NULL,
  `close_time` time DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tokens`
--

CREATE TABLE `tokens` (
  `id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `token` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci NOT NULL,
  `type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_revoked` tinyint(1) NOT NULL DEFAULT '0',
  `revoked_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `tokens`
--

INSERT INTO `tokens` (`id`, `user_id`, `token`, `type`, `expires_at`, `is_revoked`, `revoked_at`, `created_at`) VALUES
(1, 1, 'c721e12fcbddd3a4254911fd74a9a2ad', 'email_verify', '2026-02-23 20:40:46', 1, '2026-02-22 20:43:44', '2026-02-22 20:40:46'),
(2, 2, 'f373de1981fa13c243f4f0f5e5aeb071', 'email_verify', '2026-02-23 20:47:44', 1, '2026-02-22 20:48:36', '2026-02-22 20:47:44'),
(3, 3, 'b47063059ac9f499cc915a422000ef1e', 'email_verify', '2026-02-23 22:37:08', 1, '2026-02-22 22:38:31', '2026-02-22 22:37:08');

-- --------------------------------------------------------

--
-- Table structure for table `two_factor_recovery_codes`
--

CREATE TABLE `two_factor_recovery_codes` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `code` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci NOT NULL COMMENT 'Hashed recovery code',
  `used_at` datetime DEFAULT NULL,
  `is_used` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `guid` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci NOT NULL,
  `first_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `last_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci DEFAULT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci NOT NULL,
  `password` text CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci NOT NULL,
  `phone` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci NOT NULL,
  `company_id` int DEFAULT NULL COMMENT 'NULL for superadmins or independent clients',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `last_login` datetime DEFAULT NULL,
  `register_finished_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Admins can deactivate users',
  `two_factor_enabled` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Whether 2FA is enabled',
  `two_factor_secret` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci DEFAULT NULL COMMENT 'TOTP secret key (encrypted)',
  `two_factor_confirmed_at` datetime DEFAULT NULL COMMENT 'When 2FA was confirmed/activated',
  `two_factor_recovery_codes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `guid`, `first_name`, `last_name`, `email`, `password`, `phone`, `company_id`, `created_at`, `updated_at`, `deleted_at`, `is_deleted`, `last_login`, `register_finished_at`, `is_active`, `two_factor_enabled`, `two_factor_secret`, `two_factor_confirmed_at`, `two_factor_recovery_codes`) VALUES
(1, '6231cba4-1026-11f1-afc2-2178f5682584', 'Benjámin', 'Vasvári', 'vasvariben@gmail.com', '$argon2id$v=19$m=65536,t=3,p=1$nlmx/azGmOP53sKF3tJUwQ$LVWmEY9KjqxX6DWLaU5lL1+Ul7FcXQri/yhpVB5qAOs', '+36704134374', NULL, '2026-02-22 20:40:46', '2026-02-22 20:43:44', NULL, 0, '2026-02-22 23:12:28', '2026-02-22 20:43:44', 1, 0, NULL, NULL, NULL),
(2, '5b5ce1aa-1027-11f1-afc2-2178f5682584', 'Tulaj', 'Jungle', 'jungle@jungle.hu', '$argon2id$v=19$m=65536,t=3,p=1$7gayZE9rh1QYR2KBE+urgg$WPksHWfoAw41UQYIVoGx914oP/VC72tKCepKzYhb0Zw', '+36302433894', 1, '2026-02-22 20:47:44', '2026-02-22 21:39:33', NULL, 0, '2026-02-22 23:14:20', '2026-02-22 20:48:36', 1, 0, NULL, NULL, NULL),
(3, 'a397a37e-1036-11f1-afc2-2178f5682584', 'Krisztofer', 'Kerekes', 'kerekes@kriszto.hu', '$argon2id$v=19$m=65536,t=3,p=1$+gQ0xtich2UV0+NCPcNBjw$0zMS+Ni8EoS+NlHvWxx8H72J4UyeignBRO74ftdmRzU', '+36704923823', 1, '2026-02-22 22:37:08', '2026-02-22 22:45:25', NULL, 0, '2026-02-22 22:46:11', '2026-02-22 22:38:31', 1, 0, NULL, NULL, NULL);

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
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `role_id` int NOT NULL,
  `assigned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `un_assigned_at` timestamp NULL DEFAULT NULL,
  `is_un_assigned` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Dumping data for table `user_x_role`
--

INSERT INTO `user_x_role` (`id`, `user_id`, `role_id`, `assigned_at`, `un_assigned_at`, `is_un_assigned`) VALUES
(1, 1, 4, '2026-02-22 19:40:46', NULL, 0),
(2, 1, 1, '2026-02-22 19:46:23', NULL, 0),
(3, 2, 4, '2026-02-22 19:47:44', NULL, 0),
(4, 2, 2, '2026-02-22 20:39:33', NULL, 0),
(5, 3, 4, '2026-02-22 21:37:08', NULL, 0),
(6, 3, 3, '2026-02-22 21:45:54', NULL, 0);

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
  ADD KEY `fk_audit_affected_user` (`affected_entity_id`);

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
-- Indexes for table `pending_staff`
--
ALTER TABLE `pending_staff`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_pending_staff_company` (`company_id`),
  ADD KEY `fk_pending_staff_token` (`token_id`),
  ADD KEY `fk_pending_staff_user` (`user_id`);

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `business_categories`
--
ALTER TABLE `business_categories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `companies`
--
ALTER TABLE `companies`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `favorites`
--
ALTER TABLE `favorites`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `images`
--
ALTER TABLE `images`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `notification_settings`
--
ALTER TABLE `notification_settings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `opening_hours`
--
ALTER TABLE `opening_hours`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `pending_staff`
--
ALTER TABLE `pending_staff`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `service_categories`
--
ALTER TABLE `service_categories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `service_category_map`
--
ALTER TABLE `service_category_map`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `staff`
--
ALTER TABLE `staff`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `staff_exceptions`
--
ALTER TABLE `staff_exceptions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `staff_services`
--
ALTER TABLE `staff_services`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `staff_working_hours`
--
ALTER TABLE `staff_working_hours`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `temporary_closed_periods`
--
ALTER TABLE `temporary_closed_periods`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tokens`
--
ALTER TABLE `tokens`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `two_factor_recovery_codes`
--
ALTER TABLE `two_factor_recovery_codes`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `user_x_role`
--
ALTER TABLE `user_x_role`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

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
  ADD CONSTRAINT `fk_audit_affected_user` FOREIGN KEY (`affected_entity_id`) REFERENCES `users` (`id`),
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
-- Constraints for table `pending_staff`
--
ALTER TABLE `pending_staff`
  ADD CONSTRAINT `fk_pending_staff_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`),
  ADD CONSTRAINT `fk_pending_staff_token` FOREIGN KEY (`token_id`) REFERENCES `tokens` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pending_staff_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

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

CREATE DEFINER=`root`@`localhost` EVENT `expire_pending_staff` ON SCHEDULE EVERY 1 DAY STARTS '2026-02-18 18:55:41' ON COMPLETION NOT PRESERVE ENABLE DO UPDATE `pending_staff`
    SET `status` = 'lejart'
    WHERE `status` = 'pending'
    AND `created_at` < DATE_SUB(NOW(), INTERVAL 7 DAY)$$

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

CREATE DEFINER=`root`@`localhost` EVENT `cleanOldAuditLogs` ON SCHEDULE EVERY 1 WEEK STARTS '2025-12-12 10:13:56' ON COMPLETION NOT PRESERVE ENABLE DO -- Régi audit logok törlése (365 napnál régebbiek)
    DELETE FROM `audit_logs`
    WHERE `created_at` < DATE_SUB(NOW(), INTERVAL 365 DAY)$$

CREATE DEFINER=`root`@`localhost` EVENT `updateExpiredAppointments` ON SCHEDULE EVERY 1 MINUTE STARTS '2026-02-21 19:12:43' ON COMPLETION PRESERVE ENABLE DO BEGIN
    -- booked -> in_progress ha elkezdődött
    UPDATE `appointments`
    SET `status` = 'in_progress', `updated_at` = NOW()
    WHERE `status` = 'booked'
      AND `start_time` <= NOW()
      AND `end_time` > NOW();

    -- in_progress -> no_show ha véget ért és nem lett lezárva
    UPDATE `appointments`
    SET `status` = 'no_show', `updated_at` = NOW()
    WHERE `status` IN ('booked', 'in_progress')
      AND `end_time` <= NOW();
END$$

DELIMITER ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
