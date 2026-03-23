# ClawSearch Guard

[![npm version](https://img.shields.io/npm/v/clawsearch-guard)](https://www.npmjs.com/package/clawsearch-guard) [![license](https://img.shields.io/npm/l/clawsearch-guard)](https://opensource.org/licenses/MIT)

Pre-install security gate for AI agent skills. Blocks dangerous skills before installation.

## Install

```bash
npm install -g clawsearch-guard
```

Or use directly with npx:

```bash
npx clawsearch-guard check slack
```

## Usage

### Manual check

```bash
# Check a skill before installing
clawsearch-guard check slack
clawsearch-guard check crypto-trader
```

### Enable as Claude Code hook

```bash
# Enable — intercepts all skill installations
clawsearch-guard enable

# Disable
clawsearch-guard disable

# Check status
clawsearch-guard status
```

## How It Works

When enabled, every `clawhub install` is intercepted:

| Trust Score | Decision | Action |
|-------------|----------|--------|
| >= 0.7 | **ALLOW** | Auto-approved, safe to install |
| 0.4 - 0.7 | **WARN** | Shows warning, allows install |
| < 0.4 | **BLOCK** | Blocks installation, suggests alternatives |
| Not audited | **UNKNOWN** | Shows warning |

### Example output

```
 ClawSearch Security Check
 ────────────────────────────────────────
 Skill:  crypto-trader
 Trust:  ●●○○○ Suspicious (0.28)
 Result: ✗ BLOCK — Installation not recommended
 ────────────────────────────────────────
```

## Companion Tools

- [clawsearch](https://www.npmjs.com/package/clawsearch) — CLI for searching and comparing skills
- [ClawSearch](https://clawsearch.cc) — Web search engine with Trust Score
- [ClawSec](https://clawsec.cc) — 5-tier security audit with Firecracker sandbox

## Powered by

- API: https://api.clawsearch.cc
- 33,000+ skills indexed, 1,800+ audited with Trust Score as of 2026-03-23 (continuous auditing ~2,000/day)

## License

MIT
