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
    throw new Error(`POST /print-jobs/${id}/ack falhou: HTTP ${res.status}`);
  }
}

/**
 * Jobs já impressos fisicamente, aguardando só a confirmação (`ack`) chegar
 * ao servidor. Existe porque impressão e confirmação são duas operações
 * separadas: se a impressora funcionar mas a rede cair bem depois (antes do
 * ack), o job continua "PENDING" no servidor e reapareceria no próximo
 * polling — sem esse controle local, isso causaria reimpressão duplicada do
 * mesmo pedido na cozinha.
 */
const printedLocally = new Set<string>();

async function processJob(job: PendingJob) {
  if (printedLocally.has(job.id)) {
    try {
      await ackJob(job.id, "PRINTED");
      printedLocally.delete(job.id);
      console.log(`✓ Confirmação atrasada enviada — mesa ${job.payload.mesa} (job ${job.id})`);
    } catch {
      console.error(`Ainda não confirmei o job ${job.id} com o servidor — tento de novo no próximo ciclo (sem reimprimir).`);
    }
    return;
  }

  try {
    await printTicket(job.payload);
    printedLocally.add(job.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`✗ Falha ao imprimir job ${job.id}: ${message}`);
    try {
      await ackJob(job.id, "FAILED", message);
    } catch {
      // Nem a impressão nem o ack de falha foram embora — o job continua
      // PENDING no servidor e será tentado de novo no próximo ciclo.
    }
    return;
  }

  try {
    await ackJob(job.id, "PRINTED");
    printedLocally.delete(job.id);
    console.log(`✓ Ticket impresso — mesa ${job.payload.mesa} (job ${job.id})`);
  } catch {
    console.error(`Impresso, mas falhei ao confirmar o job ${job.id} — tento confirmar de novo no próximo ciclo, sem reimprimir.`);
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
