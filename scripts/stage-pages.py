#!/usr/bin/env python3
"""Build a minimal, explicit GitHub Pages artifact. Never upload the checkout."""
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / "dist-pages"
# Explicit inventory: changes to the public surface require a reviewed edit here.
FILES = [
    "index.html", "privacy.html", "athlete-applied-cases.js", "auth-config.js",
    "judge-admission-exam-v3.js", "judge-admission-v2.css",
    "judge-course-engine.js", "judge-exam-foundations-v2.js",
    "judge-exam-independent.js", "judge-exam-sanctions-v3.js",
    "judge-foundations.css", "judge-foundations.js",
    "judge-program-admission-v2.js", "judge-program-admission.js",
    "judge-program-beach.js", "judge-program-bout.js",
    "judge-program-bridge.js", "judge-program-combat.js",
    "judge-program-demo.js", "judge-program-infrastructure.js",
    "judge-program-officials.js", "judge-program-participants.js",
    "judge-program-practicum.js", "judge-program-sanctions.js",
    "judge-program-scoring.js", "progress.js",
    "sambo-approved-design.webp",
    "file_00000000971882109163ea0f0fd1f4ec.png",
    "file_00000000c24881f49c47907dfde1ca86.png",
    "file_00000000eab481f48bdfaff4ae2a9c24.png",
    "i (1).jpeg",
]

# Fail closed while public exam bundles contain answer keys. A manifest is not
# authorization to expose independent exam answers. Remove this gate only after
# server-side assessment and a reviewed public-asset audit.
BLOCKED_EXAM_ASSETS = {
    "judge-exam-independent.js",
    "judge-admission-exam-v3.js",
    "judge-exam-foundations-v2.js",
    "judge-exam-sanctions-v3.js",
}

def main():
    exposed = set(FILES) & BLOCKED_EXAM_ASSETS
    if exposed:
        raise RuntimeError("Release blocked: client-side exam answer bundles: " + ", ".join(sorted(exposed)))
    # Validate all sources before touching an existing staged artifact.
    for name in FILES:
        source = ROOT / name
        if not source.is_file() or source.is_symlink():
            raise RuntimeError(f"Missing or unsafe public asset: {name}")
    if DEST.exists():
        if DEST.is_symlink() or not DEST.is_dir():
            raise RuntimeError("Unsafe output directory")
        shutil.rmtree(DEST)
    DEST.mkdir()
    for name in FILES:
        source = ROOT / name
        shutil.copyfile(source, DEST / name)
    actual = {p.name for p in DEST.iterdir()}
    if actual != set(FILES) or any(p.is_symlink() for p in DEST.iterdir()):
        raise RuntimeError("Public artifact manifest mismatch")
    print(f"Staged {len(FILES)} explicitly approved paths; no repository metadata or docs.")

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(exc, file=sys.stderr)
        sys.exit(1)
