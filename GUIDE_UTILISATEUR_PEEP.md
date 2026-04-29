# 🌊 Guide Rapide : Application Peep

Bonjour ! Ce petit guide est là pour vous accompagner. Il vous aidera à utiliser Peep 🐸 en toute tranquillité au quotidien. 

Peep 🐸 est votre outil maison pour créer les devis de vos installations de piscine. Pas de panique en cas de pépin, ce document contient toutes les réponses aux situations courantes. Tout est pensé pour être très simple !

---

### 📋 Mémento rapide : Quel est votre souci ?

| Situation | Ce que vous voyez à l'écran | Aller à la section |
| :--- | :--- | :--- |
| **Première connexion** | Vous voulez ouvrir Peep 🐸 sur un nouvel ordinateur. | [Section 1](#1-️-comment-accéder-à-lapplication-depuis-nimporte-quel-poste) |
| **L'application ne s'ouvre pas** | Page blanche, erreur, ou le chargement tourne dans le vide. | [Section 2](#2--lapplication-ne-souvre-pas--page-blanche--erreur-dans-le-navigateur) |
| **Blocage ou lenteur** | Peep 🐸 répond très lentement ou un calcul bloque. | [Section 5](#5--lapplication-est-lente-ou-bloque) |
| **Oubli de mot de passe** | Un collègue n'arrive plus à se connecter. | [Section 6](#6--un-utilisateur-a-oublié-son-mot-de-passe) |
| **Arrêt ou redémarrage** | Besoin d'éteindre ou relancer le moteur de Peep 🐸 sur le serveur. | [Section 3](#3--comment-redémarrer-lapplication-complètement) & [Section 4](#4--comment-arrêter-lapplication-proprement) |
| **Autre problème** | Quelque chose de bizarre que ce guide ne couvre pas. | [Section 7](#7--quoi-faire-en-cas-de-problème-non-listé) |

---

### 0. 🤔 Qu'est-ce que Peep exactement ?

Peep 🐸 est le cœur de vos devis. C'est une application qui vit et travaille directement sur le serveur local de l'entreprise. Vous n'avez rien à installer sur vos ordinateurs. Tant que vous êtes connectés au réseau du bureau, vous pouvez discuter avec le serveur et utiliser Peep 🐸 via votre navigateur internet.

Voici un petit schéma très simple pour visualiser la chose :

```text
 💻 Votre ordinateur 
         ⬇️
 🌐 Réseau de l'entreprise (Câble ou Wi-Fi)
         ⬇️
 🗄️ Serveur local (toujours allumé)
         ⬇️
 🌊 Application Peep
```

---

### 1. 🖥️ Comment accéder à l'application depuis n'importe quel poste

Rien de plus facile. Vous n'avez rien à installer pour utiliser Peep 🐸.

1. Ouvrez votre navigateur internet habituel (comme Google Chrome, Edge ou Safari).
2. Cliquez dans la barre de recherche tout en haut.
3. Tapez exactement cette adresse : **http://peep.local**
4. Appuyez sur la touche "Entrée". La belle page de connexion de Peep 🐸 va s'afficher.

---

### 2. 🔌 L'application ne s'ouvre pas / page blanche / erreur dans le navigateur

Pas d'inquiétude, c'est sûrement un tout petit souci de connexion. Souvent, c'est juste un câble mal branché !

Voici ce qu'il faut vérifier, dans cet ordre :
1. **Vérifiez votre connexion internet** : Assurez-vous que l'ordinateur que vous utilisez est bien connecté au réseau du bureau.
2. **Vérifiez l'adresse** : Regardez bien la barre d'adresse en haut. Il ne faut aucune faute de frappe dans http://peep.local.
3. **Le serveur est-il allumé ?** Allez voir physiquement la machine qui sert de serveur. Vérifiez qu'elle est bien allumée et qu'elle n'est pas simplement en veille.
4. Si tout semble correct, il suffit de donner un petit coup de fouet au moteur de l'application. Passez à la section 3 juste en dessous.

---

### 3. 🔄 Comment redémarrer l'application complètement

Un petit redémarrage fait toujours du bien. C'est sans aucun risque pour vos données, et ça règle beaucoup de petits caprices informatiques.

Il faut faire cette manipulation directement sur le serveur :
1. Installez-vous sur l'ordinateur qui fait office de serveur.
2. Ouvrez un "terminal" (ou une "invite de commande"). C'est la petite fenêtre noire où l'on tape du texte.
3. Allez dans le dossier de l'application. 
> Tapez la commande suivante puis appuyez sur Entrée :
> ```
> cd peep/
> ```
4. Donnez l'ordre de redémarrer le moteur de l'application.
> Tapez la commande suivante puis appuyez sur Entrée :
> ```
> docker-compose restart
> ```
5. Attendez quelques secondes. Vous pouvez retourner sur votre ordinateur et recharger la page. Peep 🐸 devrait refonctionner à merveille !

---

### 4. 🛑 Comment arrêter l'application proprement

Vous devez éteindre le serveur pour des travaux ou une coupure de courant prévue ? C'est une excellente idée de fermer l'application proprement avant d'éteindre la machine.

1. Installez-vous sur l'ordinateur qui fait office de serveur.
2. Ouvrez le terminal.
3. Allez dans le dossier de l'application.
> Tapez la commande suivante puis appuyez sur Entrée :
> ```
> cd peep/
> ```
4. Demandez au moteur de l'application de s'arrêter en douceur.
> Tapez la commande suivante puis appuyez sur Entrée :
> ```
> docker-compose down
> ```
5. *(Plus tard, quand l'électricité sera revenue, il suffira de taper cette commande pour tout relancer :)*
> Tapez la commande suivante puis appuyez sur Entrée :
> ```
> docker-compose up -d
> ```

---

### 5. 🐢 L'application est lente ou bloque

Il arrive que l'application s'essouffle un peu, surtout après une longue journée de calculs. C'est tout à fait normal.

1. Commencez toujours par la solution la plus simple : rafraîchissez votre page internet. Utilisez le bouton en forme de flèche qui tourne en haut à gauche, ou appuyez sur la touche F5.
2. Si ça bloque encore, et que c'est le cas pour tout le monde au bureau, c'est que le moteur a besoin d'une sieste éclair. 
3. Suivez les instructions de la [Section 3](#3--comment-redémarrer-lapplication-complètement) pour redémarrer. Cela règle 99% de ces petites lenteurs instantanément !

---

### 6. 🔑 Un utilisateur a oublié son mot de passe

Les oublis, ça arrive à tout le monde ! Vous avez la main pour débloquer votre collègue en un clin d'œil.

L'administrateur de l'outil (la personne qui possède les accès "admin@peep.local") peut créer un nouveau mot de passe. Voici comment faire :
1. Connectez-vous à Peep 🐸 avec le compte administrateur.
2. Allez sur le tableau de bord et cherchez la section de gestion des utilisateurs.
3. Trouvez le collègue bloqué dans la liste et cliquez sur son profil.
4. Entrez un nouveau mot de passe temporaire pour lui.
5. Sauvegardez, et donnez ce mot de passe à votre collègue. Il pourra se connecter tout de suite !

---

### 7. 🆘 Quoi faire en cas de problème non listé

Si vous êtes bloqué et que ce guide n'a pas la solution, rassurez-vous, je ne vous laisse pas tomber.

**Avant de me contacter, prenez juste une minute pour noter ces détails :**
- L'heure exacte du problème.
- Ce que vous faisiez juste avant (par exemple : "Je cliquais sur le bouton pour faire le PDF de la piscine Roman").

Si vous êtes à l'aise avec le serveur, vous pouvez aussi me copier le journal de bord du moteur. 
1. Allez sur le terminal du serveur.
> Tapez la commande suivante puis appuyez sur Entrée :
> ```
> cd peep/
> ```
2. Demandez à lire le journal.
> Tapez la commande suivante puis appuyez sur Entrée :
> ```
> docker-compose logs
> ```
3. Prenez une photo ou copiez le texte qui s'affiche.

**Contactez-moi à tout moment :**
- **Paul Hudyka**
- **paul.hudyka@gmail.com**
- **0607775947**

---

### 8. ⭐ Bonnes pratiques au quotidien

Pour garder un outil rapide et en bonne santé, voici 5 petites habitudes très simples à prendre :

- **Déconnectez-vous** toujours de Peep 🐸 quand vous quittez votre poste le soir.
- **Évitez d'ouvrir Peep 🐸 dans plein d'onglets** en même temps. Un seul onglet suffit amplement !
- **Sauvegardez vos devis régulièrement**, même si l'outil enregistre souvent vos actions tout seul.
- **N'utilisez pas la flèche "Retour"** de votre navigateur internet. Utilisez toujours les boutons à l'intérieur de Peep 🐸 pour naviguer sans erreur.
- **Signalez-moi tout petit bug visuel** tout de suite. Ne vous habituez pas à un affichage tordu, on peut le réparer très vite !

---

*Version du document : 1.0*  
*Dernière mise à jour : 29 Avril 2026*  
*Document confidentiel — usage interne ETS Maria*
