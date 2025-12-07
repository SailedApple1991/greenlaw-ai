# 环境变量配置指南

本文档说明如何配置前后端的环境变量。

## 架构说明

```
前端 (Next.js)         后端 (FastAPI)         外部服务
┌──────────┐          ┌──────────┐          ┌──────────┐
│ .env.local│          │ .env     │          │ RAGFlow  │
│          │          │          │          │          │
│ USE_FASTAPI│────────►│ RAGFLOW_ │────────►│ API      │
│ _BACKEND  │          │ API_KEY  │          │          │
│          │          │          │          │          │
│ FASTAPI_ │          │ RAGFLOW_ │          │          │
│ BACKEND_ │          │ BASE_URL │          │          │
│ URL      │          │          │          │          │
│          │          │ RAGFLOW_ │          │          │
│ GOOGLE_  │          │ CHAT_ID  │          │          │
│ API_KEY  │          │          │          │          │
│ (fallback)│         │ PORT     │          │          │
└──────────┘          └──────────┘          └──────────┘
```

## 前端环境变量配置

**文件位置：** `.env.local`（项目根目录）

### 必需变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `USE_FASTAPI_BACKEND` | 是否使用 FastAPI 后端 | `true` 或 `false` |
| `FASTAPI_BACKEND_URL` | FastAPI 后端地址 | `http://localhost:8000` |

### 可选变量

| 变量名 | 说明 | 何时需要 |
|--------|------|----------|
| `GOOGLE_API_KEY` | Google Gemini API Key | 当 `USE_FASTAPI_BACKEND=false` 或作为 fallback 时 |

### 配置步骤

1. 复制示例文件：
   ```bash
   cp .env.local.example .env.local
   ```

2. 编辑 `.env.local`：
   ```env
   USE_FASTAPI_BACKEND=true
   FASTAPI_BACKEND_URL=http://localhost:8000
   GOOGLE_API_KEY=your_gemini_api_key_here  # 可选
   ```

## 后端环境变量配置

**文件位置：** `backend/.env`

### 必需变量

| 变量名 | 说明 | 如何获取 |
|--------|------|----------|
| `RAGFLOW_API_KEY` | RAGFlow API Key | 在 RAGFlow 界面创建 API Key |
| `RAGFLOW_BASE_URL` | RAGFlow 服务器地址 | 通常是 `http://localhost:9380` |
| `RAGFLOW_CHAT_ID` 或 `RAGFLOW_AGENT_ID` | Chat Assistant ID 或 Agent ID | **二选一**：在 RAGFlow 中创建 Chat Assistant 或 Agent 后获取 |

**注意**: 你需要设置 `RAGFLOW_CHAT_ID` **或** `RAGFLOW_AGENT_ID`（二选一），不需要两个都设置。
- **Chat Assistant 模式**（推荐简单场景）: 使用 `RAGFLOW_CHAT_ID`
- **Agent 模式**（复杂工作流）: 使用 `RAGFLOW_AGENT_ID`

详见 [RAGFLOW_CHAT_ID_EXPLAINED.md](./RAGFLOW_CHAT_ID_EXPLAINED.md)

### 可选变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PORT` | FastAPI 服务端口 | `8000` |

### 配置步骤

1. 进入后端目录：
   ```bash
   cd backend
   ```

2. 复制示例文件：
   ```bash
   cp env.example .env
   ```

3. 编辑 `.env`（选择一种模式）：

   **选项 1: Chat Assistant 模式（推荐）**
   ```env
   RAGFLOW_API_KEY=your_ragflow_api_key_here
   RAGFLOW_BASE_URL=http://localhost:9380
   RAGFLOW_CHAT_ID=your_chat_assistant_id_here
   PORT=8000
   ```

   **选项 2: Agent 模式**
   ```env
   RAGFLOW_API_KEY=your_ragflow_api_key_here
   RAGFLOW_BASE_URL=http://localhost:9380
   RAGFLOW_AGENT_ID=your_agent_id_here
   PORT=8000
   ```

## 配置模式

### 模式 1：使用 FastAPI + RAGFlow（推荐）

**前端 `.env.local`：**
```env
USE_FASTAPI_BACKEND=true
FASTAPI_BACKEND_URL=http://localhost:8000
```

**后端 `backend/.env`：**
```env
RAGFLOW_API_KEY=your_ragflow_api_key
RAGFLOW_BASE_URL=http://localhost:9380
RAGFLOW_CHAT_ID=your_chat_id
```

**优势：**
- ✅ RAG 增强，基于文档库回答
- ✅ 支持引用和来源追踪
- ✅ 更好的法律文档检索

### 模式 2：直接使用 Gemini API

**前端 `.env.local`：**
```env
USE_FASTAPI_BACKEND=false
GOOGLE_API_KEY=your_gemini_api_key
```

**后端：** 不需要运行

**优势：**
- ✅ 简单快速
- ✅ 不需要 RAGFlow 服务
- ❌ 没有 RAG 能力

## 环境变量优先级

前端 API 路由的调用逻辑：

1. 如果 `USE_FASTAPI_BACKEND=true`：
   - 尝试调用 FastAPI 后端
   - 如果失败，fallback 到 Gemini API（如果配置了）

2. 如果 `USE_FASTAPI_BACKEND=false` 或未设置：
   - 直接使用 Gemini API
   - 需要 `GOOGLE_API_KEY`

## 验证配置

### 验证前端配置

```bash
# 检查环境变量是否加载
pnpm dev
# 访问 http://localhost:3000
# 查看浏览器控制台是否有错误
```

### 验证后端配置

```bash
cd backend
python -c "from dotenv import load_dotenv; import os; load_dotenv(); print('RAGFLOW_API_KEY:', '✓' if os.getenv('RAGFLOW_API_KEY') else '✗')"
```

### 验证 RAGFlow 连接

```bash
# 测试后端健康检查
curl http://localhost:8000/

# 应该返回：
# {"status":"ok","service":"GreenLaw AI Backend","ragflow_configured":true}
```

## 常见问题

### Q: 前后端的 env 文件需要统一吗？

**A:** 不需要。前后端有不同的职责：
- 前端只需要知道后端地址
- 后端需要知道 RAGFlow 的配置
- 它们可以独立配置和管理

### Q: 可以在一个文件中管理所有变量吗？

**A:** 不推荐。原因：
1. **安全性**：前后端可能部署在不同环境
2. **职责分离**：前端不需要知道 RAGFlow 的密钥
3. **灵活性**：可以独立切换后端服务

### Q: 生产环境如何配置？

**A:** 
- 使用环境变量注入（Docker、K8s、云平台）
- 不要将 `.env` 文件提交到代码库
- 使用密钥管理服务（AWS Secrets Manager、Azure Key Vault 等）

## 安全提示

⚠️ **重要：**
- 永远不要将 `.env` 或 `.env.local` 提交到 Git
- 使用 `.gitignore` 排除这些文件
- 生产环境使用环境变量注入，不要使用文件
- 定期轮换 API 密钥

