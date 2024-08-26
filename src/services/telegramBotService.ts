const TELEGRAM_BOT_SERVICE_URL = "https://zcrappy-bot.onrender.com"; // Replace with your actual URL

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const sendTelegramAlert = async (
  userId: string,
  message: string,
  maxRetries = 3
) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(
        `${TELEGRAM_BOT_SERVICE_URL}/api/send-alert`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, message }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          `Attempt ${attempt + 1} failed to send alert:`,
          errorData
        );
        if (attempt === maxRetries - 1) {
          throw new Error(`Failed to send alert: ${errorData.error}`);
        }
      } else {
        const data = await response.json();
        console.log("Alert sent successfully:", data);
        return data;
      }
    } catch (error) {
      console.error(`Attempt ${attempt + 1} error sending alert:`, error);
      if (attempt === maxRetries - 1) {
        throw error;
      }
    }

    await wait(Math.pow(2, attempt) * 1000);
  }
};
