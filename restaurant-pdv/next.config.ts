import type { NextConfig } from "next";

// CSP tentou usar nonce por requisição (via middleware.ts) numa revisão de
// segurança, mas foi revertido: bloqueia os próprios scripts inline de
// hidratação do Next.js (erro de CSP no console + React error #412),
// verificado na prática contra um build de produção real, não só em teoria.
// 'unsafe-eval' só entra em dev — o React em modo dev usa eval() pra
// reconstruir stack traces (HMR, overlay de erro); em produção o React
// nunca usa eval(). img-src precisa de `data:` pro QR code do Pix, que é
// embutido como data URI, não servido como arquivo.
const isDev = process.env.NODE_ENV === "development";
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  // next/image não é usado em lugar nenhum do app (o QR Pix já é data URI) —
  // desliga a rota /_next/image de vez em vez de deixar uma superfície sem uso.
  images: { unoptimized: true },
  // Sem isso, `next dev` reinjeta um bloco de instruções voltado a agentes
  // de IA em AGENTS.md/CLAUDE.md a cada execução (ver histórico do commit
  // que limpou esse bloco) — AGENTS.md já tem documentação real do projeto.
  agentRules: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
