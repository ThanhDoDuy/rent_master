# Custom Error Code System

Hệ thống quản lý lỗi tùy chỉnh với error codes và messages cho ứng dụng RentMaster.

## Cấu trúc

### 1. Error Codes (`error-codes.ts`)
Định nghĩa các mã lỗi dưới dạng enum và mapping messages tương ứng.

**Format:** `MODULE_ACTION_ERROR`
**Ví dụ:** `AUTH_LOGIN_INVALID_CREDENTIALS`

### 2. Custom Exceptions (`app.exception.ts`)
Các exception classes mở rộng từ NestJS HttpException với error codes:

- `AppException` - Base class
- `AppBadRequestException` - 400 Bad Request
- `AppUnauthorizedException` - 401 Unauthorized
- `AppForbiddenException` - 403 Forbidden
- `AppNotFoundException` - 404 Not Found
- `AppConflictException` - 409 Conflict
- `AppInternalServerErrorException` - 500 Internal Server Error

### 3. Exception Filter (`http-exception.filter.ts`)
Global exception filter để format tất cả exceptions thành format chuẩn.

## Cách sử dụng

### Thêm Error Code mới

1. Thêm vào `ErrorCode` enum trong `error-codes.ts`:
```typescript
export enum ErrorCode {
  // ... existing codes
  YOUR_MODULE_YOUR_ERROR = 'YOUR_MODULE_YOUR_ERROR',
}
```

2. Thêm message tương ứng vào `ErrorMessages`:
```typescript
export const ErrorMessages: Record<ErrorCode, string> = {
  // ... existing messages
  [ErrorCode.YOUR_MODULE_YOUR_ERROR]: 'Thông báo lỗi của bạn',
};
```

### Throw Exception

```typescript
import { AppBadRequestException, AppUnauthorizedException } from '../common/exceptions';
import { ErrorCode } from '../common/constants/error-codes';

// Sử dụng message mặc định từ ErrorMessages
throw new AppUnauthorizedException(ErrorCode.AUTH_LOGIN_INVALID_CREDENTIALS);

// Hoặc override message tùy chỉnh
throw new AppBadRequestException(
  ErrorCode.AUTH_OTP_INVALID_OR_EXPIRED,
  'Mã OTP của bạn đã hết hạn, vui lòng yêu cầu mã mới'
);
```

## Response Format

Tất cả exceptions sẽ được format thành:

```json
{
  "statusCode": 401,
  "errorCode": "AUTH_LOGIN_INVALID_CREDENTIALS",
  "message": "Email hoặc mật khẩu không đúng",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/auth/login"
}
```

## Ví dụ trong AuthService

```typescript
// Invalid credentials
if (!tenant) {
  throw new AppUnauthorizedException(ErrorCode.AUTH_LOGIN_INVALID_CREDENTIALS);
}

// Account not verified
if (!is_verified) {
  throw new AppUnauthorizedException(ErrorCode.AUTH_LOGIN_ACCOUNT_NOT_VERIFIED);
}

// Email/Phone already exists
if (existingTenant) {
  throw new AppConflictException(ErrorCode.AUTH_REGISTER_EMAIL_OR_PHONE_EXISTS);
}
```
