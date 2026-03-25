import { z } from "zod";
import { createMcpHandler } from "mcp-handler";
import { OG_KNOWLEDGE } from "@/knowledge/og-docs";

function buildDocs(topic: string): string {
  let docs = "";
  if (topic === "chain" || topic === "all") {
    docs += `\n${"=".repeat(60)}\n0G CHAIN — Smart Contract Deployment\n${"=".repeat(60)}\n${OG_KNOWLEDGE.chain.overview}\n\nHardhat Config:\n${OG_KNOWLEDGE.chain.hardhatConfig}\n\nSample Contract:\n${OG_KNOWLEDGE.chain.sampleContract}\n\nDeploy Script:\n${OG_KNOWLEDGE.chain.deployScript}\n\nFoundry Deploy:\n${OG_KNOWLEDGE.chain.foundryDeploy}\n\nVerify:\n${OG_KNOWLEDGE.chain.verify}\n\nPrecompiles: ${JSON.stringify(OG_KNOWLEDGE.chain.precompiles)}\nDeployment Scripts: ${OG_KNOWLEDGE.chain.deploymentScripts}\n`;
  }
  if (topic === "storage" || topic === "all") {
    docs += `\n${"=".repeat(60)}\n0G STORAGE SDK\n${"=".repeat(60)}\n${OG_KNOWLEDGE.storage.overview}\nInstall: ${OG_KNOWLEDGE.sdks.storage_ts.install}\nStarter Kit: ${OG_KNOWLEDGE.sdks.storage_ts.starterKit}\n\nSetup:\n${OG_KNOWLEDGE.storage.setup}\n\nUpload:\n${OG_KNOWLEDGE.storage.upload}\n\nDownload:\n${OG_KNOWLEDGE.storage.download}\n\nKV Storage:\n${OG_KNOWLEDGE.storage.kvStorage}\n\nBrowser:\n${OG_KNOWLEDGE.storage.browser}\n\nStreams:\n${OG_KNOWLEDGE.storage.stream}\n`;
  }
  if (topic === "compute" || topic === "all") {
    docs += `\n${"=".repeat(60)}\n0G COMPUTE — AI Inference\n${"=".repeat(60)}\n${OG_KNOWLEDGE.compute.overview}\nInstall: ${OG_KNOWLEDGE.sdks.compute_broker.install}\nMarketplace: ${OG_KNOWLEDGE.networks.testnet.computeMarketplace}\n\nModels (Mainnet): ${JSON.stringify(OG_KNOWLEDGE.compute.services.mainnet, null, 2)}\n\nSDK Setup:\n${OG_KNOWLEDGE.compute.sdkSetup}\n\nChat Completion:\n${OG_KNOWLEDGE.compute.chatCompletion}\n\nText-to-Image:\n${OG_KNOWLEDGE.compute.textToImage}\n\nSpeech-to-Text:\n${OG_KNOWLEDGE.compute.speechToText}\n\nCLI:\n${OG_KNOWLEDGE.compute.cliCommands}\n\ncURL:\n${OG_KNOWLEDGE.compute.directApiCurl}\n`;
  }
  if (topic === "da" || topic === "all") {
    docs += `\n${"=".repeat(60)}\n0G DATA AVAILABILITY (DA)\n${"=".repeat(60)}\n${OG_KNOWLEDGE.da.overview}\nComponents: ${OG_KNOWLEDGE.da.components}\nClient: ${OG_KNOWLEDGE.da.clientRepo}\nEncoder: ${OG_KNOWLEDGE.da.encoderRepo}\nRetriever: ${OG_KNOWLEDGE.da.retrieverRepo}\nExample: ${OG_KNOWLEDGE.da.exampleRepo}\n\nDocker:\n${OG_KNOWLEDGE.da.dockerSetup}\n\nEnv:\n${OG_KNOWLEDGE.da.envConfig}\n\nRollups: ${OG_KNOWLEDGE.da.rollups.join(", ")}\n`;
  }
  if (topic === "infts" || topic === "all") {
    docs += `\n${"=".repeat(60)}\nINFTs — ERC-7857\n${"=".repeat(60)}\n${OG_KNOWLEDGE.infts.overview}\nFeatures: ${OG_KNOWLEDGE.infts.features.join(", ")}\nTransfer: ${OG_KNOWLEDGE.infts.transferFlow}\nUse Cases: ${OG_KNOWLEDGE.infts.useCases.join(", ")}\n\nSetup:\n${OG_KNOWLEDGE.infts.setupCode}\n\nDeploy:\n${OG_KNOWLEDGE.infts.contractExample}\n\nRepo: ${OG_KNOWLEDGE.infts.repo}\n`;
  }
  if (topic === "network" || topic === "all") {
    docs += `\n${"=".repeat(60)}\nNETWORK CONFIG\n${"=".repeat(60)}\n${JSON.stringify(OG_KNOWLEDGE.networks, null, 2)}\nSDKs: ${JSON.stringify(OG_KNOWLEDGE.sdks, null, 2)}\nLinks: ${JSON.stringify(OG_KNOWLEDGE.links, null, 2)}\n`;
  }
  docs += `\n${"=".repeat(60)}\nIMPORTANT NOTES\n${"=".repeat(60)}\n${OG_KNOWLEDGE.importantNotes.join("\n")}\n`;
  return docs;
}

const handler = createMcpHandler(
  (server) => {

    server.registerTool("zaxxie_get_docs", {
      title: "Get 0G Docs",
      description: "Get complete 0G developer documentation. Covers: chain, storage, compute, da, infts, network, or all.",
      inputSchema: {
        topic: z.enum(["chain", "storage", "compute", "da", "infts", "network", "all"]).describe("Topic to get docs for"),
      },
    }, async ({ topic }) => {
      return { content: [{ type: "text", text: buildDocs(topic) }] };
    });

    server.registerTool("zaxxie_scaffold", {
      title: "Scaffold 0G Project",
      description: "Generate a complete 0G dApp project scaffold with package.json, configs, and code examples.",
      inputSchema: {
        projectName: z.string().describe("Project name"),
        description: z.string().describe("What the dApp should do"),
        features: z.array(z.enum(["chain", "storage", "compute", "da", "infts"])).describe("0G features to include"),
        framework: z.enum(["nextjs", "react", "express", "hardhat", "custom"]).default("nextjs").describe("Framework"),
      },
    }, async ({ projectName, description, features, framework }) => {
      const deps: Record<string, string> = { ethers: "^6.13.4", dotenv: "^16.4.0" };
      const devDeps: Record<string, string> = {};
      if (features.includes("storage")) deps["@0gfoundation/0g-ts-sdk"] = "latest";
      if (features.includes("compute")) { deps["@0glabs/0g-serving-broker"] = "latest"; deps["openai"] = "^4.0.0"; }
      if (features.includes("chain") || features.includes("infts")) { devDeps["hardhat"] = "^2.22.0"; devDeps["@nomicfoundation/hardhat-toolbox"] = "^5.0.0"; devDeps["@openzeppelin/contracts"] = "^5.0.0"; }
      if (framework === "nextjs") { deps["next"] = "^15.0.0"; deps["react"] = "^19.0.0"; deps["react-dom"] = "^19.0.0"; }
      if (framework === "express") { deps["express"] = "^4.21.0"; }

      const scaffold = {
        projectName, description, framework, features,
        packageJson: { name: projectName, version: "0.1.0", private: true, dependencies: deps, devDependencies: devDeps },
        envExample: `PRIVATE_KEY=0xYOUR_KEY\nRPC_URL=https://evmrpc-testnet.0g.ai\nCHAIN_ID=16602${features.includes("storage") ? "\nINDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai" : ""}`,
        networkConfig: OG_KNOWLEDGE.networks.testnet,
        codeExamples: {
          ...(features.includes("chain") ? { chain: { hardhatConfig: OG_KNOWLEDGE.chain.hardhatConfig, sampleContract: OG_KNOWLEDGE.chain.sampleContract, deployScript: OG_KNOWLEDGE.chain.deployScript } } : {}),
          ...(features.includes("storage") ? { storage: { setup: OG_KNOWLEDGE.storage.setup, upload: OG_KNOWLEDGE.storage.upload, download: OG_KNOWLEDGE.storage.download, kvStorage: OG_KNOWLEDGE.storage.kvStorage } } : {}),
          ...(features.includes("compute") ? { compute: { sdkSetup: OG_KNOWLEDGE.compute.sdkSetup, chatCompletion: OG_KNOWLEDGE.compute.chatCompletion, textToImage: OG_KNOWLEDGE.compute.textToImage, speechToText: OG_KNOWLEDGE.compute.speechToText } } : {}),
          ...(features.includes("da") ? { da: { overview: OG_KNOWLEDGE.da.overview, dockerSetup: OG_KNOWLEDGE.da.dockerSetup } } : {}),
          ...(features.includes("infts") ? { infts: { overview: OG_KNOWLEDGE.infts.overview, contractExample: OG_KNOWLEDGE.infts.contractExample } } : {}),
        },
        importantNotes: OG_KNOWLEDGE.importantNotes, links: OG_KNOWLEDGE.links,
      };
      return { content: [{ type: "text", text: JSON.stringify(scaffold, null, 2) }] };
    });

    server.registerTool("zaxxie_network", {
      title: "0G Network Info",
      description: "Get 0G network details — RPCs, chain IDs, contract addresses, faucets, explorer URLs, SDK install commands.",
      inputSchema: {
        network: z.enum(["testnet", "mainnet", "both"]).default("testnet").describe("Which network"),
      },
    }, async ({ network }) => {
      const info: Record<string, unknown> = {};
      if (network !== "mainnet") info.testnet = OG_KNOWLEDGE.networks.testnet;
      if (network !== "testnet") info.mainnet = OG_KNOWLEDGE.networks.mainnet;
      info.sdks = OG_KNOWLEDGE.sdks;
      info.links = OG_KNOWLEDGE.links;
      return { content: [{ type: "text", text: JSON.stringify(info, null, 2) }] };
    });

    server.registerTool("zaxxie_models", {
      title: "0G AI Models",
      description: "List available AI models on 0G Compute Network with pricing — chatbots, text-to-image, speech-to-text.",
      inputSchema: {
        network: z.enum(["testnet", "mainnet", "both"]).default("both").describe("Which network"),
      },
    }, async ({ network }) => {
      const info: Record<string, unknown> = {};
      if (network !== "mainnet") info.testnet = OG_KNOWLEDGE.compute.services.testnet;
      if (network !== "testnet") info.mainnet = OG_KNOWLEDGE.compute.services.mainnet;
      info.marketplace = OG_KNOWLEDGE.networks.testnet.computeMarketplace;
      info.usage = "Use OpenAI-compatible SDK. Get Bearer token: 0g-compute-cli inference get-secret --provider <ADDR>";
      return { content: [{ type: "text", text: JSON.stringify(info, null, 2) }] };
    });

  },
  { name: "zaxxie", version: "3.0.0" },
  { basePath: "/api", maxDuration: 60 }
);

export { handler as GET, handler as POST, handler as DELETE };
