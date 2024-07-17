const TELEGRAM_BOT_SERVICE_URL = "https://zcrappy-bot.onrender.com"; // Replace with your actual URL

export const sendTelegramAlert = async (userId: string, message: string) => {
  try {
    const response = await fetch(`${TELEGRAM_BOT_SERVICE_URL}/send-alert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userId, message })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Failed to send alert:", errorData);
      throw new Error(`Failed to send alert: ${errorData.error}`);
    }

    const data = await response.json();
    console.log("Alert sent successfully:", data);
    return data;
  } catch (error) {
    console.error("Error sending alert:", error);
    throw error;
  }
};
