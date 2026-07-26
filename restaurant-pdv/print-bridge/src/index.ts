import { config } from "./config.js";
import { printTicket, type PrintJobPayload } from "./printer.js";

type PendingJob = {
  id: string;
  payload: PrintJobPayload;
  attempts: number;
  createdAt: string;
};

function authHeaders() {
  return {
    Authorization: `Bearer ${config.bridgeApiKey}`,
    "Content-Type": "application/json",
  };
}

async function fetchPendingJobs(): Promise<PendingJob[]> {
  const res = await fetch(`${config.apiBaseUrl}/api/print-jobs/pending`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error(`GET /print-jobs/pending falhou: ${res.status}`);
  }
  const body = (await res.json()) as { jobs: PendingJob[] };
  return body.jobs;
}

async function ackJob(id: string, status: "PRINTED" | "FAILED", errorMessage?: string) {
  const res = await fetch(`${config.apiBaseUrl}/api/print-jobs/${id}/ack`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ status, errorMessage }),
  });
  if (!res.ok) {
    console.error(`Falha ao confirmar job ${id}: HTTP ${res.status}`);
  }
}

async function processJob(job: PendingJob) {
  try {
    await printTicket(job.payload);
    await ackJob(job.id, "PRINTED");
    console.log(`✓ Ticket impresso — mesa ${job.payload.mesa} (job ${job.id})`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`✗ Falha ao imprimir job ${job.id}: ${message}`);
    await ackJob(job.id, "FAILED", message);
  }
}

async function pollOnce() {
  const jobs = await fetchPendingJobs();
  for (const job of jobs) {
    await processJob(job);
  }
}

async function main() {
  console.log(`Print bridge iniciado — modo "${config.printerMode}"`);
  console.log(`API: ${config.apiBaseUrl} — polling a cada ${config.pollIntervalMs}ms`);

  let running = true;
  process.on("SIGINT", () => {
    console.log("\nEncerrando...");
    running = false;
  });

  while (running) {
    try {
      await pollOnce();
    } catch (err) {
      console.error("Erro no ciclo de polling:", err instanceof Error ? err.message : err);
    }
    await new Promise((resolve) => setTimeout(resolve, config.pollIntervalMs));
  }
}

main();
