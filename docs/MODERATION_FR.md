# Modération de texte (FR) — React Native Expo

Combo **`leo-profanity`** (moteur) + **`french-badwords-list`** (dictionnaire FR complet).

---

## 1. Installation

```bash
npm install leo-profanity french-badwords-list
```

---

## 2. Configuration — `src/utils/moderation.ts`

```ts
import filter from 'leo-profanity';
const frenchBadwords = require('french-badwords-list');

filter.clearList();                // Supprime la liste anglaise par défaut
filter.add(frenchBadwords.array); // Ajoute le dictionnaire FR (insultes, racisme…)

// Retourne true si le texte contient un mot interdit
export const hasBadWords = (text: string): boolean => filter.check(text);

// Remplace les mots interdits par des étoiles
export const cleanText = (text: string): string => filter.clean(text);

// Optionnel : ajouter des mots spécifiques
// filter.add(['mot-perso']);
```

---

## 3. Utilisation dans un composant

```tsx
import { hasBadWords } from '@/utils/moderation';

const handleSubmit = () => {
  if (hasBadWords(text)) {
    Alert.alert("Action refusée", "Le langage inapproprié n'est pas autorisé.");
    return;
  }
  // continuer…
};
```

---

## Points clés

| Point | Détail |
|---|---|
| **Dictionnaire** | `french-badwords-list` couvre insultes, termes haineux et racistes courants en France |
| **Performance** | Tout se passe en local, instantané |
| **Limite** | Ne détecte pas les contournements (`C.O.N`, fautes volontaires…) — seule une IA (Perspective API, OpenAI) y remédie |
| **Sécurité** | Toujours doubler la vérification côté serveur (Node.js) avant d'écrire en base |
