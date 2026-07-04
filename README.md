# AB eller privat? – Uthyrningssimulatorn

Interaktiv privatekonomisk simulator som jämför två scenarier för en
uthyrningsverksamhet (prylar via Hygglo och liknande plattformar):

1. **Fortsätta privat** – intäkterna beskattas som inkomst av tjänst/hobby
   ovanpå befintlig anställning.
2. **Starta aktiebolag** – moms, lön, arbetsgivaravgifter, bolagsskatt,
   3:12-utdelning och kvarhållen vinst hanteras i ett AB.

## Funktioner

- **Översikt** – netto per scenario, skillnad i kronor och procent, break-even,
  kvar i bolaget, återinvesteringskapacitet, moms- och admineffekt samt
  regelbaserad "AI-insikt" på enkel svenska.
- **Mina siffror** – alla antaganden är redigerbara: lön, kommunalskatt,
  brytpunkt, marginalskatt, gränsbelopp, uttagsstrategi, intäkter, kostnader,
  inköp, avskrivningar, momsplikt m.m.
- **Beräkning** – hela beräkningskedjan för båda scenarierna, rad för rad.
- **Scenarier** – färdiga nivåer (20/75/150/300/500 tkr) med rekommendation,
  plus möjlighet att spara egna scenarier lokalt i webbläsaren.
- **Känslighet** – sliders för intäkter, inköp, admin, marginalskatt,
  utdelningsandel, momsplikt, antal prylar m.m. med grafer för break-even,
  kassaflöde och ackumulerad förmögenhet efter 1/3/5 år.
- **Slutsats** – vad som driver resultatet, administrationens tak, bästa
  uttagsstrategi och vilka antaganden som påverkar mest.
- Export till CSV (svensk Excel) och PDF (via utskrift).

## Teknik

React 18 + TypeScript + Tailwind CSS + Recharts, byggt med Vite.
Ingen backend – allt sparas i `localStorage`. Ljust och mörkt läge följer
systeminställningen.

```bash
npm install
npm run dev      # utvecklingsserver
npm run build    # typkontroll + produktionsbygge till dist/
npm run preview  # servera produktionsbygget lokalt
```

## Viktigt

> Detta är en simuleringsmodell – inte juridisk eller skattemässig rådgivning.
> Kontrollera med redovisningskonsult eller Skatteverket innan beslut.

Skattesatser är förifyllda med 2025 års nivåer (bolagsskatt 20,6 %,
arbetsgivaravgifter 31,42 %, moms 25 %, förenklingsregeln 209 550 kr,
brytpunkt 643 100 kr, egenavgifter 28,97 %) och kan ändras under
**Mina siffror → Antaganden**.
