# Suomidle

Idle clicker built with React, TypeScript and Vite.

## Quick start

```bash
npm install
npm run dev   # start dev server
npm test      # run tests
npm run build # create production build
```

## Roadmap

- Expand generator balance and progression
- Add upgrades and multipliers
- Polta sauna/reset system
- Achievements and statistics

## Polta sauna

Reset your lämpötila, buildings, technologies and sauna level for a permanent lämpötila-per-second multiplier.  Polta sauna points follow a square-root curve based on lifetime lämpötila:

```
points = floor( sqrt(totalPopulation / 100000) )
multiplier = 1 + points * 0.10
```

The Polta sauna button unlocks at 10 000 total lämpötila and displays your current multiplier and projected gain.

## License

MIT
