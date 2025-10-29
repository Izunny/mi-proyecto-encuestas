const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const app = express();
const crypto = require('crypto');
const path = require('path');
const ExcelJS = require('exceljs');
const {createCanvas} = require('canvas');
const { Chart, registerables } = require('chart.js');
Chart.register(...registerables);

// --- CONFIGURACIÓN Y MIDDLEWARES ---

// Configuración de CORS (ya estaba correcta)
app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());

// Clave secreta para JWT
const clave_secreta = 'clave_secreta';
const PORT = 3000;

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'db_encuestas'
}).promise(); // Usamos .promise() para que todo el archivo pueda usar async/await

// Middleware para verificar el token (ya estaba correcto)
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado, no hay token.' });
  }
  try {
    const userData = jwt.verify(token, clave_secreta);
    req.user = userData;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token no válido.' });
  }
};

// --- INICIAR SERVIDOR ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);

});


// Registro de usuario (tu endpoint extendido)
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sqlQuery = `INSERT INTO usuarios (username, password_hash) VALUES (?, ?);`;
    const [results] = await db.query(sqlQuery, [username, hashedPassword]);
    res.status(201).json({ message: '¡Usuario registrado con éxito!', userId: results.insertId });
  } catch (err) {
    console.error('Error al registrar el usuario:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El nombre de usuario ya existe.' });
    }
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Faltan campos.' });
  }
  try {
    const sqlQuery = `SELECT * FROM usuarios WHERE username = ?;`;
    const [results] = await db.query(sqlQuery, [username]);
    if (results.length === 0) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }
    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }
    const payload = { id: user.idusuario, username: user.username };
    const token = jwt.sign(payload, clave_secreta, { expiresIn: '2h' });
    const userResponse = { id: user.idusuario, username: user.username, nombre: user.nombreU };
    res.json({ message: '¡Inicio de sesión exitoso!', user: userResponse, token });
  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  // Esta ruta es simple, solo para que el frontend tenga un endpoint al que llamar
  res.json({ message: 'Logout exitoso.' });
});

app.post('/api/logout', (req, res) => {
  res
    .clearCookie('access_token')
    .json({message: 'Logout succesfully'})
})

// READ
app.get('/api/usuarios', async (req, res) => {
  try {
    const [result] = await db.query('SELECT idusuario, username, nombreU FROM usuarios');
    res.json(result);
  } catch (err) {
    console.error("Error al obtener usuarios:", err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.put('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email } = req.body;
    await db.query('UPDATE usuarios SET nombre = ?, email = ? WHERE idusuario = ?', [nombre, email, id]);
    res.json({ message: "Usuario actualizado" });
  } catch (err) {
    console.error("Error al actualizar usuario:", err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM usuarios WHERE idusuario = ?', [id]);
    res.json({ message: "Usuario eliminado" });
  } catch (err) {
    console.error("Error al eliminar usuario:", err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// OBTENER TODAS LAS ENCUESTAS 
app.get('/api/surveys', async (req, res) => {
  try {
    const sqlQuery = `SELECT e.*, u.username FROM enc_encuestasm e JOIN usuarios u ON e.idusuario = u.idusuario;`;
    const [results] = await db.query(sqlQuery);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Obtener las encuestas del usuario logueado
app.get('/api/my-surveys', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const sqlQuery = `SELECT e.*, u.username FROM enc_encuestasm e JOIN usuarios u ON e.idusuario = u.idusuario WHERE e.idusuario = ? ORDER BY e.idencuesta DESC;`;
    const [results] = await db.query(sqlQuery, [userId]);
    res.json(results);
  } catch (err) {
    console.error('Error al obtener las encuestas del usuario:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});




app.put('/api/surveys/:surveyId/status', verifyToken, async (req, res) => {
  // Reescribimos a async/await para consistencia
  try {
    const { surveyId } = req.params;
    const { nuevoEstado } = req.body;
    if (!['S', 'N'].includes(nuevoEstado)) {
      return res.status(400).json({ error: 'Estado no válido.' });
    }
    const sqlQuery = `UPDATE enc_encuestasm SET activo = ?, idusuario = ? WHERE idencuesta = ?;`;
    const [result] = await db.query(sqlQuery, [nuevoEstado, req.user.id, surveyId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Encuesta no encontrada o no tienes permiso.' });
    }
    res.json({ message: 'Estado actualizado con éxito.' });
  } catch (err) {
    console.error('Error al actualizar estado:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// CREAR UNA NUEVA ENCUESTA 
app.post('/api/surveys', verifyToken, async (req, res) => {
  const { nombre, descripcion, fecha, activo, preguntas } = req.body;
  const idusuario = req.user.id

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // El resto de tu lógica para insertar la encuesta...
    const surveyQuery = 'INSERT INTO enc_encuestasm (nombre, descripcion, idusuario, fecha, activo) VALUES (?, ?, ?, ?, ?)';
    const [surveyResult] = await connection.query(surveyQuery, [nombre, descripcion, idusuario, fecha, activo]);
    const newSurveyId = surveyResult.insertId;

    if (preguntas && preguntas.length > 0) {
      for (const pregunta of preguntas) {
        const { textopregunta, idtipopregunta, requerida, opciones, orden } = pregunta;
        
        const esRequerida = requerida ? 'S' : 'N';
        const questionQuery = 'INSERT INTO enc_pregunta (idencuesta, textopregunta, requerida, idtipopregunta, orden) VALUES (?, ?, ?, ?, ?)';
        const [questionResult] = await connection.query(questionQuery, [newSurveyId, textopregunta, esRequerida, idtipopregunta, orden]);
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
    // Si hay un error, hacemos rollback
    if (connection) await connection.rollback();
    console.error('Error al crear la encuesta:', err); 
    res.status(500).json({ error: 'Error interno del servidor al crear la encuesta.' });

  } finally {
    if (connection) connection.release();
  }
});

// OBTENER UNA ENCUESTA ESPECÍFICA (VERSIÓN CON DEPURACIÓN AVANZADA)
app.get('/api/surveys/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  console.log(`--- PASO 1: Petición recibida para encuesta ID: ${id} (tipo: ${typeof id})`);
  
  console.log(`--- PASO 2: Usuario verificado con ID: ${userId} (tipo: ${typeof userId})`);

  let connection;
  try {
    console.log('--- PASO 3: Intentando obtener conexión a la BD...');
    connection = await db.getConnection();
    console.log('--- PASO 4: Conexión obtenida. Ejecutando consulta de verificación...');

    const query = 'SELECT * FROM enc_encuestasm WHERE idencuesta = ? AND idusuario = ?';
    console.log('--- PASO 5: La consulta SQL es:', query, 'con valores:', [id, userId]);

    const [surveyRows] = await connection.query(query, [id, userId]);
    
    console.log('--- PASO 6: Resultado de la consulta de verificación:', surveyRows);

    if (surveyRows.length === 0) {
      console.log('--- PASO 7: La encuesta no pertenece al usuario o no existe. Devolviendo 404.');
      connection.release();
      return res.status(404).json({ error: 'Encuesta no encontrada o no tienes permiso para verla.' });
    }
    
    console.log('--- PASO 8: Encuesta encontrada. Obteniendo preguntas...');
    const encuesta = surveyRows[0];

    const [questions] = await connection.query(
      'SELECT * FROM enc_pregunta WHERE idencuesta = ? ORDER BY orden ASC',
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
    console.log('--- PASO 9: Enviando respuesta final al frontend.');
    res.json(encuesta);

  } catch (err) {
    // Si algo falla, este mensaje nos dirá qué fue
    console.error('--- ¡ERROR FATAL EN EL BLOQUE CATCH! ---', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  } finally {
    if (connection) {
      console.log('--- PASO 10: Liberando la conexión a la BD.');
      connection.release();
    }
  }
});

// ACTUALIZAR UNA ENCUESTA EXISTENTE (VERSIÓN CORREGIDA)
app.put('/api/surveys/:id', verifyToken, async (req, res) => {
  console.log('--- BACKEND: Petición recibida para actualizar encuesta ---');
  console.log('Datos recibidos en req.body:', JSON.stringify(req.body, null, 2));

  const { id: surveyId } = req.params;
  const { nombre, descripcion, activo, preguntas } = req.body;
  
  let connection; // Definimos fuera para que 'finally' la vea

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Actualizamos los datos principales de la encuesta
    await connection.query(
      'UPDATE enc_encuestasm SET nombre = ?, descripcion = ?, activo = ? WHERE idencuesta = ?', 
      [nombre, descripcion, activo, surveyId]
    );

    // --- CORRECCIÓN: HEMOS ELIMINADO EL 'if (!hasResponses)' ---
    // Ahora, SIEMPRE borramos las preguntas y opciones antiguas para reemplazarlas.

    // 2. Borramos las preguntas y opciones viejas
    const [oldQuestions] = await connection.query('SELECT idpregunta FROM enc_pregunta WHERE idencuesta = ?', [surveyId]);
    if (oldQuestions.length > 0) {
      const oldQuestionIds = oldQuestions.map(q => q.idpregunta);
      await connection.query('DELETE FROM enc_opcion WHERE idpregunta IN (?)', [oldQuestionIds]);
      await connection.query('DELETE FROM enc_pregunta WHERE idencuesta = ?', [surveyId]);
    }

    // 3. Insertamos las preguntas nuevas (con su nuevo orden y contenido)
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

    await connection.commit();
    console.log('--- BACKEND: Encuesta actualizada con éxito. ---');
    res.json({ message: '¡Encuesta actualizada con éxito!', surveyId: surveyId });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error(`Error al actualizar la encuesta ${surveyId}:`, err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  } finally {
    if (connection) connection.release();
  }
});

// GUARDAR LAS RESPUESTAS DE UNA ENCUESTA (VERSIÓN SEGURA)
app.post('/api/responses', async (req, res) => {
  const { token, idusuario, respuestas } = req.body;

  if (!token || !idusuario || !respuestas) {
    return res.status(400).json({ error: 'Faltan datos para guardar la respuesta.' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const validationQuery = `
      SELECT idencuesta 
      FROM enc_tokens 
      WHERE token = ? AND expira > NOW() AND (usos_actuales < usos_maximos OR usos_maximos IS NULL)
      LIMIT 1 FOR UPDATE
    `;
    const [tokenRows] = await connection.query(validationQuery, [token]);
    if (tokenRows.length === 0) {
      throw new Error('Token inválido, expirado o ha alcanzado su límite de usos.');
    }
    const { idencuesta } = tokenRows[0];

    const responseQuery = 'INSERT INTO enc_respuesta (idencuesta, idusuario, fecha) VALUES (?, ?, NOW())';
    const [responseResult] = await connection.query(responseQuery, [idencuesta, idusuario]);
    const newResponseId = responseResult.insertId;

    for (const idpregunta of Object.keys(respuestas)) {
      const respuesta = respuestas[idpregunta];
      if (respuesta == null || respuesta === '') continue;
      
      if (Array.isArray(respuesta)) {
        for (const idopcion of respuesta) {
          await connection.query('INSERT INTO enc_respuestaopcion (idopciones, idrespuestas, idpregunta) VALUES (?, ?, ?)', [idopcion, newResponseId, idpregunta]);
        }
      } else if (typeof respuesta === 'number') {
        await connection.query('INSERT INTO enc_respuestaopcion (idopciones, idrespuestas, idpregunta) VALUES (?, ?, ?)', [respuesta, newResponseId, idpregunta]);
      } else {
        await connection.query('INSERT INTO enc_respuestatexto (respuesta, idrespuestas, idpregunta) VALUES (?, ?, ?)', [respuesta.toString(), newResponseId, idpregunta]);
      }
    }

    await connection.query('UPDATE enc_tokens SET usos_actuales = usos_actuales + 1 WHERE token = ?', [token]);

    await connection.commit();
    res.status(201).json({ message: '¡Gracias por tus respuestas!' });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Error al guardar las respuestas:', err);
    res.status(500).json({ error: err.message || 'Error interno del servidor.' });
  } finally {
    if (connection) connection.release();
  }
});


// ELIMINAR UNA ENCUESTA DE FORMA SEGURA
app.delete('/api/surveys/:id', verifyToken, async (req, res) => {
  const { id } = req.params;  // El ID de la encuesta a borrar
  const userId = req.user.id; // El ID del usuario que hace la petición (del token)

  let connection;

  try {
    connection = await db.getConnection();
    
    const [surveyRows] = await connection.query(
      'SELECT idusuario FROM enc_encuestasm WHERE idencuesta = ?',
      [id]
    );

    if (surveyRows.length === 0) {
      return res.status(404).json({ error: 'Encuesta no encontrada.' });
    }
    
    if (surveyRows[0].idusuario !== userId) {
      // Si no es el dueño, devolvemos un error de permisos 403
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta encuesta.' });
    }
    //    Solo borramos de la tabla principal. La base de datos (con ON DELETE CASCADE)
    //    se encargará de borrar las preguntas y opciones relacionadas.
    const query = 'DELETE FROM enc_encuestasm WHERE idencuesta = ?';
    await connection.query(query, [id]);

    res.json({ message: 'Encuesta eliminada con éxito.' });

  } catch (err) {
    console.error(`Error al eliminar la encuesta ${id}:`, err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  } finally {
    if (connection) connection.release();
  }
});


// OBTENER UNA ENCUESTA ESPECÍFICA (VERSIÓN CON DEPURACIÓN AVANZADA)
app.get('/api/results/:id', verifyToken, async (req, res) => {
  const { id } = req.params;  
  const userId = req.user.id;


  let connection;
  try {
    connection = await db.getConnection();

    const query = 'SELECT * FROM enc_encuestasm WHERE idencuesta = ? AND idusuario = ?';

    const [surveyRows] = await connection.query(query, [id, userId]);
    
    if (surveyRows.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Encuesta no encontrada o no tienes permiso para verla.' });
    }
    
    const encuesta = surveyRows[0];

    const [questions] = await connection.query(
      'SELECT * FROM enc_pregunta WHERE idencuesta = ?',
      [id]
    );
    
    encuesta.preguntas = questions;

        /* 
    Tipos de pregunta
      1 -> texto corto 
      2 -> parrafo
      3 -> opcion unica
      4 -> opcion multiple
      5 -> slider
      6 -> ranking 
      */

    // 2. OBTENEMOS LOS RESULTADOS POR OPCION
    for (const pregunta of questions) {
      if (pregunta.idtipopregunta === 3 || pregunta.idtipopregunta === 4) {
        const [options] = await connection.query('SELECT * FROM enc_opcion WHERE idpregunta = ?', [pregunta.idpregunta]);
        pregunta.opciones = options;
        const [resultado_opcion] = await connection.query('SELECT * FROM enc_respuestaopcion WHERE idpregunta = ?', [pregunta.idpregunta])
        pregunta.respuestas = resultado_opcion;
      } else {
        const [respuestas_texto] = await connection.query('SELECT * FROM enc_respuestatexto WHERE idpregunta = ?', [pregunta.idpregunta]);
        pregunta.respuestas = respuestas_texto; 
      }
      pregunta.requerida = pregunta.requerida === 'S';
    }

    let resultadosFinales = [];
    for (i = 0; i < encuesta.preguntas.length; i++) {
      if (encuesta.preguntas[i].idtipopregunta == 1 || encuesta.preguntas[i].idtipopregunta == 2) {
        // Preguntas tipo Texto Corto o Texto Parrafo
        let respuestatexto = [];
        for (respuesta of encuesta.preguntas[i].respuestas) {
          respuestatexto.push(respuesta.respuesta);
        }

        resultadosFinales[i] = [
          [encuesta.preguntas[i].textopregunta, encuesta.preguntas[i].idtipopregunta],
          respuestatexto
        ];
        
      } else if (encuesta.preguntas[i].idtipopregunta == 3 || encuesta.preguntas[i].idtipopregunta == 4) {
        // Preguntas tipo Opcion Unica o Opcion Multiple
        
        // Opciones
        let opcionesnombres = [];
        let respuestasopciones = [];
        for (nombre of encuesta.preguntas[i].opciones) {
          opcionesnombres.push(nombre.opcion)
          respuestasopciones.push(0)
        }

        for (let y = 0; y < encuesta.preguntas[i].opciones.length; y++) {
          for (let z = 0; z < encuesta.preguntas[i].respuestas.length; z++) {
            if (encuesta.preguntas[i].opciones[y].idopciones === encuesta.preguntas[i].respuestas[z].idopciones) {
              respuestasopciones[y] += 1;
            }
          }
        }

        
        resultadosFinales[i] = [
          [encuesta.preguntas[i].textopregunta, encuesta.preguntas[i].idtipopregunta],
          opcionesnombres,
          respuestasopciones
        ]

      } else {
        // Preguntas tipo Slider o Rating
        if (encuesta.preguntas[i].idtipopregunta === 5) {
        let resultadosSlider = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (let y = 0; y < encuesta.preguntas[i].respuestas.length; y++) {
          resultadosSlider[Number(encuesta.preguntas[i].respuestas[y].respuesta)-1] += 1;
        }
          resultadosFinales[i] = [
            [encuesta.preguntas[i].textopregunta, encuesta.preguntas[i].idtipopregunta],
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            resultadosSlider,
          ] 
        } else if (encuesta.preguntas[i].idtipopregunta === 6) {
          let resultadosRanking = [0, 0, 0, 0, 0]
          for (let y = 0; y < encuesta.preguntas[i].respuestas.length; y++) {
            resultadosRanking[Number(encuesta.preguntas[i].respuestas[y].respuesta)] += 1;
          }
          resultadosFinales[i] = [
            [encuesta.preguntas[i].textopregunta, encuesta.preguntas[i].idtipopregunta],
            [1, 2, 3, 4, 5],
            resultadosRanking
          ] 
        }
      }
    }
    //res.json(encuesta.preguntas);
    res.json(resultadosFinales);

  } catch (err) {
    // Si algo falla, este mensaje nos dirá qué fue
    console.error('--- ¡ERROR FATAL EN EL BLOQUE CATCH! ---', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  } finally {
    if (connection) {
      console.log('--- PASO 10: Liberando la conexión a la BD.');
      connection.release();
    }
  }
});

// --- RUTAS DE TOKENS Y RESPUESTAS ---
app.post('/api/surveys/:id/share', async (req, res) => {
  const { id: idencuesta } = req.params;
  const { maxUses, durationDays } = req.body;
  try {
    const token = crypto.randomBytes(16).toString('hex'); // Esta línea ahora funcionará
    const expira = new Date();
    expira.setDate(expira.getDate() + (durationDays || 7));
    const query = 'INSERT INTO enc_tokens (idencuesta, token, expira, usos_maximos) VALUES (?, ?, ?, ?)';
    await db.query(query, [idencuesta, token, expira, maxUses]);
    res.json({ token });
  } catch (err) {
    console.error(`Error al generar token:`, err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});



// --- OBTENER ENCUESTA POR TOKEN (PARA LA PÁGINA DE RESPONDER) ---
// (Asegúrate de que esta ruta también exista y use /api)
app.get('/api/survey-by-token/:token', async (req, res) => {
  const { token } = req.params;
  try {
    const query = `
      SELECT idencuesta 
      FROM enc_tokens 
      WHERE token = ? AND expira > NOW() AND (usos_actuales < usos_maximos OR usos_maximos IS NULL)
      LIMIT 1
    `;
    const [tokenRows] = await db.query(query, [token]);

    if (tokenRows.length === 0) {
      return res.status(404).json({ error: 'Enlace no válido, ha expirado o ha alcanzado su límite de usos.' });
    }
    
    // Si el token es válido, obtenemos los datos de la encuesta
    const { idencuesta } = tokenRows[0];
    const [surveyRows] = await db.query('SELECT nombre, descripcion FROM enc_encuestasm WHERE idencuesta = ?', [idencuesta]);
    if (surveyRows.length === 0) {
        return res.status(404).json({ error: 'La encuesta asociada a este enlace ya no existe.' });
    }
    
    const encuesta = surveyRows[0];
    const [questions] = await db.query('SELECT idpregunta, textopregunta, requerida, idtipopregunta FROM enc_pregunta WHERE idencuesta = ? ORDER BY orden ASC', [idencuesta]);
    
    for (const pregunta of questions) {
      if (pregunta.idtipopregunta === 3 || pregunta.idtipopregunta === 4) {
        const [options] = await db.query('SELECT idopciones, opcion FROM enc_opcion WHERE idpregunta = ?', [pregunta.idpregunta]);
        pregunta.opciones = options;
      }
    }
    encuesta.preguntas = questions;
    res.json(encuesta);

  } catch (err) {
    console.error(`Error al obtener encuesta con token ${token}:`, err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Ruta para generar y enviar el PDF
app.get('/api/pdf/:id', async (req, res) => {
  const { id } = req.params;  

  let connection;
  try {
    connection = await db.getConnection();

    const query = 'SELECT * FROM enc_encuestasm WHERE idencuesta = ?';

    const [surveyRows] = await connection.query(query, [id]);
    
    if (surveyRows.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Encuesta no encontrada o no tienes permiso para verla.' });
    }
    
    const encuesta = surveyRows[0];

    const [questions] = await connection.query(
      'SELECT * FROM enc_pregunta WHERE idencuesta = ?',
      [id]
    );
    
    encuesta.preguntas = questions;

    for (const pregunta of questions) {
      if (pregunta.idtipopregunta === 3 || pregunta.idtipopregunta === 4) {
        const [options] = await connection.query('SELECT * FROM enc_opcion WHERE idpregunta = ?', [pregunta.idpregunta]);
        pregunta.opciones = options;
        const [resultado_opcion] = await connection.query('SELECT * FROM enc_respuestaopcion WHERE idpregunta = ?', [pregunta.idpregunta])
        pregunta.respuestas = resultado_opcion;
      } else {
        const [respuestas_texto] = await connection.query('SELECT * FROM enc_respuestatexto WHERE idpregunta = ?', [pregunta.idpregunta]);
        pregunta.respuestas = respuestas_texto; 
      }
      pregunta.requerida = pregunta.requerida === 'S';
    }

    let resultadosFinales = [];
    for (i = 0; i < encuesta.preguntas.length; i++) {
      if (encuesta.preguntas[i].idtipopregunta == 1 || encuesta.preguntas[i].idtipopregunta == 2) {
        // Preguntas tipo Texto Corto o Texto Parrafo
        let respuestatexto = [];
        for (respuesta of encuesta.preguntas[i].respuestas) {
          respuestatexto.push(respuesta.respuesta);
        }

        resultadosFinales[i] = [
          [encuesta.preguntas[i].textopregunta, encuesta.preguntas[i].idtipopregunta],
          respuestatexto
        ];
        
      } else if (encuesta.preguntas[i].idtipopregunta == 3 || encuesta.preguntas[i].idtipopregunta == 4) {
        // Preguntas tipo Opcion Unica o Opcion Multiple
        
        // Opciones
        let opcionesnombres = [];
        let respuestasopciones = [];
        for (nombre of encuesta.preguntas[i].opciones) {
          opcionesnombres.push(nombre.opcion)
          respuestasopciones.push(0)
        }

        for (let y = 0; y < encuesta.preguntas[i].opciones.length; y++) {
          for (let z = 0; z < encuesta.preguntas[i].respuestas.length; z++) {
            if (encuesta.preguntas[i].opciones[y].idopciones === encuesta.preguntas[i].respuestas[z].idopciones) {
              respuestasopciones[y] += 1;
            }
          }
        }

        resultadosFinales[i] = [
          [encuesta.preguntas[i].textopregunta, encuesta.preguntas[i].idtipopregunta],
          opcionesnombres,
          respuestasopciones
        ]

      } else {
        // Preguntas tipo Slider o Rating
        if (encuesta.preguntas[i].idtipopregunta === 5) {
        let resultadosSlider = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (let y = 0; y < encuesta.preguntas[i].respuestas.length; y++) {
          resultadosSlider[Number(encuesta.preguntas[i].respuestas[y].respuesta)-1] += 1;
        }
          resultadosFinales[i] = [
            [encuesta.preguntas[i].textopregunta, encuesta.preguntas[i].idtipopregunta],
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            resultadosSlider,
          ] 
        } else if (encuesta.preguntas[i].idtipopregunta === 6) {
          let resultadosRanking = [0, 0, 0, 0, 0]
          for (let y = 0; y < encuesta.preguntas[i].respuestas.length; y++) {
            resultadosRanking[Number(encuesta.preguntas[i].respuestas[y].respuesta)] += 1;
          }
          resultadosFinales[i] = [
            [encuesta.preguntas[i].textopregunta, encuesta.preguntas[i].idtipopregunta],
            [1, 2, 3, 4, 5],
            resultadosRanking
          ] 
        }
      }
    }

  const doc = new PDFDocument();
  contador = 0;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename=archivo.pdf');

  doc.pipe(res);

  doc.font("Helvetica-Bold").fontSize(22).text('Resultados de la encuesta: \n' + encuesta.nombre, { align: 'center' });
  doc.moveDown();
  doc.font("Helvetica").fontSize(14).text(encuesta.descripcion, { align: 'center' });
  doc.moveDown();
  doc.text(`Fecha: ${new Date().toLocaleString()}`, { align: 'center' });
  doc.addPage();
  
  //console.log(resultadosFinales)
  for (opcion of resultadosFinales) {
    doc.moveDown();
    doc.font('Helvetica-Bold').text("- " + opcion[0][0]);
    doc.font('Helvetica');
      doc.moveDown();
    if (opcion[0][1] === 1 || opcion[0][1] === 2){
      for (respuesta of opcion[1]) {
        contador += 1;
        doc.text(contador + ". " + respuesta);
        doc.moveDown()
      };
      contador = 0;
    } else if (opcion[0][1] === 3 || opcion[0][1] === 5) {
      const canvas = createCanvas(800, 600); 
      const ctx = canvas.getContext('2d');

      // Chart.js configuration
      const chartConfig = {
          type: 'bar',
          data: {
              labels: opcion[1],
              datasets: [{
                  label: 'Sales',
                  data: opcion[2],
                        backgroundColor: [
                          'rgba(255, 99, 132, 0.7)',
                          'rgba(255, 159, 64, 0.7)',
                          'rgba(255, 205, 86, 0.7)',
                          'rgba(75, 192, 192, 0.7)',
                          'rgba(54, 162, 235, 0.7)',
                          'rgba(153, 102, 255, 0.7)',
                          'rgba(201, 203, 207, 0.7)'
                        ],
                  borderColor: 'rgba(75, 192, 192, 1)',
                  borderWidth: 1
              }]
          },
          options: {
              scales: {
                  y: {
                      beginAtZero: true
                  }
              },
              plugins: {
                legend: {
                labels: {
                  color: 'white'
                },
                  display: false,
              }
            }
          }
      };

      new Chart(ctx, chartConfig);

      const chartImageBuffer = canvas.toBuffer('image/png');
          doc.image(chartImageBuffer, {
            fit: [doc.page.width - 150, 400],
            align: 'center',
            valign: 'center'
          });
    } else if (opcion[0][1] === 4) {
      const canvas = createCanvas(800, 600); 
      const ctx = canvas.getContext('2d');

      // Chart.js configuration
      const chartConfig = {
          type: 'doughnut', 
          data: {
              labels: opcion[1],
              datasets: [{
                  label: 'Sales',
                  data: opcion[2],
                        backgroundColor: [
                          'rgba(255, 99, 132, 0.7)',
                          'rgba(255, 159, 64, 0.7)',
                          'rgba(255, 205, 86, 0.7)',
                          'rgba(75, 192, 192, 0.7)',
                          'rgba(54, 162, 235, 0.7)',
                          'rgba(153, 102, 255, 0.7)',
                          'rgba(201, 203, 207, 0.7)'
                        ],
                  borderColor: 'rgba(75, 192, 192, 1)',
                  borderWidth: 1
              }],
          },
          options: {
              scales: {
                  y: {
                      beginAtZero: true
                  }
              },
              plugins: {
                legend: {
                labels: {
                  color: 'black'
                },
                display: true,
              }
            }
          }
      };

      new Chart(ctx, chartConfig);

      const chartImageBuffer = canvas.toBuffer('image/png');
          doc.image(chartImageBuffer, {
            fit: [doc.page.width - 150, 400],
            align: 'center',
            valign: 'center'
          });
      
      doc.moveDown();

      for (var i = 0; i < opcion[1].length; i++) {
        doc.font("Helvetica-Bold").text(opcion[1][i]);
        doc.font("Helvetica");
        doc.text(opcion[2][i]);
        doc.moveDown();
      }
      
    } else if (opcion[0][1] === 6) {
      const canvas = createCanvas(800, 600); 
      const ctx = canvas.getContext('2d');

      // Chart.js configuration
      const chartConfig = {
          type: 'bar', 
          data: {
              labels: opcion[1],
              datasets: [{
                  label: 'Sales',
                  data: opcion[2],
                        backgroundColor: [
                          'rgba(255, 99, 132, 0.7)',
                          'rgba(255, 159, 64, 0.7)',
                          'rgba(255, 205, 86, 0.7)',
                          'rgba(75, 192, 192, 0.7)',
                          'rgba(54, 162, 235, 0.7)',
                          'rgba(153, 102, 255, 0.7)',
                          'rgba(201, 203, 207, 0.7)'
                        ],
                  borderColor: 'rgba(75, 192, 192, 1)',
                  borderWidth: 1
              }],
          },
          options: {
              scales: {
                  y: {
                      beginAtZero: true
                  }
              },
              indexAxis: 'y',
              plugins: {
                legend: {
                labels: {
                  color: 'black'
                },
                display: false,
              }
            }
          }
      };

      new Chart(ctx, chartConfig);

      const chartImageBuffer = canvas.toBuffer('image/png');
          doc.image(chartImageBuffer, {
            fit: [doc.page.width - 150, 400],
            align: 'center',
            valign: 'center'
          });
      
      doc.moveDown();

    } else {
    }
    doc.addPage();
  }

  doc.end();

  } catch (err) {
    // Si algo falla, este mensaje nos dirá qué fue
    res.status(500).json({ error: 'Error interno del servidor.' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Ruta para generar y enviar el XLSX
app.get('/api/XLSX/:id', async (req, res) => {
  // ---------- Generacion de JSON con resultados, se repite en el metodo GET de resultados -----------------
  const { id } = req.params; 

  
  let connection;
  try {
    connection = await db.getConnection();
    const query = 'SELECT * FROM enc_encuestasm WHERE idencuesta = ?';
    const [surveyRows] = await connection.query(query, [id]);
    if (surveyRows.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Encuesta no encontrada o no tienes permiso para verla.' });
    }
    const encuesta = surveyRows[0];
    const [questions] = await connection.query(
      'SELECT * FROM enc_pregunta WHERE idencuesta = ?',
      [id]
    );


    encuesta.preguntas = questions;
    for (const pregunta of questions) {
      if (pregunta.idtipopregunta === 3 || pregunta.idtipopregunta === 4) {
        const [options] = await connection.query('SELECT * FROM enc_opcion WHERE idpregunta = ?', [pregunta.idpregunta]);
        pregunta.opciones = options;
        const [resultado_opcion] = await connection.query('SELECT * FROM enc_respuestaopcion WHERE idpregunta = ?', [pregunta.idpregunta])
        pregunta.respuestas = resultado_opcion;
      } else {
        const [respuestas_texto] = await connection.query('SELECT * FROM enc_respuestatexto WHERE idpregunta = ?', [pregunta.idpregunta]);
        pregunta.respuestas = respuestas_texto; 
      }
      pregunta.requerida = pregunta.requerida === 'S';
    }
    let resultadosFinales = [];
    for (i = 0; i < encuesta.preguntas.length; i++) {
      if (encuesta.preguntas[i].idtipopregunta == 1 || encuesta.preguntas[i].idtipopregunta == 2) {
        let respuestatexto = [];
        for (respuesta of encuesta.preguntas[i].respuestas) {
          respuestatexto.push(respuesta.respuesta);
        }
        resultadosFinales[i] = [
          [encuesta.preguntas[i].textopregunta, encuesta.preguntas[i].idtipopregunta],
          respuestatexto
        ];        
      } else if (encuesta.preguntas[i].idtipopregunta == 3 || encuesta.preguntas[i].idtipopregunta == 4) {
        let opcionesnombres = [];
        let respuestasopciones = [];
        for (nombre of encuesta.preguntas[i].opciones) {
          opcionesnombres.push(nombre.opcion)
          respuestasopciones.push(0)
        }
        for (let y = 0; y < encuesta.preguntas[i].opciones.length; y++) {
          for (let z = 0; z < encuesta.preguntas[i].respuestas.length; z++) {
            if (encuesta.preguntas[i].opciones[y].idopciones === encuesta.preguntas[i].respuestas[z].idopciones) {
              respuestasopciones[y] += 1;
            }
          }
        }
        resultadosFinales[i] = [
          [encuesta.preguntas[i].textopregunta, encuesta.preguntas[i].idtipopregunta],
          opcionesnombres,
          respuestasopciones
        ]
      } else {
        if (encuesta.preguntas[i].idtipopregunta === 5) {
        let resultadosSlider = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (let y = 0; y < encuesta.preguntas[i].respuestas.length; y++) {
          resultadosSlider[Number(encuesta.preguntas[i].respuestas[y].respuesta)-1] += 1;
        }
          resultadosFinales[i] = [
            [encuesta.preguntas[i].textopregunta, encuesta.preguntas[i].idtipopregunta],
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            resultadosSlider,
          ] 
        } else if (encuesta.preguntas[i].idtipopregunta === 6) {
          let resultadosRanking = [0, 0, 0, 0, 0]
          for (let y = 0; y < encuesta.preguntas[i].respuestas.length; y++) {
            resultadosRanking[Number(encuesta.preguntas[i].respuestas[y].respuesta)] += 1;
          }
          resultadosFinales[i] = [
            [encuesta.preguntas[i].textopregunta, encuesta.preguntas[i].idtipopregunta],
            [1, 2, 3, 4, 5],
            resultadosRanking
          ] 
        }
      }
    }
    
  // --------------- Final de JSON de resultados -------------------------------------------

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Resultados');

    // Informacion de la encuesta
    worksheet.addRow([encuesta.nombre]);
    worksheet.getCell('A1').font = { bold: true };
    worksheet.addRow([encuesta.descripcion]);
    worksheet.getCell('B2').value = encuesta.fecha;
    worksheet.addRow(['']);

    // Preguntas y resultados
    for (preguntas of resultadosFinales) {
      // Preguntas texto corto y parrafo
      if (preguntas[0][1] === 1 || preguntas[0][1] === 2) {
        // Nombre de la pregunta
        bold = worksheet.addRow([preguntas[0][0]]);
        bold.eachCell((cell) => {
          cell.font = { bold: true};
        });
        arrayOpciones = [];
        // Preguntas
        for (opcion of preguntas[1]){
          // Respuestas
          arrayOpciones.push(opcion);
        }
        worksheet.addRow(arrayOpciones);
        worksheet.addRow(['']);
        
        // Preguntas opcion unicas y multiples 
    } else if (preguntas[0][1] === 3 || preguntas[0][1] === 4) {
      // Nombre de la pregunta
        bold = worksheet.addRow([preguntas[0][0]]);
        bold.eachCell((cell) => {
          cell.font = { bold: true};
        });
        arrayOpciones = [];

      // Preguntas
      arrayOpciones = [];
      for (opcion of preguntas[1]){
        arrayOpciones.push(opcion);
      }
      worksheet.addRow(arrayOpciones);

      // Respuestas
      arrayRespuestas = [];
      for (respuesta of preguntas[2]){
        arrayRespuestas.push(respuesta);
      }
      worksheet.addRow(arrayRespuestas);
      worksheet.addRow(['']);
      
      // Preguntas slider
    } else if (preguntas[0][1] === 5) {
      // Nombre de la pregunta
        bold = worksheet.addRow([preguntas[0][0]]);
        bold.eachCell((cell) => {
          cell.font = { bold: true};
        });
        arrayOpciones = [];

      // Preguntas
      worksheet.addRow([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

      // Respuestas
      arrayRespuestas = [];
      for (respuesta of preguntas[2]) {
        arrayRespuestas.push(respuesta);
      };
      worksheet.addRow(arrayRespuestas);
      worksheet.addRow(['']);

    } else if (preguntas[0][1] === 6) {
      // Nombre de la pregunta
        bold = worksheet.addRow([preguntas[0][0]]);
        bold.eachCell((cell) => {
          cell.font = { bold: true};
        });
        arrayOpciones = [];

      // Preguntas
      worksheet.addRow([1, 2, 3, 4, 5]);

      // Respuestas
      arrayRespuestas = [];
      for (respuesta of preguntas[2]) {
        arrayRespuestas.push(respuesta);
      };
      worksheet.addRow(arrayRespuestas);
      worksheet.addRow(['']);
    };

    };

  // Write file to response
  await workbook.xlsx.write(res);
  console.log(resultadosFinales);
  res.end();
  
  console.log('Excel file created successfully!');

  } catch (err) {
    console.error('Error generating Excel:', err);
    res.status(500).send('Error generating file');
  }


  } catch (err) {
    // Si algo falla, este mensaje nos dirá qué fue
    res.status(500).json({ error: 'Error interno del servidor.' });
  } finally {
    if (connection) {
      connection.release();
    }
  }

});