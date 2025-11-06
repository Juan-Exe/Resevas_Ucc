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

// Configuración de email para recuperación de contraseña
const MODO_DESARROLLO = false;
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'juandiegoarrietaherrera@gmail.com',
        pass: 'abeqvvgvxylvyfta'
    }
});

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
    password: '1234',
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
        const { nombre_completo, nombre_usuario, email, password } = req.body;

        // Validar que el correo sea institucional
        if (!email.endsWith('@ucc.edu.co')) {
            return res.status(400).json({ success: false, message: 'Debe usar su correo institucional (@ucc.edu.co)' });
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

            // Insertar el nuevo usuario
            const insertQuery = 'INSERT INTO usuarios (nombre_completo, nombre_usuario, correo_institucional, password, imagen_perfil) VALUES (?, ?, ?, ?, ?)';
            db.query(insertQuery, [nombre_completo, nombre_usuario, email, hashedPassword, imagenPerfil], (err, result) => {
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
                        correo_recuperacion: null,
                        rol: 'Estudiante',
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

    const query = 'SELECT id, nombre_completo, nombre_usuario, correo_institucional, imagen_perfil FROM usuarios WHERE id = ?';
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
                imagen_perfil: usuario.imagen_perfil
            }
        });
    });
});

// Endpoint para actualizar perfil de usuario
app.put('/api/actualizar-perfil', upload.single('imagen_perfil'), async (req, res) => {
    try {
        const { nombre_completo, nombre_usuario, password_actual, password_nueva } = req.body;
        
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
                nombre_usuario
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
    const { floor, spaceType, block, spaceName, date, hour, reason, usuario_id } = req.body;

    // Validar que el usuario_id esté presente
    if (!usuario_id) {
        return res.status(400).json({ success: false, message: 'Usuario no identificado. Por favor, inicie sesión nuevamente.' });
    }

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
            usuario_id: usuario_id,
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
    const { usuario_id } = req.query;

    // Si no hay usuario_id, retornar error
    if (!usuario_id) {
        return res.status(400).json({ success: false, message: 'Usuario no identificado.' });
    }

    const query = 'SELECT * FROM reservas WHERE usuario_id = ? ORDER BY fecha, hora';
    db.query(query, [usuario_id], (err, results) => {
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
// SISTEMA DE RECUPERACIÓN DE CONTRASEÑA
// ============================================

// Función auxiliar para censurar email
function censurarEmail(email) {
    if (!email) return '';
    const [usuario, dominio] = email.split('@');
    if (!dominio) return email;

    const usuarioCensurado = usuario.length > 2
        ? usuario[0] + '*'.repeat(usuario.length - 2) + usuario[usuario.length - 1]
        : usuario[0] + '*';

    const [nombreDominio, extension] = dominio.split('.');
    const dominioCensurado = nombreDominio.length > 2
        ? nombreDominio[0] + '*'.repeat(nombreDominio.length - 2) + nombreDominio[nombreDominio.length - 1]
        : nombreDominio[0] + '*';

    return `${usuarioCensurado}@${dominioCensurado}.${extension}`;
}

// 1. Verificar usuario y obtener correo de recuperación
app.post('/api/recuperar-password/verificar-usuario', (req, res) => {
    const { correo_institucional } = req.body;

    if (!correo_institucional) {
        return res.status(400).json({
            success: false,
            message: 'El correo institucional es requerido.'
        });
    }

    const query = 'SELECT id, nombre_completo, correo_recuperacion FROM usuarios WHERE correo_institucional = ?';

    db.query(query, [correo_institucional], (error, results) => {
        if (error) {
            console.error('Error al verificar usuario:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor.'
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró un usuario con ese correo institucional.'
            });
        }

        const usuario = results[0];

        if (!usuario.correo_recuperacion) {
            return res.status(400).json({
                success: false,
                message: 'Este usuario no tiene un correo de recuperación configurado. Por favor, contacta al administrador.'
            });
        }

        res.json({
            success: true,
            usuario_id: usuario.id,
            nombre: usuario.nombre_completo,
            correo_recuperacion_censurado: censurarEmail(usuario.correo_recuperacion)
        });
    });
});

// 2. Solicitar código de verificación
app.post('/api/recuperar-password/solicitar', async (req, res) => {
    const { usuario_id } = req.body;

    if (!usuario_id) {
        return res.status(400).json({
            success: false,
            message: 'ID de usuario es requerido.'
        });
    }

    // Obtener datos del usuario
    const queryUsuario = 'SELECT nombre_completo, correo_recuperacion FROM usuarios WHERE id = ?';

    db.query(queryUsuario, [usuario_id], async (error, results) => {
        if (error) {
            console.error('Error al obtener usuario:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor.'
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado.'
            });
        }

        const usuario = results[0];

        if (!usuario.correo_recuperacion) {
            return res.status(400).json({
                success: false,
                message: 'No hay correo de recuperación configurado.'
            });
        }

        // Generar código de 6 dígitos
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();

        // Fecha de expiración: 15 minutos
        const fechaExpiracion = new Date(Date.now() + 15 * 60 * 1000);

        // Guardar código en la base de datos
        const queryInsert = `
            INSERT INTO codigos_verificacion (usuario_id, codigo, email_destino, fecha_expiracion)
            VALUES (?, ?, ?, ?)
        `;

        db.query(queryInsert, [usuario_id, codigo, usuario.correo_recuperacion, fechaExpiracion], async (error) => {
            if (error) {
                console.error('Error al guardar código:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error al generar código de verificación.'
                });
            }

            // Enviar email con el código
            try {
                if (MODO_DESARROLLO) {
                    console.log('MODO DESARROLLO - Código de verificación:', codigo);
                    console.log('Email destino:', usuario.correo_recuperacion);

                    return res.json({
                        success: true,
                        message: 'Código generado en modo desarrollo.',
                        codigo_desarrollo: codigo
                    });
                } else {
                    const mailOptions = {
                        from: 'Sistema de Reservas UCC <juandiegoarrietaherrera@gmail.com>',
                        to: usuario.correo_recuperacion,
                        subject: 'Código de verificación - Recuperación de contraseña',
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <h2 style="color: #006FBF;">Recuperación de Contraseña</h2>
                                <p>Hola <strong>${usuario.nombre_completo}</strong>,</p>
                                <p>Has solicitado recuperar tu contraseña. Tu código de verificación es:</p>
                                <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #006FBF; letter-spacing: 5px; margin: 20px 0;">
                                    ${codigo}
                                </div>
                                <p>Este código expira en <strong>15 minutos</strong>.</p>
                                <p>Si no solicitaste este código, puedes ignorar este mensaje.</p>
                                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                                <p style="color: #999; font-size: 12px;">Sistema de Reservas - Universidad Cooperativa de Colombia</p>
                            </div>
                        `
                    };

                    await transporter.sendMail(mailOptions);
                    console.log('Email de recuperación enviado a:', usuario.correo_recuperacion);

                    return res.json({
                        success: true,
                        message: 'Código de verificación enviado a tu correo de recuperación.'
                    });
                }
            } catch (emailError) {
                console.error('Error al enviar email:', emailError);
                return res.status(500).json({
                    success: false,
                    message: 'Error al enviar el código de verificación.'
                });
            }
        });
    });
});

// 3. Verificar código de verificación
app.post('/api/recuperar-password/verificar-codigo', (req, res) => {
    const { usuario_id, codigo } = req.body;

    if (!usuario_id || !codigo) {
        return res.status(400).json({
            success: false,
            message: 'Usuario y código son requeridos.'
        });
    }

    const query = `
        SELECT id, fecha_expiracion, usado
        FROM codigos_verificacion
        WHERE usuario_id = ? AND codigo = ?
        ORDER BY fecha_creacion DESC
        LIMIT 1
    `;

    db.query(query, [usuario_id, codigo], (error, results) => {
        if (error) {
            console.error('Error al verificar código:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor.'
            });
        }

        if (results.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Código de verificación inválido.'
            });
        }

        const codigoVerificacion = results[0];

        if (codigoVerificacion.usado === 1) {
            return res.status(400).json({
                success: false,
                message: 'Este código ya ha sido utilizado.'
            });
        }

        const ahora = new Date();
        const expiracion = new Date(codigoVerificacion.fecha_expiracion);

        if (ahora > expiracion) {
            return res.status(400).json({
                success: false,
                message: 'El código ha expirado. Solicita uno nuevo.'
            });
        }

        res.json({
            success: true,
            message: 'Código verificado correctamente.',
            codigo_id: codigoVerificacion.id
        });
    });
});

// 4. Cambiar contraseña
app.post('/api/recuperar-password/cambiar', async (req, res) => {
    const { usuario_id, codigo_id, nueva_password } = req.body;

    if (!usuario_id || !codigo_id || !nueva_password) {
        return res.status(400).json({
            success: false,
            message: 'Todos los campos son requeridos.'
        });
    }

    if (nueva_password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'La contraseña debe tener al menos 6 caracteres.'
        });
    }

    try {
        // Hashear nueva contraseña
        const hashedPassword = await bcrypt.hash(nueva_password, 10);

        // Actualizar contraseña
        const queryUpdatePassword = 'UPDATE usuarios SET password = ? WHERE id = ?';

        db.query(queryUpdatePassword, [hashedPassword, usuario_id], (error) => {
            if (error) {
                console.error('Error al actualizar contraseña:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error al actualizar la contraseña.'
                });
            }

            // Marcar código como usado
            const queryMarkUsed = 'UPDATE codigos_verificacion SET usado = 1 WHERE id = ?';

            db.query(queryMarkUsed, [codigo_id], (error) => {
                if (error) {
                    console.error('Error al marcar código como usado:', error);
                }

                console.log('Contraseña actualizada exitosamente para usuario:', usuario_id);

                res.json({
                    success: true,
                    message: 'Contraseña actualizada exitosamente.'
                });
            });
        });
    } catch (error) {
        console.error('Error al hashear contraseña:', error);
        return res.status(500).json({
            success: false,
            message: 'Error en el servidor.'
        });
    }
});

// ============================================
// SISTEMA DE ADMINISTRACIÓN DE RESERVAS
// ============================================

// 1. Obtener todas las reservas pendientes (Admin)
app.get('/api/admin/reservas/pendientes', (req, res) => {
    const query = `
        SELECT
            r.id,
            r.piso,
            r.tipo_espacio,
            r.bloque,
            r.nombre_espacio,
            r.fecha,
            r.hora,
            r.motivo,
            r.estado,
            r.fecha_creacion,
            u.id as usuario_id,
            u.nombre_completo,
            u.nombre_usuario,
            u.correo_institucional,
            u.rol
        FROM reservas r
        LEFT JOIN usuarios u ON r.usuario_id = u.id
        WHERE r.estado = 'pendiente'
        AND r.fecha >= CURDATE()
        ORDER BY r.fecha_creacion DESC
    `;

    db.query(query, (error, results) => {
        if (error) {
            console.error('Error al obtener reservas pendientes:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener reservas pendientes.'
            });
        }

        res.json({
            success: true,
            reservas: results
        });
    });
});

// 2. Responder a una reserva (Aceptar/Rechazar)
app.post('/api/admin/reservas/responder', (req, res) => {
    const { reserva_id, accion, admin_id } = req.body;

    if (!reserva_id || !accion || !admin_id) {
        return res.status(400).json({
            success: false,
            message: 'Todos los campos son requeridos.'
        });
    }

    if (!['aceptada', 'rechazada'].includes(accion)) {
        return res.status(400).json({
            success: false,
            message: 'Acción inválida.'
        });
    }

    // Obtener información de la reserva antes de actualizarla
    const queryGetReserva = `
        SELECT r.*, u.nombre_completo
        FROM reservas r
        INNER JOIN usuarios u ON r.usuario_id = u.id
        WHERE r.id = ?
    `;

    db.query(queryGetReserva, [reserva_id], (error, results) => {
        if (error) {
            console.error('Error al obtener reserva:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor.'
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reserva no encontrada.'
            });
        }

        const reserva = results[0];

        // Actualizar estado de la reserva
        const queryUpdate = `
            UPDATE reservas
            SET estado = ?, fecha_respuesta = NOW(), respondido_por = ?
            WHERE id = ?
        `;

        db.query(queryUpdate, [accion, admin_id, reserva_id], (error) => {
            if (error) {
                console.error('Error al actualizar reserva:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error al actualizar la reserva.'
                });
            }

            // Crear notificación para el usuario
            const mensajeNotificacion = accion === 'aceptada'
                ? `Tu reserva de ${reserva.nombre_espacio} para el ${reserva.fecha} de ${reserva.hora} ha sido aceptada.`
                : `Tu reserva de ${reserva.nombre_espacio} para el ${reserva.fecha} de ${reserva.hora} ha sido rechazada.`;

            const queryNotificacion = `
                INSERT INTO notificaciones (usuario_id, reserva_id, tipo, mensaje)
                VALUES (?, ?, ?, ?)
            `;

            db.query(queryNotificacion, [reserva.usuario_id, reserva_id, accion, mensajeNotificacion], (error) => {
                if (error) {
                    console.error('Error al crear notificación:', error);
                    // No retornar error, la reserva ya fue actualizada
                }

                console.log(`Reserva ${reserva_id} ${accion} por admin ${admin_id}`);

                res.json({
                    success: true,
                    message: `Reserva ${accion} exitosamente.`
                });
            });
        });
    });
});

// ============================================
// SISTEMA DE NOTIFICACIONES
// ============================================

// 1. Obtener notificaciones no leídas de un usuario
app.get('/api/notificaciones/:usuario_id', (req, res) => {
    const { usuario_id } = req.params;

    const query = `
        SELECT id, reserva_id, tipo, mensaje, fecha_creacion
        FROM notificaciones
        WHERE usuario_id = ? AND leida = 0
        ORDER BY fecha_creacion DESC
    `;

    db.query(query, [usuario_id], (error, results) => {
        if (error) {
            console.error('Error al obtener notificaciones:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener notificaciones.'
            });
        }

        res.json({
            success: true,
            notificaciones: results
        });
    });
});

// 2. Marcar notificación como leída
app.post('/api/notificaciones/marcar-leida', (req, res) => {
    const { notificacion_id } = req.body;

    if (!notificacion_id) {
        return res.status(400).json({
            success: false,
            message: 'ID de notificación es requerido.'
        });
    }

    const query = 'UPDATE notificaciones SET leida = 1 WHERE id = ?';

    db.query(query, [notificacion_id], (error) => {
        if (error) {
            console.error('Error al marcar notificación:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al marcar notificación.'
            });
        }

        res.json({
            success: true,
            message: 'Notificación marcada como leída.'
        });
    });
});

// Ruta principal - Redirige al login
app.get('/', (req, res) => {
    res.redirect('/Login/index.html');
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
  console.log(`🔐 Página de inicio: http://localhost:${port}/ (Redirige a Login)`);
});
