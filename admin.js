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

// Referencias a elementos del DOM
const startGameBtn = document.getElementById('start-game');
const endGameBtn = document.getElementById('end-game');
const resetGameBtn = document.getElementById('reset-game');
const gameTimeInput = document.getElementById('game-time');
const updateTimeBtn = document.getElementById('update-time');
const gameStateSpan = document.getElementById('game-state');
const remainingTimeSpan = document.getElementById('remaining-time');
const playersTableBody = document.getElementById('players-table-body');
const searchPlayerInput = document.getElementById('search-player');
const nextLevelAllBtn = document.getElementById('next-level-all');
const prevLevelAllBtn = document.getElementById('prev-level-all');
const currentGlobalLevelSpan = document.getElementById('current-global-level');
const totalPlayersSpan = document.getElementById('total-players');
const averageScoreSpan = document.getElementById('average-score');
const averageLevelSpan = document.getElementById('average-level');

// Variables
let players = [];
let gameState = {
    isGameStarted: false,
    isGameEnded: false,
    timeLimit: 10 * 60, // 10 minutos en segundos
    remainingTime: 10 * 60,
    currentGlobalLevel: 1
};

// Event Listeners
startGameBtn.addEventListener('click', startGame);
endGameBtn.addEventListener('click', endGame);
resetGameBtn.addEventListener('click', resetGame);
updateTimeBtn.addEventListener('click', updateGameTime);
nextLevelAllBtn.addEventListener('click', () => changeGlobalLevel(1));
prevLevelAllBtn.addEventListener('click', () => changeGlobalLevel(-1));
searchPlayerInput.addEventListener('input', filterPlayers);

// Cargar estado inicial del juego
loadGameState();
loadPlayers();

// Función para cargar el estado del juego desde Firestore
function loadGameState() {
    db.collection('gameState').doc('current').onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            gameState = data;
            
            updateGameStateDisplay();
            
            // Habilitar/deshabilitar botones según el estado
            startGameBtn.disabled = gameState.isGameStarted && !gameState.isGameEnded;
            endGameBtn.disabled = !gameState.isGameStarted || gameState.isGameEnded;
        } else {
            // Crear documento de estado inicial si no existe
            db.collection('gameState').doc('current').set(gameState);
        }
    });
}

// Función para actualizar la visualización del estado del juego
function updateGameStateDisplay() {
    gameStateSpan.textContent = gameState.isGameEnded ? 'Terminado' : 
                              (gameState.isGameStarted ? 'En curso' : 'No iniciado');
    
    gameStateSpan.style.color = gameState.isGameEnded ? 'var(--error-color)' : 
                               (gameState.isGameStarted ? 'var(--success-color)' : 'var(--warning-color)');
    
    const minutes = Math.floor(gameState.remainingTime / 60);
    const seconds = gameState.remainingTime % 60;
    remainingTimeSpan.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    
    currentGlobalLevelSpan.textContent = gameState.currentGlobalLevel || 1;
}

// Función para cargar la lista de jugadores
function loadPlayers() {
    db.collection('players').onSnapshot((snapshot) => {
        players = [];
        playersTableBody.innerHTML = '';
        
        snapshot.forEach((doc) => {
            const player = { id: doc.id, ...doc.data() };
            players.push(player);
            addPlayerToTable(player);
        });
        
        updateStats();
    });
}

// Función para añadir un jugador a la tabla
function addPlayerToTable(player) {
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td>${player.name}</td>
        <td>${player.email}</td>
        <td>${player.score || 0}</td>
        <td>${player.level || 1}</td>
        <td>${player.isActive ? 'Activo' : 'Inactivo'}</td>
        <td>
            <button class="btn-kick" data-id="${player.id}">Expulsar</button>
            <button class="btn-reset" data-id="${player.id}">Reiniciar</button>
        </td>
    `;
    
    playersTableBody.appendChild(row);
    
    // Añadir event listeners a los botones
    row.querySelector('.btn-kick').addEventListener('click', (e) => kickPlayer(e.target.dataset.id));
    row.querySelector('.btn-reset').addEventListener('click', (e) => resetPlayer(e.target.dataset.id));
}

// Función para filtrar jugadores
function filterPlayers() {
    const searchTerm = searchPlayerInput.value.toLowerCase();
    const rows = playersTableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const name = row.cells[0].textContent.toLowerCase();
        const email = row.cells[1].textContent.toLowerCase();
        
        if (name.includes(searchTerm) || email.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Función para expulsar a un jugador
function kickPlayer(playerId) {
    db.collection('players').doc(playerId).update({
        isActive: false
    }).catch(error => {
        console.error('Error al expulsar jugador:', error);
    });
}

// Función para reiniciar el progreso de un jugador
function resetPlayer(playerId) {
    db.collection('players').doc(playerId).update({
        score: 0,
        level: 1,
        completedLevels: [],
        startTime: null,
        endTime: null
    }).catch(error => {
        console.error('Error al reiniciar jugador:', error);
    });
}

// Función para iniciar el juego
function startGame() {
    const gameTime = parseInt(gameTimeInput.value) || 10;
    
    db.collection('gameState').doc('current').update({
        isGameStarted: true,
        isGameEnded: false,
        timeLimit: gameTime * 60,
        remainingTime: gameTime * 60,
        currentGlobalLevel: 1
    }).then(() => {
        console.log('Juego iniciado');
    }).catch(error => {
        console.error('Error al iniciar juego:', error);
    });
}

// Función para finalizar el juego
function endGame() {
    db.collection('gameState').doc('current').update({
        isGameEnded: true,
        remainingTime: 0
    }).then(() => {
        console.log('Juego terminado');
        
        // Marcar todos los jugadores como inactivos
        db.collection('players').get().then(snapshot => {
            const batch = db.batch();
            
            snapshot.forEach(doc => {
                batch.update(doc.ref, { isActive: false });
            });
            
            return batch.commit();
        });
    }).catch(error => {
        console.error('Error al terminar juego:', error);
    });
}

// Función para reiniciar el juego completamente
function resetGame() {
    if (confirm('¿Estás seguro de que quieres reiniciar completamente el juego? Esto borrará todos los datos de los jugadores.')) {
        // Eliminar todos los jugadores
        db.collection('players').get().then(snapshot => {
            const batch = db.batch();
            
            snapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            return batch.commit();
        }).then(() => {
            // Reiniciar estado del juego
            return db.collection('gameState').doc('current').update({
                isGameStarted: false,
                isGameEnded: false,
                timeLimit: 10 * 60,
                remainingTime: 10 * 60,
                currentGlobalLevel: 1
            });
        }).then(() => {
            console.log('Juego reiniciado completamente');
        }).catch(error => {
            console.error('Error al reiniciar juego:', error);
        });
    }
}

// Función para actualizar el tiempo del juego
function updateGameTime() {
    const gameTime = parseInt(gameTimeInput.value) || 10;
    
    db.collection('gameState').doc('current').update({
        timeLimit: gameTime * 60,
        remainingTime: gameTime * 60
    }).then(() => {
        console.log('Tiempo del juego actualizado');
    }).catch(error => {
        console.error('Error al actualizar tiempo:', error);
    });
}

// Función para cambiar el nivel global
function changeGlobalLevel(change) {
    const newLevel = gameState.currentGlobalLevel + change;
    
    if (newLevel >= 1 && newLevel <= 5) { // Asumiendo 5 niveles
        db.collection('gameState').doc('current').update({
            currentGlobalLevel: newLevel
        }).then(() => {
            console.log('Nivel global actualizado');
        }).catch(error => {
            console.error('Error al actualizar nivel global:', error);
        });
    }
}

// Función para actualizar las estadísticas
function updateStats() {
    if (players.length === 0) {
        totalPlayersSpan.textContent = '0';
        averageScoreSpan.textContent = '0';
        averageLevelSpan.textContent = '0';
        return;
    }
    
    totalPlayersSpan.textContent = players.length;
    
    const totalScore = players.reduce((sum, player) => sum + (player.score || 0), 0);
    averageScoreSpan.textContent = (totalScore / players.length).toFixed(1);
    
    const totalLevel = players.reduce((sum, player) => sum + (player.level || 1), 0);
    averageLevelSpan.textContent = (totalLevel / players.length).toFixed(1);
}