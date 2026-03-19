/**
 * Utility function to log a request as a curl command.
 * Useful for debugging and sharing requests with Postman.
 */
export function logCurl(url: string, method: string, headers: Headers | Record<string, string>, body: any) {
  let curl = `curl -X ${method} '${url}'`;

  const headersObj = headers instanceof Headers ? Object.fromEntries(headers.entries()) : headers;

  for (const [key, value] of Object.entries(headersObj as Record<string, string>)) {
    const k = key.toLowerCase();
    if (["host", "connection", "content-length", "accept-encoding", "user-agent"].includes(k)) continue;
    curl += ` \\\n  -H '${key}: ${value}'`;
  }

  if (body) {
    let bodyStr = "";
    if (body instanceof URLSearchParams) {
      bodyStr = body.toString();
    } else {
      bodyStr = typeof body === "string" ? body : JSON.stringify(body);
    }
    const escapedBody = bodyStr.replace(/'/g, "'\\''");
    curl += ` \\\n  --data-raw '${escapedBody}'`;
  }

  console.log(`\n\x1b[36m--- CURL FOR POSTMAN ---\x1b[0m\n${curl}\n\x1b[36m------------------------\x1b[0m\n`);
}
