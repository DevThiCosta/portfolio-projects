import "dotenv/config";

export type PrinterMode = "console" | "usb" | "network";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name}`);
  }
  return value;
}

const printerMode = (process.env.PRINTER_MODE ?? "console") as PrinterMode;
if (!["console", "usb", "network"].includes(printerMode)) {
  throw new Error(`PRINTER_MODE inválido: ${printerMode}`);
}

export const config = {
  apiBaseUrl: required("API_BASE_URL").replace(/\/$/, ""),
  bridgeApiKey: required("BRIDGE_API_KEY"),
  pollIntervalMs: Number(process.env.POLL_INTERVAL_MS ?? 4000),
  printerMode,
  printerUsbPath: process.env.PRINTER_USB_PATH ?? "/dev/usb/lp0",
  printerHost: process.env.PRINTER_HOST ?? "",
  printerPort: Number(process.env.PRINTER_PORT ?? 9100),
};
