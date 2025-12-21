/**
 * Error codes for the application
 * Format: MODULE_ACTION_ERROR
 * Example: AUTH_OTP_INVALID_OR_EXPIRED
 */
export enum ErrorCode {
  // Auth errors (AUTH_*)
  AUTH_OTP_INVALID_OR_EXPIRED = 'AUTH_OTP_INVALID_OR_EXPIRED',
  AUTH_OTP_VERIFY_FAILED = 'AUTH_OTP_VERIFY_FAILED',
  AUTH_TOKEN_INVALID_OR_EXPIRED = 'AUTH_TOKEN_INVALID_OR_EXPIRED',

  // SMS errors (SMS_*)
  SMS_INVALID_PHONE_NUMBER = 'SMS_INVALID_PHONE_NUMBER',
  SMS_INVALID_DATA = 'SMS_INVALID_DATA',
  SMS_SEND_FAILED = 'SMS_SEND_FAILED',

  // Rate limiting errors (RATE_LIMIT_*)
  RATE_LIMIT_TOO_MANY_REQUESTS = 'RATE_LIMIT_TOO_MANY_REQUESTS',

  // Validation errors (VALIDATION_*)
  VALIDATION_INVALID_INPUT = 'VALIDATION_INVALID_INPUT',

  // Generic errors (GENERIC_*)
  GENERIC_INTERNAL_SERVER_ERROR = 'GENERIC_INTERNAL_SERVER_ERROR',
  GENERIC_NOT_FOUND = 'GENERIC_NOT_FOUND',
  GENERIC_UNAUTHORIZED = 'GENERIC_UNAUTHORIZED',
  GENERIC_FORBIDDEN = 'GENERIC_FORBIDDEN',

  // Property errors (PROPERTY_*)
  PROPERTY_IN_USE = 'PROPERTY_IN_USE',

  // Room Template errors (TEMPLATE_*)
  TEMPLATE_IN_USE = 'TEMPLATE_IN_USE',

  // Room errors (ROOM_*)
  ROOM_IN_USE = 'ROOM_IN_USE',

  // Tenant errors (TENANT_*)
  TENANT_HAS_CONTRACT_HISTORY = 'TENANT_HAS_CONTRACT_HISTORY',
  TENANT_PHONE_DUPLICATE = 'TENANT_PHONE_DUPLICATE',
  TENANT_DOCUMENT_DUPLICATE = 'TENANT_DOCUMENT_DUPLICATE',
}

/**
 * Error messages mapping
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.AUTH_OTP_INVALID_OR_EXPIRED]: 'Mã OTP không hợp lệ hoặc đã hết hạn',
  [ErrorCode.AUTH_OTP_VERIFY_FAILED]: 'Xác thực OTP thất bại',
  [ErrorCode.AUTH_TOKEN_INVALID_OR_EXPIRED]: 'Token không hợp lệ hoặc đã hết hạn',

  [ErrorCode.SMS_INVALID_PHONE_NUMBER]: 'Số điện thoại không hợp lệ',
  [ErrorCode.SMS_INVALID_DATA]: 'Dữ liệu không hợp lệ để gửi SMS',
  [ErrorCode.SMS_SEND_FAILED]: 'Gửi SMS thất bại',

  [ErrorCode.RATE_LIMIT_TOO_MANY_REQUESTS]: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
  [ErrorCode.VALIDATION_INVALID_INPUT]: 'Dữ liệu đầu vào không hợp lệ',

  [ErrorCode.GENERIC_INTERNAL_SERVER_ERROR]: 'Lỗi máy chủ nội bộ',
  [ErrorCode.GENERIC_NOT_FOUND]: 'Không tìm thấy',
  [ErrorCode.GENERIC_UNAUTHORIZED]: 'Không được phép truy cập',
  [ErrorCode.GENERIC_FORBIDDEN]: 'Bị cấm truy cập',

  [ErrorCode.PROPERTY_IN_USE]: 'Tài sản đang được sử dụng (có phòng hoặc hợp đồng)',

  [ErrorCode.TEMPLATE_IN_USE]: 'Template đang được sử dụng (có phòng hoặc hợp đồng)',

  [ErrorCode.ROOM_IN_USE]: 'Phòng đang được sử dụng (có hợp đồng)',

  [ErrorCode.TENANT_HAS_CONTRACT_HISTORY]: 'Không thể xóa tenant đã có lịch sử hợp đồng',

  [ErrorCode.TENANT_PHONE_DUPLICATE]: 'Số điện thoại đã tồn tại trong hệ thống',
  [ErrorCode.TENANT_DOCUMENT_DUPLICATE]: 'Số giấy tờ đã tồn tại trong hệ thống',
};
