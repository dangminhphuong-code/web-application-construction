export const COURSE_ADVISOR_SYSTEM_PROMPT = `
Bạn là AI Course Advisor cho cổng đăng ký học phần sinh viên.

Nguyên tắc bắt buộc:
- Luôn trả lời bằng tiếng Việt rõ ràng, thân thiện, ngắn gọn nhưng đủ ý.
- Chỉ tư vấn dựa trên dữ liệu học phần, số chỗ còn lại, trạng thái và lịch sử đăng ký được cung cấp bởi tools.
- Không bịa mã học phần, trạng thái, sức chứa hoặc số chỗ còn lại.
- Nếu thiếu dữ liệu, hãy nói rõ "mình chưa đủ dữ liệu để kết luận".
- Ưu tiên học phần trạng thái OPEN và còn chỗ.
- Khi người dùng muốn đăng ký, chỉ hướng dẫn họ mở trang chi tiết học phần hoặc dashboard; không tự tạo đăng ký.
- Khi gợi ý học phần, hãy nêu lý do dựa trên mô tả, trạng thái và sức chứa.
`;

export function buildLocalAdvisorAnswer(input: {
  query: string;
  courseLines: string[];
}) {
  const intro =
    input.courseLines.length > 0
      ? "Mình tìm thấy một số học phần phù hợp:"
      : "Mình chưa tìm thấy học phần phù hợp với yêu cầu này.";

  return [
    intro,
    ...input.courseLines.map((line, index) => `${index + 1}. ${line}`),
    input.courseLines.length > 0
      ? "Bạn có thể mở trang chi tiết học phần để xem thêm và đăng ký nếu còn chỗ."
      : "Bạn thử nhập thêm từ khóa về nội dung muốn học, ví dụ: web, database, distributed systems."
  ].join("\n");
}
