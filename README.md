# BRKYS CRIB — rezervační systém barbershopu

Web s online rezervacemi pro barbershop: ceník, výběr služby a termínu, rušení rezervací kódem a chráněná administrace termínů.

## Spuštění

```bash
npm install
cp .env.example .env.local   # doplň hodnoty
npm run dev
```

Web běží na [http://localhost:3000](http://localhost:3000).

## Stránky

| Cesta | Popis |
| --- | --- |
| `/` | Úvodní stránka s ceníkem |
| `/rezervace` | Rezervační formulář (služba → termín → kontakt), po odeslání vrátí kód `BRK-XXXXXX` |
| `/zrusit` | Zrušení rezervace pomocí kódu a důvodu |
| `/admin` | Správa termínů a přehled rezervací — chráněno heslem `ADMIN_PASSWORD` |

## Konfigurace (`.env.local`)

- `ADMIN_PASSWORD` — heslo do administrace (bez něj je `/admin` nedostupný)
- `RESEND_API_KEY`, `RESEND_FROM`, `BARBER_EMAIL` — e-mailové notifikace přes [Resend](https://resend.com); bez klíče se e-maily jen logují do konzole
- `APP_URL` — veřejná URL webu, používá se v odkazech v e-mailech

Při rezervaci i zrušení dostane e-mail barber (`BARBER_EMAIL`) i zákazník (potvrzení s kódem).

## Data

Rezervace a termíny se ukládají do JSON souborů v `data/` (`slots.json`, `bookings.json`). Pro malý provoz to stačí; při nasazení na serverless platformu (Vercel apod.) je potřeba vyměnit `lib/db.ts` za skutečnou databázi, protože souborový systém tam není trvalý.
