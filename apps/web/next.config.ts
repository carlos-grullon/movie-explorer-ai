import type { NextConfig } from "next";
import webpack from "webpack";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: false,
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.API_BASE_URL': JSON.stringify(process.env.API_BASE_URL ?? ''),
          'process.env.NEXT_PUBLIC_API_BASE_URL': JSON.stringify(
            process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
          ),
          'process.env.AUTH0_DOMAIN': JSON.stringify(process.env.AUTH0_DOMAIN ?? ''),
          'process.env.AUTH0_CLIENT_ID': JSON.stringify(process.env.AUTH0_CLIENT_ID ?? ''),
          'process.env.AUTH0_CLIENT_SECRET': JSON.stringify(process.env.AUTH0_CLIENT_SECRET ?? ''),
          'process.env.AUTH0_SECRET': JSON.stringify(process.env.AUTH0_SECRET ?? ''),
          'process.env.APP_BASE_URL': JSON.stringify(process.env.APP_BASE_URL ?? ''),
          'process.env.AUTH0_AUDIENCE': JSON.stringify(process.env.AUTH0_AUDIENCE ?? ''),
        })
      );
    }

    return config;
  },
};

export default nextConfig;
