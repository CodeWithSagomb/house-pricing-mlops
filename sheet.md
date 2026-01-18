Robustesse : pydantic-settings empêche l'app de démarrer si la config est pourrie.
Modularité : service.py isole la logique ML. On peut changer FastAPI par Flask demain sans toucher au ML.
Performance : Utilisation de BackgroundTasks pour sortir les logs du chemin critique. Le client n'attend pas la base de données.
Optimisation Docker : Multi-stage build pour réduire la surface d'attaque et la taille.

Prometheus

# CPU Usage %
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
	-0.507109812685755

# Memory Usage %
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Container Memory (MB)
container_memory_usage_bytes{name=~"mlops.*"} / 1024 / 1024

# API Latency P95 (ms)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) * 1000

# PostgreSQL Database Size (MB)
pg_database_size_bytes / 1024 / 1024

############################################
cd actions-runner
export RUNNER_ALLOW_RUNASROOT=1
./run.sh

###########################################################################"

Ce que l'Authentification User Permet d'Accéder
Actuellement, l'authentification donne accès à :

🔓 Fonctionnalités Actuelles
Fonctionnalité	Description	Protégé
Historique des prédictions	/history - Voir toutes vos prédictions passées	✅ Oui
Profil utilisateur	/auth/me - Voir vos informations	✅ Oui
Session persistante	Token JWT stocké dans localStorage	✅ Oui
🔐 Ce qui N'EST PAS encore protégé
Fonctionnalité	Status
Dashboard	🟡 Accessible à tous
Prédictions (/predict)	🟡 Protégé par API Key, pas par user
Monitoring	🟡 Accessible à tous
Models	🟡 Accessible à tous
💡 Extensions Possibles
Si tu veux, on peut étendre l'authentification pour :

Lier les prédictions à l'utilisateur - Sauvegarder chaque prédiction dans l'historique de l'utilisateur connecté
Protéger certaines pages - Rediriger vers login si non authentifié
Rôles/Permissions - Admin vs User vs Viewer
Quotas - Limiter le nombre de prédictions par utilisateur
Veux-tu que j'implémente l'une de ces extensions ?
