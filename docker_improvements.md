# Rapport d'Optimisation Docker ("Industrial Grade")

Transformation de `Dockerfile` et `.dockerignore` pour respecter les standards de production bancaires/industriels. Voici les axes d'amélioration appliqués :

## 1. Sécurité (Security Hardening)
*   **Utilisateur Non-Root** : L'application tourne sous `appuser` (UID 1000). Si un attaquant compromet l'API, il n'est pas root sur le conteneur.
*   **Base Image Pinnée** : Utilisation de `python:3.12-slim-bookworm`. "bookworm" est la version stable de Debian 12, garantissant que votre image ne change pas sous vos pieds.
*   **Suppression de `curl`** : Le Healthcheck utilise maintenant un script Python natif (`http.client`). Cela évite d'installer `curl`, réduisant la surface d'attaque et la taille de l'image.
*   **Secrets Exclus** : Le `.dockerignore` bloque explicitement `.env` et `.env.*` pour empêcher la fuite accidentelle de clés API dans l'image.

## 2. Performance & Taille (Layer Optimization)
*   **Multi-Stage Build** : L'étape `builder` compile tout, l'étape `runner` ne garde que le strict nécessaire. Pas de Poetry, pas de GCC/Make dans l'image finale.
*   **Pip Cache** : Ajout de `--mount=type=cache` pour que les rebuilds locaux soient instantanés si les dépendances ne changent pas.
*   **Copy Stratégique** : On copie `config/` avant `src/`. Si vous modifiez `app.py`, Docker ne réinvalide pas le layer de config.

## 3. Ops & Gestion (Volumes & Vars)
*   **Volumes** : J'ai ajouté `VOLUME ["/app/logs"]`. Vous pouvez monter un volume ici pour persister les logs JSON sans polluer le conteneur.
*   **Variables** : Les `ENV` (comme `MLFLOW_TRACKING_URI`) sont déclarées explicitement, servant de documentation pour les équipes Ops/DevOps.
*   **Healthcheck Intégré** : Kubernetes ou Docker Swarm sauront automatiquement si l'API est en bonne santé.

## Usage Recommandé
```bash
# Build (rapide grâce au cache)
docker build -t house-pricing-api:prod -f src/house_pricing/api/Dockerfile .

# Run (avec logs montés et override de config)
docker run -d \
  -p 8000:8000 \
  -v $(pwd)/logs:/app/logs \
  -e API_KEY="votre_cle_prod" \
  --name api-prod \
  house-pricing-api:prod
```
