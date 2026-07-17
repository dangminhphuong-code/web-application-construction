# Week 09 - AI Course Advisor

Tuần 9 mở rộng project tuần 8 bằng chức năng AI cho cổng đăng ký học phần.

## Tính năng đã thêm

- Trang `AI Course Advisor` trong dashboard sinh viên tại `/dashboard/ai-advisor`.
- API streaming chat tại `/api/ai/course-advisor`.
- Tư vấn học phần bằng tiếng Việt dựa trên dữ liệu thật từ GraphQL backend.
- Tool read-only cho AI:
  - Tìm học phần bằng RAG/semantic search.
  - Xem chi tiết học phần.
  - Xem học phần phổ biến.
  - Xem học phần đã đăng ký của sinh viên hiện tại.
- RAG course search dùng embedding GitHub Models khi có token, và tự fallback sang keyword search khi chưa cấu hình token.
- MCP server `course-portal` cung cấp tool read-only `search_courses` và `get_course_detail`.

## Cấu hình AI

Sao chép `next/.env.example` thành `next/.env.local`, rồi điền token nếu muốn dùng GitHub Models:

```env
GITHUB_MODELS_TOKEN=your_github_models_token
GITHUB_MODELS_CHAT_MODEL=openai/gpt-4o-mini
GITHUB_MODELS_EMBEDDING_MODEL=openai/text-embedding-3-small
```

Nếu chưa có `GITHUB_MODELS_TOKEN`, trang AI vẫn chạy ở chế độ fallback keyword search.

## Chạy frontend

Trước khi mở trang AI với dữ liệu thật, chạy backend:

```powershell
cd "D:\Web Application Construction\week-09"
docker compose up -d --build
```

Sau đó chạy Next.js:

```powershell
cd "D:\Web Application Construction\week-09\next"
npm install
npm run dev
```

Mở `http://localhost:3000/dashboard/ai-advisor`.

## Chạy MCP server

```powershell
cd "D:\Web Application Construction\week-09\course-portal"
npm install
npm run build
$env:BACKEND_GRAPHQL_URL="http://localhost:4000/graphql"
npm start
```

Ví dụ cấu hình MCP client:

```json
{
  "mcpServers": {
    "course-portal": {
      "command": "node",
      "args": [
        "D:/Web Application Construction/week-09/course-portal/build/index.js"
      ],
      "env": {
        "BACKEND_GRAPHQL_URL": "http://localhost:4000/graphql"
      }
    }
  }
}
```
