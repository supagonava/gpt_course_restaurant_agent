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
        const replyResponseText = await replyMessage({ messageType: "text", messageText: userMessage, replyToken: replyToken });

        // Reply As Flex message
        const flexMessageBody = require("../sample-message/first_flex_message.json");
        flexMessageBody.footer.contents[0].action.label = userMessage;
        flexMessageBody.footer.contents[0].action.text = userMessage;
        flexMessageBody.footer.contents.push({
            type: "button",
            action: {
                type: "uri",
                label: "Google",
                uri: `https://www.google.com/search`,
            },
        });
        // const replyResponseFlex = await replyMessage({ messageType: "flex", contents: flexMessageBody, altText: "flex", replyToken: replyToken });

        return { body: null, status: 200 };
    },
});
