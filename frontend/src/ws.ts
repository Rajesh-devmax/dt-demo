const sseUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

export function connectSSE(onMsg: (msg: any) => void) {
  const url = `${sseUrl}/api/stream`;
  const source = new EventSource(url);
  source.onmessage = (ev) => onMsg(JSON.parse(ev.data));
  return source;
}