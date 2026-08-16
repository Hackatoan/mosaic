/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // sharp ships native binaries; keep it out of the bundler and let Node require() it directly.
  serverExternalPackages: ["sharp"],
};
export default nextConfig;
