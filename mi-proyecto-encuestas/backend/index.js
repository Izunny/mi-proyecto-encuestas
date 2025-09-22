const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
/*
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'db_encuestas'
});

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

app.listen(3000, () => {
  console.log('Servidor corriendo en puerto 3000');
});
*/

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password', 
  database: 'db_encuestas' 
});

// Endpoint de prueba para verificar la conexión a la base de datos
app.get('/usuarios', (req, res) => {
  connection.query('SELECT 1', (err, results) => {
    if (err) {
      console.error('Error al conectar con la BD:', err);
      return res.status(500).json({ 
        ok: false, 
        error: 'No se pudo conectar a la base de datos.' 
      });
    }

    res.json(
      { 
      ok: true, 
      message: '¡Conexión a la base de datos "db_encuestas" exitosa! ✅' 
    });
  });
});

// Endpoint para registrar un nuevo usuario (AJUSTADO A TU BD)
app.post('/api/register', (req, res) => {
  
  const { 
    username, 
    nombreU, 
    apellido_paterno, 
    apellido_materno,
    fecha_nacimiento,
    email,
    telefono,
    genero,
    password_hash 
  } = req.body;

  
  if (!username || !nombreU || !apellido_paterno || !fecha_nacimiento || !email || !genero || !password_hash) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }
  
  // IMPORTANTE: En un proyecto real, aquí deberías "hashear" la contraseña.
  // Por ahora, asumimos que Angular la enviará ya procesada o la guardamos en texto plano.

  const sqlQuery = `
    INSERT INTO usuarios 
    (username, nombreU, apellido_paterno, apellido_materno, fecha_nacimiento, email, telefono, genero, password_hash) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  
  connection.query(
    sqlQuery, 
    [username, nombreU, apellido_paterno, apellido_materno, fecha_nacimiento, email, telefono, genero, password_hash], 
    (err, results) => {
      if (err) {
        console.error('Error al registrar el usuario:', err);
    
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'El email o el nombre de usuario ya existen.' });
        }
        return res.status(500).json({ error: 'Error interno del servidor al registrar el usuario.' });
      }

     
      console.log('Usuario registrado con éxito con ID:', results.insertId);
      res.status(201).json({ 
        message: '¡Usuario registrado con éxito!',
        userId: results.insertId 
      });
    }
  );
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});

//http://localhost:3000/api/test-db
