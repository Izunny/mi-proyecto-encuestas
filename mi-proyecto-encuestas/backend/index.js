const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

//Conexión única a la BD

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
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


//Servidor corriendo en un solo puerto
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


// CREAR UNA NUEVA ENCUESTA COMPLETA (CON PREGUNTAS Y OPCIONES)
app.post('/api/surveys', async (req, res) => {
  const { nombre, descripcion, fecha, activo, idusuario, preguntas } = req.body;

  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    const surveyQuery = 'INSERT INTO enc_encuestasm (nombre, descripcion, idusuario, fecha, activo) VALUES (?, ?, ?, ?, ?)';
    const [surveyResult] = await connection.query(surveyQuery, [nombre, descripcion, idusuario, fecha, activo]);
    const newSurveyId = surveyResult.insertId;

    if (preguntas && preguntas.length > 0) {
      for (const pregunta of preguntas) {
        const { textopregunta, idtipopregunta, requerida, opciones } = pregunta;
        
        const esRequerida = requerida ? 'S' : 'N';

        const questionQuery = 'INSERT INTO enc_pregunta (idencuesta, textopregunta, requerida, idtipopregunta) VALUES (?, ?, ?, ?)';
        const [questionResult] = await connection.query(questionQuery, [newSurveyId, textopregunta, esRequerida, idtipopregunta]);
        const newQuestionId = questionResult.insertId;

        if (opciones && opciones.length > 0 && (idtipopregunta === '3' || idtipopregunta === '4')) {
          for (const opcion of opciones) {
            const optionQuery = 'INSERT INTO enc_opcion (idpregunta, opcion) VALUES (?, ?)';
            await connection.query(optionQuery, [newQuestionId, opcion.opcion]);
          }
        }
      }
    }

    await connection.commit();
    res.status(201).json({ message: '¡Encuesta creada con éxito!', surveyId: newSurveyId });

  } catch (err) {
    await connection.rollback();
    console.error('Error al crear la encuesta:', err); // Este es el error que necesitas revisar
    res.status(500).json({ error: 'Error interno del servidor al crear la encuesta.' });

  } finally {
    connection.release();
  }
});


// OBTENER UNA ENCUESTA ESPECÍFICA POR SU ID (CON PREGUNTAS Y OPCIONES)
app.get('/api/surveys/:id', async (req, res) => {
  const { id } = req.params;
  const connection = await db.promise().getConnection();

  try {
    // 1. Verificamos si la encuesta ya tiene respuestas
    const [responses] = await connection.query('SELECT COUNT(*) as responseCount FROM enc_respuesta WHERE idencuesta = ?', [id]);
    const hasResponses = responses[0].responseCount > 0;

    // 2. Obtenemos la información principal de la encuesta
    const [surveyRows] = await connection.query('SELECT * FROM enc_encuestasm WHERE idencuesta = ?', [id]);
    
    if (surveyRows.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Encuesta no encontrada.' });
    }
    const encuesta = surveyRows[0];
    encuesta.hasResponses = hasResponses; // ✨ Añadimos esta información a la respuesta

    // 3. Obtenemos el resto (preguntas y opciones)
    const [questions] = await connection.query('SELECT * FROM enc_pregunta WHERE idencuesta = ?', [id]);
    
    for (const pregunta of questions) {
      if (pregunta.idtipopregunta === 3 || pregunta.idtipopregunta === 4) {
        const [options] = await connection.query('SELECT * FROM enc_opcion WHERE idpregunta = ?', [pregunta.idpregunta]);
        pregunta.opciones = options;
      } else {
        pregunta.opciones = [];
      }
      pregunta.requerida = pregunta.requerida === 'S';
    }

    encuesta.preguntas = questions;
    res.json(encuesta);

  } catch (err) {
    console.error(`Error al obtener la encuesta ${id}:`, err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  } finally {
    if (connection) connection.release();
  }
});


// ACTUALIZAR UNA ENCUESTA EXISTENTE (CON LÓGICA DE SEGURIDAD)
app.put('/api/surveys/:id', async (req, res) => {
  const { id: surveyId } = req.params;
  const { nombre, descripcion, activo, preguntas } = req.body;
  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    const [responses] = await connection.query('SELECT COUNT(*) as responseCount FROM enc_respuesta WHERE idencuesta = ?', [surveyId]);
    const hasResponses = responses[0].responseCount > 0;

    await connection.query('UPDATE enc_encuestasm SET nombre = ?, descripcion = ?, activo = ? WHERE idencuesta = ?', [nombre, descripcion, activo, surveyId]);

    if (!hasResponses) {
      const [oldQuestions] = await connection.query('SELECT idpregunta FROM enc_pregunta WHERE idencuesta = ?', [surveyId]);
      if (oldQuestions.length > 0) {
        const oldQuestionIds = oldQuestions.map(q => q.idpregunta);
        await connection.query('DELETE FROM enc_opcion WHERE idpregunta IN (?)', [oldQuestionIds]);
        await connection.query('DELETE FROM enc_pregunta WHERE idencuesta = ?', [surveyId]);
      }

      for (const pregunta of preguntas) {
        const esRequerida = pregunta.requerida ? 'S' : 'N';
        const [questionResult] = await connection.query('INSERT INTO enc_pregunta (idencuesta, textopregunta, requerida, idtipopregunta) VALUES (?, ?, ?, ?)', [surveyId, pregunta.textopregunta, esRequerida, pregunta.idtipopregunta]);
        const newQuestionId = questionResult.insertId;

        if (pregunta.opciones && (pregunta.idtipopregunta == '3' || pregunta.idtipopregunta == '4')) {
          for (const opcion of pregunta.opciones) {
            await connection.query('INSERT INTO enc_opcion (idpregunta, opcion) VALUES (?, ?)', [newQuestionId, opcion.opcion]);
          }
        }
      }
    }

    await connection.commit();
    res.json({ message: '¡Encuesta actualizada con éxito!', surveyId: surveyId });

  } catch (err) {
    await connection.rollback();
    console.error(`Error al actualizar la encuesta ${surveyId}:`, err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  } finally {
    connection.release();
  }
});