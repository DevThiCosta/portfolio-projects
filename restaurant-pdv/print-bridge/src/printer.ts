import { config } from "./config.js";

export type PrintJobPayload = {
  mesa: string;
  sentAt: string;
  items: { productName: string; quantity: number; notes: string | null }[];
};

const LINE_WIDTH = 32;

function formatConsoleTicket(payload: PrintJobPayload): string {
  const divider = "-".repeat(LINE_WIDTH);
  const lines = [
    divider,
    center("COZINHA", LINE_WIDTH),
    divider,
    `Mesa: ${payload.mesa}`,
    `Hora: ${new Date(payload.sentAt).toLocaleTimeString("pt-BR")}`,
    divider,
    ...payload.items.flatMap((item) => {
      const line = `${item.quantity}x ${item.productName}`;
      return item.notes ? [line, `   obs: ${item.notes}`] : [line];
    }),
    divider,
  ];
  return lines.join("\n");
}

function center(text: string, width: number): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return " ".repeat(padding) + text;
}

/** Imprime um ticket. Lança erro em caso de falha — quem chamar decide o retry. */
export async function printTicket(payload: PrintJobPayload): Promise<void> {
  if (config.printerMode === "console") {
    console.log("\n" + formatConsoleTicket(payload) + "\n");
    return;
  }

  const { ThermalPrinter, PrinterTypes } = await import("node-thermal-printer");

  const iface =
    config.printerMode === "usb"
      ? `printer:${config.printerUsbPath}`
      : `tcp://${config.printerHost}:${config.printerPort}`;

  const printer = new ThermalPrinter({ type: PrinterTypes.EPSON, interface: iface });

  const connected = await printer.isPrinterConnected();
  if (!connected) {
    throw new Error(`Impressora não respondeu em ${iface}`);
  }

  printer.alignCenter();
  printer.bold(true);
  printer.println("COZINHA");
  printer.bold(false);
  printer.drawLine();
  printer.alignLeft();
  printer.println(`Mesa: ${payload.mesa}`);
  printer.println(`Hora: ${new Date(payload.sentAt).toLocaleTimeString("pt-BR")}`);
  printer.drawLine();

  for (const item of payload.items) {
    printer.println(`${item.quantity}x ${item.productName}`);
    if (item.notes) {
      printer.println(`   obs: ${item.notes}`);
    }
  }

  printer.drawLine();
  printer.cut();
  await printer.execute();
}
