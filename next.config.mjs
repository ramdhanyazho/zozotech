function resolveBlobHostname() {
  const directHost = process.env.NEXT_PUBLIC_BLOB_HOSTNAME || process.env.BLOB_HOSTNAME;
  if (directHost && directHost.trim()) {
    return directHost.trim();
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BLOB_BASE_URL ||
    process.env.BLOB_PUBLIC_BASE_URL ||
    process.env.BLOB_BASE_URL ||
    null;

  if (!baseUrl) {
    return undefined;
  }

  try {
    return new URL(baseUrl).hostname;
  } catch (error) {
    return baseUrl.replace(/^https?:\/\//, "").trim() || undefined;
  }
}

const blobHostname = resolveBlobHostname();

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(blobHostname
    ? {
        images: {
          remotePatterns: [{ protocol: 'https', hostname: blobHostname }]
        }
      }
    : {}),
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  }
};

export default nextConfig;
