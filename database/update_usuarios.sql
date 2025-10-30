-- Script rápido para actualizar solo la estructura de usuarios

-- Verificar columna correo_recuperacion
SELECT 
    COLUMN_NAME, 
    COLUMN_TYPE, 
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'usuarios'
AND COLUMN_NAME IN ('correo_recuperacion', 'rol');

-- Ver todos los usuarios con sus correos de recuperación
SELECT
    id,
    nombre_completo,
    correo_institucional,
    correo_recuperacion,
    rol
FROM usuarios;
