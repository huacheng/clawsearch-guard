#!/usr/bin/env node
/**
 * ClawSearch Guard — Pre-install security gate for AI agent skills
 *
 * Usage:
 *   clawsearch-guard check <slug>           Check a skill before installing
 *   clawsearch-guard enable                 Enable as Claude Code hook
 *   clawsearch-guard disable                Disable the hook
 *   clawsearch-guard status                 Show current status
 *
 * As a hook, it intercepts skill installations and blocks dangerous ones.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const API = 'https://api.clawsearch.cc/api/v1';

const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', gray: '\x1b[90m',
};

// ─── Pre-install Check ───
async function checkSkill(slug) {
  slug = slug.replace(/^clawhub\//, '');

  const resp = await fetch(`${API}/pre-install-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug }),
  });

  if (resp.status === 429) {
    console.error(`${c.yellow}Rate limit reached. Allowing install.${c.reset}`);
    return 'allow';
  }

  const data = await resp.json();
  const score = data.trust_score || 0;
  const level = data.trust_level || 'unknown';
  const decision = data.decision || 'unknown';

  // Trust dots
  const config = {
    verified_safe: { dots: 5, color: c.green },
    mostly_safe: { dots: 4, color: c.blue },
    use_with_caution: { dots: 3, color: c.yellow },
    suspicious: { dots: 2, color: c.red },
    dangerous: { dots: 1, color: c.red },
    unknown: { dots: 0, color: c.gray },
  };
  const cfg = config[level] || config.unknown;
  const dots = `${cfg.color}${'\u25CF'.repeat(cfg.dots)}${c.dim}${'\u25CB'.repeat(5 - cfg.dots)}${c.reset}`;

  console.log(`\n ${c.bold}ClawSearch Security Check${c.reset}`);
  console.log(` ${'─'.repeat(40)}`);
  console.log(` Skill:  ${c.bold}${slug}${c.reset}`);
  console.log(` Trust:  ${dots} ${cfg.color}${level.replace(/_/g, ' ')}${c.reset} (${score})`);

  if (decision === 'allow') {
    console.log(` Result: ${c.green}\u2713 ALLOW${c.reset} — Safe to install`);
  } else if (decision === 'warn') {
    console.log(` Result: ${c.yellow}\u26A0 WARN${c.reset} — Proceed with caution`);
  } else if (decision === 'block') {
    console.log(` Result: ${c.red}\u2717 BLOCK${c.reset} — Installation not recommended`);
    console.log(`\n ${c.dim}Run: clawsearch alternatives ${slug}${c.reset}`);
  } else {
    console.log(` Result: ${c.gray}? UNKNOWN${c.reset} — Not yet audited`);
  }

  console.log(` ${'─'.repeat(40)}\n`);
  return decision;
}

// ─── Hook Management ───
function getSettingsPath() {
  return join(homedir(), '.claude', 'settings.json');
}

function readSettings() {
  const path = getSettingsPath();
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return {};
  }
}

function writeSettings(settings) {
  const path = getSettingsPath();
  writeFileSync(path, JSON.stringify(settings, null, 2));
}

function enableHook() {
  const settings = readSettings();
  if (!settings.hooks) settings.hooks = {};
  if (!settings.hooks['skill:pre-install']) settings.hooks['skill:pre-install'] = [];

  const hookCmd = 'clawsearch-guard check $SKILL_SLUG';
  const exists = settings.hooks['skill:pre-install'].some(
    h => (typeof h === 'string' ? h : h.command) === hookCmd
  );

  if (exists) {
    console.log(`${c.green}\u2713 ClawSearch Guard already enabled${c.reset}`);
    return;
  }

  settings.hooks['skill:pre-install'].push({
    command: hookCmd,
    blocking: true,
    description: 'ClawSearch pre-install security check',
  });

  writeSettings(settings);
  console.log(`${c.green}\u2713 ClawSearch Guard enabled${c.reset}`);
  console.log(`${c.dim}Hook added to ${getSettingsPath()}${c.reset}`);
}

function disableHook() {
  const settings = readSettings();
  if (!settings.hooks?.['skill:pre-install']) {
    console.log(`${c.dim}No hook to remove${c.reset}`);
    return;
  }

  settings.hooks['skill:pre-install'] = settings.hooks['skill:pre-install'].filter(
    h => !(typeof h === 'string' ? h : h.command).includes('clawsearch-guard')
  );

  writeSettings(settings);
  console.log(`${c.yellow}\u2717 ClawSearch Guard disabled${c.reset}`);
}

function showStatus() {
  const settings = readSettings();
  const hooks = settings.hooks?.['skill:pre-install'] || [];
  const active = hooks.some(
    h => (typeof h === 'string' ? h : h.command || '').includes('clawsearch-guard')
  );

  console.log(`\n ${c.bold}ClawSearch Guard Status${c.reset}`);
  console.log(` Active: ${active ? `${c.green}YES` : `${c.red}NO`}${c.reset}`);
  console.log(` Settings: ${getSettingsPath()}`);
  console.log(` API: ${API}\n`);
}

// ─── Help ───
function showHelp() {
  console.log(`
 ${c.bold}ClawSearch Guard${c.reset} — Pre-install Security Gate

 ${c.bold}Commands:${c.reset}
   clawsearch-guard check <slug>   Check skill safety before install
   clawsearch-guard enable         Add as Claude Code pre-install hook
   clawsearch-guard disable        Remove the hook
   clawsearch-guard status         Show guard status

 ${c.bold}How it works:${c.reset}
   When enabled, every skill installation is intercepted:
     Score >= 0.7  ${c.green}\u2713 ALLOW${c.reset}  — auto-approved
     Score 0.4-0.7 ${c.yellow}\u26A0 WARN${c.reset}   — shows warning
     Score < 0.4   ${c.red}\u2717 BLOCK${c.reset}  — blocks installation
`);
}

// ─── Main ───
const args = process.argv.slice(2);
const cmd = args[0];

(async () => {
  try {
    if (!cmd || cmd === '--help' || cmd === '-h') {
      showHelp();
    } else if (cmd === 'check' && args[1]) {
      const decision = await checkSkill(args[1]);
      // Exit code: 0 = allow/warn, 1 = block
      process.exit(decision === 'block' ? 1 : 0);
    } else if (cmd === 'enable') {
      enableHook();
    } else if (cmd === 'disable') {
      disableHook();
    } else if (cmd === 'status') {
      showStatus();
    } else {
      showHelp();
    }
  } catch (e) {
    console.error(`${c.red}Error: ${e.message}${c.reset}`);
    process.exit(0); // Don't block on errors
  }
})();
