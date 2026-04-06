# Architecture cible — GearConnect Mobile

```
gearconnect-mobile/
│
├── app/                    <- routes uniquement, et src/screens/ (contenu des écrans directement dans les routes)
│   ├── (auth)/
│   └── (app)/
│       ├── (tabs)/
│       ├── (events)/       <- eventDetail, createEvent, editEvent, performances…
│       ├── (social)/       <- postDetail, publication, friends, followList, userSearch
│       ├── (messaging)/    <- messages, conversation, newConversation, groupChannel
│       ├── (groups)/       <- groups, groupDetail, selectOrganizers
│       ├── (profile)/      <- profile, editProfile, settings, notifications, privacy…
│       ├── (jobs)/         <- createJobOffer, productList
│       └── (verification)/ <- verify, verificationRequest, verificationDashboard
│
├── src/                    <- (anciennement app/src/)
│   ├── components/
│   ├── services/
│   ├── hooks/
│   ├── context/
│   ├── types/              <- EventInterface.ts migré ici depuis services/
│   ├── styles/
│   ├── utils/
│   ├── config/
│   └── content/
│
├── assets/
│   ├── images.ts           <- (anciennement src/assets/images.ts)
│   ├── fonts/
│   └── images/
│
├── __tests__/              <- (anciennement app/__tests__/)
│
├── scripts/                <- (anciennement à la racine : *.ps1, *.sh, *.js)
│
└── docs/                   <- (anciennement à la racine : *.md)
```