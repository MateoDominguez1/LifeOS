import type { StorageProvider } from "./types";
import { LocalStorageProvider } from "./local-provider";
import { S3Provider } from "./s3-provider";

function createStorageProvider(): StorageProvider {
  if (process.env.STORAGE_ACCESS_KEY_ID && process.env.STORAGE_BUCKET) {
    return new S3Provider();
  }
  return new LocalStorageProvider();
}

export const storage = createStorageProvider();
