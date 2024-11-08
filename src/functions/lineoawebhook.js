const { app } = require("@azure/functions");
const { replyMessage } = require("../services/line_messaging_api.service");

app.http("lineoawebhook", {
    methods: ["POST"],
    authLevel: "anonymous",
    handler: async (request, context) => {
        const requestText = await request.text();
        const bodyJson = JSON.parse(requestText);
        const event = bodyJson.events[0];
        const replyToken = event.replyToken;
        const lineUserID = event.source.userId;
        const userMessage = event.message?.text ?? "Empty Message";
        const replyResponse = await replyMessage({ messageText: userMessage, messageType: "text", replyToken: replyToken });
        return { body: null, status: 200 };
    },
});
