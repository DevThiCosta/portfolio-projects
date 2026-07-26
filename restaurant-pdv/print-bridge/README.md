# Print Bridge

Serviço standalone (não faz parte do deploy do app Next.js) que roda num
computador/Raspberry Pi na cozinha do bar, na mesma rede da impressora
térmica. Ele busca pedidos pendentes na API na nuvem e manda para a
impressora via ESC/POS.

Por que é um projeto separado: ele roda em hardware diferente (o mini PC da
cozinha, não o servidor na nuvem) e tem um ciclo de vida diferente (loop
contínuo de polling, não request/response).

## Rodando em modo de teste (sem impressora física)

```bash
npm install
cp .env.example .env
# edite .env: aponte API_BASE_URL para o app rodando (ex: http://localhost:3000)
# e use o mesmo BRIDGE_API_KEY configurado no .env do app principal
npm run dev
```

Com `PRINTER_MODE=console` (padrão), cada pedido enviado pelo garçom aparece
formatado no terminal, como se fosse o ticket saindo da impressora — é assim
que se valida o fluxo inteiro antes de comprar qualquer hardware.

## Com impressora de verdade

1. Compre uma impressora térmica ESC/POS não-fiscal (ex: Elgin i9, Bematech
   MP-4200 TH) com conexão USB ou Ethernet.
2. No `.env`, mude `PRINTER_MODE` para `usb` ou `network`.
   - `usb`: configure `PRINTER_USB_PATH` (ex: `/dev/usb/lp0` no Linux).
   - `network`: configure `PRINTER_HOST` e `PRINTER_PORT` (normalmente 9100).
3. `npm run start`.

## Rodando como serviço (systemd)

Para sobreviver a reinícios do Raspberry Pi/mini PC, rode como serviço:

```ini
# /etc/systemd/system/bar-pos-print-bridge.service
[Unit]
Description=Bar POS - Print Bridge
After=network-online.target

[Service]
WorkingDirectory=/caminho/para/print-bridge
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now bar-pos-print-bridge
```
