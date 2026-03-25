import { loadConfig } from "@/config";
import { StorageClient } from "@/utils/StorageClient";
import { HttpAgent } from "@icp-sdk/core/agent";
import { useState } from "react";
import { useInternetIdentity } from "./useInternetIdentity";

export function useStorageUpload() {
  const { identity } = useInternetIdentity();
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file: File): Promise<string> => {
    setIsUploading(true);
    setProgress(0);
    try {
      const config = await loadConfig();
      const agentOptions: Record<string, unknown> = {
        host: config.backend_host,
      };
      if (identity) {
        agentOptions.identity = identity;
      }
      const agent = new HttpAgent(agentOptions);
      if (config.backend_host?.includes("localhost")) {
        await agent.fetchRootKey().catch(() => {});
      }
      const client = new StorageClient(
        config.bucket_name,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent,
      );
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { hash } = await client.putFile(bytes, (pct) => setProgress(pct));
      const url = await client.getDirectURL(hash);
      return url;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, progress, isUploading };
}
