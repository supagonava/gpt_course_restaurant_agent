const { COMPLETION_TEMPLATE } = require("../config/ai_tool");
const OpenAI = require("openai");
const { viewAllFoodItems, addToCart, viewCart, clearCart } = require("./database.services");

const submitMessageToGPT = async ({ userID, messages }) => {
    const allFoods = await viewAllFoodItems();
    const payload_template = { ...COMPLETION_TEMPLATE };
    payload_template.messages[0].content += `\nร้านของคุณมีรายการอาหารต่อไปนี้ ${allFoods}`;
    payload_template.messages = payload_template.messages.concat(messages);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const gptResponseMessage = await openai.chat.completions.create(payload_template);
    payload_template.messages.push(gptResponseMessage.choices[0].message);

    let messageToReplyCallback = "";
    if (gptResponseMessage?.choices?.[0]?.finish_reason === "tool_calls") {
        for (const toolCall of gptResponseMessage.choices[0].message.tool_calls) {
            let toolArg = JSON.parse(toolCall.function.arguments);
            toolArg = Object.keys(toolArg).length === 0 ? null : toolArg;

            const toolName = toolCall.function.name;
            const toolCallID = toolCall.id;

            let toolResponseText = "ฟีเจอร์นี้ยังไม่ได้พัฒนา";
            if (toolName === "view_all_food_items") {
                toolResponseText = await viewAllFoodItems(toolArg);
            } else if (toolName === "add_to_cart") {
                await addToCart(userID, parseInt(toolArg?.food_id), toolArg?.quantity);
                toolResponseText = "เพิ่มสำเร็จ";
            } else if (toolName === "view_cart") {
                const cartItems = await viewCart(userID);
                toolResponseText = `มีรายการต่อไปนี้ในตะกร้า ${cartItems}`;
            } else if (toolName === "clear_cart") {
                await clearCart(userID);
                toolResponseText = `ล้างรายการในตะกร้าแล้ว`;
            } else if (toolName === "confirm_order") {
                const cartItems = await viewCart(userID);
                await clearCart(userID);
                toolResponseText = `สั่งรายการต่อไปนี้แล้ว ${cartItems} พร้อมบอกผู้ใช้ว่าตะกร้าของคุณว่างเปล่าแล้ว`;
            }
            payload_template.messages.push({
                role: "tool",
                content: [{ type: "text", text: toolResponseText }],
                tool_call_id: toolCallID,
            });
        }
        const responseAfterToolCall = await openai.chat.completions.create(payload_template);
        payload_template.messages.push(responseAfterToolCall.choices[0].message);
        messageToReplyCallback = responseAfterToolCall.choices[0].message.content;
    } else {
        messageToReplyCallback = gptResponseMessage.choices[0].message.content;
    }
    payload_template.messages.splice(0, 1);
    return { status: "success", message_to_reply: messageToReplyCallback, messages: payload_template.messages };
};

module.exports = { submitMessageToGPT };
