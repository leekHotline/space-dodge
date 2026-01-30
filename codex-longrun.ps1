param(
  [string]$SpecPath = "docs\SPACE_DODGE_REFACTOR.md",
  # 默认用 build 当闸门更稳：vitest 未接入时 pnpm test 可能失败
  [string]$TestCmd  = "pnpm -s build",
  [string]$Branch   = "codex/longrun",
  [int]$MaxLoops    = 999
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# --- Ensure UTF-8 console output to avoid mojibake on Windows ---
chcp 65001 | Out-Null
$OutputEncoding = [Console]::OutputEncoding = [Text.UTF8Encoding]::new()

function Require-Cmd($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Missing command: $name. Please install it or add to PATH."
  }
}

Require-Cmd git
Require-Cmd codex
Require-Cmd node
Require-Cmd npm

if (-not (Test-Path $SpecPath)) { throw "Spec file not found: $SpecPath" }

# Must be inside a git repo
git rev-parse --is-inside-work-tree | Out-Null

# Safer branch checkout (avoid force-resetting history)
# Safer branch checkout (ignore "Already on branch" stderr)
$oldPref = $ErrorActionPreference
$ErrorActionPreference = "Continue"

git checkout $Branch 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  git checkout -b $Branch 2>$null | Out-Null
}

$ErrorActionPreference = $oldPref


# Make a log dir
$logDir = ".codex_logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

Write-Host "==> Using spec: $SpecPath"
Write-Host "==> Gate command: $TestCmd"
Write-Host "==> Branch: $Branch"
Write-Host "==> Logs: $logDir"
Write-Host ""

function Run-Gate([string]$cmd) {
  Write-Host "🧪 Running gate: $cmd"
  # Use cmd /c so &&, quoting, multi-commands work consistently on Windows
  cmd /c $cmd
  if ($LASTEXITCODE -ne 0) {
    throw "Gate failed: $cmd"
  }
}

function Get-NextMilestone([string]$specText) {
  # Find first unchecked milestone: "- [ ] ..."
  $m = [regex]::Match(
    $specText,
    '^\s*-\s*\[\s\]\s*(.+)$',
    [System.Text.RegularExpressions.RegexOptions]::Multiline
  )
  if ($m.Success) { return $m.Groups[1].Value.Trim() }
  return $null
}

function Mark-FirstMilestoneDone([string]$specText) {
  # Mark ONLY the first unchecked box as checked
  return [regex]::Replace(
    $specText,
    '(^\s*-\s*)\[\s\]\s*(.+)$',
    { param($match) return "$($match.Groups[1].Value)[x] $($match.Groups[2].Value)" },
    1,
    [System.Text.RegularExpressions.RegexOptions]::Multiline
  )
}

function Resolve-CodexEntry() {
  $npmRoot = (npm root -g).Trim()
  $candidates = @(
    (Join-Path $npmRoot "@openai\codex\bin\codex.js"),
    (Join-Path $npmRoot "@openai\codex\bin\codex.mjs"),
    (Join-Path $npmRoot "@openai\codex\bin\codex")
  )

  $entry = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
  if (-not $entry) {
    throw "Cannot find Codex JS entry under global npm root: $npmRoot"
  }
  return $entry
}

$codexEntry = Resolve-CodexEntry
Write-Host "==> Codex entry: $codexEntry"
Write-Host ""

for ($i = 1; $i -le $MaxLoops; $i++) {

  $spec = Get-Content -Raw -Path $SpecPath

  $milestone = Get-NextMilestone $spec
  if (-not $milestone) {
    Write-Host "✅ No remaining unchecked milestones. Done."
    exit 0
  }

  $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
  $logPath   = Join-Path $logDir "run_${timestamp}.log"
  $stderrPath = Join-Path $logDir "stderr_${timestamp}.log"
  $promptPath = Join-Path $logDir "prompt_${timestamp}.txt"
  $specSnapPath = Join-Path $logDir "spec_${timestamp}.md"

  # Snapshot the spec used for this run (debugging/repro)
  [System.IO.File]::WriteAllText($specSnapPath, $spec, [System.Text.UTF8Encoding]::new($false))

  Write-Host "=============================="
  $milestoneOneLine = ($milestone -replace '\s+', ' ').Trim()
if ($milestoneOneLine.Length -gt 120) { $milestoneOneLine = $milestoneOneLine.Substring(0,120) + "..." }
Write-Host "➡️  Next milestone: $milestoneOneLine"

  Write-Host "🕒  Start: $timestamp"
  Write-Host "=============================="

  $prompt = @"
  You are allowed to edit files in this repository (writes are permitted).
Do not claim that file writes are blocked. Apply changes directly.

Design Gate override:
If AGENTS.md says you must ask questions first, ask at most ONE short question only if absolutely required.
Otherwise proceed with the smallest safe change and run the gate.

You are an autonomous coding agent working inside a git repository.

Global rules:
- Work only in this repo.
- Keep changes minimal and safe.
- Focus ONLY on the current milestone.
- After implementing, run the gate command exactly with: $TestCmd
- If the gate fails, fix and rerun until pass, or stop with a clear report.
- Do NOT start the next milestone. The runner script will handle progression.
- Update code + docs as needed, but do not embed this runner script inside the spec.

Current milestone:
$milestone

Full spec (source of truth):
--------------------------------
$spec
--------------------------------

Now implement the current milestone.
When you think it's done:
1) Ensure the gate passes using: $TestCmd
2) Summarize changes and any risks.
3) Do not mark the checkbox; the script will mark it after gate passes.
"@

  # Write prompt as UTF-8 (no BOM) to avoid mojibake
  [System.IO.File]::WriteAllText($promptPath, $prompt, [System.Text.UTF8Encoding]::new($false))

  # --- Run codex exec robustly on Windows (bypass codex.ps1 wrapper) ---
    # --- Run codex exec (PowerShell treats some stderr as errors when ErrorActionPreference=Stop) ---
  $oldPref2 = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    Get-Content -Raw -Path $promptPath | & node $codexEntry exec 2> $stderrPath | Tee-Object -FilePath $logPath
  } finally {
    $ErrorActionPreference = $oldPref2
  }

  # If codex returned non-zero, stop (do not proceed to gate)
  if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Codex exec failed (exit=$LASTEXITCODE). See: $stderrPath"
    Write-Host "   Also see: $logPath"
    exit 3
  }


  if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Codex exec failed (exit=$LASTEXITCODE). See: $stderrPath"
    Write-Host "   Also see: $logPath"
    exit 3
  }

  # Gate (build/lint/typecheck/test)
  try {
    Run-Gate $TestCmd
  } catch {
    Write-Host "❌ Gate failed. Stopping."
    Write-Host "   Log: $logPath"
    Write-Host "   Stderr: $stderrPath"
    Write-Host $_.Exception.Message

    # Helpful debugging info
    Write-Host ""
    Write-Host "== git status =="
    git status

    Write-Host ""
    Write-Host "== git diff (first 200 lines) =="
    $diff = git diff
    $diffLines = $diff -split "`n"
    $diffLines | Select-Object -First 200 | ForEach-Object { $_ }

    exit 2
  }

  Write-Host "✅ Gate passed. Marking milestone as done in $SpecPath"

  $specUpdated = Mark-FirstMilestoneDone $spec
  Set-Content -Path $SpecPath -Value $specUpdated -NoNewline

  git add -A | Out-Null
  $msg = "milestone: $milestone"
  $commitOut = git commit -m $msg 2>&1
  Write-Host $commitOut

  Write-Host "✅ Committed: $msg"
  Write-Host "➡️  Continuing to next milestone..."
  Write-Host ""
}

Write-Host "Reached MaxLoops=$MaxLoops. Exiting."
exit 0
