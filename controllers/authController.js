const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const register = async (req, res) => {
  const { name, email, password, app_access_token, app_client_id, app_secret_key, webhook_token, webhook_url } = req.body;

  try {
    // Verifica se o email já está registrado
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Inserção do usuário no banco de dados
    const result = await pool.query(
      'INSERT INTO users (name, email, password, app_access_token, app_client_id, app_secret_key, webhook_token, webhook_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
      [name, email, hashedPassword, app_access_token, app_client_id, app_secret_key, webhook_token, webhook_url]
    );

    res.status(201).json({ userId: result.rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Busca o usuário pelo email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Compara a senha fornecida com a senha armazenada
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Gera o token JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, userId: user.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { register, login };
