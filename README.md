# Site web Junior i2SA

Site statique hébergé gratuitement sur **GitHub Pages** : <https://www.junior-i2sa.org>
Pas de logiciel à installer : tout peut se modifier directement sur github.com.

## Où modifier quoi ?

| Je veux changer…                        | Fichier                          |
|-----------------------------------------|----------------------------------|
| Les textes, services, chiffres clés     | `index.html` (sections repérées par des commentaires `====`) |
| Les couleurs ou polices                 | `assets/css/style.css`, bloc `:root` tout en haut |
| Les images                              | `assets/img/` (garder le même nom de fichier pour remplacer) |
| Les actualités LinkedIn                 | automatique, ou `data/linkedin.json` (voir plus bas) |
| L'adresse qui reçoit les messages       | `google-apps-script.js` puis redéployer (voir plus bas) |

**Modifier un fichier sur GitHub :** ouvrez le fichier → icône crayon ✏️ → modifiez → bouton
**Commit changes**. Le site est mis à jour en 1 à 2 minutes.

> Conseil : pour remplacer une image, gardez un format paysage et une largeur d'environ 1920 px
> (convertissez en `.webp` sur <https://squoosh.app> pour un site rapide).

## 1. Activer GitHub Pages

1. Dépôt GitHub → **Settings** → **Pages**.
2. *Source* : **Deploy from a branch**, branche `main`, dossier `/ (root)` → **Save**.
3. *Custom domain* : `www.junior-i2sa.org` (déjà dans le fichier `CNAME`), puis cochez **Enforce HTTPS**.
4. Chez le registrar du domaine (là où il a été acheté), configurez les DNS :
   - `www` → enregistrement **CNAME** vers `junior-ingenierie-i2sa.github.io`
   - domaine nu `junior-i2sa.org` → 4 enregistrements **A** :
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`

   Pensez à retirer les anciens enregistrements Squarespace.

## 2. Formulaire de contact (Google Sheet)

1. Créez une Google Sheet (ex. « Messages site web ») avec le compte qui doit la posséder.
2. Menu **Extensions → Apps Script**. Effacez le contenu et collez tout `google-apps-script.js`.
3. Modifiez `NOTIFY_EMAIL` avec l'adresse qui doit recevoir les notifications. Enregistrez (💾).
4. **Déployer → Nouveau déploiement** → type **Application Web** :
   - *Exécuter en tant que* : **Moi**
   - *Qui peut accéder* : **Tout le monde**
5. Autorisez l'accès (écran « application non validée » : *Paramètres avancés → Accéder au projet*).
6. Copiez l'**URL de l'application Web** (finit par `/exec`) et collez-la dans
   `assets/js/script.js` à la ligne `const GOOGLE_SCRIPT_URL = "..."`.

**Changer l'adresse plus tard :** modifiez `NOTIFY_EMAIL` dans Apps Script, puis
**Déployer → Gérer les déploiements → ✏️ → Version : Nouvelle version → Déployer**.
L'URL reste la même. Pour transférer la Sheet au compte de l'association :
*Partager → transférer la propriété*.

## 3. Actualités LinkedIn

Chaque jour, une GitHub Action (`.github/workflows/linkedin.yml`) récupère les 6 dernières
publications de la page LinkedIn et met à jour `data/linkedin.json`.
On peut aussi la lancer à la main : onglet **Actions → Mise à jour des actualités LinkedIn → Run workflow**.

### Mise en place (une fois)

LinkedIn ne permet pas de lire les publications d'une page sans autorisation :

1. Sur <https://www.linkedin.com/developers/apps>, créez une application liée à la page Junior i2SA
   (un administrateur de la page doit valider).
2. Onglet **Products** : demandez l'accès à **Community Management API**
   (validation par LinkedIn, peut prendre quelques jours).
3. Onglet **Auth** → *OAuth 2.0 tools* : générez un jeton avec le droit `r_organization_social`.
4. Récupérez l'identifiant de la page : c'est le nombre dans l'URL de l'interface admin
   (`linkedin.com/company/12345678/admin/`).
5. Dépôt GitHub → **Settings → Secrets and variables → Actions → New repository secret** :
   - `LINKEDIN_ACCESS_TOKEN` = le jeton
   - `LINKEDIN_ORG_ID` = l'identifiant

⚠️ **Le jeton expire au bout de 60 jours.** Quand les actualités ne bougent plus, regénérez-le
(étape 3) et remplacez le secret. Mettez un rappel dans l'agenda de l'association.

### Sans API : ajout manuel

Si l'accès API n'est pas disponible, ajoutez les publications à la main dans `data/linkedin.json`
(lien obtenu via « … → Copier le lien vers le post ») :

```json
{
  "posts": [
    {
      "url": "https://www.linkedin.com/feed/update/urn:li:activity:1234567890/",
      "date": "2026-11-20",
      "text": "Début du texte de la publication…",
      "image": "./assets/img/bureau.webp",
      "manual": true
    }
  ]
}
```

`"manual": true` évite que la mise à jour automatique efface la publication. `image` est facultatif.

## Tester en local (facultatif)

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Structure

```
index.html                page unique du site
assets/css/style.css      styles
assets/js/script.js       menu, actualités, formulaire
assets/img/               images et logo
data/linkedin.json        actualités affichées
scripts/fetch-linkedin.mjs  récupération LinkedIn (utilisé par l'Action)
google-apps-script.js     code à coller dans Google Apps Script
CNAME                     domaine personnalisé
```
