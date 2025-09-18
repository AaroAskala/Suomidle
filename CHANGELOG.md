# Changelog

## [Unreleased]
### Added
- Daily Tasks system with rotating objectives, persistent progress, and temporary Lämpötila buffs.
- Configure deployments to publish the `aaroonparas.com` CNAME record.
- Collapsible controls for the building, technology, tier, and Maailma shops.
- Automate GitHub Pages deployments for the main site and /dev/ preview with combined artifacts.
- Animated progress bar component for sharing reusable HUD metric styling.

### Changed
- Hide the Maailma shop until Polta Maailma has been used at least once.
- Update the page title to display "suomidle" in browser tabs.
- Namespace persisted local storage keys by environment to isolate saves across deployments.
- Move the daily tasks list into a collapsible drawer beneath the settings menu and highlight ready-to-claim tasks.
- Show the reward each daily task grants and apply active bonuses to the LPS counter in the HUD.
- Display large numeric values in scientific notation once they exceed 1e9 to improve readability in the UI.
- Update the Finnish daily tasks expired bonus label to read "Bonus käytetty".
- Replace the HUD counters with themed progress bars that highlight next tier unlock progress.


### Fixed
- Prevent GitHub Pages deployments from failing when promoting the root build into the combined artifact.
- Remove decimals from the Lämpötila counter for clearer progress tracking.
- Align shop translation interpolations with numeric ICU formatting and fix the Polta Maailma confirmation phrase typing error.

