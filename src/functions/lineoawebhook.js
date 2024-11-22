const { app } = require("@azure/functions");
const { replyMessage, getUserProfile, getImageContent } = require("../services/line_messaging_api.service");
const {
    checkUserExists,
    createUser,
    getUserMessages,
    updateUserMessage,
    getUserByLineId,
} = require("../services/database.services");
const APIAxios = require("../services/axios.service");
const { submitMessageToGPT } = require("../services/gpt.service");
const { getContentByLayout, getContentByRead } = require("../services/form_regonizer.service");

app.http("lineoawebhook", {
    methods: ["POST"],
    authLevel: "anonymous",
    handler: async (request, context) => {
        try {
            const requestText = await request.text();
            const bodyJson = JSON.parse(requestText);
            context.debug(bodyJson);

            const event = bodyJson.events[0];
            const replyToken = event.replyToken;
            const lineUserID = event.source.userId;
            let userMessage = event.message?.text ?? "Empty Message";
            const messasgeID = event.message?.id;

            const dbUser = await getUserByLineId(lineUserID);
            const userProfile = await getUserProfile(lineUserID);
            const userExists = await checkUserExists(lineUserID);
            if (!userExists) await createUser(lineUserID, userProfile.displayName);
            let userMessages = Array.from((await getUserMessages(lineUserID)) ?? []);
            userMessages = userMessages.slice(-10);
            userMessages = userMessages.filter((item) => item.role !== "tool" && item?.tool_calls === undefined);
            let messageToReply = "DefaultMessage";
            if (event?.message?.type === "image") {
                const imageBuffer = await getImageContent({ messageId: messasgeID });
                const { textContent } = await getContentByLayout({ formUrl: imageBuffer });
                context.debug(textContent);
                userMessage = `ลูกค้าเพิ่มสินค้าเข้าตะกร้าดังตารางนี้ \n\n ${textContent}`;
            }

            userMessages.push({
                role: "user",
                content: [{ text: `${userMessage}`.toLowerCase(), type: "text" }],
            });

            const submitToGptResponse = await submitMessageToGPT({ userID: dbUser.id, messages: userMessages });
            messageToReply = submitToGptResponse.message_to_reply;
            await updateUserMessage(lineUserID, submitToGptResponse.messages);

            const replyResponseText = await replyMessage({
                messageType: "text",
                messageText: messageToReply,
                replyToken: replyToken,
            });

            return { body: JSON.stringify(replyResponseText), status: 200 };
        } catch (error) {
            context.error(`Error :${error}`);
            return { body: `${error}`, status: 200 };
        }
    },
});
