#!/bin/sh
# Hook SessionStart — situer la copie de travail par rapport à origin/main.
#
# Raison d'être : au démarrage, l'agent reçoit un instantané de `git status` qui
# ne dit RIEN de l'écart avec le dépôt distant. Une branche locale en retard de
# plusieurs dizaines de commits se lit alors comme l'état courant du projet — un
# audit fait dessus conclut sur du code qui n'existe plus, et une branche créée
# dessus se fait fermer d'office quand sa base disparaît à la fusion.
#
# Le hook fait donc deux choses, dans cet ordre :
#   1. `git fetch` — met à jour les refs distantes. Rien n'est fusionné, rien
#      n'est réécrit : la copie de travail n'est pas touchée.
#   2. renvoie l'écart en clair dans le contexte de la session.
#
# Tout échec est silencieux et sans effet : hors dépôt git, sans remote ou sans
# réseau, le hook sort en 0 et la session démarre normalement. Un hook de
# démarrage qui bloque coûte plus cher que le problème qu'il prévient.

set -u

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0
git remote get-url origin >/dev/null 2>&1 || exit 0

git fetch --quiet origin 2>/dev/null

# Branche par défaut du dépôt, déduite de origin/HEAD quand elle est connue.
# Repli sur origin/main : c'est la branche par défaut ici, et un repli vaut mieux
# qu'une sortie muette quand origin/HEAD n'a jamais été résolue localement.
base=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null) || base=origin/main
git rev-parse --verify --quiet "$base" >/dev/null 2>&1 || exit 0

branche=$(git rev-parse --abbrev-ref HEAD 2>/dev/null) || exit 0
# HEAD détachée : il n'y a pas de branche à situer, et « HEAD » ne dirait rien.
[ "$branche" = "HEAD" ] && exit 0

comptes=$(git rev-list --left-right --count "$base...HEAD" 2>/dev/null) || exit 0
retard=$(printf '%s' "$comptes" | cut -f1)
avance=$(printf '%s' "$comptes" | cut -f2)

# Le nom de branche part dans une chaîne JSON construite à la main : on retire
# les deux seuls caractères qui pourraient la casser, plutôt que d'ajouter une
# dépendance à jq pour une ligne de sortie.
branche=$(printf '%s' "$branche" | tr -d '"\\')

if [ "$retard" = "0" ] && [ "$avance" = "0" ]; then
	message="Refs distantes à jour (git fetch). Branche courante « $branche » : au meme niveau que $base."
else
	message="Refs distantes à jour (git fetch). Branche courante « $branche » : $retard commit(s) de RETARD sur $base, $avance en avance. Un retard non nul signifie que le code lu ici n'est pas l'état courant du projet — verifier sur $base avant tout audit, et créer toute nouvelle branche depuis $base."
fi

printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}\n' "$message"
