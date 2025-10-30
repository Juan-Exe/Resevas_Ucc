const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();
const port = 3000;

// ============================================
// CONFIGURACIÓN DE EMAIL DEL SISTEMA
// ============================================
// IMPORTANTE: Solo TÚ configuras esto UNA VEZ
// El sistema enviará códigos a CUALQUIER email del usuario (Gmail, Outlook, Hotmail, etc.)
// Los usuarios NO necesitan configurar nada, solo reciben el email

const MODO_DESARROLLO = false; // ✅ CONFIGURADO - Emails reales activados

// ============================================
// OPCIÓN 1: Gmail con contraseña de aplicación - ✅ CONFIGURADA
// ============================================
// Contraseña de aplicación de Gmail configurada correctamente
// El sistema enviará emails REALES a los correos de recuperación de los usuarios

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'juandiegoarrietaherrera@gmail.com',
        pass: 'abeqvvgvxylvyfta' // Contraseña de aplicación (sin espacios)
    }
});

// ============================================
// OPCIÓN 2: Outlook/Hotmail (MÁS FÁCIL - No necesita contraseña de aplicación)
// ============================================
// DESCOMENTA ESTO, comenta la Opción 1 y pon tu contraseña normal:
/*
let transporter;
if (!MODO_DESARROLLO) {
    transporter = nodemailer.createTransport({
        service: 'hotmail', // o 'outlook'
        auth: {
            user: 'tu-correo@outlook.com',
            pass: 'tu-contraseña-normal'
        }
    });
}
*/

// ============================================
// OPCIÓN 3: Gmail con configuración menos segura (RÁPIDA PARA PRUEBAS)
// ============================================
// DESCOMENTA ESTO y comenta la Opción 1:
/*
let transporter;
if (!MODO_DESARROLLO) {
    transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: 'juandiegoarrietaherrera@gmail.com',
            pass: 'tu-contraseña-normal' // Tu contraseña de Gmail
        },
        tls: {
            rejectUnauthorized: false
        }
    });
}
*/

// Nota: Si usas Opción 3, puede que Gmail bloquee el acceso.
// En ese caso, ve a: https://myaccount.google.com/lesssecureapps y actívalo

app.use(express.json());

// Configurar sesiones
app.use(session({
    secret: 'reservas-ucc-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 días
    }
}));

// Configurar Multer para subir imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '..', 'frontend', 'public', 'I-img', 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif)'));
        }
    }
});

// Middleware to log all incoming requests for debugging
app.use((req, res, next) => {
    console.log(`Request received: ${req.method} ${req.url}`);
    next();
});

app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

// Conexión a la base de datos 'reservas_ucc'
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'reservas_ucc'
});

db.connect(err => {
    if (err) {
        console.error('🔴 Error al conectar a la base de datos reservas_ucc:', err);
        return;
    }
    console.log("🟢 Conectado a la base de datos reservas_ucc");
});

// ============================================
// RUTAS DE AUTENTICACIÓN
// ============================================

// Endpoint para REGISTRO de usuarios
app.post('/api/registro', upload.single('imagen_perfil'), async (req, res) => {
    try {
        const { nombre_completo, nombre_usuario, email, password, rol } = req.body;

        // Validar que el correo sea institucional
        if (!email.endsWith('@ucc.edu.co')) {
            return res.status(400).json({ success: false, message: 'Debe usar su correo institucional (@ucc.edu.co)' });
        }

        // Validar que el rol sea válido
        if (!rol || (rol !== 'Estudiante' && rol !== 'Profesor')) {
            return res.status(400).json({ success: false, message: 'Debe seleccionar un rol válido.' });
        }

        // Verificar si el usuario o correo ya existen
        const checkQuery = 'SELECT id FROM usuarios WHERE correo_institucional = ? OR nombre_usuario = ?';
        db.query(checkQuery, [email, nombre_usuario], async (err, results) => {
            if (err) {
                console.error('🔴 Error al verificar usuario:', err);
                return res.status(500).json({ success: false, message: 'Error al verificar el usuario.' });
            }

            if (results.length > 0) {
                return res.status(409).json({ success: false, message: 'El correo o nombre de usuario ya están registrados.' });
            }

            // Hashear la contraseña
            const hashedPassword = await bcrypt.hash(password, 10);

            // Nombre de la imagen (si se subió una)
            const imagenPerfil = req.file ? req.file.filename : 'default-avatar.svg';

            // Insertar el nuevo usuario con su rol
            const insertQuery = 'INSERT INTO usuarios (nombre_completo, nombre_usuario, correo_institucional, rol, password, imagen_perfil) VALUES (?, ?, ?, ?, ?, ?)';
            db.query(insertQuery, [nombre_completo, nombre_usuario, email, rol, hashedPassword, imagenPerfil], (err, result) => {
                if (err) {
                    console.error('🔴 Error al registrar usuario:', err);
                    return res.status(500).json({ success: false, message: 'Error al crear la cuenta.' });
                }

                console.log('🟢 Usuario registrado con éxito. ID:', result.insertId);
                res.status(201).json({
                    success: true,
                    message: 'Usuario registrado exitosamente.',
                    usuario: {
                        id: result.insertId,
                        nombre_completo,
                        nombre_usuario,
                        email,
                        rol,
                        imagen_perfil: imagenPerfil
                    }
                });
            });
        });
    } catch (error) {
        console.error('🔴 Error en el registro:', error);
        res.status(500).json({ success: false, message: 'Error del servidor.' });
    }
});

// Endpoint para LOGIN de usuarios
app.post('/api/login', async (req, res) => {
    try {
        const { email, password, remember } = req.body;

        // Buscar el usuario por correo
        const query = 'SELECT * FROM usuarios WHERE correo_institucional = ? AND activo = 1';
        db.query(query, [email], async (err, results) => {
            if (err) {
                console.error('🔴 Error al buscar usuario:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor.' });
            }

            if (results.length === 0) {
                return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos.' });
            }

            const usuario = results[0];

            // Verificar la contraseña
            const passwordMatch = await bcrypt.compare(password, usuario.password);

            if (!passwordMatch) {
                return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos.' });
            }

            // Actualizar último acceso
            db.query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?', [usuario.id]);

            // Guardar en sesión
            req.session.userId = usuario.id;
            if (remember) {
                req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30; // 30 días
            }

            console.log('🟢 Login exitoso para:', usuario.nombre_usuario);
            res.json({
                success: true,
                message: 'Login exitoso.',
                usuario: {
                    id: usuario.id,
                    nombre_completo: usuario.nombre_completo,
                    nombre_usuario: usuario.nombre_usuario,
                    email: usuario.correo_institucional,
                    correo_recuperacion: usuario.correo_recuperacion,
                    rol: usuario.rol,
                    imagen_perfil: usuario.imagen_perfil
                }
            });
        });
    } catch (error) {
        console.error('🔴 Error en el login:', error);
        res.status(500).json({ success: false, message: 'Error del servidor.' });
    }
});

// Endpoint para LOGOUT
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error al cerrar sesión.' });
        }
        res.json({ success: true, message: 'Sesión cerrada exitosamente.' });
    });
});

// Endpoint para obtener datos del usuario actual
app.get('/api/usuario-actual', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: 'No hay sesión activa.' });
    }

    const query = 'SELECT id, nombre_completo, nombre_usuario, correo_institucional, rol, imagen_perfil FROM usuarios WHERE id = ?';
    db.query(query, [req.session.userId], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }

        const usuario = results[0];
        res.json({
            success: true,
            usuario: {
                id: usuario.id,
                nombre_completo: usuario.nombre_completo,
                nombre_usuario: usuario.nombre_usuario,
                email: usuario.correo_institucional,
                rol: usuario.rol,
                imagen_perfil: usuario.imagen_perfil
            }
        });
    });
});

// Endpoint para actualizar perfil de usuario
app.put('/api/actualizar-perfil', upload.single('imagen_perfil'), async (req, res) => {
    try {
        const { nombre_completo, nombre_usuario, correo_recuperacion, password_actual, password_nueva } = req.body;
        
        // Obtener el usuario de localStorage (desde el cliente)
        // En un sistema real, usaríamos req.session.userId
        const usuarioStr = req.headers['user-data'];
        if (!usuarioStr) {
            return res.status(401).json({ success: false, message: 'No autenticado.' });
        }

        const usuarioData = JSON.parse(usuarioStr);
        const userId = usuarioData.id;

        // Verificar que el usuario exista
        const checkQuery = 'SELECT * FROM usuarios WHERE id = ?';
        db.query(checkQuery, [userId], async (err, results) => {
            if (err || results.length === 0) {
                return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
            }

            const usuario = results[0];

            // Si se quiere cambiar la contraseña, verificar la actual
            if (password_actual && password_nueva) {
                const passwordMatch = await bcrypt.compare(password_actual, usuario.password);
                if (!passwordMatch) {
                    return res.status(401).json({ success: false, message: 'La contraseña actual es incorrecta.' });
                }
            }

            // Verificar que el nombre de usuario no esté en uso por otro usuario
            if (nombre_usuario !== usuario.nombre_usuario) {
                const checkUsuario = 'SELECT id FROM usuarios WHERE nombre_usuario = ? AND id != ?';
                const checkResult = await new Promise((resolve, reject) => {
                    db.query(checkUsuario, [nombre_usuario, userId], (err, results) => {
                        if (err) reject(err);
                        else resolve(results);
                    });
                });

                if (checkResult.length > 0) {
                    return res.status(409).json({ success: false, message: 'El nombre de usuario ya está en uso.' });
                }
            }

            // Preparar datos para actualizar
            let updateData = {
                nombre_completo,
                nombre_usuario,
                correo_recuperacion: correo_recuperacion || null
            };

            // Si hay nueva contraseña, hashearla
            if (password_nueva) {
                updateData.password = await bcrypt.hash(password_nueva, 10);
            }

            // Si hay nueva imagen
            if (req.file) {
                updateData.imagen_perfil = req.file.filename;
                
                // Eliminar imagen anterior si no es la default
                if (usuario.imagen_perfil && usuario.imagen_perfil !== 'default-avatar.svg' && usuario.imagen_perfil !== 'default-avatar.jpg') {
                    const fs = require('fs');
                    const oldImagePath = path.join(__dirname, '..', 'frontend', 'public', 'I-img', 'uploads', usuario.imagen_perfil);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                }
            }

            // Construir query de actualización
            const fields = Object.keys(updateData);
            const values = Object.values(updateData);
            const setClause = fields.map(field => `${field} = ?`).join(', ');
            
            const updateQuery = `UPDATE usuarios SET ${setClause} WHERE id = ?`;
            values.push(userId);

            db.query(updateQuery, values, (err, result) => {
                if (err) {
                    console.error('🔴 Error al actualizar perfil:', err);
                    return res.status(500).json({ success: false, message: 'Error al actualizar el perfil.' });
                }

                console.log('🟢 Perfil actualizado con éxito. ID:', userId);
                
                // Retornar datos actualizados
                res.json({
                    success: true,
                    message: 'Perfil actualizado exitosamente.',
                    usuario: {
                        id: userId,
                        nombre_completo,
                        nombre_usuario,
                        email: usuario.correo_institucional,
                        rol: usuario.rol,
                        correo_recuperacion: updateData.correo_recuperacion,
                        imagen_perfil: updateData.imagen_perfil || usuario.imagen_perfil
                    }
                });
            });
        });
    } catch (error) {
        console.error('🔴 Error en actualización de perfil:', error);
        res.status(500).json({ success: false, message: 'Error del servidor.' });
    }
});

// ============================================
// RUTAS DE RESERVAS
// ============================================

// Endpoint para OBTENER las horas reservadas para un espacio y fecha
app.get('/api/reservas', (req, res) => {
    const { fecha, nombre_espacio } = req.query;

    if (!fecha || !nombre_espacio) {
        return res.status(400).json({ success: false, message: 'Faltan los parámetros fecha o nombre_espacio.' });
    }

    const query = 'SELECT hora FROM reservas WHERE fecha = ? AND nombre_espacio = ?';
    const formattedDate = new Date(fecha).toISOString().slice(0, 10);

    db.query(query, [formattedDate, nombre_espacio], (err, results) => {
        if (err) {
            console.error('🔴 Error al consultar las reservas:', err);
            return res.status(500).json({ success: false, message: 'Error al obtener las reservas.' });
        }
        const reservedHours = results.map(row => row.hora);
        res.json({ success: true, reservedHours });
    });
});

// Endpoint para verificar la disponibilidad de un día completo
app.get('/api/reservas/disponibilidad', (req, res) => {
    const { fecha, nombre_espacio } = req.query;

    if (!fecha || !nombre_espacio) {
        return res.status(400).json({ success: false, message: 'Faltan los parámetros fecha o nombre_espacio.' });
    }

    const query = 'SELECT COUNT(*) as count FROM reservas WHERE fecha = ? AND nombre_espacio = ?';
    const formattedDate = new Date(fecha).toISOString().slice(0, 10);

    db.query(query, [formattedDate, nombre_espacio], (err, results) => {
        if (err) {
            console.error('🔴 Error al consultar la disponibilidad:', err);
            return res.status(500).json({ success: false, message: 'Error al obtener la disponibilidad.' });
        }
        const count = results[0].count;
        res.json({ success: true, count });
    });
});


// Endpoint para GUARDAR una reserva (con validación)
app.post('/api/reservar', (req, res) => {
    const { floor, spaceType, block, spaceName, date, hour, reason } = req.body;

    const formattedDate = new Date(date).toISOString().slice(0, 10);

    // 1. Verificar si el horario ya está ocupado
    const checkQuery = 'SELECT id FROM reservas WHERE fecha = ? AND nombre_espacio = ? AND hora = ?';
    db.query(checkQuery, [formattedDate, spaceName, hour], (err, results) => {
        if (err) {
            console.error('🔴 Error al verificar la reserva:', err);
            return res.status(500).json({ success: false, message: 'Error al verificar la disponibilidad.' });
        }

        if (results.length > 0) {
            // Si hay resultados, el horario está ocupado
            return res.status(409).json({ success: false, message: 'Este horario ya ha sido reservado. Por favor, elija otro.' });
        }

        // 2. Si está libre, proceder con la inserción
        const reserva = {
            piso: floor,
            tipo_espacio: spaceType,
            bloque: block,
            nombre_espacio: spaceName,
            fecha: formattedDate,
            hora: hour,
            motivo: reason
        };

        const insertQuery = 'INSERT INTO reservas SET ?';
        db.query(insertQuery, reserva, (err, result) => {
            if (err) {
                console.error('🔴 Error al insertar la reserva:', err);
                return res.status(500).json({ success: false, message: 'Error al guardar la reserva.' });
            }
            console.log('🟢 Reserva guardada con éxito. ID:', result.insertId);
            res.status(201).json({ success: true, message: 'Reserva guardada con éxito.' });
        });
    });
});

// Endpoint para OBTENER TODAS las reservas
app.get('/api/todas-las-reservas', (req, res) => {
    const query = 'SELECT * FROM reservas ORDER BY fecha, hora';
    db.query(query, (err, results) => {
        if (err) {
            console.error('🔴 Error al consultar todas las reservas:', err);
            return res.status(500).json({ success: false, message: 'Error al obtener las reservas.' });
        }
        res.json({ success: true, reservas: results });
    });
});

// Endpoint para ELIMINAR una reserva
app.delete('/api/reservas/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM reservas WHERE id = ?';

    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('🔴 Error al eliminar la reserva:', err);
            return res.status(500).json({ success: false, message: 'Error al eliminar la reserva.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'No se encontró la reserva.' });
        }
        console.log('🟢 Reserva eliminada con éxito. ID:', id);
        res.json({ success: true, message: 'Reserva eliminada con éxito.' });
    });
});

// Endpoint para OBTENER UNA SOLA reserva por ID
app.get('/api/reservas/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM reservas WHERE id = ?';

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('🔴 Error al obtener la reserva:', err);
            return res.status(500).json({ success: false, message: 'Error al obtener la reserva.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'No se encontró la reserva.' });
        }
        res.json({ success: true, reserva: results[0] });
    });
});

// Endpoint para ACTUALIZAR una reserva
app.put('/api/reservas/:id', (req, res) => {
    const { id } = req.params;
    const { motivo, horario, dia } = req.body;

    // Formatear la fecha si es necesario
    const formattedDate = new Date(dia).toISOString().slice(0, 10);

    const query = 'UPDATE reservas SET motivo = ?, hora = ?, fecha = ? WHERE id = ?';

    db.query(query, [motivo, horario, formattedDate, id], (err, result) => {
        if (err) {
            console.error('🔴 Error al actualizar la reserva:', err);
            return res.status(500).json({ success: false, message: 'Error al actualizar la reserva.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'No se encontró la reserva.' });
        }
        console.log('🟢 Reserva actualizada con éxito. ID:', id);
        res.json({ success: true, message: 'Reserva actualizada con éxito.' });
    });
});

// ============================================
// RUTAS DE RECUPERACIÓN DE CONTRASEÑA
// ============================================

// Función para censurar email
function censurarEmail(email) {
    const [usuario, dominio] = email.split('@');
    const usuarioCensurado = usuario.length > 2
        ? usuario[0] + '*'.repeat(usuario.length - 2) + usuario[usuario.length - 1]
        : usuario[0] + '*';

    const partesDominio = dominio.split('.');
    const dominioCensurado = partesDominio.map((parte, index) => {
        if (index === partesDominio.length - 1) return parte; // No censurar la extensión (.com, .co, etc.)
        return parte.length > 2
            ? parte[0] + '*'.repeat(parte.length - 2) + parte[parte.length - 1]
            : parte[0] + '*';
    }).join('.');

    return `${usuarioCensurado}@${dominioCensurado}`;
}

// Endpoint para verificar si el usuario tiene correo de recuperación
app.post('/api/recuperar-password/verificar-usuario', (req, res) => {
    try {
        const { email_institucional } = req.body;

        console.log('🔍 [VERIFICAR USUARIO] Iniciando verificación para:', email_institucional);

        // Validar email institucional
        if (!email_institucional || !email_institucional.endsWith('@ucc.edu.co')) {
            console.log('❌ [VERIFICAR USUARIO] Email no válido');
            return res.status(400).json({ success: false, message: 'Debe usar un correo institucional válido (@ucc.edu.co)' });
        }

        // Buscar usuario por correo institucional
        const query = 'SELECT id, nombre_completo, correo_recuperacion FROM usuarios WHERE correo_institucional = ? AND activo = 1';
        db.query(query, [email_institucional], (err, results) => {
            if (err) {
                console.error('🔴 [VERIFICAR USUARIO] Error al buscar usuario:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor.' });
            }

            console.log(`📊 [VERIFICAR USUARIO] Usuarios encontrados: ${results.length}`);

            if (results.length === 0) {
                console.log('❌ [VERIFICAR USUARIO] No se encontró usuario');
                return res.status(404).json({ success: false, message: 'No se encontró un usuario con ese correo institucional.' });
            }

            const usuario = results[0];
            console.log(`👤 [VERIFICAR USUARIO] Usuario encontrado:`, {
                id: usuario.id,
                nombre: usuario.nombre_completo,
                tiene_correo_recuperacion: !!usuario.correo_recuperacion,
                correo_recuperacion: usuario.correo_recuperacion || 'NULL'
            });

            // Verificar que tenga correo de recuperación
            if (!usuario.correo_recuperacion) {
                console.log('❌ [VERIFICAR USUARIO] Usuario no tiene correo de recuperación');
                return res.status(400).json({
                    success: false,
                    message: 'No tienes un correo de recuperación registrado. Por favor, agrega uno en tu perfil.'
                });
            }

            // Censurar correo de recuperación
            const correoCensurado = censurarEmail(usuario.correo_recuperacion);
            console.log(`✅ [VERIFICAR USUARIO] Correo censurado:`, correoCensurado);

            // Usuario existe y tiene correo de recuperación
            console.log('🟢 [VERIFICAR USUARIO] Usuario verificado con correo de recuperación:', usuario.nombre_completo);
            res.json({
                success: true,
                message: 'Usuario verificado correctamente.',
                correo_recuperacion_censurado: correoCensurado
            });
        });
    } catch (error) {
        console.error('🔴 [VERIFICAR USUARIO] Error en verificación de usuario:', error);
        res.status(500).json({ success: false, message: 'Error del servidor.' });
    }
});

// Endpoint para solicitar código de verificación
app.post('/api/recuperar-password/solicitar', async (req, res) => {
    try {
        const { email_institucional } = req.body;

        console.log('📧 [SOLICITAR CÓDIGO] Iniciando solicitud para:', email_institucional);

        // Validar email institucional
        if (!email_institucional || !email_institucional.endsWith('@ucc.edu.co')) {
            console.log('❌ [SOLICITAR CÓDIGO] Email no válido');
            return res.status(400).json({ success: false, message: 'Debe usar un correo institucional válido (@ucc.edu.co)' });
        }

        // Buscar usuario por correo institucional
        const query = 'SELECT id, nombre_completo, correo_recuperacion FROM usuarios WHERE correo_institucional = ? AND activo = 1';
        db.query(query, [email_institucional], async (err, results) => {
            if (err) {
                console.error('🔴 [SOLICITAR CÓDIGO] Error al buscar usuario:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor.' });
            }

            console.log(`📊 [SOLICITAR CÓDIGO] Usuarios encontrados: ${results.length}`);

            if (results.length === 0) {
                console.log('❌ [SOLICITAR CÓDIGO] No se encontró usuario');
                return res.status(404).json({ success: false, message: 'No se encontró un usuario con ese correo institucional.' });
            }

            const usuario = results[0];
            console.log(`👤 [SOLICITAR CÓDIGO] Usuario:`, {
                id: usuario.id,
                nombre: usuario.nombre_completo,
                correo_recuperacion: usuario.correo_recuperacion || 'NULL'
            });

            // Verificar que tenga correo de recuperación
            if (!usuario.correo_recuperacion) {
                console.log('❌ [SOLICITAR CÓDIGO] Usuario no tiene correo de recuperación');
                return res.status(400).json({
                    success: false,
                    message: 'Debes agregar un correo de recuperación en tu perfil antes de poder recuperar tu contraseña.'
                });
            }

            // Generar código de 6 dígitos
            const codigo = Math.floor(100000 + Math.random() * 900000).toString();
            console.log('🔑 [SOLICITAR CÓDIGO] Código generado:', codigo);

            // Calcular fecha de expiración (15 minutos)
            const fechaExpiracion = new Date();
            fechaExpiracion.setMinutes(fechaExpiracion.getMinutes() + 15);

            // Guardar código en la base de datos
            const insertQuery = 'INSERT INTO codigos_verificacion (usuario_id, codigo, email_destino, fecha_expiracion) VALUES (?, ?, ?, ?)';
            console.log('💾 [SOLICITAR CÓDIGO] Guardando código en BD...');
            db.query(insertQuery, [usuario.id, codigo, usuario.correo_recuperacion, fechaExpiracion], async (err, result) => {
                if (err) {
                    console.error('🔴 [SOLICITAR CÓDIGO] Error al guardar código:', err);
                    return res.status(500).json({ success: false, message: 'Error al generar el código de verificación.' });
                }

                console.log('✅ [SOLICITAR CÓDIGO] Código guardado en BD con ID:', result.insertId);

                // Enviar email con el código
                const mailOptions = {
                    from: 'Sistema de Reservas UCC <noreply@ucc.edu.co>',
                    to: usuario.correo_recuperacion,
                    subject: 'Código de Recuperación de Contraseña - UCC',
                    html: `
                        <div style="font-family: 'Lato', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <div style="background-color: #006FBF; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                                <h1 style="color: white; margin: 0; font-size: 24px;">Sistema de Reservas UCC</h1>
                            </div>
                            <div style="background-color: #f5f5f5; padding: 40px; border-radius: 0 0 8px 8px;">
                                <h2 style="color: #333; margin-top: 0;">Hola, ${usuario.nombre_completo}</h2>
                                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                                    Recibimos una solicitud para recuperar tu contraseña. Usa el siguiente código de verificación:
                                </p>
                                <div style="background-color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 30px 0;">
                                    <div style="font-size: 36px; font-weight: bold; color: #006FBF; letter-spacing: 8px;">
                                        ${codigo}
                                    </div>
                                </div>
                                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                                    Este código expirará en <strong>15 minutos</strong>.
                                </p>
                                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                                    Si no solicitaste este código, puedes ignorar este mensaje.
                                </p>
                                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                                <p style="color: #999; font-size: 12px; text-align: center;">
                                    Universidad Cooperativa de Colombia<br>
                                    Sistema de Reservas
                                </p>
                            </div>
                        </div>
                    `
                };

                try {
                    if (MODO_DESARROLLO) {
                        // En modo desarrollo, solo mostrar el código en consola
                        console.log('═══════════════════════════════════════════════');
                        console.log('🧪 MODO DESARROLLO - NO SE ENVIÓ EMAIL REAL');
                        console.log('═══════════════════════════════════════════════');
                        console.log('👤 Usuario:', usuario.nombre_completo);
                        console.log('📧 Email destino:', usuario.correo_recuperacion);
                        console.log('🔑 CÓDIGO DE VERIFICACIÓN:', codigo);
                        console.log('⏰ Expira en: 15 minutos');
                        console.log('📅 Fecha expiración:', fechaExpiracion.toLocaleString());
                        console.log('═══════════════════════════════════════════════');
                        console.log('✅ [SOLICITAR CÓDIGO] Proceso completado exitosamente');
                    } else {
                        // En producción, enviar email real
                        console.log('📤 [SOLICITAR CÓDIGO] Enviando email a:', usuario.correo_recuperacion);
                        await transporter.sendMail(mailOptions);
                        console.log('✅ [SOLICITAR CÓDIGO] Email enviado exitosamente');
                    }

                    console.log('🟢 [SOLICITAR CÓDIGO] Respuesta enviada al cliente');
                    res.json({
                        success: true,
                        message: 'Código de verificación enviado exitosamente.',
                        email_destino: usuario.correo_recuperacion
                    });
                } catch (emailError) {
                    console.error('🔴 Error al enviar email:', emailError);
                    // Eliminar el código si no se pudo enviar el email
                    db.query('DELETE FROM codigos_verificacion WHERE id = ?', [result.insertId]);

                    res.status(500).json({
                        success: false,
                        message: 'Error al enviar el código por email. Por favor, intenta nuevamente.'
                    });
                }
            });
        });
    } catch (error) {
        console.error('🔴 Error en solicitud de recuperación:', error);
        res.status(500).json({ success: false, message: 'Error del servidor.' });
    }
});

// Endpoint para verificar código
app.post('/api/recuperar-password/verificar-codigo', (req, res) => {
    try {
        const { email, codigo } = req.body;

        if (!email || !codigo) {
            return res.status(400).json({ success: false, message: 'Email y código son requeridos.' });
        }

        // Buscar usuario
        const userQuery = 'SELECT id FROM usuarios WHERE correo_institucional = ? AND activo = 1';
        db.query(userQuery, [email], (err, userResults) => {
            if (err || userResults.length === 0) {
                return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
            }

            const usuarioId = userResults[0].id;

            // Verificar código
            const codigoQuery = `
                SELECT id, fecha_expiracion
                FROM codigos_verificacion
                WHERE usuario_id = ? AND codigo = ? AND usado = 0
                ORDER BY fecha_creacion DESC
                LIMIT 1
            `;

            db.query(codigoQuery, [usuarioId, codigo], (err, codigoResults) => {
                if (err) {
                    console.error('🔴 Error al verificar código:', err);
                    return res.status(500).json({ success: false, message: 'Error del servidor.' });
                }

                if (codigoResults.length === 0) {
                    return res.status(400).json({ success: false, message: 'Código inválido o ya utilizado.' });
                }

                const codigoData = codigoResults[0];
                const ahora = new Date();
                const fechaExpiracion = new Date(codigoData.fecha_expiracion);

                if (ahora > fechaExpiracion) {
                    return res.status(400).json({ success: false, message: 'El código ha expirado. Solicita uno nuevo.' });
                }

                console.log('🟢 Código verificado correctamente para usuario ID:', usuarioId);
                res.json({ success: true, message: 'Código verificado correctamente.' });
            });
        });
    } catch (error) {
        console.error('🔴 Error en verificación de código:', error);
        res.status(500).json({ success: false, message: 'Error del servidor.' });
    }
});

// Endpoint para cambiar contraseña
app.post('/api/recuperar-password/cambiar', async (req, res) => {
    try {
        const { email, codigo, nueva_password } = req.body;

        if (!email || !codigo || !nueva_password) {
            return res.status(400).json({ success: false, message: 'Todos los campos son requeridos.' });
        }

        if (nueva_password.length < 8) {
            return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 8 caracteres.' });
        }

        // Buscar usuario
        const userQuery = 'SELECT id, password FROM usuarios WHERE correo_institucional = ? AND activo = 1';
        db.query(userQuery, [email], async (err, userResults) => {
            if (err || userResults.length === 0) {
                return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
            }

            const usuario = userResults[0];

            // Verificar que la nueva contraseña no sea igual a la actual
            const mismaPassword = await bcrypt.compare(nueva_password, usuario.password);
            if (mismaPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'La nueva contraseña no puede ser igual a la contraseña actual.'
                });
            }

            // Verificar código
            const codigoQuery = `
                SELECT id
                FROM codigos_verificacion
                WHERE usuario_id = ? AND codigo = ? AND usado = 0 AND fecha_expiracion > NOW()
                ORDER BY fecha_creacion DESC
                LIMIT 1
            `;

            db.query(codigoQuery, [usuario.id, codigo], async (err, codigoResults) => {
                if (err) {
                    console.error('🔴 Error al verificar código:', err);
                    return res.status(500).json({ success: false, message: 'Error del servidor.' });
                }

                if (codigoResults.length === 0) {
                    return res.status(400).json({ success: false, message: 'Código inválido, expirado o ya utilizado.' });
                }

                const codigoId = codigoResults[0].id;

                // Hashear nueva contraseña
                const hashedPassword = await bcrypt.hash(nueva_password, 10);

                // Actualizar contraseña
                const updateQuery = 'UPDATE usuarios SET password = ? WHERE id = ?';
                db.query(updateQuery, [hashedPassword, usuario.id], (err, result) => {
                    if (err) {
                        console.error('🔴 Error al actualizar contraseña:', err);
                        return res.status(500).json({ success: false, message: 'Error al cambiar la contraseña.' });
                    }

                    // Marcar código como usado
                    db.query('UPDATE codigos_verificacion SET usado = 1 WHERE id = ?', [codigoId]);

                    console.log('🟢 Contraseña cambiada exitosamente para usuario ID:', usuario.id);
                    res.json({ success: true, message: 'Contraseña cambiada exitosamente.' });
                });
            });
        });
    } catch (error) {
        console.error('🔴 Error al cambiar contraseña:', error);
        res.status(500).json({ success: false, message: 'Error del servidor.' });
    }
});

// Ruta principal - Redirige al login
app.get('/', (req, res) => {
    res.redirect('/Login/index.html');
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
  console.log(`🔐 Página de inicio: http://localhost:${port}/ (Redirige a Login)`);
});
