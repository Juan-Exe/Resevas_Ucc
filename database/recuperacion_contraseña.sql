-- Script SQL para implementar sistema de recuperación de contraseña
-- Ejecutar este script en phpMyAdmin o tu cliente MySQL

-- 1. Agregar columna 'correo_recuperacion' a la tabla usuarios
ALTER TABLE usuarios
ADD COLUMN correo_recuperacion VARCHAR(255) DEFAULT NULL
AFTER correo_institucional;

-- 2. Crear tabla para almacenar códigos de verificación
CREATE TABLE IF NOT EXISTS codigos_verificacion (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    codigo VARCHAR(6) NOT NULL,
    email_destino VARCHAR(255) NOT NULL,
    usado TINYINT DEFAULT 0,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion DATETIME NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_codigo (codigo),
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_usado (usado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Crear procedimiento para limpiar códigos expirados (ejecutar periódicamente)
DELIMITER //
CREATE PROCEDURE limpiar_codigos_expirados()
BEGIN
    DELETE FROM codigos_verificacion
    WHERE fecha_expiracion < NOW() OR usado = 1;
END //
DELIMITER ;

-- Verificar las tablas creadas
SHOW TABLES;
DESCRIBE usuarios;
DESCRIBE codigos_verificacion;
