#!/usr/bin/env bash
# Refuse `git add -A`, `git add .` et `git add --all`.
#
# POURQUOI. Le 14/09/2026, un `git add -A` a fait entrer dans un commit poussé
# cinq fichiers de travail qui traînaient à la racine — dont un document interne
# concernant des personnes nommées. Le dépôt est public : l'objet reste servi par
# GitHub même après un force-push. Aucune relecture de diff n'aurait rattrapé
# l'erreur, parce que la commande avait déjà décidé du contenu du commit.
#
# Ce que ça n'empêche PAS, et c'est assumé : quelqu'un qui tape la commande dans
# son propre terminal. Le contrôle vaut pour les outils qui passent par ce dépôt.
#
# Pour le retirer : supprimer le bloc `hooks` de .claude/settings.json.

set -uo pipefail

commande=$(jq -r '.tool_input.command // ""' 2>/dev/null) || exit 0

# `-A`, `--all` ou `.` en tant que MOT isolé, dans le segment qui suit `git add`.
# `[^;&|]*` empêche de déborder sur la commande suivante d'une ligne chaînée, et
# exiger une espace (ou la fin) après le point laisse passer `git add ./src/x`.
if printf '%s' "$commande" | grep -Eq \
  'git[[:space:]]+add[[:space:]]+([^;&|]*[[:space:]])?(-A|--all|\.)([[:space:]]|$)'; then
  cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"git add -A / . / --all est refusé sur ce dépôt : la commande met en scène TOUT ce qui traîne, y compris des fichiers de travail non suivis. C'est exactement ce qui a publié un document interne le 14/09/2026, sur un dépôt public où l'objet reste accessible après un force-push. Indique les chemins un par un : git add src/pages/index.astro src/lib/club.ts — et si tu ne sais pas quoi indiquer, lance d'abord git status."}}
JSON
fi

exit 0
