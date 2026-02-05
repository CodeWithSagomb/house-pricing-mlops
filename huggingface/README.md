---
title: SAGOMBAYE House Pricing API
emoji: 🏠
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# 🏠 SAGOMBAYE House Pricing API

Production-ready ML API for California house price prediction.

## 🚀 Features

- **FastAPI** backend with automatic documentation
- **Random Forest** model (R² = 0.8063)
- **Real-time predictions** via REST API
- **Health monitoring** endpoint

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/predict` | POST | Make prediction |
| `/docs` | GET | Swagger UI |

## 🔧 Usage

### Health Check
```bash
curl https://YOUR-SPACE.hf.space/health
```

### Prediction
```bash
curl -X POST https://YOUR-SPACE.hf.space/predict \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: demo-key" \
  -d '{
    "MedInc": 8.3252,
    "HouseAge": 41.0,
    "AveRooms": 6.98,
    "AveBedrms": 1.02,
    "Population": 322.0,
    "AveOccup": 2.55,
    "Latitude": 37.88,
    "Longitude": -122.23
  }'
```

## 📈 Model Performance

| Metric | Value |
|--------|-------|
| RMSE | 0.5038 |
| R² | 0.8063 |
| Algorithm | Random Forest |

## 🔗 Links

- **Frontend**: [Vercel Dashboard](https://sagombaye.vercel.app)
- **GitHub**: [CodeWithSagomb/house-pricing-mlops](https://github.com/CodeWithSagomb/house-pricing-mlops)

---

**Built with ❤️ by SAGOMBAYE**
