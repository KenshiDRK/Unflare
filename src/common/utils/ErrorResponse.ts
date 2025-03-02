export default class ErrorResponse {
    private constructor(public readonly code: string, public readonly message: string | object) {}

    static create(code: string, message: string | object): ErrorResponse {
        return new ErrorResponse(code, message);
    }
}
