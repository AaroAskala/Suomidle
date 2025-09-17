# Changelog

## [Unreleased]
### Added
- Daily Tasks system with rotating objectives, persistent progress, and temporary Lämpötila buffs.
- Configure deployments to publish the `aaroonparas.com` CNAME record.
- Collapsible controls for the building, technology, tier, and Maailma shops.
- Automate GitHub Pages deployments for the main site and /dev/ preview with combined artifacts.
- Sticky HUD header with animated progress indicators, responsive resource summary, and interactive detail modals for buildings and technologies.

### Changed
- Hide the Maailma shop until Polta Maailma has been used at least once.
- Update the page title to display "suomidle" in browser tabs.
- Move the daily tasks list into a collapsible drawer beneath the settings menu and highlight ready-to-claim tasks.
- Replace building and technology PNG cards with SVG icon components, modal detail views, and a mobile-friendly responsive grid layout.


### Fixed
- Prevent GitHub Pages deployments from failing when promoting the root build into the combined artifact.
- Remove decimals from the Lämpötila counter for clearer progress tracking.

