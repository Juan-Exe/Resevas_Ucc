-- ============================================
-- SCRIPT COMPLETO DE CONFIGURACIÓN
-- ============================================
-- Este script configura TODO el sistema de una sola vez
-- Seguro de ejecutar: verifica si las cosas ya existen

-- ============================================
-- 1. AGREGAR COLUMNA DE CORREO DE RECUPERACIÓN (si no existe)
-- ============================================

-- Verificar y agregar correo_recuperacion
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'usuarios'
    AND COLUMN_NAME = 'correo_recuperacion'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE usuarios ADD COLUMN correo_recuperacion VARCHAR(255) DEFAULT NULL AFTER correo_institucional',
    'SELECT "Columna correo_recuperacion ya existe" AS Mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 2. CREAR TABLA DE CÓDIGOS DE VERIFICACIÓN (si no existe)
-- ============================================

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

-- ============================================
-- 3. AGREGAR/ACTUALIZAR ROL DE ADMINISTRADOR
-- ============================================

-- Verificar si el ENUM ya tiene 'Administrador'
SET @enum_has_admin = (
    SELECT COLUMN_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'usuarios'
    AND COLUMN_NAME = 'rol'
) LIKE '%Administrador%';

-- Si no tiene Administrador, modificar el ENUM
SET @sql = IF(@enum_has_admin = 0,
    'ALTER TABLE usuarios MODIFY COLUMN rol ENUM(''Estudiante'', ''Profesor'', ''Administrador'') NOT NULL DEFAULT ''Estudiante''',
    'SELECT "Rol Administrador ya existe en ENUM" AS Mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 4. CREAR USUARIO ADMINISTRADOR (si no existe)
-- ============================================

-- Verificar si el usuario admin ya existe
SET @admin_exists = (
    SELECT COUNT(*)
    FROM usuarios
    WHERE correo_institucional = 'admin@ucc.edu.co'
);

-- Si no existe, crearlo
INSERT INTO usuarios (
    nombre_completo,
    nombre_usuario,
    correo_institucional,
    correo_recuperacion,
    rol,
    password,
    imagen_perfil,
    activo
)
SELECT
    'Administrador',
    'admin',
    'admin@ucc.edu.co',
    NULL,
    'Administrador',
    '$2b$10$N9qo8uLOickgx2ZMRZoMye/8dYgzVHLjKZvWvLBLmKWz1lMFLMFLi', -- Contraseña: admin
    'default-avatar.svg',
    1
WHERE @admin_exists = 0;

-- Si ya existe, actualizar su rol a Administrador
UPDATE usuarios
SET rol = 'Administrador', activo = 1
WHERE correo_institucional = 'admin@ucc.edu.co';

-- ============================================
-- 5. AGREGAR COLUMNA 'estado' EN RESERVAS (si no existe)
-- ============================================

SET @estado_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reservas'
    AND COLUMN_NAME = 'estado'
);

SET @sql = IF(@estado_exists = 0,
    'ALTER TABLE reservas ADD COLUMN estado ENUM(''pendiente'', ''aceptada'', ''rechazada'') DEFAULT ''pendiente'' AFTER motivo',
    'SELECT "Columna estado ya existe" AS Mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 6. AGREGAR COLUMNAS ADICIONALES EN RESERVAS (si no existen)
-- ============================================

-- fecha_respuesta
SET @fecha_respuesta_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reservas'
    AND COLUMN_NAME = 'fecha_respuesta'
);

SET @sql = IF(@fecha_respuesta_exists = 0,
    'ALTER TABLE reservas ADD COLUMN fecha_respuesta DATETIME NULL AFTER estado',
    'SELECT "Columna fecha_respuesta ya existe" AS Mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- respondido_por
SET @respondido_por_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reservas'
    AND COLUMN_NAME = 'respondido_por'
);

SET @sql = IF(@respondido_por_exists = 0,
    'ALTER TABLE reservas ADD COLUMN respondido_por INT NULL AFTER fecha_respuesta',
    'SELECT "Columna respondido_por ya existe" AS Mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar foreign key si no existe
SET @fk_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reservas'
    AND CONSTRAINT_NAME LIKE '%respondido_por%'
);

SET @sql = IF(@fk_exists = 0 AND @respondido_por_exists = 1,
    'ALTER TABLE reservas ADD FOREIGN KEY (respondido_por) REFERENCES usuarios(id) ON DELETE SET NULL',
    'SELECT "Foreign key respondido_por ya existe o no se puede crear" AS Mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 7. ACTUALIZAR RESERVAS EXISTENTES A 'pendiente'
-- ============================================

UPDATE reservas
SET estado = 'pendiente'
WHERE estado IS NULL;

-- ============================================
-- 8. CREAR TABLA DE NOTIFICACIONES (si no existe)
-- ============================================

CREATE TABLE IF NOT EXISTS notificaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    reserva_id INT NOT NULL,
    tipo ENUM('aceptada', 'rechazada') NOT NULL,
    mensaje VARCHAR(500) NOT NULL,
    leida TINYINT DEFAULT 0,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE,
    INDEX idx_usuario_leida (usuario_id, leida),
    INDEX idx_fecha (fecha_creacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 9. CREAR PROCEDIMIENTO PARA LIMPIAR CÓDIGOS EXPIRADOS
-- ============================================

DROP PROCEDURE IF EXISTS limpiar_codigos_expirados;

DELIMITER //
CREATE PROCEDURE limpiar_codigos_expirados()
BEGIN
    DELETE FROM codigos_verificacion
    WHERE fecha_expiracion < NOW() OR usado = 1;
END //
DELIMITER ;

-- ============================================
-- 10. VERIFICACIONES FINALES
-- ============================================

-- Verificar que el admin existe
SELECT
    'Usuario Administrador:' AS Info,
    id, nombre_usuario, correo_institucional, rol
FROM usuarios
WHERE rol = 'Administrador';

-- Verificar estructura de usuarios
SELECT
    'Columnas de usuarios:' AS Info,
    COLUMN_NAME, COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'usuarios'
AND COLUMN_NAME IN ('rol', 'correo_recuperacion');

-- Verificar estructura de reservas
SELECT
    'Columnas de reservas:' AS Info,
    COLUMN_NAME, COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'reservas'
AND COLUMN_NAME IN ('estado', 'fecha_respuesta', 'respondido_por');

-- Verificar tablas creadas
SELECT
    'Tablas del sistema:' AS Info,
    TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN ('usuarios', 'reservas', 'codigos_verificacion', 'notificaciones');

-- ============================================
-- RESUMEN
-- ============================================

SELECT '
╔═══════════════════════════════════════════════╗
║   CONFIGURACIÓN COMPLETADA EXITOSAMENTE      ║
╚═══════════════════════════════════════════════╝

✅ Rol de Administrador configurado
✅ Usuario admin creado/actualizado
   - Correo: admin@ucc.edu.co
   - Contraseña: admin

✅ Sistema de recuperación de contraseña
   - Tabla codigos_verificacion
   - Columna correo_recuperacion

✅ Sistema de gestión de reservas
   - Estados: pendiente/aceptada/rechazada
   - Tabla notificaciones

📝 PRÓXIMOS PASOS:
   1. Reinicia el servidor: npm start
   2. Prueba el login con admin@ucc.edu.co / admin
   3. Cambia la contraseña del administrador

' AS '╔═ CONFIGURACIÓN COMPLETA ═╗';
