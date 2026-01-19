#!/usr/bin/env python3
"""
Export model from MLflow to local files for cloud deployment.

This script exports the current champion model and preprocessor
to local files that can be embedded in the Docker image for Render.

Usage:
    python scripts/export_model_for_render.py
"""

import json
import shutil
import sys
from pathlib import Path

import joblib
import mlflow

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

# noqa: E402 - Must be after sys.path modification
from house_pricing.api.config import get_settings  # noqa: E402


def export_model():
    """Export model from MLflow to local directory."""
    settings = get_settings()

    # Output directory
    output_dir = Path("models/production")
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"🔌 Connecting to MLflow: {settings.MLFLOW_TRACKING_URI}")
    mlflow.set_tracking_uri(settings.MLFLOW_TRACKING_URI)
    client = mlflow.MlflowClient()

    # Get model by alias
    model_name = settings.MODEL_NAME
    alias = settings.MODEL_ALIAS

    try:
        # Try to get by alias first
        print(f"📦 Looking for model: {model_name}@{alias}")
        mv = client.get_model_version_by_alias(model_name, alias)
        version = mv.version
        source = "alias"
    except Exception:
        # Fallback to latest
        print("⚠️ Alias not found, getting latest version...")
        versions = client.search_model_versions(f"name='{model_name}'")
        if not versions:
            print(f"❌ No model found with name: {model_name}")
            return False
        mv = sorted(versions, key=lambda x: int(x.version), reverse=True)[0]
        version = mv.version
        source = "latest"

    print(f"✅ Found model version: {version} (source: {source})")

    # Load model
    model_uri = f"models:/{model_name}/{version}"
    print(f"📥 Loading model from: {model_uri}")
    model = mlflow.sklearn.load_model(model_uri)

    # Save model locally
    model_path = output_dir / "model.joblib"
    joblib.dump(model, model_path)
    print(f"💾 Model saved to: {model_path}")

    # Copy preprocessor
    preprocessor_src = Path(settings.PREPROCESSOR_PATH)
    preprocessor_dst = output_dir / "preprocessor.pkl"

    if preprocessor_src.exists():
        shutil.copy(preprocessor_src, preprocessor_dst)
        print(f"💾 Preprocessor copied to: {preprocessor_dst}")
    else:
        print(f"⚠️ Preprocessor not found at: {preprocessor_src}")

    # Save metadata
    metadata = {
        "model_name": model_name,
        "version": version,
        "source": source,
        "run_id": mv.run_id,
        "exported_at": str(Path(__file__).name),
    }

    metadata_path = output_dir / "metadata.json"
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"📋 Metadata saved to: {metadata_path}")

    print(f"\n✅ Export complete! Files in: {output_dir}/")
    print("   - model.joblib")
    print("   - preprocessor.pkl")
    print("   - metadata.json")

    return True


if __name__ == "__main__":
    success = export_model()
    sys.exit(0 if success else 1)
