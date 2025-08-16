// Inicialización de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDBq6hjwHXksCrUjK-PsTz61cT8h-smkS4",
    authDomain: "juego-compuertas.firebaseapp.com",
    projectId: "juego-compuertas",
    storageBucket: "juego-compuertas.appspot.com",
    messagingSenderId: "167537260381",
    appId: "1:167537260381:web:85180dddc2084b57255ab4",
    measurementId: "G-3FCKD6K0G5"
};

// Inicializar Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const analytics = firebase.analytics();

// Inicializar EmailJS
emailjs.init("A01nH6sGTORkkuYo9");

// Variables globales
let currentPlayer = {
    id: null,
    name: '',
    email: '',
    score: 0,
    level: 1,
    completedLevels: [],
    startTime: null,
    endTime: null,
    isActive: false
};

let gameState = {
    isGameStarted: false,
    isGameEnded: false,
    timeLimit: 10 * 60, // 10 minutos en segundos
    remainingTime: 10 * 60,
    timerInterval: null,
    currentGlobalLevel: 1
};

// Niveles del juego
const levels = [
    {
        id: 1,
        title: "Nivel 1: Compuerta AND",
        description: "Conecta las entradas A y B a la compuerta AND para obtener el resultado correcto.",
        inputs: [
            { id: 'A', value: true },
            { id: 'B', value: false }
        ],
        gates: ['AND'],
        expectedOutput: false,
        solution: ['A-AND', 'B-AND', 'AND-OUTPUT']
    },
    {
        id: 2,
        title: "Nivel 2: Compuerta OR",
        description: "Conecta las entradas A y B a la compuerta OR para obtener el resultado correcto.",
        inputs: [
            { id: 'A', value: false },
            { id: 'B', value: true }
        ],
        gates: ['OR'],
        expectedOutput: true,
        solution: ['A-OR', 'B-OR', 'OR-OUTPUT']
    },
    {
        id: 3,
        title: "Nivel 3: Compuerta NOT",
        description: "Conecta la entrada A a la compuerta NOT para invertir su valor.",
        inputs: [
            { id: 'A', value: true }
        ],
        gates: ['NOT'],
        expectedOutput: false,
        solution: ['A-NOT', 'NOT-OUTPUT']
    },
    {
        id: 4,
        title: "Nivel 4: Combinación AND y OR",
        description: "Combina las compuertas AND y OR para obtener el resultado correcto.",
        inputs: [
            { id: 'A', value: true },
            { id: 'B', value: false },
            { id: 'C', value: true }
        ],
        gates: ['AND', 'OR'],
        expectedOutput: true,
        solution: ['A-AND', 'B-AND', 'AND-OR', 'C-OR', 'OR-OUTPUT']
    },
    {
        id: 5,
        title: "Nivel 5: Combinación NOT y AND",
        description: "Combina las compuertas NOT y AND para obtener el resultado correcto.",
        inputs: [
            { id: 'A', value: true },
            { id: 'B', value: true }
        ],
        gates: ['NOT', 'AND'],
        expectedOutput: false,
        solution: ['A-NOT', 'NOT-AND', 'B-AND', 'AND-OUTPUT']
    }
];

// Conexiones actuales del jugador
let currentConnections = [];

// Referencias a elementos del DOM
const loginContainer = document.getElementById('login-container');
const waitingContainer = document.getElementById('waiting-container');
const gameContainer = document.getElementById('game-container');
const gameOverContainer = document.getElementById('game-over-container');
const playerNameInput = document.getElementById('player-name');
const playerEmailInput = document.getElementById('player-email');
const registerBtn = document.getElementById('register-btn');
const waitingPlayerName = document.getElementById('waiting-player-name');
const waitingPlayerEmail = document.getElementById('waiting-player-email');
const connectedPlayersList = document.getElementById('connected-players');
const currentPlayerSpan = document.getElementById('current-player');
const currentScoreSpan = document.getElementById('current-score');
const currentLevelSpan = document.getElementById('current-level');
const timerSpan = document.getElementById('timer');
const progressBar = document.getElementById('progress-bar');
const levelDescription = document.getElementById('level-description');
const inputsContainer = document.getElementById('inputs-container');
const gatesContainer = document.getElementById('gates-container');
const outputContainer = document.getElementById('output-container');
const checkSolutionBtn = document.getElementById('check-solution');
const nextLevelBtn = document.getElementById('next-level');
const motivationalMessage = document.getElementById('motivational-message');
const finalPlayerName = document.getElementById('final-player-name');
const finalScore = document.getElementById('final-score');
const finalLevels = document.getElementById('final-levels');
const finalTime = document.getElementById('final-time');

// Event Listeners
registerBtn.addEventListener('click', registerPlayer);
checkSolutionBtn.addEventListener('click', checkSolution);
nextLevelBtn.addEventListener('click', loadNextLevel);

// Función para registrar un nuevo jugador
function registerPlayer() {
    const name = playerNameInput.value.trim();
    const email = playerEmailInput.value.trim();

    if (!name || !email) {
        alert('Por favor ingresa tu nombre y correo electrónico');
        return;
    }

    if (!validateEmail(email)) {
        alert('Por favor ingresa un correo electrónico válido');
        return;
    }

    // Crear objeto de jugador
    currentPlayer = {
        name,
        email,
        score: 0,
        level: 1,
        completedLevels: [],
        startTime: null,
        endTime: null,
        isActive: true
    };

    // Guardar jugador en Firestore
    db.collection('players').add(currentPlayer)
        .then((docRef) => {
            currentPlayer.id = docRef.id;
            updatePlayerInFirestore();
            
            // Mostrar pantalla de espera
            loginContainer.classList.add('hidden');
            waitingContainer.classList.remove('hidden');
            
            waitingPlayerName.textContent = `Nombre: ${name}`;
            waitingPlayerEmail.textContent = `Email: ${email}`;
            
            // Escuchar cambios en el estado del juego
            listenToGameState();
            listenToPlayers();
        })
        .catch((error) => {
            console.error('Error al registrar jugador:', error);
            alert('Ocurrió un error al registrarte. Por favor intenta nuevamente.');
        });
}

// Función para validar email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Función para actualizar el jugador en Firestore
function updatePlayerInFirestore() {
    if (!currentPlayer.id) return;
    
    db.collection('players').doc(currentPlayer.id).update({
        name: currentPlayer.name,
        email: currentPlayer.email,
        score: currentPlayer.score,
        level: currentPlayer.level,
        completedLevels: currentPlayer.completedLevels,
        isActive: currentPlayer.isActive,
        startTime: currentPlayer.startTime,
        endTime: currentPlayer.endTime
    }).catch((error) => {
        console.error('Error al actualizar jugador:', error);
    });
}

// Función para escuchar cambios en el estado del juego
function listenToGameState() {
    db.collection('gameState').doc('current').onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            gameState.isGameStarted = data.isGameStarted;
            gameState.isGameEnded = data.isGameEnded;
            gameState.timeLimit = data.timeLimit;
            gameState.remainingTime = data.remainingTime;
            gameState.currentGlobalLevel = data.currentGlobalLevel || 1;
            
            updateTimerDisplay();
            
            if (gameState.isGameStarted && !gameState.isGameEnded) {
                startGame();
            } else if (gameState.isGameEnded) {
                endGame();
            }
            
            // Si el administrador cambió el nivel global
            if (currentPlayer.level !== gameState.currentGlobalLevel && gameState.isGameStarted) {
                currentPlayer.level = gameState.currentGlobalLevel;
                loadLevel(currentPlayer.level);
                updatePlayerInFirestore();
            }
        }
    });
}

// Función para escuchar cambios en la lista de jugadores
function listenToPlayers() {
    db.collection('players').where('isActive', '==', true).onSnapshot((snapshot) => {
        connectedPlayersList.innerHTML = '';
        snapshot.forEach((doc) => {
            const player = doc.data();
            const li = document.createElement('li');
            li.textContent = `${player.name} - Nivel ${player.level} - Puntaje: ${player.score}`;
            connectedPlayersList.appendChild(li);
        });
    });
}

// Función para iniciar el juego
function startGame() {
    if (currentPlayer.startTime === null) {
        currentPlayer.startTime = new Date().toISOString();
        updatePlayerInFirestore();
    }
    
    waitingContainer.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    
    currentPlayerSpan.textContent = currentPlayer.name;
    currentScoreSpan.textContent = `Puntaje: ${currentPlayer.score}`;
    currentLevelSpan.textContent = `Nivel: ${currentPlayer.level}`;
    
    // Iniciar temporizador
    if (!gameState.timerInterval) {
        startTimer();
    }
    
    // Cargar el nivel actual
    loadLevel(currentPlayer.level);
}

// Función para cargar un nivel específico
function loadLevel(levelNumber) {
    const level = levels.find(l => l.id === levelNumber);
    if (!level) return;
    
    currentLevelSpan.textContent = `Nivel: ${level.id}`;
    levelDescription.innerHTML = `<h3>${level.title}</h3><p>${level.description}</p>`;
    
    // Actualizar barra de progreso
    progressBar.style.width = `${((level.id - 1) / levels.length) * 100}%`;
    
    // Limpiar contenedores
    inputsContainer.innerHTML = '<h4>Entradas</h4>';
    gatesContainer.innerHTML = '<h4>Compuertas</h4>';
    outputContainer.innerHTML = '<h4>Salida</h4>';
    
    // Crear nodos de entrada
    level.inputs.forEach(input => {
        const inputNode = document.createElement('div');
        inputNode.className = 'input-node';
        inputNode.textContent = input.id;
        inputNode.dataset.id = input.id;
        inputNode.dataset.value = input.value;
        inputNode.dataset.type = 'input';
        inputNode.addEventListener('click', handleNodeClick);
        
        // Mostrar el valor actual
        const valueSpan = document.createElement('span');
        valueSpan.className = 'input-value';
        valueSpan.textContent = input.value ? '1' : '0';
        inputNode.appendChild(valueSpan);
        
        inputsContainer.appendChild(inputNode);
    });
    
    // Crear compuertas disponibles
    level.gates.forEach(gate => {
        const gateNode = document.createElement('div');
        gateNode.className = 'gate';
        gateNode.textContent = gate;
        gateNode.dataset.id = gate;
        gateNode.dataset.type = 'gate';
        gateNode.addEventListener('click', handleNodeClick);
        gatesContainer.appendChild(gateNode);
    });
    
    // Crear nodo de salida
    const outputNode = document.createElement('div');
    outputNode.className = 'output-node';
    outputNode.textContent = 'OUTPUT';
    outputNode.dataset.id = 'OUTPUT';
    outputNode.dataset.type = 'output';
    outputNode.dataset.value = level.expectedOutput;
    outputNode.addEventListener('click', handleNodeClick);
    
    // Mostrar el valor esperado
    const expectedSpan = document.createElement('span');
    expectedSpan.className = 'expected-value';
    expectedSpan.textContent = `Esperado: ${level.expectedOutput ? '1' : '0'}`;
    outputNode.appendChild(expectedSpan);
    
    outputContainer.appendChild(outputNode);
    
    // Resetear conexiones
    currentConnections = [];
    nextLevelBtn.classList.add('hidden');
    checkSolutionBtn.classList.remove('hidden');
}

// Manejador de clic en nodos
let selectedNode = null;

function handleNodeClick(event) {
    const node = event.currentTarget;
    
    if (!selectedNode) {
        // Seleccionar el primer nodo
        selectedNode = node;
        node.classList.add('selected');
    } else {
        // Seleccionar el segundo nodo y crear conexión
        if (selectedNode !== node) {
            const connection = createConnection(selectedNode, node);
            if (connection) {
                currentConnections.push(connection);
                selectedNode.classList.add('connected');
                node.classList.add('connected');
            }
        }
        
        // Resetear selección
        selectedNode.classList.remove('selected');
        selectedNode = null;
    }
}

// Función para crear una conexión entre nodos
function createConnection(node1, node2) {
    const type1 = node1.dataset.type;
    const type2 = node2.dataset.type;
    const id1 = node1.dataset.id;
    const id2 = node2.dataset.id;
    
    // Validar tipos de conexión permitidos
    if ((type1 === 'input' && type2 === 'gate') || 
        (type1 === 'gate' && type2 === 'input')) {
        return `${id1}-${id2}`;
    } else if ((type1 === 'gate' && type2 === 'gate') || 
               (type1 === 'gate' && type2 === 'output')) {
        return `${id1}-${id2}`;
    } else {
        alert('Conexión no válida');
        return null;
    }
}

// Función para verificar la solución
function checkSolution() {
    const currentLevel = levels.find(l => l.id === currentPlayer.level);
    if (!currentLevel) return;
    
    // Verificar si todas las conexiones necesarias están presentes
    const allConnectionsPresent = currentLevel.solution.every(conn => 
        currentConnections.includes(conn)
    );
    
    // Verificar si hay conexiones adicionales no requeridas
    const noExtraConnections = currentConnections.every(conn => 
        currentLevel.solution.includes(conn)
    );
    
    if (allConnectionsPresent && noExtraConnections) {
        // Solución correcta
        showMotivationalMessage(true);
        currentPlayer.score += 100;
        currentScoreSpan.textContent = `Puntaje: ${currentPlayer.score}`;
        
        if (!currentPlayer.completedLevels.includes(currentPlayer.level)) {
            currentPlayer.completedLevels.push(currentPlayer.level);
        }
        
        updatePlayerInFirestore();
        
        checkSolutionBtn.classList.add('hidden');
        nextLevelBtn.classList.remove('hidden');
    } else {
        // Solución incorrecta
        showMotivationalMessage(false);
    }
}

// Función para mostrar mensaje motivacional
function showMotivationalMessage(isSuccess) {
    const messages = isSuccess ? [
        "¡Excelente trabajo!",
        "¡Lo lograste!",
        "¡Eres un genio de la lógica!",
        "¡Perfecto! Sigue así.",
        "¡Resolución impecable!"
    ] : [
        "Casi lo logras, intenta nuevamente.",
        "No te rindas, revisa tus conexiones.",
        "La práctica hace al maestro, sigue intentando.",
        "Analiza bien el problema y vuelve a intentarlo.",
        "¡Tú puedes! Revisa la solución cuidadosamente."
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    motivationalMessage.textContent = randomMessage;
    motivationalMessage.style.color = isSuccess ? 'var(--success-color)' : 'var(--error-color)';
    motivationalMessage.classList.remove('hidden');
    
    setTimeout(() => {
        motivationalMessage.classList.add('hidden');
    }, 3000);
}

// Función para cargar el siguiente nivel
function loadNextLevel() {
    if (currentPlayer.level < levels.length) {
        currentPlayer.level++;
        updatePlayerInFirestore();
        loadLevel(currentPlayer.level);
    } else {
        // Juego completado
        endGame();
    }
}

// Función para iniciar el temporizador
function startTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    
    gameState.timerInterval = setInterval(() => {
        gameState.remainingTime--;
        updateTimerDisplay();
        
        if (gameState.remainingTime <= 0) {
            clearInterval(gameState.timerInterval);
            endGame();
        }
    }, 1000);
}

// Función para actualizar la visualización del temporizador
function updateTimerDisplay() {
    const minutes = Math.floor(gameState.remainingTime / 60);
    const seconds = gameState.remainingTime % 60;
    timerSpan.textContent = `Tiempo: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Función para finalizar el juego
function endGame() {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
    
    currentPlayer.endTime = new Date().toISOString();
    currentPlayer.isActive = false;
    updatePlayerInFirestore();
    
    gameContainer.classList.add('hidden');
    gameOverContainer.classList.remove('hidden');
    
    // Mostrar estadísticas finales
    finalPlayerName.textContent = currentPlayer.name;
    finalScore.textContent = `Puntaje final: ${currentPlayer.score}`;
    finalLevels.textContent = `Niveles completados: ${currentPlayer.completedLevels.length} de ${levels.length}`;
    
    const startTime = new Date(currentPlayer.startTime);
    const endTime = new Date(currentPlayer.endTime);
    const totalTime = Math.floor((endTime - startTime) / 1000);
    const minutes = Math.floor(totalTime / 60);
    const seconds = totalTime % 60;
    finalTime.textContent = `Tiempo total: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    
    // Enviar correos electrónicos
    sendPlayerEmail();
    if (currentPlayer.score > 0) {
        sendAdminEmail();
    }
}

// Función para enviar correo al jugador
function sendPlayerEmail() {
    const templateParams = {
        player_name: currentPlayer.name,
        player_email: currentPlayer.email,
        final_score: currentPlayer.score,
        levels_completed: currentPlayer.completedLevels.length,
        total_levels: levels.length,
        date: new Date().toLocaleDateString()
    };
    
    emailjs.send('service_pfe64ro', 'template_auvm8uq', templateParams)
        .then(() => {
            console.log('Correo enviado al jugador');
        }, (error) => {
            console.error('Error al enviar correo al jugador:', error);
        });
}

// Función para enviar correo al administrador
function sendAdminEmail() {
    // Obtener todos los jugadores para el resumen
    db.collection('players').get().then((snapshot) => {
        const players = [];
        snapshot.forEach((doc) => {
            players.push(doc.data());
        });
        
        const templateParams = {
            total_players: players.length,
            top_score: Math.max(...players.map(p => p.score)),
            average_score: (players.reduce((sum, p) => sum + p.score, 0) / players.length).toFixed(2),
            date: new Date().toLocaleDateString(),
            players_list: players.map(p => 
                `${p.name} - ${p.email} - Puntaje: ${p.score} - Niveles: ${p.completedLevels.length}`
            ).join('\n')
        };
        
        emailjs.send('service_pfe64ro', 'template_faw4g8p', templateParams)
            .then(() => {
                console.log('Correo enviado al administrador');
            }, (error) => {
                console.error('Error al enviar correo al administrador:', error);
            });
    });
}

// Verificar si el juego ya está en curso al cargar la página
db.collection('gameState').doc('current').get().then((doc) => {
    if (doc.exists && doc.data().isGameStarted && !doc.data().isGameEnded) {
        // El juego ya está en curso, verificar si el jugador estaba registrado
        const playerId = localStorage.getItem('playerId');
        if (playerId) {
            db.collection('players').doc(playerId).get().then((playerDoc) => {
                if (playerDoc.exists && playerDoc.data().isActive) {
                    currentPlayer = { id: playerId, ...playerDoc.data() };
                    startGame();
                } else {
                    localStorage.removeItem('playerId');
                }
            });
        }
    }
});