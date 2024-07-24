const pool = require('../config/db.js');

const getUserSettings = async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query('SELECT * FROM usersBroadcast WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    const { webhook_token, app_access_token, app_client_id, app_secret_key, webhook_url, response_text } = result.rows[0];
    res.json({
      webhook_token,
      app_access_token,
      app_client_id,
      app_secret_key,
      webhook_url,
      response_text,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const saveUserSettings = async (req, res) => {
  const { verifyToken, appAccessToken, clientId, clientSecret, callbackUrl } = req.body;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      'UPDATE usersBroadcast SET webhook_token = $1, app_access_token = $2, app_client_id = $3, app_secret_key = $4, webhook_url = $5 WHERE id = $6 RETURNING id',
      [verifyToken, appAccessToken, clientId, clientSecret, callbackUrl, userId]
    );

    res.status(200).json({ settingsId: result.rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getUserSettings, saveUserSettings };
