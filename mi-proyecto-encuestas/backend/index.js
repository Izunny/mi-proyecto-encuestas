const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();

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
  // ¡CORRECCIÓN DE SEGURIDAD! Obtenemos el idusuario del token.
  const { nombre, descripcion, fecha, activo, preguntas } = req.body;
  const idusuario = req.user.id

  // 2. Definimos la variable 'connection' fuera del try para que sea accesible en el 'finally'
  let connection;

  try {
    // 3. Obtenemos una conexión del pool. ESTA ES LA LÍNEA QUE FALTABA O ERA INCORRECTA.
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
    // 4. Liberamos la conexión SIEMPRE, tanto si hubo éxito como si hubo error
    if (connection) connection.release();
  }
});

// OBTENER UNA ENCUESTA ESPECÍFICA (VERSIÓN CON DEPURACIÓN AVANZADA)
app.get('/api/surveys/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  // Mensaje 1: ¿Llega la petición y con qué datos?
  console.log(`--- PASO 1: Petición recibida para encuesta ID: ${id} (tipo: ${typeof id})`);
  
  // Mensaje 2: ¿Qué usuario está verificado?
  console.log(`--- PASO 2: Usuario verificado con ID: ${userId} (tipo: ${typeof userId})`);

  let connection;
  try {
    // Mensaje 3: ¿Podemos obtener una conexión a la BD?
    console.log('--- PASO 3: Intentando obtener conexión a la BD...');
    connection = await db.getConnection();
    console.log('--- PASO 4: Conexión obtenida. Ejecutando consulta de verificación...');

    // 1. VERIFICAMOS QUE LA ENCUESTA EXISTA Y PERTENEZCA AL USUARIO
    const query = 'SELECT * FROM enc_encuestasm WHERE idencuesta = ? AND idusuario = ?';
    // Mensaje 5: ¿Cuál es la consulta exacta que se está ejecutando?
    console.log('--- PASO 5: La consulta SQL es:', query, 'con valores:', [id, userId]);

    const [surveyRows] = await connection.query(query, [id, userId]);
    
    // Mensaje 6: ¿Qué devolvió la base de datos?
    console.log('--- PASO 6: Resultado de la consulta de verificación:', surveyRows);

    if (surveyRows.length === 0) {
      console.log('--- PASO 7: La encuesta no pertenece al usuario o no existe. Devolviendo 404.');
      connection.release();
      return res.status(404).json({ error: 'Encuesta no encontrada o no tienes permiso para verla.' });
    }
    
    console.log('--- PASO 8: Encuesta encontrada. Obteniendo preguntas...');
    const encuesta = surveyRows[0];

    // 2. OBTENEMOS LAS PREGUNTAS Y OPCIONES
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
app.post('/api/responses', verifyToken, async (req, res) => {
  // 1. Ya no tomamos el idusuario del body, sino del token.
  const { idencuesta, respuestas } = req.body;
  const idusuario = req.user.id; // <-- Obtenemos el idusuario del token verificado

  // 2. La validación ahora es más simple.
  if (!idencuesta || !respuestas) {
    return res.status(400).json({ error: 'Faltan datos para guardar la respuesta.' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 3. La consulta INSERT sigue siendo la misma, pero ahora usa el 'idusuario' seguro del token.
    const responseQuery = 'INSERT INTO enc_respuesta (idencuesta, idusuario, fecha) VALUES (?, ?, NOW())';
    const [responseResult] = await connection.query(responseQuery, [idencuesta, idusuario]);
    const newResponseId = responseResult.insertId;

    // --- El resto de tu lógica para guardar las respuestas (que ya estaba bien) no cambia ---
    for (const idpregunta of Object.keys(respuestas)) {
      const respuesta = respuestas[idpregunta];

      if (respuesta == null || respuesta === '') continue;

      if (Array.isArray(respuesta)) {
        // OPCION MULTIPLE
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
        // TEXTO
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


// ELIMINAR UNA ENCUESTA DE FORMA SEGURA
app.delete('/api/surveys/:id', verifyToken, async (req, res) => {
  const { id } = req.params;  // El ID de la encuesta a borrar
  const userId = req.user.id; // El ID del usuario que hace la petición (del token)

  let connection;

  try {
    connection = await db.getConnection();
    
    // 1. ANTES de borrar, verificamos que la encuesta exista Y que pertenezca al usuario.
    const [surveyRows] = await connection.query(
      'SELECT idusuario FROM enc_encuestasm WHERE idencuesta = ?',
      [id]
    );

    if (surveyRows.length === 0) {
      // Si no existe, devolvemos un error 404
      return res.status(404).json({ error: 'Encuesta no encontrada.' });
    }
    
    if (surveyRows[0].idusuario !== userId) {
      // Si no es el dueño, devolvemos un error de permisos 403
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta encuesta.' });
    }

    // 2. Si las comprobaciones pasan, procedemos a borrar.
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