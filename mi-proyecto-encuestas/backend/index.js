const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();


app.use(cors());
app.use(express.json());


const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', 
  database: 'db_encuestas' 
});



// Endpoint de prueba para verificar la conexión a la base de datos
app.get('/api/test-db', (req, res) => {
  connection.query('SELECT 1', (err, results) => {
    if (err) {
      console.error('Error al conectar con la BD:', err);
      return res.status(500).json({ 
        ok: false, 
        error: 'No se pudo conectar a la base de datos.' 
      });
    }
    res.json({ 
      ok: true, 
      message: '¡Conexión a la base de datos "db_encuestas" exitosa! ✅' 
    });
  });
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});

//http://localhost:3000/api/test-db