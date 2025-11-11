-- Hotel Reservation System Schema
-- Charset and engine settings are aligned with typical MySQL 8 setups.

CREATE DATABASE IF NOT EXISTS hotel_reservation
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE hotel_reservation;

-- USERS: signup/login and roles
CREATE TABLE IF NOT EXISTS users (
  user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(191) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('guest','reception','housekeeping','admin') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- HOTELS: managed by admin
CREATE TABLE IF NOT EXISTS hotels (
  hotel_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  location VARCHAR(150) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ROOMS: availability and pricing
CREATE TABLE IF NOT EXISTS rooms (
  room_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hotel_id INT UNSIGNED NOT NULL,
  room_number VARCHAR(20) NOT NULL,
  type ENUM('Standard','Deluxe','Suite') NOT NULL,
  status ENUM('available','occupied','dirty','maintenance') NOT NULL DEFAULT 'available',
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_hotel_room (hotel_id, room_number),
  KEY idx_rooms_hotel (hotel_id),
  CONSTRAINT fk_rooms_hotel FOREIGN KEY (hotel_id)
    REFERENCES hotels(hotel_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- RESERVATIONS
CREATE TABLE IF NOT EXISTS reservations (
  reservation_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,          -- guest who booked
  room_id INT UNSIGNED NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  status ENUM('pending','confirmed','checked_in','checked_out','cancelled') NOT NULL DEFAULT 'pending',
  total_price DECIMAL(10,2) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_reservations_user (user_id),
  KEY idx_reservations_room_dates (room_id, check_in_date, check_out_date),
  KEY idx_reservations_status (status),
  CONSTRAINT fk_res_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_res_room FOREIGN KEY (room_id)
    REFERENCES rooms(room_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CHECK-INS (Reception)
CREATE TABLE IF NOT EXISTS check_ins (
  check_in_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reservation_id INT UNSIGNED NOT NULL,
  staff_user_id INT UNSIGNED NULL,  -- reception user who processed
  check_in_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes VARCHAR(255) NULL,
  UNIQUE KEY uq_checkin_reservation (reservation_id),
  KEY idx_checkins_staff (staff_user_id),
  CONSTRAINT fk_ci_res FOREIGN KEY (reservation_id)
    REFERENCES reservations(reservation_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ci_staff FOREIGN KEY (staff_user_id)
    REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CHECK-OUTS (Reception)
CREATE TABLE IF NOT EXISTS check_outs (
  check_out_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reservation_id INT UNSIGNED NOT NULL,
  staff_user_id INT UNSIGNED NULL,  -- reception user who processed
  check_out_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes VARCHAR(255) NULL,
  UNIQUE KEY uq_checkout_reservation (reservation_id),
  KEY idx_checkouts_staff (staff_user_id),
  CONSTRAINT fk_co_res FOREIGN KEY (reservation_id)
    REFERENCES reservations(reservation_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_co_staff FOREIGN KEY (staff_user_id)
    REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ROOM STATUS HISTORY (Housekeeping)
CREATE TABLE IF NOT EXISTS room_status_logs (
  status_log_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  room_id INT UNSIGNED NOT NULL,
  previous_status ENUM('available','occupied','dirty','maintenance') NULL,
  new_status ENUM('available','occupied','dirty','maintenance') NOT NULL,
  updated_by INT UNSIGNED NULL,         -- housekeeping or reception user
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes VARCHAR(255) NULL,
  KEY idx_status_room (room_id),
  KEY idx_status_user (updated_by),
  CONSTRAINT fk_status_room FOREIGN KEY (room_id)
    REFERENCES rooms(room_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_status_user FOREIGN KEY (updated_by)
    REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- MAINTENANCE LOGS (Housekeeping/Admin)
CREATE TABLE IF NOT EXISTS maintenance_logs (
  maintenance_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  room_id INT UNSIGNED NOT NULL,
  description VARCHAR(255) NOT NULL,
  severity ENUM('low','medium','high','critical') NOT NULL DEFAULT 'low',
  status ENUM('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
  created_by INT UNSIGNED NULL,              -- housekeeping/admin
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL DEFAULT NULL,
  KEY idx_maint_room (room_id),
  KEY idx_maint_status (status),
  CONSTRAINT fk_maint_room FOREIGN KEY (room_id)
    REFERENCES rooms(room_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_maint_user FOREIGN KEY (created_by)
    REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PAYMENTS (Optional but useful for reports)
CREATE TABLE IF NOT EXISTS payments (
  payment_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reservation_id INT UNSIGNED NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  method ENUM('cash','card','mobile','bank') NOT NULL,
  status ENUM('pending','paid','refunded') NOT NULL DEFAULT 'paid',
  paid_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_pay_res (reservation_id),
  CONSTRAINT fk_pay_res FOREIGN KEY (reservation_id)
    REFERENCES reservations(reservation_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- VIEWS: basic analytics/reports
DROP VIEW IF EXISTS v_daily_occupancy;
CREATE VIEW v_daily_occupancy AS
SELECT
  d.dt AS date,
  h.hotel_id,
  h.name AS hotel_name,
  COUNT(DISTINCT r.room_id) AS occupied_rooms
FROM (
  SELECT DATE_SUB(CURDATE(), INTERVAL seq DAY) AS dt
  FROM (
    SELECT 0 AS seq UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
    UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9
    UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14
  ) AS seqs
) d
JOIN reservations res ON d.dt BETWEEN res.check_in_date AND DATE_SUB(res.check_out_date, INTERVAL 1 DAY)
JOIN rooms r ON r.room_id = res.room_id
JOIN hotels h ON h.hotel_id = r.hotel_id
GROUP BY d.dt, h.hotel_id, h.name;

DROP VIEW IF EXISTS v_revenue_by_day;
CREATE VIEW v_revenue_by_day AS
SELECT
  DATE(p.paid_at) AS date,
  SUM(p.amount) AS total_revenue
FROM payments p
WHERE p.status = 'paid'
GROUP BY DATE(p.paid_at)
ORDER BY DATE(p.paid_at);
