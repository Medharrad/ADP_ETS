# Outil ADP 2026 — Renforcement Musculaire & Souplesse (version statique)

Outil EPS d'aide à la décision pédagogique, **100 % autonome** (HTML/CSS/JS purs),
**hors-ligne** et **privé** : aucune donnée ne quitte l'appareil de l'enseignant.

> Cette version statique **reproduit fidèlement la logique métier** de l'application
> Next.js du dépôt (observables, seuils, décisions, distribution des séances, plan de
> cycle, import/export CSV). Elle a été créée pour le déploiement sur GitHub Pages,
> **sans modifier** le projet Next.js d'origine (qui reste dans `frontend/`).
> Les fonctionnalités « IA » du projet Next.js ne sont pas reprises ici : elles
> dépendent d'une API payante, incompatible avec un hébergement statique gratuit.

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `index.html` | Page d'accueil de l'application |
| `style.css` | Feuille de style (chemin relatif `./style.css`) |
| `app.js` | Données + logique métier + interface (chemin relatif `./app.js`) |
| `sw.js` | Service worker — fonctionnement hors-ligne |
| `manifest.webmanifest` | Métadonnées d'application installable |
| `modele_eleves_ADP-RM.csv` | Modèle d'import (téléchargeable aussi depuis l'outil) |

## Fonctionnalités

- **Saisie & diagnostic** — scores /10 sur 3 familles (Force · Souplesse · Équilibre).
- **Persistance automatique** — tout est enregistré dans le navigateur (`localStorage`)
  et survit à la fermeture/au rechargement de la page.
- **Export / Import de session** (JSON) — sauvegarde de secours et transfert d'appareil.
- **Export des résultats** en CSV (UTF-8, compatible Excel et arabe) + **impression PDF**.
- **Données d'exemple** — bouton « 🧪 Données d'exemple » pour tester immédiatement.
- **Nouvelle session** — réinitialisation **avec confirmation** obligatoire.
- **Responsive** — utilisable sur smartphone (≈ 380 px) et tablette.

## Charger les données réelles du terrain

1. Préparez un fichier **CSV** avec une colonne *Prénom* puis trois colonnes
   *Force · Souplesse · Équilibre*. Téléchargez le **Modèle** depuis l'outil
   (ou utilisez `modele_eleves_ADP-RM.csv`).
2. Les cellules acceptent soit un **score 0–10**, soit un **code métier** :
   `FO−/FO~/FO+`, `SO−/SO~/SO+`, `EQ−/EQ~/EQ+` (ou `A`/`B`/`C`).
3. Dans l'outil : zone **« Importer une liste d'élèves (CSV) »** → glisser-déposer
   ou parcourir → vérifier l'aperçu → **Importer**. Les scores manquants se
   complètent à la main avant l'analyse.

## Déploiement sur GitHub Pages

Deux options (toutes deux avec des **chemins relatifs**, requis sous GitHub Pages) :

### Option A — l'app dans `outil/` + redirection à la racine (recommandée ici)
1. Le dépôt contient déjà `outil/` (cette app) et un `index.html` de redirection
   à la **racine** (`<meta http-equiv="refresh" content="0; url=./outil/">`).
2. Sur GitHub : **Settings → Pages → Build and deployment → Source : Deploy from a
   branch**, puis **Branch : `main` / `/ (root)`**, et **Save**.
3. L'URL `https://<utilisateur>.github.io/<dépôt>/` redirige vers `…/outil/`.

### Option B — publier uniquement le contenu de `outil/`
- Copiez le contenu de `outil/` à la racine d'un dépôt (ou d'une branche `gh-pages`),
  de sorte que `index.html` soit à la racine publiée, puis activez Pages sur ce dossier.

> **Hors-ligne :** le service worker s'active uniquement en **HTTPS** (GitHub Pages) ou
> `localhost`. En ouvrant directement le fichier via `file://`, l'app fonctionne aussi,
> mais sans cache hors-ligne au rechargement.

## Test en local

Le plus simple, depuis ce dossier :

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000/
```

## Confidentialité

Aucun compte, aucune connexion, aucune donnée envoyée sur Internet. Toutes les
informations restent dans le `localStorage` du navigateur de l'enseignant. Le bouton
**« Exporter la session »** permet d'en garder une copie ; **« Nouvelle session »**
les efface (après confirmation).
