/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        async_hooks: false,
        http: false,
        https: false,
        zlib: false,
        stream: false,
        undici: false,
        util: false,
        url: false,
        assert: false,
        buffer: false,
        events: false,
      };
    }
    
    return config;
  },
  serverExternalPackages: ['undici', '@maci-protocol/sdk'],
};

export default nextConfig;
