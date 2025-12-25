/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL ||
      "http://localhost:8000";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiBase}/api/v1/:path*`,
      },
    ];
  },
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
        os: false,
        path: false,
        child_process: false,
        readline: false,
        console: false,
        "@react-native-async-storage/async-storage": false,
      };

      config.resolve.alias = {
        ...config.resolve.alias,
        hardhat: false,
        "hardhat/config": false,
        "@nomicfoundation/solidity-analyzer": false,
        "@nomicfoundation/ignition-core": false,
        "@nomicfoundation/hardhat-ignition": false,
        "@excubiae/contracts": false,
        "ts-node": false,
        swc: false,
        "@swc/core": false,
        canvas: false,
      };
    }
    return config;
  },
  serverExternalPackages: [
    "undici",
    "snarkjs",
    "circomlibjs",
    "@maci-protocol/sdk",
    "@maci-protocol/contracts",
    "@maci-protocol/core",
    "@maci-protocol/crypto",
    "@maci-protocol/domainobjs",
    "hardhat",
    "ts-node",
  ],
};

export default nextConfig;
