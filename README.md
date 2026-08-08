# JARVIS OS

Console unique de conversation vocale et textuelle avec un assistant IA.
Interface HUD futuriste originale (aucun élément de marque tiers), mobile-first Android, installable en PWA.

## Fonctionnalités

- Un seul écran : noyau holographique animé, historique de conversation, barre de commande fixe.
- Aucune barre de navigation, aucune sidebar, aucune page métier. Réglages via l'icône engrenage en haut à droite.
- Reconnaissance vocale (Web Speech API, `fr-FR`) avec appui simple ou maintien du micro.
- Synthèse vocale via backend TTS, repli `window.speechSynthesis` si le backend est injoignable.
- Historique et préférences en `localStorage`, `sessionId` persistant (`crypto.randomUUID`).
- Bannière hors ligne, bouton d'installation PWA, respect de `prefers-reduced-motion`.

## Variables d'environnement

Copiez `.env.example` en `.env` :

```
VITE_N8N_WEBHOOK_URL=https://votre-instance/webhook/jarvis
VITE_TTS_API_URL=https://jarvis-tts-backend.onrender.com/tts
```

Aucune clé secrète ne doit être placée dans le frontend : ces URLs sont publiques par nature.

## Développement

```bash
npm install
npm run dev      # développement
npm run build    # build de production
npm run preview  # prévisualisation du build
```

## Contrat n8n

Requête `POST` envoyée au webhook :

```json
{
  "message": "Texte de la demande utilisateur",
  "sessionId": "identifiant persistant",
  "source": "jarvis-os-pwa",
  "language": "fr"
}
```

Réponse attendue :

```json
{ "output": "Réponse à afficher", "tts": "Réponse optimisée pour la voix" }
```

Règles appliquées côté client : `output` est affiché, `tts` est vocalisé ; si `tts` manque, `output` est
vocalisé ; si la réponse est du texte brut, elle sert d'`output` et de `tts`. Le Markdown est nettoyé avant
affichage et avant TTS. Timeout via `AbortController`.

### CORS

L'instance n8n **doit** autoriser le domaine Render du frontend :
`Access-Control-Allow-Origin: https://<votre-app>.onrender.com`, plus `Access-Control-Allow-Headers: Content-Type`
et la réponse au préflight `OPTIONS`. Même exigence pour le backend TTS.

## Déploiement Render

Le projet est une application React/TypeScript avec rendu serveur (TanStack Start + Vite).

- `render.yaml` déclare un service Web Node : `npm install && npm run build` puis `npm run start`.
- Les variables `VITE_*` doivent être définies **avant** le build dans Render (elles sont injectées au build).
- Le routage est géré par le serveur de l'application : pas de 404 au rafraîchissement, aucune règle de
  réécriture SPA supplémentaire n'est nécessaire.
- Si vous préférez un Static Site, exportez un build statique puis ajoutez une règle de réécriture
  `/* -> /index.html`.

## PWA

`public/manifest.webmanifest` fournit le nom, le mode `standalone`, les couleurs sombres et les icônes
192x192 et 512x512 (dont une variante maskable). Le bouton « Installer JARVIS » apparaît lorsque Chrome
Android propose l'installation.
