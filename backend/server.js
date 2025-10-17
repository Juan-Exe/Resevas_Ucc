const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json());

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

app.get('/', (req, res) => {
  res.send('¡Servidor de Express funcionando!');
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
