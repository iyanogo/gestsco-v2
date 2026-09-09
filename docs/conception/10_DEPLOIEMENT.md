# 10 - Déploiement & Exploitation

## 1. Architecture production cible

```
Internet
    │
    ▼
┌─────────────┐
│   Nginx     │  SSL termination, static files, reverse proxy
│   :443      │
└──┬──────┬───┘
   │      │
   │      └── /api/* ──► Uvicorn (Gunicorn workers)
   │                      FastAPI :8000
   │
   └── /* ──► Frontend dist/ (index.html SPA fallback)

                    ┌──────────────┐
                    │ PostgreSQL   │
                    │ :5432        │
                    └──────────────┘
```

## 2. Build production

### Backend

```bash
pip install -r requirements.txt
# Pas de build compile - Python interprété
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

Alternative : Gunicorn + UvicornWorker pour multi-process.

### Frontend

```bash
cd frontend
npm ci
npm run build
# Output: frontend/dist/
```

Servir `dist/` via Nginx avec fallback SPA :

```nginx
location / {
    root /var/www/gestsco/dist;
    try_files $uri $uri/ /index.html;
}

location /api/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## 3. Variables d'environnement production

### Backend

```env
DATABASE_URL=postgresql://gestsco_user:STRONG_PASS@db-host:5432/gestscov2
SECRET_KEY=<64-char-random-hex>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
BACKEND_CORS_ORIGINS=["https://gestsco.votredomaine.bf"]
```

### Frontend (build time)

```env
VITE_API_URL=https://gestsco.votredomaine.bf
VITE_APP_ENV=production
```

## 4. Base de données

### Préparation

1. Créer utilisateur PostgreSQL dédié (pas `postgres`)
2. Appliquer migrations Alembic (une fois initialisées)
3. Exécuter `init_db.py` ou seed selon environnement
4. **Changer mot de passe admin**

### Sauvegardes

```bash
# Backup quotidien
pg_dump -U gestsco_user -Fc gestscov2 > backup_$(date +%Y%m%d).dump

# Restauration
pg_restore -U gestsco_user -d gestscov2 backup.dump
```

Recommandation : rétention 30 jours + backup offsite.

## 5. Monitoring

### Health checks

| Endpoint | Usage |
|----------|-------|
| `GET /health` | Load balancer, uptime monitoring |
| `GET /` | Sanity check API |

Réponse attendue :
```json
{ "status": "healthy", "database": "connected" }
```

### Logs

- Uvicorn access logs → stdout
- Centraliser via ELK, Loki ou équivalent
- Niveau log FastAPI : INFO production, DEBUG dev

### Métriques recommandées

- Latence API p95
- Taux erreur 5xx
- Connexions DB pool
- Espace disque PostgreSQL

## 6. Mise à jour

### Procédure zero-downtime (cible)

1. Backup DB
2. Deploy backend nouveau (rolling)
3. Appliquer migrations Alembic
4. Deploy frontend static
5. Vérifier `/health`
6. Smoke tests manuels

### Rollback

1. Restaurer version précédente backend/frontend
2. `alembic downgrade -1` si migration appliquée

## 7. Docker (non implémenté - recommandé)

Structure suggérée :

```
docker-compose.yml
├── backend    (Python 3.12-slim)
├── frontend   (nginx:alpine + dist)
└── postgres   (postgres:16-alpine)
```

Avantages : reproductibilité, isolation, déploiement simplifié.

## 8. Checklist go-live

```
□ Migrations DB versionnées et testées
□ SECRET_KEY et credentials uniques
□ HTTPS configuré
□ CORS restreint
□ Admin password changé
□ Register public désactivé
□ Backups automatiques
□ Monitoring health actif
□ Logs centralisés
□ Documentation ops à jour
□ Plan de reprise d'activité testé
```

## 9. Exploitation courante

| Tâche | Fréquence | Responsable |
|-------|-----------|-------------|
| Backup DB | Quotidien | Ops |
| Mise à jour deps sécurité | Mensuel | Dev |
| Ouverture année académique | Annuel | Scolarité |
| Revue logs erreurs | Hebdomadaire | Ops |
| Test restauration backup | Trimestriel | Ops |
