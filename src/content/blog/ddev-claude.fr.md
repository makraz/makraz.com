---
title: "ddev-claude : Claude Code en mode YOLO, isolé dans DDEV"
description: "Un add-on DDEV qui fait tourner Claude Code sans demandes de permission dans un conteneur filtré : pourquoi, ce qu'il protège et son historique."
lang: fr
slug: ddev-claude
date: 2026-09-29
updated: 2026-11-22
author: "Hamza Makraz"
category: "Ingénierie"
authorRole: "Fondateur, MAKRAZ — ingénieur logiciel"
ctaTitle: "Envie d'outiller votre équipe avec l'IA, en toute sécurité ?"
faq:
  - q: "Lancer Claude Code avec `--dangerously-skip-permissions` dans ddev-claude est-il sûr ?"
    a: "Plus sûr, pas sûr. L'agent tourne dans son propre conteneur et son trafic sortant est limité à une liste blanche (qui inclut votre propre machine), avec des failles documentées comme le tunnel DNS et le ping. Mais il peut lire tout votre projet, `.env` compris, ainsi que les clés API ou tokens présents dans le conteneur, y compris vos identifiants Claude. Tout hôte autorisé, GitHub compris, peut servir à faire sortir des données. Et il peut modifier ou supprimer tout ce qui est dans votre projet. Gardez des sauvegardes et relisez ce qu'il écrit dans `.git/` et `.ddev/`, car les hooks Git et les commandes hôte DDEV écrits là s'exécutent sur votre machine."
  - q: "ddev-claude a-t-il besoin d'une clé API Anthropic ?"
    a: "Non. Si `ANTHROPIC_API_KEY` n'est pas définie, Claude Code vous demande de vous connecter avec votre compte Claude (abonnement ou compte Anthropic Console) au premier lancement de `ddev claude`."
  - q: "Comment autoriser un domaine supplémentaire dans ddev-claude ?"
    a: "Ajoutez-le sous `extra_allowed_domains` dans `.ddev/claude.yaml`, puis lancez `ddev claude rebuild && ddev restart`."
  - q: "ddev-claude fonctionne-t-il sans Mutagen ?"
    a: "Oui. Sans Mutagen, le projet est monté depuis votre machine ; avec Mutagen activé, le conteneur partage le volume synchronisé de DDEV, bien plus rapide sur macOS lors de nos tests."
services: [devops-cloud]
---

**En bref :** ddev-claude est un add-on DDEV open source qui fait tourner Claude Code en mode YOLO (sans demandes de permission) dans son propre conteneur. Un pare-feu limite son trafic sortant à Anthropic, GitHub, vos services DDEV, votre machine (la passerelle de l'hôte) et les domaines autorisés par vous ou par vos extras activés, avec des failles documentées comme le tunnel DNS, le ping et les données envoyées via des hôtes autorisés comme GitHub. Il protège contre les fuites de données accidentelles, mais ce n'est pas un coffre-fort pour les secrets de votre projet, et les fichiers qu'il écrit dans `.git/` ou `.ddev/` peuvent s'exécuter sur votre machine. Installez-le avec `ddev add-on get makraz/ddev-claude`.

[ddev-claude](https://github.com/makraz/ddev-claude) est un add-on DDEV open source qui fait tourner Claude Code, l'agent de programmation IA d'Anthropic, dans son propre conteneur à côté de votre projet (un « sidecar »). Dans ce conteneur, l'agent tourne avec `--dangerously-skip-permissions`, le fameux « mode YOLO » : il travaille sans demander votre accord à chaque étape. Un pare-feu décide où il a le droit de se connecter.

Deux commandes l'installent dans n'importe quel projet DDEV, une troisième le lance :

```bash
ddev add-on get makraz/ddev-claude
ddev restart
ddev claude
```

## Pourquoi faire tourner Claude Code dans un bac à sable ?

Un agent IA est le plus utile quand il peut travailler longtemps sans surveillance : lancer les tests, lire l'erreur, corriger le code, relancer les tests. Par défaut, Claude Code demande la permission avant chaque commande. C'est sûr, mais il faut rester devant l'écran et cliquer « oui » toute la session. La sortie évidente est l'option `--dangerously-skip-permissions`, et son nom dit tout : sur votre propre machine, un agent qui déraille peut supprimer des fichiers, lire vos clés SSH ou envoyer des données n'importe où sur internet.

Tous nos projets clients tournent déjà dans [DDEV](https://ddev.com) : chaque projet a ses conteneurs et son propre réseau. Mettre l'agent dans un conteneur de plus sur ce réseau était la réponse naturelle : il voit le code et les services DDEV du projet (`web`, `db`, autres add-ons), mais pas votre dossier personnel, vos clés SSH ni vos autres projets.

## Que fait ddev-claude ?

- **Un conteneur sidecar séparé.** L'agent tourne comme service `claude`, avec un utilisateur sans privilèges, sur une petite image `debian:bookworm-slim`. Votre dossier personnel, vos clés SSH et vos autres projets ne sont pas montés.
- **Une liste blanche de destinations.** Des outils réseau Linux standard (iptables, ipset et dnsmasq) bloquent les connexions sortantes sauf vers Anthropic, GitHub, le réseau DDEV, la passerelle de l'hôte (votre machine, vue depuis Docker) et les domaines que vous ajoutez (voir les limites plus bas). Pendant que l'agent tourne, la liste vit dans des fichiers appartenant à root qu'il ne peut pas modifier, et le pare-feu démarre avec le conteneur : toutes les façons d'entrer dans le conteneur (`ddev claude`, `ddev exec -s claude`, `docker exec`) passent par le pare-feu une fois celui-ci actif (s'il échoue au démarrage, seul `ddev claude` le relance).
- **Des commandes simples.** `ddev claude` ouvre une session, `ddev claude safe` garde les demandes de permission, `ddev claude shell` ouvre un terminal dans le bac à sable et `ddev claude exec <cmd>` lance une seule commande.
- **Un seul fichier de configuration.** `.ddev/claude.yaml` règle les extras optionnels (`php`, `python`, `node`), les domaines autorisés en plus, les outils intégrés que l'agent utilise par défaut, les plugins actifs et le mode de montage du projet.

```yaml
extras:
  - php
extra_allowed_domains:
  - sentry.io
```

Appliquez les changements avec `ddev claude rebuild && ddev restart`.

## Contre quoi ddev-claude ne protège-t-il pas ?

Nous préférons être clairs. L'agent peut lire et modifier tout votre projet, `.env` compris, et il accède à la base de données du projet : il peut toujours supprimer des fichiers ou des tables dans le projet. Le pare-feu contrôle *où* le trafic peut aller, pas *ce qui* passe par une destination autorisée : tout hôte autorisé, GitHub compris, peut servir à faire sortir des données, que l'agent pousse avec votre token (`GITHUB_PERSONAL_ACCESS_TOKEN`, si vous en fournissez un) ou avec un token fourni par un attaquant. Si vous fournissez un token, donnez-lui les droits les plus restreints possible.

Le fichier `SECURITY.md` liste les failles restantes, notamment : le tunnel DNS (cacher des données dans des requêtes DNS) via le résolveur autorisé, le ping ICMP, les sites qui partagent une adresse CDN avec un domaine autorisé, et tout service qui écoute sur votre machine, puisque la passerelle de l'hôte est autorisée sur tous les ports. L'agent peut aussi écrire des fichiers qui agissent plus tard, hors du bac à sable : des hooks Git et des commandes hôte DDEV qui s'exécutent sur votre machine, et la porte de sortie Dockerfile (`.ddev/claude.local/Dockerfile.fragment`) ou `.ddev/claude.yaml` (y compris ses domaines autorisés), appliqués à la prochaine reconstruction.

Le bac à sable protège donc contre les fuites de données accidentelles, limite l'accès réseau de l'agent à la liste blanche (aux limites près citées plus haut) et son accès aux fichiers au projet. Relisez quand même ce qu'il écrit dans `.git/` et `.ddev/` avant d'exécuter ou de reconstruire quoi que ce soit. Ce n'est pas un coffre-fort pour vos secrets.

## Historique des versions

**v0.1.0 (6 mai 2026) : première version.** Tout était inclus : PHP, Composer, Playwright, Chromium, serveurs MCP et GitHub CLI, dans une image d'environ 1,5 Go.

**v0.2.0 (3 juin) : un conteneur minimal.** L'image par défaut est passée à Claude Code plus le pare-feu, environ 300 Mo. PHP est devenu un extra optionnel dans `.ddev/claude.yaml` ; le reste (Playwright, GitHub CLI, serveurs MCP) a été déplacé vers une porte de sortie (`.ddev/claude.local/Dockerfile.fragment`), avec des extraits prêts à l'emploi dans le README. Cette version a aussi ajouté les sous-commandes `safe`, `shell`, `exec`, `rebuild` et `help`.

**Bêtas v0.3.0 (juin) : image pré-construite et sécurité renforcée.**
- Une image de base multi-architecture (`ghcr.io/makraz/ddev-claude-base`) publiée depuis le dépôt, verrouillée sur la version de l'add-on.
- La liste blanche ne peut plus être élargie depuis l'intérieur du bac à sable en marche. Avant, l'agent pouvait ajouter un domaine dans un fichier du projet et relancer le script du pare-feu.
- Le pare-feu est activé par le premier processus du conteneur, donc `docker exec` est lui aussi isolé.
- L'extra `php` vérifie l'empreinte de la clé de signature du dépôt Sury, et le pare-feu refuse de démarrer si IPv6 est joignable mais impossible à filtrer.
- La revérification du pare-feu à chaque `ddev claude` est devenue quasi instantanée.

**v0.4.0 (21 août 2026) : la première version stable depuis la v0.2.** Par défaut, `ddev add-on get` n'installe que les versions stables : aucune bêta v0.3 n'a donc atteint ceux qui installent la version par défaut. Leçon retenue. Cette version :
- A fermé un trou présent depuis la première version : le port 53 était ouvert vers *n'importe quel* hôte, ce qui permettait un tunnel DNS ou une connexion directe vers tout serveur écoutant sur le 53. Il ne mène plus qu'aux résolveurs DNS configurés.
- A limité par défaut les outils intégrés de l'agent à `Read`, `Write`, `Bash` et `Skill`, et sélectionné les plugins. Ce sont des réglages par défaut qui contrôlent le coût, pas une frontière de sécurité.
- A déplacé l'état de l'agent dans un volume Docker, avec `ddev claude state` pour le copier.
- Quand Mutagen est activé, a remplacé le montage depuis l'hôte par le volume synchronisé par Mutagen de DDEV : un `grep` sur `vendor/` est passé de 28,4 s à 0,065 s sur notre machine.
- A ajouté les extras `python` et `node`, et publié l'image avec une attestation de provenance du build et un SBOM (la liste de tout ce que contient l'image).

**v0.4.1 (31 août 2026) :** une connexion bloquée échoue désormais immédiatement au lieu d'attendre le délai du client (jusqu'à 300 s pour curl).

**v0.4.2 (26 septembre 2026) :** l'image de base a été reconstruite avec la version de Claude Code alors la plus récente, et la procédure de publication signe et vérifie désormais les tags.

## Essayez-le

L'add-on est sous licence MIT et référencé dans le [registre des add-ons DDEV](https://addons.ddev.com). Le README et le `SECURITY.md` du [dépôt](https://github.com/makraz/ddev-claude) décrivent chaque option et chaque limite connue. Les issues et pull requests sont les bienvenues.

Mettre en place des environnements de développement sûrs et rapides comme celui-ci fait partie de notre offre [DevOps & Cloud](/fr/services/devops-cloud). Pour les skills que nous utilisons avec l'agent dans le bac à sable, voir [mon usage quotidien des skills Claude Code](/fr/blog/claude-code-skills).
