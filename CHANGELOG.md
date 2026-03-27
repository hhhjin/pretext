# Changelog

All notable user-facing changes to this project will live here.

## Unreleased

## 0.0.1 - 2026-03-27

### Added

- A new `/demos/accordion` demo showing expand/collapse text panels whose body heights come from Pretext.

### Changed

- The `/demos/bubbles` demo now has clearer explanatory copy, a manual width control, and a tighter shrinkwrap comparison.
- Safari line breaking now has a clearer browser-specific policy path for narrow cases such as soft hyphen handling and breakable-run fitting.
- Browser automation scripts now choose a fresh page port by default, which avoids stale-page reuse across repeated accuracy, corpus, probe, Gatsby, and benchmark runs.
- Probe diagnostics now derive our candidate lines from the public rich layout API, so SHY and future custom-break behavior stay aligned with the actual library surface.
- `bun start` is now the stable demo server without Bun's watch client; `bun run start:watch` remains available when you explicitly want watch-mode reloads.

## 0.0.0 - 2026-03-26

Initial public npm release of `@chenglou/pretext`.

### Added

- `prepare()` and `layout()` as the core fast path for DOM-free multiline text height prediction.
- Rich layout APIs including `prepareWithSegments()`, `layoutWithLines()`, `layoutNextLine()`, and `walkLineRanges()` for custom rendering and manual layout.
- Browser accuracy, benchmark, and corpus tooling with checked-in snapshots and representative canaries.
- Public demos for bubble shrinkwrap, dynamic editorial layout, and text masonry.
