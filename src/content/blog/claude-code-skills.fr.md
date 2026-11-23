---
title: "Skills Claude Code : Ponytail et les skills de Matt Pocock"
description: "Comment j'utilise les skills Claude Code au quotidien : planifier avec Matt Pocock, coder avec Ponytail, relire avec les deux. Commandes et installation."
lang: fr
slug: claude-code-skills
date: 2026-11-21
author: "Hamza Makraz"
category: "Ingénierie"
authorRole: "Fondateur, MAKRAZ — ingénieur logiciel"
ctaTitle: "Vous voulez ce flux de travail sur votre projet ?"
faq:
  - q: "Qu'est-ce qu'une skill Claude Code ?"
    a: "Une skill Claude Code est un court fichier Markdown d'instructions que Claude Code charge quand c'est pertinent, ou quand vous tapez son nom comme commande slash."
  - q: "Par quelles skills Claude Code commencer ?"
    a: "Deux : `/mattpocock-skills:grill-with-docs` de Matt Pocock avant chaque tâche, pour que l'agent comprenne ce que vous voulez, et `/ponytail-review` de Ponytail avant chaque fusion."
  - q: "Pourquoi taper `/mattpocock-skills:code-review` plutôt que `/code-review` dans Claude Code ?"
    a: "Claude Code a son propre `/code-review` intégré, du même nom, et celui que lance le nom court dépend de l'application et de la version. Le nom complet lance toujours la skill de Matt Pocock."
  - q: "Ponytail et les skills de Matt Pocock fonctionnent-ils avec d'autres agents de programmation ?"
    a: "Oui. Les deux collections s'installent aussi dans d'autres agents comme Codex ; chaque README explique comment."
---

**En bref :** les skills Claude Code sont de courts fichiers d'instructions qui donnent de bonnes habitudes à l'agent. J'utilise les skills de Matt Pocock pour planifier (`/mattpocock-skills:wayfinder`, `/mattpocock-skills:grill-with-docs`), Ponytail pour garder chaque changement petit, et `/ponytail-review` et `/mattpocock-skills:code-review` avant chaque fusion.

Un agent de programmation IA, tel quel, est rapide mais n'a pas d'habitudes. Il commence à coder avant d'avoir compris ce que vous voulez, écrit plus que nécessaire et se relit avec indulgence. Les **skills** règlent ça. Une skill est un court fichier Markdown d'instructions que l'agent charge quand c'est pertinent, ou quand vous tapez son nom comme commande slash (`/nom`). C'est la différence entre recruter quelqu'un de talentueux et recruter quelqu'un qui a une méthode.

J'utilise deux collections tous les jours, sur chaque projet, avec Claude Code :

- **[Ponytail](https://github.com/dietrichgebert/ponytail)** de Dietrich Gebert : fait penser l'agent comme « le senior paresseux » (*the lazy senior dev*). Écrire seulement ce que la tâche demande, réutiliser ce qui existe, et ne jamais sacrifier la validation, la gestion d'erreurs, la sécurité ou l'accessibilité.
- **[Les skills de Matt Pocock](https://github.com/mattpocock/skills)** : de petites skills composables pour « de la vraie ingénierie, pas du vibe coding ». Elles vous alignent avec l'agent avant la moindre ligne de code, et vous laissent maître du processus.

Après quelques mois, mon historique montre un schéma clair. Il tient en trois étapes.

Un mot sur les noms avant de commencer : les deux collections s'installent comme plugins Claude Code, et certains noms de commande courts entrent en conflit avec des commandes intégrées à Claude Code. Dans ce cas, tapez le nom complet avec le préfixe du plugin, par exemple `/mattpocock-skills:code-review`. Ci-dessous, j'écris toutes les commandes de Matt Pocock avec leur nom complet, pour qu'elles fonctionnent même si Claude Code ajoute une commande portant le même nom court.

## 1. Planifier : comprendre avant de coder

La plupart des mauvais résultats d'une IA viennent d'un malentendu, pas d'un mauvais code. Donc rien ne commence par du code.

- **`/mattpocock-skills:wayfinder`** pour tout ce qui est trop gros pour une seule session. Il transforme une idée floue en une carte de *décisions* dans votre gestionnaire de tickets (configuré une fois avec `/mattpocock-skills:setup-matt-pocock-skills`, voir plus bas), puis les tranche une par une. Il produit des décisions, pas du code : quand le chemin est clair, le plan est fini.
- **`/mattpocock-skills:grill-with-docs`** avant chaque tâche. L'agent m'interroge par séries de questions numérotées, chacune avec sa réponse recommandée, jusqu'à ce qu'on soit d'accord sur ce qu'on construit. C'est l'étape qui fait gagner le plus de temps : dix minutes de questions au lieu d'un après-midi à refaire. La partie « docs », c'est la modélisation du domaine : pendant la discussion, l'agent tient un `GLOSSARY.md` du vocabulaire du projet et propose un court enregistrement de décision d'architecture (ADR) pour les décisions difficilement réversibles, surprenantes et issues d'un vrai compromis. La session suivante, et le prochain agent, partent des mêmes mots et des mêmes décisions. (`/mattpocock-skills:grill-me` pose les questions sans la documentation, pour ce qui n'est pas du code.)
- **`/mattpocock-skills:research`** quand une question dépend de faits : une API, une bibliothèque, une spécification. Un agent en arrière-plan lit les sources primaires (documentation officielle, code source) et rédige une note Markdown avec ses références, pendant que je continue à travailler.

## 2. Construire : le plus petit changement qui marche vraiment

Ponytail est toujours actif : un hook (un script que Claude Code lance automatiquement) le charge au début de chaque session, je n'ai jamais à y penser. Avant d'écrire du code, l'agent suit une liste comme celle-ci (simplifiée) :

1. Est-ce que ça doit vraiment exister ?
2. Est-ce que ça existe déjà dans le code ?
3. Est-ce dans la bibliothèque standard ou la plateforme ?
4. Est-ce dans une dépendance qu'on a déjà ?
5. Est-ce que ça tient en une ligne qu'un lecteur comprend d'un coup d'œil ?
6. Seulement ensuite : écrire le minimum qui marche.

L'exemple du README le résume bien : pour un sélecteur de date, un agent sans la skill a écrit 335 lignes ; avec Ponytail, il a réutilisé le champ existant du projet avec le sélecteur de date natif du navigateur et en a écrit 10. Moins de code, c'est moins à relire, moins à maintenir et moins d'endroits où un bug peut se cacher.

Ce qui le rend fiable, c'est la liste de ce que Ponytail **ne coupe jamais** : la validation aux frontières de confiance, la gestion d'erreurs qui évite la perte de données, la sécurité et l'accessibilité. En plus, toute nouvelle logique non triviale (une condition, une boucle, un parseur, de l'argent ou de la sécurité) doit arriver avec un petit test. Paresseux sur la solution, jamais sur le travail.

Face à un bug, **`/mattpocock-skills:diagnosing-bugs`** remplace les suppositions par une méthode : d'abord construire une vérification rapide qui échoue sur ce bug précis, puis le cerner, tester des hypothèses, corriger la cause racine et ajouter un test de non-régression. Pour une question de conception, **`/mattpocock-skills:prototype`** construit une version jetable pour y répondre avant de s'engager.

## 3. Relire : deux relecteurs, deux angles

Ce sont les deux commandes que j'utilise le plus. Chaque changement passe par les deux avant d'être fusionné :

- **`/ponytail-review`** relit comme le senior qu'on appelle quand ça casse. Il lit le code que le changement touche, pas seulement le diff, et cherche les bugs, les failles de sécurité, le comportement sous vraie charge, le code risqué sans test, et le code qu'on pourrait supprimer. Chaque remarque explique ce qui ne va pas, comment le corriger et ce qui arrive si on l'ignore.
- **`/mattpocock-skills:code-review`** vérifie deux autres choses côte à côte : le code respecte-t-il les règles du projet, et fait-il vraiment ce que le ticket demandait ? `/code-review` seul peut lancer la relecture intégrée de Claude Code, selon l'application et la version ; le nom complet lance toujours la skill de Matt Pocock.

Ils trouvent des problèmes différents, donc je garde les deux. Ensuite **`/mattpocock-skills:pr`** rédige la description de la pull request, avec des preuves avant/après et le risque de fusionner. De temps en temps, **`/ponytail-audit`** fait les mêmes vérifications sur tout le dépôt et classe ce qu'il faut corriger en premier.

## Comment installer Ponytail et les skills de Matt Pocock dans Claude Code

Dans Claude Code, lancez ces deux commandes l'une après l'autre :

```
/plugin marketplace add DietrichGebert/ponytail
```

```
/plugin install ponytail@ponytail
```

Dans votre terminal :

```bash
claude plugin install mattpocock-skills@claude-plugins-official
```

Puis, de retour dans Claude Code, lancez `/mattpocock-skills:setup-matt-pocock-skills` une fois par dépôt : il demande quel gestionnaire de tickets vous utilisez, quelles étiquettes servent au tri des tickets, et, dans un monorepo, où enregistrer les documents.

Mon conseil : n'installez pas vingt skills le premier jour. Commencez par **`/mattpocock-skills:grill-with-docs`** avant chaque tâche et **`/ponytail-review`** avant chaque fusion. Ces deux-là suffisent à changer la qualité de ce que l'agent vous rend. Ajoutez le reste au fil des besoins. Les deux collections sont open source et se lisent en quelques minutes : lisez-les, adaptez-les, faites-les vôtres.

Nous appliquons ce flux dans nos offres de [développement](/fr/services/developpement) et d'[audit d'ingénierie](/fr/services/audit-ingenierie). L'agent lui-même tourne dans un bac à sable : voir [ddev-claude](/fr/blog/ddev-claude).
