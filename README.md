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
- Prestige/reset system
- Achievements and statistics

## Prestige (Polta sauna)

Reset your population, buildings, technologies and tier level for a permanent population-per-second multiplier.  Prestige points follow a square-root curve based on lifetime population:

```
points = floor( sqrt(totalPopulation / 100000) )
multiplier = 1 + points * 0.10
```

The prestige button unlocks at 10 000 total population and displays your current multiplier and projected gain.

## License

MIT
