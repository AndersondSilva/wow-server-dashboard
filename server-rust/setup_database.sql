CREATE DATABASE IF NOT EXISTS acore_auth;
CREATE DATABASE IF NOT EXISTS characters;

-- Create user only if it doesn't exist (syntax depends on MySQL version, but this works on recent ones or we catch error)
-- Safer to just grant and let it fail if user exists, or use CREATE USER IF NOT EXISTS
CREATE USER IF NOT EXISTS 'wowuser'@'localhost' IDENTIFIED BY 'wowpassword';
GRANT ALL PRIVILEGES ON acore_auth.* TO 'wowuser'@'localhost';
GRANT ALL PRIVILEGES ON characters.* TO 'wowuser'@'localhost';
FLUSH PRIVILEGES;

USE acore_auth;

CREATE TABLE IF NOT EXISTS account (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(32) NOT NULL UNIQUE,
    sha_pass_hash VARCHAR(40) NOT NULL,
    email VARCHAR(255) NOT NULL,
    expansion TINYINT DEFAULT 2,
    joindate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS realmlist (
    id INT PRIMARY KEY,
    name VARCHAR(32) NOT NULL,
    address VARCHAR(255) NOT NULL,
    port INT NOT NULL,
    icon TINYINT UNSIGNED NOT NULL DEFAULT 0,
    color TINYINT UNSIGNED NOT NULL DEFAULT 2,
    timezone TINYINT UNSIGNED NOT NULL DEFAULT 0,
    allowedSecurityLevel TINYINT UNSIGNED NOT NULL DEFAULT 0,
    population FLOAT NOT NULL DEFAULT 0
);

USE characters;

CREATE TABLE IF NOT EXISTS characters (
    guid INT AUTO_INCREMENT PRIMARY KEY,
    account INT UNSIGNED NOT NULL DEFAULT 0,
    name VARCHAR(12) NOT NULL,
    race TINYINT UNSIGNED NOT NULL DEFAULT 1,
    class TINYINT UNSIGNED NOT NULL DEFAULT 1,
    gender TINYINT UNSIGNED NOT NULL DEFAULT 0,
    level TINYINT UNSIGNED NOT NULL DEFAULT 1,
    xp INT UNSIGNED NOT NULL DEFAULT 0,
    money INT UNSIGNED NOT NULL DEFAULT 0,
    online TINYINT UNSIGNED NOT NULL DEFAULT 0
);
