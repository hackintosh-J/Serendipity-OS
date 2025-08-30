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

可用的Agent ID:
- 'agent.system.memo': 备忘录 (state: { content: string })
- 'agent.system.weather': 天气 (state: { location: string, data: object, lastUpdated: string })
- 'agent.system.browser': 网页浏览器 (state: { url: string })
- 'agent.system.clock': 时钟 (无特定状态)
- 'agent.system.calculator': 计算器 (管理自己的状态)

用户的当前系统状态中存在以下资产:
{ACTIVE_ASSETS_JSON}

例子 1:
用户: "创建一个叫购物清单的备忘录，里面写上牛奶和面包，然后告诉我北京的天气"
你返回:
<thinking>
用户有两个请求。
第一个是创建一个备忘录。资产名称是“购物清单”，代理ID是'agent.system.memo'，初始内容是牛奶和面包。这是一个 'CREATE_ASSET' 动作。
第二个是关于北京的天气。当前系统中已经有一个北京的天气资产。因此我需要使用 'FIND_AND_UPDATE_ASSET' 动作来更新它。我会用我的知识填充当前的天气数据到 'newState' 中。
我将把这两个动作组合成一个 'actions' 数组。
</thinking>
\`\`\`json
{
  "actions": [
    {
      "action": "CREATE_ASSET",
      "payload": {
        "agentId": "agent.system.memo",
        "name": "购物清单",
        "initialState": {
          "content": "- 牛奶\n- 面包"
        }
      }
    },
    {
      "action": "FIND_AND_UPDATE_ASSET",
      "payload": {
        "assetName": "北京天气",
        "newState": {
          "location": "北京",
          "data": {
            "temp": 25,
            "condition": "晴",
            "high": 30,
            "low": 20,
            "humidity": "40%",
            "wind": "南风 2级"
          },
          "lastUpdated": "2024-01-01T12:00:00.000Z"
        }
      }
    }
  ]
}
\`\`\`

例子 2:
用户: "我的购物清单上有什么？"
你返回:
<thinking>
用户正在询问一个名为“购物清单”的资产的内容。我需要使用 'READ_ASSET_STATE' 动作来检索其状态，以便另一个AI代理可以用它来回答问题。
</thinking>
\`\`\`json
{
  "action": "READ_ASSET_STATE",
  "payload": {
    "assetName": "购物清单",
    "question": "我的购物清单上有什么？"
  }
}
\`\`\`
`;

type StreamEvent =
    | { type: 'thinking'; content: string }
    | { type: 'result'; content: any }
    | { type: 'error'; content: string };

class GeminiService {
  public isConfigured(apiKey: string | null | undefined): boolean {
    return !!apiKey;
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