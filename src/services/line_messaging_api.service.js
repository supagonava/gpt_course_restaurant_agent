const LINE_REPLY_URL = "https://api.line.me/v2/bot/message/reply";
const APIAxios = require("./axios.service");

const getUserProfile = async ({ lineID }) => {
    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env?.CHANNEL_SECRET_TOKEN}`,
    };
    const response = await APIAxios.get(`https://api.line.me/v2/bot/profile/${lineID}`, { headers });
    return {
        displayName: response.data?.displayName,
        userId: response.data?.userId,
        language: response.data?.language,
        pictureUrl: response.data?.pictureUrl,
        statusMessage: response.data?.statusMessage,
    };
};

const replyMessage = async ({ messageType = "flex", messageText = "", contents = [], replyToken = "", altText = "" }) => {
    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env?.CHANNEL_SECRET_TOKEN}`,
    };
    const data = {
        replyToken: replyToken,
        messages: [
            messageType === "flex"
                ? {
                      type: messageType,
                      altText,
                      contents,
                  }
                : { type: messageType, text: messageText },
        ],
    };

    try {
        const response = await APIAxios.post(LINE_REPLY_URL, data, { headers: headers });
        return { status: "ok", message: "Message sented" };
    } catch (error) {
        return { status: "fail", message: String(error) };
    }
};

module.exports = { replyMessage, getUserProfile };
