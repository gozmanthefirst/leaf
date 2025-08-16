import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
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
 * Helper function to create a "oneOf" schema for OpenAPI responses.
 * @param schemas - An array of Zod schemas to include in the "oneOf" condition.
 * @returns A Zod object schema representing the "oneOf" condition.
 */
export const oneOf = <T extends z.ZodType>(schemas: T[]) => {
  const registry = new OpenAPIRegistry();

  schemas.forEach((schema, index) => {
    registry.register(index.toString(), schema);
  });

  const generator = new OpenApiGeneratorV3(registry.definitions);
  const components = generator.generateComponents();

  return components.components?.schemas
    ? Object.values(components.components.schemas)
    : [];
};

/**
 * Helper function to create a JSON content response with a "oneOf" schema for OpenAPI.
 * @param schemas - An array of Zod schemas to include in the "oneOf" condition.
 * @param description - Description of the response.
 * @returns An object representing the JSON content response.
 */
export const jsonContentOneOf = <T extends z.ZodType>(
  schemas: T[],
  description: string,
) => {
  return {
    content: {
      "application/json": {
        schema: {
          oneOf: oneOf(schemas),
        },
      },
    },
    description,
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
 * Helper function to create a UUID parameter schema for OpenAPI path parameters.
 * @param description - Description of the UUID parameter.
 * @returns A Zod object schema for UUID path parameter validation.
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
 * @param schema - The Zod schema for the response data.
 * @returns A Zod object schema representing a successful response.
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
 * @param example - An example error response.
 * @returns A Zod object schema representing an error response.
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
 * Helper function to create a 500 error schema for OpenAPI responses.
 * @param errorDetails - Details about the error.
 * @returns A Zod object schema representing a 500 error response.
 */
export const create500ErrorSchema = (errorDetails: string) => {
  return z.object({
    status: z.enum(["error"]).default("error").openapi({ example: "error" }),
    error: z
      .object({
        code: z.string(),
        details: z.string(),
        fields: z.record(z.string(), z.string()),
      })
      .openapi({
        example: {
          status: "error",
          error: {
            code: "SERVER_ERROR",
            details: errorDetails,
            fields: {},
          },
        },
      }),
  });
};
