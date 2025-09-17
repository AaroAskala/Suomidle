# Changelog

## [Unreleased]
### Added
- Configure deployments to publish the `aaroonparas.com` CNAME record.
- Automatically migrate saved games and settings from the legacy GitHub Pages
  origin to the new `aaroonparas.com` domain.
### Fixed
- Ensure the legacy migration overwrites any new-domain saves once so existing
  progress from GitHub Pages wins.
- Block the initial render until the legacy data migration completes so
  existing progress appears immediately.
