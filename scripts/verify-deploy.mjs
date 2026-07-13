import { verifyDeployment } from "../dist/src/verification/deploy-verifier.js";

function readArgument(name) {
  const prefix = `--${name}=`;
  const inline = process.argv.find((argument) => argument.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function printUsage() {
  console.log(`Uso:
  npm run verify:deploy -- --base-url https://seu-site.netlify.app --username usuario

Variáveis alternativas:
  PROJECTSCOPE_BASE_URL
  PROJECTSCOPE_USERNAME
  PROJECTSCOPE_VERIFY_TIMEOUT_MS`);
}

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  printUsage();
  process.exit(0);
}

const baseUrl = readArgument("base-url") ?? process.env.PROJECTSCOPE_BASE_URL;
const username = readArgument("username") ?? process.env.PROJECTSCOPE_USERNAME;
const timeoutValue =
  readArgument("timeout-ms") ?? process.env.PROJECTSCOPE_VERIFY_TIMEOUT_MS ?? "10000";

if (!baseUrl || !username) {
  printUsage();
  process.exit(1);
}

try {
  const report = await verifyDeployment({
    baseUrl,
    username,
    timeoutMilliseconds: Number(timeoutValue),
  });

  console.log(`Deploy verificado: ${report.baseUrl}`);
  console.log(`Usuário consultado: ${report.username}`);

  for (const result of report.results) {
    const size = result.method === "GET" ? `${result.bodyBytes} bytes` : "sem corpo";
    console.log(
      `✓ ${result.method.padEnd(4)} ${result.name.padEnd(16)} HTTP ${result.statusCode} · ${result.durationMilliseconds} ms · ${size}`,
    );
  }

  console.log(`Verificação concluída em ${report.totalDurationMilliseconds} ms.`);
} catch (error) {
  const message = error instanceof Error ? error.message : "Falha desconhecida na verificação.";
  console.error(`Falha na verificação do deploy: ${message}`);
  process.exit(1);
}
