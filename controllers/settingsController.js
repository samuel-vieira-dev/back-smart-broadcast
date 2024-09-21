// controllers/settingsController.js
const UserSettings = require("../models/UserSettings");
// Obtém as configurações do usuário
const getUserSettings = async (req, res) => {
  const { userId } = req.params;
  try {
    const settings = await UserSettings.findOne({ userId }).populate(
      "userId",
      "name email"
    );
    if (!settings) {
      return res.status(404).json({ error: "Settings not found" });
    }
    res.json(settings);
  } catch (error) {
    console.error("Error retrieving user settings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Salva as configurações do usuário
const saveUserSettings = async (req, res) => {
  const { facebookUserId, accessToken, pages, userId, appAccessToken} =
    req.body;

  try {
    let settings = await UserSettings.findOne({ userId });
    if (settings) {
      if (facebookUserId !== null && facebookUserId !== undefined) {
        settings.facebookUserId = facebookUserId;
      }
      if (accessToken !== null && accessToken !== undefined) {
        settings.accessToken = accessToken;
      }
      if (pages !== null && pages !== undefined) {
        settings.pages = pages;
      }
      if (appAccessToken !== null && appAccessToken !== undefined) {
        settings.appAccessToken = appAccessToken;
      }
      // if (firstMessage !== null && firstMessage !== undefined) {
      //   settings.firstMessage = firstMessage;
      // }
      // if (buttons !== null && buttons !== undefined) {
      //   settings.buttons = buttons;
      // }
    } else {
      // Cria novas configurações
      settings = new UserSettings({
        userId,
        facebookUserId,
        accessToken,
        pages,
        appAccessToken,
      });
    }

    await settings.save();
    res.status(200).json({ settingsId: settings._id });
  } catch (error) {
    console.error("Error saving user settings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getUserSettings, saveUserSettings };
