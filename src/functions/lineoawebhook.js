const { app } = require("@azure/functions");
const { replyMessage, getUserProfile } = require("../services/line_messaging_api.service");
const { checkUserExists, createUser, getUserMessages } = require("../services/database.services");
const APIAxios = require("../services/axios.service");

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

        const userProfile = await getUserProfile(lineUserID);
        const userExists = await checkUserExists(lineUserID);
        if (!userExists) await createUser(lineUserID, userProfile.displayName);

        const userMessages = Array.from(await getUserMessages(lineUserID));
        userMessages.push({
            role: "user",
            content: [{ text: `${userMessage}`.toLowerCase(), type: "text" }],
        });
        const submitToGptResponse = await APIAxios.post("http://localhost:7071/api/submitMessage", { messages: userMessages }, { headers: { "Content-Type": "application/json" } });

        const messageToReply = submitToGptResponse.data?.message_to_reply;
        const replyResponseText = await replyMessage({ messageType: "text", messageText: messageToReply, replyToken: replyToken });

        // Reply As Flex message
        // const flexMessageBody = require("../sample-message/first_flex_message.json");
        // flexMessageBody.footer.contents[0].action.label = userMessage;
        // flexMessageBody.footer.contents[0].action.text = userMessage;
        // flexMessageBody.footer.contents.push({
        //     type: "button",
        //     action: {
        //         type: "uri",
        //         label: "Google",
        //         uri: `https://www.google.com/search`,
        //     },
        // });
        // const replyResponseFlex = await replyMessage({ messageType: "flex", contents: flexMessageBody, altText: "flex", replyToken: replyToken });

        return { body: null, status: 200 };
    },
});
