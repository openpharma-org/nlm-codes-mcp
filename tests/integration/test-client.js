#!/usr/bin/env node

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";

async function main() {
  // Path to the built server
  const serverPath = path.resolve("dist/index.js");

  const client = new Client(
    {
      name: "test-client",
      version: "0.1.2"
    },
    {
      capabilities: {}
    }
  );

  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
    env: { ...process.env, USE_HTTP: "false" }
  });

  await client.connect(transport);

  try {
    // List available tools
    const tools = await client.listTools();
    console.log('Available tools:', JSON.stringify(tools, null, 2));

    // Call the example tool
    const result = await client.callTool({
      name: 'example_tool',
      arguments: { input: 'test' }
    });
    console.log('Tool result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await transport.close();
  }
}

main().catch(console.error); 