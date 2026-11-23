---
title: "Kiri vs OrbStack : Docker sur macOS, le benchmark"
description: "Kiri vs OrbStack sur un M4 Pro avec une stack PHP DDEV : Kiri utilisait ~1/6 de la RAM d'OrbStack à vide, OrbStack 1/3 du CPU de Kiri avec le projet au repos."
lang: fr
slug: kiri-vs-orbstack
date: 2026-11-21
author: "Hamza Makraz"
category: "Ingénierie"
authorRole: "Fondateur, MAKRAZ — ingénieur logiciel"
ctaTitle: "Besoin d'un environnement de développement plus léger et bien réglé ?"
faq:
  - q: "Kiri est-il plus rapide qu'OrbStack ?"
    a: "Pas globalement. Dans notre test (Kiri 0.2.2 contre OrbStack 2.2.5, stack PHP DDEV sur un M4 Pro), la suite de tests complète a pris à peu près le même temps sur les deux (125 s sur Kiri, 131 s sur OrbStack). Kiri était plus rapide sur un test Postgres `pgbench` et les grosses écritures ; OrbStack sur les petits fichiers, le préchauffage du cache et la latence HTTP."
  - q: "Lequel consomme le moins de mémoire, Kiri ou OrbStack ?"
    a: "Kiri. Dans notre test (Kiri 0.2.2 contre OrbStack 2.2.5 sur un M4 Pro), à vide, il utilisait 0,33 Go contre 1,93 Go pour OrbStack, et environ 1 Go de moins en charge."
  - q: "Kiri ou OrbStack : lequel choisir sur un portable sur batterie ?"
    a: "OrbStack, dans notre test (Kiri 0.2.2 contre OrbStack 2.2.5 sur un M4 Pro) : il utilisait un tiers du CPU de Kiri lorsque le projet était au repos, et son score « impact énergétique » de macOS était 24 % plus bas sur la suite de tests (un score relatif, pas des watts). Nous n'avons pas mesuré directement l'autonomie."
  - q: "DDEV fonctionne-t-il avec Kiri ?"
    a: "Oui. Par défaut, DDEV se rabat sur les ports 30000/30001, car le proxy de Kiri occupe les ports 80 et 443. Déplacez ce proxy avec `launchctl setenv KIRI_HTTP_PORT 8880` et `launchctl setenv KIRI_HTTPS_PORT 8843`, redémarrez Kiri avec `launchctl kickstart -k gui/$(id -u)/dev.kiri.daemon` (cela arrête les conteneurs en cours), puis lancez `ddev poweroff && ddev start`. Le réglage dure jusqu'à la déconnexion ou au redémarrage du Mac ; un élément d'ouverture de session le rend permanent."
services: [devops-cloud]
---

**En bref :** dans notre comparaison de Kiri 0.2.2 et OrbStack 2.2.5 sur un M4 Pro avec une vraie stack PHP sous DDEV, Kiri utilisait environ un sixième de la RAM d'OrbStack à vide (environ 0,7 Go de moins avec le projet lancé) et a traité 2,6× plus de transactions Postgres qu'OrbStack lors de notre test. OrbStack utilisait un tiers du CPU de Kiri lorsque le projet était au repos et était plus rapide sur les petits fichiers. La suite de tests complète a pris à peu près le même temps sur les deux. Sur batterie, prenez OrbStack (d'après sa charge CPU plus faible ; nous n'avons pas mesuré l'autonomie) ; à court de RAM, prenez Kiri.

[Kiri](https://github.com/libracoder/kiri) est un nouveau moteur de conteneurs écrit en Rust, testé ici sur macOS. Il est compatible avec l'API Docker et peut donc remplacer Docker Desktop ou OrbStack avec peu ou pas de changements dans vos outils. Nous voulions savoir s'il tient la route pour le développement PHP au quotidien, alors nous l'avons testé sur un vrai projet plutôt que sur un conteneur « hello world ».

## Le protocole

- **Machine :** MacBook avec Apple M4 Pro, 12 cœurs, 24 Go de RAM, macOS 27.2.
- **Stack :** DDEV v1.25.5 avec synchronisation Mutagen, une API Symfony sur FrankenPHP, Postgres 18 et LocalStack. Mêmes images sur les deux moteurs.
- **Versions :** Kiri 0.2.2 et OrbStack 2.2.5.
- **Isolation :** chaque moteur tournait seul. OrbStack était quitté pendant le test de Kiri, et le démon de Kiri arrêté pendant celui d'OrbStack.
- **Mesures :** `top` de macOS relevait toutes les 2 secondes le CPU, la mémoire et l'« impact énergétique » des processus hôtes du moteur.

Nous avons testé le démarrage du moteur, le premier lancement du projet et un redémarrage ; le CPU et la RAM au repos ; les fichiers (lecture et écriture de 1 Gio, copie de `vendor/`) ; le préchauffage du cache Symfony et `composer dump-autoload` ; Postgres avec `pgbench` ; la latence HTTP via le routeur DDEV ; et la suite de tests complète du projet.

## Résultats

| | OrbStack | Kiri | Meilleur |
|---|---|---|---|
| **Démarrage** | | | |
| Démarrage du moteur jusqu'à la réponse Docker | 0,1–5,9 s | ~1 s | Égalité |
| Premier `ddev start` après le changement de moteur | 31,9 s | 44,6 s | OrbStack |
| `ddev stop` + `start` | 21,2 s | 26,2 s | OrbStack |
| **Mémoire (processus hôtes du moteur)** | | | |
| Moteur seul, rien ne tourne | 1,93 Go | 0,33 Go | **Kiri, ~1/6 de la RAM d'OrbStack** |
| Projet lancé, au repos | 3,2 Go | 2,5 Go | Kiri |
| Pic pendant les tests | 4,1 Go | 2,9 Go | Kiri |
| **CPU et énergie** | | | |
| Repos, moteur seul | 2,5 % | 3,6 % | Égalité |
| Repos, projet lancé | 11,7 % | 35,6 % | **OrbStack, 1/3 du CPU de Kiri** |
| Tests, CPU moyen | 113 % | 155 % | OrbStack |
| Tests, score énergie (sans unité) | 14,7 k | 19,4 k | OrbStack (−24 %) |
| **Vitesse** | | | |
| Suite complète (~1 400 tests, tous verts) | 130,5 s | 124,8 s | Égalité |
| `cache:warmup`, cache vide | 2,5 s | 3,1 s | OrbStack |
| `composer dump-autoload -o` | 1,9 s | 2,4 s | OrbStack |
| Copie et suppression de `vendor/` | 1,2 s | 2,6 s | OrbStack |
| Écriture 1 Gio, système de fichiers du conteneur | 523 Mo/s | 782 Mo/s | Kiri |
| Écriture 1 Gio, dossier du projet | 697 Mo/s | 886 Mo/s | Kiri |
| Lecture 1 Gio, système de fichiers du conteneur | 1,9 Go/s | 2,4 Go/s | Égalité |
| Lecture 1 Gio, dossier du projet | 3,2 Go/s | 2,7 Go/s | Égalité |
| Postgres `pgbench` (échelle 20, 8 clients, 30 s) | 2 091 tps, 3,8 ms de latence moyenne | 5 453 tps, 1,5 ms de latence moyenne | **Kiri, 2,6×** |
| HTTP via le routeur (300 requêtes), p50 | 12,3 ms | 15,2 ms | OrbStack |
| HTTP via le routeur (300 requêtes), p95 | 19,2 ms | 40,4 ms | OrbStack |

## Lequel choisir ?

**Sur la suite de tests, c'est une égalité.** La suite de tests est ce qui se rapproche le plus du travail réel, et elle a pris à peu près le même temps sur les deux moteurs, même si OrbStack est plus rapide sur les petits fichiers. La différence est dans ce que chaque moteur coûte à faire tourner.

**Kiri gagne sur la mémoire,** de loin : environ 1,6 Go de moins à vide et environ 1 Go de moins en charge. Lors de notre test `pgbench`, il a aussi traité 2,6 fois plus de transactions Postgres (5 453 contre 2 091 par seconde), et il était plus rapide sur les grosses écritures séquentielles.

**OrbStack gagne sur le CPU et l'énergie.** Projet au repos, Kiri consomme trois fois plus de CPU qu'OrbStack, et sur la suite de tests le score énergie d'OrbStack était 24 % plus bas. OrbStack a aussi mis environ 20 % de temps en moins sur le préchauffage du cache et l'autoload, était environ deux fois plus rapide pour copier `vendor/`, et avait une latence HTTP plus faible via le routeur (p95 de 19 ms contre 40 ms).

Notre recommandation : **sur un portable qui tourne sur batterie, prenez OrbStack** (d'après sa charge CPU plus faible ; nous n'avons pas mesuré directement l'autonomie). **Si vous faites tourner plusieurs stacks à la fois et que la RAM manque, prenez Kiri.** Kiri n'en est qu'à la version 0.2, mais il vaut la peine d'être suivi.

## Comment faire tourner DDEV sur Kiri (le conflit des ports 80/443)

Kiri lance son propre proxy pour `<nom>.kiri.local` sur les ports 80 et 443. Avant de démarrer, DDEV vérifie si ces ports sont libres, les trouve occupés et se rabat sur 30000/30001, ce qui ajoute un port dans l'URL du projet. Les réglages de Kiri ne permettent pas de désactiver ce proxy.

La solution est de déplacer le proxy de Kiri sur d'autres ports. Nous avons trouvé ces noms de variables dans l'application Kiri elle-même, pas dans sa documentation :

```sh
launchctl setenv KIRI_HTTP_PORT 8880
launchctl setenv KIRI_HTTPS_PORT 8843
launchctl kickstart -k gui/$(id -u)/dev.kiri.daemon
ddev poweroff && ddev start
```

La ligne `kickstart -k` redémarre Kiri, ce qui arrête les conteneurs qui tournent dessus. Effet secondaire : les URL `*.kiri.local` de Kiri nécessitent désormais `:8880` ou `:8843`.

Ne mettez pas les variables dans le plist LaunchAgent de Kiri : l'application régénère ce fichier à chaque lancement. `launchctl setenv` ne dure que jusqu'à la déconnexion ou au redémarrage du Mac, donc nous ajoutons un élément d'ouverture de session, `~/Library/LaunchAgents/dev.kiri.ports.plist`, qui lance les trois mêmes commandes `launchctl` à chaque connexion (et redémarre donc Kiri à la connexion) :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>dev.kiri.ports</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/sh</string><string>-c</string>
    <string>launchctl setenv KIRI_HTTP_PORT 8880; launchctl setenv KIRI_HTTPS_PORT 8843; launchctl kickstart -k gui/$(id -u)/dev.kiri.daemon</string>
  </array>
  <key>RunAtLoad</key><true/>
</dict>
</plist>
```

Pour l'annuler, supprimez l'élément d'ouverture de session, effacez les variables et redémarrez Kiri pour que son proxy revienne sur les ports 80/443 (faites d'abord `ddev poweroff` si DDEV les utilise) :

```sh
launchctl bootout gui/$(id -u)/dev.kiri.ports 2>/dev/null; rm -f ~/Library/LaunchAgents/dev.kiri.ports.plist
launchctl unsetenv KIRI_HTTP_PORT; launchctl unsetenv KIRI_HTTPS_PORT
launchctl kickstart -k gui/$(id -u)/dev.kiri.daemon
```

Pour passer un projet d'OrbStack à Kiri :
1. Faites d'abord `ddev poweroff`.
2. Les volumes Docker ne suivent pas le moteur. Copiez chacun avec `kiri import orbstack volume <volume>` (par exemple `<projet>-postgres`) pendant qu'OrbStack tourne **et que le projet est arrêté** : copier une base de données en marche peut corrompre la copie.
3. Lancez `docker context use kiri`, puis `ddev start`.

À chaque lancement, OrbStack reprend le contexte Docker : relancez `docker context use kiri`, ou `docker context use orbstack` pour revenir à OrbStack.

## Limites de ce benchmark

Chaque test a tourné une fois (trois fois pour le cache et Composer, médiane affichée) : considérez les écarts de moins de 15 % environ comme du bruit. Les lectures de 1 Gio sont probablement dominées par le cache de pages : nous les jugeons équivalentes malgré des écarts de plus de 15 %, et les écritures peuvent elles aussi être en partie mises en cache. Le test `pgbench` et le test HTTP de Kiri ont échoué au premier passage et ont été relancés dans un second passage, après un redémarrage du moteur. Les deux premiers démarrages incluent la synchronisation initiale de Mutagen. Le chiffre d'énergie est le score relatif « impact énergétique » de macOS pour les processus du moteur, pas des watts. Avec une mesure toutes les 2 secondes, les phases courtes n'ont que trois à cinq points. Il s'agit d'une seule machine et d'un seul projet : nous pensons que le compromis (mémoire contre CPU) tiendra, mais mesurez sur votre propre configuration.

Choisir et régler les environnements locaux et cloud fait partie de notre offre [DevOps & Cloud](/fr/services/devops-cloud). Si vous faites tourner des agents IA dans DDEV, consultez [ddev-claude, notre add-on Claude Code isolé](/fr/blog/ddev-claude).
