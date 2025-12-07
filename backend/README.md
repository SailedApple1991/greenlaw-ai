# GreenLaw AI Backend

FastAPI 后端服务，用于连接 RAGFlow API 提供 RAG 增强的聊天功能。

## 功能

- ✅ 连接 RAGFlow OpenAI 兼容 API
- ✅ 支持流式和非流式响应
- ✅ 自动解析引用和引用格式
- ✅ CORS 支持，可与 Next.js 前端集成

## 安装

1. 安装 Python 依赖：

```bash
pip install -r requirements.txt
```

或者使用虚拟环境：

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## 配置

1. 复制环境变量示例文件：

```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，填入你的 RAGFlow 配置：

```env
RAGFLOW_API_KEY=your_ragflow_api_key_here
RAGFLOW_BASE_URL=http://localhost:9380
RAGFLOW_CHAT_ID=your_chat_assistant_id_here
PORT=8000
```

### 如何获取 RAGFlow 配置

1. **RAGFLOW_API_KEY**: 在 RAGFlow 界面中创建 API Key
2. **RAGFLOW_BASE_URL**: RAGFlow 服务器地址，默认是 `http://localhost:9380`
3. **RAGFLOW_CHAT_ID**: 
   - 在 RAGFlow 中创建一个 Chat Assistant
   - 获取 Chat Assistant 的 ID
   - 或者使用 Agent 的 ID（如果使用 Agent 模式）

## 运行

```bash
# 开发模式（自动重载）
uvicorn main:app --reload --port 8000

# 或者直接运行
python main.py
```

服务将在 `http://localhost:8000` 启动。

## API 端点

### `GET /`
健康检查端点

### `POST /api/chat`
聊天端点

**请求体：**
```json
{
  "message": "用户的问题",
  "stream": false,
  "reference": true
}
```

**响应：**
```json
{
  "id": "response_id",
  "role": "assistant",
  "content": "AI 回复内容（包含 HTML 格式的引用）",
  "references": [
    {
      "text": "引用名称",
      "tooltip": "完整的引用文本"
    }
  ],
  "citation": "引用文本"
}
```

## 与 Next.js 前端集成

修改 Next.js 的 `app/api/chat/route.ts`，将请求转发到 FastAPI 后端：

```typescript
const response = await fetch('http://localhost:8000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message })
});
```

## 故障排除

1. **连接错误**: 检查 RAGFlow 服务是否运行，以及 `RAGFLOW_BASE_URL` 是否正确
2. **认证错误**: 确认 `RAGFLOW_API_KEY` 有效
3. **Chat ID 错误**: 确认 `RAGFLOW_CHAT_ID` 是有效的 Chat Assistant 或 Agent ID

## 参考文档

- [RAGFlow Python API 文档](https://ragflow.io/docs/dev/python_api_reference)
- [FastAPI 文档](https://fastapi.tiangolo.com/)








