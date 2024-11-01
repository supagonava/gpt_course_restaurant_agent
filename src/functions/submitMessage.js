const { app } = require("@azure/functions");
const OpenAI = require("openai");
const sqlite3 = require("sqlite3");

async function fetch_menu() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database("./restaurant.db");

        const query = `
            SELECT 
                id || ' | ' || 
                name || ' | ' || 
                COALESCE(description, '-') || ' | ' || 
                printf("%.2f", price) as text_output
            FROM tb_menu
            ORDER BY id ASC;
        `;

        db.all(query, [], (err, rows) => {
            db.close();
            if (err) {
                reject(err);
                return;
            }
            // แปลง rows เป็น array ของ text
            const textOutput = String(rows.map((row) => row.text_output));
            resolve(String(textOutput));
        });
    });
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_TOOLS = [
    {
        type: "function",
        function: {
            name: "receive_order",
            strict: false,
            parameters: {
                type: "object",
                required: [],
                properties: {
                    food_items: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                name: {
                                    type: "string",
                                    description: "ชื่ออาหาร",
                                },
                                quantity: {
                                    type: "number",
                                    description: "จำนวนอาหารที่ลูกค้าสั่ง",
                                },
                            },
                        },
                        description: "รายการอาหารที่ลูกค้าสั่ง",
                    },
                },
            },
            description: "รับรายการอาหารจากลูกค้าโดยให้รับชื่ออาหารและจำนวน",
        },
    },
    {
        type: "function",
        function: {
            name: "get_menu",
            description: "บอกรายการอาหารและราคาต่อหน่วย",
            parameters: {
                type: "object",
                required: [],
                properties: {},
            },
            strict: false,
        },
    },
    {
        type: "function",
        function: {
            name: "confirm_order",
            strict: false,
            parameters: {
                type: "object",
                required: [],
                properties: {
                    confirmation: {
                        enum: ["ยืนยัน", "ยกเลิก"],
                        type: "string",
                        description: "คำตอบยืนยันหรือยกเลิกจากผู้ใช้",
                    },
                },
            },
            description: "พูดทวนรายการอาหารที่อยู่ในตะกร้าและถามยืนยันโดยให้ตอบว่ายืนยันหรือยกเลิก",
        },
    },
];

const COMPLETION_TEMPLATE = {
    model: "gpt-4o",
    messages: [
        {
            role: "system",
            content: [
                {
                    type: "text",
                    text: "เป็นพนักงานรับรายการอาหารอยู่หน้าร้าน\nคุณจะคุยกับลูกค้าเพื่อจดรายการอาหารและส่งต่อให้พนักงานในครัวเพื่อทำอาหารตามออเดอร์",
                },
            ],
        },
    ],
    temperature: 1,
    max_tokens: 2048,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    tools: ASSISTANT_TOOLS,
    parallel_tool_calls: false,
    response_format: {
        type: "text",
    },
};

app.http("submitMessage", {
    methods: ["POST"],
    authLevel: "anonymous",
    handler: async (request, context) => {
        const bodyJson = JSON.parse(await request.text());
        const message = bodyJson.message;
        COMPLETION_TEMPLATE.messages.push({
            role: "user",
            content: [{ type: "text", text: message }],
        });
        const response = await openai.chat.completions.create(COMPLETION_TEMPLATE);

        // Check condition if tool_calls
        if (response?.choices?.[0]?.finish_reason === "tool_calls") {
            const toolArg = JSON.parse(response.choices[0].message.tool_calls[0].function.arguments); // Args to call function
            const toolName = response.choices[0].message.tool_calls[0].function.name; // "get_menu"
            const toolCallID = response.choices[0].message.tool_calls[0].id;
            COMPLETION_TEMPLATE.messages.push(response.choices[0].message);

            let toolResponseText = "";
            if (toolName === "get_menu") {
                toolResponseText = await fetch_menu(toolArg); // toolarg คือตัว params
            }

            COMPLETION_TEMPLATE.messages.push({
                role: "tool",
                content: [
                    {
                        type: "text",
                        text: toolResponseText,
                    },
                ],
                tool_call_id: toolCallID,
            });
            const responseAfterToolCall = await openai.chat.completions.create(COMPLETION_TEMPLATE);
            COMPLETION_TEMPLATE.messages.push(responseAfterToolCall.choices[0].message);
        } else {
            COMPLETION_TEMPLATE.messages.push(response.choices[0].message);
        }
        return { body: JSON.stringify(COMPLETION_TEMPLATE), headers: { "content-type": "application/json" } };
    },
});
