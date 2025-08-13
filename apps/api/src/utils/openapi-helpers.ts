import { type Hook, z } from "@hono/zod-openapi";

import { errorResponse } from "@/utils/api-response";
import HttpStatusCodes from "./http-status-codes";

/**
 * Helper function to create a JSON content response for OpenAPI.
 * @param schema - The Zod schema for the response data.
 * @param description - Description of the response.
 * @returns An object representing the JSON content response.
 */
export const jsonContent = <T extends z.ZodType>(
  schema: T,
  description: string,
) => {
  return {
    content: {
      "application/json": {
        schema,
      },
    },
    description,
  };
};

/**
 * Helper function to create a JSON content request for OpenAPI.
 * @param schema - The Zod schema for the request data.
 * @param description - Description of the request.
 * @returns An object representing the JSON content request.
 */
export const jsonContentRequired = <T extends z.ZodType>(
  schema: T,
  description: string,
) => {
  return {
    ...jsonContent(schema, description),
    required: true,
  };
};

/**
 * Hook to handle validation errors in OpenAPI routes.
 * @param result - The result of the validation.
 * @param c - The context of the request.
 * @returns A JSON response with error details if validation fails.
 */
// biome-ignore lint/suspicious/noExplicitAny: Hook type requires generic any parameters for flexibility across different route configurations
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
 * Helper function to create a success schema for OpenAPI responses.
 * @param schema - The Zod schema for the response data.
 * @returns A Zod object schema representing a successful response.
 */
export const createSuccessSchema = <T extends z.ZodType>(schema: T) => {
  return z.object({
    status: z
      .enum(["success"])
      .default("success")
      .openapi({ example: "success" }),
    details: z.string().default("Operation successful"),
    data: schema,
  });
};

export const createErrorSchema = (example: object) => {
  return z.object({
    status: z.enum(["error"]).default("error").openapi({ example: "error" }),
    error: z
      .object({
        code: z.string(),
        details: z.string(),
        fields: z.record(z.string(), z.string()),
      })
      .openapi({ example }),
  });
};

/**
 * Helper function to create an error schema for OpenAPI responses with multiple examples.
 * @param schema - The Zod schema for the response data.
 * @param examples - Optional object with multiple named examples.
 * @returns A Zod object schema representing an error response.
 */
export const create422ErrorSchema = <T extends z.ZodType>(
  schema: T,
  examples?: {
    code: string;
    details: string;
    fields: Record<string, string>;
  }[],
) => {
  let exampleData:
    | {
        example: {
          code: string;
          details: string;
          fields: Record<string, string>;
        };
      }
    | {
        examples: {
          code: string;
          details: string;
          fields: Record<string, string>;
        }[];
      };

  if (examples) {
    exampleData = { examples: examples };
  } else {
    // Generate default single example
    const fields: Record<string, string> = {};
    let details = "";

    let testData: unknown;
    if (schema instanceof z.ZodArray) {
      const elem = schema.element;
      testData = elem instanceof z.ZodString ? [123] : ["invalid"];
    } else {
      testData = {};
    }

    const { error } = schema.safeParse(testData);

    error?.issues.forEach((issue, index) => {
      const path = issue.path.join(".");
      fields[path] = issue.message;
      if (index === 0) details = `${path}: ${issue.message}`;
    });

    const defaultExample = {
      code: "INVALID_DATA",
      details: details ? details : "Error details",
      fields,
    };

    exampleData = { example: defaultExample };
  }

  return z.object({
    status: z.enum(["error"]).default("error").openapi({ example: "error" }),
    error: z
      .object({
        code: z.string(),
        details: z.string(),
        fields: z.record(z.string(), z.string()),
      })
      .openapi(exampleData),
  });
};

/**
 * Schema for extracting the ID parameter from the request path.
 */
export const IdUUIDParamsSchema = z.object({
  id: z.uuid().openapi({
    param: {
      name: "id",
      in: "path",
      required: true,
    },
    required: ["id"],
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});
