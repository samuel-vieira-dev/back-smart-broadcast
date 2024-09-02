const memoryQueue = require("../utils/MemoryQueue.js");
const facebookService = require("../services/facebookService.js");
const Broadcast = require("../models/Broadcast");

const sendBroadcast = async (req, res) => {
  const { pageids, message, buttons, schedule, userId, n8n, nameBroad } =
    req.body;
  const appAccessToken = req.headers["app-access-token"];

  if (!appAccessToken) {
    return res
      .status(400)
      .json({ success: false, error: "App access token is required" });
  }

  try {
    // Adicionar a tarefa à fila
    await memoryQueue.add(async () => {
      await facebookService.sendBroadcastToPages(
        pageids,
        message,
        buttons,
        appAccessToken,
        schedule,
        userId,
        n8n,
        nameBroad
      );
    });

    res
      .status(200)
      .json({ success: true, message: "Broadcast job added to the queue." });
  } catch (error) {
    console.error("Error in broadcast controller:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getAllPages = async (req, res) => {
  const { facebookUserId, accessToken, appAccessToken, userId } = req.body;
  try {
    const pages = await facebookService.getAllPages(
      facebookUserId,
      accessToken,
      appAccessToken,
      userId
    );
    res
      .status(200)
      .json({ allPages: pages, message: "Mensagens carregado com sucesso" });
  } catch (error) {
    console.error("Error in broadcast controller:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
const getDetailsBroad = async (req, res) => {
  const { userId } = req.params;
  try {
    const datailsBroads = await Broadcast.find(
      { userId },
      {
        scheduledAt: { $ifNull: ["$scheduledAt", "$createdAt"] },
        _id: 1,
        message: 1,
        createdAt: 1,
        nameBroad: 1,
        send: 1,
        delivered: 1,
        notDelivered: 1,
      }
    ).sort({ createdAt: -1 });
    if (!datailsBroads) {
      return res.status(404).json({ error: "Settings not found" });
    }
    const formattedDatailsBroads = datailsBroads.map((broad) => ({
      ...broad._doc,
      scheduledAt: broad.scheduledAt
        ? new Date(broad.scheduledAt).toLocaleString("pt-BR", {
            timeZone: "America/Sao_Paulo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : null,
    }));

    res.json(formattedDatailsBroads);
  } catch (error) {
    console.error("Error retrieving user settings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
const filterBroad = async (req, res) => {
  const { userId } = req.params;
  const { name, startDate, endDate } = req.query;

  try {
    let filter = { userId };
    if (name) {
      filter.nameBroad = { $regex: name, $options: "i" };
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }
    const datailsBroads = await Broadcast.find(filter);
    res.json(datailsBroads);
  } catch (error) {
    console.error("Error getting filtered broadcasts", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
module.exports = { getDetailsBroad, sendBroadcast, getAllPages, filterBroad };
