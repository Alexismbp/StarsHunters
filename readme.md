# 🌟 Stars Hunters

Stars Hunters és un joc multijugador desenvolupat amb TypeScript on els jugadors controlen naus espacials per recollir estrelles en un entorn competitiu. El joc utilitza WebSockets per a la comunicació en temps real entre jugadors i el servidor, proporcionant una experiència fluida i dinàmica.

## 📋 Contingut

- [🌟 Stars Hunters](#-stars-hunters)
  - [📋 Contingut](#-contingut)
  - [🎮 Descripció del Joc](#-descripció-del-joc)
  - [✨ Característiques Principals](#-característiques-principals)
  - [🚀 Funcionalitats Detallades](#-funcionalitats-detallades)
    - [Sistema de Jugabilitat](#sistema-de-jugabilitat)
    - [Gestió d'Estrelles](#gestió-destrelles)
    - [Sistema de Puntuació](#sistema-de-puntuació)
    - [Temporitzador de Joc](#temporitzador-de-joc)
    - [Panell d'Administració](#panell-dadministració)
    - [Arquitectura Client-Servidor](#arquitectura-client-servidor)
  - [🔧 Requisits Prèvis](#-requisits-prèvis)
  - [📥 Instal·lació](#-installació)
  - [🚀 Execució](#-execució)
  - [📖 Guia d'Ús](#-guia-dús)
    - [🎮 Interfície Principal](#-interfície-principal)
    - [⚙️ Panell d'Administració](#️-panell-dadministració)
    - [👾 Mode Jugador](#-mode-jugador)
    - [⌨️ Controls](#️-controls)
  - [📁 Estructura del Projecte](#-estructura-del-projecte)
  - [🔄 Cicle de Vida del Joc](#-cicle-de-vida-del-joc)
  - [💻 Desenvolupament](#-desenvolupament)
    - [Compilació Automàtica](#compilació-automàtica)
    - [Debugging](#debugging)
  - [🛠️ Tecnologies Utilitzades](#️-tecnologies-utilitzades)
  - [📝 Notes Addicionals](#-notes-addicionals)
  - [🤝 Contribució](#-contribució)
    - [Àrees de Millora Potencial](#àrees-de-millora-potencial)
  - [📄 Llicència](#-llicència)
  - [👥 Crèdits](#-crèdits)

## 🎮 Descripció del Joc

Stars Hunters és un joc en temps real on els jugadors controlen naus espacials que competeixen per recollir estrelles dispersades pel mapa. Cada estrella recollida suma un punt al jugador. La partida es pot guanyar assolint un nombre determinat de punts o quan s'acaba el temps establert (guanyant el jugador amb més punts).

El joc combina elements d'estratègia i reflexos ràpids, ja que els jugadors han de maniobrar les seves naus amb precisió per recollir les estrelles abans que els seus oponents, mentre eviten col·lisions amb els límits del mapa.

## ✨ Característiques Principals

- **Multijugador en temps real**: Suport per a múltiples jugadors simultanis
- **Sistema de recollida d'estrelles**: Els jugadors competeixen per recollir estrelles dispersades aleatòriament
- **Sistema de puntuació dinàmica**: Actualització en temps real de les puntuacions
- **Límit de temps configurable**: L'administrador pot establir un temps límit per a la partida
- **Gestió dinàmica d'estrelles**: Les estrelles apareixen, desapareixen i es reposicionen automàticament
- **Efectes visuals**: Animacions per a la recollida i desaparició d'estrelles
- **Control avançat de naus**: Moviment en 8 direccions (incloses diagonals) amb rotació de la nau
- **Panell d'administració complet**: Interfície per a configurar i gestionar el joc
- **Comunicació WebSocket**: Arquitectura client-servidor optimitzada per a jocs en temps real
- **Disseny responsiu**: Adaptable a diferents mides de pantalla

## 🚀 Funcionalitats Detallades

### Sistema de Jugabilitat

1. **Control de Naus**:

   - Control precís de les naus mitjançant les tecles de direcció
   - Moviment fluid en 8 direccions (amunt, avall, esquerra, dreta i totes les diagonals)
   - Rotació automàtica de la nau segons la direcció del moviment
   - Detecció de col·lisions amb els límits del mapa per evitar sortir de l'àrea de joc

2. **Detecció de Col·lisions**:

   - Sistema precís de col·lisió entre naus i estrelles utilitzant l'algoritme de caixa de col·lisió AABB (Axis-Aligned Bounding Box)
   - Optimització per evitar falsos positius o deteccions duplicades
   - Confirmació de col·lisions des del servidor per evitar trampes

3. **Efectes Visuals**:
   - Efecte de brillantor per destacar la nau del jugador actual
   - Animació de resplendor i partícules quan es recull una estrella
   - Efecte de desvaniment quan una estrella desapareix per temps
   - Indicadors visuals per a esdeveniments del joc (victòria, temps esgotat)

### Gestió d'Estrelles

1. **Generació Dinàmica**:

   - Creació procedural d'estrelles en posicions aleatòries dins del mapa
   - Sistema per evitar solapaments o posicions invàlides
   - Generació constant per mantenir sempre el nombre configurat d'estrelles en el joc

2. **Cicle de Vida d'Estrelles**:

   - Cada estrella té un temps de vida aleatori (entre 15 i 45 segons)
   - Sistema de temporitzadors per gestionar la desaparició i regeneració d'estrelles
   - Notificació a tots els clients quan una estrella desapareix o apareix

3. **Reposicionament**:
   - Quan un jugador recull una estrella, es genera automàticament una nova en una altra posició
   - Quan una estrella assoleix el seu temps màxim de vida, és reemplaçada per una de nova
   - Lògica per garantir que sempre existeixi el nombre configurat d'estrelles en el joc

### Sistema de Puntuació

1. **Seguiment de Punts**:

   - Increment automàtic de la puntuació en recollir estrelles
   - Emmagatzematge de les puntuacions al servidor per mantenir la integritat
   - Sincronització amb tots els clients per mostrar la informació actualitzada

2. **Panell de Puntuacions**:

   - Visualització en temps real de les puntuacions de tots els jugadors
   - Ordenació automàtica segons la puntuació
   - Destacat visual per al jugador amb més puntuació

3. **Condicions de Victòria**:
   - Victòria per punts: el primer jugador en assolir el límit de puntuació configurat guanya
   - Victòria per temps: quan s'acaba el temps, guanya el jugador amb més punts
   - Gestió d'empat quan diversos jugadors tenen la mateixa puntuació màxima

### Temporitzador de Joc

1. **Configuració del Temps**:

   - L'administrador pot establir un límit de temps per a la partida (entre 30 i 600 segons)
   - Opció per jugar sense límit de temps (només victòria per puntuació)
   - Validació per assegurar valors de temps correctes

2. **Visualització del Temps**:

   - Comptador enrere visible per a tots els jugadors
   - Actualitzacions periòdiques des del servidor per mantenir la sincronització
   - Alertes visuals quan el temps està a punt d'esgotar-se

3. **Finalització per Temps**:
   - Determinació automàtica del guanyador quan s'esgota el temps
   - Notificació a tots els clients del resultat final
   - Opció per reiniciar la partida sense necessitat de reconfiguracions

### Panell d'Administració

1. **Configuració del Joc**:

   - Ajust de les dimensions de l'àrea de joc (ample i alt)
   - Configuració del límit de puntuació per guanyar
   - Ajust del temps límit de la partida
   - Aplicació immediata dels canvis al joc

2. **Control de la Partida**:

   - Botó per iniciar i aturar la partida
   - Monitorització en temps real de l'estat i esdeveniments del joc
   - Capacitat per reiniciar la partida conservant la configuració

3. **Supervisió de Jugadors**:
   - Visualització de tots els jugadors connectats
   - Estadístiques de cada jugador (puntuació, posició)
   - Informació sobre esdeveniments del joc (col·lisions, recollides)

### Arquitectura Client-Servidor

1. **Comunicació WebSocket**:

   - Connexió bidireccional en temps real per minimitzar la latència
   - Protocol de missatgeria optimitzat per reduir el tràfic
   - Gestió robusta de connexions i reconexions

2. **Gestió d'Usuaris**:

   - Diferenciació entre administrador i jugadors
   - Assignació d'identificadors únics a cada jugador
   - Control d'accés per a funcionalitats administratives

3. **Sincronització d'Estat**:
   - Enviament periòdic de l'estat del joc a tots els clients
   - Protocol per a la gestió d'inconsistències d'estat
   - Priorizació de missatges crítics per a l'experiència de joc

## 🔧 Requisits Prèvis

- XAMPP instal·lat (versió 7.4 o superior)
- Node.js (versió 14 o superior) i npm instal·lats
- TypeScript (`npm install -g typescript`)
- Navegador web modern amb suport per WebSockets (Chrome, Firefox, Edge, Safari)

## 📥 Instal·lació

1. Clona aquest repositori a la teva carpeta XAMPP htdocs:

   ```bash
   git clone git clone https://github.com/Alexismbp/StarsHunters.git
   ```

2. Navega al directori del projecte:

   ```bash
   cd /Applications/XAMPP/xamppfiles/htdocs/Practiques/M12-Projecte/StarsHunters
   ```

3. Instal·la les dependències:

   ```bash
   npm install
   ```

4. Compila els fitxers TypeScript:

   ```bash
   npm run build
   ```

## 🚀 Execució

1. Inicia XAMPP:

   - Inicia els serveis d'Apache
   - Assegura't que el port 8080 estigui disponible per al servidor HTTP

2. Inicia el servidor WebSocket:

   Alternativament, pots utilitzar l'script d'inici inclòs:

   ```bash
   node start-server.js
   ```

   Hauries de veure missatges que confirmen que:

   - El servidor HTTP està escoltant al port 8080
   - El servidor WebSocket està escoltant al port 8180

3. Accedeix a l'aplicació a través del teu navegador:
   - [http://localhost/Practiques/M12-Projecte/StarsHunters/](http://localhost/Practiques/M12-Projecte/StarsHunters/)

## 📖 Guia d'Ús

### 🎮 Interfície Principal

En accedir a l'aplicació, se't presenta una pantalla inicial amb dues opcions:

- **Administrar**: Per accedir al panell de control de l'administrador
- **Jugar**: Per unir-te a la partida com a jugador

La interfície principal és minimalista i clara, permetent una ràpida selecció del rol desitjat.

### ⚙️ Panell d'Administració

El panell d'administració està dissenyat per configurar i controlar el joc:

1. **Configuració de l'àrea de joc**:

   - **Amplada**: Defineix l'amplada de l'àrea de joc (entre 640 i 1280 píxels)
   - **Alçada**: Defineix l'alçada de l'àrea de joc (entre 480 i 960 píxels)
   - **Límit de puntuació**: Estableix quants punts cal aconseguir per guanyar (entre 1 i 50)
   - **Temps límit**: Defineix la durada màxima de la partida en segons (entre 30 i 600)

2. **Control de la partida**:

   - **Botó "Configurar"**: Aplica els canvis de configuració realitzats
   - **Botó "Engegar/Aturar"**: Inicia la partida quan està aturada o la deté quan està en curs
   - El text del botó canvia dinàmicament segons l'estat del joc

3. **Monitorització**:
   - **Panell de temps**: Mostra el temps restant de la partida
   - **Panell de puntuacions**: Llista de jugadors amb les seves puntuacions actuals
   - **Àrea de visualització**: Mostra l'estat actual del joc, incloent la posició de tots els jugadors i estrelles

### 👾 Mode Jugador

L'experiència de joc està dissenyada per ser intuïtiva i dinàmica:

1. **Interfície de jugador**:

   - **Panell lateral**: Mostra informació rellevant com el temps restant i les puntuacions
   - **Àrea de joc**: Visualització del mapa amb totes les naus i estrelles
   - **Indicadors visuals**: La teva nau apareix destacada per facilitar la identificació

2. **Mecànica de joc**:

   - **Moviment**: Utilitza les tecles de direcció per moure la teva nau per l'espai
   - **Recollida**: Acosta't a les estrelles per recollir-les automàticament
   - **Puntuació**: Cada estrella recollida suma un punt al teu comptador

3. **Retroalimentació visual**:
   - **Efectes de recollida**: Animació de partícules quan reculls una estrella
   - **Efectes de desaparició**: Animació quan una estrella desapareix per temps
   - **Notificacions**: Missatges a la consola i visuals sobre esdeveniments importants

### ⌨️ Controls

1. **Moviment bàsic**:

   - ↑ (Fletxa amunt): Moure cap amunt
   - ↓ (Fletxa avall): Moure cap avall
   - ← (Fletxa esquerra): Moure cap a l'esquerra
   - → (Fletxa dreta): Moure cap a la dreta

2. **Moviment diagonal**:

   - ↑ + ← (Amunt + Esquerra): Moure en diagonal cap amunt-esquerra
   - ↑ + → (Amunt + Dreta): Moure en diagonal cap amunt-dreta
   - ↓ + ← (Avall + Esquerra): Moure en diagonal cap avall-esquerra
   - ↓ + → (Avall + Dreta): Moure en diagonal cap avall-dreta

3. **Interacció amb estrelles**:
   - La recollida d'estrelles és automàtica en col·lisionar amb elles
   - No cal prémer cap tecla addicional per recollir-les

## 📁 Estructura del Projecte

```
StarsHunters/
│
├── src/                         # Codi font TypeScript
│   ├── admin.ts                 # Lògica del panell d'administració
│   ├── player.ts                # Lògica del client jugador
│   └── pyramid.ts               # Lògica compartida del joc
│
├── dist/                        # Fitxers JavaScript compilats
│   ├── admin.js                 # Codi de l'administrador compilat
│   ├── player.js                # Codi del jugador compilat
│   └── pyramid.js               # Codi compartit compilat
│
├── server/                      # Servidor Node.js
│   ├── index.js                 # Punt d'entrada del servidor
│   ├── networking/              # Mòduls de xarxa
│   │   ├── http-server.js       # Servidor HTTP per a fitxers estàtics
│   │   └── websocket-server.js  # Servidor WebSocket per a comunicació en temps real
│   ├── game/                    # Lògica del joc al servidor
│   │   ├── game-manager.js      # Gestor principal del joc
│   │   ├── player-manager.js    # Gestió de jugadors
│   │   ├── star-manager.js      # Gestió d'estrelles
│   │   └── collision.js         # Detecció de col·lisions
│   ├── config/                  # Configuració del joc
│   │   └── game-config.js       # Configuració centralitzada
│   └── utils/                   # Utilitats generals
│       └── helpers.js           # Funcions auxiliars
│
├── css/                         # Fitxers d'estil
│   └── styles.css               # Estils principals
│
├── img/                         # Imatges del joc
│   ├── nau3.svg                 # Nau del jugador actual
│   ├── nau4.svg                 # Nau d'altres jugadors
│   └── estrella.svg             # Imatge de l'estrella
│
├── *.html                       # Fitxers HTML
│   ├── index.html               # Pàgina principal de selecció
│   ├── admin.html               # Interfície d'administració
│   └── player.html              # Interfície de jugador
│
├── compile.sh                   # Script per compilar fitxers TypeScript
├── package.json                 # Configuració de dependències i scripts
└── tsconfig.json                # Configuració de TypeScript
```

## 🔄 Cicle de Vida del Joc

1. **Inicialització**:

   - L'administrador configura els paràmetres del joc (dimensions, límits, temps)
   - El servidor inicialitza l'estat del joc amb la configuració proporcionada
   - Es generen les estrelles inicials en posicions aleatòries

2. **Connexió de jugadors**:

   - Els jugadors es connecten a través de WebSockets
   - Cada jugador rep un ID únic i se li assigna una nau
   - El servidor envia l'estat actual del joc a tots els clients

3. **Gameplay**:

   - Els jugadors controlen les seves naus per recollir estrelles
   - El servidor detecta col·lisions i actualitza les puntuacions
   - Les estrelles recollides o caducades són reemplaçades per noves
   - S'actualitza constantment l'estat del joc i s'envia a tots els clients

4. **Finalització**:
   - El joc acaba quan un jugador assoleix el límit de puntuació o s'acaba el temps
   - Es determina el guanyador segons les regles establertes
   - Es notifica a tots els clients sobre el resultat
   - L'administrador pot reiniciar el joc per a una nova partida

## 💻 Desenvolupament

### Compilació Automàtica

Per facilitar el desenvolupament, pots utilitzar el mode de compilació automàtica:

```bash
npm run watch
```

Aquest comandament executarà el compilador TypeScript en mode watch, recompilant automàticament els fitxers quan s'hi detectin canvis.

### Debugging

Per depurar el codi:

1. Utilitza les eines de desenvolupament del navegador (F12):

   - La pestanya Console mostra missatges de log detallats del joc
   - La pestanya Network permet veure la comunicació WebSocket
   - La pestanya Elements facilita la inspecció del DOM i els elements SVG

2. Missatges de log al client:

   - El codi inclou missatges de log detallats amb emoticones per facilitar la identificació
   - Les col·lisions, moviments i esdeveniments es registren amb informació rellevant

3. Debugging del servidor:
   - Els missatges del servidor es mostren a la terminal on s'executa
   - Utilitza Node.js inspector o eines com nodemon per a un desenvolupament més eficient

## 🛠️ Tecnologies Utilitzades

- **TypeScript**: Llenguatge principal del costat del client, proporcionant tipatge estàtic
- **Node.js**: Entorn d'execució per al servidor
- **WebSocket**: Protocol de comunicació en temps real
- **SVG**: Gràfics vectorials per renderitzar el joc
- **HTML5/CSS3**: Estructura i estil de la interfície d'usuari
- **npm**: Gestió de dependències
- **ws**: Biblioteca WebSocket per a Node.js

## 📝 Notes Addicionals

- **Resolució de problemes coneguts**:

  - Si experimentes latència en el moviment, verifica la teva connexió de xarxa
  - En cas de problemes de connexió WebSocket, comprova que el port 8180 no estigui bloquejat pel tallafoc
  - Si les imatges no es carreguen correctament, verifica que els fitxers SVG estiguin presents a la carpeta `img/`

- **Requisits del sistema**:
  - Es recomana un navegador actualitzat (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
  - Resolució mínima de pantalla recomanada: 1024x768 píxels

## 🤝 Contribució

1. Fes un fork del repositori
2. Crea una branca per a la teva funcionalitat: `git checkout -b feature/nova-funció`
3. Realitza els teus canvis i fes commit: `git commit -m 'Afegeix nova funcionalitat'`
4. Envia els teus canvis: `git push origin feature/nova-funció`
5. Obre un Pull Request

### Àrees de Millora Potencial

- Implementació de sales de joc per a partides simultànies
- Sistema de comptes d'usuari persistents
- Millores visuals i efectes addicionals
- Obstacles i mecàniques de joc addicionals
- Mode per a dispositius mòbils amb controls tàctils

## 📄 Llicència

Aquest projecte està llicenciat sota la Llicència MIT - consulta el fitxer LICENSE per a més detalls.

## 👥 Crèdits

- **Desenvolupament**: Biel Martínez, Alexis Boisset
- **Supervisió**: Departament d'Informàtica
- **Gràfics**: Recursos lliures adaptats per al projecte

---

¡Disfruta jugant i programant amb Stars Hunters!
