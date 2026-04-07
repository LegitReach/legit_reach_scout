import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export interface Update {
  date: string;
  title: string;
  items: string[];
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "UPDATES.md");
    const raw = fs.readFileSync(filePath, "utf-8");

    const updates: Update[] = [];
    const sections = raw.split(/^## /m).slice(1); // drop header/comments

    for (const section of sections) {
      const lines = section.trim().split("\n");
      const header = lines[0]; // e.g. "2026-04-06 · Short title"
      const dotIdx = header.indexOf("·");
      const date = dotIdx !== -1 ? header.slice(0, dotIdx).trim() : header.trim();
      const title = dotIdx !== -1 ? header.slice(dotIdx + 1).trim() : "";
      const items = lines
        .slice(1)
        .filter((l) => l.trim().startsWith("-"))
        .map((l) => l.replace(/^-\s*/, "").trim());

      if (date) updates.push({ date, title, items });
    }

    return NextResponse.json(updates);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
