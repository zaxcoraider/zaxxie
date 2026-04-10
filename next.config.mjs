/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude large server-only packages from webpack bundle.
  // They load from node_modules at runtime instead — reduces function bundle by ~15MB.
  // solc: 9.6MB Solidity compiler (zaxxie_deploy_contract only)
  // @0gfoundation/0g-ts-sdk: 5.5MB storage SDK (zaxxie_upload only)
  serverExternalPackages: [
    "solc",
    "@0gfoundation/0g-ts-sdk",
  ],
};

export default nextConfig;
