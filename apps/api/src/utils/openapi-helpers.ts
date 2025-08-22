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
      HttpStatusCodes.BAD_REQUEST,
    );
  }
};

/**
 * Helper function to create a UUID parameter schema for OpenAPI path parameters.
 */
export const createIdUUIDParamsSchema = (description: string, name = "id") => {
  return z.object({
    [name]: z.uuid().openapi({
      param: {
        name: name,
        in: "path",
        required: true,
      },
      required: [name],
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

/**
 * Helper function for creating success response content
 */
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

/**
 * Helper function for creating error response content
 */
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

/**
 * Helper function for creating generic error response content
 */
export const genericErrorContent = (
  code: string,
  desc: string,
  details?: string,
) => ({
  description: desc,
  content: {
    "application/json": {
      schema: createErrorSchema(),
      examples: {
        error: {
          summary: desc,
          value: {
            status: "error",
            error: {
              code,
              details: details || "string",
              fields: {},
            },
          },
        },
      },
    },
  },
});

/**
 * Helper function for creating server error response content
 */
export const serverErrorContent = () => ({
  description: "Internal server error",
  content: {
    "application/json": {
      schema: createErrorSchema(),
      examples: {
        error: {
          summary: "Internal server error",
          value: {
            status: "error",
            error: {
              code: "INTERNAL_SERVER_ERROR",
              details: "An unexpected error occurred",
              fields: {},
            },
          },
        },
      },
    },
  },
});

/**
 * Helper function for getting error details from error fields
 */
export const getErrDetailsFromErrFields = (fields: Record<string, string>) => {
  return `${Object.keys(fields)[0]}: ${Object.values(fields)[0]}`;
};

/**
 * Helper function to create an authentication header schema for OpenAPI.
 */
export const createAuthHeaderSchema = () =>
  z.object({
    Authorization: z.string().openapi({
      param: {
        name: "Authorization",
        in: "header",
        required: true,
        description: "Bearer token for authentication",
      },
    }),
  });
