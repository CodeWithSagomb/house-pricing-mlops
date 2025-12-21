"""
DataOps Pipeline - Versioning Step
====================================
DVC integration for data versioning with MinIO backend.
"""

import logging
import os
import subprocess

from house_pricing.dataops.base import PipelineContext, PipelineStep

logger = logging.getLogger(__name__)


class VersioningStep(PipelineStep):
    """
    Data versioning step using DVC.
    - Adds processed data to DVC tracking
    - Pushes to MinIO remote
    """

    def __init__(self, auto_push: bool = True):
        super().__init__("versioning")
        self.auto_push = auto_push

    def execute(self, context: PipelineContext) -> PipelineContext:
        """
        Version data artifacts with DVC.
        """
        auto_version = context.config.get("dataops", {}).get("auto_version", True)

        if not auto_version:
            self.logger.info("⏭️  Auto-versioning disabled, skipping.")
            context.add_metadata(self.name, {"skipped": True})
            return context

        artifacts = context.artifacts
        if not artifacts:
            self.logger.warning("⚠️ No artifacts to version.")
            context.add_metadata(self.name, {"error": "no_artifacts"})
            return context

        self.logger.info("📦 Versioning data with DVC...")

        # Files to track
        files_to_track = [
            artifacts.get("train_path"),
            artifacts.get("test_path"),
            artifacts.get("preprocessor_path"),
        ]
        files_to_track = [f for f in files_to_track if f and os.path.exists(f)]

        dvc_hashes = {}

        for file_path in files_to_track:
            try:
                # DVC add
                subprocess.run(
                    ["dvc", "add", file_path],
                    capture_output=True,
                    text=True,
                    check=True,
                )
                self.logger.info(f"   ✓ Added: {file_path}")

                # Get the .dvc file hash
                dvc_file = f"{file_path}.dvc"
                if os.path.exists(dvc_file):
                    with open(dvc_file, "r") as f:
                        content = f.read()
                        # Extract md5 hash from .dvc file
                        for line in content.split("\n"):
                            if "md5:" in line:
                                dvc_hashes[file_path] = line.split(":")[-1].strip()
                                break

            except subprocess.CalledProcessError as e:
                self.logger.warning(f"   ⚠️ DVC add failed for {file_path}: {e.stderr}")
            except FileNotFoundError:
                self.logger.warning("   ⚠️ DVC not installed, skipping versioning")
                context.add_metadata(self.name, {"error": "dvc_not_found"})
                return context

        # Push to remote if enabled
        if self.auto_push and dvc_hashes:
            try:
                self.logger.info("☁️  Pushing to MinIO remote...")
                subprocess.run(
                    ["dvc", "push"],
                    capture_output=True,
                    text=True,
                    check=True,
                )
                self.logger.info("   ✓ Pushed to remote successfully")
                push_success = True
            except subprocess.CalledProcessError as e:
                self.logger.warning(f"   ⚠️ DVC push failed: {e.stderr}")
                push_success = False
        else:
            push_success = False

        # Git add .dvc files
        try:
            dvc_files = [
                f"{f}.dvc" for f in files_to_track if os.path.exists(f"{f}.dvc")
            ]
            if dvc_files:
                subprocess.run(["git", "add"] + dvc_files, capture_output=True)
                self.logger.info(f"   ✓ Git staged: {len(dvc_files)} .dvc files")
        except Exception as e:
            self.logger.warning(f"   ⚠️ Git add failed: {e}")

        context.add_metadata(
            self.name,
            {
                "files_tracked": len(files_to_track),
                "dvc_hashes": dvc_hashes,
                "pushed_to_remote": push_success,
            },
        )

        return context
