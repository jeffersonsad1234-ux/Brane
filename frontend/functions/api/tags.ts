export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      error: "Ollama local não está disponível no Cloudflare.",
      code: "CLOUDFLARE_NO_LOCAL_PROXY",
    }),
    { status: 502, headers: { "Content-Type": "application/json" } }
  );
}
