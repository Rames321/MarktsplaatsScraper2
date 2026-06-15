# Marktplaats Scraper — statische demo

Een **klikbare live demo** van de Marktplaats Scraper, volledig client-side
(HTML/CSS/JS) zodat hij gratis als statische site op Vercel draait en altijd
online is.

> ⚠️ **Dit is een prototype met voorbeelddata.** Er wordt hier *niet* live
> gescraped — dat kan niet vanuit de browser (CORS) en mag niet (Marktplaats
> ToS). De echte scraper is de Python + Flask backend in deze repo en draait
> lokaal of als losse backend.

## Wat de demo laat zien

- **Zoeken & filteren** op zoekterm, prijs van–tot, locatie, max. afstand,
  conditie en sortering — net als de echte scraper.
- **Live filteren**: de resultatenlijst werkt direct mee bij elke wijziging.
- **Resultatenkaarten** met titel, prijs, locatie, afstand, datum en thumbnail.
- **Gesimuleerde "nieuwe match"-melding**: een monitor die periodiek een
  toast toont zodra er een nieuwe passende aanbieding "binnenkomt" — precies
  het idee achter de echte automatische notificaties (in productie via Discord).

## Bestanden

| Bestand        | Functie                                            |
| -------------- | -------------------------------------------------- |
| `index.html`   | Entrypoint / UI                                    |
| `styles.css`   | Styling (huisstijl van de echte React-app)         |
| `data.js`      | Opgenomen voorbeeld-aanbiedingen                   |
| `app.js`       | Filteren, sorteren en de gesimuleerde monitor      |

## Lokaal bekijken

Open simpelweg `index.html` in je browser, of serveer de map:

```bash
# vanuit de repo-root
npx serve demo
# of
python -m http.server 8000 --directory demo
```

## Deployen op Vercel

De repo bevat een `vercel.json` in de root die `/` doorstuurt naar
`demo/index.html`. Geen build-stap nodig.

**Optie A — via de Vercel-website:**
1. Ga naar [vercel.com/new](https://vercel.com/new) en importeer
   `Rames321/MarktsplaatsScraper2`.
2. Framework Preset: **Other**. Build Command: leeg. Output: laat default.
3. Deploy → je krijgt een URL als `https://marktsplaatsscraper2.vercel.app`.

**Optie B — via de CLI:**
```bash
npm i -g vercel
vercel        # preview
vercel --prod # productie
```
