-- ============================================
-- SISTEMA DE ADMINISTRACIÓN DE RESERVAS
-- ============================================
-- Este script agrega:
-- 1. Rol de Administrador
-- 2. Usuario administrador por defecto
-- 3. Campo de estado en reservas (pendiente/aceptada/rechazada)
-- 4. Tabla de notificaciones para usuarios

-- ============================================
-- 1. AGREGAR ROL DE ADMINISTRADOR
-- ============================================

-- Modificar el ENUM de rol para incluir 'Administrador'
ALTER TABLE usuarios
MODIFY COLUMN rol ENUM('Estudiante', 'Profesor', 'Administrador') NOT NULL DEFAULT 'Estudiante';

-- ============================================
-- 2. CREAR USUARIO ADMINISTRADOR
-- ============================================

-- Contraseña: "admin" hasheada con bcrypt
-- Hash generado: $2b$10$rH5Zx5qLJ5xH9Z5J5xH9Z.5J5xH9Z5J5xH9Z5J5xH9Z5J5xH9Z5J5u
INSERT INTO usuarios (
    nombre_completo,
    nombre_usuario,
    correo_institucional,
    correo_recuperacion,
    rol,
    password,
    imagen_perfil,
    activo
) VALUES (
    'Administrador',
    'admin',
    'admin@ucc.edu.co',
    NULL,
    'Administrador',
    '$2b$10$jxeKOsIGhJAftn6Z1Yis0u9/uk3kKtRWm0ePSXXgOqGUgJ5/nKhKu', -- Contraseña: admin (hash generado localmente)
    'default-avatar.svg',
    1
) ON DUPLICATE KEY UPDATE
    rol = 'Administrador',
    activo = 1;

-- ============================================
-- 3. MODIFICAR TABLA DE RESERVAS
-- ============================================

-- Agregar columna de estado
ALTER TABLE reservas
ADD COLUMN estado ENUM('pendiente', 'aceptada', 'rechazada') DEFAULT 'pendiente' AFTER motivo;

-- Agregar columna de fecha de respuesta
ALTER TABLE reservas
ADD COLUMN fecha_respuesta DATETIME NULL AFTER estado;

-- Agregar columna del admin que respondió
ALTER TABLE reservas
ADD COLUMN respondido_por INT NULL AFTER fecha_respuesta,
ADD FOREIGN KEY (respondido_por) REFERENCES usuarios(id) ON DELETE SET NULL;

-- Actualizar reservas existentes a 'pendiente'
UPDATE reservas SET estado = 'pendiente' WHERE estado IS NULL;

-- ============================================
-- 4. CREAR TABLA DE NOTIFICACIONES
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
-- 5. VERIFICACIONES
-- ============================================

-- Verificar que el rol de administrador existe
SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'usuarios'
AND COLUMN_NAME = 'rol';

-- Verificar que el usuario admin existe
SELECT id, nombre_usuario, correo_institucional, rol
FROM usuarios
WHERE rol = 'Administrador';

-- Verificar estructura de reservas
DESCRIBE reservas;

-- Verificar tabla de notificaciones
DESCRIBE notificaciones;

-- ============================================
-- DATOS DE PRUEBA (OPCIONAL)
-- ============================================

-- Crear algunas reservas de prueba con diferentes estados
-- Descomenta si quieres datos de prueba:

/*
INSERT INTO reservas (usuario_id, tipo_sala, fecha_inicio, fecha_fin, hora_inicio, hora_fin, motivo, estado)
VALUES
    (1, 'Auditorio', '2025-11-01', '2025-11-01', '08:00', '10:00', 'Conferencia de tecnología', 'pendiente'),
    (1, 'Laboratorio', '2025-11-02', '2025-11-02', '14:00', '16:00', 'Práctica de programación', 'pendiente'),
    (2, 'Sala de Juntas', '2025-11-03', '2025-11-03', '10:00', '12:00', 'Reunión de profesores', 'aceptada');
*/

-- ============================================
-- INFORMACIÓN IMPORTANTE
-- ============================================

-- Usuario Administrador:
-- Correo: admin@ucc.edu.co
-- Contraseña: admin
-- Rol: Administrador

-- Estados de reservas:
-- - pendiente: Esperando aprobación del administrador
-- - aceptada: Aprobada por el administrador
-- - rechazada: Rechazada por el administrador

-- NOTA: Cambia la contraseña del administrador después de la primera configuración
