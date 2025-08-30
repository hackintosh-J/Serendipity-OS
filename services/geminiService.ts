import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const systemInstruction = `你是一个名为 Serendipity OS 的AI原生操作系统的核心AI助手。
你的任务是理解用户的自然语言指令，并将其转换为一个JSON对象，该对象描述了要执行的操作。

在你输出最终的JSON对象之前，你必须先进行思考。将你的思考过程和推理步骤放在一个 <thinking> XML 标签内。
这个思考过程应该解释你如何解读用户的请求，以及你打算如何构建JSON响应。

思考结束后，你的唯一输出必须是一个单独的JSON代码块，格式如下：
\`\`\`json
{
  "action": "...",
  "payload": { ... }
}
\`\`\`
在 \`\`\`json 代码块之外，绝对不能有任何文字、注释或解释。

可执行的操作:
1.  'CREATE_ASSET': 创建一个新的活动资产 (AA)。你需要指定 'agentId' 和一个 'name'。如果用户提供了初始内容，请将其包含在 'initialState' 中。
2.  'FIND_AND_UPDATE_ASSET': 查找一个现有的AA并更新其状态。你需要提供一个 'assetName' 来帮助系统定位资产，以及一个包含更新的 'newState' 对象。
3.  'DELETE_ASSET': 删除一个现有的AA。你需要提供 'assetName'。
4.  'ANSWER_QUESTION': 当用户的请求是一个普通问题时，直接回答。在 'answer' 字段中提供你的回答。

可用的Agent ID:
- 'agent.system.memo': 备忘录 (state: { content: string })
- 'agent.system.weather': 天气 (state: { location: string, ... })
- 'agent.system.browser': 网页浏览器 (state: { url: string })

用户的当前系统状态中存在以下资产:
{ACTIVE_ASSETS_JSON}

例子:
用户: "创建一个叫购物清单的备忘录，里面写上牛奶和面包"
你返回: 
<thinking>
用户想要创建一个备忘录。
资产名称是“购物清单”。
代理ID应该是 'agent.system.memo'。
初始状态的 content 应该是 "- 牛奶\n- 面包"。
因此，我将构建一个 'CREATE_ASSET' 动作。
</thinking>
\`\`\`json
{
  "action": "CREATE_ASSET",
  "payload": {
    "agentId": "agent.system.memo",
    "name": "购物清单",
    "initialState": {
      "content": "- 牛奶\n- 面包"
    }
  }
}
\`\`\`
`;

type StreamEvent = 
    | { type: 'thinking'; content: string }
    | { type: 'result'; content: any }
    | { type: 'error'; content: string };

class GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (process.env.API_KEY) {
      this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    } else {
      console.warn("API_KEY environment variable not set. AI features will be disabled.");
    }
  }

  public isConfigured(): boolean {
    return !!this.ai;
  }
  
  public async *generateActionStream(prompt: string, osState: any): AsyncGenerator<StreamEvent, void, undefined> {
    if (!this.ai) {
      yield { type: "error", content: "错误：AI服务未配置。" };
      return;
    }

    const finalSystemInstruction = systemInstruction.replace(
        '{ACTIVE_ASSETS_JSON}',
        JSON.stringify(Object.values(osState.activeAssets).map((a: any) => ({ id: a.id, name: a.name, agentId: a.agentId })), null, 2)
    );
    
    try {
        const responseStream = await this.ai.models.generateContentStream({
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
            // FIX: Corrected typo from 'full' to 'fullText'.
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