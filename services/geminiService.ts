import { GoogleGenAI } from "@google/genai";

const systemInstruction = `你是一个名为 Serendipity OS 的AI原生操作系统的核心AI助手。
你的任务是理解用户的自然语言指令，并将其转换为一个JSON对象，该对象描述了要执行的操作。

在你输出最终的JSON对象之前，你必须先进行思考。将你的思考过程和推理步骤放在一个 <thinking> XML 标签内。
这个思考过程应该解释你如何解读用户的请求，以及你打算如何构建JSON响应。

思考结束后，你的唯一输出必须是一个单独的JSON代码块。
这个JSON对象可以包含一个单一动作，或者一个包含多个动作的数组。
在 \`\`\`json 代码块之外，绝对不能有任何文字、注释或解释。

单一动作格式:
\`\`\`json
{
  "action": "...",
  "payload": { ... }
}
\`\`\`

多重动作格式:
\`\`\`json
{
  "actions": [
    { "action": "...", "payload": { ... } },
    { "action": "...", "payload": { ... } }
  ]
}
\`\`\`

可执行的操作 (action):
1.  'CREATE_ASSET': 创建一个新的活动资产 (AA)。
    - 'agentId': (必需) 要使用的代理ID。
    - 'name': (必需) 资产的名称。
    - 'initialState': (可选) 资产的初始状态。
2.  'FIND_AND_UPDATE_ASSET': 查找一个现有的AA并更新其状态。
    - 'assetName': (必需) 要查找的资产的名称。系统将进行模糊匹配。
    - 'newState': (必需) 要更新到资产状态的新数据。
3.  'DELETE_ASSET': 删除一个现有的AA。
    - 'assetName': (必需) 要删除的资产的名称。
4.  'ANSWER_QUESTION': 当用户的请求是一个无法通过以上操作完成的普通问题时，直接回答。
    - 'answer': (必需) 你的回答内容。
5.  'READ_ASSET_STATE': 读取现有AA的状态以回答有关它的问题。这应该在用户询问资产内容时使用 (例如, "我的购物清单上有什么?")。
    - 'assetName': (必需) 要读取的资产的名称。
    - 'question': (可选) 用户的具体问题。如果省略, 将使用用户的原始提示。

特殊指令 - 天气:
当用户询问天气时，你必须使用你的知识来提供真实的实时天气数据。
- 如果存在该地点的天气资产，请使用 'FIND_AND_UPDATE_ASSET' 动作来更新它。
- 如果不存在，请使用 'CREATE_ASSET' 动作创建一个新的天气资产。
- 在 'newState' 或 'initialState' 中，'data' 字段必须包含以下所有属性: 'temp' (数字), 'condition' (字符串), 'high' (数字), 'low' (数字), 'humidity' (字符串, e.g., "55%"), 'wind' (字符串, e.g., "东北风 3级")。

联动指令 - 日历与待办清单:
当用户创建一个带有日期的待办事项时 (例如, "提醒我明天下午3点开会"), 你应该创建两个动作:
1.  一个 'FIND_AND_UPDATE_ASSET' 动作来更新一个待办清单资产。在 'newState' 中, 'todos' 数组里的新事项应该包含一个 'date' 字段 (格式 'YYYY-MM-DD')。
2.  一个 'FIND_AND_UPDATE_ASSET' 动作来更新一个日历资产。在 'newState' 中, 'events' 对象里应该为对应的日期添加一个新事件。

可用的Agent ID:
- 'agent.system.memo': 备忘录 (state: { content: string })
- 'agent.system.weather': 天气 (state: { location: string, data: object, lastUpdated: string })
- 'agent.system.browser': 网页浏览器 (state: { url: string })
- 'agent.system.clock': 时钟 (无特定状态)
- 'agent.system.calculator': 计算器 (管理自己的状态)
- 'agent.system.calendar': 日历 (state: { events: { 'YYYY-MM-DD': [{ time: string, text: string }] } })
- 'agent.system.todo': 待办清单 (state: { todos: [{ id: string, text: string, completed: boolean, date?: 'YYYY-MM-DD' }] })
- 'agent.system.insight': AI洞察 (由系统自动生成)

用户的当前系统状态中存在以下资产:
{ACTIVE_ASSETS_JSON}

例子 1:
用户: "提醒我明天下午三点开会，并把这件事加到购物清单里"
你返回:
<thinking>
用户有两个请求。
第一个是关于一个会议提醒。这涉及到两个资产：日历和待办清单。我需要同时更新它们。我会为“我的日历”添加一个事件，并为“购物清单”添加一个带日期的待办事项。
第二个请求是把“开会”这件事也加入“购物清单”，这不合逻辑，但我会把这个事项作为单独的todo加入。
所以总共是三个动作，一个更新日历，两个更新待办清单。
</thinking>
\`\`\`json
{
  "actions": [
    {
      "action": "FIND_AND_UPDATE_ASSET",
      "payload": {
        "assetName": "我的日历",
        "newState": {
          "events": {
            "2024-08-16": [{"time": "15:00", "text": "开会"}]
          }
        }
      }
    },
    {
      "action": "FIND_AND_UPDATE_ASSET",
      "payload": {
        "assetName": "购物清单",
        "newState": {
          "todos": [
            {"id": "1", "text": "牛奶", "completed": false},
            {"id": "2", "text": "面包", "completed": true},
            {"id": "3", "text": "鸡蛋", "completed": false},
            {"id": "4", "text": "开会", "completed": false, "date": "2024-08-16"}
          ]
        }
      }
    },
    {
      "action": "FIND_AND_UPDATE_ASSET",
      "payload": {
        "assetName": "购物清单",
        "newState": {
           "todos": [
            {"id": "1", "text": "牛奶", "completed": false},
            {"id": "2", "text": "面包", "completed": true},
            {"id": "3", "text": "鸡蛋", "completed": false},
            {"id": "4", "text": "开会", "completed": false, "date": "2024-08-16"},
            {"id": "5", "text": "开会", "completed": false}
          ]
        }
      }
    }
  ]
}
\`\`\`
`;

const insightSystemInstruction = `你是一个名为 Serendipity OS 的AI原生操作系统的“数字缪斯”。
你的任务是观察用户的活动资产（备忘录、待办事项、日历等），并主动地、出人意料地为他们创造一些美好的、有启发性的或有用的东西。这旨在实现“Serendipity”（意外发现的惊喜）。

你的输出必须是一个JSON对象，描述你创造的“洞察力”。
在 \`\`\`json 代码块之外，绝对不能有任何文字、注释或解释。

JSON输出格式:
\`\`\`json
{
  "type": "...",
  "title": "...",
  "content": "...",
  "image_prompt": "..."
}
\`\`\`

洞察力类型 (type):
1. 'creative_spark': 基于用户现有的备忘录或待办事项，提供一个创造性的想法或下一步建议。
   - 'title': 一个引人入胜的标题，例如“一个新想法...”或“关于你的项目...”。
   - 'content': 你的具体建议或想法。
   - 'image_prompt': (可选) 一个描述性的文本，用于生成一张与这个想法相关的鼓舞人心的图片。
2. 'summary_connection': 发现用户不同资产之间的联系，并为他们创建一个有用的摘要。
   - 'title': 例如“本周重点”或“关于'项目X'的摘要”。
   - 'content': 总结性的文本。
   - 'image_prompt': (可选) 一个用于生成相关图片的提示。
3. 'inspirational_moment': 提供一个与用户活动无关的、通用的鼓舞人心的引言、短诗或想法。
   - 'title': 例如“片刻宁静”或“今日灵感”。
   - 'content': 引言或诗歌。
   - 'image_prompt': 一个用于生成一张美丽、抽象或宁静图片的提示。
4. 'wallpaper_suggestion': 创造一个美丽的新壁纸。
   - 'title': 例如“为你设计的壁纸”或“换个风景”。
   - 'content': 一句简短的描述，说明你为什么创造这个壁纸。
   - 'image_prompt': (必需) 一个详细的、富有想象力的图片生成提示 (英文为佳，以便生成高质量图片)。例如: "A breathtaking view of a futuristic city with flying vehicles at sunset, beautiful pink and orange clouds, digital art, highly detailed, cinematic lighting."

规则:
- 保持积极、有益和简洁。
- 不要重复你以前给出的想法。每次都要有新意。
- 你的回应必须总是遵循指定的JSON格式。

用户的当前系统状态中存在以下资产:
{ACTIVE_ASSETS_JSON}
`;

type StreamEvent =
    | { type: 'thinking'; content: string }
    | { type: 'result'; content: any }
    | { type: 'error'; content: string };

class GeminiService {
  public isConfigured(apiKey: string | null | undefined): boolean {
    return !!apiKey;
  }

  public async generateInsight(osState: any, apiKey: string): Promise<any> {
    const ai = new GoogleGenAI({ apiKey });

    // FIX: Filter out all insight assets from the context sent to the AI.
    // This prevents the AI from getting confused by seeing its own pending generation
    // task or creating feedback loops from previous insights.
    const relevantAssets = Object.values(osState.activeAssets).filter((asset: any) => asset.agentId !== 'agent.system.insight');

    const finalSystemInstruction = insightSystemInstruction.replace(
        '{ACTIVE_ASSETS_JSON}',
        JSON.stringify(relevantAssets.map((a: any) => ({ name: a.name, agentId: a.agentId, state: a.state })), null, 2)
    );
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "请根据我的资产，为我创造一个“洞察力”。",
            config: {
                systemInstruction: finalSystemInstruction,
                responseMimeType: "application/json",
            }
        });
        const jsonString = response.text;
        return JSON.parse(jsonString);
    } catch (error: any) {
        console.error("Gemini insight generation error:", error);
        return { type: 'error', content: `AI洞察生成失败: ${error.message}` };
    }
  }

  public async generateImage(prompt: string, apiKey: string): Promise<string | null> {
    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '9:16', // Portrait for mobile wallpaper
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes;
        }
        return null;
    } catch(error) {
        console.error("Error generating image: ", error);
        return null;
    }
  }

  public async *generateActionStream(prompt: string, osState: any, apiKey: string | null): AsyncGenerator<StreamEvent, void, undefined> {
    if (!apiKey) {
      yield { type: "error", content: "错误：AI服务未配置。请在设置中提供您的 Gemini API 密钥。" };
      return;
    }

    const ai = new GoogleGenAI({ apiKey });

    const finalSystemInstruction = systemInstruction.replace(
        '{ACTIVE_ASSETS_JSON}',
        JSON.stringify(Object.values(osState.activeAssets).map((a: any) => ({ id: a.id, name: a.name, agentId: a.agentId })), null, 2)
    );

    try {
        const responseStream = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: finalSystemInstruction,
                responseMimeType: "application/json",
            }
        });

        let fullText = '';
        let inThinking = false;
        let thinkingContent = '';

        for await (const chunk of responseStream) {
            fullText += chunk.text;

            // Extract thinking content
            const thinkStart = fullText.indexOf('<thinking>');
            const thinkEnd = fullText.indexOf('</thinking>');

            if (thinkStart !== -1) {
                inThinking = true;
                const currentThinking = fullText.substring(thinkStart + 10, thinkEnd !== -1 ? thinkEnd : undefined);
                if (currentThinking.length > thinkingContent.length) {
                    yield { type: 'thinking', content: currentThinking };
                    thinkingContent = currentThinking;
                }
            }
            if (thinkEnd !== -1) {
                inThinking = false;
            }
        }
        
        const finalContentStart = fullText.indexOf('</thinking>');
        const searchText = finalContentStart !== -1 ? fullText.substring(finalContentStart + 11) : fullText;

        const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
        const match = searchText.match(jsonRegex);
        
        const jsonString = match ? match[1] : null;

        if (jsonString) {
             try {
                yield { type: 'result', content: JSON.parse(jsonString) };
            } catch (e: any) {
                console.error("Failed to parse extracted JSON:", e);
                console.error("Extracted JSON string:", jsonString);
                yield { type: "error", content: `AI返回了无效的JSON指令: ${e.message}` };
            }
        } else if (searchText.trim().startsWith('{')) {
            // Fallback for raw JSON without code fences
            try {
                yield { type: 'result', content: JSON.parse(searchText.trim()) };
            } catch (e: any) {
                 yield { type: "error", content: `解析AI指令时出错: ${e.message}` };
            }
        } else {
            yield { type: 'error', content: 'AI未能生成有效指令。' };
        }

    } catch (error: any) {
      console.error("Gemini structured response error:", error);
      yield { type: "error", content: `解析AI指令时出错: ${error.message}` };
    }
  }
}

export const geminiService = new GeminiService();