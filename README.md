# Filamour : mise en ligne pas à pas

Ce dossier contient la vraie appli Filamour. Suis les étapes dans l'ordre, compte environ 30 à 45 minutes la première fois. Tout est gratuit à ce stade.

---

## Étape 1 : créer la base de données (Supabase)

1. Va sur **supabase.com**, crée un compte, puis **New project**.
2. Nom : `filamour`. Choisis un mot de passe de base de données et **garde-le précieusement**.
3. Région : choisis **Europe** (par exemple *West EU (Paris)* ou *Central EU (Frankfurt)*), pour le RGPD.
4. Attends 1 à 2 minutes que le projet soit prêt.
5. Dans le menu de gauche, ouvre **SQL Editor**, puis **New query**.
6. Ouvre le fichier `supabase/schema.sql` de ce dossier, copie **tout** son contenu, colle-le dans l'éditeur et clique **Run**. Tu dois voir *Success*.
7. Va dans **Project Settings > API** (ou **Data API**) et note deux informations :
   - **Project URL** (ressemble à `https://abcd1234.supabase.co`)
   - la clé **anon / publishable** (une longue suite de caractères). N'utilise jamais la clé *service_role* ou *secret* dans l'appli.

## Étape 2 : mettre le code sur GitHub

1. Crée un compte sur **github.com**, puis **New repository**. Nom : `filamour`, laisse-le en **Private**, clique **Create repository**.
2. Sur la page qui s'affiche, clique sur **uploading an existing file**.
3. Fais glisser **tout le contenu** de ce dossier (les dossiers `app`, `components`, `lib`, `public`, `supabase` et les fichiers `package.json`, `package-lock.json`, etc.). Ne mets pas de dossier `node_modules` ni `.next` s'ils existent.
4. Clique **Commit changes**.

## Étape 3 : mettre l'appli en ligne (Vercel)

1. Va sur **vercel.com** et crée un compte **avec GitHub**.
2. **Add New > Project**, choisis le dépôt `filamour`, clique **Import**.
3. Ouvre **Environment Variables** et ajoute :
   - `NEXT_PUBLIC_SUPABASE_URL` = ton Project URL de l'étape 1
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = ta clé anon / publishable
4. Clique **Deploy**. Après 1 à 2 minutes, tu as une adresse du type `https://filamour-xxxx.vercel.app`.

## Étape 4 : relier Supabase à ton adresse

Dans Supabase : **Authentication > URL Configuration**
- **Site URL** : ton adresse Vercel, par exemple `https://filamour-xxxx.vercel.app`
- **Redirect URLs** : ajoute `https://filamour-xxxx.vercel.app/auth/callback`

Sans ça, le lien de confirmation reçu par e-mail ne fonctionnera pas.

## Étape 5 : tester à deux

1. Sur ton téléphone, ouvre ton adresse Vercel, crée un compte, confirme ton e-mail.
2. Choisis **Je commence**, entre ton prénom et votre date. Tu obtiens un **code de couple**.
3. Sur un autre téléphone (ou en navigation privée), crée un second compte, choisis **J'ai un code** et entre le code.
4. Vérifie : les deux voient le même compteur, les mêmes souvenirs, le même fond d'écran, et la réponse de l'autre à la question du jour n'apparaît qu'après avoir répondu soi-même.

**Installer comme une appli** : sur iPhone, dans Safari, bouton Partager puis **Sur l'écran d'accueil**. Sur Android, menu de Chrome puis **Ajouter à l'écran d'accueil**.

---

## À savoir avant le lancement public

- **E-mails** : Supabase envoie les e-mails de confirmation avec un service de test limité à quelques e-mails par heure. Avant d'ouvrir au public, branche un vrai service d'envoi (par exemple Brevo, gratuit jusqu'à 300 e-mails par jour) dans **Authentication > Emails > SMTP Settings**. Pour tes propres tests, tu peux aussi désactiver temporairement **Confirm email** dans **Authentication > Sign In / Providers > Email**.
- **Nom de domaine** : quand tu as `filamour.fr` ou `filamour.app`, ajoute-le dans Vercel (**Settings > Domains**) et mets à jour l'étape 4 avec la nouvelle adresse.
- **Pages légales** : mentions légales, CGU et politique de confidentialité restent à ajouter avant le lancement.

## Ce que fait la sécurité de la base

- Chaque couple ne voit que ses propres données et photos.
- Un couple ne peut pas avoir plus de deux membres.
- La réponse de l'autre à la question du jour est réellement cachée tant qu'on n'a pas répondu (pas seulement floutée à l'écran).
- Personne ne peut s'attribuer Premium lui-même : ce champ sera rempli uniquement par le paiement Stripe.

## Prochaines étapes prévues

1. Abonnement Premium avec Stripe (4,99 €/mois ou 39 €/an, un abonnement pour deux).
2. Cadeaux : calendrier de l'Avent, Wrapped, lettres « Ouvre quand… », chasse au trésor.
3. Pages légales et lien vers la page d'attente.

## Lancer l'appli sur un ordinateur (facultatif, pour développer)

Il faut Node.js 20 ou plus.

```bash
cp .env.example .env.local   # puis remplis les deux valeurs
npm install
npm run dev                  # puis ouvre http://localhost:3000
```

Pense à ajouter `http://localhost:3000/auth/callback` dans les Redirect URLs de Supabase.
