const OLLAMA_HOST = typeof OLLAMA_HOST_ENV !== "undefined" ? OLLAMA_HOST_ENV : "http://127.0.0.1:11434";

export async function onRequestGet(context) {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`);
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
