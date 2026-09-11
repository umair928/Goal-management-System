import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces .next/standalone — a self-contained server (only the node_modules
  // it actually needs, no full npm install required on the host). This is
  // what makes deploying to a plain Node.js hosting slot (e.g. Hostinger's
  // hPanel Node.js app) straightforward — see README's deployment section.
  output: "standalone",
};

export default nextConfig;
