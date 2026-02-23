export function connectWS(onMsg: (msg: any) => void) {
  const ws = new WebSocket("ws://localhost:8080/ws");
  ws.onmessage = (ev) => onMsg(JSON.parse(ev.data));
  return ws;
}