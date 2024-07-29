create database reliefandrecovery;

CREATE TABLE recovery_centers (
    id SERIAL PRIMARY KEY,
    location VARCHAR(255) NOT NULL,
    services_available TEXT[],
    website VARCHAR(255),
    center_status VARCHAR(50),
    last_updated TIMESTAMP WITHOUT TIME ZONE,
    added_by VARCHAR(100),
    updated_by VARCHAR(100),
    deleted BOOLEAN,
    monday_open TIME WITHOUT TIME ZONE,
    monday_close TIME WITHOUT TIME ZONE,
    tuesday_open TIME WITHOUT TIME ZONE,
    tuesday_close TIME WITHOUT TIME ZONE,
    wednesday_open TIME WITHOUT TIME ZONE,
    wednesday_close TIME WITHOUT TIME ZONE,
    thursday_open TIME WITHOUT TIME ZONE,
    thursday_close TIME WITHOUT TIME ZONE,
    friday_open TIME WITHOUT TIME ZONE,
    friday_close TIME WITHOUT TIME ZONE,
    saturday_open TIME WITHOUT TIME ZONE,
    saturday_close TIME WITHOUT TIME ZONE,
    sunday_open TIME WITHOUT TIME ZONE,
    sunday_close TIME WITHOUT TIME ZONE,
    category VARCHAR(250),
    warning_level VARCHAR(100)
);

INSERT INTO recovery_centers (
    location, services_available, website, center_status, last_updated,
    added_by, updated_by, deleted, monday_open, monday_close,
    tuesday_open, tuesday_close, wednesday_open, wednesday_close,
    thursday_open, thursday_close, friday_open, friday_close,
    saturday_open, saturday_close, sunday_open, sunday_close,
    category, warning_level
) VALUES (
    '12 Seccafien Avenue, Marion SA, Australia',
    '{"service one","service two","service three","service four"}',
    'https://www.alert.sa.gov.au/',
    'Open',
    '"2024-07-22 16:01:55.167309"',
    'Adam',
    'Adam',
    false,
    '04:57:00',
    '17:06:00',
    '02:55:00',
    '17:06:00',
    '03:57:00',
    '15:57:00',
    '03:57:00',
    '15:57:00',
    '03:57:00',
    '15:57:00',
    '03:57:00',
    '15:57:00',
    '03:57:00',
    '18:16:00',
    'Relief Center',
    'Public Notice'
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- password admin
insert into users(email, password) values ('babu@gmail.com','$2b$10$Wip5Lj7Y27NTyBjzU4NUXOUHGJhwDApa.tYatuRPgfO1Xg8Y0kL1i');








