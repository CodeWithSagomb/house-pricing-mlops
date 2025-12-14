import json

import requests

url = "http://0.0.0.0:8000/predict"
headers = {"X-API-KEY": "secret", "Content-Type": "application/json"}

payload = {
    "MedInc": 8.3252,
    "HouseAge": 41.0,
    "AveRooms": 6.984,
    "AveBedrms": 1.023,
    "Population": 322.0,
    "AveOccup": 2.55,
    "Latitude": 37.88,
    "Longitude": -122.23,
}

try:
    response = requests.post(url, headers=headers, json=payload)
    print(f"Status Code: {response.status_code}")
    print("Response Body:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
