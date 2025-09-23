const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 🔹 Conexión única a la BD
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'db_encuestas'
});

// ... (todas tus rutas de usuarios y register van aquí, no cambian)

// CREATE
app.post('/usuarios', (req, res) => {
  const { nombre, email } = req.body;
  db.query('INSERT INTO usuarios (nombre, email) VALUES (?, ?)', [nombre, email], (err, result) => {
    if (err) return res.json(err);
    res.json(result);
  });
});

// READ
app.get('/usuarios', (req, res) => {
  db.query('SELECT * FROM usuarios', (err, result) => {
    if (err) return res.json(err);
    res.json(result);
  });
});

// UPDATE
app.put('/usuarios/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, email } = req.body;
  db.query('UPDATE usuarios SET nombre = ?, email = ? WHERE id = ?', [nombre, email, id], (err, result) => {
    if (err) return res.json(err);
    res.json(result);
  });
});

// DELETE
app.delete('/usuarios/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM usuarios WHERE id = ?', [id], (err, result) => {
    if (err) return res.json(err);
    res.json(result);
  });
});

// Registro de usuario (tu endpoint extendido)
app.post('/api/register', (req, res) => {
  const { username, nombreU, apellido_paterno, apellido_materno, fecha_nacimiento, email, telefono, genero, password_hash } = req.body;

  if (!username || !nombreU || !apellido_paterno || !fecha_nacimiento || !email || !genero || !password_hash) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }

  const sqlQuery = `
    INSERT INTO usuarios 
    (username, nombreU, apellido_paterno, apellido_materno, fecha_nacimiento, email, telefono, genero, password_hash) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sqlQuery, [username, nombreU, apellido_paterno, apellido_materno, fecha_nacimiento, email, telefono, genero, password_hash], (err, results) => {
    if (err) {
      console.error('Error al registrar el usuario:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'El email o el nombre de usuario ya existen.' });
      }
      return res.status(500).json({ error: 'Error interno del servidor al registrar el usuario.' });
    }
    res.status(201).json({ message: '¡Usuario registrado con éxito!', userId: results.insertId });
  });
});

// OBTENER TODAS LAS ENCUESTAS (CON EL NOMBRE DEL USUARIO)
app.get('/api/surveys', (req, res) => {
  const sqlQuery = `
    SELECT 
      e.*, 
      u.nombreU 
    FROM enc_encuestasm e  -- <-- CORREGIDO
    JOIN usuarios u ON e.idusuario = u.idusuario;
  `;

  db.query(sqlQuery, (err, results) => {
    if (err) {
      console.error('Error al obtener todas las encuestas:', err);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
    res.json(results);
  });
});

// OBTENER LAS ENCUESTAS DE UN USUARIO ESPECÍFICO
app.get('/api/surveys/user/:userId', (req, res) => {
  const { userId } = req.params;

  const sqlQuery = `
    SELECT 
      e.*, 
      u.nombreU 
    FROM enc_encuestasm e  -- <-- CORREGIDO
    JOIN usuarios u ON e.idusuario = u.idusuario
    WHERE e.idusuario = ?;
  `;

  db.query(sqlQuery, [userId], (err, results) => {
    if (err) {
    console.error(`Error al obtener encuestas para el usuario ${userId}:`, err);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
    res.json(results);
  });
});


// 🔹 Servidor corriendo en un solo puerto
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});

app.put('/api/surveys/:surveyId/status', (req, res) => {
  const { surveyId } = req.params;
  const { nuevoEstado } = req.body; // 'S' o 'N'

  // Validación simple
  if (!['S', 'N'].includes(nuevoEstado)) {
    return res.status(400).json({ error: 'Estado no válido. Debe ser S o N.' });
  }

  const sqlQuery = `
    UPDATE enc_encuestasm 
    SET activo = ? 
    WHERE idencuesta = ?;
  `;

  db.query(sqlQuery, [nuevoEstado, surveyId], (err, result) => {
    if (err) {
      console.error(`Error al actualizar estado de la encuesta ${surveyId}:`, err);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'No se encontró la encuesta con ese ID.' });
    }
    res.json({ message: 'Estado actualizado con éxito.' });
  });
});