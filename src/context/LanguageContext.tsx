import React, { createContext, useContext, useState, useEffect } from 'react';

export type LanguageCode = 
  | 'en' // English 🇬🇧
  | 'de' // Deutsch 🇩🇪
  | 'fr' // Français 🇫🇷
  | 'es' // Español 🇪🇸
  | 'it' // Italiano 🇮🇹
  | 'nl' // Nederlands 🇳🇱
  | 'pl' // Polski 🇵🇱
  | 'pt' // Português 🇵🇹
  | 'sv' // Svenska 🇸🇪
  | 'el' // Ελληνικά 🇬🇷
  | 'ro' // Română 🇷🇴
  | 'cs'; // Čeština 🇨🇿

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  region: string;
}

export const EU_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', region: 'UK / EU' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', region: 'Deutschland / Österreich' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', region: 'France / Belgique' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', region: 'España' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', region: 'Italia' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', region: 'Nederland / België' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', region: 'Polska' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', region: 'Portugal' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', region: 'Sverige' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷', region: 'Ελλάδα / Κύπρος' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴', region: 'România' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿', region: 'Česká republika' },
];

export type TranslationKey =
  // Header & Navbar
  | 'searchPlaceholder'
  | 'installApp'
  | 'installNow'
  | 'installed'
  | 'signIn'
  | 'login'
  | 'signOut'
  | 'armory'
  | 'pass'
  | 'dropZones'
  | 'squadWars'
  | 'proUpgrade'
  | 'proActive'
  | 'leaderboard'
  | 'createDare'
  | 'notifications'
  | 'soundOn'
  | 'soundMuted'
  | 'myProfile'
  | 'active'
  | 'verified'
  | 'credPool'
  | 'language'
  | 'selectLanguage'
  | 'euLanguages'
  // Landing Page & Hero Banner
  | 'communityStatus'
  | 'heroTitle1'
  | 'heroTitle2'
  | 'heroSubtitle'
  | 'dailyMissions'
  | 'dailyOps'
  | 'liveDuels'
  | 'arBeacons'
  | 'askAiOracle'
  | 'instantDare'
  // Categories
  | 'allChallenges'
  | 'techCode'
  | 'fitnessOutdoors'
  | 'socialFun'
  | 'artCreative'
  | 'wildUnusual'
  // Tabs & Filters
  | 'tabFeed'
  | 'tabHighRollers'
  | 'tabBounties'
  | 'tabReview'
  | 'tabVerified'
  | 'filterAll'
  | 'filterPublic'
  | 'filterDirect'
  // PWA Banner
  | 'pwaTitle'
  | 'pwaSubtitle'
  | 'pwaInstallBtn'
  // Direct Challenges
  | 'directPendingTitle'
  | 'directPendingDesc'
  | 'viewDirectDares'
  // Common Actions
  | 'acceptDare'
  | 'submitProof'
  | 'stakeCred'
  | 'bounty'
  | 'cred'
  | 'xp';

export const TRANSLATIONS: Record<LanguageCode, Record<TranslationKey, string>> = {
  en: {
    searchPlaceholder: 'Search dares by handle, keyword, bounty...',
    installApp: 'Install App',
    installNow: 'Install App Now',
    installed: 'App Installed',
    signIn: 'Sign In',
    login: 'Login',
    signOut: 'Sign Out',
    armory: 'Armory',
    pass: 'Pass',
    dropZones: 'Drop Zones',
    squadWars: 'Squad Wars',
    proUpgrade: 'Upgrade to PRO',
    proActive: 'PRO Active',
    leaderboard: 'Leaderboard',
    createDare: 'Create Dare',
    notifications: 'Notifications',
    soundOn: 'Audio On',
    soundMuted: 'Muted',
    myProfile: 'My Operative Profile',
    active: 'Active:',
    verified: 'Verified:',
    credPool: 'Pool:',
    language: 'Language',
    selectLanguage: 'Choose Language (EU)',
    euLanguages: 'European Union Languages',

    communityStatus: 'ACTIVE COMMUNITY DARES // ENGAGED',
    heroTitle1: 'DARE YOUR FRIENDS.',
    heroTitle2: 'CHALLENGE YOUR CIRCLE.',
    heroSubtitle: 'Challenge friends directly or post public dares for anyone to take. Complete challenges, submit proof, and earn Cred & XP.',
    dailyMissions: 'Daily Missions (Recon Ops)',
    dailyOps: 'Daily Ops',
    liveDuels: '1v1 Challenges (Live Duels)',
    arBeacons: 'AR Beacons',
    askAiOracle: 'Ask AI Oracle',
    instantDare: 'Instant AI Dare',

    allChallenges: 'All Challenges',
    techCode: 'Tech & Code',
    fitnessOutdoors: 'Fitness & Outdoors',
    socialFun: 'Social & Fun',
    artCreative: 'Art & Creative',
    wildUnusual: 'Wild & Unusual',

    tabFeed: 'Live Feed',
    tabHighRollers: 'High Rollers',
    tabBounties: 'Public Dares (Open Bounties)',
    tabReview: 'Proof Gallery',
    tabVerified: 'Verified Hall',

    filterAll: 'All Dares',
    filterPublic: 'Public Dares',
    filterDirect: 'Direct Challenges',

    pwaTitle: 'Experience DARE as a Native App',
    pwaSubtitle: 'Add DARE to your device home screen for lightning-fast access, fullscreen mode, and live challenge notifications.',
    pwaInstallBtn: 'Download DARE App',

    directPendingTitle: 'DIRECT CHALLENGES PENDING FOR YOU!',
    directPendingDesc: 'A peer has targeted you specifically with a high-voltage dare. Accept the challenge to claim the Cred bounty.',
    viewDirectDares: 'View Direct Dares',

    acceptDare: 'Accept Dare',
    submitProof: 'Submit Proof',
    stakeCred: 'Stake Cred',
    bounty: 'Bounty',
    cred: 'Cred',
    xp: 'XP',
  },

  de: {
    searchPlaceholder: 'Herausforderungen nach Name, Stichwort, Belohnung suchen...',
    installApp: 'App installieren',
    installNow: 'App jetzt installieren',
    installed: 'App installiert',
    signIn: 'Anmelden',
    login: 'Login',
    signOut: 'Abmelden',
    armory: 'Rüstkammer',
    pass: 'Pass',
    dropZones: 'Drop-Zonen',
    squadWars: 'Squad-Kriege',
    proUpgrade: 'Auf PRO upgraden',
    proActive: 'PRO Aktiv',
    leaderboard: 'Bestenliste',
    createDare: 'Dare erstellen',
    notifications: 'Benachrichtigungen',
    soundOn: 'Audio Ein',
    soundMuted: 'Stumm',
    myProfile: 'Mein Profil',
    active: 'Aktiv:',
    verified: 'Verifiziert:',
    credPool: 'Pool:',
    language: 'Sprache',
    selectLanguage: 'EU-Sprache wählen',
    euLanguages: 'Sprachen der Europäischen Union',

    communityStatus: 'AKTIVE COMMUNITY-DARES // VERNETZT',
    heroTitle1: 'FORDERE DEINE FREUNDE HERAUS.',
    heroTitle2: 'TESTE DEINEN KREIS.',
    heroSubtitle: 'Fordere gezielt Kontakte heraus oder erstelle offene Kopfgelder für alle. Reiche Foto- oder Videobeweise ein, lass dich von unserer KI bewerten und verdiene Cred.',
    dailyMissions: 'Tägliche Missionen',
    dailyOps: 'Tages-Ops',
    liveDuels: 'Live-Duelle',
    arBeacons: 'AR-Baken',
    askAiOracle: 'KI-Orakel fragen',
    instantDare: 'Sofortiges KI-Dare',

    allChallenges: 'Alle Dares',
    techCode: 'Tech & Code',
    fitnessOutdoors: 'Fitness & Sport',
    socialFun: 'Spaß & Social',
    artCreative: 'Kunst & Kreatives',
    wildUnusual: 'Verrückt & Gewagt',

    tabFeed: 'Live-Raster',
    tabHighRollers: 'High Roller',
    tabBounties: 'Offene Dares',
    tabReview: 'Beweisgalerie',
    tabVerified: 'Ruhmeshalle',

    filterAll: 'Alle Dares',
    filterPublic: 'Öffentliche Dares',
    filterDirect: 'Direkte Dares',

    pwaTitle: 'Erlebe DARE als native App',
    pwaSubtitle: 'Füge DARE zum Startbildschirm hinzu für blitzschnellen Start, Vollbildmodus und Live-Herausforderungsalarme.',
    pwaInstallBtn: 'DARE App herunterladen',

    directPendingTitle: 'DIREKTE HERAUSFORDERUNGEN WARTEN AUF DICH!',
    directPendingDesc: 'Jemand hat dich direkt mit einem Dare herausgefordert. Nimm die Herausforderung an, um das Kopfgeld zu sichern.',
    viewDirectDares: 'Direkte Dares ansehen',

    acceptDare: 'Dare annehmen',
    submitProof: 'Beweis einreichen',
    stakeCred: 'Cred setzen',
    bounty: 'Kopfgeld',
    cred: 'Cred',
    xp: 'XP',
  },

  fr: {
    searchPlaceholder: 'Rechercher des défis par pseudo, mot-clé, prime...',
    installApp: 'Installer l’App',
    installNow: 'Installer l’App maintenant',
    installed: 'App Installée',
    signIn: 'Connexion',
    login: 'Connexion',
    signOut: 'Déconnexion',
    armory: 'Armurerie',
    pass: 'Passe',
    dropZones: 'Drop Zones',
    squadWars: 'Guerres d’Escouade',
    proUpgrade: 'Passer à PRO',
    proActive: 'PRO Actif',
    leaderboard: 'Classement',
    createDare: 'Créer un Défi',
    notifications: 'Notifications',
    soundOn: 'Audio Actif',
    soundMuted: 'Muet',
    myProfile: 'Mon Profil',
    active: 'Actifs :',
    verified: 'Vérifiés :',
    credPool: 'Cagnotte :',
    language: 'Langue',
    selectLanguage: 'Choisir la langue (UE)',
    euLanguages: 'Langues de l’Union Européenne',

    communityStatus: 'DÉFIS COMMUNAUTAIRES ACTIFS // CONNECTÉ',
    heroTitle1: 'DÉFIE TES AMIS.',
    heroTitle2: 'PROVOQUE TON CERCLE.',
    heroSubtitle: 'Défie des amis directement ou lance des primes ouvertes à tous. Envoie une preuve photo ou vidéo, sois évalué par notre juge IA et gagne du Cred.',
    dailyMissions: 'Missions du Jour',
    dailyOps: 'Ops du Jour',
    liveDuels: 'Duels en Direct',
    arBeacons: 'Balises RA',
    askAiOracle: 'Consulter l’Oracle IA',
    instantDare: 'Défi IA Instantané',

    allChallenges: 'Tous les Défis',
    techCode: 'Tech & Code',
    fitnessOutdoors: 'Fitness & Plein Air',
    socialFun: 'Social & Fun',
    artCreative: 'Art & Créatif',
    wildUnusual: 'Fou & Insolite',

    tabFeed: 'Grille en Direct',
    tabHighRollers: 'Gros Joueurs',
    tabBounties: 'Primes Ouvertes',
    tabReview: 'Galerie des Preuves',
    tabVerified: 'Temple Vérifié',

    filterAll: 'Tous les Défis',
    filterPublic: 'Primes Publiques',
    filterDirect: 'Défis Directs',

    pwaTitle: 'Vivez DARE comme une application native',
    pwaSubtitle: 'Ajoutez DARE à votre écran d’accueil pour un accès ultra-rapide, le plein écran et des alertes de défi instantanées.',
    pwaInstallBtn: 'Télécharger l’App DARE',

    directPendingTitle: 'DES DÉFIS DIRECTS VOUS ATTENDENT !',
    directPendingDesc: 'Un ami vous a défié personnellement. Relevez le défi pour empocher la prime de Cred.',
    viewDirectDares: 'Voir mes défis directs',

    acceptDare: 'Relever le défi',
    submitProof: 'Soumettre preuve',
    stakeCred: 'Miser du Cred',
    bounty: 'Prime',
    cred: 'Cred',
    xp: 'XP',
  },

  es: {
    searchPlaceholder: 'Buscar retos por usuario, palabra clave, recompensa...',
    installApp: 'Instalar App',
    installNow: 'Instalar App ahora',
    installed: 'App Instalada',
    signIn: 'Iniciar Sesión',
    login: 'Acceder',
    signOut: 'Cerrar Sesión',
    armory: 'Armería',
    pass: 'Pase',
    dropZones: 'Zonas de Salto',
    squadWars: 'Guerras de Escuadrón',
    proUpgrade: 'Mejorar a PRO',
    proActive: 'PRO Activo',
    leaderboard: 'Clasificación',
    createDare: 'Crear Reto',
    notifications: 'Notificaciones',
    soundOn: 'Sonido Activado',
    soundMuted: 'Silenciado',
    myProfile: 'Mi Perfil',
    active: 'Activos:',
    verified: 'Verificados:',
    credPool: 'Bote:',
    language: 'Idioma',
    selectLanguage: 'Seleccionar idioma (UE)',
    euLanguages: 'Idiomas de la Unión Europea',

    communityStatus: 'RETOS ACTIVOS DE LA COMUNIDAD // EN LÍNEA',
    heroTitle1: 'RETA A TUS AMIGOS.',
    heroTitle2: 'DESAFÍA A TU CÍRCULO.',
    heroSubtitle: 'Reta a usuarios específicos directamente o publica recompensas abiertas. Envía pruebas en foto o video, recibe el veredicto del juez IA y gana Cred.',
    dailyMissions: 'Misiones Diarias',
    dailyOps: 'Ops Diarias',
    liveDuels: 'Duelos en Vivo',
    arBeacons: 'Balizas RA',
    askAiOracle: 'Consultar Oráculo IA',
    instantDare: 'Reto IA Instantáneo',

    allChallenges: 'Todos los Retos',
    techCode: 'Tecnología y Código',
    fitnessOutdoors: 'Fitness y Deportes',
    socialFun: 'Social y Diversión',
    artCreative: 'Arte y Creatividad',
    wildUnusual: 'Extremo e Insólito',

    tabFeed: 'Muro en Vivo',
    tabHighRollers: 'Grandes Apuestas',
    tabBounties: 'Recompensas Abiertas',
    tabReview: 'Galería de Pruebas',
    tabVerified: 'Sala Verificada',

    filterAll: 'Todos los Retos',
    filterPublic: 'Recompensas Públicas',
    filterDirect: 'Retos Directos',

    pwaTitle: 'Disfruta DARE como app nativa',
    pwaSubtitle: 'Instala DARE en tu pantalla de inicio para acceso ultrarrápido, modo pantalla completa y alertas de retos al instante.',
    pwaInstallBtn: 'Descargar App DARE',

    directPendingTitle: '¡TIENES RETOS DIRECTOS PENDIENTES!',
    directPendingDesc: 'Un compañero te ha desafiado directamente. Acepta el reto para llevarte la recompensa de Cred.',
    viewDirectDares: 'Ver Retos Directos',

    acceptDare: 'Aceptar Reto',
    submitProof: 'Enviar Prueba',
    stakeCred: 'Apostar Cred',
    bounty: 'Recompensa',
    cred: 'Cred',
    xp: 'XP',
  },

  it: {
    searchPlaceholder: 'Cerca sfide per utente, parola chiave, taglia...',
    installApp: 'Installa App',
    installNow: 'Installa App Ora',
    installed: 'App Installata',
    signIn: 'Accedi',
    login: 'Accedi',
    signOut: 'Esci',
    armory: 'Armeria',
    pass: 'Pass',
    dropZones: 'Drop Zone',
    squadWars: 'Guerre di Squadra',
    proUpgrade: 'Passa a PRO',
    proActive: 'PRO Attivo',
    leaderboard: 'Classifica',
    createDare: 'Crea Sfida',
    notifications: 'Notifiche',
    soundOn: 'Audio Attivo',
    soundMuted: 'Muto',
    myProfile: 'Il Mio Profilo',
    active: 'Attive:',
    verified: 'Verificate:',
    credPool: 'Montepremi:',
    language: 'Lingua',
    selectLanguage: 'Scegli lingua UE',
    euLanguages: 'Lingue dell’Unione Europea',

    communityStatus: 'SFIDE DELLA COMMUNITY ATTIVE // CONNESSO',
    heroTitle1: 'SFIDA I TUOI AMICI.',
    heroTitle2: 'METTI ALLA PROVA IL TUO GIRO.',
    heroSubtitle: 'Sfida amici direttamente o pubblica taglie aperte per tutti. Invia prove foto o video, ricevi la valutazione del giudice IA e guadagna Cred.',
    dailyMissions: 'Missioni Giornaliere',
    dailyOps: 'Ops Giornaliere',
    liveDuels: 'Duelli dal Vivo',
    arBeacons: 'Beacon AR',
    askAiOracle: 'Chiedi all’Oracolo IA',
    instantDare: 'Sfida IA Istantanea',

    allChallenges: 'Tutte le Sfide',
    techCode: 'Tech & Codice',
    fitnessOutdoors: 'Fitness & Outdoor',
    socialFun: 'Social & Divertimento',
    artCreative: 'Arte & Creatività',
    wildUnusual: 'Estremo & Bizzarro',

    tabFeed: 'Griglia Live',
    tabHighRollers: 'Grandi Puntate',
    tabBounties: 'Taglie Aperte',
    tabReview: 'Galleria Prove',
    tabVerified: 'Sala Verificata',

    filterAll: 'Tutte le Sfide',
    filterPublic: 'Taglie Pubbliche',
    filterDirect: 'Sfide Dirette',

    pwaTitle: 'Vivi DARE come un’app nativa',
    pwaSubtitle: 'Aggiungi DARE alla schermata iniziale per avvio istantaneo, visualizzazione a schermo intero e notifiche sulle sfide.',
    pwaInstallBtn: 'Scarica l’App DARE',

    directPendingTitle: 'HAI DELLE SFIDE DIRETTE IN SOSPESO!',
    directPendingDesc: 'Un utente ti ha sfidato direttamente. Accetta la sfida per incassare la taglia in Cred.',
    viewDirectDares: 'Visualizza Sfide Dirette',

    acceptDare: 'Accetta Sfida',
    submitProof: 'Invia Prova',
    stakeCred: 'Punta Cred',
    bounty: 'Taglia',
    cred: 'Cred',
    xp: 'XP',
  },

  nl: {
    searchPlaceholder: 'Zoek uitdagingen op naam, trefwoord, beloning...',
    installApp: 'App installeren',
    installNow: 'App nu installeren',
    installed: 'App geïnstalleerd',
    signIn: 'Inloggen',
    login: 'Login',
    signOut: 'Uitloggen',
    armory: 'Wapenkamer',
    pass: 'Pas',
    dropZones: 'Dropzones',
    squadWars: 'Squad-oorlogen',
    proUpgrade: 'Upgrade naar PRO',
    proActive: 'PRO Actief',
    leaderboard: 'Ranglijst',
    createDare: 'Dare aanmaken',
    notifications: 'Meldingen',
    soundOn: 'Audio Aan',
    soundMuted: 'Gedempt',
    myProfile: 'Mijn Profiel',
    active: 'Actief:',
    verified: 'Geverifieerd:',
    credPool: 'Pot:',
    language: 'Taal',
    selectLanguage: 'Kies EU-taal',
    euLanguages: 'Talen van de Europese Unie',

    communityStatus: 'ACTIEVE COMMUNITY-DARES // VERBONDEN',
    heroTitle1: 'DAAG JE VRIENDEN UIT.',
    heroTitle2: 'TEST JE KRING.',
    heroSubtitle: 'Daag specifieke vrienden rechtstreeks uit of plaats openbare beloningen. Dien foto- of videobewijs in, word beoordeeld door onze AI-rechter en verdien Cred.',
    dailyMissions: 'Dagelijkse Missies',
    dailyOps: 'Dagelijkse Ops',
    liveDuels: 'Live Duels',
    arBeacons: 'AR-bakens',
    askAiOracle: 'Vraag AI-Orakel',
    instantDare: 'Directe AI-Dare',

    allChallenges: 'Alle Dares',
    techCode: 'Tech & Code',
    fitnessOutdoors: 'Fitness & Buiten',
    socialFun: 'Sociaal & Plezier',
    artCreative: 'Kunst & Creatief',
    wildUnusual: 'Wild & Ongewoon',

    tabFeed: 'Live Raster',
    tabHighRollers: 'Hoge Inzetten',
    tabBounties: 'Open Beloningen',
    tabReview: 'Bewijsgalerij',
    tabVerified: 'Geverifieerde Hal',

    filterAll: 'Alle Dares',
    filterPublic: 'Publieke Dares',
    filterDirect: 'Directe Dares',

    pwaTitle: 'Ervaar DARE als een native app',
    pwaSubtitle: 'Voeg DARE toe aan je startscherm voor razendsnelle toegang, volledig scherm en directe notificaties.',
    pwaInstallBtn: 'Download DARE App',

    directPendingTitle: 'DIRECTE UITDAGINGEN WACHTEN OP JOU!',
    directPendingDesc: 'Iemand heeft je persoonlijk uitgedaagd. Ga de uitdaging aan om de Cred-bounty te winnen.',
    viewDirectDares: 'Bekijk Directe Dares',

    acceptDare: 'Dare Accepteren',
    submitProof: 'Bewijs Indienen',
    stakeCred: 'Cred Inzetten',
    bounty: 'Beloning',
    cred: 'Cred',
    xp: 'XP',
  },

  pl: {
    searchPlaceholder: 'Szukaj wyzwań po nicku, słowie kluczowym, nagrodzie...',
    installApp: 'Zainstaluj aplikację',
    installNow: 'Zainstaluj aplikację teraz',
    installed: 'Aplikacja zainstalowana',
    signIn: 'Zaloguj się',
    login: 'Login',
    signOut: 'Wyloguj',
    armory: 'Zbrojownia',
    pass: 'Karnet',
    dropZones: 'Strefy Zrzutu',
    squadWars: 'Wojny Drużyn',
    proUpgrade: 'Ulepsz do PRO',
    proActive: 'PRO Aktywny',
    leaderboard: 'Ranking',
    createDare: 'Stwórz Wyzwanie',
    notifications: 'Powiadomienia',
    soundOn: 'Dźwięk Włączony',
    soundMuted: 'Wyciszony',
    myProfile: 'Mój Profil',
    active: 'Aktywne:',
    verified: 'Zweryfikowane:',
    credPool: 'Pula:',
    language: 'Język',
    selectLanguage: 'Wybierz język (UE)',
    euLanguages: 'Języki Unii Europejskiej',

    communityStatus: 'AKTYWNE WYZWANIA SPOŁECZNOŚCI // POŁĄCZONO',
    heroTitle1: 'RZUĆ WYZWANIE ZNAJOMYM.',
    heroTitle2: 'PRZETESTUJ SWOJE OTOCZENIE.',
    heroSubtitle: 'Rzucaj wyzwania bezpośrednio znajomym lub publikuj otwarte nagrody dla wszystkich. Prześlij dowód wideo/foto, uzyskaj werdykt sędziego AI i zdobywaj Cred.',
    dailyMissions: 'Misje Dnia',
    dailyOps: 'Operacje Dnia',
    liveDuels: 'Pojedynki na Żywo',
    arBeacons: 'Nadajniki AR',
    askAiOracle: 'Zapytaj Wyrocznię AI',
    instantDare: 'Natychmiastowe Wyzwanie AI',

    allChallenges: 'Wszystkie Wyzwania',
    techCode: 'Tech & Kod',
    fitnessOutdoors: 'Fitness & Plener',
    socialFun: 'Zabawa & Społeczność',
    artCreative: 'Sztuka & Kreatywność',
    wildUnusual: 'Szalone & Niezwykłe',

    tabFeed: 'Siatka na Żywo',
    tabHighRollers: 'Wysokie Stawki',
    tabBounties: 'Otwarte Nagrody',
    tabReview: 'Galeria Dowodów',
    tabVerified: 'Zweryfikowane',

    filterAll: 'Wszystkie Wyzwania',
    filterPublic: 'Publiczne Nagrody',
    filterDirect: 'Wyzwania Bezpośrednie',

    pwaTitle: 'Używaj DARE jak natywnej aplikacji',
    pwaSubtitle: 'Dodaj DARE do ekranu głównego, aby uzyskać błyskawiczny start, pełny ekran i powiadomienia o wyzwaniach.',
    pwaInstallBtn: 'Pobierz aplikację DARE',

    directPendingTitle: 'MASZ OCZEKUJĄCE WYZWANIA BEZPOŚREDNIE!',
    directPendingDesc: 'Ktoś rzucił ci bezpośrednie wyzwanie. Podejmij je, aby odebrać nagrodę Cred.',
    viewDirectDares: 'Zobacz Wyzwania',

    acceptDare: 'Przyjmij Wyzwanie',
    submitProof: 'Prześlij Dowód',
    stakeCred: 'Postaw Cred',
    bounty: 'Nagroda',
    cred: 'Cred',
    xp: 'XP',
  },

  pt: {
    searchPlaceholder: 'Pesquisar desafios por usuário, palavra-chave, recompensa...',
    installApp: 'Instalar App',
    installNow: 'Instalar App Agora',
    installed: 'App Instalada',
    signIn: 'Entrar',
    login: 'Login',
    signOut: 'Sair',
    armory: 'Arsenal',
    pass: 'Passe',
    dropZones: 'Zonas de Queda',
    squadWars: 'Guerras de Esquadrão',
    proUpgrade: 'Melhorar para PRO',
    proActive: 'PRO Ativo',
    leaderboard: 'Classificação',
    createDare: 'Criar Desafio',
    notifications: 'Notificações',
    soundOn: 'Áudio Ligado',
    soundMuted: 'Mudo',
    myProfile: 'Meu Perfil',
    active: 'Ativos:',
    verified: 'Verificados:',
    credPool: 'Prêmio:',
    language: 'Idioma',
    selectLanguage: 'Selecionar idioma da UE',
    euLanguages: 'Idiomas da União Europeia',

    communityStatus: 'DESAFIOS COMUNITÁRIOS ATIVOS // CONECTADO',
    heroTitle1: 'DESAFIA OS TEUS AMIGOS.',
    heroTitle2: 'TESTA O TEU CÍRCULO.',
    heroSubtitle: 'Desafia amigos diretamente ou lança recompensas abertas a todos. Envia provas em foto ou vídeo, recebe a avaliação do juiz IA e ganha Cred.',
    dailyMissions: 'Missões Diárias',
    dailyOps: 'Ops Diárias',
    liveDuels: 'Duelos ao Vivo',
    arBeacons: 'Balizas RA',
    askAiOracle: 'Consultar Oráculo IA',
    instantDare: 'Desafio IA Instantâneo',

    allChallenges: 'Todos os Desafios',
    techCode: 'Tecnologia & Código',
    fitnessOutdoors: 'Fitness & Ar Livre',
    socialFun: 'Social & Diversão',
    artCreative: 'Arte & Criatividade',
    wildUnusual: 'Extremo & Incomum',

    tabFeed: 'Grelha ao Vivo',
    tabHighRollers: 'Grandes Apostas',
    tabBounties: 'Recompensas Abertas',
    tabReview: 'Galeria de Provas',
    tabVerified: 'Sala Verificada',

    filterAll: 'Todos os Desafios',
    filterPublic: 'Recompensas Públicas',
    filterDirect: 'Desafios Diretos',

    pwaTitle: 'Experimenta o DARE como uma app nativa',
    pwaSubtitle: 'Adiciona o DARE ao ecrã inicial para acesso ultrarrápido, modo ecrã inteiro e notificações de desafios.',
    pwaInstallBtn: 'Descarregar App DARE',

    directPendingTitle: 'TENS DESAFIOS DIRETOS PENDENTES!',
    directPendingDesc: 'Um colega desafiou-te diretamente. Aceita o desafio para recolher a recompensa em Cred.',
    viewDirectDares: 'Ver Desafios Diretos',

    acceptDare: 'Aceitar Desafio',
    submitProof: 'Enviar Prova',
    stakeCred: 'Apostar Cred',
    bounty: 'Recompensa',
    cred: 'Cred',
    xp: 'XP',
  },

  sv: {
    searchPlaceholder: 'Sök utmaningar på användarnamn, nyckelord, belöning...',
    installApp: 'Installera app',
    installNow: 'Installera app nu',
    installed: 'App installerad',
    signIn: 'Logga in',
    login: 'Logga in',
    signOut: 'Logga ut',
    armory: 'Vapenförråd',
    pass: 'Pass',
    dropZones: 'Drop-zoner',
    squadWars: 'Squad-krig',
    proUpgrade: 'Uppgradera till PRO',
    proActive: 'PRO Aktiv',
    leaderboard: 'Topplista',
    createDare: 'Skapa utmaning',
    notifications: 'Notiser',
    soundOn: 'Ljud På',
    soundMuted: 'Ljud Av',
    myProfile: 'Min Profil',
    active: 'Aktiva:',
    verified: 'Verifierade:',
    credPool: 'Pott:',
    language: 'Språk',
    selectLanguage: 'Välj EU-språk',
    euLanguages: 'Europeiska unionens språk',

    communityStatus: 'AKTIVA GEMENSKAPSUTMANINGAR // ONLINE',
    heroTitle1: 'UTMANA DINA VÄNNER.',
    heroTitle2: 'SÄTT DIN CIRKEL PÅ PROV.',
    heroSubtitle: 'Utmana specifika vänner direkt eller lägg ut öppna belöningar för allmänheten. Skicka in foto- eller videobevis, bedöms av vår AI-domare och tjäna Cred.',
    dailyMissions: 'Dagliga uppdrag',
    dailyOps: 'Dagliga Ops',
    liveDuels: 'Live-dueller',
    arBeacons: 'AR-fyrar',
    askAiOracle: 'Fråga AI-oraklet',
    instantDare: 'Snabb AI-utmaning',

    allChallenges: 'Alla utmaningar',
    techCode: 'Teknik & Kod',
    fitnessOutdoors: 'Träning & Friluftsliv',
    socialFun: 'Socialt & Nöje',
    artCreative: 'Konst & Kreativitet',
    wildUnusual: 'Vilt & Ovanligt',

    tabFeed: 'Live-rutnät',
    tabHighRollers: 'Storsatsare',
    tabBounties: 'Öppna belöningar',
    tabReview: 'Bevisgalleri',
    tabVerified: 'Verifierade hallen',

    filterAll: 'Alla utmaningar',
    filterPublic: 'Offentliga belöningar',
    filterDirect: 'Direkta utmaningar',

    pwaTitle: 'Upplev DARE som en mobilapp',
    pwaSubtitle: 'Lägg till DARE på hemskärmen för blixtsnabb start, helskärmsläge och direkta notiser om utmaningar.',
    pwaInstallBtn: 'Ladda ner DARE App',

    directPendingTitle: 'DIREKTA UTMANINGAR VÄNTAR PÅ DIG!',
    directPendingDesc: 'Någon har utmanat dig personligen. Anta utmaningen för att hämta Cred-belöningen.',
    viewDirectDares: 'Visa direkta utmaningar',

    acceptDare: 'Anta utmaning',
    submitProof: 'Skicka in bevis',
    stakeCred: 'Satsa Cred',
    bounty: 'Belöning',
    cred: 'Cred',
    xp: 'XP',
  },

  el: {
    searchPlaceholder: 'Αναζήτηση προκλήσεων με όνομα, λέξη-κλειδί, έπαθλο...',
    installApp: 'Εγκατάσταση App',
    installNow: 'Εγκατάσταση App Τώρα',
    installed: 'Εγκαταστάθηκε',
    signIn: 'Σύνδεση',
    login: 'Σύνδεση',
    signOut: 'Αποσύνδεση',
    armory: 'Οπλοστάσιο',
    pass: 'Πάσο',
    dropZones: 'Drop Zones',
    squadWars: 'Πόλεμοι Ομάδων',
    proUpgrade: 'Αναβάθμιση σε PRO',
    proActive: 'PRO Ενεργό',
    leaderboard: 'Κατάταξη',
    createDare: 'Δημιουργία Dare',
    notifications: 'Ειδοποιήσεις',
    soundOn: 'Ήχος Ενεργός',
    soundMuted: 'Σίγαση',
    myProfile: 'Το Προφίλ μου',
    active: 'Ενεργά:',
    verified: 'Επαληθευμένα:',
    credPool: 'Συνολικό Έπαθλο:',
    language: 'Γλώσσα',
    selectLanguage: 'Επιλογή γλώσσας (ΕΕ)',
    euLanguages: 'Γλώσσες Ευρωπαϊκής Ένωσης',

    communityStatus: 'ΕΝΕΡΓΕΣ ΠΡΟΚΛΗΣΕΙΣ ΚΟΙΝΟΤΗΤΑΣ // ΣΕ ΣΥΝΔΕΣΗ',
    heroTitle1: 'ΠΡΟΚΑΛΕΣΕ ΤΟΥΣ ΦΙΛΟΥΣ ΣΟΥ.',
    heroTitle2: 'ΔΟΚΙΜΑΣΕ ΤΟΝ ΚΥΚΛΟ ΣΟΥ.',
    heroSubtitle: 'Προκάλεσε συγκεκριμένους χρήστες απευθείας ή δημοσίευσε ανοιχτά έπαθλα για όλους. Στείλε απόδειξη βίντεο/φωτογραφίας, αξιολογήσου από το AI και κέρδισε Cred.',
    dailyMissions: 'Ημερήσιες Αποστολές',
    dailyOps: 'Ημερήσιες Ops',
    liveDuels: 'Ζωντανές Μονομαχίες',
    arBeacons: 'Φάροι AR',
    askAiOracle: 'Ρώτησε το Μαντείο AI',
    instantDare: 'Άμεσο AI Dare',

    allChallenges: 'Όλες οι Προκλήσεις',
    techCode: 'Τεχνολογία & Κώδικας',
    fitnessOutdoors: 'Fitness & Ύπαιθρος',
    socialFun: 'Κοινωνικά & Διασκέδαση',
    artCreative: 'Τέχνη & Δημιουργία',
    wildUnusual: 'Τρελά & Ασυνήθιστα',

    tabFeed: 'Ζωντανή Ροή',
    tabHighRollers: 'Υψηλά Στοιχήματα',
    tabBounties: 'Ανοιχτά Έπαθλα',
    tabReview: 'Γκαλερί Αποδείξεων',
    tabVerified: 'Επαληθευμένα',

    filterAll: 'Όλες οι Προκλήσεις',
    filterPublic: 'Δημόσια Έπαθλα',
    filterDirect: 'Άμεσες Προκλήσεις',

    pwaTitle: 'Ζήσε το DARE ως αυτόνομη εφαρμογή',
    pwaSubtitle: 'Πρόσθεσε το DARE στην αρχική οθόνη για ταχύτατη πρόσβαση, πλήρη οθόνη και άμεσες ειδοποιήσεις προκλήσεων.',
    pwaInstallBtn: 'Λήψη Εφαρμογής DARE',

    directPendingTitle: 'ΕΧΕΙΣ ΕΚΚΡΕΜΕΙΣ ΑΜΕΣΕΣ ΠΡΟΚΛΗΣΕΙΣ!',
    directPendingDesc: 'Κάποιος σε προκάλεσε προσωπικά. Αποδέξου την πρόκληση για να πάρεις το έπαθλο Cred.',
    viewDirectDares: 'Προβολή Προκλήσεων',

    acceptDare: 'Αποδοχή Dare',
    submitProof: 'Υποβολή Απόδειξης',
    stakeCred: 'Ποντάρισμα Cred',
    bounty: 'Έπαθλο',
    cred: 'Cred',
    xp: 'XP',
  },

  ro: {
    searchPlaceholder: 'Caută provocări după utilizator, cuvânt-cheie, recompensă...',
    installApp: 'Instalează App',
    installNow: 'Instalează App Acum',
    installed: 'App Instalată',
    signIn: 'Conectare',
    login: 'Login',
    signOut: 'Deconectare',
    armory: 'Armurărie',
    pass: 'Permis',
    dropZones: 'Zone de Lansare',
    squadWars: 'Războaie de Echipă',
    proUpgrade: 'Trecere la PRO',
    proActive: 'PRO Activ',
    leaderboard: 'Clasament',
    createDare: 'Creează Provocare',
    notifications: 'Notificări',
    soundOn: 'Audio Activat',
    soundMuted: 'Fără Sunet',
    myProfile: 'Profilul Meu',
    active: 'Active:',
    verified: 'Verificate:',
    credPool: 'Miză Totală:',
    language: 'Limbă',
    selectLanguage: 'Alege limba (UE)',
    euLanguages: 'Limbile Uniunii Europene',

    communityStatus: 'PROVOCĂRI ACTIVE ÎN COMUNITATE // CONECTAT',
    heroTitle1: 'PROVOACĂ-ȚI PRIETENII.',
    heroTitle2: 'TESTEAZĂ-ȚI CERCUL.',
    heroSubtitle: 'Provoacă utilizatori direct sau publică recompense deschise tuturor. Trimite dovezi foto sau video, primește evaluarea arbitrului AI și câștigă Cred.',
    dailyMissions: 'Misiuni Zilnice',
    dailyOps: 'Operațiuni Zilnice',
    liveDuels: 'Dueluri Live',
    arBeacons: 'Balize AR',
    askAiOracle: 'Întreabă Oracolul AI',
    instantDare: 'Provocare AI Instantanee',

    allChallenges: 'Toate Provocările',
    techCode: 'Tech & Cod',
    fitnessOutdoors: 'Fitness & Natură',
    socialFun: 'Social & Distracție',
    artCreative: 'Artă & Creativitate',
    wildUnusual: 'Extrem & Neobișnuit',

    tabFeed: 'Flux Live',
    tabHighRollers: 'Mize Mari',
    tabBounties: 'Recompense Deschise',
    tabReview: 'Galerie Dovezi',
    tabVerified: 'Sala Verificată',

    filterAll: 'Toate Provocările',
    filterPublic: 'Recompense Publice',
    filterDirect: 'Provocări Directe',

    pwaTitle: 'Bucură-te de DARE ca aplicație nativă',
    pwaSubtitle: 'Adaugă DARE pe ecranul principal pentru acces ultra-rapid, ecran complet și alerte instantanee de provocări.',
    pwaInstallBtn: 'Descarcă Aplicația DARE',

    directPendingTitle: 'AI PROVOCĂRI DIRECTE ÎN AȘTEPTARE!',
    directPendingDesc: 'Un prieten te-a provocat direct. Acceptă provocarea pentru a încasa recompensa Cred.',
    viewDirectDares: 'Vezi Provocările Directe',

    acceptDare: 'Acceptă Provocarea',
    submitProof: 'Trimite Dovada',
    stakeCred: 'Pariază Cred',
    bounty: 'Recompensă',
    cred: 'Cred',
    xp: 'XP',
  },

  cs: {
    searchPlaceholder: 'Hledat výzvy podle uživatele, klíčového slova, odměny...',
    installApp: 'Nainstalovat App',
    installNow: 'Nainstalovat App Nyní',
    installed: 'App Nainstalována',
    signIn: 'Přihlásit se',
    login: 'Přihlásit se',
    signOut: 'Odhlásit se',
    armory: 'Zbrojnice',
    pass: 'Pass',
    dropZones: 'Drop Zóny',
    squadWars: 'Války Týmů',
    proUpgrade: 'Přejít na PRO',
    proActive: 'PRO Aktivní',
    leaderboard: 'Žebříček',
    createDare: 'Vytvořit Výzvu',
    notifications: 'Upozornění',
    soundOn: 'Zvuk Zapnut',
    soundMuted: 'Ztlumeno',
    myProfile: 'Můj Profil',
    active: 'Aktivní:',
    verified: 'Ověřené:',
    credPool: 'Bank:',
    language: 'Jazyk',
    selectLanguage: 'Vyberte jazyk (EU)',
    euLanguages: 'Jazyky Evropské unie',

    communityStatus: 'AKTIVNÍ KOMUNITNÍ VÝZVY // PŘIPOJENO',
    heroTitle1: 'VYZVI SVÉ PŘÁTELE.',
    heroTitle2: 'PROVĚŘ SVŮJ OKRUH.',
    heroSubtitle: 'Vyzvi konkrétní přátele přímo nebo vypiš otevřené odměny pro všechny. Nahraj foto nebo video důkaz, nech se ohodnotit AI rozhodčím a získej Cred.',
    dailyMissions: 'Denní Mise',
    dailyOps: 'Denní Operace',
    liveDuels: 'Živé Souboje',
    arBeacons: 'AR Majáky',
    askAiOracle: 'Zeptat se AI Věštírny',
    instantDare: 'Okamžitá AI Výzva',

    allChallenges: 'Všechny Výzvy',
    techCode: 'Tech & Kód',
    fitnessOutdoors: 'Fitness & Venku',
    socialFun: 'Zábava & Přátelé',
    artCreative: 'Umění & Tvoření',
    wildUnusual: 'Šílené & Neobvyklé',

    tabFeed: 'Živý Přehled',
    tabHighRollers: 'Vysoké Sázky',
    tabBounties: 'Otevřené Odměny',
    tabReview: 'Galerie Důkazů',
    tabVerified: 'Ověřená Síň',

    filterAll: 'Všechny Výzvy',
    filterPublic: 'Veřejné Odměny',
    filterDirect: 'Přímé Výzvy',

    pwaTitle: 'Používejte DARE jako nativní aplikaci',
    pwaSubtitle: 'Přidejte si DARE na domovskou obrazovku pro bleskový start, zobrazení na celou obrazovku a okamžitá upozornění.',
    pwaInstallBtn: 'Stáhnout DARE App',

    directPendingTitle: 'ČEKAJÍ NA VÁS PŘÍMÉ VÝZVY!',
    directPendingDesc: 'Někdo vás vyzval přímo osobně. Přijměte výzvu a získejte odměnu v Cred.',
    viewDirectDares: 'Zobrazit Přímé Výzvy',

    acceptDare: 'Přijmout Výzvu',
    submitProof: 'Odeslat Důkaz',
    stakeCred: 'Vsadit Cred',
    bounty: 'Odměna',
    cred: 'Cred',
    xp: 'XP',
  },
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  currentLanguageInfo: LanguageInfo;
  languages: LanguageInfo[];
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function detectInitialLanguage(): LanguageCode {
  if (typeof window === 'undefined') return 'en';

  try {
    const saved = localStorage.getItem('dare_language') as LanguageCode | null;
    if (saved && EU_LANGUAGES.some(l => l.code === saved)) {
      return saved;
    }

    const browserLang = (navigator.language || (navigator as any).userLanguage || '').toLowerCase().split('-')[0];
    const match = EU_LANGUAGES.find(l => l.code === browserLang);
    if (match) {
      return match.code;
    }
  } catch (_e) {
    // LocalStorage access fallback
  }

  return 'en';
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(detectInitialLanguage);

  const setLanguage = (newLang: LanguageCode) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem('dare_language', newLang);
      document.documentElement.lang = newLang;
    } catch (_e) {
      // Storage safe
    }
  };

  useEffect(() => {
    try {
      document.documentElement.lang = language;
    } catch (_e) {}
  }, [language]);

  const currentLanguageInfo = EU_LANGUAGES.find(l => l.code === language) || EU_LANGUAGES[0];

  const t = (key: TranslationKey): string => {
    const langDict = TRANSLATIONS[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    return TRANSLATIONS.en[key] || (key as string);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        currentLanguageInfo,
        languages: EU_LANGUAGES,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
