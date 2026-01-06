import type { TusConfig } from "./types";

/**
 * Creates a TUS protocol handler.
 *
 * @param config Configuration for the TUS server
 * @returns A generic request handler function
 */
export function createTusHandler(config: TusConfig) {
  const finalConfig: TusConfig = {
    namingFunction: () => crypto.randomUUID(),
    ...config,
  };

  /**
   * Main request handler that dispatches to specific TUS method handlers.
   */
  return async function handleRequest(req: Request): Promise<Response> {
    const method = req.method.toUpperCase();

    // TUS Protocol Version Check
    // All requests (except OPTIONS) MUST include the Tus-Resumable: 1.0.0 header.
    // If missing or mismatched, the server must respond with 412 Precondition Failed
    // and include the supported version in the Tus-Version header.
    const tusResumable = req.headers.get("Tus-Resumable");
    if (method !== "OPTIONS" && tusResumable !== "1.0.0") {
      return new Response("Precondition Failed", {
        status: 412,
        headers: {
          "Tus-Resumable": "1.0.0",
          "Tus-Version": "1.0.0",
        },
      });
    }

    switch (method) {
      case "OPTIONS":
        return handleOptions(finalConfig);
      case "POST":
        return handlePost(req, finalConfig);
      case "HEAD":
        return handleHead(req, finalConfig);
      case "PATCH":
        return handlePatch(req, finalConfig);
      default:
        return new Response("Method Not Allowed", { status: 405 });
    }
  };
}

async function handleOptions(config: TusConfig): Promise<Response> {

  return new Response(null, {

    status: 204,

    headers: {

      "Tus-Resumable": "1.0.0",

      "Tus-Version": "1.0.0",

      "Tus-Max-Size": (config.maxSize || 0).toString(),

      "Tus-Extension": "creation,creation-with-upload",

      // CORS Support: Browser clients require these headers to be explicitly exposed

      // so they can read TUS-specific response headers (like Location or Upload-Offset)

      // during the upload process.

      "Access-Control-Expose-Headers": "Tus-Resumable,Tus-Version,Tus-Max-Size,Tus-Extension,Location,Upload-Offset,Upload-Length",

    },

  });

}



async function handlePost(req: Request, config: TusConfig): Promise<Response> {
  // Placeholder for Milestone 3
  return new Response("Not Implemented", { status: 501 });
}

async function handleHead(req: Request, config: TusConfig): Promise<Response> {
  // Placeholder for Milestone 3
  return new Response("Not Implemented", { status: 501 });
}

async function handlePatch(req: Request, config: TusConfig): Promise<Response> {
  // Placeholder for Milestone 4
  return new Response("Not Implemented", { status: 501 });
}
