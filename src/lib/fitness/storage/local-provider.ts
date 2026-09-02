import fs from "node:fs/promises";
import path from "node:path";
import type { StorageProvider } from "./types";

const ROOT = path.join(process.cwd(), ".local-storage");

function resolvePath(key: string): string {
  const normalized = path.normalize(key).replace(/^(\.\.[/\\])+/, "");
  return path.join(ROOT, normalized);
}

export class LocalStorageProvider implements StorageProvider {
  async upload(key: string, data: Buffer, contentType: string): Promise<void> {
    const filePath = resolvePath(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, data);
    await fs.writeFile(`${filePath}.meta`, JSON.stringify({ contentType }));
  }

  async read(key: string): Promise<{ data: Buffer; contentType: string } | null> {
    const filePath = resolvePath(key);
    try {
      const [data, metaRaw] = await Promise.all([fs.readFile(filePath), fs.readFile(`${filePath}.meta`, "utf8")]);
      const meta = JSON.parse(metaRaw) as { contentType: string };
      return { data, contentType: meta.contentType };
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    const filePath = resolvePath(key);
    await fs.unlink(filePath).catch(() => {});
    await fs.unlink(`${filePath}.meta`).catch(() => {});
  }
}
