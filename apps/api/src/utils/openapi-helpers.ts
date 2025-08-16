/** biome-ignore-all lint/suspicious/noExplicitAny: Required */
import { type Hook, z } from "@hono/zod-openapi";

import { errorResponse } from "@/utils/api-response";
import HttpStatusCodes from "./http-status-codes";

/**
 * Hook to handle validation errors in OpenAPI routes.
 */
export const validationErrorHandler: Hook<any, any, any, any> = (result, c) => {
  if (!result.success) {
    const fields: Record<string, string> = {};
    let details = "";

    result.error.issues.forEach((issue, index) => {
      const fieldPath = issue.path.join(".");
      fields[fieldPath] = issue.message;

      if (index === 0) {
        details = `${fieldPath}: ${issue.message}`;
      }
    });

    return c.json(
      errorResponse("INVALID_DATA", details, fields),
      HttpStatusCodes.UNPROCESSABLE_ENTITY,
    );
  }
};

/**
 * Helper function to create a UUID parameter schema for OpenAPI path parameters.
 */
export const createIdUUIDParamsSchema = (description: string) => {
  return z.object({
    id: z.uuid().openapi({
      param: {
        name: "id",
        in: "path",
        required: true,
      },
      required: ["id"],
      example: "123e4567-e89b-12d3-a456-426614174000",
      description,
    }),
  });
};

/**
 * Helper function to create a success schema for OpenAPI responses.
 */
export const createSuccessSchema = <T extends z.ZodType>(schema: T) => {
  return z.object({
    status: z.enum(["success"]).default("success"),
    details: z.string(),
    data: schema,
  });
};

/**
 * Helper function to create an error schema for OpenAPI responses.
 */
export const createErrorSchema = () => {
  return z.object({
    status: z.enum(["error"]).default("error").openapi({ example: "error" }),
    error: z.object({
      code: z.string(),
      details: z.string(),
      fields: z.record(z.string(), z.string()),
    }),
  });
};

// Common examples - just the data, not the whole response structure
export const examples = {
  note: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    title: "Sample note",
    content: "This is sample note content.",
    createdAt: "2025-08-11T18:26:20.296Z",
    updatedAt: "2025-08-11T18:26:20.296Z",
  },
  validationErrors: {
    title: "Too small: expected string to have >=1 characters",
    content: "Too small: expected string to have >=1 characters",
  },
};

// Helper function for creating success response content
export const successContent = (p: {
  description: string;
  schema: z.ZodType;
  resObj: {
    details: string;
    data: any;
  };
}) => ({
  description: p.description,
  content: {
    "application/json": {
      schema: createSuccessSchema(p.schema),
      examples: {
        success: {
          summary: "Success",
          value: {
            status: "success",
            details: p.resObj.details,
            data: p.resObj.data,
          },
        },
      },
    },
  },
});

// Helper function for creating error response content
export const errorContent = (p: {
  description: string;
  examples: Record<
    string,
    {
      summary: string;
      code: string;
      details: string;
      fields?: Record<string, string>;
    }
  >;
}) => ({
  description: p.description,
  content: {
    "application/json": {
      schema: createErrorSchema(),
      examples: Object.fromEntries(
        Object.entries(p.examples).map(([key, example]) => [
          key,
          {
            summary: example.summary,
            value: {
              status: "error",
              error: {
                code: example.code,
                details: example.details,
                fields: example.fields || {},
              },
            },
          },
        ]),
      ),
    },
  },
});

// Helper function for creating syntax error response content
export const syntaxErrorContent = () => ({
  description: "Syntax error",
  content: {
    "application/json": {
      schema: createErrorSchema(),
      examples: {
        error: {
          summary: "Syntax error",
          value: {
            status: "error",
            error: {
              code: "BAD_REQUEST",
              details: "Malformed JSON in request body",
              fields: {},
            },
          },
        },
      },
    },
  },
});

// Helper function for creating server error response content
export const serverErrorContent = () => ({
  description: "Server error",
  content: {
    "application/json": {
      schema: createErrorSchema(),
      examples: {
        error: {
          summary: "Server error",
          value: {
            status: "error",
            error: {
              code: "SERVER_ERROR",
              details: "An unexpected error occurred",
              fields: {},
            },
          },
        },
      },
    },
  },
});
