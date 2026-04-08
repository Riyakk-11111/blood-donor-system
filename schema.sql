CREATE DATABASE IF NOT EXISTS blood_donor_db;
USE blood_donor_db;

CREATE TABLE IF NOT EXISTS donors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    blood_group VARCHAR(5) NOT NULL,
    city VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    age INT,
    gender VARCHAR(10),
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emergency_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_name VARCHAR(100) NOT NULL,
    blood_group VARCHAR(5) NOT NULL,
    city VARCHAR(50) NOT NULL,
    contact VARCHAR(20) NOT NULL,
    urgency_level VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'OPEN',
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
