export type GraphQLErrorItem = {
  message: string;
  extensions?: {
    code?: string;
    [key: string]: unknown;
  };
};

export class GraphQLClientError extends Error {
  public readonly errors: GraphQLErrorItem[];

  constructor(errors: GraphQLErrorItem[]) {
    super(errors[0]?.message || "GraphQL request failed");
    this.name = "GraphQLClientError";
    this.errors = errors;
  }

  get code() {
    return this.errors[0]?.extensions?.code;
  }
}

export function getReadableGraphQLError(error: unknown): string {
  if (error instanceof GraphQLClientError) {
    switch (error.code) {
      case "UNAUTHENTICATED":
        return "Bạn cần đăng nhập để thực hiện thao tác này.";
      case "FORBIDDEN":
        return "Bạn không có quyền thực hiện thao tác này.";
      case "NOT_FOUND":
        return "Không tìm thấy dữ liệu yêu cầu.";
      case "BAD_USER_INPUT":
        return "Dữ liệu nhập vào chưa hợp lệ.";
      case "ALREADY_EXISTS":
        return "Dữ liệu đã tồn tại.";
      case "FAILED_PRECONDITION":
        return "Không thể thực hiện thao tác vì điều kiện nghiệp vụ chưa thỏa.";
      case "SERVICE_UNAVAILABLE":
        return "Dịch vụ backend đang tạm thời không khả dụng.";
      case "SERVICE_TIMEOUT":
        return "Backend phản hồi quá lâu, vui lòng thử lại.";
      default:
        return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Đã xảy ra lỗi không xác định.";
}
