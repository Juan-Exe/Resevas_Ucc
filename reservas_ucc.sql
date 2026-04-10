-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 10-04-2026 a las 02:53:34
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `reservas_ucc`
--
CREATE DATABASE IF NOT EXISTS `reservas_ucc` DEFAULT CHARACTER SET utf8 COLLATE utf8_spanish2_ci;
USE `reservas_ucc`;

DELIMITER $$
--
-- Procedimientos
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `limpiar_codigos_expirados` ()   BEGIN
    DELETE FROM codigos_verificacion
    WHERE fecha_expiracion < NOW() OR usado = 1;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `codigos_verificacion`
--

CREATE TABLE `codigos_verificacion` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `codigo` varchar(6) NOT NULL,
  `email_destino` varchar(255) NOT NULL,
  `usado` tinyint(4) DEFAULT 0,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_expiracion` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `codigos_verificacion`
--

-- Sin datos de prueba en codigos_verificacion

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notificaciones`
--

CREATE TABLE `notificaciones` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `reserva_id` int(11) NOT NULL,
  `tipo` enum('aceptada','rechazada') NOT NULL,
  `mensaje` varchar(500) NOT NULL,
  `leida` tinyint(4) DEFAULT 0,
  `fecha_creacion` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `notificaciones`
--

-- Sin datos de prueba en notificaciones

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reservas`
--

CREATE TABLE `reservas` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `piso` int(11) DEFAULT NULL,
  `tipo_espacio` varchar(255) DEFAULT NULL,
  `bloque` varchar(255) DEFAULT NULL,
  `nombre_espacio` varchar(255) DEFAULT NULL,
  `fecha` date DEFAULT NULL,
  `hora` varchar(255) DEFAULT NULL,
  `motivo` text DEFAULT NULL,
  `estado` enum('pendiente','aceptada','rechazada') DEFAULT 'pendiente',
  `fecha_respuesta` datetime DEFAULT NULL,
  `respondido_por` int(11) DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish2_ci;

--
-- Volcado de datos para la tabla `reservas`
--

INSERT INTO `reservas` (`id`, `usuario_id`, `piso`, `tipo_espacio`, `bloque`, `nombre_espacio`, `fecha`, `hora`, `motivo`, `estado`, `fecha_respuesta`, `respondido_por`, `fecha_creacion`) VALUES
(1, NULL, 1, 'Auditorio', NULL, 'Auditorio', '2025-10-20', '6:00pm a 9:00pm', 'Se necesita reserva de auditorio y se edito la reserva', 'pendiente', NULL, NULL, '2025-10-17 00:47:10'),
(4, NULL, 1, 'Auditorio', NULL, 'Auditorio', '2025-10-20', '12:00pm a 3:00pm', 'Reserva 3\n', 'pendiente', NULL, NULL, '2025-10-17 01:06:57'),
(5, NULL, 1, 'Auditorio', NULL, 'Auditorio', '2025-10-20', '3:00pm a 6:00pm', 'Reserva 4', 'pendiente', NULL, NULL, '2025-10-17 01:07:17'),
(7, NULL, 2, 'Salon', 'Bloque A', 'Salon 217', '2025-10-18', '6:00am a 9:00am', 'Solucitud tal', 'pendiente', NULL, NULL, '2025-10-17 01:16:26'),
(9, NULL, 4, 'Salon', 'Bloque A', 'Salon 420', '2025-10-19', '6:00am a 9:00am', 'Solicitud de apartado', 'pendiente', NULL, NULL, '2025-10-17 20:43:59'),
(11, NULL, 2, 'Salon', 'Bloque A', 'Salon 217', '2025-10-20', '9:00am a 12:00pm', 'SAadsads', 'pendiente', NULL, NULL, '2025-10-18 01:06:48'),
(12, NULL, 1, 'Auditorio', NULL, 'Auditorio', '2025-10-20', '6:00am a 9:00am', 'Dasdas', 'pendiente', NULL, NULL, '2025-10-18 01:07:45'),
(13, NULL, 1, 'Canchas', NULL, 'Cancha de futbol', '2025-10-16', '3:00pm a 6:00pm', 'Se solicita reserva', 'pendiente', NULL, NULL, '2025-10-21 21:00:53'),
(14, NULL, 3, 'Salon', 'Bloque A', 'Salon 320', '2025-10-16', '9:00am a 12:00pm', 'Se solicita espacio', 'pendiente', NULL, NULL, '2025-10-22 00:03:49'),
(15, NULL, 1, 'Auditorio', NULL, 'Auditorio', '2025-10-20', '9:00am a 12:00pm', 'kleewkl', 'pendiente', NULL, NULL, '2025-10-22 00:09:04'),
(16, NULL, 2, 'Laboratorio de fisica', 'Bloque B', 'Laboratorio de fisica', '2025-10-23', '6:00am a 9:00am', 'Se necesita reservar laboratorio de fisica', 'pendiente', NULL, NULL, '2025-10-23 11:05:28'),
(17, NULL, 2, 'Laboratorio de fisica', 'Bloque B', 'Laboratorio de fisica', '2025-10-23', '9:00am a 12:00pm', 'r4', 'pendiente', NULL, NULL, '2025-10-23 11:07:07'),
(19, NULL, 2, 'Laboratorio de fisica', 'Bloque B', 'Laboratorio de fisica', '2025-10-24', '9:00am a 12:00pm', 'iuyiu', 'pendiente', NULL, NULL, '2025-10-23 11:07:23'),
(20, NULL, 2, 'Laboratorio de fisica', 'Bloque B', 'Laboratorio de fisica', '2025-10-23', '6:00pm a 9:00pm', 'jgh', 'pendiente', NULL, NULL, '2025-10-23 11:07:37'),
(21, NULL, 4, 'Salon', 'Bloque A', 'Salon 420', '2025-10-25', '9:00am a 12:00pm', 'porque si', 'pendiente', NULL, NULL, '2025-10-23 11:15:38'),
(23, NULL, 2, 'Laboratorio de fisica', 'Bloque B', 'Laboratorio de fisica', '2025-10-24', '6:00am a 9:00am', 'hyrhyr', 'pendiente', NULL, NULL, '2025-10-23 12:51:51'),
(25, NULL, 1, 'Auditorio', NULL, 'Auditorio', '2025-10-30', '6:00am a 9:00am', 'khkj', 'pendiente', NULL, NULL, '2025-10-30 11:20:56'),
(26, NULL, 3, 'Salon', 'Bloque B', 'Salon 305', '2025-10-30', '3:00pm a 6:00pm', 'kugukgiu', 'pendiente', NULL, NULL, '2025-10-30 13:59:11');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre_completo` varchar(100) NOT NULL,
  `nombre_usuario` varchar(50) NOT NULL,
  `correo_institucional` varchar(100) NOT NULL,
  `correo_recuperacion` varchar(255) DEFAULT NULL,
  `rol` enum('Estudiante','Profesor','Administrador') NOT NULL DEFAULT 'Estudiante',
  `password` varchar(255) NOT NULL,
  `imagen_perfil` varchar(255) DEFAULT 'default-avatar.jpg',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `ultimo_acceso` timestamp NULL DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre_completo`, `nombre_usuario`, `correo_institucional`, `correo_recuperacion`, `rol`, `password`, `imagen_perfil`, `fecha_creacion`, `ultimo_acceso`, `activo`) VALUES
(4, 'Administrador', 'admin', 'admin@ucc.edu.co', NULL, 'Administrador', '$2b$10$hj8abbM9RIWYPx0uRw4hWu8kmmWk4t073wUaewgwdrRVAkANkb/x6', 'default-avatar.svg', '2025-10-30 13:21:19', '2025-11-19 13:46:00', 1);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `codigos_verificacion`
--
ALTER TABLE `codigos_verificacion`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_codigo` (`codigo`),
  ADD KEY `idx_usuario_id` (`usuario_id`),
  ADD KEY `idx_usado` (`usado`);

--
-- Indices de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reserva_id` (`reserva_id`),
  ADD KEY `idx_usuario_leida` (`usuario_id`,`leida`),
  ADD KEY `idx_fecha` (`fecha_creacion`);

--
-- Indices de la tabla `reservas`
--
ALTER TABLE `reservas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_usuario_id` (`usuario_id`),
  ADD KEY `respondido_por` (`respondido_por`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre_usuario` (`nombre_usuario`),
  ADD UNIQUE KEY `correo_institucional` (`correo_institucional`),
  ADD KEY `idx_correo` (`correo_institucional`),
  ADD KEY `idx_usuario` (`nombre_usuario`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `codigos_verificacion`
--
ALTER TABLE `codigos_verificacion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `reservas`
--
ALTER TABLE `reservas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `codigos_verificacion`
--
ALTER TABLE `codigos_verificacion`
  ADD CONSTRAINT `codigos_verificacion_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD CONSTRAINT `notificaciones_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notificaciones_ibfk_2` FOREIGN KEY (`reserva_id`) REFERENCES `reservas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `reservas`
--
ALTER TABLE `reservas`
  ADD CONSTRAINT `reservas_ibfk_1` FOREIGN KEY (`respondido_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `reservas_ibfk_2` FOREIGN KEY (`respondido_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
