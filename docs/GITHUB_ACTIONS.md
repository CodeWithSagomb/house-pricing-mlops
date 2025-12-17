# Gestion des Runners GitHub Actions

Ce guide explique comment gérer les environnements d'exécution (Runners) pour votre pipeline CI/CD.

## 1. Runners Hébergés par GitHub (Par défaut)
Par défaut, le fichier `.github/workflows/ci.yml` utilise :
```yaml
runs-on: ubuntu-latest
```
Cela signifie que vos jobs s'exécutent sur des machines virtuelles gérées par GitHub (Azure Standard_DS2_v2). C'est idéal pour :
- Les tests unitaires/intégration légers.
- Le linting.
- Les builds Docker simples.

**Avantage** : Rien à gérer, toujours propre.
**Inconvénient** : Payant (après les minutes gratuites), pas de GPU, parfois lent.

## 2. Runners Auto-Hébergés (Self-Hosted)
Pour le MLOps (entraînement de modèles, accès GPU, ou accès sécurisé à votre infra interne), il est souvent nécessaire d'utiliser vos propres machines.

### Configuration

1.  Allez sur votre dépôt GitHub : **Settings** > **Actions** > **Runners**.
2.  Cliquez sur **New self-hosted runner**.
3.  Sélectionnez votre OS (Linux).
4.  Suivez les commandes affichées pour télécharger et configurer l'agent sur votre serveur.

Exemple (Linux x64) :
```bash
# Télécharger
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Configurer (Nécessite le token fourni par GitHub)
./config.sh --url https://github.com/votre-org/votre-repo --token A1B2C3...

# Lancer
./run.sh
```

### Utilisation dans le CI/CD

Une fois le runner enregistré avec le tag `self-hosted` (par défaut), modifiez `.github/workflows/ci.yml` :

```yaml
jobs:
  ci:
    runs-on: self-hosted  # <--- CHANGEMENT ICI
    steps:
      ...
```

### Bonne Pratique : Service Systemd
Pour que le runner se lance au démarrage du serveur :
```bash
sudo ./svc.sh install
sudo ./svc.sh start
sudo ./svc.sh status
```

## 3. Recommandation pour ce Projet
Pour l'instant, le pipeline utilise `ubuntu-latest`.
Si vous avez besoin d'accéder à votre MinIO local ou à un GPU spécifique pour les tests, passez en `self-hosted` en suivant les étapes ci-dessus.
