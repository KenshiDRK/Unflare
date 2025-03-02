import ErrorResponse from "@/common/utils/ErrorResponse";
import { handleFailureResponse } from "@/common/utils/httpHandlers";
import type { z } from "zod";
import { Response } from "express";

export default function handleValidationError(error: z.ZodError, res: Response) {
    return handleFailureResponse(
        ErrorResponse.create(
            "invalid.request.body",
            error.errors.map((err) => ({
                path: err.path.join("."),
                message: err.message,
                code: err.code,
            }))
        ),
        res
    );
}