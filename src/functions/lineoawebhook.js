const { app } = require("@azure/functions");
const { replyMessage, getUserProfile } = require("../services/line_messaging_api.service");
const { checkUserExists, createUser, getUserMessages, updateUserMessage } = require("../services/database.services");
const APIAxios = require("../services/axios.service");
const { submitMessageToGPT } = require("../services/gpt.service");

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

        let userMessages = Array.from((await getUserMessages(lineUserID)) ?? []);
        userMessages = userMessages.slice(-10);
        userMessages.push({
            role: "user",
            content: [{ text: `${userMessage}`.toLowerCase(), type: "text" }],
        });
        const submitToGptResponse = await submitMessageToGPT({ messages: userMessages });

        const messageToReply = submitToGptResponse.message_to_reply;
        const replyResponseText = await replyMessage({ messageType: "text", messageText: messageToReply, replyToken: replyToken });
        await updateUserMessage(lineUserID, submitToGptResponse.messages);
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
