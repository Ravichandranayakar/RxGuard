from fastapi import Request, status
from fastapi.responses import JSONResponse

class RxGuardException(Exception):
    def __init__(self, code: str, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)

class AuthenticationError(RxGuardException):
    def __init__(self, message: str = "Authentication failed"):
        super().__init__("UNAUTHENTICATED", message, status.HTTP_401_UNAUTHORIZED)

class AuthorizationError(RxGuardException):
    def __init__(self, message: str = "Permission denied for this resource"):
        super().__init__("FORBIDDEN", message, status.HTTP_403_FORBIDDEN)

class NotFoundError(RxGuardException):
    def __init__(self, message: str = "Resource not found"):
        super().__init__("NOT_FOUND", message, status.HTTP_404_NOT_FOUND)

class TamperingDetectedError(RxGuardException):
    def __init__(self, message: str = "Cryptographic integrity failure: Payload hash or signature does not match"):
        super().__init__("PRESCRIPTION_TAMPERED", message, status.HTTP_409_CONFLICT)

class ConcurrencyConflictError(RxGuardException):
    def __init__(self, message: str = "Concurrent operation detected or quantity already exhausted"):
        super().__init__("CONCURRENCY_CONFLICT", message, status.HTTP_409_CONFLICT)

class BlockchainError(RxGuardException):
    def __init__(self, message: str = "Hyperledger Fabric network error or endorsement failure"):
        super().__init__("BLOCKCHAIN_ERROR", message, status.HTTP_503_SERVICE_UNAVAILABLE)

async def rxguard_exception_handler(request: Request, exc: RxGuardException):
    request_id = getattr(request.state, "request_id", "req-unknown")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": false,
            "error": {
                "code": exc.code,
                "message": exc.message,
                "request_id": request_id
            }
        }
    )
