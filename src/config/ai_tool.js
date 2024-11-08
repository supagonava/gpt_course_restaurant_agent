const COMPLETION_TEMPLATE = {
    model: "gpt-4o-mini",
    messages: [
        {
            role: "system",
            content: [
                {
                    text: "เป็นพนักงานรับรายการอาหารอยู่หน้าร้าน\nคุณจะคุยกับลูกค้าเพื่อจดรายการอาหารและส่งต่อให้พนักงานในครัวเพื่อทำอาหารตามออเดอร์",
                    type: "text",
                },
            ],
        },
    ],
    temperature: 0.3,
    max_tokens: 2048,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    tools: [
        {
            type: "function",
            function: {
                name: "view_all_food_items",
                strict: true,
                parameters: {
                    type: "object",
                    required: [],
                    properties: {},
                    additionalProperties: false,
                },
                description: "เรียกดูรายการอาหารทั้งหมดโดยไม่อิงหมวดหมู่",
            },
        },
        {
            type: "function",
            function: {
                name: "add_to_cart",
                strict: true,
                parameters: {
                    type: "object",
                    required: ["food_id", "quantity"],
                    properties: {
                        food_id: {
                            type: "string",
                            description: "รหัสของรายการอาหารที่ต้องการเพิ่ม",
                        },
                        quantity: {
                            type: "number",
                            description: "จำนวนของรายการอาหารที่ต้องการเพิ่ม",
                        },
                    },
                    additionalProperties: false,
                },
                description: "เพิ่มรายการอาหารเข้าตะกร้าเพื่อรอ Submit โดยรับเป็น ID, Qty ของรายการอาหาร",
            },
        },
        {
            type: "function",
            function: {
                name: "confirm_order",
                description: "ยืนยันออเดอร์โดยรับค่า ยืนยัน หรือ ยกเลิก หรือต้องการสั่งเพิ่ม",
                strict: true,
                parameters: {
                    type: "object",
                    additionalProperties: false,
                    properties: {},
                    required: [],
                },
            },
        },
    ],
    parallel_tool_calls: true,
    response_format: {
        type: "text",
    },
};

module.exports = { COMPLETION_TEMPLATE };
