-- Script SQL para agregar el sistema de roles al proyecto de reservas UCC
-- Ejecutar este script en phpMyAdmin o tu cliente MySQL

-- 1. Agregar columna 'rol' a la tabla usuarios
-- Esta columna permitirá distinguir entre Estudiantes y Profesores
ALTER TABLE usuarios
ADD COLUMN rol ENUM('Estudiante', 'Profesor') NOT NULL DEFAULT 'Estudiante'
AFTER correo_institucional;

-- 2. Actualizar los usuarios existentes con sus roles correspondientes
-- Juan Diego (ID 1) = Estudiante
UPDATE usuarios SET rol = 'Estudiante' WHERE id = 1;

-- Maria Claudia (ID 2) = Profesor
UPDATE usuarios SET rol = 'Profesor' WHERE id = 2;

-- 3. Verificar que los cambios se aplicaron correctamente
SELECT id, nombre_completo, nombre_usuario, correo_institucional, rol, activo
FROM usuarios;

-- Nota: Todos los nuevos usuarios que se registren tendrán que seleccionar
-- su rol (Estudiante o Profesor) en la página de selección antes del registro.
