export interface StorageProvider {
  upload(key: string, data: Buffer, contentType: string): Promise<void>;
  read(key: string): Promise<{ data: Buffer; contentType: string } | null>;
  delete(key: string): Promise<void>;
}
