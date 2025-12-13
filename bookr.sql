-- phpMyAdmin SQL Dump
-- version 5.1.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3307
-- Generation Time: Dec 13, 2025 at 03:33 PM
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `cancelExpiredPendingAppointments` ()   BEGIN
    -- Pending appointmentek amelyek start_time-ja elmúlt
    UPDATE appointments
    SET 
        status = 'no_show',
        updated_at = NOW()
    WHERE status = 'pending'
      AND start_time < NOW();
    
    -- Visszaadja hány sort módosított
    SELECT ROW_COUNT() AS updated_appointments;
    
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `createAppointment` (IN `companyIdIN` INT, IN `serviceIdIN` INT, IN `staffIdIN` INT, IN `clientIdIN` INT, IN `startTimeIN` DATETIME, IN `endTimeIN` DATETIME, IN `notesIN` TEXT, IN `priceIN` DECIMAL(10,2), IN `currencyIN` VARCHAR(10))   BEGIN
    DECLARE newAppointmentId INT;
    
    -- Időpont létrehozása
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
    
    -- Visszaadjuk az új appointment ID-t
    SELECT newAppointmentId AS appointment_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createCompany` (IN `nameIN` VARCHAR(255), IN `descriptionIN` TEXT, IN `addressIN` TEXT, IN `cityIN` VARCHAR(100), IN `postalCodeIN` VARCHAR(20), IN `countryIN` VARCHAR(100), IN `phoneIN` VARCHAR(30), IN `emailIN` VARCHAR(100), IN `websiteIN` VARCHAR(255), IN `ownerIdIN` INT)   BEGIN
    DECLARE newCompanyId INT;
    
    -- Cég létrehozása
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
        `owner_id`
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
        ownerIdIN
    );
    
    -- Új company ID lekérése
    SET newCompanyId = LAST_INSERT_ID();
    
    -- Owner user company_id frissítése
    UPDATE `users`
    SET 
        `company_id` = newCompanyId,
        `updated_at` = NOW()
    WHERE `id` = ownerIdIN;
    
    -- Visszaadjuk az új company ID-t
    SELECT newCompanyId AS company_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createNotification` (IN `userIdIN` INT, IN `typeIN` ENUM('appointment_confirmation','appointment_reminder','appointment_cancellation','appointment_rescheduled','review_request','staff_assignment','system_message','marketing'), IN `titleIN` VARCHAR(255), IN `messageIN` TEXT, IN `relatedAppointmentIdIN` INT, IN `relatedCompanyIdIN` INT, IN `expiresAtIN` DATETIME)   BEGIN
    DECLARE newNotificationId INT;
    
    -- Ellenőrzi, hogy a user létezik
    IF NOT EXISTS (
        SELECT 1 FROM `users` 
        WHERE `id` = userIdIN 
          AND `is_deleted` = FALSE
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User not found or deleted';
    END IF;
    
    -- Ha van appointment_id, ellenőrzi hogy létezik-e
    IF relatedAppointmentIdIN IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM `appointments` 
            WHERE `id` = relatedAppointmentIdIN
        ) THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Related appointment not found';
        END IF;
    END IF;
    
    -- Ha van company_id, ellenőrzi hogy létezik-e
    IF relatedCompanyIdIN IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM `companies` 
            WHERE `id` = relatedCompanyIdIN 
              AND `is_deleted` = FALSE
        ) THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Related company not found or deleted';
        END IF;
    END IF;
    
    -- Notification létrehozása
    INSERT INTO `notifications` (
        `user_id`,
        `type`,
        `title`,
        `message`,
        `related_appointment_id`,
        `related_company_id`,
        `is_read`,
        `expires_at`,
        `created_at`
    )
    VALUES (
        userIdIN,
        typeIN,
        titleIN,
        messageIN,
        relatedAppointmentIdIN,
        relatedCompanyIdIN,
        FALSE,
        expiresAtIN,
        NOW()
    );
    
    -- Új notification ID lekérése
    SET newNotificationId = LAST_INSERT_ID();
    
    -- Visszajelzés
    SELECT 
        'SUCCESS' AS result, 
        'Notification created successfully' AS message,
        newNotificationId AS notification_id;
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `generatePasswordResetToken` (IN `emailIN` VARCHAR(100))   BEGIN
    DECLARE userId INT;
    DECLARE newToken VARCHAR(64);
    
    -- User ID lekérése email alapján
    SELECT `id` INTO userId
    FROM `users`
    WHERE `email` = emailIN
      AND `is_deleted` = FALSE
    LIMIT 1;
    
    IF userId IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User not found';
    END IF;
    
    -- Token generálás
    SET newToken = MD5(CONCAT(emailIN, NOW(), RAND()));
    
    -- Token mentése (15 PERC lejárat password reset-hez)
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
        'password_reset',
        DATE_ADD(NOW(), INTERVAL 15 MINUTE),  -- ← MÓDOSÍTVA: 1 HOUR → 15 MINUTE
        FALSE,
        NOW()
    );
    
    -- Token visszaadása
    SELECT newToken AS reset_token;
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `getCompanyStatistics` (IN `companyIdIN` INT, IN `dateFromIN` DATE, IN `dateToIN` DATE)   BEGIN
SELECT 
    -- ============================================
    -- FOGLALÁSOK ÖSSZESEN
    -- ============================================
    COUNT(DISTINCT a.id) AS total_appointments,
    
    -- ============================================
    -- STATUS SZERINTI BONTÁS
    -- ============================================
    SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) AS completed_appointments,
    SUM(CASE WHEN a.status = 'pending' THEN 1 ELSE 0 END) AS pending_appointments,
    SUM(CASE WHEN a.status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_appointments,
    SUM(CASE WHEN a.status = 'no_show' THEN 1 ELSE 0 END) AS no_show_appointments,
    
    -- ============================================
    -- BECSÜLT BEVÉTEL (csak completed)
    -- ============================================
    COALESCE(
        SUM(CASE WHEN a.status = 'completed' THEN a.price ELSE 0 END), 
        0
    ) AS estimated_revenue,
    a.currency,
    
    -- ============================================
    -- ÉRTÉKELÉSEK
    -- ============================================
    ROUND(COALESCE(AVG(r.rating), 0), 1) AS average_rating,
    COUNT(DISTINCT r.id) AS total_reviews,
    
    -- ============================================
    -- AKTÍV ERŐFORRÁSOK
    -- ============================================
    (
        SELECT COUNT(*) 
        FROM staff 
        WHERE company_id = companyIdIN 
          AND is_active = TRUE
    ) AS active_staff_count,
    
    (
        SELECT COUNT(*) 
        FROM services 
        WHERE company_id = companyIdIN 
          AND is_active = TRUE 
          AND is_deleted = FALSE
    ) AS active_services_count
    
FROM appointments a
LEFT JOIN reviews r 
    ON r.company_id = companyIdIN 
    AND r.is_deleted = FALSE
WHERE a.company_id = companyIdIN
  AND DATE(a.start_time) BETWEEN dateFromIN AND dateToIN
  AND a.status NOT IN ('cancelled')
GROUP BY a.currency;


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

CREATE DEFINER=`root`@`localhost` PROCEDURE `getStaffAvailableSlots` (IN `staffIdIN` INT, IN `dateIN` DATE)   BEGIN
    -- Ellenőrzi, hogy a staff létezik és aktív
    IF NOT EXISTS (
        SELECT 1 
        FROM `staff` 
        WHERE `id` = staffIdIN 
          AND `is_active` = TRUE
    ) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Staff not found or inactive';
    END IF;
    
    -- ============================================
    -- RESULT SET 1: WORKING HOURS
    -- ============================================
    SELECT 
        'working_hours' AS data_type, 
        `start_time`, 
        `end_time`, 
        `is_available`
    FROM `staff_working_hours`
    WHERE `staff_id` = staffIdIN
      AND `day_of_week` = CASE DAYOFWEEK(dateIN)
          WHEN 1 THEN 'sunday' 
          WHEN 2 THEN 'monday' 
          WHEN 3 THEN 'tuesday'
          WHEN 4 THEN 'wednesday' 
          WHEN 5 THEN 'thursday' 
          WHEN 6 THEN 'friday' 
          WHEN 7 THEN 'saturday'
      END
    LIMIT 1;
    
    -- ============================================
    -- RESULT SET 2: EXCEPTION
    -- ============================================
    SELECT 
        'exception' AS data_type, 
        `type` AS exception_type, 
        `start_time`, 
        `end_time`, 
        `note`
    FROM `staff_exceptions`
    WHERE `staff_id` = staffIdIN 
      AND `date` = dateIN 
      AND `is_deleted` = FALSE
    LIMIT 1;
    
    -- ============================================
    -- RESULT SET 3: APPOINTMENTS
    -- ============================================
    SELECT 
        'appointment' AS data_type, 
        `id` AS appointment_id, 
        TIME(`start_time`) AS start_time, 
        TIME(`end_time`) AS end_time, 
        `status`, 
        `notes`
    FROM `appointments`
    WHERE `staff_id` = staffIdIN 
      AND DATE(`start_time`) = dateIN 
      AND `status` NOT IN ('cancelled')
    ORDER BY `start_time`;
    
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `getUserNotifications` (IN `userIdIN` INT, IN `showOnlyUnreadIN` TINYINT(1), IN `typeFilterIN` VARCHAR(50), IN `limitIN` INT, IN `offsetIN` INT)   BEGIN
    DECLARE finalLimit INT DEFAULT 20;
    DECLARE finalOffset INT DEFAULT 0;
    
    -- Limit beállítása
    IF limitIN IS NULL OR limitIN <= 0 THEN
        SET finalLimit = 20;
    ELSE
        SET finalLimit = limitIN;
    END IF;
    
    -- Offset beállítása
    IF offsetIN IS NULL OR offsetIN < 0 THEN
        SET finalOffset = 0;
    ELSE
        SET finalOffset = offsetIN;
    END IF;
    
    -- Notifications lekérése
    SELECT 
        n.id,
        n.type,
        n.title,
        n.message,
        n.related_appointment_id,
        n.related_company_id,
        n.is_read,
        n.read_at,
        n.is_sent_email,
        n.sent_email_at,
        n.is_sent_sms,
        n.sent_sms_at,
        n.created_at,
        n.expires_at,
        
        -- Kapcsolódó appointment adatok
        a.start_time AS appointment_start_time,
        a.end_time AS appointment_end_time,
        a.status AS appointment_status,
        s.name AS service_name,
        
        -- Kapcsolódó company adatok
        c.name AS company_name,
        c.phone AS company_phone,
        c.address AS company_address,
        
        -- Staff adatok
        CONCAT(staff_user.first_name, ' ', staff_user.last_name) AS staff_name
        
    FROM `notifications` n
    LEFT JOIN `appointments` a ON n.related_appointment_id = a.id
    LEFT JOIN `services` s ON a.service_id = s.id
    LEFT JOIN `staff` st ON a.staff_id = st.id
    LEFT JOIN `users` staff_user ON st.user_id = staff_user.id
    LEFT JOIN `companies` c ON n.related_company_id = c.id
    
    WHERE n.user_id = userIdIN
      AND (showOnlyUnreadIN IS NULL OR showOnlyUnreadIN = 0 OR n.is_read = FALSE)
      AND (typeFilterIN IS NULL OR n.type = typeFilterIN)
      AND (n.expires_at IS NULL OR n.expires_at > NOW())
    
    ORDER BY 
        n.is_read ASC,
        n.created_at DESC
    
    LIMIT finalLimit OFFSET finalOffset;
    
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getUserProfile` (IN `userIdIN` INT)   BEGIN
    SELECT 
        u.*,
        GROUP_CONCAT(r.name SEPARATOR ', ') AS role_names,
        GROUP_CONCAT(r.description SEPARATOR '; ') AS role_descriptions,
        c.name AS company_name,
        c.address AS company_address,
        c.city AS company_city,
        c.country AS company_country
    FROM `users` u
    INNER JOIN `user_x_role` uxr ON u.id = uxr.user_id
    INNER JOIN `roles` r ON uxr.role_id = r.id
    LEFT JOIN `companies` c ON u.company_id = c.id
    WHERE u.id = userIdIN
      AND u.is_deleted = FALSE
      AND u.is_active = TRUE
      AND uxr.is_un_assigned = FALSE
    GROUP BY u.id;
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
        `users`.`company_id`,
        `images`.`url`,  -- Ez lehet NULL, ha nincs kép!
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
        roleNameIN,          -- Paraméterből jön a role
        newUserId,
        companyIdIN,         -- Lehet NULL
        emailIN,
        'user',
        'register',
        NULL,
        JSON_OBJECT(
            'user_id', newUserId,
            'email', emailIN,
            'role', roleNameIN,
            'company_id', companyIdIN,
            'first_name', firstNameIN,
            'last_name', lastNameIN
        ),
        NOW()
    );
    
    -- Visszaadjuk az új user ID-t és a reg token-t
    SELECT newUserId AS user_id, regToken AS reg_token;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `registerClient` (IN `firstNameIN` VARCHAR(100), IN `lastNameIN` VARCHAR(100), IN `emailIN` VARCHAR(100), IN `passwordIN` TEXT, IN `phoneIN` VARCHAR(30))   BEGIN
    DECLARE newUserId INT;
    DECLARE clientRoleId INT;
    DECLARE regToken VARCHAR(64);
    
    SET regToken = MD5(CONCAT(emailIN, NOW(), RAND()));
    
    SELECT `id` INTO clientRoleId 
    FROM `roles` 
    WHERE `name` = 'client' 
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
        clientRoleId,
        NOW()
    );
    
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
    
    -- ============================================
    -- ÚJ RÉSZ: Audit log bejegyzés
    -- ============================================
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
        newUserId,              -- Saját maga regisztrált
        'client',               -- Client roleban
        newUserId,              -- Saját magát érintette
        NULL,                   -- Nincs cég (client)
        emailIN,                -- Email cím
        'user',                 -- User entitás
        'register',             -- Regisztráció
        NULL,                   -- Nincs régi érték
        JSON_OBJECT(            -- Új értékek JSON-ben
            'user_id', newUserId,
            'email', emailIN,
            'role', 'client',
            'first_name', firstNameIN,
            'last_name', lastNameIN
        ),
        NOW()
    );
    
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
    
    -- Jelszó frissítése
    UPDATE `users`
    SET 
        `password` = newPasswordIN,
        `updated_at` = NOW()
    WHERE `id` = tokenUserId
      AND `is_deleted` = FALSE;
    
    -- Token revoke (már nem használható)
    UPDATE `tokens`
    SET 
        `is_revoked` = TRUE,
        `revoked_at` = NOW()
    WHERE `token` = tokenIN
      AND `type` = 'password_reset';
    
    -- Audit log (opcionális, de hasznos)
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
        tokenUserId,
        NULL,
        userEmail,
        'user',
        'password_reset',
        NULL,
        JSON_OBJECT('reset_method', 'token'),
        NOW()
    );
    
    -- Sikeres visszajelzés
    SELECT 
        'SUCCESS' AS result,
        'Password has been reset successfully' AS message,
        tokenUserId AS user_id;
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateCompany` (IN `companyIdIN` INT, IN `nameIN` VARCHAR(255), IN `descriptionIN` TEXT, IN `addressIN` TEXT, IN `cityIN` VARCHAR(100), IN `postalCodeIN` VARCHAR(20), IN `countryIN` VARCHAR(100), IN `phoneIN` VARCHAR(30), IN `emailIN` VARCHAR(100), IN `websiteIN` VARCHAR(255), IN `bookingAdvanceDaysIN` INT, IN `cancellationHoursIN` INT)   BEGIN
    UPDATE `companies`
    SET 
        `name` = nameIN,
        `description` = descriptionIN,
        `address` = addressIN,
        `city` = cityIN,
        `postal_code` = postalCodeIN,
        `country` = countryIN,
        `phone` = phoneIN,
        `email` = emailIN,
        `website` = websiteIN,
        `booking_advance_days` = bookingAdvanceDaysIN,
        `cancellation_hours` = cancellationHoursIN,
        `updated_at` = NOW()
    WHERE `id` = companyIdIN
      AND `is_deleted` = FALSE;
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
    -- Nyitvatartás frissítése egy adott napra
    UPDATE `opening_hours`
    SET 
        `open_time` = IF(isClosedIN = TRUE, NULL, openTimeIN),
        `close_time` = IF(isClosedIN = TRUE, NULL, closeTimeIN),
        `is_closed` = isClosedIN,
        `updated_at` = NOW()
    WHERE `company_id` = companyIdIN
      AND `day_of_week` = dayOfWeekIN;
      
    -- Ha még nem létezik a rekord (elég ritka eset), létrehozzuk
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
    -- Ellenőrzi, hogy a staff létezik
    IF NOT EXISTS (
        SELECT 1 FROM `staff` WHERE `id` = staffIdIN
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Staff not found';
    END IF;
    
    -- Ellenőrzi, hogy létezik-e working hours az adott napra
    IF NOT EXISTS (
        SELECT 1 FROM `staff_working_hours`
        WHERE `staff_id` = staffIdIN
          AND `day_of_week` = dayOfWeekIN
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Working hours not found for this day. Use createStaffWorkingHours first.';
    END IF;
    
    -- Munkaidő frissítése
    UPDATE `staff_working_hours`
    SET 
        `start_time` = IF(isAvailableIN = TRUE, startTimeIN, NULL),
        `end_time` = IF(isAvailableIN = TRUE, endTimeIN, NULL),
        `is_available` = isAvailableIN,
        `updated_at` = NOW()
    WHERE `staff_id` = staffIdIN
      AND `day_of_week` = dayOfWeekIN;
    
    -- Visszajelzés
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
  `staff_id` int(11) DEFAULT NULL COMMENT 'NULL = any staff can handle it',
  `client_id` int(11) NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `status` enum('pending','confirmed','cancelled','completed','no_show','in_progress') DEFAULT 'pending',
  `notes` text,
  `internal_notes` text COMMENT 'Visible only to staff/admin',
  `price` decimal(10,2) DEFAULT NULL,
  `currency` varchar(10) NOT NULL,
  `cancelled_by` int(11) DEFAULT NULL,
  `cancelled_reason` text,
  `cancelled_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`id`, `company_id`, `service_id`, `staff_id`, `client_id`, `start_time`, `end_time`, `status`, `notes`, `internal_notes`, `price`, `currency`, `cancelled_by`, `cancelled_reason`, `cancelled_at`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, 10, '2025-11-27 09:00:00', '2025-11-27 10:00:00', 'completed', NULL, NULL, '8900.00', 'HUF', NULL, NULL, NULL, '2025-11-27 11:05:09', '2025-12-12 10:16:13'),
(2, 1, 2, 1, 11, '2025-11-27 10:30:00', '2025-11-27 12:00:00', 'completed', NULL, NULL, '15900.00', 'HUF', NULL, NULL, NULL, '2025-11-27 11:05:09', '2025-12-12 10:16:13'),
(3, 1, 4, 2, 12, '2025-11-27 14:00:00', '2025-11-27 15:00:00', 'completed', NULL, NULL, '9900.00', 'HUF', NULL, NULL, NULL, '2025-11-27 11:05:09', '2025-12-12 10:16:13'),
(4, 1, 6, 3, 13, '2025-11-27 15:30:00', '2025-11-27 16:15:00', 'no_show', NULL, NULL, '4900.00', 'HUF', NULL, NULL, NULL, '2025-11-27 11:05:09', '2025-12-12 10:16:13'),
(5, 1, 7, 3, 14, '2025-11-27 16:30:00', '2025-11-27 17:30:00', 'completed', NULL, NULL, '6900.00', 'HUF', NULL, NULL, NULL, '2025-11-27 11:05:09', '2025-12-12 10:16:13'),
(6, 1, 1, 1, 10, '2025-11-20 10:00:00', '2025-11-20 11:00:00', 'completed', NULL, NULL, '8900.00', 'HUF', NULL, NULL, NULL, '2025-11-27 11:11:45', NULL),
(7, 1, 4, 2, 10, '2025-11-15 14:00:00', '2025-11-15 15:00:00', 'completed', NULL, NULL, '9900.00', 'HUF', NULL, NULL, NULL, '2025-11-27 11:11:45', NULL),
(8, 1, 2, 1, 10, '2025-12-01 09:00:00', '2025-12-01 10:30:00', 'completed', NULL, NULL, '15900.00', 'HUF', NULL, NULL, NULL, '2025-11-27 11:11:45', '2025-12-12 10:16:13'),
(9, 1, 6, 3, 10, '2025-12-10 16:00:00', '2025-12-10 16:45:00', 'no_show', NULL, NULL, '4900.00', 'HUF', NULL, NULL, NULL, '2025-11-27 11:11:45', '2025-12-12 10:16:13'),
(10, 1, 1, 1, 10, '2025-11-28 10:00:00', '2025-11-28 11:00:00', 'no_show', 'Online foglalás - még nem megerősítve', NULL, '8900.00', 'HUF', NULL, NULL, NULL, '2025-11-27 11:22:51', '2025-12-12 10:16:13'),
(11, 1, 4, 2, 11, '2025-11-29 14:00:00', '2025-11-29 15:00:00', 'no_show', 'Telefonos foglalás', NULL, '9900.00', 'HUF', NULL, NULL, NULL, '2025-11-27 11:22:51', '2025-12-12 10:16:13'),
(12, 1, 6, 3, 12, '2025-11-30 16:00:00', '2025-11-30 16:45:00', 'completed', NULL, NULL, '4900.00', 'HUF', NULL, NULL, NULL, '2025-11-27 11:22:51', '2025-12-12 10:16:13'),
(13, 1, 2, 1, 13, '2025-12-01 09:00:00', '2025-12-01 10:30:00', 'completed', NULL, NULL, '15900.00', 'HUF', NULL, NULL, NULL, '2025-11-27 11:22:51', '2025-12-12 10:16:13'),
(14, 1, 1, 1, 10, '2025-11-27 09:00:00', '2025-11-27 10:00:00', 'completed', NULL, NULL, '8900.00', 'HUF', NULL, NULL, NULL, '2025-11-27 11:30:34', '2025-12-12 10:16:13'),
(15, 1, 4, 2, 11, '2025-11-27 11:00:00', '2025-11-27 12:00:00', 'in_progress', NULL, NULL, '9900.00', 'HUF', NULL, NULL, NULL, '2025-11-27 11:30:34', NULL),
(16, 1, 6, 3, 12, '2025-11-26 14:00:00', '2025-11-26 14:45:00', 'completed', NULL, '', '4900.00', 'HUF', NULL, NULL, NULL, '2025-11-27 11:30:34', '2025-11-27 11:34:07'),
(17, 1, 1, 1, 10, '2025-12-15 10:00:00', '2025-12-15 11:00:00', 'confirmed', NULL, NULL, '8900.00', 'HUF', NULL, NULL, NULL, '2025-11-27 12:46:37', '2025-12-12 10:01:56'),
(18, 1, 2, 1, 10, '2025-12-11 10:00:00', '2025-12-11 11:30:00', 'no_show', NULL, NULL, '15900.00', 'HUF', NULL, NULL, NULL, '2025-12-12 12:50:09', '2025-12-12 12:50:34');

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `performed_by_user_id` int(11) NOT NULL,
  `performed_by_role` varchar(50) DEFAULT NULL,
  `affected_user_id` int(11) DEFAULT NULL,
  `company_id` int(11) DEFAULT NULL,
  `email` varchar(200) DEFAULT NULL,
  `entity_type` varchar(50) DEFAULT NULL COMMENT 'appointment, user, company, service, etc.',
  `action` varchar(100) NOT NULL COMMENT 'create, update, delete, login, etc.',
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `performed_by_user_id`, `performed_by_role`, `affected_user_id`, `company_id`, `email`, `entity_type`, `action`, `old_values`, `new_values`, `created_at`) VALUES
(1, 10, 'client', NULL, NULL, NULL, 'appointment', 'reschedule', '{\"reason\": \"Kliens nem ért rá reggel\", \"end_time\": \"2025-12-01 11:00:00.000000\", \"start_time\": \"2025-12-01 10:00:00.000000\"}', '{\"end_time\": \"2025-12-01 15:00:00.000000\", \"start_time\": \"2025-12-01 14:00:00.000000\"}', '2025-11-27 11:49:13'),
(2, 10, 'client', NULL, NULL, NULL, 'appointment', 'reschedule', '{\"reason\": \"Akarmi\", \"end_time\": \"2025-12-01 15:00:00.000000\", \"start_time\": \"2025-12-01 14:00:00.000000\"}', '{\"end_time\": \"2025-12-01 16:00:00.000000\", \"start_time\": \"2025-12-01 15:00:00.000000\"}', '2025-11-27 11:53:21'),
(3, 22, 'client', NULL, NULL, 'almaaa@gmail.com', 'user', 'login', NULL, NULL, '2025-12-03 23:14:38'),
(4, 3, 'admin', NULL, 2, 'kuki', 'user', 'logout', NULL, NULL, '2025-12-03 23:15:09'),
(5, 22, 'client', NULL, NULL, 'almaaa@gmail.com', 'user', 'login', NULL, NULL, '2025-12-06 10:46:16'),
(6, 23, 'client', NULL, NULL, '092@drxy.hu', 'user', 'register', NULL, '{\"role\": \"client\", \"email\": \"092@drxy.hu\", \"user_id\": 23, \"last_name\": \"Zsolt\", \"first_name\": \"Dorián\"}', '2025-12-06 11:38:24'),
(7, 24, 'client', NULL, NULL, 'vasvariben@gmail.com', 'user', 'register', NULL, '{\"role\": \"client\", \"email\": \"vasvariben@gmail.com\", \"user_id\": 24, \"last_name\": \"Vasvári\", \"first_name\": \"Benjamin\"}', '2025-12-06 12:01:50'),
(8, 23, 'client', NULL, NULL, '092@drxy.hu', 'user', 'email_verified', NULL, NULL, '2025-12-06 12:17:00'),
(9, 24, 'client', NULL, NULL, 'vasvariben@gmail.com', 'user', 'email_verified', NULL, NULL, '2025-12-06 12:26:53'),
(10, 24, 'client', NULL, NULL, 'vasvariben@gmail.com', 'user', 'login', NULL, NULL, '2025-12-06 12:27:07'),
(11, 24, 'client', NULL, NULL, 'vasvariben@gmail.com', 'user', 'login', NULL, NULL, '2025-12-06 12:28:35'),
(12, 22, 'client', NULL, NULL, 'almaaa@gmail.com', 'user', 'login', NULL, NULL, '2025-12-06 12:30:23'),
(13, 24, 'client', NULL, NULL, 'vasvariben@gmail.com', 'user', 'login', NULL, NULL, '2025-12-06 12:31:05'),
(14, 24, 'client', NULL, NULL, 'vasvariben@gmail.com', 'user', 'login', NULL, NULL, '2025-12-06 12:32:29'),
(15, 24, 'client', NULL, NULL, 'vasvariben@gmail.com', 'user', 'login', NULL, NULL, '2025-12-06 13:36:27'),
(16, 24, 'client', NULL, NULL, 'vasvariben@gmail.com', 'user', 'login', NULL, NULL, '2025-12-06 13:40:45'),
(17, 24, 'client', NULL, NULL, 'vasvariben@gmail.com', 'user', 'login', NULL, NULL, '2025-12-06 13:44:22'),
(18, 24, 'client', NULL, NULL, 'vasvariben@gmail.com', 'user', 'login', NULL, NULL, '2025-12-06 13:50:33'),
(19, 24, 'client', NULL, NULL, 'vasvariben@gmail.com', 'user', 'login', NULL, NULL, '2025-12-06 14:03:19'),
(20, 24, 'client', NULL, NULL, 'vasvariben@gmail.com', 'user', 'login', NULL, NULL, '2025-12-06 15:28:52'),
(21, 24, 'client', NULL, NULL, 'vasvariben@gmail.com', 'user', 'login', NULL, NULL, '2025-12-06 15:33:19'),
(22, 24, 'client', NULL, NULL, 'vasvariben@gmail.com', 'user', 'login', NULL, NULL, '2025-12-06 15:33:59'),
(23, 24, 'client', NULL, NULL, 'vasvariben@gmail.com', 'user', 'logout', NULL, NULL, '2025-12-06 15:34:33'),
(24, 24, 'client', NULL, NULL, 'vasvariben@gmail.com', 'user', 'login', NULL, NULL, '2025-12-06 18:34:26'),
(25, 24, 'client', NULL, NULL, 'vasvariben@gmail.com', 'user', 'logout', NULL, NULL, '2025-12-06 18:35:26'),
(26, 24, 'client', NULL, NULL, 'vasvariben@gmail.com', 'user', 'login', NULL, NULL, '2025-12-06 21:27:37'),
(27, 24, 'client', NULL, NULL, 'vasvariben@gmail.com', 'user', 'logout', NULL, NULL, '2025-12-06 21:27:47'),
(28, 25, 'client', NULL, NULL, 'teszt@teszt.hu', 'user', 'register', NULL, '{\"role\": \"client\", \"email\": \"teszt@teszt.hu\", \"user_id\": 25, \"last_name\": \"Teszt\", \"first_name\": \"Jancsi\"}', '2025-12-08 09:47:50'),
(29, 25, 'client', NULL, NULL, 'teszt@teszt.hu', 'user', 'email_verified', NULL, NULL, '2025-12-08 09:48:29'),
(30, 24, 'client', NULL, NULL, 'vasvariben@gmail.com', 'user', 'login', NULL, NULL, '2025-12-08 09:50:03'),
(31, 24, 'client', NULL, NULL, 'vasvariben@gmail.com', 'user', 'logout', NULL, NULL, '2025-12-08 09:57:02'),
(32, 24, 'client', NULL, NULL, 'vasvariben@gmail.com', 'user', 'login', NULL, NULL, '2025-12-08 10:01:59'),
(33, 24, 'client', NULL, NULL, 'vasvariben@gmail.com', 'user', 'logout', NULL, NULL, '2025-12-08 10:41:02'),
(34, 24, 'client', NULL, NULL, 'vasvariben@gmail.com', 'user', 'login', NULL, NULL, '2025-12-08 11:04:52'),
(35, 24, 'client', NULL, NULL, 'vasvariben@gmail.com', 'user', 'logout', NULL, NULL, '2025-12-08 11:12:13'),
(36, 24, 'client', NULL, NULL, 'vasvariben@gmail.com', 'user', 'login', NULL, NULL, '2025-12-09 09:10:21'),
(37, 24, 'client', NULL, NULL, 'vasvariben@gmail.com', 'user', 'login', NULL, NULL, '2025-12-09 17:41:59'),
(38, 30, 'client', NULL, NULL, 'teszt@example.hu', 'user', 'password_reset', NULL, '{\"reset_method\": \"token\"}', '2025-12-11 17:44:47'),
(39, 32, 'client', NULL, NULL, 'resend@test.com', 'user', 'resend_email_verification', NULL, '{\"token_count\": 1}', '2025-12-11 17:55:15'),
(40, 33, 'client', 33, NULL, 'teszt.bela@example.com', 'user', 'register', NULL, '{\"role\": \"client\", \"email\": \"teszt.bela@example.com\", \"user_id\": 33, \"last_name\": \"Béla\", \"first_name\": \"Teszt\"}', '2025-12-12 09:00:07'),
(41, 10, 'client', 10, NULL, 'janos.farkas@gmail.com', 'user', 'profile_update', '{\"phone\": \"+36201234567\"}', '{\"phone\": \"+36201234999\"}', '2025-12-12 09:01:11'),
(42, 24, 'client', 10, NULL, NULL, 'appointment', 'reschedule', '{\"reason\": \"Kliens kérte\", \"end_time\": \"2025-12-01 16:00:00.000000\", \"start_time\": \"2025-12-01 15:00:00.000000\"}', '{\"end_time\": \"2025-12-15 11:00:00.000000\", \"start_time\": \"2025-12-15 10:00:00.000000\"}', '2025-12-12 09:01:56'),
(43, 25, 'client', 25, NULL, 'teszt@teszt.hu', 'user', 'deactivate', '{\"is_active\": 1}', '{\"is_active\": 0}', '2025-12-12 09:21:20'),
(44, 25, 'client', 25, NULL, 'teszt@teszt.hu', 'user', 'soft_delete', '{\"is_deleted\": 0}', '{\"deleted_at\": \"2025-12-12 10:22:10.000000\", \"is_deleted\": 1}', '2025-12-12 09:22:10'),
(45, 25, 'client', 25, NULL, 'teszt@teszt.hu', 'user', 'deactivate', '{\"is_active\": 1}', '{\"is_active\": 0}', '2025-12-12 09:24:15'),
(46, 5, 'staff', 5, 1, 'katalin.molnar@szepsegszalon.hu', 'staff', 'deactivate', '{\"is_active\": 1}', '{\"is_active\": 0}', '2025-12-12 09:32:32'),
(47, 4, 'staff', 4, 1, 'eszter.toth@szepsegszalon.hu', 'staff', 'activate', '{\"is_active\": 0}', '{\"is_active\": 1}', '2025-12-12 09:35:03'),
(48, 4, 'staff', 4, 1, 'eszter.toth@szepsegszalon.hu', 'staff', 'deactivate', '{\"is_active\": 1}', '{\"is_active\": 0}', '2025-12-12 09:35:54'),
(49, 4, 'staff', 4, 1, 'eszter.toth@szepsegszalon.hu', 'staff', 'activate', '{\"is_active\": 0}', '{\"is_active\": 1}', '2025-12-12 09:36:58');

-- --------------------------------------------------------

--
-- Table structure for table `business_categories`
--

CREATE TABLE `business_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `icon` varchar(50) DEFAULT NULL COMMENT 'Icon class vagy emoji',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `business_categories`
--

INSERT INTO `business_categories` (`id`, `name`, `description`, `icon`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Szépségszalon', 'Kozmetikai és szépségápolási szolgáltatások', '💅', 1, '2025-12-05 15:36:27', NULL),
(2, 'Wellness és Spa', 'Wellness, spa és masszázs szolgáltatások', '💆', 1, '2025-12-05 15:36:27', NULL),
(3, 'Fodrászat', 'Fodrász és hajápolási szolgáltatások', '💇', 1, '2025-12-05 15:36:27', NULL),
(4, 'Körömstúdió', 'Műköröm és manikűr szolgáltatások', '💅', 1, '2025-12-05 15:36:27', NULL),
(5, 'Fitness', 'Fitness, jóga és edzőterem szolgáltatások', '💪', 1, '2025-12-05 15:36:27', NULL),
(6, 'Egészségügy', 'Orvosi rendelő, gyógytorna és egészségügyi szolgáltatások', '🏥', 1, '2025-12-05 15:36:27', NULL),
(7, 'Fogorvos', 'Fogászati szolgáltatások', '🦷', 1, '2025-12-05 15:36:27', NULL),
(8, 'Állatorvos', 'Állatorvosi rendelő és szolgáltatások', '🐕', 1, '2025-12-05 15:36:27', NULL),
(9, 'Autószerviz', 'Autószerelés és karbantartás', '🚗', 1, '2025-12-05 15:36:27', NULL),
(10, 'Oktatás', 'Magánoktatás, tanfolyamok', '📚', 1, '2025-12-05 15:36:27', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `companies`
--

CREATE TABLE `companies` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `address` text,
  `city` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'Hungary',
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `business_category_id` int(11) DEFAULT NULL,
  `owner_id` int(11) NOT NULL,
  `booking_advance_days` int(11) DEFAULT '30' COMMENT 'How many days in advance bookings can be made',
  `cancellation_hours` int(11) DEFAULT '24' COMMENT 'How many hours before appointment can be canceled',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `companies`
--

INSERT INTO `companies` (`id`, `name`, `description`, `address`, `city`, `postal_code`, `country`, `phone`, `email`, `website`, `business_category_id`, `owner_id`, `booking_advance_days`, `cancellation_hours`, `created_at`, `updated_at`, `deleted_at`, `is_deleted`, `is_active`) VALUES
(1, 'Bella Szépségszalon', 'Modern szépségszalon a belvárosban, teljes körű kozmetikai szolgáltatásokkal', 'Váci utca 15.', 'Budapest', '1052', 'Hungary', '+36301234501', 'info@bella-szalon.hu', 'www.bella-szalon.hu', 1, 2, 30, 24, '2025-10-09 16:14:23', NULL, NULL, 0, 1),
(2, 'Jungle Pécs', 'Ahol TE vagy a lényeg! Próbáld ki bármelyik szolgáltatásunkat, nem fogsz csalódni. Szakmai tudásunk folyamatos fejlesztése nagyon fontos számunkra. Itt kerülsz TE a középpontba! Szolgáltatásaink során figyelünk az egyéniségedre, fejformádra, hajtípusodra és persze a kezelhetőségre is. Várunk sok szeretettel szalonunkban!', 'Koller utca 7', 'Pécs', '7626', 'Hungary', '+36301234502', 'info@exclusivebeauty.hu', 'www.exclusivebeauty.hu', 3, 3, 45, 48, '2025-10-09 16:14:23', '2025-12-05 22:47:07', NULL, 0, 1),
(3, 'Naturál Szépségstúdió', 'Természetes alapanyagokkal dolgozó családias szalon', 'Fő utca 23.', 'Győr', '9021', 'Hungary', '+36301234503', 'hello@naturalszepseg.hu', 'www.naturalszepseg.hu', 1, 2, 21, 24, '2025-10-09 16:14:23', NULL, NULL, 0, 1),
(4, 'Harmónia Wellness', 'Wellness központ masszázzsal és spa kezelésekkel', 'Thermal utca 8.', 'Budapest', '1039', 'Hungary', '+36301234504', 'foglalas@harmoniawellness.hu', 'www.harmoniawellness.hu', 2, 3, 30, 24, '2025-10-09 16:14:23', NULL, NULL, 0, 1),
(5, 'Relaxa Masszázsszalon', 'Professzionális masszázs szolgáltatások nyugodt környezetben', 'Kossuth utca 12.', 'Debrecen', '4024', 'Hungary', '+36301234505', 'info@relaxa.hu', 'www.relaxa.hu', 2, 2, 14, 12, '2025-10-09 16:14:23', NULL, NULL, 0, 1),
(6, 'ZenSpa Központ', 'Ázsiai ihletésű spa és wellness központ', 'Dózsa György út 34.', 'Szeged', '6720', 'Hungary', '+36301234506', 'reception@zenspa.hu', 'www.zenspa.hu', 2, 3, 60, 48, '2025-10-09 16:14:23', NULL, NULL, 0, 1),
(7, 'StyleCut Fodrászat', 'Trendi frizurák és hajkezelések minden korosztálynak', 'Rákóczi út 56.', 'Budapest', '1074', 'Hungary', '+36301234507', 'időpont@stylecut.hu', 'www.stylecut.hu', 3, 2, 21, 24, '2025-10-09 16:14:23', NULL, NULL, 0, 1),
(8, 'Hair Art Studio', 'Kreatív fodrászat speciális színezési technikákkal', 'Bajcsy-Zsilinszky út 19.', 'Pécs', '7621', 'Hungary', '+36301234508', 'info@hairstudio.hu', 'www.hairstudio.hu', 3, 3, 30, 24, '2025-10-09 16:14:23', NULL, NULL, 0, 1),
(9, 'Perfect Nails Studio', 'Professzionális körömépítés és díszítés', 'Ferenciek tere 3.', 'Budapest', '1053', 'Hungary', '+36301234509', 'booking@perfectnails.hu', 'www.perfectnails.hu', 4, 2, 21, 12, '2025-10-09 16:14:23', NULL, NULL, 0, 1),
(10, 'Glamour Nails', 'Minőségi műköröm és géllakk szolgáltatások', 'Arany János utca 7.', 'Győr', '9022', 'Hungary', '+36301234510', 'info@glamournails.hu', 'www.glamournails.hu', 4, 3, 14, 24, '2025-10-09 16:14:23', NULL, NULL, 0, 1),
(11, 'FitZone Edzőterem', 'Modern edzőterem személyi edzőkkel és csoportos órákkal', 'Október 6. utca 22.', 'Budapest', '1051', 'Hungary', '+36301234511', 'info@fitzone.hu', 'www.fitzone.hu', 5, 2, 7, 6, '2025-10-09 16:14:23', NULL, NULL, 0, 1),
(12, 'Yoga & Balance Stúdió', 'Jóga és meditációs stúdió minden szintű gyakorlóknak', 'Bem rakpart 15.', 'Budapest', '1011', 'Hungary', '+36301234512', 'hello@yogabalance.hu', 'www.yogabalance.hu', 5, 3, 14, 12, '2025-10-09 16:14:23', NULL, NULL, 0, 1),
(13, 'Vital Med Magánrendelő', 'Magán egészségügyi központ szakorvosi rendelésekkel', 'Üllői út 82.', 'Budapest', '1082', 'Hungary', '+36301234513', 'rendeles@vitalmed.hu', 'www.vitalmed.hu', 6, 2, 30, 48, '2025-10-09 16:14:23', NULL, NULL, 0, 1),
(14, 'PhysioActive Gyógytorna', 'Gyógytorna és rehabilitációs központ', 'Kálvin tér 9.', 'Szeged', '6722', 'Hungary', '+36301234514', 'info@physioactive.hu', 'www.physioactive.hu', 6, 3, 21, 24, '2025-10-09 16:14:23', NULL, NULL, 0, 1),
(15, 'BarberShop Budapest', 'Férfi fodrászat és borbély szolgáltatások', 'Wesselényi utca 18.', 'Budapest', '1077', 'Hungary', '+36301234515', 'booking@barbershop.hu', 'www.barbershop-bp.hu', 3, 2, 14, 12, '2025-10-09 16:14:23', NULL, NULL, 0, 1);

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `favorites`
--

INSERT INTO `favorites` (`id`, `user_id`, `company_id`, `created_at`, `deleted_at`, `is_deleted`) VALUES
(1, 10, 1, '2025-11-01 09:30:00', NULL, 0),
(2, 10, 2, '2025-11-05 13:20:00', NULL, 0),
(3, 10, 7, '2025-11-10 08:15:00', NULL, 0),
(4, 11, 1, '2025-11-03 10:00:00', NULL, 0),
(5, 11, 4, '2025-11-08 15:45:00', NULL, 0),
(6, 11, 9, '2025-11-12 12:30:00', NULL, 0),
(7, 12, 2, '2025-11-02 07:20:00', NULL, 0),
(8, 12, 6, '2025-11-15 09:00:00', NULL, 0),
(9, 12, 15, '2025-11-20 11:30:00', NULL, 0),
(10, 13, 1, '2025-11-04 08:00:00', NULL, 0),
(11, 13, 11, '2025-11-18 14:20:00', NULL, 0),
(12, 13, 12, '2025-11-22 10:10:00', NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `images`
--

CREATE TABLE `images` (
  `id` int(11) NOT NULL,
  `company_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `url` text,
  `is_main` tinyint(4) NOT NULL DEFAULT '0',
  `uploaded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `images`
--

INSERT INTO `images` (`id`, `company_id`, `user_id`, `url`, `is_main`, `uploaded_at`, `deleted_at`, `is_deleted`) VALUES
(2, 1, NULL, 'images/companies/1/67ba2b86-5da8-48a6-94cc-4cce64ea754a-PERSPECTIVE-HU-Pcs-Fresha.jpg.avif', 1, '2025-12-01 12:09:50', NULL, 0),
(5, 2, NULL, 'images/companies/2/c2c8913e-4004-48bf-bcc9-9e2489e76544-Jungle-HU-Pcs-Fresha.jpg', 0, '2025-12-01 12:14:17', NULL, 0),
(6, 2, NULL, 'images/companies/2/662d09fa-4c88-4365-98dc-20a691699085-Jungle-HU-Pcs-Fresha.jpg', 0, '2025-12-01 12:14:17', NULL, 0),
(7, 2, NULL, 'images/companies/2/c83e4ae0-f9da-46af-88e7-215207cdd915-Jungle-HU-Pcs-Fresha.jpg', 1, '2025-12-01 12:14:17', NULL, 0),
(8, NULL, 10, 'https://example.com/janos-profile.jpg', 0, '2025-12-01 12:37:55', '2025-12-01 12:38:21', 1),
(9, NULL, 10, 'https://example.com/janos-NEW-profile.jpg', 0, '2025-12-01 12:38:21', '2025-12-01 12:41:25', 1),
(10, NULL, 11, 'https://example.com/eva-profile.jpg', 0, '2025-12-01 12:39:04', NULL, 0),
(11, NULL, 24, NULL, 0, '2025-12-01 12:39:04', NULL, 0),
(12, 2, NULL, 'images/companies/2/c579047b-d38b-465b-bf9f-fe8c1b83c5ef-Jungle-HU-Pcs-Fresha.jpg', 0, '2025-12-05 22:46:51', NULL, 0),
(13, NULL, 26, 'https://via.placeholder.com/200x200?text=User', 0, '2025-12-10 10:19:27', NULL, 0),
(14, NULL, 27, 'https://example.com/teszt-elek-profile.jpg', 0, '2025-12-10 10:31:32', NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL COMMENT 'Kinek szól az értesítés',
  `type` enum('appointment_confirmation','appointment_reminder','appointment_cancellation','appointment_rescheduled','review_request','staff_assignment','system_message','marketing') NOT NULL COMMENT 'Értesítés típusa',
  `title` varchar(255) NOT NULL COMMENT 'Értesítés címe',
  `message` text NOT NULL COMMENT 'Értesítés szövege',
  `related_appointment_id` int(11) DEFAULT NULL COMMENT 'Kapcsolódó időpont (ha van)',
  `related_company_id` int(11) DEFAULT NULL COMMENT 'Kapcsolódó cég (ha van)',
  `is_read` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Elolvasta-e',
  `read_at` datetime DEFAULT NULL COMMENT 'Mikor olvasta el',
  `is_sent_email` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Ki lett-e küldve email',
  `sent_email_at` datetime DEFAULT NULL COMMENT 'Mikor lett kiküldve email',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime DEFAULT NULL COMMENT 'Meddig érvényes (pl. marketing)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Felhasználói értesítések';

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `related_appointment_id`, `related_company_id`, `is_read`, `read_at`, `is_sent_email`, `sent_email_at`, `created_at`, `expires_at`) VALUES
(1, 10, 'appointment_confirmation', 'Időpont megerősítve', 'Az Ön időpontja 2025-01-15 14:00-kor megerősítésre került.', 17, 1, 0, NULL, 0, NULL, '2025-12-13 15:05:36', NULL),
(2, 10, 'appointment_confirmation', 'Időpont megerősítve', 'Megerősítettük az Ön időpontját 2025. január 15-én 14:00 órára a Bella Szépségszalonban.', 17, 1, 0, NULL, 0, NULL, '2025-12-13 15:06:25', NULL),
(3, 10, 'appointment_confirmation', 'Időpont megerősítve', 'Az Ön időpontja 2025. december 15-én 10:00 órára megerősítésre került a Bella Szépségszalonban.', 17, 1, 0, NULL, 0, NULL, '2025-12-13 15:12:59', NULL),
(4, 10, 'appointment_reminder', 'Emlékeztető: Holnap találkozunk!', 'Ne felejtse el, hogy holnap 10:00-kor találkozunk a Bella Szépségszalonban.', 17, 1, 0, NULL, 0, NULL, '2025-12-13 15:12:59', NULL),
(5, 10, 'review_request', 'Ossza meg velünk tapasztalatait!', 'Kérjük, értékelje a legutóbbi szolgáltatásunkat. Véleménye fontos számunkra!', 1, 1, 0, NULL, 0, NULL, '2025-12-13 15:12:59', NULL),
(6, 10, 'system_message', 'Rendszerkarbantartás', 'December 20-án 02:00-04:00 között rendszerkarbantartást végzünk. Az online foglalás átmenetileg nem elérhető.', NULL, NULL, 0, NULL, 0, NULL, '2025-12-13 15:12:59', '2025-12-20 16:12:59'),
(7, 10, 'marketing', '🎁 Karácsonyi akció!', 'December 24-ig 20% kedvezmény minden szolgáltatásunkra! Foglaljon most!', NULL, 1, 0, NULL, 0, NULL, '2025-12-13 15:12:59', '2025-12-27 16:12:59');

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `notification_settings`
--

INSERT INTO `notification_settings` (`id`, `user_id`, `appointment_confirmation`, `appointment_reminder`, `appointment_cancellation`, `marketing_emails`, `updated_at`, `created_at`) VALUES
(1, 1, 1, 1, 1, 0, NULL, '2025-10-09 14:21:25'),
(2, 2, 1, 1, 1, 1, NULL, '2025-10-09 14:21:25'),
(3, 3, 1, 1, 1, 1, NULL, '2025-10-09 14:21:25'),
(4, 4, 1, 1, 1, 0, NULL, '2025-10-09 14:21:25'),
(5, 5, 1, 1, 1, 0, NULL, '2025-10-09 14:21:25'),
(6, 6, 1, 1, 1, 1, NULL, '2025-10-09 14:21:25'),
(7, 7, 1, 1, 1, 0, NULL, '2025-10-09 14:21:25'),
(8, 8, 1, 1, 1, 1, NULL, '2025-10-09 14:21:25'),
(9, 9, 1, 1, 1, 0, NULL, '2025-10-09 14:21:25'),
(10, 10, 1, 1, 1, 1, NULL, '2025-10-09 14:21:25'),
(11, 11, 1, 1, 1, 0, NULL, '2025-10-09 14:21:25'),
(12, 12, 1, 0, 1, 0, NULL, '2025-10-09 14:21:25'),
(13, 13, 1, 1, 1, 1, NULL, '2025-10-09 14:21:25'),
(14, 14, 0, 0, 1, 0, NULL, '2025-10-09 14:21:25'),
(15, 15, 1, 1, 1, 1, NULL, '2025-10-09 14:21:25');

-- --------------------------------------------------------

--
-- Table structure for table `opening_hours`
--

CREATE TABLE `opening_hours` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `day_of_week` enum('monday','tuesday','wednesday','thursday','friday','saturday','sunday') NOT NULL,
  `open_time` time DEFAULT NULL,
  `close_time` time DEFAULT NULL,
  `is_closed` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `opening_hours`
--

INSERT INTO `opening_hours` (`id`, `company_id`, `day_of_week`, `open_time`, `close_time`, `is_closed`, `created_at`, `updated_at`) VALUES
(1, 1, 'monday', '09:00:00', '17:00:00', 0, '2025-11-26 09:33:44', NULL),
(2, 1, 'tuesday', '09:00:00', '17:00:00', 0, '2025-11-26 09:33:44', NULL),
(3, 1, 'wednesday', '09:00:00', '17:00:00', 0, '2025-11-26 09:33:44', NULL),
(4, 1, 'thursday', '09:00:00', '17:00:00', 0, '2025-11-26 09:33:44', NULL),
(5, 1, 'friday', '09:00:00', '17:00:00', 0, '2025-11-26 09:33:44', NULL),
(6, 1, 'saturday', '09:00:00', '14:00:00', 0, '2025-11-26 09:33:44', NULL),
(7, 1, 'sunday', NULL, NULL, 1, '2025-11-26 09:33:44', NULL),
(15, 2, 'monday', NULL, NULL, 1, '2025-12-01 12:03:50', NULL),
(16, 2, 'tuesday', '08:00:00', '19:00:00', 0, '2025-12-01 12:03:50', NULL),
(17, 2, 'wednesday', '08:00:00', '19:00:00', 0, '2025-12-01 12:03:50', NULL),
(18, 2, 'thursday', '08:00:00', '19:00:00', 0, '2025-12-01 12:03:50', NULL),
(19, 2, 'friday', '08:00:00', '19:00:00', 0, '2025-12-01 12:03:50', NULL),
(20, 2, 'saturday', '08:00:00', '19:00:00', 0, '2025-12-01 12:03:50', NULL),
(21, 2, 'sunday', NULL, NULL, 1, '2025-12-01 12:03:50', NULL),
(22, 15, 'monday', NULL, NULL, 1, '2025-12-01 12:04:30', NULL),
(23, 15, 'tuesday', '10:00:00', '19:00:00', 0, '2025-12-01 12:04:30', NULL),
(24, 15, 'wednesday', '10:00:00', '19:00:00', 0, '2025-12-01 12:04:30', NULL),
(25, 15, 'thursday', '10:00:00', '19:00:00', 0, '2025-12-01 12:04:30', NULL),
(26, 15, 'friday', '10:00:00', '19:00:00', 0, '2025-12-01 12:04:30', NULL),
(27, 15, 'saturday', '09:00:00', '17:00:00', 0, '2025-12-01 12:04:30', NULL),
(28, 15, 'sunday', NULL, NULL, 1, '2025-12-01 12:04:30', NULL);

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
  `comment` text,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`id`, `company_id`, `client_id`, `appointment_id`, `rating`, `comment`, `updated_at`, `deleted_at`, `is_deleted`, `created_at`) VALUES
(1, 1, 10, NULL, 5, 'Fantasztikus élmény volt! Eszter nagyon profin dolgozott, teljesen elégedett vagyok az arckezeléssel.', NULL, NULL, 0, '2025-11-01 13:30:00'),
(2, 1, 11, NULL, 4, 'Nagyon jó szolgáltatás, csak kicsit hosszú volt a várakozás.', NULL, NULL, 0, '2025-11-05 09:15:00'),
(3, 1, 12, NULL, 5, 'Kiváló! Mindenképp visszajövök.', NULL, NULL, 0, '2025-11-10 15:45:00'),
(4, 1, 13, NULL, 3, 'Rendben volt, de vártam többet az árakhoz képest.', NULL, NULL, 0, '2025-11-15 10:20:00'),
(5, 1, 14, NULL, 5, 'Zsófi keze arany! A legjobb manikűr amit valaha kaptam.', NULL, NULL, 0, '2025-11-18 08:30:00'),
(6, 1, 15, NULL, 4, 'Nagyon kellemes környezet és kedves személyzet.', NULL, NULL, 0, '2025-11-20 14:00:00'),
(7, 1, 10, NULL, 5, 'Másodszor is tökéletes volt! Csak ajánlani tudom.', NULL, NULL, 0, '2025-11-22 12:00:00'),
(8, 1, 11, NULL, 2, 'Sajnos nem az lett amire számítottam.', NULL, NULL, 0, '2025-11-24 09:00:00'),
(9, 2, 12, NULL, 5, 'Luxus élmény! A hot stone masszázs csodálatos volt.', NULL, NULL, 0, '2025-11-03 13:00:00'),
(10, 2, 13, NULL, 4, 'Nagyon jó, de drága.', NULL, NULL, 0, '2025-11-08 10:30:00'),
(11, 2, 14, NULL, 5, 'Minden alkalommal tökéletes!', NULL, NULL, 0, '2025-11-12 15:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`, `updated_at`, `deleted_at`, `is_deleted`, `created_at`) VALUES
(1, 'superadmin', 'Teljes hozzáférés az összes rendszer funkcióhoz és minden céghez', NULL, NULL, 0, '2025-10-09 16:14:23'),
(2, 'admin', 'Cég szintű adminisztrátor, teljes hozzáférés a saját céghez', NULL, NULL, 0, '2025-10-09 16:14:23'),
(3, 'staff', 'Munkatárs, aki szolgáltatásokat nyújt és időpontokat kezel', NULL, NULL, 0, '2025-10-09 16:14:23'),
(4, 'client', 'Ügyfél, aki időpontokat foglal', NULL, NULL, 0, '2025-10-09 16:14:23');

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

CREATE TABLE `services` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `duration_minutes` int(11) NOT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `currency` varchar(10) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`id`, `company_id`, `name`, `description`, `duration_minutes`, `price`, `currency`, `is_active`, `created_at`, `updated_at`, `deleted_at`, `is_deleted`) VALUES
(1, 1, 'Basic arckezelés', 'Alapos arctisztítás, pakolás, arcmasszázs', 60, '8900.00', 'HUF', 0, '2025-10-09 16:52:27', '2025-12-01 13:48:06', '2025-12-01 13:48:06', 1),
(2, 1, 'Prémium arckezelés', 'Luxus arckezelés anti-aging hatással', 90, '15900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(3, 1, 'Hialuronsavas kezelés', 'Intenzív hidratáló arckezelés', 75, '12900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(4, 1, 'Teljes testmasszázs', 'Relaxáló teljes test masszázs', 60, '9900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(5, 1, 'Cellulitkezelés', 'Cellulit csökkentő kezelés', 45, '7900.00', 'HUF', 0, '2025-10-09 16:52:27', '2025-12-01 13:48:45', '2025-12-01 13:48:45', 1),
(6, 1, 'Manikűr', 'Kéz- és körömápolás', 45, '4900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(7, 1, 'Géllakk', 'Tartós géllakk kézre', 60, '6900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(8, 1, 'Pedikűr', 'Láb- és körömápolás', 60, '6900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(9, 1, 'Szempillafestés', 'Természetes szempilla festés', 30, '3900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(10, 1, 'Szemöldök formázás', 'Szemöldök igazítás és festés', 30, '3500.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(11, 2, 'Svéd masszázs', 'Klasszikus relaxáló masszázs', 60, '11900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(12, 2, 'Aromaterápiás masszázs', 'Illóolajos masszázs kezelés', 75, '13900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(13, 2, 'Hot stone masszázs', 'Forró kő masszázs', 90, '16900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(14, 2, 'Talpmasszázs', 'Reflexológiai talpmasszázs', 45, '8900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(15, 2, 'Teljes SPA csomag', 'Komplex spa élmény 3 órában', 180, '35900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(16, 2, 'Szauna és masszázs', 'Szauna használat + 60 perc masszázs', 90, '14900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(17, 2, 'Arckezelés gold maszkkal', 'Luxus arany arckezelés', 90, '24900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(18, 3, 'Bio arckezelés', 'Természetes alapanyagú arckezelés', 60, '9900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(19, 3, 'Organikus testkezelés', 'Teljes test kezelés bio termékekkel', 75, '11900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(20, 3, 'Natúr hámlasztás', 'Természetes peeling kezelés', 45, '6900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(21, 4, 'Relaxációs masszázs', 'Stresszoldó masszázs', 60, '10900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(22, 4, 'Gyógymasszázs', 'Terápiás masszázs', 60, '12900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(23, 4, 'Wellness day csomag', 'Egész napos wellness élmény', 240, '42900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(24, 4, 'Páros masszázs', 'Masszázs pároknak', 60, '21900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(25, 5, 'Svéd masszázs 60 perc', 'Klasszikus svéd masszázs', 60, '9900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(26, 5, 'Svéd masszázs 90 perc', 'Hosszú svéd masszázs', 90, '13900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(27, 5, 'Sportmasszázs', 'Sportolóknak ajánlott', 60, '11900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(28, 5, 'Talpmasszázs', 'Reflexológia', 45, '7900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(29, 6, 'Thai masszázs', 'Hagyományos thai masszázs', 90, '15900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(30, 6, 'Shiatsu masszázs', 'Japán nyomáspontos masszázs', 60, '13900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(31, 6, 'Meditációs óra', 'Vezetett meditáció', 60, '4900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(32, 6, 'Zen spa rituálé', 'Komplex ázsiai spa élmény', 120, '29900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(33, 7, 'Női hajvágás', 'Professzionális női hajvágás', 45, '6900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(34, 7, 'Férfi hajvágás', 'Modern férfi frizura', 30, '4500.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(35, 7, 'Hajfestés rövid hajra', 'Teljes hajfestés rövid hajra', 90, '12900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(36, 7, 'Hajfestés hosszú hajra', 'Teljes hajfestés hosszú hajra', 120, '17900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(37, 7, 'Melírozás', 'Melír vagy balayage', 150, '22900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(38, 7, 'Keratinos hajegyenesítés', 'Tartós egyenesítés', 180, '34900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(39, 7, 'Hajpakolás', 'Regeneráló kezelés', 30, '3900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(40, 8, 'Kreatív hajfestés', 'Különleges színezési technika', 180, '29900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(41, 8, 'Ombre festés', 'Ombre vagy balayage technika', 150, '24900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(42, 8, 'Női vágás + mosás', 'Hajvágás mosással', 60, '8900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(43, 8, 'Hajhosszabbítás', 'Tincselés keratin kapoccsal', 240, '89900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(44, 9, 'Zselés műköröm', 'Teljes zselés műköröm építés', 120, '11900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(45, 9, 'Porcelán műköröm', 'Porcelán műköröm építés', 150, '14900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(46, 9, 'Műköröm töltés', 'Műköröm karbantartás', 90, '8900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(47, 9, 'Géllakk manikűr', 'Manikűr géllakkal', 60, '6900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(48, 9, 'Körömdekoráció', 'Egyedi körömművészet', 30, '2900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(49, 9, 'SPA pedikűr', 'Luxus pedikűr kezelés', 75, '8900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(50, 10, 'Express manikűr', 'Gyors manikűr', 30, '3900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(51, 10, 'Prémium manikűr', 'Teljes manikűr kezelés', 60, '5900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(52, 10, 'Babyboomer műköröm', 'Babyboomer technika', 120, '12900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(53, 10, 'Francia műköröm', 'Klasszikus francia', 120, '11900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(54, 10, 'Gyógypedikűr', 'Gyógyászati lábápolás', 60, '7900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(55, 11, 'Személyi edzés 1 alkalom', 'Egyéni személyi edzés', 60, '8900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(56, 11, 'Személyi edzés 5 alkalom', '5 alkalmas személyi edzés bérlet', 300, '39900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(57, 11, 'Spinning óra', 'Csoportos spinning', 45, '2900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(58, 11, 'CrossFit edzés', 'Funkcionális crossfit', 60, '3900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(59, 11, 'TRX edzés', 'TRX funkcionális tréning', 45, '3500.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(60, 12, 'Hatha jóga', 'Klasszikus hatha jóga óra', 75, '3900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(61, 12, 'Vinyasa flow jóga', 'Dinamikus jóga óra', 60, '3900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(62, 12, 'Yin jóga', 'Lassú, meditatív jóga', 90, '4500.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(63, 12, 'Meditációs óra', 'Vezetett meditáció', 45, '2900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(64, 12, 'Pilates óra', 'Pilates edzés', 60, '3900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(65, 13, 'Belgyógyászati vizsgálat', 'Teljes körű belgyógyászati vizsgálat', 30, '15900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(66, 13, 'Kardiológiai vizsgálat', 'EKG-val kiegészített vizsgálat', 45, '18900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(67, 13, 'Alapvető laborvizsgálat', 'Teljes vérkép és alapvető laborok', 15, '12900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(68, 13, 'Ultrahang vizsgálat', 'Hasi ultrahang', 30, '16900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(69, 14, 'Gyógytorna 1 alkalom', 'Egyéni gyógytorna foglalkozás', 45, '7900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(70, 14, 'Gyógytorna 10 alkalom', '10 alkalmas gyógytorna bérlet', 450, '69900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(71, 14, 'Gerinctorna', 'Gerincproblémák kezelése', 45, '6900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(72, 14, 'Rehabilitációs edzés', 'Sérülés utáni rehabilitáció', 60, '8900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(73, 14, 'Masszázs terápia', 'Terápiás masszázs', 45, '7900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(74, 15, 'Klasszikus férfi vágás', 'Hagyományos férfi hajvágás', 30, '4500.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(75, 15, 'Modern férfi vágás', 'Trendi férfi frizura', 45, '5900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(76, 15, 'Borotválás', 'Hagyományos borotválás', 30, '4900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(77, 15, 'Szakáll formázás', 'Szakáll igazítás és ápolás', 30, '3900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(78, 15, 'Hajvágás + szakáll', 'Komplett csomag', 60, '7900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0),
(79, 15, 'VIP csomag', 'Vágás, borotválás, masszázs', 90, '12900.00', 'HUF', 1, '2025-10-09 16:52:27', NULL, NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `service_categories`
--

CREATE TABLE `service_categories` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `service_categories`
--

INSERT INTO `service_categories` (`id`, `company_id`, `name`, `description`, `created_at`, `updated_at`) VALUES
(1, 1, 'Arcápolás és bőrkezelés', 'Professzionális arckezelések minden bőrtípusra és korcsoportra', '2025-10-09 14:50:01', '2025-12-01 13:09:18'),
(2, 1, 'Testkezelések', 'Testformáló és relaxáló testkezelések', '2025-10-09 14:50:01', NULL),
(3, 1, 'Körömápolás', 'Manikűr, pedikűr és műköröm szolgáltatások', '2025-10-09 14:50:01', NULL),
(4, 1, 'Szempilla és szemöldök', 'Szempilla és szemöldök szépítés', '2025-10-09 14:50:01', NULL),
(5, 2, 'Haj / Hair', 'Különböző típusú masszázs kezelések', '2025-10-09 14:50:01', NULL),
(6, 2, 'Haj & Szakáll / Hair & Beard', 'Luxus spa és wellness kezelések', '2025-10-09 14:50:01', NULL),
(7, 2, 'Szakáll / Beard', 'Illóolajos kezelések és terápiák', '2025-10-09 14:50:01', NULL),
(8, 2, 'Arckezelések', 'Prémium arcápoló kezelések', '2025-10-09 14:50:01', NULL),
(9, 3, 'Bio kozmetika', 'Természetes alapanyagú kezelések', '2025-10-09 14:50:01', NULL),
(10, 3, 'Arcápolás', 'Organikus arckezelések', '2025-10-09 14:50:01', NULL),
(11, 3, 'Testápolás', 'Természetes testkezelések', '2025-10-09 14:50:01', NULL),
(12, 4, 'Relaxációs masszázsok', 'Stresszoldó és pihentető masszázsok', '2025-10-09 14:50:01', NULL),
(13, 4, 'Gyógymasszázsok', 'Terápiás és gyógyító masszázsok', '2025-10-09 14:50:01', NULL),
(14, 4, 'Wellness csomagok', 'Komplex wellness élmények', '2025-10-09 14:50:01', NULL),
(15, 5, 'Svéd masszázs', 'Klasszikus svéd masszázs kezelések', '2025-10-09 14:50:01', NULL),
(16, 5, 'Sportmasszázs', 'Sportolóknak ajánlott masszázsok', '2025-10-09 14:50:01', NULL),
(17, 5, 'Talpmasszázs', 'Reflexológia és talpmasszázs', '2025-10-09 14:50:01', NULL),
(18, 6, 'Ázsiai masszázsok', 'Thai, Shiatsu és egyéb ázsiai technikák', '2025-10-09 14:50:01', NULL),
(19, 6, 'Meditáció', 'Meditációs szekciók és tanfolyamok', '2025-10-09 14:50:01', NULL),
(20, 6, 'Spa rituálék', 'Komplex spa élmények', '2025-10-09 14:50:01', NULL),
(21, 7, 'Női hajvágás', 'Női frizurák és hajvágások', '2025-10-09 14:50:01', NULL),
(22, 7, 'Férfi hajvágás', 'Férfi frizurák és hajvágások', '2025-10-09 14:50:01', NULL),
(23, 7, 'Hajfestés', 'Hajszínezés és melírozás', '2025-10-09 14:50:01', NULL),
(24, 7, 'Hajkezelések', 'Ápoló és regeneráló hajkezelések', '2025-10-09 14:50:01', NULL),
(25, 8, 'Kreatív hajfestés', 'Különleges színezési technikák', '2025-10-09 14:50:01', NULL),
(26, 8, 'Hajvágás', 'Professzionális hajvágások', '2025-10-09 14:50:01', NULL),
(27, 8, 'Hajhosszabbítás', 'Tincselés és hajhosszabbítás', '2025-10-09 14:50:01', NULL),
(28, 9, 'Műköröm', 'Zselés és porcelán műköröm', '2025-10-09 14:50:01', NULL),
(29, 9, 'Géllakk', 'Tartós géllakk kezelések', '2025-10-09 14:50:01', NULL),
(30, 9, 'Körömművészet', 'Körömdekorációk és díszítések', '2025-10-09 14:50:01', NULL),
(31, 9, 'Pedikűr', 'Lábápolás és pedikűr', '2025-10-09 14:50:01', NULL),
(32, 10, 'Manikűr', 'Professzionális manikűr szolgáltatások', '2025-10-09 14:50:01', NULL),
(33, 10, 'Műköröm építés', 'Különböző technikájú műköröm', '2025-10-09 14:50:01', NULL),
(34, 10, 'Lábápolás', 'Pedikűr és lábápoló kezelések', '2025-10-09 14:50:01', NULL),
(35, 11, 'Személyi edzés', 'Egyéni edzéstervek személyi edzővel', '2025-10-09 14:50:01', NULL),
(36, 11, 'Csoportos órák', 'Változatos csoportos edzések', '2025-10-09 14:50:01', NULL),
(37, 11, 'Funkcionális tréning', 'Funkcionális edzések', '2025-10-09 14:50:01', NULL),
(38, 12, 'Jóga órák', 'Különböző stílusú jóga órák', '2025-10-09 14:50:01', NULL),
(39, 12, 'Meditáció', 'Meditációs foglalkozások', '2025-10-09 14:50:01', NULL),
(40, 12, 'Pilates', 'Pilates edzések', '2025-10-09 14:50:01', NULL),
(41, 13, 'Belgyógyászat', 'Belgyógyászati vizsgálatok', '2025-10-09 14:50:01', NULL),
(42, 13, 'Kardiológia', 'Szívbetegségek vizsgálata', '2025-10-09 14:50:01', NULL),
(43, 13, 'Laborvizsgálatok', 'Különböző labor vizsgálatok', '2025-10-09 14:50:01', NULL),
(44, 14, 'Gyógytorna', 'Terápiás gyógytorna foglalkozások', '2025-10-09 14:50:01', NULL),
(45, 14, 'Rehabilitáció', 'Sérülés utáni rehabilitáció', '2025-10-09 14:50:01', NULL),
(46, 14, 'Gerinctorna', 'Gerincproblémák kezelése', '2025-10-09 14:50:01', NULL),
(47, 15, 'Férfi hajvágás', 'Klasszikus és modern férfi frizurák', '2025-10-09 14:50:01', NULL),
(48, 15, 'Borotválás', 'Hagyományos borotválás', '2025-10-09 14:50:01', NULL),
(49, 15, 'Szakáll formázás', 'Szakáll nyírás és ápolás', '2025-10-09 14:50:01', NULL),
(50, 1, 'Speciális kezelések', 'Különleges és exkluzív kezelések', '2025-12-01 12:55:01', NULL),
(51, 1, 'Ajándékcsomagok', 'Komplett wellness csomagok ajándékba', '2025-12-01 12:55:01', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `service_category_map`
--

CREATE TABLE `service_category_map` (
  `id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `service_category_map`
--

INSERT INTO `service_category_map` (`id`, `service_id`, `category_id`, `created_at`) VALUES
(1, 1, 1, '2025-10-09 14:57:12'),
(2, 2, 1, '2025-10-09 14:57:12'),
(3, 3, 1, '2025-10-09 14:57:12'),
(4, 4, 2, '2025-10-09 14:57:12'),
(5, 5, 2, '2025-10-09 14:57:12'),
(6, 6, 3, '2025-10-09 14:57:12'),
(7, 7, 3, '2025-10-09 14:57:12'),
(8, 8, 3, '2025-10-09 14:57:12'),
(9, 9, 4, '2025-10-09 14:57:12'),
(10, 10, 4, '2025-10-09 14:57:12'),
(11, 11, 5, '2025-10-09 14:57:12'),
(12, 12, 5, '2025-10-09 14:57:12'),
(13, 13, 5, '2025-10-09 14:57:12'),
(14, 14, 5, '2025-10-09 14:57:12'),
(15, 12, 7, '2025-10-09 14:57:12'),
(16, 15, 6, '2025-10-09 14:57:12'),
(17, 16, 6, '2025-10-09 14:57:12'),
(18, 17, 8, '2025-10-09 14:57:12'),
(19, 18, 9, '2025-10-09 14:57:12'),
(20, 19, 9, '2025-10-09 14:57:12'),
(21, 20, 9, '2025-10-09 14:57:12'),
(22, 18, 10, '2025-10-09 14:57:12'),
(23, 20, 10, '2025-10-09 14:57:12'),
(24, 19, 11, '2025-10-09 14:57:12'),
(25, 21, 12, '2025-10-09 14:57:12'),
(26, 24, 12, '2025-10-09 14:57:12'),
(27, 22, 13, '2025-10-09 14:57:12'),
(28, 23, 14, '2025-10-09 14:57:12'),
(29, 25, 15, '2025-10-09 14:57:12'),
(30, 26, 15, '2025-10-09 14:57:12'),
(31, 27, 16, '2025-10-09 14:57:12'),
(32, 28, 17, '2025-10-09 14:57:12'),
(33, 29, 18, '2025-10-09 14:57:12'),
(34, 30, 18, '2025-10-09 14:57:12'),
(35, 31, 19, '2025-10-09 14:57:12'),
(36, 32, 20, '2025-10-09 14:57:12'),
(37, 33, 21, '2025-10-09 14:57:12'),
(38, 34, 22, '2025-10-09 14:57:12'),
(39, 35, 23, '2025-10-09 14:57:12'),
(40, 36, 23, '2025-10-09 14:57:12'),
(41, 37, 23, '2025-10-09 14:57:12'),
(42, 38, 24, '2025-10-09 14:57:12'),
(43, 39, 24, '2025-10-09 14:57:12'),
(44, 40, 25, '2025-10-09 14:57:12'),
(45, 41, 25, '2025-10-09 14:57:12'),
(46, 42, 26, '2025-10-09 14:57:12'),
(47, 43, 27, '2025-10-09 14:57:12'),
(48, 44, 28, '2025-10-09 14:57:12'),
(49, 45, 28, '2025-10-09 14:57:12'),
(50, 46, 28, '2025-10-09 14:57:12'),
(51, 47, 29, '2025-10-09 14:57:12'),
(52, 48, 30, '2025-10-09 14:57:12'),
(53, 49, 31, '2025-10-09 14:57:12'),
(54, 50, 32, '2025-10-09 14:57:12'),
(55, 51, 32, '2025-10-09 14:57:12'),
(56, 52, 33, '2025-10-09 14:57:12'),
(57, 53, 33, '2025-10-09 14:57:12'),
(58, 54, 34, '2025-10-09 14:57:12'),
(59, 55, 35, '2025-10-09 14:57:12'),
(60, 56, 35, '2025-10-09 14:57:12'),
(61, 57, 36, '2025-10-09 14:57:12'),
(62, 58, 37, '2025-10-09 14:57:12'),
(63, 59, 37, '2025-10-09 14:57:12'),
(64, 60, 38, '2025-10-09 14:57:12'),
(65, 61, 38, '2025-10-09 14:57:12'),
(66, 62, 38, '2025-10-09 14:57:12'),
(67, 63, 39, '2025-10-09 14:57:12'),
(68, 64, 40, '2025-10-09 14:57:12'),
(69, 65, 41, '2025-10-09 14:57:12'),
(70, 68, 41, '2025-10-09 14:57:12'),
(71, 66, 42, '2025-10-09 14:57:12'),
(72, 67, 43, '2025-10-09 14:57:12'),
(73, 69, 44, '2025-10-09 14:57:12'),
(74, 70, 44, '2025-10-09 14:57:12'),
(75, 72, 45, '2025-10-09 14:57:12'),
(76, 73, 45, '2025-10-09 14:57:12'),
(77, 71, 46, '2025-10-09 14:57:12'),
(78, 74, 47, '2025-10-09 14:57:58'),
(79, 75, 47, '2025-10-09 14:57:58'),
(80, 78, 47, '2025-10-09 14:57:58'),
(81, 76, 48, '2025-10-09 14:57:58'),
(82, 79, 48, '2025-10-09 14:57:58'),
(83, 77, 49, '2025-10-09 14:57:58'),
(84, 78, 49, '2025-10-09 14:57:58');

-- --------------------------------------------------------

--
-- Table structure for table `staff`
--

CREATE TABLE `staff` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `display_name` varchar(255) DEFAULT NULL,
  `specialties` text,
  `bio` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `staff`
--

INSERT INTO `staff` (`id`, `user_id`, `company_id`, `display_name`, `specialties`, `bio`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 4, 1, 'Eszter - Senior Kozmetikus', 'Új szakterületek...', 'Új bio szöveg...', 1, '2025-10-09 16:41:10', '2025-12-12 10:35:54'),
(2, 5, 1, 'Kati', 'Masszázs, Testkezelés, Cellulit kezelés', 'Testmasszázs és testformálás specialista. Segítek a tökéletes alak elérésében.', 0, '2025-10-09 16:41:10', '2025-12-12 10:32:32'),
(3, 6, 1, 'Zsófi', 'Manikűr, Pedikűr, Géllakk', 'Köröm specialista vagyok, aki imádja a kreatív körömdíszítéseket és a tökéletes géllakkot.', 1, '2025-10-09 16:41:10', NULL),
(4, 7, 2, 'Márta', 'Svéd masszázs, Aromaterápia, Relaxációs masszázs', 'Certificált masszőr vagyok, aki a teljes körű ellazulást és regenerációt helyezi előtérbe.', 1, '2025-10-09 16:41:10', NULL),
(5, 8, 2, 'Júlia', 'Talpmasszázs, Thai masszázs, Sportmasszázs', '10 éve foglalkozom masszázzsal. Sportolóknak és aktív életmódot élőknek ajánlom szolgáltatásaimat.', 1, '2025-10-09 16:41:10', NULL),
(6, 9, 2, 'Ildikó', 'Wellness kezelések, SPA kezelések, Wellness tanácsadás', 'Wellness szakértő vagyok, aki a holisztikus megközelítést képviseli a teljes testi-lelki harmónia érdekében.', 1, '2025-10-09 16:41:10', NULL);

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
  `type` enum('day_off','custom_hours') NOT NULL COMMENT 'teljes szabi vagy egyedi időablak',
  `note` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `staff_exceptions`
--

INSERT INTO `staff_exceptions` (`id`, `staff_id`, `date`, `start_time`, `end_time`, `type`, `note`, `created_at`, `deleted_at`, `is_deleted`) VALUES
(1, 1, '2025-12-24', NULL, NULL, 'day_off', 'Karácsonyi szabadság', '2025-12-11 10:27:22', '2025-12-11 11:36:48', 1),
(2, 1, '2025-12-15', '07:00:00', '15:00:00', 'custom_hours', 'Korai műszak - családi program délután', '2025-12-11 10:27:22', NULL, 0),
(3, 1, '2025-12-20', '09:00:00', '13:00:00', 'custom_hours', 'Orvosi vizsgálat délután', '2025-12-11 10:27:23', NULL, 0),
(4, 2, '2025-12-27', NULL, NULL, 'day_off', 'Téli szabadság - 1. nap', '2025-12-11 10:27:23', NULL, 0),
(5, 2, '2025-12-28', NULL, NULL, 'day_off', 'Téli szabadság - 2. nap', '2025-12-11 10:27:23', NULL, 0),
(6, 2, '2025-12-18', '12:00:00', '20:00:00', 'custom_hours', 'Délutános műszak', '2025-12-11 10:27:23', NULL, 0),
(7, 3, '2025-12-13', NULL, NULL, 'day_off', 'Betegszabadság', '2025-12-11 10:27:23', NULL, 0),
(8, 3, '2025-12-19', '14:00:00', '20:00:00', 'custom_hours', 'Csak délután - vizsgaidőszak', '2025-12-11 10:27:23', NULL, 0),
(9, 4, '2025-12-16', NULL, NULL, 'day_off', 'Továbbképzés', '2025-12-11 10:27:23', NULL, 0),
(10, 4, '2025-12-21', '08:00:00', '20:00:00', 'custom_hours', 'Spa rendezvény - hosszabb műszak', '2025-12-11 10:27:23', NULL, 0),
(11, 5, '2025-12-31', NULL, NULL, 'day_off', 'Szilveszter', '2025-12-11 10:27:23', NULL, 0),
(12, 5, '2026-01-01', NULL, NULL, 'day_off', 'Újév', '2025-12-11 10:27:23', NULL, 0),
(13, 1, '2025-12-25', NULL, NULL, 'day_off', 'Karácsonyi pihenőnap', '2025-12-11 10:30:20', NULL, 0),
(14, 3, '2025-12-23', '09:00:00', '13:00:00', 'custom_hours', 'Csak délelőtt', '2025-12-11 10:30:36', NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `staff_services`
--

CREATE TABLE `staff_services` (
  `id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `staff_services`
--

INSERT INTO `staff_services` (`id`, `staff_id`, `service_id`, `created_at`) VALUES
(2, 1, 2, '2025-12-01 13:05:52'),
(3, 1, 3, '2025-12-01 13:05:52');

-- --------------------------------------------------------

--
-- Table structure for table `staff_working_hours`
--

CREATE TABLE `staff_working_hours` (
  `id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `day_of_week` enum('monday','tuesday','wednesday','thursday','friday','saturday','sunday') NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `is_available` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `staff_working_hours`
--

INSERT INTO `staff_working_hours` (`id`, `staff_id`, `day_of_week`, `start_time`, `end_time`, `is_available`, `created_at`, `updated_at`) VALUES
(1, 1, 'monday', '10:00:00', '18:00:00', 1, '2025-10-09 14:41:18', '2025-12-11 10:22:02'),
(2, 1, 'tuesday', '09:00:00', '17:00:00', 1, '2025-10-09 14:41:18', NULL),
(3, 1, 'wednesday', '09:00:00', '17:00:00', 1, '2025-10-09 14:41:18', NULL),
(4, 1, 'thursday', '09:00:00', '17:00:00', 1, '2025-10-09 14:41:18', NULL),
(5, 1, 'friday', '09:00:00', '17:00:00', 1, '2025-10-09 14:41:18', NULL),
(6, 1, 'saturday', NULL, NULL, 0, '2025-10-09 14:41:18', '2025-12-11 10:22:18'),
(7, 1, 'sunday', NULL, NULL, 0, '2025-10-09 14:41:18', NULL),
(8, 2, 'monday', NULL, NULL, 0, '2025-10-09 14:41:18', NULL),
(9, 2, 'tuesday', '10:00:00', '18:00:00', 1, '2025-10-09 14:41:18', NULL),
(10, 2, 'wednesday', '10:00:00', '18:00:00', 1, '2025-10-09 14:41:18', NULL),
(11, 2, 'thursday', '10:00:00', '18:00:00', 1, '2025-10-09 14:41:18', NULL),
(12, 2, 'friday', '10:00:00', '18:00:00', 1, '2025-10-09 14:41:18', NULL),
(13, 2, 'saturday', '10:00:00', '18:00:00', 1, '2025-10-09 14:41:18', NULL),
(14, 2, 'sunday', NULL, NULL, 0, '2025-10-09 14:41:18', NULL),
(15, 3, 'monday', '08:00:00', '16:00:00', 1, '2025-10-09 14:41:18', NULL),
(16, 3, 'tuesday', '12:00:00', '20:00:00', 1, '2025-10-09 14:41:18', NULL),
(17, 3, 'wednesday', '08:00:00', '16:00:00', 1, '2025-10-09 14:41:18', NULL),
(18, 3, 'thursday', '12:00:00', '20:00:00', 1, '2025-10-09 14:41:18', NULL),
(19, 3, 'friday', '08:00:00', '16:00:00', 1, '2025-10-09 14:41:18', NULL),
(20, 3, 'saturday', NULL, NULL, 0, '2025-10-09 14:41:18', NULL),
(21, 3, 'sunday', NULL, NULL, 0, '2025-10-09 14:41:18', NULL),
(22, 4, 'monday', '09:00:00', '17:00:00', 1, '2025-10-09 14:41:18', NULL),
(23, 4, 'tuesday', '09:00:00', '17:00:00', 1, '2025-10-09 14:41:18', NULL),
(24, 4, 'wednesday', '09:00:00', '17:00:00', 1, '2025-10-09 14:41:18', NULL),
(25, 4, 'thursday', '09:00:00', '17:00:00', 1, '2025-10-09 14:41:18', NULL),
(26, 4, 'friday', '09:00:00', '17:00:00', 1, '2025-10-09 14:41:18', NULL),
(27, 4, 'saturday', NULL, NULL, 0, '2025-10-09 14:41:18', NULL),
(28, 4, 'sunday', NULL, NULL, 0, '2025-10-09 14:41:18', NULL),
(29, 5, 'monday', '11:00:00', '19:00:00', 1, '2025-10-09 14:41:18', NULL),
(30, 5, 'tuesday', '11:00:00', '19:00:00', 1, '2025-10-09 14:41:18', NULL),
(31, 5, 'wednesday', '11:00:00', '19:00:00', 1, '2025-10-09 14:41:18', NULL),
(32, 5, 'thursday', '11:00:00', '19:00:00', 1, '2025-10-09 14:41:18', NULL),
(33, 5, 'friday', '11:00:00', '19:00:00', 1, '2025-10-09 14:41:18', NULL),
(34, 5, 'saturday', '10:00:00', '15:00:00', 1, '2025-10-09 14:41:18', NULL),
(35, 5, 'sunday', NULL, NULL, 0, '2025-10-09 14:41:18', NULL),
(36, 6, 'monday', NULL, NULL, 0, '2025-10-09 14:41:18', NULL),
(37, 6, 'tuesday', NULL, NULL, 0, '2025-10-09 14:41:18', NULL),
(38, 6, 'wednesday', '10:00:00', '18:00:00', 1, '2025-10-09 14:41:18', NULL),
(39, 6, 'thursday', '10:00:00', '18:00:00', 1, '2025-10-09 14:41:18', NULL),
(40, 6, 'friday', '10:00:00', '18:00:00', 1, '2025-10-09 14:41:18', NULL),
(41, 6, 'saturday', '10:00:00', '18:00:00', 1, '2025-10-09 14:41:18', NULL),
(42, 6, 'sunday', '10:00:00', '18:00:00', 1, '2025-10-09 14:41:18', NULL);

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `temporary_closed_periods`
--

INSERT INTO `temporary_closed_periods` (`id`, `company_id`, `start_date`, `end_date`, `open_time`, `close_time`, `created_at`, `updated_at`) VALUES
(1, 1, '2025-12-24', '2025-12-26', NULL, NULL, '2025-10-09 14:45:47', NULL),
(2, 1, '2025-12-31', '2025-12-31', '09:00:00', '14:00:00', '2025-10-09 14:45:47', NULL),
(3, 1, '2026-01-01', '2026-01-01', NULL, NULL, '2025-10-09 14:45:47', NULL),
(4, 1, '2026-08-01', '2026-08-15', NULL, NULL, '2025-10-09 14:45:47', NULL),
(5, 2, '2025-12-23', '2025-12-27', NULL, NULL, '2025-10-09 14:45:47', NULL),
(6, 2, '2025-12-31', '2025-12-31', '10:00:00', '15:00:00', '2025-10-09 14:45:47', NULL),
(7, 2, '2026-01-01', '2026-01-02', NULL, NULL, '2025-10-09 14:45:47', NULL),
(8, 2, '2026-07-15', '2026-07-31', NULL, NULL, '2025-10-09 14:45:47', NULL),
(9, 3, '2025-12-24', '2025-12-26', NULL, NULL, '2025-10-09 14:45:47', NULL),
(10, 3, '2026-03-15', '2026-03-15', NULL, NULL, '2025-10-09 14:45:47', NULL),
(11, 3, '2026-08-10', '2026-08-25', NULL, NULL, '2025-10-09 14:45:47', NULL),
(12, 4, '2025-12-24', '2025-12-25', NULL, NULL, '2025-10-09 14:45:47', NULL),
(13, 4, '2025-12-26', '2025-12-26', '10:00:00', '16:00:00', '2025-10-09 14:45:47', NULL),
(14, 4, '2026-01-15', '2026-01-20', NULL, NULL, '2025-10-09 14:45:47', NULL),
(15, 5, '2025-12-22', '2026-01-05', NULL, NULL, '2025-10-09 14:45:47', NULL),
(16, 5, '2026-07-01', '2026-07-31', NULL, NULL, '2025-10-09 14:45:47', NULL),
(17, 6, '2025-12-24', '2025-12-26', NULL, NULL, '2025-10-09 14:45:47', NULL),
(18, 6, '2026-02-10', '2026-02-15', NULL, NULL, '2025-10-09 14:45:47', NULL),
(19, 6, '2026-08-20', '2026-08-31', NULL, NULL, '2025-10-09 14:45:47', NULL),
(20, 7, '2025-12-24', '2025-12-25', NULL, NULL, '2025-10-09 14:45:47', NULL),
(21, 7, '2025-12-31', '2025-12-31', '08:00:00', '13:00:00', '2025-10-09 14:45:47', NULL),
(22, 7, '2026-08-05', '2026-08-20', NULL, NULL, '2025-10-09 14:45:47', NULL),
(23, 8, '2025-12-23', '2026-01-02', NULL, NULL, '2025-10-09 14:45:47', NULL),
(24, 8, '2026-07-10', '2026-07-25', NULL, NULL, '2025-10-09 14:45:47', NULL),
(25, 9, '2025-12-24', '2025-12-26', NULL, NULL, '2025-10-09 14:45:47', NULL),
(26, 9, '2026-01-01', '2026-01-01', NULL, NULL, '2025-10-09 14:45:47', NULL),
(27, 9, '2026-08-01', '2026-08-14', NULL, NULL, '2025-10-09 14:45:47', NULL),
(28, 10, '2025-12-24', '2025-12-27', NULL, NULL, '2025-10-09 14:45:47', NULL),
(29, 10, '2026-07-20', '2026-08-05', NULL, NULL, '2025-10-09 14:45:47', NULL),
(30, 11, '2025-12-25', '2025-12-25', NULL, NULL, '2025-10-09 14:45:47', NULL),
(31, 11, '2026-01-01', '2026-01-01', NULL, NULL, '2025-10-09 14:45:47', NULL),
(32, 12, '2025-12-24', '2025-12-26', NULL, NULL, '2025-10-09 14:45:47', NULL),
(33, 12, '2026-08-10', '2026-08-24', NULL, NULL, '2025-10-09 14:45:47', NULL),
(34, 13, '2025-12-24', '2025-12-26', NULL, NULL, '2025-10-09 14:45:47', NULL),
(35, 13, '2025-12-31', '2026-01-01', NULL, NULL, '2025-10-09 14:45:47', NULL),
(36, 13, '2026-08-15', '2026-08-30', NULL, NULL, '2025-10-09 14:45:47', NULL),
(37, 14, '2025-12-23', '2025-12-27', NULL, NULL, '2025-10-09 14:45:47', NULL),
(38, 14, '2026-07-25', '2026-08-10', NULL, NULL, '2025-10-09 14:45:47', NULL),
(39, 15, '2025-12-24', '2025-12-25', NULL, NULL, '2025-10-09 14:45:47', NULL),
(40, 15, '2025-12-31', '2025-12-31', '09:00:00', '14:00:00', '2025-10-09 14:45:47', NULL),
(41, 15, '2026-08-05', '2026-08-18', NULL, NULL, '2025-10-09 14:45:47', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tokens`
--

CREATE TABLE `tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(500) NOT NULL,
  `type` varchar(100) NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_revoked` tinyint(1) DEFAULT '0',
  `revoked_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `tokens`
--

INSERT INTO `tokens` (`id`, `user_id`, `token`, `type`, `expires_at`, `is_revoked`, `revoked_at`, `created_at`) VALUES
(9, 32, 'c2193c46e898acc9d555787e22d168b2', 'email_verify', '2025-12-12 18:55:15', 0, NULL, '2025-12-11 18:55:15'),
(10, 33, 'ca0fc2b313aeada43b74dbf35c798526', 'email_verify', '2025-12-13 10:00:07', 0, NULL, '2025-12-12 10:00:07');

-- --------------------------------------------------------

--
-- Table structure for table `two_factor_recovery_codes`
--

CREATE TABLE `two_factor_recovery_codes` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `code` varchar(64) NOT NULL COMMENT 'Hashed recovery code',
  `used_at` datetime DEFAULT NULL,
  `is_used` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `guid` char(36) NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `password` text NOT NULL,
  `phone` varchar(30) NOT NULL,
  `company_id` int(11) DEFAULT NULL COMMENT 'NULL for superadmins or independent clients',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `last_login` datetime DEFAULT NULL,
  `register_finished_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Admins can deactivate users',
  `two_factor_enabled` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Whether 2FA is enabled',
  `two_factor_secret` varchar(32) DEFAULT NULL COMMENT 'TOTP secret key (encrypted)',
  `two_factor_confirmed_at` datetime DEFAULT NULL COMMENT 'When 2FA was confirmed/activated'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `guid`, `first_name`, `last_name`, `email`, `password`, `phone`, `company_id`, `created_at`, `updated_at`, `deleted_at`, `is_deleted`, `last_login`, `register_finished_at`, `is_active`, `two_factor_enabled`, `two_factor_secret`, `two_factor_confirmed_at`) VALUES
(1, '63f866da-a827-11f0-82be-e9727e212b75', 'Gábor', 'Nagy', 'gabor.nagy@bookr.hu', '$2y$10$abcdefghijklmnopqrstuv', '+36301234567', NULL, '2025-10-09 16:14:23', NULL, NULL, 0, NULL, '2025-10-09 16:14:23', 1, 0, NULL, NULL),
(2, '63f892d6-a827-11f0-82be-e9727e212b75', 'Péter', 'Kovács', 'peter.kovacs@szepsegszalon.hu', '$2y$10$bcdefghijklmnopqrstuvw', '+36302345678', 1, '2025-10-09 16:14:23', NULL, NULL, 0, NULL, '2025-10-09 16:14:23', 1, 0, NULL, NULL),
(3, '63f8961e-a827-11f0-82be-e9727e212b75', 'Anna', 'Szabó', 'anna.szabo@wellness.hu', '$2y$10$cdefghijklmnopqrstuvwx', '+36303456789', 2, '2025-10-09 16:14:23', NULL, NULL, 0, NULL, '2025-10-09 16:14:23', 1, 0, NULL, NULL),
(4, '63f89772-a827-11f0-82be-e9727e212b75', 'Eszter', 'Tóth', 'eszter.toth@szepsegszalon.hu', '$2y$10$defghijklmnopqrstuvwxy', '+36304567890', 1, '2025-10-09 16:14:23', NULL, NULL, 0, NULL, '2025-10-09 16:14:23', 1, 0, NULL, NULL),
(5, '63f8988a-a827-11f0-82be-e9727e212b75', 'Katalin', 'Molnár', 'katalin.molnar@szepsegszalon.hu', '$2y$10$efghijklmnopqrstuvwxyz', '+36305678901', 1, '2025-10-09 16:14:23', NULL, NULL, 0, NULL, '2025-10-09 16:14:23', 1, 0, NULL, NULL),
(6, '63f8998e-a827-11f0-82be-e9727e212b75', 'Zsófia', 'Kiss', 'zsofia.kiss@szepsegszalon.hu', '$2y$10$fghijklmnopqrstuvwxyza', '+36306789012', 1, '2025-10-09 16:14:23', NULL, NULL, 0, NULL, '2025-10-09 16:14:23', 1, 0, NULL, NULL),
(7, '63f89a7e-a827-11f0-82be-e9727e212b75', 'Márta', 'Horváth', 'marta.horvath@wellness.hu', '$2y$10$ghijklmnopqrstuvwxyzab', '+36307890123', 2, '2025-10-09 16:14:23', NULL, NULL, 0, NULL, '2025-10-09 16:14:23', 1, 0, NULL, NULL),
(8, '63f89b6e-a827-11f0-82be-e9727e212b75', 'Júlia', 'Varga', 'julia.varga@wellness.hu', '$2y$10$hijklmnopqrstuvwxyzabc', '+36308901234', 2, '2025-10-09 16:14:23', NULL, NULL, 0, NULL, '2025-10-09 16:14:23', 1, 0, NULL, NULL),
(9, '63f89c72-a827-11f0-82be-e9727e212b75', 'Ildikó', 'Balogh', 'ildiko.balogh@wellness.hu', '$2y$10$ijklmnopqrstuvwxyzabcd', '+36309012345', 2, '2025-10-09 16:14:23', NULL, NULL, 0, NULL, '2025-10-09 16:14:23', 1, 0, NULL, NULL),
(10, '63f89d58-a827-11f0-82be-e9727e212b75', 'János', 'Farkas', 'janos.farkas@gmail.com', '$2y$10$jklmnopqrstuvwxyzabcde', '+36201234567', NULL, '2025-10-09 16:14:23', NULL, NULL, 0, NULL, '2025-10-09 16:14:23', 1, 0, NULL, NULL),
(11, '63f89e48-a827-11f0-82be-e9727e212b75', 'Éva', 'Simon', 'eva.simon@gmail.com', '$2y$10$klmnopqrstuvwxyzabcdef', '+36202345678', NULL, '2025-10-09 16:14:23', NULL, NULL, 0, NULL, '2025-10-09 16:14:23', 1, 0, NULL, NULL),
(12, '63f89f38-a827-11f0-82be-e9727e212b75', 'László', 'Németh', 'laszlo.nemeth@freemail.hu', '$2y$10$lmnopqrstuvwxyzabcdefg', '+36203456789', NULL, '2025-10-09 16:14:23', NULL, NULL, 0, NULL, '2025-10-09 16:14:23', 1, 0, NULL, NULL),
(13, '63f8a06e-a827-11f0-82be-e9727e212b75', 'Mária', 'Papp', 'maria.papp@citromail.hu', '$2y$10$mnopqrstuvwxyzabcdefgh', '+36204567890', NULL, '2025-10-09 16:14:23', NULL, NULL, 0, NULL, '2025-10-09 16:14:23', 1, 0, NULL, NULL),
(14, '63f8a15e-a827-11f0-82be-e9727e212b75', 'István', 'Takács', 'istvan.takacs@outlook.com', '$2y$10$nopqrstuvwxyzabcdefghi', '+36205678901', NULL, '2025-10-09 16:14:23', NULL, NULL, 0, NULL, '2025-10-09 16:14:23', 1, 0, NULL, NULL),
(15, '63f8a244-a827-11f0-82be-e9727e212b75', 'Ágnes', 'Lakatos', 'agnes.lakatos@yahoo.com', '$2y$10$opqrstuvwxyzabcdefghij', '+36206789012', NULL, '2025-10-09 16:14:23', NULL, NULL, 0, NULL, '2025-10-09 16:14:23', 1, 0, NULL, NULL),
(16, '63f8a3b6-a827-11f0-82be-e9727e212b75', 'Teszt', 'Lajos', 'teszt@teszt.com', 'Alma!123', '+367012345678', NULL, '2025-10-10 16:43:02', NULL, NULL, 0, NULL, NULL, 0, 0, NULL, NULL),
(17, '63f8a58c-a827-11f0-82be-e9727e212b75', 'Teszt', 'Aladár', 'aladar@teszt.com', '$argon2id$v=19$m=65536,t=3,p=1$L7naGVB2eKFjndxep9p0eQ$A/j8QkNLRcL8+i+uxS53PvvNdJCBPzOpUPTuokE1WaI', '+367012345678', NULL, '2025-10-10 16:49:09', NULL, NULL, 0, NULL, NULL, 0, 0, NULL, NULL),
(18, 'f8e34f45-d5aa-11f0-972d-94e23c940cf4', 'Sándor', 'László', 'lacika@gmail.com', '$argon2id$v=19$m=65536,t=3,p=1$4ZcoWslloOnpOReRBkDphQ$1dJvd08oeeHN7m4tNf7hY1VjSeGv0XvJu4rgWl+SKLY', '+367013565678', NULL, '2025-10-17 11:20:15', NULL, NULL, 0, NULL, NULL, 0, 0, NULL, NULL),
(21, '7d78c18c-ae61-11f0-b2dc-2a23318b2722', 'Sándor', 'László', 'alma@gmail.com', '$argon2id$v=19$m=65536,t=3,p=1$y1aWgzGwmDzrxviR4yxpSw$EQbDcIBHMBXYbKfALlhrKLVR1WMQ58EbNB7XZ6IYGic', '+367014565678', NULL, '2025-10-21 11:36:58', NULL, NULL, 0, NULL, NULL, 0, 0, NULL, NULL),
(22, 'eb931f32-ae61-11f0-b2dc-2a23318b2722', 'Sándor', 'László', 'almaaa@gmail.com', '$argon2id$v=19$m=65536,t=3,p=1$Mrx15QBn0fr6S4bTdcR51w$f5kj7gloDsIH+3ghUNo2o/L3iMLbOlki+gi7lANR2WE', '+367014465678', NULL, '2025-10-21 11:40:03', NULL, NULL, 0, '2025-12-06 13:30:23', NULL, 0, 0, NULL, NULL),
(23, '12e0f3a2-d298-11f0-9a88-bf216494b8de', 'Dorián', 'Zsolt', '092@drxy.hu', '$argon2id$v=19$m=65536,t=3,p=1$LZBgb2sLLH0XtjXITpHL4w$0Av6knJziVje8PnS+bV4fxY4ZweU5S+kN6ZnslI0+nA', '+3670123252', NULL, '2025-12-06 12:38:24', NULL, NULL, 0, NULL, '2025-12-06 13:17:00', 1, 0, NULL, NULL),
(24, '59286216-d29b-11f0-9a88-bf216494b8de', 'Benjamin', 'Vasvári', 'vasvariben@gmail.com', '$argon2id$v=19$m=65536,t=3,p=1$8M4CsVWNHZB2eWujo4Of8A$XwsdxqnBSBu4HbsZUQDxzjaPCt/LkSN9kFqoQRsLub4', '+36704134374', NULL, '2025-12-06 13:01:50', NULL, NULL, 0, '2025-12-09 18:41:59', '2025-12-06 13:26:53', 1, 0, NULL, NULL),
(25, 'f5ad54b8-d41a-11f0-b0d7-1c68b34b5ceb', 'Jancsi', 'Teszt', 'teszt@teszt.hu', '$argon2id$v=19$m=65536,t=3,p=1$6PjP6Jwsv7g/WVe7ClSjOA$Tww++HMs5oY5Kn77fBnsDX8HC0lA22LvquMnCLwr0MQ', '+36301234567', NULL, '2025-12-08 10:47:50', '2025-12-12 10:24:15', NULL, 0, NULL, '2025-12-08 10:48:29', 0, 0, NULL, NULL),
(26, 'b54f3219-d5b1-11f0-972d-94e23c940cf4', 'Test', 'User', 'test99@example.com', 'hash...', '+36701234567', NULL, '2025-12-10 11:19:27', NULL, NULL, 0, NULL, NULL, 0, 0, NULL, NULL),
(27, '182b2af2-d5b3-11f0-972d-94e23c940cf4', 'Teszt', 'Elek', 'teszt.elek@example.com', '$argon2id$v=19$m=65536,t=3,p=1$test123', '+36701112233', NULL, '2025-12-10 11:29:22', NULL, NULL, 0, NULL, NULL, 0, 0, NULL, NULL),
(30, '3adf17d2-d6b4-11f0-8c83-94e23c940cf4', 'Teszt', 'Elek', 'teszt@example.hu', '$2y$10$UJ_JELSZÓ_HASH', '+36301112233', NULL, '2025-12-11 18:10:01', '2025-12-11 18:44:47', NULL, 0, NULL, '2025-12-11 18:12:30', 1, 0, NULL, NULL),
(31, 'ea162e9d-d6b4-11f0-8c83-94e23c940cf4', 'Anna', 'Kovács', 'anna@example.hu', '$2y$10$xyz', '+36309998877', NULL, '2025-12-11 18:14:55', NULL, NULL, 0, NULL, NULL, 0, 0, NULL, NULL),
(32, '5f2646eb-d6ba-11f0-8c83-94e23c940cf4', 'Teszt', 'Resend', 'resend@test.com', '$2y$10$test_password', '+36301234567', NULL, '2025-12-11 18:53:59', NULL, NULL, 0, NULL, NULL, 0, 0, NULL, NULL),
(33, 'f7e221e3-d738-11f0-8c83-94e23c940cf4', 'Teszt', 'Béla', 'teszt.bela@example.com', '$argon2id$v=19$m=65536,t=3,p=1$test123', '+36701234999', NULL, '2025-12-12 10:00:07', NULL, NULL, 0, NULL, NULL, 0, 0, NULL, NULL);

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `user_x_role`
--

INSERT INTO `user_x_role` (`id`, `user_id`, `role_id`, `assigned_at`, `un_assigned_at`, `is_un_assigned`) VALUES
(1, 1, 1, '2025-10-09 14:17:56', NULL, 0),
(2, 1, 4, '2025-10-09 14:17:56', NULL, 0),
(3, 2, 2, '2025-10-09 14:17:56', NULL, 0),
(4, 2, 4, '2025-10-09 14:17:56', NULL, 0),
(5, 3, 2, '2025-10-09 14:17:56', NULL, 0),
(6, 3, 4, '2025-10-09 14:17:56', NULL, 0),
(7, 4, 3, '2025-10-09 14:17:56', NULL, 0),
(8, 4, 4, '2025-10-09 14:17:56', NULL, 0),
(9, 5, 3, '2025-10-09 14:17:56', NULL, 0),
(10, 5, 4, '2025-10-09 14:17:56', NULL, 0),
(11, 6, 3, '2025-10-09 14:17:56', NULL, 0),
(12, 6, 4, '2025-10-09 14:17:56', NULL, 0),
(13, 7, 3, '2025-10-09 14:17:56', NULL, 0),
(14, 7, 4, '2025-10-09 14:17:56', NULL, 0),
(15, 8, 3, '2025-10-09 14:17:56', NULL, 0),
(16, 8, 4, '2025-10-09 14:17:56', NULL, 0),
(17, 9, 3, '2025-10-09 14:17:56', NULL, 0),
(18, 9, 4, '2025-10-09 14:17:56', NULL, 0),
(19, 10, 4, '2025-10-09 14:17:56', NULL, 0),
(20, 11, 4, '2025-10-09 14:17:56', NULL, 0),
(21, 12, 4, '2025-10-09 14:17:56', NULL, 0),
(22, 13, 4, '2025-10-09 14:17:56', NULL, 0),
(23, 14, 4, '2025-10-09 14:17:56', NULL, 0),
(24, 15, 4, '2025-10-09 14:17:56', NULL, 0),
(25, 16, 4, '2025-10-10 14:43:02', NULL, 0),
(26, 17, 4, '2025-10-10 14:49:09', NULL, 0),
(27, 18, 4, '2025-10-17 09:20:15', NULL, 0),
(28, 21, 4, '2025-10-21 09:36:58', NULL, 0),
(29, 22, 4, '2025-10-21 09:40:03', NULL, 0),
(30, 23, 4, '2025-12-06 11:38:24', NULL, 0),
(31, 24, 4, '2025-12-06 12:01:50', NULL, 0),
(32, 25, 4, '2025-12-08 09:47:50', NULL, 0),
(33, 26, 4, '2025-12-10 10:19:27', NULL, 0),
(34, 27, 4, '2025-12-10 10:29:23', NULL, 0),
(36, 30, 4, '2025-12-11 17:10:01', NULL, 0),
(37, 31, 4, '2025-12-11 17:14:55', NULL, 0),
(38, 32, 4, '2025-12-11 17:53:59', NULL, 0),
(39, 33, 4, '2025-12-12 09:00:07', NULL, 0);

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
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_is_read` (`is_read`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_related_appointment` (`related_appointment_id`),
  ADD KEY `idx_related_company` (`related_company_id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT for table `business_categories`
--
ALTER TABLE `business_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `companies`
--
ALTER TABLE `companies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `favorites`
--
ALTER TABLE `favorites`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `images`
--
ALTER TABLE `images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `notification_settings`
--
ALTER TABLE `notification_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `opening_hours`
--
ALTER TABLE `opening_hours`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=80;

--
-- AUTO_INCREMENT for table `service_categories`
--
ALTER TABLE `service_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT for table `service_category_map`
--
ALTER TABLE `service_category_map`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=85;

--
-- AUTO_INCREMENT for table `staff`
--
ALTER TABLE `staff`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `staff_exceptions`
--
ALTER TABLE `staff_exceptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `staff_services`
--
ALTER TABLE `staff_services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `staff_working_hours`
--
ALTER TABLE `staff_working_hours`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `temporary_closed_periods`
--
ALTER TABLE `temporary_closed_periods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT for table `tokens`
--
ALTER TABLE `tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `two_factor_recovery_codes`
--
ALTER TABLE `two_factor_recovery_codes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `user_x_role`
--
ALTER TABLE `user_x_role`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

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
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_appointment` FOREIGN KEY (`related_appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_notifications_company` FOREIGN KEY (`related_company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

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

CREATE DEFINER=`root`@`localhost` EVENT `cleanOldAuditLogs` ON SCHEDULE EVERY 1 WEEK STARTS '2025-12-12 10:13:56' ON COMPLETION NOT PRESERVE ENABLE DO BEGIN
    -- Régi audit logok törlése (365 napnál régebbiek)
    DELETE FROM `audit_logs`
    WHERE `created_at` < DATE_SUB(NOW(), INTERVAL 365 DAY);
END$$

CREATE DEFINER=`root`@`localhost` EVENT `deactivateInactiveUsers` ON SCHEDULE EVERY 1 MONTH STARTS '2025-12-12 10:15:05' ON COMPLETION NOT PRESERVE ENABLE DO BEGIN
    -- Userek akik 180 napja nem jelentkeztek be
    UPDATE `users`
    SET 
        `is_active` = FALSE,
        `updated_at` = NOW()
    WHERE `last_login` < DATE_SUB(NOW(), INTERVAL 180 DAY)
      AND `is_active` = TRUE
      AND `is_deleted` = FALSE;
END$$

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

CREATE DEFINER=`root`@`localhost` EVENT `autoCleanExpiredAppointments` ON SCHEDULE EVERY 1 DAY STARTS '2025-12-13 02:00:00' ON COMPLETION PRESERVE ENABLE COMMENT 'No_show-ra állítja a lejárt pending appointmenteket' DO CALL cancelExpiredPendingAppointments()$$

DELIMITER ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
