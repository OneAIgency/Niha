#!/usr/bin/env python3
"""
Multi-Agent Quality Assurance System
====================================

Architecture:
- Coordinator: Runs linter, parses errors, assigns tasks to file agents.
- FileAgent: Manages edits for a specific file to prevent race conditions.
- Specialized Sub-Agents:
    - UnusedVarAgent (F841): Transforms 'var = expr' -> 'expr'
    - LineLengthAgent (E501): Breaks long lines at safe points.

Usage:
    cd backend
    python scripts/fix_quality_agents.py
"""

import asyncio
import json
import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Tuple

# ==============================================================================
# Domain Objects
# ==============================================================================


class QualityIssue:
    def __init__(self, file_path: str, line: int, col: int, code: str, message: str):
        self.file_path = file_path
        self.line = line  # 1-indexed
        self.col = col  # 1-indexed
        self.code = code
        self.message = message


# ==============================================================================
# Agents
# ==============================================================================


class BaseFixerAgent:
    def apply(self, lines: List[str], issues: List[QualityIssue]) -> bool:
        """Applies fixes to lines. Returns True if changes were made."""
        raise NotImplementedError


class UnusedVarAgent(BaseFixerAgent):
    """
    Fixes F841: Local variable assigned but never used.
    Strategy: Remove the assignment part, keeping the expression.
    Ex: 'x = await foo()' -> 'await foo()'
    """

    def apply(self, lines: List[str], issues: List[QualityIssue]) -> bool:
        changes_made = False
        # Sort issues reverse by line to avoid index shifting problems if we were removing lines (we aren't, but good practice)
        # Actually we are modifying lines in place.

        target_issues = [i for i in issues if i.code == "F841"]

        for issue in target_issues:
            idx = issue.line - 1
            if idx >= len(lines):
                continue

            line = lines[idx]

            # Regex to capture "  var = expr" or "  var: Type = expr"
            # We want to keep indent and expr.

            # Pattern: (indent)(var_name)(type_hint?)\s*=\s*(expr)
            match = re.match(r"^(\s*)([\w_]+)(?:\s*:\s*[\w\[\], ]+)?\s*=\s*(.+)$", line)

            if match:
                indent, var_name, expression = (
                    match.group(1),
                    match.group(2),
                    match.group(3),
                )

                # Check if the variable name matches the one in the error message usually?
                # Ruff message: "Local variable `settlement1` is assigned to but never used"
                # We can verify extraction from message

                var_from_msg = re.search(r"`([^`]+)`", issue.message)
                if var_from_msg and var_from_msg.group(1) != var_name:
                    # Heuristic mismatch, skip to be safe
                    continue

                # Apply fix
                lines[idx] = f"{indent}{expression}"
                changes_made = True
                print(
                    f"  [UnusedVarAgent] Fixed line {issue.line}: Removed '{var_name} ='"
                )

        return changes_made


class LineLengthAgent(BaseFixerAgent):
    """
    Fixes E501: Line too long.
    Strategy: Attempt to break lines at parenthesis, commas, or operators.
    """

    def apply(self, lines: List[str], issues: List[QualityIssue]) -> bool:
        changes_made = False
        target_issues = [i for i in issues if i.code == "E501"]

        for issue in target_issues:
            idx = issue.line - 1
            if idx >= len(lines):
                continue

            line = lines[idx]
            if len(line) <= 88:
                continue  # Already fixed or false positive

            # Strategy 1: Break function call / definition
            # func(arg1, arg2) -> func(\n    arg1,\n    arg2\n)
            # This is hard to do perfectly with regex, we'll try a simpler 'paren-wrap' strategy for asserts/returns

            # Strategy 2: Assertions with long lines
            # assert foo == bar -> assert foo == (\n    bar\n)
            if (
                line.strip().startswith("assert ")
                and " == " in line
                and not line.strip().endswith(")")
            ):
                match = re.match(r"^(\s*assert .+? == )(.+)$", line)
                if match:
                    prefix, rest = match.group(1), match.group(2)
                    new_indent = " " * (len(line) - len(line.lstrip()) + 4)

                    # Wrap the rest in parens
                    lines[idx] = f"{prefix}(\n{new_indent}{rest}\n{new_indent[:-4]})"
                    changes_made = True
                    print(
                        f"  [LineLengthAgent] Fixed line {issue.line}: Wrapped assert in parens"
                    )
                    continue

        return changes_made


# ==============================================================================
# Coordinator
# ==============================================================================


class Coordinator:
    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)
        self.issues_by_file: Dict[str, List[QualityIssue]] = defaultdict(list)

    async def analyze(self):
        """Runs ruff to get current issues"""
        print("🔍 Coordinator: analyzing codebase with ruff...")
        try:
            # Run ruff check with json output
            # We select specific codes we want to fix
            cmd = [
                "../backend/venv/bin/ruff",
                "check",
                ".",
                "--select",
                "F841,E501",
                "--output-format",
                "json",
            ]
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=self.root_dir,
            )
            stdout, stderr = await process.communicate()

            if stdout:
                data = json.loads(stdout.decode())
                for item in data:
                    issue = QualityIssue(
                        file_path=item["filename"],
                        line=item["location"]["row"],
                        col=item["location"]["column"],
                        code=item["code"],
                        message=item["message"],
                    )
                    self.issues_by_file[issue.file_path].append(issue)

            print(
                f"📊 Analysis complete. Found issues in {len(self.issues_by_file)} files."
            )

        except Exception as e:
            print(f"❌ Analysis failed: {e}")
            sys.exit(1)

    async def fix_file(self, file_path: str, issues: List[QualityIssue]):
        """Processes a single file with multiple agents"""
        abs_path = self.root_dir / file_path
        if not abs_path.exists():
            return

        try:
            content = abs_path.read_text(encoding="utf-8")
            lines = content.splitlines()
            len(lines)

            modified = False

            # Run agents
            # Note: Order matters. UnusedVar removes code, shortening lines. Run it first.
            agents = [UnusedVarAgent(), LineLengthAgent()]

            for agent in agents:
                if agent.apply(lines, issues):
                    modified = True

            if modified:
                # Write back
                abs_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
                print(f"✅ Fixed: {file_path}")

        except Exception as e:
            print(f"⚠️ Failed to process {file_path}: {e}")

    async def run(self):
        await self.analyze()

        if not self.issues_by_file:
            print("✨ No target issues found!")
            return

        print("🚀 Spawning agents...")
        tasks = []
        for file_path, issues in self.issues_by_file.items():
            tasks.append(self.fix_file(file_path, issues))

        await asyncio.gather(*tasks)
        print("🏁 All agents finished.")

        # Post-fix validation
        print("running ruff format...")
        subprocess.run(
            ["../backend/venv/bin/ruff", "format", "."], cwd=self.root_dir, check=False
        )


if __name__ == "__main__":
    coordinator = Coordinator(root_dir=".")
    asyncio.run(coordinator.run())
