#!/usr/bin/env python3
"""Regression tests for the explicit GitHub Pages artifact staging boundary."""
import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().with_name("stage-pages.py")
spec = importlib.util.spec_from_file_location("stage_pages", SCRIPT)
stage = importlib.util.module_from_spec(spec)
spec.loader.exec_module(stage)
# Preserve the production manifest before setUp replaces FILES for isolated tests.
RELEASE_FILES = tuple(stage.FILES)


class StagePagesTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.dest = self.root / "dist-pages"
        (self.root / "index.html").write_text("<title>Safe</title>", encoding="utf-8")
        (self.root / "app.js").write_text("console.log('safe')", encoding="utf-8")
        self.patches = [
            patch.object(stage, "ROOT", self.root),
            patch.object(stage, "DEST", self.dest),
            patch.object(stage, "FILES", ["index.html", "app.js"]),
        ]
        for item in self.patches:
            item.start()
            self.addCleanup(item.stop)

    def test_only_allowlisted_assets_are_staged(self):
        (self.root / "secret.txt").write_text("not public", encoding="utf-8")
        stage.main()
        self.assertEqual({p.name for p in self.dest.iterdir()}, {"index.html", "app.js"})
        self.assertFalse((self.dest / "secret.txt").exists())

    def test_all_known_exam_answer_bundles_block_release(self):
        # Each independent exam bundle must fail closed, even when listed alone.
        self.assertEqual(len(stage.BLOCKED_EXAM_ASSETS), 4)
        for filename in sorted(stage.BLOCKED_EXAM_ASSETS):
            with self.subTest(filename=filename):
                (self.root / filename).write_text(
                    "const questions = [{correct: 1}];", encoding="utf-8"
                )
                with patch.object(stage, "FILES", ["index.html", filename]):
                    with self.assertRaisesRegex(RuntimeError, "Release blocked"):
                        stage.main()
                self.assertFalse(self.dest.exists())

    def test_actual_release_manifest_is_blocked_until_server_exam_migration(self):
        # Unlike the isolated staging tests, this checks the unmodified release
        # manifest. A passing test suite must not be mistaken for a deployable site.
        actual_manifest = list(RELEASE_FILES)
        self.assertTrue(
            set(actual_manifest) & stage.BLOCKED_EXAM_ASSETS,
            "Review this release gate when the server-side exam migration lands",
        )
        with patch.object(stage, "FILES", actual_manifest):
            with self.assertRaisesRegex(RuntimeError, "Release blocked"):
                stage.main()
        self.assertFalse(self.dest.exists())

    def test_blocked_release_preserves_previous_staged_artifact(self):
        # A rejected production manifest must not destroy the last safe staging.
        stage.main()
        before = {p.name: p.read_bytes() for p in self.dest.iterdir()}
        with patch.object(stage, "FILES", list(RELEASE_FILES)):
            with self.assertRaisesRegex(RuntimeError, "Release blocked"):
                stage.main()
        after = {p.name: p.read_bytes() for p in self.dest.iterdir()}
        self.assertEqual(after, before)

    def test_removing_exam_files_from_manifest_does_not_bypass_html_gate(self):
        # A deploy that omits exam JS but keeps its script tags is still unsafe
        # and broken. Reject before replacing the last safe staged artifact.
        stage.main()
        before = {p.name: p.read_bytes() for p in self.dest.iterdir()}
        (self.root / "index.html").write_text(
            '<script src="judge-exam-independent.js"></script>', encoding="utf-8"
        )
        with self.assertRaisesRegex(RuntimeError, "HTML still references"):
            stage.main()
        after = {p.name: p.read_bytes() for p in self.dest.iterdir()}
        self.assertEqual(after, before)

    def test_unrelated_public_javascript_remains_allowed(self):
        stage.main()
        self.assertTrue((self.dest / "app.js").is_file())

    def test_manifest_rejects_path_traversal_and_duplicates(self):
        # An accidental manifest edit must not read or write outside the public root.
        for names in (
            ["index.html", "../outside.txt"],
            ["index.html", "/tmp/outside.txt"],
            ["index.html", "nested/file.js"],
            ["index.html", "..\\outside.txt"],
            ["index.html", "index.html"],
        ):
            with self.subTest(names=names):
                with patch.object(stage, "FILES", names):
                    with self.assertRaisesRegex(RuntimeError, "Unsafe or duplicate"):
                        stage.main()
                self.assertFalse(self.dest.exists())

    def test_missing_allowlisted_asset_fails(self):
        (self.root / "app.js").unlink()
        with self.assertRaisesRegex(RuntimeError, "Missing or unsafe"):
            stage.main()

    def test_missing_source_preserves_existing_staged_artifact(self):
        stage.main()
        marker = self.dest / "index.html"
        original = marker.read_text(encoding="utf-8")
        (self.root / "app.js").unlink()
        with self.assertRaisesRegex(RuntimeError, "Missing or unsafe"):
            stage.main()
        self.assertEqual(marker.read_text(encoding="utf-8"), original)
        self.assertTrue((self.dest / "app.js").exists())

    def test_symlinked_source_fails(self):
        (self.root / "app.js").unlink()
        (self.root / "app.js").symlink_to(self.root / "index.html")
        with self.assertRaisesRegex(RuntimeError, "Missing or unsafe"):
            stage.main()

    def test_symlinked_destination_fails_without_deleting_target(self):
        external = self.root / "external"
        external.mkdir()
        marker = external / "keep.txt"
        marker.write_text("keep", encoding="utf-8")
        self.dest.symlink_to(external, target_is_directory=True)
        with self.assertRaisesRegex(RuntimeError, "Unsafe output directory"):
            stage.main()
        self.assertEqual(marker.read_text(encoding="utf-8"), "keep")

    def test_restage_removes_unlisted_stale_files(self):
        stage.main()
        (self.dest / "stale.txt").write_text("stale", encoding="utf-8")
        stage.main()
        self.assertFalse((self.dest / "stale.txt").exists())


if __name__ == "__main__":
    unittest.main()
