-- Script temporal para agregar correo de recuperación a tu usuario
-- Esto es solo para pruebas

UPDATE usuarios
SET correo_recuperacion = 'juandiegoarrietaherrera@gmail.com'
WHERE correo_institucional = 'juan.arrietah@ucc.edu.co';

-- Verificar que se actualizó
SELECT id, nombre_completo, correo_institucional, correo_recuperacion
FROM usuarios
WHERE correo_institucional = 'juan.arrietah@ucc.edu.co';
