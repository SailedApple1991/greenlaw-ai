# 对话历史持久化功能

## 功能说明

GreenLaw AI 现在支持自动保存和恢复对话历史，让用户可以继续之前的对话。

## 实现方式

### 前端存储（localStorage）

- **存储位置**: 浏览器 localStorage
- **存储键**: `greenlaw_chat_history`
- **会话 ID**: `greenlaw_session_id`（用于标识会话）
- **自动保存**: 对话变化后 500ms 自动保存
- **自动加载**: 页面刷新后自动恢复对话

### 存储内容

```typescript
{
  version: "1.0",
  messages: Message[],
  lastUpdated: number,
  sessionId: string
}
```

## 功能特性

### ✅ 已实现

1. **自动保存对话**
   - 每次发送或接收消息后自动保存
   - 防抖处理，避免频繁写入

2. **自动恢复对话**
   - 刷新页面后自动加载上次对话
   - 如果没有保存的对话，显示默认欢迎消息

3. **清除对话功能**
   - Header 右上角有 "Clear" 按钮
   - 点击后清除所有对话历史和存储

4. **存储管理**
   - 最多保存 100 条消息（防止存储溢出）
   - 自动清理超过 30 天的旧对话
   - 存储空间不足时自动清理旧数据

5. **会话标识**
   - 每个浏览器会话有唯一 ID
   - 可用于追踪和调试

## 使用方法

### 用户操作

1. **继续对话**: 无需操作，刷新页面后自动恢复
2. **清除对话**: 点击 Header 右上角的 "Clear" 按钮
3. **查看存储**: 打开浏览器开发者工具 → Application → Local Storage

### 开发者 API

```typescript
import { 
  saveChatHistory, 
  loadChatHistory, 
  clearChatHistory,
  getSessionId,
  getStorageInfo 
} from "@/lib/chatStorage";

// 保存对话
saveChatHistory(messages);

// 加载对话
const messages = loadChatHistory();

// 清除对话
clearChatHistory();

// 获取会话 ID
const sessionId = getSessionId();

// 获取存储信息
const info = getStorageInfo();
```

### React Hook

```typescript
import { useChatHistory } from "@/lib/useChatHistory";

const { save, clear, load, getSessionInfo } = useChatHistory(
  messages,
  setMessages,
  { autoSave: true, autoLoad: true }
);
```

## 存储限制

- **最大消息数**: 100 条（自动截断）
- **保留时间**: 30 天（自动清理）
- **存储大小**: 通常 < 1MB（取决于消息长度）

## 浏览器兼容性

- ✅ Chrome/Edge (推荐)
- ✅ Firefox
- ✅ Safari
- ✅ 移动浏览器

## 未来扩展

### 可选：后端会话管理

如果需要跨设备同步或更强大的会话管理，可以添加后端支持：

1. **基于 Session ID**
   - 前端生成 session ID
   - 后端存储对话历史
   - 支持多设备同步

2. **基于 IP 地址**
   - 后端根据 IP 存储会话
   - 简单但不精确（NAT/代理问题）

3. **基于用户账户**
   - 需要用户登录
   - 最可靠的方案

### 实现示例（后端）

```python
# backend/routers/sessions.py
from fastapi import APIRouter, Request
from typing import Optional

router = APIRouter()

@router.get("/api/sessions/{session_id}")
async def get_session(session_id: str):
    # 从数据库/Redis 获取会话
    pass

@router.post("/api/sessions/{session_id}")
async def save_session(session_id: str, messages: list):
    # 保存会话到数据库/Redis
    pass
```

## 隐私和安全

- ✅ 数据仅存储在用户浏览器中
- ✅ 不会发送到服务器（除非使用后端会话管理）
- ✅ 用户可以随时清除
- ⚠️ 注意：localStorage 可以被同域的其他脚本访问

## 故障排除

### 对话没有保存

1. 检查浏览器是否支持 localStorage
2. 检查是否启用了隐私模式（可能禁用 localStorage）
3. 查看浏览器控制台是否有错误

### 存储空间不足

- 系统会自动清理旧数据
- 可以手动清除对话释放空间

### 跨设备同步

- 当前仅支持单设备
- 需要跨设备同步请使用后端会话管理








