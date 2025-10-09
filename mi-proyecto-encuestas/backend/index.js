const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser())


// Clave secreta para JWT
const clave_secreta = 'clave_secreta';;

const verifyToken = (req, res, next) => {
  const token = req.cookies.access_token;

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token.' });
  }

  try {
    const userData = jwt.verify(token, clave_secreta);
    req.user = userData; 
    next(); 
  } catch (error) {
    return res.status(403).json({ error: 'Token no válido o expirado.' });
  }
};

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'db_encuestas'
});

//Servidor corriendo en un solo puerto
const PORT = 3000;

//Conexión única a la BD
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});

app.use((req, res, next) => {
  const token = req.cookies.access_token

  req.session = { user: null }

  try {
    data = jwt.verify(token, clave_secreta)
    req.session.user = data
  } catch {}

  next()
})

// Registro de usuario (tu endpoint extendido)
app.post('/register', (req, res) => {
  
  const { username, password } = req.body;
  
  // Validar que los campos obligatorios estén presentes
  if (!username || !password) {
    return res.send(400).json({ error: 'Faltan campos obligatorios.' });
  }

  // Hashear la contraseña antes de guardarla
  const hashedPassword = bcrypt.hashSync(password, 10);

  const sqlQuery = `INSERT INTO usuarios (username, password_hash) VALUES (?, ?);`;
  db.query(sqlQuery, [username, hashedPassword], (err, results) => {
    if (err) {
      console.error('Error al registrar el usuario:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'El email o el nombre de usuario ya existen.' });
      }
      return res.status(500).json({ error: 'Error interno del servidor al registrar el usuario.' });
    }
    // Solo se puede usar res.json, res.send, res.redirect, res.render una vez por request
    res.status(201).json({ message: '¡Usuario registrado con éxito!', userId: results.insertId });
  });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Faltan el nombre de usuario o la contraseña.' });
  }

  const connection = db.promise(); // Usamos la versión con promesas para async/await

  try {
    // 1. Buscamos al usuario solo por su `username` en la base de datos.
    const sqlQuery = `SELECT * FROM usuarios WHERE username = ?;`;
    const [results] = await connection.query(sqlQuery, [username]);

    // 2. Si la búsqueda no devuelve ningún resultado, el usuario no existe.
    if (results.length === 0) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }

    const user = results[0];

    // 3. Comparamos la contraseña que el usuario envió (en texto plano)
    //    con el hash que está guardado en la base de datos (`user.password_hash`).
    const isMatch = await bcrypt.compare(password, user.password_hash);

    // 4. Si la comparación falla, la contraseña es incorrecta.
    if (!isMatch) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }

    // 5. Si todo es correcto, generamos el token y la respuesta.
    const payload = { id: user.idusuario, username: user.username };
    const token = jwt.sign(payload, clave_secreta, { expiresIn: '2h' });

    const userResponse = { 
        id: user.idusuario, 
        username: user.username, 
        nombre: user.nombreU 
    };

    res.cookie('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 2 // 2 horas
      })
      .status(200)
      .json({ 
        message: '¡Inicio de sesión exitoso!',
        user: userResponse,
        token: token
      });

  } catch (error) {
    console.error('Error en el servidor durante el login:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.get('/protected', (req, res) => {
  const { user } = req.session
  if (!user) return res.status(403).send('Acess not authorized')
});


app.post('/logout', (req, res) => {
  res
    .clearCookie('access_token')
    .json({message: 'Logout succesfully'})
})

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


// OBTENER TODAS LAS ENCUESTAS 
app.get('/api/surveys/', (req, res) => {
  const sqlQuery = `
    SELECT 
      e.*, 
      u.username 
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

// OBTENER LAS ENCUESTAS DE UN USUARIO ESPECIFICO
app.get('/api/my-surveys', verifyToken, (req, res) => {
  const userId = req.user.id; 

  const sqlQuery = `SELECT * FROM enc_encuestasm WHERE idusuario = ? ORDER BY idencuesta ASC`;
  
  db.query(sqlQuery, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener las encuestas.' });
    }
    res.json(results);
  });
});

app.put('/api/surveys/:surveyId/status', (req, res) => {
  const { surveyId } = req.params;
  const { nuevoEstado } = req.body; 

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


// CREAR UNA NUEVA ENCUESTA 
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
    console.error('Error al crear la encuesta:', err); 
    res.status(500).json({ error: 'Error interno del servidor al crear la encuesta.' });

  } finally {
    connection.release();
  }
});


// OBTENER UNA ENCUESTA ESPECIFICA POR SU ID (CON PREGUNTAS Y OPCIONES)
app.get('/api/surveys/user/:id', async (req, res) => {
  const { id } = req.params;
  const connection = await db.promise().getConnection();

  try {
    const [responses] = await connection.query('SELECT COUNT(*) as responseCount FROM enc_respuesta WHERE idencuesta = ?', [id]);
    const hasResponses = responses[0].responseCount > 0;

    const [surveyRows] = await connection.query('SELECT * FROM enc_encuestasm WHERE idencuesta = ?', [id]);
    
    if (surveyRows.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Encuesta no encontrada.' });
    }
    const encuesta = surveyRows[0];
    encuesta.hasResponses = hasResponses; // 

    const [questions] = await connection.query(
  'SELECT * FROM enc_pregunta WHERE idencuesta = ? ORDER BY orden ASC', // <-- Asegúrate de que 'ORDER BY orden ASC' esté aquí
  [id]
);
    
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


// ACTUALIZAR UNA ENCUESTA EXISTENTE
app.put('/api/surveys/:id', async (req, res) => {

  console.log('--- BACKEND: Petición recibida para actualizar encuesta ---');
  console.log('Datos recibidos en req.body:', JSON.stringify(req.body, null, 2));

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

      console.log('--- BACKEND: Empezando a guardar preguntas en la BD ---');
      for (const pregunta of preguntas) {
        
        console.log(`Guardando pregunta: "${pregunta.textopregunta}" con orden: ${pregunta.orden}`);

        const esRequerida = pregunta.requerida ? 'S' : 'N';
        
        const questionQuery = `
          INSERT INTO enc_pregunta 
          (idencuesta, textopregunta, requerida, idtipopregunta, orden) 
          VALUES (?, ?, ?, ?, ?)
        `;
        
        const [questionResult] = await connection.query(
          questionQuery, 
          [surveyId, pregunta.textopregunta, esRequerida, pregunta.idtipopregunta, pregunta.orden] 
        );

        const newQuestionId = questionResult.insertId;

        if (pregunta.opciones && (pregunta.idtipopregunta == '3' || pregunta.idtipopregunta == '4')) {
          for (const opcion of pregunta.opciones) {
            await connection.query('INSERT INTO enc_opcion (idpregunta, opcion) VALUES (?, ?)', [newQuestionId, opcion.opcion]);
          }
        }
      }
    }

    await connection.commit();
    console.log('--- BACKEND: Encuesta actualizada con éxito. ---');
    res.json({ message: '¡Encuesta actualizada con éxito!', surveyId: surveyId });

  } catch (err) {
    await connection.rollback();
    console.error(`Error al actualizar la encuesta ${surveyId}:`, err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  } finally {
    connection.release();
  }
});

// GUARDAR LAS RESPUESTAS DE UNA ENCUESTA
app.post('/api/responses', async (req, res) => {
  const { idencuesta, idusuario, respuestas } = req.body;

  if (!idencuesta || !idusuario || !respuestas) {
    return res.status(400).json({ error: 'Faltan datos para guardar la respuesta.' });
  }

  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    const responseQuery = 'INSERT INTO enc_respuesta (idencuesta, idusuario, fecha) VALUES (?, ?, NOW())';
    const [responseResult] = await connection.query(responseQuery, [idencuesta, idusuario]);
    const newResponseId = responseResult.insertId;

    for (const idpregunta of Object.keys(respuestas)) {
      const respuesta = respuestas[idpregunta];

      if (respuesta == null || respuesta === '') continue;

      if (Array.isArray(respuesta)) {
        // OPCION MULTIPLE (es un array de numeros)
        for (const idopcion of respuesta) {
          await connection.query(
            'INSERT INTO enc_respuestaopcion (idopciones, idrespuestas, idpregunta) VALUES (?, ?, ?)',
            [idopcion, newResponseId, idpregunta]
          );
        }
      } else if (typeof respuesta === 'number') {
        // OPCION UNICA 
        await connection.query(
          'INSERT INTO enc_respuestaopcion (idopciones, idrespuestas, idpregunta) VALUES (?, ?, ?)',
          [respuesta, newResponseId, idpregunta]
        );
      } else {
        // TEXTO, SLIDER O RANKING
        await connection.query(
          'INSERT INTO enc_respuestatexto (respuesta, idrespuestas, idpregunta) VALUES (?, ?, ?)',
          [respuesta.toString(), newResponseId, idpregunta]
        );
      }
    }

    await connection.commit();
    res.status(201).json({ message: '¡Gracias por tus respuestas!' });

  } catch (err) {
    await connection.rollback();
    console.error('Error al guardar las respuestas:', err);
    res.status(500).json({ error: 'Error interno del servidor al guardar las respuestas.' });
  } finally {
    connection.release();
  }
});

// ELIMINAR UNA ENCUESTA POR SU ID
app.delete('/api/surveys/:id', async (req, res) => {
  const { id } = req.params;
  const connection = await db.promise().getConnection();

  try {
    const query = 'DELETE FROM enc_encuestasm WHERE idencuesta = ?';
    const [result] = await connection.query(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'No se encontró la encuesta con ese ID.' });
    }

    res.json({ message: 'Encuesta eliminada con éxito.' });

  } catch (err) {
    console.error(`Error al eliminar la encuesta ${id}:`, err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  } finally {
    connection.release();
  }
});