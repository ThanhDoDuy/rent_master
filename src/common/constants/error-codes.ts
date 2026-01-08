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
  AUTH_EMAIL_ALREADY_EXISTS = 'AUTH_EMAIL_ALREADY_EXISTS',
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_USER_NOT_FOUND = 'AUTH_USER_NOT_FOUND',
  AUTH_OLD_PASSWORD_INCORRECT = 'AUTH_OLD_PASSWORD_INCORRECT',
  AUTH_ADMIN_KEY_INVALID = 'AUTH_ADMIN_KEY_INVALID',

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
  ROOM_NAME_DUPLICATE = 'ROOM_NAME_DUPLICATE',
  ROOM_OCCUPANT_ALREADY_EXISTS = 'ROOM_OCCUPANT_ALREADY_EXISTS',

  // Tenant errors (TENANT_*)
  TENANT_HAS_CONTRACT_HISTORY = 'TENANT_HAS_CONTRACT_HISTORY',
  TENANT_PHONE_DUPLICATE = 'TENANT_PHONE_DUPLICATE',
  TENANT_DOCUMENT_DUPLICATE = 'TENANT_DOCUMENT_DUPLICATE',
  TENANT_ALREADY_HAS_ROOM = 'TENANT_ALREADY_HAS_ROOM',

  // Contract errors (CONTRACT_*)
  CONTRACT_ROOM_ALREADY_ACTIVE = 'CONTRACT_ROOM_ALREADY_ACTIVE',
  CONTRACT_ROOM_HAS_CONTRACT = 'CONTRACT_ROOM_HAS_CONTRACT',
  CONTRACT_INVALID_DATES = 'CONTRACT_INVALID_DATES',
  CONTRACT_TENANT_ALREADY_LINKED = 'CONTRACT_TENANT_ALREADY_LINKED',
  CONTRACT_PRIMARY_EXISTS = 'CONTRACT_PRIMARY_EXISTS',
  CONTRACT_CANNOT_REMOVE_PRIMARY = 'CONTRACT_CANNOT_REMOVE_PRIMARY',
  CONTRACT_INVALID_STATUS = 'CONTRACT_INVALID_STATUS',
  CONTRACT_NO_PRIMARY_TENANT = 'CONTRACT_NO_PRIMARY_TENANT',
  CONTRACT_INITIAL_METER_READINGS_REQUIRED = 'CONTRACT_INITIAL_METER_READINGS_REQUIRED',
  CONTRACT_INITIAL_METER_READINGS_INCOMPLETE = 'CONTRACT_INITIAL_METER_READINGS_INCOMPLETE',

  // Invoice errors (INVOICE_*)
  INVOICE_NOT_DRAFT = 'INVOICE_NOT_DRAFT',
  INVOICE_INVALID_METER_READING = 'INVOICE_INVALID_METER_READING',
  INVOICE_METER_READING_REQUIRED = 'INVOICE_METER_READING_REQUIRED',
  INVOICE_CANNOT_VOID = 'INVOICE_CANNOT_VOID',
  INVOICE_NOT_PAYABLE = 'INVOICE_NOT_PAYABLE',
  INVOICE_ALREADY_PAID = 'INVOICE_ALREADY_PAID',

  // Payment errors (PAYMENT_*)
  PAYMENT_INVALID_AMOUNT = 'PAYMENT_INVALID_AMOUNT',
  PAYMENT_AMOUNT_EXCEEDS_REMAINING = 'PAYMENT_AMOUNT_EXCEEDS_REMAINING',
}

/**
 * Error messages mapping
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.AUTH_OTP_INVALID_OR_EXPIRED]: 'Mã OTP không hợp lệ hoặc đã hết hạn',
  [ErrorCode.AUTH_OTP_VERIFY_FAILED]: 'Xác thực OTP thất bại',
  [ErrorCode.AUTH_TOKEN_INVALID_OR_EXPIRED]: 'Token không hợp lệ hoặc đã hết hạn',
  [ErrorCode.AUTH_EMAIL_ALREADY_EXISTS]: 'Email đã tồn tại trong hệ thống',
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: 'Email hoặc mật khẩu không đúng',
  [ErrorCode.AUTH_USER_NOT_FOUND]: 'Người dùng không tồn tại',
  [ErrorCode.AUTH_OLD_PASSWORD_INCORRECT]: 'Mật khẩu cũ không đúng',
  [ErrorCode.AUTH_ADMIN_KEY_INVALID]: 'Admin key không hợp lệ',

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
  [ErrorCode.ROOM_NAME_DUPLICATE]: 'Tên phòng đã tồn tại trong dãy trọ này. Vui lòng xóa phòng cũ trước khi tạo mới.',
  [ErrorCode.ROOM_OCCUPANT_ALREADY_EXISTS]: 'Người này đã có trong danh sách người trọ chung',

  [ErrorCode.TENANT_HAS_CONTRACT_HISTORY]: 'Không thể xóa tenant đã có lịch sử hợp đồng',
  [ErrorCode.TENANT_PHONE_DUPLICATE]: 'Số điện thoại đã tồn tại trong hệ thống',
  [ErrorCode.TENANT_DOCUMENT_DUPLICATE]: 'Số giấy tờ đã tồn tại trong hệ thống',
  [ErrorCode.TENANT_ALREADY_HAS_ROOM]: 'Người thuê này đã có phòng. Vui lòng xóa phòng hiện tại trước khi thêm vào phòng mới',

  [ErrorCode.CONTRACT_ROOM_ALREADY_ACTIVE]: 'Phòng đã có hợp đồng đang hoạt động',
  [ErrorCode.CONTRACT_ROOM_HAS_CONTRACT]: 'Phòng đã có hợp đồng. Vui lòng hoàn tất hoặc hủy hợp đồng hiện tại trước khi tạo mới',
  [ErrorCode.CONTRACT_INVALID_DATES]: 'Ngày bắt đầu phải trước ngày kết thúc',
  [ErrorCode.CONTRACT_TENANT_ALREADY_LINKED]: 'Tenant đã được thêm vào hợp đồng',
  [ErrorCode.CONTRACT_PRIMARY_EXISTS]: 'Hợp đồng đã có PRIMARY tenant',
  [ErrorCode.CONTRACT_CANNOT_REMOVE_PRIMARY]: 'Không thể xóa PRIMARY tenant khi hợp đồng đang ACTIVE',
  [ErrorCode.CONTRACT_INVALID_STATUS]: 'Trạng thái hợp đồng không hợp lệ cho thao tác này',
  [ErrorCode.CONTRACT_NO_PRIMARY_TENANT]: 'Hợp đồng phải có PRIMARY tenant trước khi kích hoạt',
  [ErrorCode.CONTRACT_INITIAL_METER_READINGS_REQUIRED]: 'Phòng có dịch vụ METERED, cần nhập chỉ số đồng hồ ban đầu',
  [ErrorCode.CONTRACT_INITIAL_METER_READINGS_INCOMPLETE]: 'Thiếu chỉ số đồng hồ ban đầu cho một số dịch vụ METERED',

  [ErrorCode.INVOICE_NOT_DRAFT]: 'Invoice không ở trạng thái DRAFT',
  [ErrorCode.INVOICE_INVALID_METER_READING]: 'Chỉ số đồng hồ không hợp lệ (phải >= chỉ số cũ)',
  [ErrorCode.INVOICE_METER_READING_REQUIRED]: 'Cần nhập chỉ số đồng hồ cho các dịch vụ METERED',
  [ErrorCode.INVOICE_CANNOT_VOID]: 'Không thể hủy invoice đã ISSUED hoặc PAID',
  [ErrorCode.INVOICE_NOT_PAYABLE]: 'Invoice không thể nhận thanh toán (phải ở trạng thái ISSUED hoặc PARTIALLY_PAID)',
  [ErrorCode.INVOICE_ALREADY_PAID]: 'Invoice đã được thanh toán đủ, không thể tạo payment thêm',
  
  [ErrorCode.PAYMENT_INVALID_AMOUNT]: 'Số tiền thanh toán phải lớn hơn 0',
  [ErrorCode.PAYMENT_AMOUNT_EXCEEDS_REMAINING]: 'Số tiền thanh toán vượt quá số tiền còn lại của invoice',
};
