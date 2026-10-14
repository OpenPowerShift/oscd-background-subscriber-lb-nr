# Upgrade plan: oscd-background-subscriber-lb-nr

Status: **Complete** · Branch: `upgrade` · 2026-10-14

This upgrade follows the plan of the SEL companion plugin,
[`oscd-background-subscriber-lb-sel/docs/plan.md`](https://github.com/OpenPowerShift/oscd-background-subscriber-lb-sel/blob/upgrade/docs/plan.md).
That plan holds:

- the target architecture,
- the companion protocol with Subscriber Later Binding (§2.2),
- the UI and test approach,
- the decisions taken (§10).

This document records only what is specific to NR Electric.

The package is `@openpowershift/oscd-background-subscriber-lb-nr`.

## 1. Shared with SEL and Siemens (copied verbatim)

- **Configs:** `package.json` scripts and devDependencies, `tsconfig.json`, `eslint.config.js`, `web-test-runner.config.js`, `lit-localize.json`, workflows, release-please, `.gitattributes`, `.gitignore`.
- **Companion core:** `src/companion/**`, including `protocol.ts`, a copy of Subscriber Later Binding's.
- **Test helpers:** `src/testing/{fixtures,scl,later-binding,sel}.ts`.
- **Demo:** `demo/index.html`, and `demo/plugins.js` apart from the plugin's name. The plugin is a `background` entry.

## 2. NR Electric rule (`src/foundation/value-quality.ts`)

When an input is subscribed to an FCDA:

- the next input is bound to the next FCDA,
- if the next input's internal address is the same except for its last part (after the last `.` or `/`), which is `q`,
- and if the next FCDA is the same data with `daName` `q`.

## 3. Gaps found and closed

| # | Finding | Fix |
|---|---|---|
| N1 | Addresses were split only on `.`. For an address without a `.`, both prefixes were empty, so any next input whose address ended in `q` matched. Real NR addresses, e.g. `1-A:MUGO/GOINGGIO1.SPCSO1.stVal`, do contain `.` | Split at the last `.` or `/`, and require the last part to be exactly `q`, with the value's not `q` |
| N2 | The next input was unsubscribed whatever it was bound to | The core unsubscribes only inputs bound to the expected data, and never overwrites |
| N3 | The fixture was a copy of the Siemens one with no NR IED | Use the SEL fixture, which has the NRR merging unit `NRR_PCS221S_001` with 32 later binding inputs |
| N4 | With auto-increment, Subscriber Later Binding moved to the quality input and unsubscribed it | Fixed in Subscriber Later Binding: auto-increment stops at an input which is now subscribed |
| N5 | An FCDA pair was accepted when the next FCDA was identical to the value | The next FCDA must be `q` and the value must not be |

The merging unit's inputs `SPCSO1`–`SPCSO4` have `pDO="Ind64"`, whose data type cannot be determined. Subscriber Later Binding therefore greys them out. This is left as it is for now, by decision. The specs use `SPCSO5`, which has no preferred attributes.

## 4. Worklog

- **2026-10-14:**
  - Scaffolded from SEL on branch `upgrade`, and ported and fixed the rule.
  - Translations: `de` and `pt` in `src/localization/`.
  - Verified with `npm run lint` (0 errors) and `npm test` (52 specs, 99.4% coverage, about 6 s).
  - Screenshot baselines are CI-owned: add the `update-visual-baselines` label to the PR.
  - The git remote is still `danyill/oscd-subscriber-lb-nr` and needs moving to OpenPowerShift.
- **2026-10-14, background plugin (user decision, as for SEL):**
  - The plugin has no UI and is registered as a `background` plugin.
  - It announces its name, description and features. Subscriber Later Binding lists it in its settings and turns it on or off.
  - The shared core now responds only when the plugin is in `enabledCompanions`.
  - Removed the dialog, the enabled setting, `theme.ts`, and the screenshot tests and their CI jobs.
  - Renamed from `oscd-menu-subscriber-lb-nr` to `oscd-background-subscriber-lb-nr` (package, file, class, tag, identity). The origin remote points at the renamed repository.

