# Changelog

## [Unreleased]
### Added
- Configure deployments to publish the `aaroonparas.com` CNAME record.
- Collapsible controls for the building, technology, tier, and Maailma shops.
- Automate GitHub Pages deployments for the main site and /dev/ preview with combined artifacts.

### Changed
- Hide the Maailma shop until Polta Maailma has been used at least once.
- Update the page title to display "suomidle" in browser tabs.
- Namespace persisted local storage keys by environment to isolate saves across deployments.


### Fixed
- Prevent GitHub Pages deployments from failing when promoting the root build into the combined artifact.
- Remove decimals from the Lämpötila counter for clearer progress tracking.

