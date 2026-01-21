#!/bin/bash
# ===========================================
# Render Startup Script
# Downloads model files if not present, then starts the API
# ===========================================

set -e

MODEL_DIR="/app/models/production"
DATA_DIR="/app/data/processed"

echo "🚀 Starting SAGOMBAYE API on Render..."

# Create directories
mkdir -p $MODEL_DIR
mkdir -p $DATA_DIR

# Check if model exists
if [ ! -f "$MODEL_DIR/model.joblib" ]; then
    echo "📥 Model not found, downloading..."

    # Check if MODEL_URL is set (should be set in Render environment)
    if [ -z "$MODEL_URL" ]; then
        echo "❌ ERROR: MODEL_URL environment variable not set!"
        echo "Please set MODEL_URL in Render dashboard to the URL of your model.joblib file."
        exit 1
    fi

    # Download model
    echo "Downloading model from: $MODEL_URL"
    curl -L -o "$MODEL_DIR/model.joblib" "$MODEL_URL"
    echo "✅ Model downloaded successfully!"
else
    echo "✅ Model already exists"
fi

# Check for preprocessor
if [ ! -f "$DATA_DIR/preprocessor.pkl" ]; then
    echo "📥 Preprocessor not found, downloading..."

    if [ -z "$PREPROCESSOR_URL" ]; then
        echo "⚠️ PREPROCESSOR_URL not set, will use local fallback"
    else
        curl -L -o "$DATA_DIR/preprocessor.pkl" "$PREPROCESSOR_URL"
        echo "✅ Preprocessor downloaded!"
    fi
fi

# Check for metadata
if [ ! -f "$MODEL_DIR/metadata.json" ]; then
    echo "📝 Creating default metadata..."
    echo '{"model_name": "HousePricing_random_forest", "version": "1", "source": "render_download"}' > "$MODEL_DIR/metadata.json"
fi

echo "🔌 Starting uvicorn server..."
exec uvicorn house_pricing.api.app:app --host 0.0.0.0 --port ${PORT:-8000}
