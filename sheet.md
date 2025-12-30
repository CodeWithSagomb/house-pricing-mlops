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
