# Changelog

## [Unreleased]
### Added
- Daily task panel alongside the HUD including progress tracking, reward claiming, and localized messaging.
- Toast notifications for task completion, reward claims, and buff lifecycle events.
- Responsive styling for the HUD and daily task layout including active buff timers.
- Deterministic unit tests covering weighted daily task selection, streak evaluation, and reward claiming behaviour.
### Changed
- Population-per-second and click rewards now apply stacked temporary gain buffs that persist across sessions, recalculate on state changes, and automatically expire.
