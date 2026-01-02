// script.js
// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDhAzS8FZVymT0eB3mqp26erZoOgg0gFpw",
  authDomain: "rachacuca-67927.firebaseapp.com",
  projectId: "rachacuca-67927",
  storageBucket: "rachacuca-67927.firebasestorage.app",
  messagingSenderId: "848339768742",
  appId: "1:848339768742:web:79ea2cf3d314ceac296b67"
};

// Inicializar Firebase
let app, auth, db;
let currentUser = null;
let adminUserExists = false;
let isGuest = false;
let isAdmin = false;
let rememberMe = false;

// Elementos do DOM
let welcomeScreen, mainApp;
let puzzleBoard, moveCounter, timerElement, shuffleBtn, solveBtn, resetBtn, hintBtn;
let playAgainBtn, completionMessage, finalMoves, finalTime;
let difficultyBtns, authModal, loginBtn, registerBtn, logoutBtn, userInfo, userName;
let adminNavItem, homeSection, gameSection, rankingSection, progressSection, themesSection, adminSection;
let rankingList, userScoresList, usersList, adminScoresList;
let loginForm, registerForm, resetForm, adminRegisterForm, editUserForm;
let authButtons, userInfoContainer, dbStatus;
let playGuestBtn, welcomeLoginBtn, welcomeRegisterBtn, quickPlayBtn;
let heroPlayBtn, heroHowtoBtn, changeThemeBtn, themeCards;
let instructionsModal, startPlayingBtn;
let themeCreateModal, themeCreateForm, themeViewModal;
let progressTabs, userStatsContainer, adminStatsContainer;
let difficultyChart, movesChart, playersChart, activityChart;

// Variáveis do jogo
let board = [];
let emptyTileIndex = 15;
let moves = 0;
let timer = 0;
let timerInterval = null;
let gameStarted = false;
let gameCompleted = false;
let currentDifficulty = 'normal';
let gameActive = false;
let currentTheme = 'numbers';
let customImageData = null;
let currentCustomTheme = null;

// Temas disponíveis
let themes = {
    numbers: {
        name: "Números",
        items: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', null],
        className: 'number',
        type: 'built-in',
        solutionText: "1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15"
    },
    words: {
        name: "Palavras",
        items: ['M', 'A', 'T', 'O', 'A', 'T', 'A', 'R', 'C', 'U', 'C', 'A', 'A', 'M', 'O', null],
        className: 'word',
        type: 'built-in',
        solutionText: "M A T O\nA T A R\nC U C A\nA M O\n"
    },
    animals: {
        name: "Animais",
        items: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', null],
        className: 'emoji',
        type: 'built-in',
        solutionText: "🐶 🐱 🐭 🐹\n🐰 🦊 🐻 🐼\n🐨 🦁 🐮 🐷\n🐸 🐵 🐔"
    },
    fruits: {
        name: "Frutas",
        items: ['🍎', '🍌', '🍇', '🍓', '🍉', '🍊', '🍑', '🍍', '🥭', '🍒', '🥝', '🍏', '🥥', '🍈', '🫐', null],
        className: 'emoji',
        type: 'built-in',
        solutionText: "🍎 🍌 🍇 🍓\n🍉 🍊 🍑 🍍\n🥭 🍒 🥝 🍏\n🥥 🍈 🫐"
    },
    flags: {
        name: "Bandeiras",
        items: ['🇧🇷', '🇺🇸', '🇨🇳', '🇯🇵', '🇩🇪', '🇫🇷', '🇮🇹', '🇪🇸', '🇬🇧', '🇨🇦', '🇦🇺', '🇰🇷', '🇦🇷', '🇲🇽', '🇵🇹', null],
        className: 'emoji',
        type: 'built-in',
        solutionText: "🇧🇷 🇺🇸 🇨🇳 🇯🇵\n🇩🇪 🇫🇷 🇮🇹 🇪🇸\n🇬🇧 🇨🇦 🇦🇺 🇰🇷\n🇦🇷 🇲🇽 🇵🇹"
    },
    emoji: {
        name: "Emojis",
        items: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '😍', '😘', '😋', '😜', '🤪', null],
        className: 'emoji',
        type: 'built-in',
        solutionText: "😀 😃 😄 😁\n😆 😅 😂 🤣\n😊 😇 😍 😘\n😋 😜 🤪"
    }
};

// Variáveis para drag and drop
let draggedTile = null;
let dragStartX = 0;
let dragStartY = 0;
let isDragging = false;

// Charts
let charts = {};

// Inicialização do aplicativo
document.addEventListener('DOMContentLoaded', function() {
    initializeFirebase();
    initializeDOMElements();
    initializeGame();
    setupEventListeners();
    checkRememberedUser();
    initializePreviewBoard();
    loadGlobalStats();
    loadThemes();
});

// Inicializar Firebase
function initializeFirebase() {
    try {
        app = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        
        console.log("Firebase inicializado com sucesso!");
        updateDBStatus("Conectado", "connected");
        
        // Verificar se já existe um administrador no sistema
        checkAdminExists();
    } catch (error) {
        console.error("Erro ao inicializar Firebase:", error);
        updateDBStatus("Erro de conexão", "error");
    }
}

// Atualizar status do Firebase no footer
function updateDBStatus(status, className) {
    const dbStatusElement = document.getElementById('db-status');
    if (dbStatusElement) {
        dbStatusElement.textContent = status;
        dbStatusElement.className = className;
    }
}

// Verificar se já existe um administrador no sistema
async function checkAdminExists() {
    try {
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('role', '==', 'admin').limit(1).get();
        
        adminUserExists = !snapshot.empty;
        console.log("Admin existe:", adminUserExists);
    } catch (error) {
        console.error("Erro ao verificar administrador:", error);
    }
}

// Inicializar elementos do DOM
function initializeDOMElements() {
    // Elementos da tela de boas-vindas
    welcomeScreen = document.getElementById('welcome-screen');
    mainApp = document.getElementById('main-app');
    playGuestBtn = document.getElementById('play-guest-btn');
    welcomeLoginBtn = document.getElementById('welcome-login-btn');
    welcomeRegisterBtn = document.getElementById('welcome-register-btn');
    quickPlayBtn = document.getElementById('quick-play-btn');
    
    // Elementos do jogo
    puzzleBoard = document.getElementById('puzzle-board');
    moveCounter = document.getElementById('move-counter');
    timerElement = document.getElementById('timer');
    shuffleBtn = document.getElementById('shuffle-btn');
    solveBtn = document.getElementById('solve-btn');
    resetBtn = document.getElementById('reset-btn');
    hintBtn = document.getElementById('hint-btn');
    playAgainBtn = document.getElementById('play-again-btn');
    changeThemeBtn = document.getElementById('change-theme-btn');
    completionMessage = document.getElementById('completion-message');
    finalMoves = document.getElementById('final-moves');
    finalTime = document.getElementById('final-time');
    difficultyBtns = document.querySelectorAll('.difficulty-btn');
    
    // Seções da página
    homeSection = document.getElementById('home-section');
    gameSection = document.getElementById('game-section');
    rankingSection = document.getElementById('ranking-section');
    progressSection = document.getElementById('progress-section');
    themesSection = document.getElementById('themes-section');
    adminSection = document.getElementById('admin-section');
    
    // Navegação
    adminNavItem = document.getElementById('admin-nav-item');
    
    // Autenticação
    authModal = document.getElementById('auth-modal');
    loginBtn = document.getElementById('login-btn');
    registerBtn = document.getElementById('register-btn');
    logoutBtn = document.getElementById('logout-btn');
    userInfo = document.getElementById('user-info');
    userName = document.getElementById('user-name');
    authButtons = document.getElementById('auth-buttons');
    userInfoContainer = document.getElementById('user-info');
    
    // Formulários de autenticação
    loginForm = document.getElementById('login-form');
    registerForm = document.getElementById('register-form');
    resetForm = document.getElementById('reset-form');
    adminRegisterForm = document.getElementById('admin-register-form');
    
    // Elementos do ranking
    rankingList = document.getElementById('ranking-list');
    
    // Elementos de administração
    usersList = document.getElementById('users-list');
    adminScoresList = document.getElementById('admin-scores-list');
    
    // Status do banco de dados
    dbStatus = document.getElementById('db-status');
    
    // Botões da página inicial
    heroPlayBtn = document.getElementById('hero-play-btn');
    heroHowtoBtn = document.getElementById('hero-howto-btn');
    
    // Modal de instruções
    instructionsModal = document.getElementById('instructions-modal');
    startPlayingBtn = document.getElementById('start-playing-btn');
    
    // Modais de tema
    themeCreateModal = document.getElementById('theme-create-modal');
    themeCreateForm = document.getElementById('theme-create-form');
    themeViewModal = document.getElementById('theme-view-modal');
    
    // Seção de progresso
    progressTabs = document.querySelectorAll('.progress-tab');
    userStatsContainer = document.getElementById('user-stats');
    adminStatsContainer = document.getElementById('admin-stats');
}

// Inicializar o jogo
function initializeGame() {
    createBoard();
    renderBoard();
    createSolutionBoard();
    updateMoveCounter();
    resetTimer();
}

// Criar o tabuleiro
function createBoard() {
    if (currentTheme === 'custom-image' && customImageData) {
        board = [...customImageData];
    } else if (themes[currentTheme] && themes[currentTheme].type === 'custom') {
        // Carregar tema personalizado
        board = [...themes[currentTheme].items];
    } else {
        board = [...themes[currentTheme].items];
    }
}

// Renderizar o tabuleiro com suporte a drag and drop
function renderBoard() {
    puzzleBoard.innerHTML = '';
    
    board.forEach((value, index) => {
        const tile = document.createElement('div');
        tile.className = `puzzle-tile ${themes[currentTheme]?.className || 'image-piece'}`;
        
        if (value === null) {
            tile.classList.add('empty');
            tile.textContent = '';
            emptyTileIndex = index;
        } else {
            // Verificar se é uma URL de imagem
            if (typeof value === 'string' && value.startsWith('data:image')) {
                tile.style.backgroundImage = `url(${value})`;
                tile.textContent = '';
            } else {
                tile.textContent = value;
            }
            
            tile.dataset.index = index;
            tile.dataset.value = value;
            
            // Verificar se a peça está na posição correta
            let correctValue;
            if (currentTheme === 'custom-image' && customImageData) {
                correctValue = customImageData[index];
            } else if (themes[currentTheme] && themes[currentTheme].type === 'custom') {
                correctValue = themes[currentTheme].items[index];
            } else {
                correctValue = themes[currentTheme].items[index];
            }
            
            if (value === correctValue) {
                tile.classList.add('correct-position');
            }
            
            // Adicionar eventos de drag and drop
            tile.addEventListener('mousedown', startDrag);
            tile.addEventListener('touchstart', startDragTouch);
            
            // Adicionar evento de clique como fallback
            tile.addEventListener('click', () => {
                if (!isDragging) {
                    moveTile(index);
                }
            });
        }
        
        puzzleBoard.appendChild(tile);
    });
    
    // Adicionar eventos de mouse/touch move e end ao documento
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', dragTouch, { passive: false });
    document.addEventListener('touchend', endDragTouch);
}

// Iniciar arrastar (mouse)
function startDrag(e) {
    if (gameCompleted) return;
    
    const tile = e.target;
    const index = parseInt(tile.dataset.index);
    
    if (isMovable(index)) {
        draggedTile = tile;
        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        
        tile.classList.add('dragging');
        tile.style.zIndex = '100';
        
        // Prevenir seleção de texto durante o arraste
        e.preventDefault();
    }
}

// Iniciar arrastar (touch)
function startDragTouch(e) {
    if (gameCompleted) return;
    
    const tile = e.target;
    const index = parseInt(tile.dataset.index);
    
    if (isMovable(index) && e.touches.length === 1) {
        draggedTile = tile;
        isDragging = true;
        dragStartX = e.touches[0].clientX;
        dragStartY = e.touches[0].clientY;
        
        tile.classList.add('dragging');
        tile.style.zIndex = '100';
        
        // Prevenir scroll durante o arraste
        e.preventDefault();
    }
}

// Arrastar (mouse)
function drag(e) {
    if (!draggedTile || !isDragging) return;
    
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Aplicar transformação visual
    draggedTile.style.transform = `translate(${dx}px, ${dy}px)`;
    
    // Se arrastou suficientemente longe, mover a peça
    if (distance > 40) {
        const index = parseInt(draggedTile.dataset.index);
        moveTile(index);
        endDrag();
    }
}

// Arrastar (touch)
function dragTouch(e) {
    if (!draggedTile || !isDragging || e.touches.length !== 1) return;
    
    const dx = e.touches[0].clientX - dragStartX;
    const dy = e.touches[0].clientY - dragStartY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Aplicar transformação visual
    draggedTile.style.transform = `translate(${dx}px, ${dy}px)`;
    
    // Se arrastou suficientemente longe, mover a peça
    if (distance > 40) {
        const index = parseInt(draggedTile.dataset.index);
        moveTile(index);
        endDragTouch();
    }
    
    // Prevenir scroll
    e.preventDefault();
}

// Finalizar arrastar (mouse)
function endDrag() {
    if (draggedTile) {
        draggedTile.classList.remove('dragging');
        draggedTile.style.transform = '';
        draggedTile.style.zIndex = '';
        draggedTile = null;
    }
    isDragging = false;
}

// Finalizar arrastar (touch)
function endDragTouch() {
    if (draggedTile) {
        draggedTile.classList.remove('dragging');
        draggedTile.style.transform = '';
        draggedTile.style.zIndex = '';
        draggedTile = null;
    }
    isDragging = false;
}

// Verificar se uma peça pode ser movida
function isMovable(index) {
    const row = Math.floor(index / 4);
    const col = index % 4;
    const emptyRow = Math.floor(emptyTileIndex / 4);
    const emptyCol = emptyTileIndex % 4;
    
    // Verificar se está na mesma linha ou coluna adjacente ao espaço vazio
    return (row === emptyRow && Math.abs(col - emptyCol) === 1) || 
           (col === emptyCol && Math.abs(row - emptyRow) === 1);
}

// Mover uma peça
function moveTile(index) {
    if (gameCompleted || !isMovable(index)) return;
    
    // Trocar a peça com o espaço vazio
    [board[index], board[emptyTileIndex]] = [board[emptyTileIndex], board[index]];
    
    // Atualizar o índice do espaço vazio
    emptyTileIndex = index;
    
    // Incrementar contador de movimentos
    moves++;
    updateMoveCounter();
    
    // Iniciar o timer se for o primeiro movimento
    if (!gameStarted) {
        startTimer();
        gameStarted = true;
        gameActive = true;
    }
    
    // Renderizar o tabuleiro atualizado
    renderBoard();
    
    // Verificar se o jogo foi concluído
    if (checkWin()) {
        completeGame();
    }
}

// Embaralhar o tabuleiro
function shuffleBoard() {
    if (gameCompleted) {
        resetGame();
        return;
    }
    
    // Parar o timer se estiver rodando
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // Reiniciar variáveis
    moves = 0;
    gameStarted = false;
    gameCompleted = false;
    gameActive = false;
    updateMoveCounter();
    resetTimer();
    completionMessage.style.display = 'none';
    
    // Embaralhar o tabuleiro
    let shuffleCount;
    switch(currentDifficulty) {
        case 'easy':
            shuffleCount = 20;
            break;
        case 'hard':
            shuffleCount = 100;
            break;
        default: // normal
            shuffleCount = 50;
            break;
    }
    
    // Fazer movimentos válidos aleatórios para embaralhar
    for (let i = 0; i < shuffleCount; i++) {
        const movableTiles = [];
        
        // Encontrar todas as peças que podem ser movidas
        board.forEach((_, index) => {
            if (isMovable(index)) {
                movableTiles.push(index);
            }
        });
        
        // Escolher uma peça aleatória para mover
        if (movableTiles.length > 0) {
            const randomIndex = Math.floor(Math.random() * movableTiles.length);
            const tileToMove = movableTiles[randomIndex];
            
            // Mover a peça
            [board[tileToMove], board[emptyTileIndex]] = [board[emptyTileIndex], board[tileToMove]];
            emptyTileIndex = tileToMove;
        }
    }
    
    // Renderizar o tabuleiro embaralhado
    renderBoard();
}

// Mostrar a solução
function showSolution() {
    // Criar tabuleiro ordenado
    if (currentTheme === 'custom-image' && customImageData) {
        board = [...customImageData];
    } else if (themes[currentTheme] && themes[currentTheme].type === 'custom') {
        board = [...themes[currentTheme].items];
    } else {
        board = [...themes[currentTheme].items];
    }
    emptyTileIndex = 15;
    renderBoard();
    
    // Parar o timer
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // Marcar jogo como concluído
    gameCompleted = true;
    gameStarted = false;
    gameActive = false;
}

// Reiniciar o jogo
function resetGame() {
    moves = 0;
    gameStarted = false;
    gameCompleted = false;
    gameActive = false;
    updateMoveCounter();
    resetTimer();
    completionMessage.style.display = 'none';
    
    // Criar tabuleiro ordenado
    createBoard();
    renderBoard();
}

// Mostrar dica
function showHint() {
    // Encontrar a primeira peça fora do lugar que pode ser movida
    for (let i = 0; i < board.length; i++) {
        let correctValue;
        if (currentTheme === 'custom-image' && customImageData) {
            correctValue = customImageData[i];
        } else if (themes[currentTheme] && themes[currentTheme].type === 'custom') {
            correctValue = themes[currentTheme].items[i];
        } else {
            correctValue = themes[currentTheme].items[i];
        }
        
        if (board[i] !== null && board[i] !== correctValue && isMovable(i)) {
            const tile = document.querySelector(`.puzzle-tile[data-index="${i}"]`);
            tile.style.boxShadow = '0 0 15px 5px gold';
            tile.style.transform = 'scale(1.05)';
            tile.style.zIndex = '10';
            
            // Remover o efeito após 2 segundos
            setTimeout(() => {
                tile.style.boxShadow = '';
                tile.style.transform = '';
                tile.style.zIndex = '';
            }, 2000);
            
            break;
        }
    }
}

// Verificar vitória
function checkWin() {
    for (let i = 0; i < 15; i++) {
        let correctValue;
        if (currentTheme === 'custom-image' && customImageData) {
            correctValue = customImageData[i];
        } else if (themes[currentTheme] && themes[currentTheme].type === 'custom') {
            correctValue = themes[currentTheme].items[i];
        } else {
            correctValue = themes[currentTheme].items[i];
        }
        
        if (board[i] !== correctValue) {
            return false;
        }
    }
    return board[15] === null;
}

// Concluir o jogo
function completeGame() {
    gameCompleted = true;
    gameActive = false;
    
    // Parar o timer
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // Mostrar mensagem de conclusão
    finalMoves.textContent = moves;
    finalTime.textContent = formatTime(timer);
    completionMessage.style.display = 'block';
    
    // Salvar pontuação automaticamente se o usuário estiver logado
    if (currentUser && !isGuest) {
        saveScoreAutomatically();
    }
    
    // Rolar para a mensagem
    completionMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Salvar pontuação automaticamente
async function saveScoreAutomatically() {
    try {
        // Criar objeto de pontuação
        const scoreData = {
            userId: currentUser.uid,
            userName: currentUser.displayName || currentUser.email.split('@')[0],
            userEmail: currentUser.email,
            moves: moves,
            time: timer,
            difficulty: currentDifficulty,
            theme: currentTheme,
            themeName: themes[currentTheme]?.name || 'Imagem Personalizada',
            date: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Salvar no Firestore
        await db.collection('scores').add(scoreData);
        
        console.log("Pontuação salva automaticamente");
        
        // Atualizar estatísticas globais
        loadGlobalStats();
        loadUserStats();
        
    } catch (error) {
        console.error("Erro ao salvar pontuação automaticamente:", error);
    }
}

// Atualizar contador de movimentos
function updateMoveCounter() {
    moveCounter.textContent = moves;
}

// Iniciar timer
function startTimer() {
    resetTimer();
    timerInterval = setInterval(() => {
        timer++;
        timerElement.textContent = formatTime(timer);
    }, 1000);
}

// Resetar timer
function resetTimer() {
    timer = 0;
    timerElement.textContent = '00:00';
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// Formatar tempo (MM:SS)
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Criar tabuleiro de solução
function createSolutionBoard() {
    const solutionBoard = document.getElementById('solution-board');
    if (!solutionBoard) return;
    
    solutionBoard.innerHTML = '';
    
    // Se for tema personalizado com imagem
    if ((themes[currentTheme] && themes[currentTheme].type === 'custom') || 
        (currentTheme === 'custom-image' && customImageData)) {
        
        let imagePieces;
        if (currentTheme === 'custom-image' && customImageData) {
            imagePieces = customImageData;
        } else if (themes[currentTheme] && themes[currentTheme].type === 'custom') {
            imagePieces = themes[currentTheme].items;
        }
        
        // Criar grid 4x4
        solutionBoard.style.display = 'grid';
        solutionBoard.style.gridTemplateColumns = 'repeat(4, 1fr)';
        solutionBoard.style.gridTemplateRows = 'repeat(4, 1fr)';
        solutionBoard.style.gap = '2px';
        solutionBoard.style.width = '100%';
        solutionBoard.style.aspectRatio = '1 / 1';
        
        // Adicionar todas as peças da imagem
        for (let i = 0; i < 16; i++) {
            const tile = document.createElement('div');
            tile.className = 'solution-tile';
            
            if (i === 15) {
                tile.style.backgroundColor = 'var(--gray-light)';
                tile.textContent = '';
            } else if (imagePieces[i]) {
                tile.style.backgroundImage = `url(${imagePieces[i]})`;
                tile.style.backgroundSize = 'cover';
                tile.style.backgroundPosition = 'center';
                tile.textContent = '';
            }
            
            solutionBoard.appendChild(tile);
        }
    } else {
        // Para temas padrão
        const currentThemeData = themes[currentTheme];
        const solutionText = currentThemeData.solutionText;
        
        // Dividir o texto da solução em linhas
        const lines = solutionText.split('\n');
        
        lines.forEach(line => {
            const lineDiv = document.createElement('div');
            lineDiv.style.gridColumn = '1 / -1';
            lineDiv.style.display = 'flex';
            lineDiv.style.justifyContent = 'center';
            lineDiv.style.alignItems = 'center';
            lineDiv.style.fontSize = currentTheme === 'numbers' ? '1.1rem' : '1.4rem';
            lineDiv.style.fontWeight = '700';
            lineDiv.style.color = 'var(--primary-color)';
            lineDiv.textContent = line;
            solutionBoard.appendChild(lineDiv);
        });
    }
}

// Inicializar preview board na página inicial
function initializePreviewBoard() {
    const previewBoard = document.querySelector('.preview-board');
    if (!previewBoard) return;
    
    previewBoard.innerHTML = '';
    
    // Criar peças do preview
    for (let i = 1; i <= 16; i++) {
        const piece = document.createElement('div');
        piece.className = 'preview-piece';
        
        if (i <= 15) {
            piece.textContent = i;
            piece.style.animationDelay = `${(i-1)*0.1}s`;
        } else {
            piece.style.visibility = 'hidden';
        }
        
        previewBoard.appendChild(piece);
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Event listeners da tela de boas-vindas
    if (playGuestBtn) playGuestBtn.addEventListener('click', playAsGuest);
    if (welcomeLoginBtn) welcomeLoginBtn.addEventListener('click', showLoginModal);
    if (welcomeRegisterBtn) welcomeRegisterBtn.addEventListener('click', showRegisterModal);
    if (quickPlayBtn) quickPlayBtn.addEventListener('click', quickPlay);
    
    // Event listeners do jogo
    if (shuffleBtn) shuffleBtn.addEventListener('click', shuffleBoard);
    if (solveBtn) solveBtn.addEventListener('click', showSolution);
    if (resetBtn) resetBtn.addEventListener('click', resetGame);
    if (hintBtn) hintBtn.addEventListener('click', showHint);
    if (playAgainBtn) playAgainBtn.addEventListener('click', resetGame);
    if (changeThemeBtn) changeThemeBtn.addEventListener('click', () => showSection('themes-section'));
    
    // Dificuldade
    if (difficultyBtns) {
        difficultyBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                difficultyBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentDifficulty = this.dataset.difficulty;
                const difficultyElement = document.getElementById('difficulty');
                if (difficultyElement) {
                    difficultyElement.textContent = 
                        currentDifficulty === 'easy' ? 'Fácil' : 
                        currentDifficulty === 'normal' ? 'Normal' : 'Difícil';
                }
                resetGame();
            });
        });
    }
    
    // Navegação
    const navHome = document.getElementById('nav-home');
    const navGame = document.getElementById('nav-game');
    const navRanking = document.getElementById('nav-ranking');
    const navProgress = document.getElementById('nav-progress');
    const navThemes = document.getElementById('nav-themes');
    const navAdmin = document.getElementById('nav-admin');
    
    if (navHome) navHome.addEventListener('click', () => showSection('home-section'));
    if (navGame) navGame.addEventListener('click', () => {
        showSection('game-section');
        resetGame();
    });
    if (navRanking) navRanking.addEventListener('click', () => {
        showSection('ranking-section');
        loadRanking();
    });
    if (navProgress) navProgress.addEventListener('click', () => {
        showSection('progress-section');
        loadUserStats();
        if (isAdmin) loadAdminStats();
    });
    if (navThemes) navThemes.addEventListener('click', () => {
        showSection('themes-section');
        loadThemes();
    });
    if (navAdmin) navAdmin.addEventListener('click', () => {
        showSection('admin-section');
        loadAdminUsers();
    });
    
    // Autenticação
    if (loginBtn) loginBtn.addEventListener('click', showLoginModal);
    if (registerBtn) registerBtn.addEventListener('click', showRegisterModal);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    
    // Fechar modais
    const closeModalButtons = document.querySelectorAll('.close-modal');
    closeModalButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });
    
    // Fechar modal ao clicar fora
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
    
    // Abas de autenticação
    const authTabs = document.querySelectorAll('.auth-tab');
    if (authTabs) {
        authTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabId = this.id.replace('tab-', '');
                switchAuthTab(tabId);
            });
        });
    }
    
    // Abas de administração
    const adminTabs = document.querySelectorAll('.admin-tab');
    if (adminTabs) {
        adminTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabId = this.dataset.tab;
                switchAdminTab(tabId);
            });
        });
    }
    
    // Abas de progresso
    if (progressTabs) {
        progressTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabId = this.dataset.tab;
                switchProgressTab(tabId);
            });
        });
    }
    
    // Formulários
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    if (resetForm) resetForm.addEventListener('submit', handlePasswordReset);
    if (adminRegisterForm) adminRegisterForm.addEventListener('submit', handleAdminRegister);
    
    // Botões da página inicial
    if (heroPlayBtn) heroPlayBtn.addEventListener('click', () => {
        showSection('game-section');
        resetGame();
    });
    
    if (heroHowtoBtn) heroHowtoBtn.addEventListener('click', showInstructionsModal);
    if (startPlayingBtn) startPlayingBtn.addEventListener('click', () => {
        instructionsModal.style.display = 'none';
        showSection('game-section');
        resetGame();
    });
    
    // Filtros de ranking
    const rankingDifficulty = document.getElementById('ranking-difficulty');
    const rankingPeriod = document.getElementById('ranking-period');
    const rankingTheme = document.getElementById('ranking-theme');
    
    if (rankingDifficulty) rankingDifficulty.addEventListener('change', loadRanking);
    if (rankingPeriod) rankingPeriod.addEventListener('change', loadRanking);
    if (rankingTheme) rankingTheme.addEventListener('change', loadRanking);
    
    // Filtros de administração
    const adminScoreDifficulty = document.getElementById('admin-score-difficulty');
    const adminScoreTheme = document.getElementById('admin-score-theme');
    const adminScoreDate = document.getElementById('admin-score-date');
    const userSearch = document.getElementById('user-search');
    const clearScoresBtn = document.getElementById('clear-scores-btn');
    const createThemeBtn = document.getElementById('create-theme-btn');
    
    if (adminScoreDifficulty) adminScoreDifficulty.addEventListener('change', loadAdminScores);
    if (adminScoreTheme) adminScoreTheme.addEventListener('change', loadAdminScores);
    if (adminScoreDate) adminScoreDate.addEventListener('change', loadAdminScores);
    if (userSearch) userSearch.addEventListener('input', loadAdminUsers);
    if (clearScoresBtn) clearScoresBtn.addEventListener('click', clearOldScores);
    if (createThemeBtn) createThemeBtn.addEventListener('click', showCreateThemeModal);
    
    // Formulário de criação de tema
    if (themeCreateForm) {
        themeCreateForm.addEventListener('submit', handleCreateTheme);
    }
    
    // Upload de imagem
    const themeImageFile = document.getElementById('theme-image-file');
    if (themeImageFile) {
        themeImageFile.addEventListener('change', previewThemeImage);
    }
    
    // Embaralhar o tabuleiro inicialmente
    shuffleBoard();
}

// Jogar como visitante
function playAsGuest() {
    isGuest = true;
    currentUser = null;
    welcomeScreen.classList.remove('active');
    welcomeScreen.style.display = 'none';
    mainApp.classList.add('active');
    updateUIForLoggedOutUser();
    showSection('game-section');
}

// Jogar rapidamente
function quickPlay() {
    isGuest = true;
    currentUser = null;
    welcomeScreen.classList.remove('active');
    welcomeScreen.style.display = 'none';
    mainApp.classList.add('active');
    updateUIForLoggedOutUser();
    showSection('game-section');
    shuffleBoard();
}

// Mostrar seção específica
function showSection(sectionId) {
    // Esconder todas as seções
    const sections = document.querySelectorAll('.page-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Remover classe ativa de todos os links de navegação
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // Mostrar seção solicitada
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Ativar link de navegação correspondente
    if (sectionId === 'home-section') {
        document.getElementById('nav-home').classList.add('active');
    } else if (sectionId === 'game-section') {
        document.getElementById('nav-game').classList.add('active');
        // Atualizar o nome do tema atual
        document.getElementById('current-theme').textContent = themes[currentTheme]?.name || 'Imagem Personalizada';
    } else if (sectionId === 'ranking-section') {
        document.getElementById('nav-ranking').classList.add('active');
    } else if (sectionId === 'progress-section') {
        document.getElementById('nav-progress').classList.add('active');
    } else if (sectionId === 'themes-section') {
        document.getElementById('nav-themes').classList.add('active');
    } else if (sectionId === 'admin-section') {
        document.getElementById('nav-admin').classList.add('active');
    }
}

// Alternar entre abas de autenticação
function switchAuthTab(tab) {
    // Atualizar abas
    const authTabs = document.querySelectorAll('.auth-tab');
    authTabs.forEach(t => t.classList.remove('active'));
    
    const activeTab = document.getElementById(`tab-${tab}`);
    if (activeTab) activeTab.classList.add('active');
    
    // Atualizar formulários
    const authForms = document.querySelectorAll('.auth-form');
    authForms.forEach(form => form.classList.remove('active'));
    
    const activeForm = document.getElementById(`${tab}-form`);
    if (activeForm) activeForm.classList.add('active');
    
    // Atualizar título do modal
    const modalTitle = document.getElementById('auth-modal-title');
    if (modalTitle) {
        if (tab === 'login') modalTitle.textContent = 'Entrar na Conta';
        else if (tab === 'register') modalTitle.textContent = 'Criar Nova Conta';
        else if (tab === 'reset') modalTitle.textContent = 'Recuperar Senha';
    }
}

// Alternar entre abas de administração
function switchAdminTab(tabId) {
    // Atualizar abas
    const adminTabs = document.querySelectorAll('.admin-tab');
    adminTabs.forEach(t => t.classList.remove('active'));
    
    const activeTab = document.querySelector(`.admin-tab[data-tab="${tabId}"]`);
    if (activeTab) activeTab.classList.add('active');
    
    // Atualizar conteúdo
    const tabContents = document.querySelectorAll('.admin-tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    
    const activeContent = document.getElementById(tabId);
    if (activeContent) activeContent.classList.add('active');
    
    // Carregar conteúdo específico
    if (tabId === 'themes-admin-tab') {
        loadAdminThemes();
    } else if (tabId === 'users-tab') {
        loadAdminUsers();
    } else if (tabId === 'scores-tab') {
        loadAdminScores();
    }
}

// Alternar entre abas de progresso
function switchProgressTab(tabId) {
    // Atualizar abas
    const progressTabs = document.querySelectorAll('.progress-tab');
    progressTabs.forEach(t => t.classList.remove('active'));
    
    const activeTab = document.querySelector(`.progress-tab[data-tab="${tabId}"]`);
    if (activeTab) activeTab.classList.add('active');
    
    // Atualizar conteúdo
    const tabContents = document.querySelectorAll('.progress-tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    
    const activeContent = document.getElementById(tabId);
    if (activeContent) activeContent.classList.add('active');
}

// Mostrar modal de login
function showLoginModal() {
    authModal.style.display = 'flex';
    switchAuthTab('login');
}

// Mostrar modal de registro
function showRegisterModal() {
    authModal.style.display = 'flex';
    switchAuthTab('register');
}

// Mostrar modal de criação de tema
function showCreateThemeModal() {
    themeCreateModal.style.display = 'flex';
    themeCreateForm.reset();
    document.getElementById('theme-preview-container').style.display = 'none';
}

// Mostrar modal de visualização de tema
function showViewThemeModal(themeId) {
    const theme = themes[themeId];
    if (!theme) return;
    
    document.getElementById('theme-view-name').textContent = theme.name;
    document.getElementById('theme-view-description').textContent = theme.description || 'Sem descrição';
    
    const preview = document.getElementById('theme-view-preview');
    preview.innerHTML = '';
    preview.style.display = 'grid';
    preview.style.gridTemplateColumns = 'repeat(4, 1fr)';
    preview.style.gridTemplateRows = 'repeat(4, 1fr)';
    preview.style.gap = '2px';
    preview.style.width = '100%';
    preview.style.aspectRatio = '1 / 1';
    
    // Adicionar todas as peças da imagem
    for (let i = 0; i < 16; i++) {
        const tile = document.createElement('div');
        tile.className = 'solution-tile';
        
        if (i === 15) {
            tile.style.backgroundColor = 'var(--gray-light)';
            tile.textContent = '';
        } else if (theme.items[i]) {
            tile.style.backgroundImage = `url(${theme.items[i]})`;
            tile.style.backgroundSize = 'cover';
            tile.style.backgroundPosition = 'center';
            tile.textContent = '';
        }
        
        preview.appendChild(tile);
    }
    
    // Configurar botões
    const useBtn = document.getElementById('use-theme-btn');
    const deleteBtn = document.getElementById('delete-theme-btn');
    
    useBtn.onclick = () => {
        changeTheme(themeId);
        themeViewModal.style.display = 'none';
    };
    
    deleteBtn.onclick = () => {
        if (confirm(`Tem certeza que deseja excluir o tema "${theme.name}"?`)) {
            deleteCustomTheme(themeId);
        }
    };
    
    themeViewModal.style.display = 'flex';
}

// Mostrar modal de instruções
function showInstructionsModal() {
    instructionsModal.style.display = 'flex';
}

// Verificar usuário lembrado
function checkRememberedUser() {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
        try {
            const userData = JSON.parse(rememberedUser);
            document.getElementById('login-email').value = userData.email;
            document.getElementById('login-password').value = userData.password;
            document.getElementById('remember-me').checked = true;
            rememberMe = true;
        } catch (e) {
            console.error("Erro ao carregar usuário lembrado:", e);
        }
    }
}

// Verificar estado de autenticação
function checkAuthState() {
    if (!auth) return;
    
    auth.onAuthStateChanged(async (user) => {
        if (user && !isGuest) {
            // Usuário está logado (não é visitante)
            currentUser = user;
            isGuest = false;
            
            console.log("Usuário logado:", user.email);
            
            // Atualizar interface para usuário logado
            updateUIForLoggedInUser(user);
            
            // Verificar se o usuário é administrador
            isAdmin = await checkIfUserIsAdmin(user.uid);
            updateUIForAdmin(isAdmin);
            
            // Carregar dados do usuário
            await loadUserData(user.uid);
            
            // Salvar credenciais se "Lembrar-me" estiver marcado
            if (rememberMe) {
                const password = document.getElementById('login-password')?.value;
                if (password) {
                    localStorage.setItem('rememberedUser', JSON.stringify({
                        email: user.email,
                        password: password
                    }));
                }
            }
        } else if (!isGuest) {
            // Usuário não está logado e não é visitante
            currentUser = null;
            isAdmin = false;
            
            // Atualizar interface para usuário não logado
            updateUIForLoggedOutUser();
        }
    });
}

// Atualizar UI para usuário logado
function updateUIForLoggedInUser(user) {
    // Mostrar informações do usuário
    if (userInfoContainer) userInfoContainer.style.display = 'flex';
    if (authButtons) authButtons.style.display = 'none';
    
    // Atualizar nome do usuário
    if (userName) {
        const displayName = user.displayName || user.email.split('@')[0];
        userName.textContent = displayName;
    }
}

// Atualizar UI para usuário não logado
function updateUIForLoggedOutUser() {
    // Mostrar botões de autenticação
    if (userInfoContainer) userInfoContainer.style.display = 'none';
    if (authButtons) authButtons.style.display = 'flex';
    
    // Esconder link para admin
    if (adminNavItem) adminNavItem.style.display = 'none';
    
    // Esconder instrução admin na seção de temas
    const adminInstruction = document.getElementById('admin-theme-instruction');
    if (adminInstruction) adminInstruction.style.display = 'none';
}

// Verificar se o usuário é administrador
async function checkIfUserIsAdmin(uid) {
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            return userData.role === 'admin';
        }
        return false;
    } catch (error) {
        console.error("Erro ao verificar se usuário é admin:", error);
        return false;
    }
}

// Atualizar UI para administrador
function updateUIForAdmin(isAdminUser) {
    if (adminNavItem) {
        adminNavItem.style.display = isAdminUser ? 'block' : 'none';
    }
    
    // Mostrar instrução admin na seção de temas
    const adminInstruction = document.getElementById('admin-theme-instruction');
    if (adminInstruction) {
        adminInstruction.style.display = isAdminUser ? 'block' : 'none';
    }
    
    // Mostrar aba admin nas estatísticas
    const adminProgressTab = document.querySelector('.progress-tab[data-tab="admin-progress-tab"]');
    if (adminProgressTab) {
        adminProgressTab.style.display = isAdminUser ? 'flex' : 'none';
    }
    
    isAdmin = isAdminUser;
}

// Carregar dados do usuário
async function loadUserData(uid) {
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            return userData;
        } else {
            // Criar documento do usuário se não existir
            await createUserDocument(uid);
        }
    } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
    }
}

// Criar documento do usuário no Firestore
async function createUserDocument(uid) {
    try {
        const user = auth.currentUser;
        if (!user) return;
        
        // Primeiro usuário é admin
        const usersSnapshot = await db.collection('users').get();
        const isFirstUser = usersSnapshot.empty;
        
        const userData = {
            uid: uid,
            email: user.email,
            name: user.displayName || user.email.split('@')[0],
            role: isFirstUser ? 'admin' : 'player',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'active'
        };
        
        await db.collection('users').doc(uid).set(userData);
        console.log("Documento do usuário criado com sucesso");
        
        // Se for o primeiro usuário, atualizar interface
        if (isFirstUser) {
            isAdmin = true;
            updateUIForAdmin(true);
        }
        
        return userData;
    } catch (error) {
        console.error("Erro ao criar documento do usuário:", error);
    }
}

// Manipular login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const rememberMeCheckbox = document.getElementById('remember-me');
    const messageElement = document.getElementById('login-message');
    
    // Validar entrada
    if (!email || !password) {
        showFormMessage(messageElement, 'Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    try {
        showFormMessage(messageElement, 'Entrando...', 'info');
        
        // Fazer login com Firebase Auth
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Atualizar último login no Firestore
        await db.collection('users').doc(user.uid).update({
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Configurar "Lembrar-me"
        rememberMe = rememberMeCheckbox.checked;
        if (rememberMe) {
            localStorage.setItem('rememberedUser', JSON.stringify({
                email: email,
                password: password
            }));
        } else {
            localStorage.removeItem('rememberedUser');
        }
        
        showFormMessage(messageElement, 'Login realizado com sucesso!', 'success');
        
        // Fechar modal após 1.5 segundos
        setTimeout(() => {
            authModal.style.display = 'none';
            clearFormMessage(messageElement);
            
            // Limpar formulário
            loginForm.reset();
            
            // Se estava na tela de boas-vindas, ir para o jogo
            if (welcomeScreen.classList.contains('active')) {
                welcomeScreen.classList.remove('active');
                welcomeScreen.style.display = 'none';
                mainApp.classList.add('active');
                showSection('game-section');
            }
            
            // Não é mais visitante
            isGuest = false;
        }, 1500);
        
    } catch (error) {
        console.error("Erro ao fazer login:", error);
        
        let errorMessage = 'Erro ao fazer login. ';
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage += 'Usuário não encontrado.';
                break;
            case 'auth/wrong-password':
                errorMessage += 'Senha incorreta.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'Email inválido.';
                break;
            case 'auth/user-disabled':
                errorMessage += 'Esta conta foi desativada.';
                break;
            default:
                errorMessage += 'Verifique suas credenciais.';
        }
        
        showFormMessage(messageElement, errorMessage, 'error');
    }
}

// Manipular registro
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const messageElement = document.getElementById('register-message');
    
    // Validar entrada
    if (!name || !email || !password || !confirmPassword) {
        showFormMessage(messageElement, 'Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    if (password.length < 6) {
        showFormMessage(messageElement, 'A senha deve ter pelo menos 6 caracteres.', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showFormMessage(messageElement, 'As senhas não coincidem.', 'error');
        return;
    }
    
    try {
        showFormMessage(messageElement, 'Criando conta...', 'info');
        
        // Criar usuário com Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Atualizar nome de exibição
        await user.updateProfile({
            displayName: name
        });
        
        // Criar documento do usuário no Firestore
        const userData = {
            uid: user.uid,
            email: email,
            name: name,
            role: 'player', // Novos usuários são sempre players
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'active'
        };
        
        await db.collection('users').doc(user.uid).set(userData);
        
        showFormMessage(messageElement, 'Conta criada com sucesso!', 'success');
        
        // Fechar modal após 1.5 segundos
        setTimeout(() => {
            authModal.style.display = 'none';
            clearFormMessage(messageElement);
            
            // Limpar formulário
            registerForm.reset();
            
            // Se estava na tela de boas-vindas, ir para o jogo
            if (welcomeScreen.classList.contains('active')) {
                welcomeScreen.classList.remove('active');
                welcomeScreen.style.display = 'none';
                mainApp.classList.add('active');
                showSection('game-section');
            }
            
            // Não é mais visitante
            isGuest = false;
        }, 1500);
        
    } catch (error) {
        console.error("Erro ao criar conta:", error);
        
        let errorMessage = 'Erro ao criar conta. ';
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage += 'Este email já está em uso.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'Email inválido.';
                break;
            case 'auth/operation-not-allowed':
                errorMessage += 'Operação não permitida.';
                break;
            case 'auth/weak-password':
                errorMessage += 'A senha é muito fraca.';
                break;
            default:
                errorMessage += 'Tente novamente mais tarde.';
        }
        
        showFormMessage(messageElement, errorMessage, 'error');
    }
}

// Manipular recuperação de senha
async function handlePasswordReset(e) {
    e.preventDefault();
    
    const email = document.getElementById('reset-email').value;
    const messageElement = document.getElementById('reset-message');
    
    if (!email) {
        showFormMessage(messageElement, 'Por favor, insira seu email.', 'error');
        return;
    }
    
    try {
        showFormMessage(messageElement, 'Enviando link de recuperação...', 'info');
        
        await auth.sendPasswordResetEmail(email);
        
        showFormMessage(messageElement, 'Link de recuperação enviado! Verifique seu email.', 'success');
        
        // Limpar formulário após 3 segundos
        setTimeout(() => {
            resetForm.reset();
            clearFormMessage(messageElement);
        }, 3000);
        
    } catch (error) {
        console.error("Erro ao enviar email de recuperação:", error);
        
        let errorMessage = 'Erro ao enviar email de recuperação. ';
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage += 'Usuário não encontrado.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'Email inválido.';
                break;
            default:
                errorMessage += 'Tente novamente mais tarde.';
        }
        
        showFormMessage(messageElement, errorMessage, 'error');
    }
}

// Manipular logout
async function handleLogout() {
    try {
        // Limpar "Lembrar-me"
        localStorage.removeItem('rememberedUser');
        rememberMe = false;
        
        await auth.signOut();
        console.log("Usuário deslogado com sucesso");
        
        // Redirecionar para a página inicial
        showSection('home-section');
        isGuest = false;
        isAdmin = false;
        
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
        alert('Erro ao fazer logout. Tente novamente.');
    }
}

// Mostrar mensagem no formulário
function showFormMessage(element, message, type) {
    if (!element) return;
    
    element.textContent = message;
    element.className = 'form-message ' + type;
    element.style.display = 'block';
}

// Limpar mensagem do formulário
function clearFormMessage(element) {
    if (!element) return;
    
    element.textContent = '';
    element.className = 'form-message';
    element.style.display = 'none';
}

// Mudar tema
function changeTheme(theme) {
    if (!themes[theme]) {
        // Tenta carregar tema personalizado
        loadThemes();
        return;
    }
    
    // Atualizar cards de tema
    const themeCards = document.querySelectorAll('.theme-card');
    themeCards.forEach(card => {
        card.classList.remove('active');
        if (card.dataset.theme === theme) {
            card.classList.add('active');
        }
    });
    
    currentTheme = theme;
    
    // Limpar imagem personalizada temporária
    if (theme !== 'custom-image') {
        customImageData = null;
        currentCustomTheme = null;
    }
    
    // Atualizar nome do tema na interface
    document.getElementById('current-theme').textContent = themes[theme].name;
    
    // Recriar o tabuleiro com o novo tema
    createBoard();
    renderBoard();
    createSolutionBoard();
    
    // Se estiver na seção de temas, voltar para o jogo
    if (themesSection.classList.contains('active')) {
        showSection('game-section');
    }
}

// Pré-visualizar imagem do tema
function previewThemeImage() {
    const fileInput = document.getElementById('theme-image-file');
    const previewContainer = document.getElementById('theme-preview-container');
    const previewBoard = document.getElementById('theme-preview-board');
    
    if (!fileInput.files[0]) return;
    
    const file = fileInput.files[0];
    
    // Verificar se é uma imagem
    if (!file.type.match('image.*')) {
        alert('Por favor, selecione um arquivo de imagem.');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            // Criar um canvas para dividir a imagem
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Tamanho de cada peça (dividir em 4x4)
            const pieceWidth = img.width / 4;
            const pieceHeight = img.height / 4;
            
            // Limpar preview board
            previewBoard.innerHTML = '';
            previewBoard.style.display = 'grid';
            previewBoard.style.gridTemplateColumns = 'repeat(4, 1fr)';
            previewBoard.style.gridTemplateRows = 'repeat(4, 1fr)';
            previewBoard.style.gap = '2px';
            previewBoard.style.width = '100%';
            previewBoard.style.aspectRatio = '1 / 1';
            
            // Gerar as 16 peças (15 visíveis + 1 vazia)
            for (let row = 0; row < 4; row++) {
                for (let col = 0; col < 4; col++) {
                    // Criar canvas para cada peça
                    const pieceCanvas = document.createElement('canvas');
                    pieceCanvas.width = pieceWidth;
                    pieceCanvas.height = pieceHeight;
                    const pieceCtx = pieceCanvas.getContext('2d');
                    
                    // Desenhar a parte da imagem no canvas da peça
                    pieceCtx.drawImage(
                        img,
                        col * pieceWidth,
                        row * pieceHeight,
                        pieceWidth,
                        pieceHeight,
                        0, 0,
                        pieceWidth,
                        pieceHeight
                    );
                    
                    // Converter para data URL
                    const dataUrl = pieceCanvas.toDataURL('image/png');
                    
                    // Criar elemento de pré-visualização
                    const pieceElement = document.createElement('div');
                    pieceElement.className = 'puzzle-tile image-piece';
                    pieceElement.style.backgroundImage = `url(${dataUrl})`;
                    pieceElement.style.backgroundSize = 'cover';
                    pieceElement.style.backgroundPosition = 'center';
                    
                    // A última peça é vazia
                    if (row === 3 && col === 3) {
                        pieceElement.style.backgroundColor = 'var(--gray-light)';
                        pieceElement.style.backgroundImage = 'none';
                    }
                    
                    previewBoard.appendChild(pieceElement);
                }
            }
            
            // Mostrar preview
            previewContainer.style.display = 'block';
        };
        
        img.src = event.target.result;
    };
    
    reader.readAsDataURL(file);
}

// Manipular criação de tema
async function handleCreateTheme(e) {
    e.preventDefault();
    
    const name = document.getElementById('theme-name').value;
    const description = document.getElementById('theme-description').value;
    const fileInput = document.getElementById('theme-image-file');
    const messageElement = document.getElementById('theme-create-message');
    
    if (!name || !fileInput.files[0]) {
        showFormMessage(messageElement, 'Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }
    
    if (!isAdmin) {
        showFormMessage(messageElement, 'Apenas administradores podem criar temas personalizados.', 'error');
        return;
    }
    
    try {
        showFormMessage(messageElement, 'Processando imagem...', 'info');
        
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = async function(event) {
            const img = new Image();
            img.onload = async function() {
                // Criar um canvas para dividir a imagem
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Tamanho de cada peça (dividir em 4x4)
                const pieceWidth = img.width / 4;
                const pieceHeight = img.height / 4;
                
                // Array para armazenar as partes da imagem
                const imagePieces = [];
                
                // Gerar as 16 peças (15 visíveis + 1 vazia)
                for (let row = 0; row < 4; row++) {
                    for (let col = 0; col < 4; col++) {
                        // Criar canvas para cada peça
                        const pieceCanvas = document.createElement('canvas');
                        pieceCanvas.width = pieceWidth;
                        pieceCanvas.height = pieceHeight;
                        const pieceCtx = pieceCanvas.getContext('2d');
                        
                        // Desenhar a parte da imagem no canvas da peça
                        pieceCtx.drawImage(
                            img,
                            col * pieceWidth,
                            row * pieceHeight,
                            pieceWidth,
                            pieceHeight,
                            0, 0,
                            pieceWidth,
                            pieceHeight
                        );
                        
                        // Converter para data URL
                        const dataUrl = pieceCanvas.toDataURL('image/png');
                        
                        // Adicionar ao array (a última peça será null para o espaço vazio)
                        if (row === 3 && col === 3) {
                            imagePieces.push(null);
                        } else {
                            imagePieces.push(dataUrl);
                        }
                    }
                }
                
                // Criar ID único para o tema
                const themeId = 'custom-' + Date.now();
                
                // Salvar tema no Firestore
                const themeData = {
                    id: themeId,
                    name: name,
                    description: description,
                    items: imagePieces,
                    className: 'image-piece',
                    type: 'custom',
                    createdBy: currentUser.uid,
                    createdByName: currentUser.displayName || currentUser.email.split('@')[0],
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    isPublic: true
                };
                
                await db.collection('themes').doc(themeId).set(themeData);
                
                // Adicionar tema localmente
                themes[themeId] = themeData;
                
                showFormMessage(messageElement, 'Tema criado com sucesso!', 'success');
                
                // Fechar modal e recarregar temas após 2 segundos
                setTimeout(() => {
                    themeCreateModal.style.display = 'none';
                    clearFormMessage(messageElement);
                    themeCreateForm.reset();
                    document.getElementById('theme-preview-container').style.display = 'none';
                    
                    // Recarregar lista de temas
                    loadThemes();
                    loadAdminThemes();
                }, 2000);
            };
            
            img.src = event.target.result;
        };
        
        reader.readAsDataURL(file);
        
    } catch (error) {
        console.error("Erro ao criar tema:", error);
        showFormMessage(messageElement, 'Erro ao criar tema. Tente novamente.', 'error');
    }
}

// Carregar temas
async function loadThemes() {
    const themesGrid = document.getElementById('themes-grid');
    if (!themesGrid) return;
    
    try {
        // Carregar temas personalizados do Firestore
        const themesSnapshot = await db.collection('themes').get();
        
        // Atualizar objeto themes com temas personalizados
        themesSnapshot.forEach(doc => {
            const themeData = doc.data();
            themes[themeData.id] = {
                ...themeData,
                type: 'custom'
            };
        });
        
        // Gerar HTML para os temas
        let themesHTML = '';
        
        // Temas built-in
        for (const [id, theme] of Object.entries(themes)) {
            if (theme.type === 'built-in' || theme.type === 'custom') {
                const isActive = currentTheme === id;
                
                let previewContent = '';
                if (theme.type === 'built-in') {
                    previewContent = `<div class="theme-example">${theme.solutionText.replace(/\n/g, '<br>')}</div>`;
                } else {
                    // Para temas personalizados, mostrar primeira peça como preview
                    previewContent = `<div class="theme-example"><i class="fas fa-image" style="font-size: 2.5rem; color: white;"></i></div>`;
                }
                
                themesHTML += `
                    <div class="theme-card ${isActive ? 'active' : ''}" data-theme="${id}">
                        <div class="theme-preview">
                            ${previewContent}
                        </div>
                        <div class="theme-info">
                            <h3>${theme.name}</h3>
                            <p>${theme.type === 'custom' ? (theme.description || 'Tema personalizado') : theme.solutionText.split('\n')[0]}</p>
                            ${theme.type === 'custom' ? `<small>Criado por: ${theme.createdByName}</small>` : ''}
                        </div>
                        ${isActive ? '<div class="theme-badge"><i class="fas fa-check"></i> Ativo</div>' : ''}
                        ${theme.type === 'custom' ? '<div class="theme-badge custom"><i class="fas fa-user"></i> Personalizado</div>' : ''}
                    </div>
                `;
            }
        }
        
        // Adicionar opção de imagem personalizada temporária
        themesHTML += `
            <div class="theme-card" data-theme="custom-image">
                <div class="theme-preview">
                    <div class="theme-example">
                        <i class="fas fa-upload" style="font-size: 2.5rem; color: white;"></i>
                    </div>
                </div>
                <div class="theme-info">
                    <h3>Imagem Temporária</h3>
                    <p>Faça upload de uma imagem para criar seu próprio quebra-cabeça (não salvo)</p>
                </div>
            </div>
        `;
        
        themesGrid.innerHTML = themesHTML;
        
        // Adicionar event listeners aos cards de tema
        const themeCards = document.querySelectorAll('.theme-card');
        themeCards.forEach(card => {
            card.addEventListener('click', function() {
                const theme = this.dataset.theme;
                
                if (theme === 'custom-image') {
                    // Para usuários não-admin, usar upload temporário
                    if (!isAdmin) {
                        // Criar input de arquivo temporário
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        
                        input.onchange = function(e) {
                            const file = e.target.files[0];
                            if (!file) return;
                            
                            const reader = new FileReader();
                            reader.onload = function(event) {
                                const img = new Image();
                                img.onload = function() {
                                    // Criar peças da imagem
                                    const canvas = document.createElement('canvas');
                                    const pieceWidth = img.width / 4;
                                    const pieceHeight = img.height / 4;
                                    
                                    const imagePieces = [];
                                    
                                    for (let row = 0; row < 4; row++) {
                                        for (let col = 0; col < 4; col++) {
                                            const pieceCanvas = document.createElement('canvas');
                                            pieceCanvas.width = pieceWidth;
                                            pieceCanvas.height = pieceHeight;
                                            const pieceCtx = pieceCanvas.getContext('2d');
                                            
                                            pieceCtx.drawImage(
                                                img,
                                                col * pieceWidth,
                                                row * pieceHeight,
                                                pieceWidth,
                                                pieceHeight,
                                                0, 0,
                                                pieceWidth,
                                                pieceHeight
                                            );
                                            
                                            const dataUrl = pieceCanvas.toDataURL('image/png');
                                            
                                            if (row === 3 && col === 3) {
                                                imagePieces.push(null);
                                            } else {
                                                imagePieces.push(dataUrl);
                                            }
                                        }
                                    }
                                    
                                    customImageData = imagePieces;
                                    currentCustomTheme = null;
                                    changeTheme('custom-image');
                                };
                                img.src = event.target.result;
                            };
                            reader.readAsDataURL(file);
                        };
                        
                        input.click();
                    } else {
                        // Para admin, abrir modal de criação
                        showCreateThemeModal();
                    }
                } else if (themes[theme].type === 'custom') {
                    // Para temas personalizados, mostrar modal de visualização
                    showViewThemeModal(theme);
                } else {
                    changeTheme(theme);
                }
            });
        });
        
    } catch (error) {
        console.error("Erro ao carregar temas:", error);
    }
}

// Carregar temas para administração
async function loadAdminThemes() {
    const themesList = document.getElementById('admin-themes-list');
    const loadingElement = document.getElementById('admin-themes-loading');
    
    if (!themesList || !loadingElement) return;
    
    if (loadingElement) loadingElement.style.display = 'flex';
    if (themesList) themesList.innerHTML = '';
    
    try {
        const themesSnapshot = await db.collection('themes').orderBy('createdAt', 'desc').get();
        
        if (themesSnapshot.empty) {
            themesList.innerHTML = '<p class="no-themes">Nenhum tema personalizado encontrado.</p>';
            return;
        }
        
        let themesHTML = '';
        
        themesSnapshot.forEach(doc => {
            const theme = doc.data();
            
            themesHTML += `
                <div class="theme-admin-item" data-theme-id="${theme.id}">
                    <div class="theme-admin-info">
                        <div class="theme-admin-name">${theme.name}</div>
                        <div class="theme-admin-details">
                            <span>Criado por: ${theme.createdByName}</span>
                            <span>• ${theme.createdAt ? new Date(theme.createdAt.toDate()).toLocaleDateString('pt-BR') : 'Data não disponível'}</span>
                        </div>
                        <div class="theme-admin-description">${theme.description || 'Sem descrição'}</div>
                    </div>
                    <div class="theme-admin-actions">
                        <button class="btn btn-secondary btn-icon view-theme-btn">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-danger btn-icon delete-theme-btn">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        themesList.innerHTML = themesHTML;
        
        // Adicionar event listeners
        const viewButtons = document.querySelectorAll('.view-theme-btn');
        viewButtons.forEach(button => {
            button.addEventListener('click', function() {
                const themeId = this.closest('.theme-admin-item').dataset.themeId;
                showViewThemeModal(themeId);
            });
        });
        
        const deleteButtons = document.querySelectorAll('.delete-theme-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function() {
                const themeId = this.closest('.theme-admin-item').dataset.themeId;
                const theme = themes[themeId];
                
                if (theme && confirm(`Tem certeza que deseja excluir o tema "${theme.name}"?`)) {
                    deleteCustomTheme(themeId);
                }
            });
        });
        
    } catch (error) {
        console.error("Erro ao carregar temas admin:", error);
        themesList.innerHTML = '<p class="error-message">Erro ao carregar temas.</p>';
    } finally {
        if (loadingElement) loadingElement.style.display = 'none';
    }
}

// Excluir tema personalizado
async function deleteCustomTheme(themeId) {
    try {
        // Excluir do Firestore
        await db.collection('themes').doc(themeId).delete();
        
        // Excluir localmente
        delete themes[themeId];
        
        // Recarregar listas
        loadThemes();
        loadAdminThemes();
        
        // Se o tema atual for o excluído, mudar para tema padrão
        if (currentTheme === themeId) {
            changeTheme('numbers');
        }
        
        alert('Tema excluído com sucesso!');
        
    } catch (error) {
        console.error("Erro ao excluir tema:", error);
        alert('Erro ao excluir tema. Tente novamente.');
    }
}

// Carregar ranking
async function loadRanking() {
    const rankingListElement = document.getElementById('ranking-list');
    const loadingElement = document.getElementById('ranking-loading');
    
    if (!rankingListElement || !loadingElement) return;
    
    // Mostrar spinner de carregamento
    rankingListElement.innerHTML = '';
    loadingElement.style.display = 'flex';
    
    try {
        // Obter filtros
        const difficulty = document.getElementById('ranking-difficulty').value;
        const period = document.getElementById('ranking-period').value;
        const theme = document.getElementById('ranking-theme').value;
        
        // Construir query
        let query = db.collection('scores').orderBy('moves').limit(50);
        
        // Aplicar filtro de dificuldade
        if (difficulty !== 'all') {
            query = query.where('difficulty', '==', difficulty);
        }
        
        // Aplicar filtro de tema
        if (theme !== 'all') {
            query = query.where('themeName', '==', theme === 'custom-image' ? 'Imagem Personalizada' : 
                (theme === 'numbers' ? 'Números' : 
                 theme === 'words' ? 'Palavras' : 
                 theme === 'animals' ? 'Animais' : theme));
        }
        
        // Aplicar filtro de período
        if (period !== 'all') {
            const now = new Date();
            let startDate = new Date();
            
            if (period === 'today') {
                startDate.setHours(0, 0, 0, 0);
            } else if (period === 'week') {
                startDate.setDate(now.getDate() - 7);
            } else if (period === 'month') {
                startDate.setMonth(now.getMonth() - 1);
            }
            
            query = query.where('date', '>=', startDate);
        }
        
        // Executar query
        const snapshot = await query.get();
        
        // Processar resultados
        const scores = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            scores.push({
                id: doc.id,
                ...data,
                date: data.date && data.date.toDate ? data.date.toDate() : new Date()
            });
        });
        
        // Ordenar por menor número de movimentos e tempo
        scores.sort((a, b) => {
            if (a.moves !== b.moves) {
                return a.moves - b.moves;
            }
            return a.time - b.time;
        });
        
        // Limpar lista
        rankingListElement.innerHTML = '';
        
        // Adicionar itens ao ranking
        if (scores.length === 0) {
            rankingListElement.innerHTML = '<p class="no-scores">Nenhuma pontuação encontrada.</p>';
        } else {
            scores.forEach((score, index) => {
                const rankingItem = document.createElement('div');
                rankingItem.className = 'ranking-item';
                
                // Verificar se é a pontuação do usuário atual
                if (currentUser && score.userId === currentUser.uid) {
                    rankingItem.classList.add('own-ranking');
                }
                
                // Formatar data
                const formattedDate = score.date.toLocaleDateString('pt-BR');
                
                // Emoji de medalha para os 3 primeiros
                let medal = '';
                if (index === 0) medal = '🥇';
                else if (index === 1) medal = '🥈';
                else if (index === 2) medal = '🥉';
                
                rankingItem.innerHTML = `
                    <div class="ranking-rank">
                        ${medal ? `<span class="ranking-medal">${medal}</span>` : ''}
                        ${index + 1}
                    </div>
                    <div class="ranking-user">
                        <div class="ranking-name">${score.userName}</div>
                        <div class="ranking-email">${formattedDate} • ${getDifficultyText(score.difficulty)} • ${score.themeName || score.theme}</div>
                    </div>
                    <div class="ranking-score">
                        <div class="ranking-moves">
                            <div class="value">${score.moves}</div>
                            <div class="label">movimentos</div>
                        </div>
                        <div class="ranking-time">
                            <div class="value">${formatTime(score.time)}</div>
                            <div class="label">tempo</div>
                        </div>
                    </div>
                `;
                
                rankingListElement.appendChild(rankingItem);
            });
        }
        
    } catch (error) {
        console.error("Erro ao carregar ranking:", error);
        rankingListElement.innerHTML = '<p class="error-message">Erro ao carregar ranking. Tente novamente.</p>';
    } finally {
        // Esconder spinner de carregamento
        loadingElement.style.display = 'none';
    }
}

// Obter texto da dificuldade
function getDifficultyText(difficulty) {
    switch (difficulty) {
        case 'easy': return 'Fácil';
        case 'normal': return 'Normal';
        case 'hard': return 'Difícil';
        default: return 'Normal';
    }
}

// Carregar estatísticas globais
async function loadGlobalStats() {
    try {
        // Carregar total de jogos
        const scoresSnapshot = await db.collection('scores').get();
        const totalGames = scoresSnapshot.size;
        document.getElementById('total-games-global').textContent = totalGames;
        
        // Calcular média de movimentos
        let totalMoves = 0;
        scoresSnapshot.forEach(doc => {
            totalMoves += doc.data().moves;
        });
        const avgMoves = totalGames > 0 ? Math.round(totalMoves / totalGames) : 0;
        document.getElementById('avg-moves-global').textContent = avgMoves;
        
        // Calcular média de tempo
        let totalTime = 0;
        scoresSnapshot.forEach(doc => {
            totalTime += doc.data().time;
        });
        const avgTime = totalGames > 0 ? Math.round(totalTime / totalGames) : 0;
        document.getElementById('avg-time-global').textContent = formatTime(avgTime);
        
        // Carregar total de jogadores
        const usersSnapshot = await db.collection('users').get();
        const totalPlayers = usersSnapshot.size;
        document.getElementById('total-players').textContent = totalPlayers;
        
    } catch (error) {
        console.error("Erro ao carregar estatísticas globais:", error);
    }
}

// Carregar estatísticas do usuário
async function loadUserStats() {
    if (!currentUser || isGuest) {
        userStatsContainer.innerHTML = '<p class="no-stats">Faça login para ver suas estatísticas.</p>';
        return;
    }
    
    try {
        // Carregar pontuações do usuário
        const scoresSnapshot = await db.collection('scores')
            .where('userId', '==', currentUser.uid)
            .get();
        
        const scores = [];
        scoresSnapshot.forEach(doc => {
            scores.push(doc.data());
        });
        
        if (scores.length === 0) {
            userStatsContainer.innerHTML = '<p class="no-stats">Você ainda não tem pontuações salvas. Jogue para ver suas estatísticas!</p>';
            return;
        }
        
        // Calcular estatísticas
        const totalGames = scores.length;
        const totalMoves = scores.reduce((sum, score) => sum + score.moves, 0);
        const totalTime = scores.reduce((sum, score) => sum + score.time, 0);
        const avgMoves = Math.round(totalMoves / totalGames);
        const avgTime = Math.round(totalTime / totalGames);
        
        // Melhores pontuações por dificuldade
        const bestByDifficulty = {
            easy: { moves: Infinity, time: Infinity },
            normal: { moves: Infinity, time: Infinity },
            hard: { moves: Infinity, time: Infinity }
        };
        
        scores.forEach(score => {
            if (score.moves < bestByDifficulty[score.difficulty].moves) {
                bestByDifficulty[score.difficulty].moves = score.moves;
                bestByDifficulty[score.difficulty].time = score.time;
            }
        });
        
        // Gerar HTML das estatísticas
        userStatsContainer.innerHTML = `
            <div class="stats-grid">
                <div class="stat-box">
                    <div class="stat-value">${totalGames}</div>
                    <div class="stat-label">Jogos Concluídos</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${avgMoves}</div>
                    <div class="stat-label">Média de Movimentos</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${formatTime(avgTime)}</div>
                    <div class="stat-label">Tempo Médio</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${bestByDifficulty.normal.moves !== Infinity ? bestByDifficulty.normal.moves : '-'}</div>
                    <div class="stat-label">Melhor (Normal)</div>
                </div>
            </div>
        `;
        
        // Criar gráficos
        createUserCharts(scores);
        
    } catch (error) {
        console.error("Erro ao carregar estatísticas do usuário:", error);
        userStatsContainer.innerHTML = '<p class="error-message">Erro ao carregar estatísticas.</p>';
    }
}

// Criar gráficos do usuário
function createUserCharts(scores) {
    // Agrupar por dificuldade
    const difficultyData = {
        easy: { count: 0, totalMoves: 0, totalTime: 0 },
        normal: { count: 0, totalMoves: 0, totalTime: 0 },
        hard: { count: 0, totalMoves: 0, totalTime: 0 }
    };
    
    scores.forEach(score => {
        difficultyData[score.difficulty].count++;
        difficultyData[score.difficulty].totalMoves += score.moves;
        difficultyData[score.difficulty].totalTime += score.time;
    });
    
    // Gráfico de desempenho por dificuldade
    const difficultyCtx = document.getElementById('difficulty-chart');
    if (difficultyCtx) {
        if (charts.difficultyChart) {
            charts.difficultyChart.destroy();
        }
        
        charts.difficultyChart = new Chart(difficultyCtx, {
            type: 'bar',
            data: {
                labels: ['Fácil', 'Normal', 'Difícil'],
                datasets: [{
                    label: 'Média de Movimentos',
                    data: [
                        difficultyData.easy.count > 0 ? Math.round(difficultyData.easy.totalMoves / difficultyData.easy.count) : 0,
                        difficultyData.normal.count > 0 ? Math.round(difficultyData.normal.totalMoves / difficultyData.normal.count) : 0,
                        difficultyData.hard.count > 0 ? Math.round(difficultyData.hard.totalMoves / difficultyData.hard.count) : 0
                    ],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 99, 132, 0.6)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 99, 132, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Movimentos'
                        }
                    }
                }
            }
        });
    }
    
    // Gráfico de evolução (últimos 10 jogos)
    const movesCtx = document.getElementById('moves-chart');
    if (movesCtx) {
        const lastScores = scores.slice(-10).reverse();
        
        if (charts.movesChart) {
            charts.movesChart.destroy();
        }
        
        charts.movesChart = new Chart(movesCtx, {
            type: 'line',
            data: {
                labels: lastScores.map((_, i) => `Jogo ${i + 1}`),
                datasets: [{
                    label: 'Movimentos',
                    data: lastScores.map(score => score.moves),
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Movimentos'
                        }
                    }
                }
            }
        });
    }
}

// Carregar estatísticas de admin
async function loadAdminStats() {
    if (!isAdmin) {
        adminStatsContainer.innerHTML = '<p class="no-stats">Apenas administradores podem ver estas estatísticas.</p>';
        return;
    }
    
    try {
        // Carregar todas as pontuações
        const scoresSnapshot = await db.collection('scores').get();
        const usersSnapshot = await db.collection('users').get();
        
        const scores = [];
        scoresSnapshot.forEach(doc => {
            scores.push(doc.data());
        });
        
        const users = [];
        usersSnapshot.forEach(doc => {
            users.push(doc.data());
        });
        
        // Estatísticas gerais
        const totalGames = scores.length;
        const totalPlayers = users.length;
        const activePlayers = users.filter(u => u.status === 'active').length;
        
        // Jogos por dia (últimos 7 dias)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const gamesByDay = {};
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('pt-BR');
            gamesByDay[dateStr] = 0;
        }
        
        scores.forEach(score => {
            if (score.date && score.date.toDate) {
                const scoreDate = score.date.toDate();
                if (scoreDate >= sevenDaysAgo) {
                    const dateStr = scoreDate.toLocaleDateString('pt-BR');
                    if (gamesByDay[dateStr] !== undefined) {
                        gamesByDay[dateStr]++;
                    }
                }
            }
        });
        
        // Gerar HTML das estatísticas
        adminStatsContainer.innerHTML = `
            <div class="stats-grid">
                <div class="stat-box">
                    <div class="stat-value">${totalGames}</div>
                    <div class="stat-label">Total de Jogos</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${totalPlayers}</div>
                    <div class="stat-label">Total de Usuários</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${activePlayers}</div>
                    <div class="stat-label">Usuários Ativos</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${Object.keys(themes).filter(k => themes[k].type === 'custom').length}</div>
                    <div class="stat-label">Temas Personalizados</div>
                </div>
            </div>
        `;
        
        // Criar gráficos de admin
        createAdminCharts(scores, users, gamesByDay);
        
    } catch (error) {
        console.error("Erro ao carregar estatísticas de admin:", error);
        adminStatsContainer.innerHTML = '<p class="error-message">Erro ao carregar estatísticas.</p>';
    }
}

// Criar gráficos de admin
function createAdminCharts(scores, users, gamesByDay) {
    // Gráfico de distribuição de jogadores
    const playersCtx = document.getElementById('players-chart');
    if (playersCtx) {
        const playersByRole = {
            admin: users.filter(u => u.role === 'admin').length,
            player: users.filter(u => u.role === 'player').length
        };
        
        if (charts.playersChart) {
            charts.playersChart.destroy();
        }
        
        charts.playersChart = new Chart(playersCtx, {
            type: 'doughnut',
            data: {
                labels: ['Administradores', 'Jogadores'],
                datasets: [{
                    data: [playersByRole.admin, playersByRole.player],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                }
            }
        });
    }
    
    // Gráfico de atividade
    const activityCtx = document.getElementById('activity-chart');
    if (activityCtx) {
        const dates = Object.keys(gamesByDay).reverse();
        const games = dates.map(date => gamesByDay[date]);
        
        if (charts.activityChart) {
            charts.activityChart.destroy();
        }
        
        charts.activityChart = new Chart(activityCtx, {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Jogos por Dia',
                    data: games,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Número de Jogos'
                        }
                    }
                }
            }
        });
    }
}

// Carregar usuários para administração
async function loadAdminUsers() {
    if (!currentUser) return;
    
    const loadingElement = document.getElementById('users-loading');
    const usersListElement = document.getElementById('users-list');
    const searchTerm = document.getElementById('user-search') ? document.getElementById('user-search').value.toLowerCase() : '';
    
    if (loadingElement) loadingElement.style.display = 'flex';
    if (usersListElement) usersListElement.innerHTML = '';
    
    try {
        // Verificar se o usuário atual é administrador
        if (!isAdmin) {
            if (usersListElement) {
                usersListElement.innerHTML = '<p class="error-message">Acesso negado. Apenas administradores podem acessar esta área.</p>';
            }
            return;
        }
        
        // Carregar usuários
        const usersSnapshot = await db.collection('users').orderBy('name').get();
        
        const users = [];
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            // Aplicar filtro de busca
            if (!searchTerm || 
                userData.name.toLowerCase().includes(searchTerm) || 
                userData.email.toLowerCase().includes(searchTerm)) {
                users.push({
                    id: doc.id,
                    ...userData
                });
            }
        });
        
        // Atualizar lista de usuários
        if (usersListElement) {
            if (users.length === 0) {
                usersListElement.innerHTML = '<p class="no-users">Nenhum usuário encontrado.</p>';
            } else {
                users.forEach(user => {
                    const userItem = document.createElement('div');
                    userItem.className = 'user-item';
                    
                    userItem.innerHTML = `
                        <div class="user-info">
                            <div class="user-name">${user.name}</div>
                            <div class="user-email">${user.email}</div>
                            <div>
                                <span class="user-role ${user.role}">${user.role === 'admin' ? 'Administrador' : 'Jogador'}</span>
                                <span class="user-status ${user.status || 'active'}">${user.status === 'suspended' ? 'Suspenso' : 'Ativo'}</span>
                            </div>
                        </div>
                        <div class="user-actions">
                            <button class="btn btn-secondary btn-icon edit-user-btn" data-user-id="${user.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                    `;
                    
                    usersListElement.appendChild(userItem);
                });
                
                // Adicionar event listeners aos botões de edição
                const editButtons = document.querySelectorAll('.edit-user-btn');
                editButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        const userId = this.dataset.userId;
                        openEditUserModal(userId);
                    });
                });
            }
        }
        
    } catch (error) {
        console.error("Erro ao carregar usuários:", error);
        if (usersListElement) {
            usersListElement.innerHTML = '<p class="error-message">Erro ao carregar usuários.</p>';
        }
    } finally {
        if (loadingElement) loadingElement.style.display = 'none';
    }
}

// Abrir modal de edição de usuário
async function openEditUserModal(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (!userDoc.exists) {
            alert('Usuário não encontrado.');
            return;
        }
        
        const userData = userDoc.data();
        
        // Preencher formulário
        document.getElementById('edit-user-id').value = userId;
        document.getElementById('edit-user-name').value = userData.name || '';
        document.getElementById('edit-user-email').value = userData.email || '';
        document.getElementById('edit-user-role').value = userData.role || 'player';
        document.getElementById('edit-user-status').value = userData.status || 'active';
        document.getElementById('edit-user-password').value = '';
        
        // Mostrar modal
        document.getElementById('edit-user-modal').style.display = 'flex';
        
        // Adicionar event listener ao formulário de edição
        const editUserForm = document.getElementById('edit-user-form');
        if (editUserForm) {
            // Remover event listeners anteriores
            editUserForm.replaceWith(editUserForm.cloneNode(true));
            
            // Adicionar novo event listener
            document.getElementById('edit-user-form').addEventListener('submit', function(e) {
                e.preventDefault();
                handleEditUser(userId);
            });
        }
        
    } catch (error) {
        console.error("Erro ao abrir modal de edição de usuário:", error);
        alert('Erro ao carregar dados do usuário.');
    }
}

// Manipular edição de usuário
async function handleEditUser(userId) {
    const name = document.getElementById('edit-user-name').value;
    const email = document.getElementById('edit-user-email').value;
    const role = document.getElementById('edit-user-role').value;
    const password = document.getElementById('edit-user-password').value;
    const status = document.getElementById('edit-user-status').value;
    const messageElement = document.getElementById('edit-user-message');
    
    if (!userId || !name || !email || !role) {
        showFormMessage(messageElement, 'Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }
    
    try {
        showFormMessage(messageElement, 'Salvando alterações...', 'info');
        
        // Atualizar dados no Firestore
        const updateData = {
            name: name,
            email: email,
            role: role,
            status: status,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('users').doc(userId).update(updateData);
        
        showFormMessage(messageElement, 'Usuário atualizado com sucesso!', 'success');
        
        // Recarregar lista de usuários após 1.5 segundos
        setTimeout(() => {
            document.getElementById('edit-user-modal').style.display = 'none';
            clearFormMessage(messageElement);
            loadAdminUsers();
        }, 1500);
        
    } catch (error) {
        console.error("Erro ao atualizar usuário:", error);
        showFormMessage(messageElement, 'Erro ao atualizar usuário. Tente novamente.', 'error');
    }
}

// Carregar pontuações para administração
async function loadAdminScores() {
    const loadingElement = document.getElementById('admin-scores-loading');
    const scoresListElement = document.getElementById('admin-scores-list');
    
    if (!currentUser) return;
    
    // Verificar se o usuário atual é administrador
    if (!isAdmin) {
        if (scoresListElement) {
            scoresListElement.innerHTML = '<p class="error-message">Acesso negado. Apenas administradores podem acessar esta área.</p>';
        }
        return;
    }
    
    if (loadingElement) loadingElement.style.display = 'flex';
    if (scoresListElement) scoresListElement.innerHTML = '';
    
    try {
        // Obter filtros
        const difficulty = document.getElementById('admin-score-difficulty').value;
        const theme = document.getElementById('admin-score-theme').value;
        const dateFilter = document.getElementById('admin-score-date').value;
        
        // Construir query
        let query = db.collection('scores').orderBy('date', 'desc').limit(100);
        
        // Aplicar filtro de dificuldade
        if (difficulty !== 'all') {
            query = query.where('difficulty', '==', difficulty);
        }
        
        // Aplicar filtro de tema
        if (theme !== 'all') {
            query = query.where('themeName', '==', theme === 'custom-image' ? 'Imagem Personalizada' : 
                (theme === 'numbers' ? 'Números' : 
                 theme === 'words' ? 'Palavras' : 
                 theme === 'animals' ? 'Animais' : theme));
        }
        
        // Aplicar filtro de data
        if (dateFilter) {
            const startDate = new Date(dateFilter);
            startDate.setHours(0, 0, 0, 0);
            
            const endDate = new Date(dateFilter);
            endDate.setHours(23, 59, 59, 999);
            
            query = query.where('date', '>=', startDate).where('date', '<=', endDate);
        }
        
        // Executar query
        const snapshot = await query.get();
        
        const scores = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            scores.push({
                id: doc.id,
                ...data,
                date: data.date && data.date.toDate ? data.date.toDate() : new Date()
            });
        });
        
        // Atualizar lista de pontuações
        if (scoresListElement) {
            if (scores.length === 0) {
                scoresListElement.innerHTML = '<p class="no-scores">Nenhuma pontuação encontrada.</p>';
            } else {
                scores.forEach(score => {
                    const scoreItem = document.createElement('div');
                    scoreItem.className = 'score-item';
                    
                    const date = score.date;
                    const formattedDate = date.toLocaleDateString('pt-BR');
                    const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    
                    scoreItem.innerHTML = `
                        <div class="score-date">${formattedDate} ${formattedTime}</div>
                        <div class="score-info">
                            <span class="score-user">${score.userName}</span>
                            <span class="score-difficulty">${getDifficultyText(score.difficulty)} • ${score.themeName || score.theme}</span>
                        </div>
                        <div class="score-details">
                            <span>${score.moves} movimentos</span>
                            <span>${formatTime(score.time)}</span>
                            <button class="btn btn-danger btn-icon delete-score-btn" data-score-id="${score.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                    
                    scoresListElement.appendChild(scoreItem);
                });
                
                // Adicionar event listeners aos botões de exclusão
                const deleteButtons = document.querySelectorAll('.delete-score-btn');
                deleteButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        const scoreId = this.dataset.scoreId;
                        deleteScore(scoreId);
                    });
                });
            }
        }
        
    } catch (error) {
        console.error("Erro ao carregar pontuações:", error);
        if (scoresListElement) {
            scoresListElement.innerHTML = '<p class="error-message">Erro ao carregar pontuações. Tente novamente.</p>';
        }
    } finally {
        if (loadingElement) loadingElement.style.display = 'none';
    }
}

// Excluir pontuação
async function deleteScore(scoreId) {
    if (!confirm('Tem certeza que deseja excluir esta pontuação?')) {
        return;
    }
    
    try {
        await db.collection('scores').doc(scoreId).delete();
        
        // Recarregar lista de pontuações
        loadAdminScores();
        
        // Se estiver na seção de ranking, recarregar também
        if (rankingSection.classList.contains('active')) {
            loadRanking();
        }
        
        alert('Pontuação excluída com sucesso!');
        
    } catch (error) {
        console.error("Erro ao excluir pontuação:", error);
        alert('Erro ao excluir pontuação. Tente novamente.');
    }
}

// Limpar pontuações antigas
async function clearOldScores() {
    if (!confirm('Tem certeza que deseja limpar pontuações antigas? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        // Definir data de corte (30 dias atrás)
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30);
        
        // Buscar pontuações antigas
        const oldScoresSnapshot = await db.collection('scores')
            .where('date', '<', cutoffDate)
            .get();
        
        const batch = db.batch();
        let deletedCount = 0;
        
        oldScoresSnapshot.forEach(doc => {
            batch.delete(doc.ref);
            deletedCount++;
        });
        
        // Executar batch
        if (deletedCount > 0) {
            await batch.commit();
            alert(`${deletedCount} pontuações antigas foram excluídas.`);
        } else {
            alert('Nenhuma pontuação antiga encontrada para exclusão.');
        }
        
        // Recarregar lista de pontuações
        loadAdminScores();
        
    } catch (error) {
        console.error("Erro ao limpar pontuações antigas:", error);
        alert('Erro ao limpar pontuações antigas. Tente novamente.');
    }
}

// Manipular registro de usuário pelo administrador
async function handleAdminRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('admin-name').value;
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const confirmPassword = document.getElementById('admin-confirm-password').value;
    const role = document.getElementById('admin-role').value;
    const messageElement = document.getElementById('admin-register-message');
    
    // Validar entrada
    if (!name || !email || !password || !confirmPassword || !role) {
        showFormMessage(messageElement, 'Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    if (password.length < 6) {
        showFormMessage(messageElement, 'A senha deve ter pelo menos 6 caracteres.', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showFormMessage(messageElement, 'As senhas não coincidem.', 'error');
        return;
    }
    
    try {
        showFormMessage(messageElement, 'Criando conta...', 'info');
        
        // Verificar se o usuário atual é administrador
        if (!isAdmin) {
            showFormMessage(messageElement, 'Apenas administradores podem criar novas contas.', 'error');
            return;
        }
        
        // Criar usuário com Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Atualizar nome de exibição
        await user.updateProfile({
            displayName: name
        });
        
        // Criar documento do usuário no Firestore
        const userData = {
            uid: user.uid,
            email: email,
            name: name,
            role: role,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: currentUser.uid,
            createdByName: currentUser.displayName || currentUser.email.split('@')[0],
            status: 'active'
        };
        
        await db.collection('users').doc(user.uid).set(userData);
        
        showFormMessage(messageElement, 'Usuário cadastrado com sucesso!', 'success');
        
        // Limpar formulário após 3 segundos
        setTimeout(() => {
            adminRegisterForm.reset();
            clearFormMessage(messageElement);
            
            // Recarregar lista de usuários
            loadAdminUsers();
        }, 3000);
        
    } catch (error) {
        console.error("Erro ao criar conta de usuário:", error);
        
        let errorMessage = 'Erro ao criar conta de usuário. ';
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage += 'Este email já está em uso.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'Email inválido.';
                break;
            default:
                errorMessage += 'Tente novamente mais tarde.';
        }
        
        showFormMessage(messageElement, errorMessage, 'error');
    }
}
