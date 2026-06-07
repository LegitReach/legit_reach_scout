export async function* readSSE(res: Response) {
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const parts = buf.split("\n\n");
      buf = parts.pop() ?? "";
      for (const part of parts) {
        const t = part.trim();
        if (t.startsWith("data: ")) {
          try { yield JSON.parse(t.slice(6)); } catch { /* skip */ }
        }
      }
    }
  } finally {
    try { reader.releaseLock(); } catch { /* ignore */ }
  }
}

export function stanceColor(s: string) {
  return s === "friendly" ? "#16a34a" : s === "neutral" ? "#ca8a04" : "#dc2626";
}

export function stanceBg(s: string) {
  return s === "friendly" ? "#f0fdf4" : s === "neutral" ? "#fefce8" : "#fef2f2";
}
