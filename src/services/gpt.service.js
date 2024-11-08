const { COMPLETION_TEMPLATE } = require("../config/ai_tool");
const OpenAI = require("openai");

const submitMessageToGPT = async ({ messages }) => {
    const payload_template = { ...COMPLETION_TEMPLATE };
    payload_template.messages = payload_template.messages.concat(messages);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const gptResponseMessage = await openai.chat.completions.create(payload_template);
    payload_template.messages.push(gptResponseMessage.choices[0].message);

    payload_template.messages.splice(0, 1);
    return { status: "success", message_to_reply: gptResponseMessage.choices[0].message.content, messages: payload_template.messages };
};

module.exports = { submitMessageToGPT };
