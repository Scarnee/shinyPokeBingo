# Pokémon Bingo Generator

[![CI](https://github.com/Scarnee/shinyPokeBingo/actions/workflows/ci.yml/badge.svg)](https://github.com/Scarnee/shinyPokeBingo/actions/workflows/ci.yml)
[![CD](https://github.com/Scarnee/shinyPokeBingo/actions/workflows/cd.yml/badge.svg)](https://github.com/Scarnee/shinyPokeBingo/actions/workflows/cd.yml)
![Node](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38BDF8?logo=tailwindcss&logoColor=white)

Une application web full-stack pour générer des grilles de Bingo Pokémon personnalisées. L'utilisateur choisit une taille de grille, une ou plusieurs versions du jeu, une langue et un style de sprite — l'application récupère les données depuis PokéAPI, les mélange et affiche une grille de bingo interactive.

---

## Fonctionnalités

- **Tailles de grille personnalisées** — de 3×3 à 7×7
- **Toutes les générations** — Gen I à Gen IX, y compris les DLC et Légendes Z-A
- **Multilingue** — noms des Pokémon en EN, FR, DE, ES, IT, JA, KO, ZH
- **Noms de jeux localisés** — titres affichés dans la langue sélectionnée
- **Sprites chromatiques** — basculer entre artwork normal et chromatique sans recharger les données
- **Origine du jeu** — étiquette optionnelle indiquant le jeu d'origine de chaque Pokémon
- **Remplacement par cellule** — survoler une carte et cliquer sur ↺ pour échanger un Pokémon
- **Marquer les cellules** — cliquer sur une cellule pour la cocher/décocher
- **Export PDF** — `window.print()` avec CSS optimisé pour l'impression
- **Cache disque persistant** — réponses PokéAPI sauvegardées sur un volume Docker ; zéro appel externe après le premier démarrage
- **Entièrement responsive** — disposition sidebar bureau + tiroir bas sur mobile

---

## Stack Technique

| Couche | Technologie |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Axios |
| **Backend** | NestJS 10, TypeScript, Axios, prom-client |
| **Reverse Proxy** | Nginx |
| **Conteneurisation** | Docker, Docker Compose |
| **Gestionnaire de paquets** | pnpm (monorepo workspaces) |
| **CI/CD** | GitHub Actions → GHCR → EC2 (AWS) |
| **Monitoring** | Prometheus + Grafana |
| **API externe** | PokéAPI (`pokeapi.co`) — mise en cache après le premier appel |

---

## Structure du Monorepo

```
pokemon-bingo/
├── apps/
│   ├── backend/              # API REST NestJS
│   │   └── src/
│   │       ├── bingo/        # Logique de génération de grille
│   │       ├── pokeapi/      # Client PokéAPI + cache disque
│   │       └── metrics/      # Endpoint Prometheus /metrics
│   └── frontend/             # Application React + Vite
│       └── src/
│           ├── api/          # Appels API Axios
│           └── components/   # BingoGrid, BingoCell, GameSelector…
├── docker/
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
├── monitoring/
│   ├── prometheus.yml
│   └── grafana/provisioning/
├── nginx/
│   └── nginx.conf
├── scripts/
│   └── init-letsencrypt.sh   # Assistant de configuration HTTPS
├── .github/workflows/
│   ├── ci.yml                # Build + vérification Docker
│   └── cd.yml                # Build → GHCR → déploiement EC2
├── docker-compose.yml        # Développement local
├── docker-compose.prod.yml   # Production (images GHCR)
└── pnpm-workspace.yaml
```

---

## Développement Local

### Prérequis
- Node.js 20+
- pnpm (`npm install -g pnpm`)

```bash
# Installer toutes les dépendances du workspace
pnpm install

# Démarrer le backend (http://localhost:3000)
pnpm dev:backend

# Démarrer le frontend (http://localhost:5173) — dans un second terminal
pnpm dev:frontend
```

Le serveur de développement Vite proxifie automatiquement les appels `/api` vers le backend.

---

## Docker (Mode Production)

```bash
# Build et démarrage de tout en local
docker compose up --build

# Application disponible sur http://localhost
# Grafana sur http://localhost/grafana (admin / admin)
```

Variables d'environnement (copier depuis `.env.example`) :

| Variable | Description | Valeur par défaut |
|---|---|---|
| `PORT` | Port HTTP du backend | `3000` |
| `CACHE_DIR` | Chemin du cache disque (volume monté) | `/app/cache` |
| `POKEAPI_BASE_URL` | Remplacer par une instance PokéAPI auto-hébergée | `https://pokeapi.co/api/v2` |
| `GRAFANA_PASSWORD` | Mot de passe admin Grafana | `admin` |

---

## Pipeline CI/CD

### CI — `.github/workflows/ci.yml`

Déclenché à chaque push sur `main`/`develop` et sur les PR vers `main`.

```
push → Build Backend (pnpm + tsc)
     → Build Frontend (pnpm + vite build)
     → Vérification Docker Build (sans push)
```

### CD — `.github/workflows/cd.yml`

Déclenché uniquement sur les push vers `main`.

```
push main
  │
  ├─ Build & push backend  ──► ghcr.io/scarnee/pokemon-bingo-backend:<sha>
  ├─ Build & push frontend ──► ghcr.io/scarnee/pokemon-bingo-frontend:<sha>
  │
  ├─ envsubst docker-compose.prod.yml → injection des tags d'image exacts avec le SHA
  ├─ SCP du fichier compose vers EC2 (/opt/pokemon-bingo/)
  │
  └─ SSH dans EC2
       docker login ghcr.io
       docker compose pull
       docker compose up -d --remove-orphans
       docker image prune -f
```

**Secrets GitHub Actions requis :**

| Secret | Valeur |
|---|---|
| `SERVER_HOST` | IP publique de l'EC2 |
| `SERVER_USER` | `ec2-user` (Amazon Linux) |
| `SERVER_SSH_KEY` | Contenu du fichier `.pem` |

Les images sont taguées avec `:latest` et le SHA du commit, permettant un rollback facile :
```bash
# Revenir à la version précédente
docker compose pull ghcr.io/scarnee/pokemon-bingo-backend:<sha-precedent>
```

---

## Points Forts DevOps

- **Monorepo** avec pnpm workspaces — outillage partagé, déploiements indépendants
- **Builds Docker multi-étapes** — images de production minimales (pattern builder + runner)
- **Layer caching** en CI avec le cache GitHub Actions (`cache-from/cache-to: type=gha`)
- **Tags d'image immuables** — chaque déploiement tagué avec le SHA du commit pour la traçabilité et le rollback
- **Déploiements sans interruption** — `docker compose up -d --remove-orphans`
- **Volume persistant** pour le cache API — survit aux redémarrages et redéploiements des conteneurs
- **URL API configurable** (`POKEAPI_BASE_URL`) — permet l'auto-hébergement de PokéAPI sans modification du code
- **Reverse proxy Nginx** — point d'entrée unique, route `/api` vers le backend, `/grafana` vers Grafana
- **Prometheus + Grafana** — stack d'observabilité en production avec datasource provisionnée
- **CSS prêt pour l'impression** — `@media print` masque l'interface pour un export PDF propre
