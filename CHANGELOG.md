# Changelog

## [Unreleased]
### Added
- Add a "Buy all" option to building shop entries to purchase the maximum affordable amount at once.
- Daily Tasks system with rotating objectives, persistent progress, and temporary Lämpötila buffs.
- Configure deployments to publish the `aaroonparas.com` CNAME record.
- Collapsible controls for the building, technology, tier, and Maailma shops.
- Automate GitHub Pages deployments for the main site and /dev/ preview with combined artifacts.
- Autogenerate SVG icons for daily tasks based on the shared task data and surface them alongside task details.
- Development-only environment flag that multiplies population-per-second by `tier * 100` to speed up local testing.

### Changed
- Hide the Maailma shop until Polta Maailma has been used at least once.
- Update the page title to display "suomidle" in browser tabs.
- Namespace persisted local storage keys by environment to isolate saves across deployments.
- Move the daily tasks list into a collapsible drawer beneath the settings menu and highlight ready-to-claim tasks.
- Show the reward each daily task grants and apply active bonuses to the LPS counter in the HUD.
- Display large numeric values in scientific notation once they exceed 1e9 to improve readability in the UI.
- Surface a contextual "Buy all" summary and tooltips in the store for clearer bulk purchases.
- Update the Finnish daily tasks expired bonus label to read "Bonus käytetty".


### Fixed
- Prevent GitHub Pages deployments from failing when promoting the root build into the combined artifact.
- Remove decimals from the Lämpötila counter for clearer progress tracking.
- Align shop translation interpolations with numeric ICU formatting and fix the Polta Maailma confirmation phrase typing error.
- Adjust the Polta sauna prestige button layout so it stays within the viewport and remains fully clickable on small screens.
- Shrink the Polta sauna prestige button on phones so it doesn't overwhelm the mobile interface.
- Fix the store "Buy all" translations to use formatted counts so the TypeScript build completes successfully.
- Render the building shop bulk purchase button so the "Buy all" option is visible in the card grid UI.
- Keep the building shop "Buy all" controls above the grid so they are never hidden behind neighbouring cards.
- Apply theme-aware colors to daily task reward text so it remains legible against both light and dark backgrounds.

