Robustesse : pydantic-settings empêche l'app de démarrer si la config est pourrie.
Modularité : service.py isole la logique ML. On peut changer FastAPI par Flask demain sans toucher au ML.
Performance : Utilisation de BackgroundTasks pour sortir les logs du chemin critique. Le client n'attend pas la base de données.
Optimisation Docker : Multi-stage build pour réduire la surface d'attaque et la taille.