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
let rememberMe = false;

// Elementos do DOM
let welcomeScreen, mainApp;
let puzzleBoard, moveCounter, timerElement, shuffleBtn, solveBtn, resetBtn, hintBtn;
let playAgainBtn, completionMessage, finalMoves, finalTime;
let difficultyBtns, authModal, loginBtn, registerBtn, logoutBtn, userInfo, userName;
let adminNavItem, homeSection, gameSection, rankingSection, themesSection, adminSection, progressSection;
let rankingList, userScoresList, usersList, adminScoresList;
let loginForm, registerForm, resetForm, adminRegisterForm, editUserForm;
let authButtons, userInfoContainer, dbStatus;
let playGuestBtn, welcomeLoginBtn, welcomeRegisterBtn, quickPlayBtn;
let heroPlayBtn, heroHowtoBtn, changeThemeBtn, themeCards;
let instructionsModal, startPlayingBtn;
let imageUploadModal, imageUploadForm, imageFileInput, useImageBtn, imagePreviewContainer;
let rememberMeCheckbox;

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
let customImageName = null;
let savedCustomThemes = [];

// Temas disponíveis
const themes = {
    numbers: {
        name: "Números",
        items: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', null],
        className: 'number',
        solutionText: "1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15"
    },
    words: {
        name: "Palavras",
        items: ['M', 'A', 'T', 'O', 'A', 'T', 'A', 'R', 'C', 'U', 'C', 'A', 'A', 'M', 'O', null],
        className: 'word',
        solutionText: "M A T O\nA T A R\nC U C A\nA M O\n"
    },
    animals: {
        name: "Animais",
        items: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', null],
        className: 'emoji',
        solutionText: "🐶 🐱 🐭 🐹\n🐰 🦊 🐻 🐼\n🐨 🦁 🐮 🐷\n🐸 🐵 🐔"
    },
    fruits: {
        name: "Frutas",
        items: ['🍎', '🍌', '🍇', '🍓', '🍉', '🍊', '🍑', '🍍', '🥭', '🍒', '🥝', '🍏', '🥥', '🍈', '🫐', null],
        className: 'emoji',
        solutionText: "🍎 🍌 🍇 🍓\n🍉 🍊 🍑 🍍\n🥭 🍒 🥝 🍏\n🥥 🍈 🫐"
    },
    flags: {
        name: "Bandeiras",
        items: ['🇧🇷', '🇺🇸', '🇨🇳', '🇯🇵', '🇩🇪', '🇫🇷', '🇮🇹', '🇪🇸', '🇬🇧', '🇨🇦', '🇦🇺', '🇰🇷', '🇦🇷', '🇲🇽', '🇵🇹', null],
        className: 'emoji',
        solutionText: "🇧🇷 🇺🇸 🇨🇳 🇯🇵\n🇩🇪 🇫🇷 🇮🇹 🇪🇸\n🇬🇧 🇨🇦 🇦🇺 🇰🇷\n🇦🇷 🇲🇽 🇵🇹"
    },
    emoji: {
        name: "Emojis",
        items: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '😍', '😘', '😋', '😜', '🤪', null],
        className: 'emoji',
        solutionText: "😀 😃 😄 😁\n😆 😅 😂 🤣\n😊 😇 😍 😘\n😋 😜 🤪"
    },
    'custom-image': {
        name: "Imagem Personalizada",
        items: [],
        className: 'image-piece',
        solutionText: "Imagem Personalizada"
    }
};

// Variáveis para drag and drop
let draggedTile = null;
let dragStartX = 0;
let dragStartY = 0;
let isDragging = false;

// Inicialização do aplicativo
document.addEventListener('DOMContentLoaded', function() {
    initializeFirebase();
    initializeDOMElements();
    initializeGame();
    setupEventListeners();
    checkAuthState();
    initializePreviewBoard();
    loadGlobalStats();
    loadSavedCustomThemes();
    
    // Verificar se há credenciais salvas
    checkRememberedUser();
});

// Inicializar Firebase
function initializeFirebase() {
    try {
        app = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        
        console.log("Firebase inicializado com sucesso!");
        updateDBStatus("Conectado", "connected");
        
        // Configurar persistência de autenticação
        firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        
        // Verificar se já existe um administrador no sistema
        checkAdminExists();
    } catch (error) {
        console.error("Erro ao inicializar Firebase:", error);
        updateDBStatus("Erro de conexão", "error");
    }
}

// Verificar se há usuário lembrado
function checkRememberedUser() {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser && !currentUser) {
        try {
            const userData = JSON.parse(rememberedUser);
            if (userData.email && userData.password) {
                // Tentar login automático
                auth.signInWithEmailAndPassword(userData.email, userData.password)
                    .then(() => {
                        console.log("Login automático realizado com sucesso");
                    })
                    .catch(error => {
                        console.error("Erro no login automático:", error);
                        localStorage.removeItem('rememberedUser');
                    });
            }
        } catch (error) {
            console.error("Erro ao processar dados do usuário lembrado:", error);
            localStorage.removeItem('rememberedUser');
        }
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
    themeCards = document.querySelectorAll('.theme-card');
    
    // Seções da página
    homeSection = document.getElementById('home-section');
    gameSection = document.getElementById('game-section');
    rankingSection = document.getElementById('ranking-section');
    themesSection = document.getElementById('themes-section');
    adminSection = document.getElementById('admin-section');
    progressSection = document.getElementById('progress-section');
    
    // Navegação
    const navHome = document.getElementById('nav-home');
    const navGame = document.getElementById('nav-game');
    const navRanking = document.getElementById('nav-ranking');
    const navThemes = document.getElementById('nav-themes');
    const navAdmin = document.getElementById('nav-admin');
    const navProgress = document.getElementById('nav-progress');
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
    
    // Checkbox "Lembrar-me"
    rememberMeCheckbox = document.getElementById('remember-me');
    
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
    
    // Modal de upload de imagem
    imageUploadModal = document.getElementById('image-upload-modal');
    imageUploadForm = document.getElementById('image-upload-form');
    imageFileInput = document.getElementById('image-file');
    useImageBtn = document.getElementById('use-image-btn');
    imagePreviewContainer = document.getElementById('image-preview-container');
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
    } else if (currentTheme.startsWith('custom-theme-')) {
        const themeId = currentTheme.replace('custom-theme-', '');
        const customTheme = savedCustomThemes.find(t => t.id === themeId);
        if (customTheme && customTheme.imageData) {
            board = [...customTheme.imageData];
        } else {
            board = [...themes['numbers'].items];
        }
    } else {
        board = [...themes[currentTheme].items];
    }
}

// Renderizar o tabuleiro com suporte a drag and drop
function renderBoard() {
    puzzleBoard.innerHTML = '';
    
    board.forEach((value, index) => {
        const tile = document.createElement('div');
        tile.className = `puzzle-tile`;
        
        // Adicionar classe específica do tema
        if (currentTheme === 'custom-image' || currentTheme.startsWith('custom-theme-')) {
            tile.classList.add('image-piece');
        } else {
            tile.classList.add(themes[currentTheme].className);
        }
        
        if (value === null) {
            tile.classList.add('empty');
            tile.textContent = '';
            emptyTileIndex = index;
        } else {
            // Verificar se é uma URL de imagem
            if (typeof value === 'string' && (value.startsWith('data:image') || value.startsWith('http'))) {
                tile.style.backgroundImage = `url(${value})`;
                tile.style.backgroundSize = 'cover';
                tile.style.backgroundPosition = 'center';
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
            } else if (currentTheme.startsWith('custom-theme-')) {
                const themeId = currentTheme.replace('custom-theme-', '');
                const customTheme = savedCustomThemes.find(t => t.id === themeId);
                correctValue = customTheme ? customTheme.imageData[index] : null;
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
    } else if (currentTheme.startsWith('custom-theme-')) {
        const themeId = currentTheme.replace('custom-theme-', '');
        const customTheme = savedCustomThemes.find(t => t.id === themeId);
        if (customTheme && customTheme.imageData) {
            board = [...customTheme.imageData];
        } else {
            board = [...themes['numbers'].items];
        }
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
        } else if (currentTheme.startsWith('custom-theme-')) {
            const themeId = currentTheme.replace('custom-theme-', '');
            const customTheme = savedCustomThemes.find(t => t.id === themeId);
            correctValue = customTheme ? customTheme.imageData[i] : null;
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
        } else if (currentTheme.startsWith('custom-theme-')) {
            const themeId = currentTheme.replace('custom-theme-', '');
            const customTheme = savedCustomThemes.find(t => t.id === themeId);
            correctValue = customTheme ? customTheme.imageData[i] : null;
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
            themeName: getThemeName(currentTheme),
            date: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Salvar no Firestore
        await db.collection('scores').add(scoreData);
        
        console.log("Pontuação salva automaticamente");
        
        // Atualizar estatísticas globais
        loadGlobalStats();
        
    } catch (error) {
        console.error("Erro ao salvar pontuação automaticamente:", error);
    }
}

// Obter nome do tema
function getThemeName(themeId) {
    if (themeId.startsWith('custom-theme-')) {
        const theme = savedCustomThemes.find(t => t.id === themeId.replace('custom-theme-', ''));
        return theme ? theme.name : 'Tema Personalizado';
    }
    return themes[themeId] ? themes[themeId].name : themeId;
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
    const solutionBoard = document.querySelector('.solution-board');
    if (!solutionBoard) return;
    
    solutionBoard.innerHTML = '';
    
    // Usar o tema atual para a solução
    if (currentTheme === 'custom-image' && customImageData) {
        // Criar solução para imagem personalizada
        solutionBoard.style.display = 'grid';
        solutionBoard.style.gridTemplateColumns = 'repeat(4, 1fr)';
        solutionBoard.style.gridTemplateRows = 'repeat(4, 1fr)';
        solutionBoard.style.gap = '4px';
        solutionBoard.style.width = '100%';
        solutionBoard.style.aspectRatio = '1 / 1';
        solutionBoard.style.background = '#f0f0f0';
        solutionBoard.style.padding = '4px';
        solutionBoard.style.borderRadius = '8px';
        
        customImageData.forEach((imageData, index) => {
            const tile = document.createElement('div');
            tile.style.backgroundImage = imageData ? `url(${imageData})` : 'none';
            tile.style.backgroundSize = 'cover';
            tile.style.backgroundPosition = 'center';
            tile.style.borderRadius = '6px';
            tile.style.backgroundColor = imageData ? 'transparent' : '#e0e0e0';
            solutionBoard.appendChild(tile);
        });
    } else if (currentTheme.startsWith('custom-theme-')) {
        const themeId = currentTheme.replace('custom-theme-', '');
        const customTheme = savedCustomThemes.find(t => t.id === themeId);
        if (customTheme && customTheme.imageData) {
            // Criar solução para tema salvo
            solutionBoard.style.display = 'grid';
            solutionBoard.style.gridTemplateColumns = 'repeat(4, 1fr)';
            solutionBoard.style.gridTemplateRows = 'repeat(4, 1fr)';
            solutionBoard.style.gap = '4px';
            solutionBoard.style.width = '100%';
            solutionBoard.style.aspectRatio = '1 / 1';
            solutionBoard.style.background = '#f0f0f0';
            solutionBoard.style.padding = '4px';
            solutionBoard.style.borderRadius = '8px';
            
            customTheme.imageData.forEach((imageData, index) => {
                const tile = document.createElement('div');
                tile.style.backgroundImage = imageData ? `url(${imageData})` : 'none';
                tile.style.backgroundSize = 'cover';
                tile.style.backgroundPosition = 'center';
                tile.style.borderRadius = '6px';
                tile.style.backgroundColor = imageData ? 'transparent' : '#e0e0e0';
                solutionBoard.appendChild(tile);
            });
        } else {
            // Usar tema padrão
            const currentThemeData = themes[currentTheme] || themes['numbers'];
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
    } else {
        // Usar tema padrão
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
    
    // Temas
    if (themeCards) {
        themeCards.forEach(card => {
            card.addEventListener('click', function() {
                const theme = this.dataset.theme;
                if (theme === 'custom-image') {
                    // Abrir modal para upload de imagem
                    openImageUploadModal();
                } else if (theme.startsWith('custom-theme-')) {
                    changeTheme(theme);
                } else {
                    changeTheme(theme);
                }
            });
        });
    }
    
    // Navegação
    const navHome = document.getElementById('nav-home');
    const navGame = document.getElementById('nav-game');
    const navRanking = document.getElementById('nav-ranking');
    const navThemes = document.getElementById('nav-themes');
    const navAdmin = document.getElementById('nav-admin');
    const navProgress = document.getElementById('nav-progress');
    
    if (navHome) navHome.addEventListener('click', () => showSection('home-section'));
    if (navGame) navGame.addEventListener('click', () => {
        showSection('game-section');
        resetGame();
    });
    if (navRanking) navRanking.addEventListener('click', () => {
        showSection('ranking-section');
        loadRanking();
    });
    if (navThemes) navThemes.addEventListener('click', () => {
        showSection('themes-section');
        loadCustomThemes();
    });
    if (navAdmin) navAdmin.addEventListener('click', () => {
        showSection('admin-section');
        loadAdminUsers();
    });
    if (navProgress) navProgress.addEventListener('click', () => {
        showSection('progress-section');
        loadUserProgress();
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
    
    if (adminScoreDifficulty) adminScoreDifficulty.addEventListener('change', loadAdminScores);
    if (adminScoreTheme) adminScoreTheme.addEventListener('change', loadAdminScores);
    if (adminScoreDate) adminScoreDate.addEventListener('change', loadAdminScores);
    if (userSearch) userSearch.addEventListener('input', loadAdminUsers);
    if (clearScoresBtn) clearScoresBtn.addEventListener('click', clearOldScores);
    
    // Upload de imagem
    if (imageUploadForm) {
        imageUploadForm.addEventListener('submit', handleImageUpload);
    }
    
    if (useImageBtn) {
        useImageBtn.addEventListener('click', useCustomImage);
    }
    
    // Embaralhar o tabuleiro inicialmente
    shuffleBoard();
}

// Abrir modal de upload de imagem
function openImageUploadModal() {
    imageUploadModal.style.display = 'flex';
    imagePreviewContainer.style.display = 'none';
    imageUploadForm.reset();
    
    // Verificar se é administrador
    if (currentUser) {
        checkIfUserIsAdmin(currentUser.uid).then(isAdmin => {
            if (isAdmin) {
                // Adicionar campo para nome do tema
                const themeNameField = document.getElementById('theme-name-field');
                if (!themeNameField) {
                    const formGroup = document.createElement('div');
                    formGroup.className = 'form-group';
                    formGroup.id = 'theme-name-field';
                    formGroup.innerHTML = `
                        <label for="theme-name">Nome do Tema (para salvar)</label>
                        <input type="text" id="theme-name" placeholder="Digite um nome para salvar este tema">
                        <small class="form-hint">Deixe em branco para usar apenas nesta sessão</small>
                    `;
                    imageUploadForm.insertBefore(formGroup, imageUploadForm.querySelector('.form-group button'));
                }
                
                // Adicionar checkbox para salvar tema
                const saveThemeField = document.getElementById('save-theme-field');
                if (!saveThemeField) {
                    const formGroup = document.createElement('div');
                    formGroup.className = 'form-group';
                    formGroup.id = 'save-theme-field';
                    formGroup.innerHTML = `
                        <label>
                            <input type="checkbox" id="save-theme-checkbox"> Salvar este tema para todos os usuários
                        </label>
                    `;
                    imageUploadForm.insertBefore(formGroup, imageUploadForm.querySelector('.form-group button'));
                }
            } else {
                // Remover campos de administrador se existirem
                const themeNameField = document.getElementById('theme-name-field');
                const saveThemeField = document.getElementById('save-theme-field');
                if (themeNameField) themeNameField.remove();
                if (saveThemeField) saveThemeField.remove();
            }
        });
    } else {
        // Remover campos de administrador se existirem
        const themeNameField = document.getElementById('theme-name-field');
        const saveThemeField = document.getElementById('save-theme-field');
        if (themeNameField) themeNameField.remove();
        if (saveThemeField) saveThemeField.remove();
    }
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
        document.getElementById('current-theme').textContent = getThemeName(currentTheme);
    } else if (sectionId === 'ranking-section') {
        document.getElementById('nav-ranking').classList.add('active');
    } else if (sectionId === 'themes-section') {
        document.getElementById('nav-themes').classList.add('active');
    } else if (sectionId === 'admin-section') {
        document.getElementById('nav-admin').classList.add('active');
    } else if (sectionId === 'progress-section') {
        document.getElementById('nav-progress').classList.add('active');
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

// Mostrar modal de instruções
function showInstructionsModal() {
    instructionsModal.style.display = 'flex';
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
            const isAdmin = await checkIfUserIsAdmin(user.uid);
            updateUIForAdmin(isAdmin);
            
            // Carregar dados do usuário
            await loadUserData(user.uid);
            
            // Carregar temas personalizados salvos
            loadSavedCustomThemes();
        } else if (!isGuest) {
            // Usuário não está logado e não é visitante
            currentUser = null;
            
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
    
    // Mostrar link para progresso
    const navProgress = document.getElementById('nav-progress');
    if (navProgress) {
        navProgress.parentElement.style.display = 'list-item';
    }
}

// Atualizar UI para usuário não logado
function updateUIForLoggedOutUser() {
    // Mostrar botões de autenticação
    if (userInfoContainer) userInfoContainer.style.display = 'none';
    if (authButtons) authButtons.style.display = 'flex';
    
    // Esconder link para admin
    if (adminNavItem) adminNavItem.style.display = 'none';
    
    // Esconder link para progresso
    const navProgress = document.getElementById('nav-progress');
    if (navProgress) {
        navProgress.parentElement.style.display = 'none';
    }
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
function updateUIForAdmin(isAdmin) {
    if (adminNavItem) {
        adminNavItem.style.display = isAdmin ? 'block' : 'none';
    }
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
        
        // Verificar se já existe um administrador
        const adminExists = await checkAdminExists();
        const userRole = adminExists ? 'player' : 'admin';
        
        const userData = {
            uid: uid,
            email: user.email,
            name: user.displayName || user.email.split('@')[0],
            role: userRole,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'active'
        };
        
        await db.collection('users').doc(uid).set(userData);
        console.log("Documento do usuário criado com sucesso. Role:", userRole);
        
        // Atualizar interface se for o primeiro admin
        if (!adminExists && userRole === 'admin') {
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
    const messageElement = document.getElementById('login-message');
    const rememberMe = document.getElementById('remember-me') ? document.getElementById('remember-me').checked : false;
    
    // Validar entrada
    if (!email || !password) {
        showFormMessage(messageElement, 'Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    try {
        showFormMessage(messageElement, 'Entrando...', 'info');
        
        // Configurar persistência
        const persistence = rememberMe ? 
            firebase.auth.Auth.Persistence.LOCAL : 
            firebase.auth.Auth.Persistence.SESSION;
        
        await auth.setPersistence(persistence);
        
        // Fazer login com Firebase Auth
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Salvar credenciais se "Lembrar-me" estiver marcado
        if (rememberMe) {
            localStorage.setItem('rememberedUser', JSON.stringify({
                email: email,
                password: password
            }));
        } else {
            localStorage.removeItem('rememberedUser');
        }
        
        // Atualizar último login no Firestore
        await db.collection('users').doc(user.uid).update({
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
        
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
    const roleSelect = document.getElementById('register-role');
    
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
        
        // Verificar se já existe um administrador
        const adminExists = await checkAdminExists();
        
        // Determinar a função do usuário
        let userRole = 'player';
        if (roleSelect && roleSelect.value === 'admin' && !adminExists) {
            userRole = 'admin';
        } else if (roleSelect && roleSelect.value === 'admin' && adminExists) {
            showFormMessage(messageElement, 'Apenas o primeiro usuário pode ser administrador. Sua conta será criada como jogador.', 'warning');
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
            role: userRole,
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
        // Limpar credenciais salvas
        localStorage.removeItem('rememberedUser');
        
        await auth.signOut();
        console.log("Usuário deslogado com sucesso");
        
        // Redirecionar para a página inicial
        showSection('home-section');
        isGuest = false;
        
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
    if (theme.startsWith('custom-theme-')) {
        const themeId = theme.replace('custom-theme-', '');
        const customTheme = savedCustomThemes.find(t => t.id === themeId);
        if (customTheme) {
            currentTheme = theme;
            customImageData = customTheme.imageData;
            customImageName = customTheme.name;
            
            // Atualizar nome do tema na interface
            document.getElementById('current-theme').textContent = customTheme.name;
            
            // Recriar o tabuleiro com o novo tema
            createBoard();
            renderBoard();
            createSolutionBoard();
            
            // Se estiver na seção de temas, voltar para o jogo
            if (themesSection.classList.contains('active')) {
                showSection('game-section');
            }
            
            return;
        }
    } else if (!themes[theme] && theme !== 'custom-image') return;
    
    // Atualizar cards de tema
    themeCards.forEach(card => {
        card.classList.remove('active');
        if (card.dataset.theme === theme) {
            card.classList.add('active');
        }
    });
    
    currentTheme = theme;
    
    // Limpar imagem personalizada se não for tema personalizado
    if (theme !== 'custom-image' && !theme.startsWith('custom-theme-')) {
        customImageData = null;
        customImageName = null;
    }
    
    // Atualizar nome do tema na interface
    document.getElementById('current-theme').textContent = getThemeName(theme);
    
    // Recriar o tabuleiro com o novo tema
    createBoard();
    renderBoard();
    createSolutionBoard();
    
    // Se estiver na seção de temas, voltar para o jogo
    if (themesSection.classList.contains('active')) {
        showSection('game-section');
    }
}

// Manipular upload de imagem
function handleImageUpload(e) {
    e.preventDefault();
    
    const file = imageFileInput.files[0];
    const messageElement = document.getElementById('image-upload-message');
    const previewBoard = document.getElementById('image-preview-board');
    
    if (!file) {
        showFormMessage(messageElement, 'Por favor, selecione uma imagem.', 'error');
        return;
    }
    
    // Verificar se é uma imagem
    if (!file.type.match('image.*')) {
        showFormMessage(messageElement, 'Por favor, selecione um arquivo de imagem.', 'error');
        return;
    }
    
    showFormMessage(messageElement, 'Processando imagem...', 'info');
    
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
                    const dataUrl = pieceCanvas.toDataURL('image/jpeg', 0.8);
                    
                    // Adicionar ao array (a última peça será null para o espaço vazio)
                    if (row === 3 && col === 3) {
                        imagePieces.push(null);
                    } else {
                        imagePieces.push(dataUrl);
                        
                        // Criar elemento de pré-visualização
                        const pieceElement = document.createElement('div');
                        pieceElement.className = 'puzzle-tile image-piece';
                        pieceElement.style.backgroundImage = `url(${dataUrl})`;
                        pieceElement.style.backgroundSize = 'cover';
                        pieceElement.style.backgroundPosition = 'center';
                        previewBoard.appendChild(pieceElement);
                    }
                }
            }
            
            // Armazenar os dados da imagem
            customImageData = imagePieces;
            
            // Mostrar preview
            imagePreviewContainer.style.display = 'block';
            
            showFormMessage(messageElement, 'Imagem processada com sucesso!', 'success');
        };
        
        img.src = event.target.result;
    };
    
    reader.readAsDataURL(file);
}

// Usar imagem personalizada
function useCustomImage() {
    if (!customImageData) {
        alert('Por favor, faça upload de uma imagem primeiro.');
        return;
    }
    
    // Verificar se é administrador e se quer salvar o tema
    const isAdmin = currentUser ? await checkIfUserIsAdmin(currentUser.uid) : false;
    const saveThemeCheckbox = document.getElementById('save-theme-checkbox');
    const themeNameInput = document.getElementById('theme-name');
    
    if (isAdmin && saveThemeCheckbox && saveThemeCheckbox.checked && themeNameInput && themeNameInput.value.trim()) {
        // Salvar tema personalizado
        const themeName = themeNameInput.value.trim();
        await saveCustomTheme(themeName, customImageData);
    } else if (isAdmin && saveThemeCheckbox && saveThemeCheckbox.checked && (!themeNameInput || !themeNameInput.value.trim())) {
        alert('Por favor, informe um nome para o tema.');
        return;
    }
    
    // Fechar modal
    imageUploadModal.style.display = 'none';
    
    // Mudar para o tema de imagem personalizada
    if (isAdmin && saveThemeCheckbox && saveThemeCheckbox.checked) {
        // Carregar temas atualizados
        await loadSavedCustomThemes();
        
        // Encontrar o tema recém-criado
        const latestTheme = savedCustomThemes[savedCustomThemes.length - 1];
        if (latestTheme) {
            changeTheme(`custom-theme-${latestTheme.id}`);
        }
    } else {
        changeTheme('custom-image');
    }
    
    // Limpar formulário
    imageUploadForm.reset();
    imagePreviewContainer.style.display = 'none';
    clearFormMessage(document.getElementById('image-upload-message'));
}

// Salvar tema personalizado
async function saveCustomTheme(name, imageData) {
    try {
        if (!currentUser) {
            alert('Você precisa estar logado para salvar um tema.');
            return;
        }
        
        // Verificar se é administrador
        const isAdmin = await checkIfUserIsAdmin(currentUser.uid);
        if (!isAdmin) {
            alert('Apenas administradores podem salvar temas personalizados.');
            return;
        }
        
        // Criar documento do tema
        const themeData = {
            name: name,
            imageData: imageData,
            createdBy: currentUser.uid,
            createdByName: currentUser.displayName || currentUser.email.split('@')[0],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            isPublic: true
        };
        
        await db.collection('customThemes').add(themeData);
        
        console.log("Tema personalizado salvo com sucesso");
        
    } catch (error) {
        console.error("Erro ao salvar tema personalizado:", error);
        alert('Erro ao salvar tema. Tente novamente.');
    }
}

// Carregar temas personalizados salvos
async function loadSavedCustomThemes() {
    try {
        const snapshot = await db.collection('customThemes')
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();
        
        savedCustomThemes = [];
        snapshot.forEach(doc => {
            savedCustomThemes.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log("Temas personalizados carregados:", savedCustomThemes.length);
        
    } catch (error) {
        console.error("Erro ao carregar temas personalizados:", error);
    }
}

// Carregar temas personalizados na interface
async function loadCustomThemes() {
    await loadSavedCustomThemes();
    
    const themesGrid = document.querySelector('.themes-grid');
    if (!themesGrid) return;
    
    // Remover temas personalizados existentes
    const existingCustomThemes = themesGrid.querySelectorAll('[data-theme^="custom-theme-"]');
    existingCustomThemes.forEach(theme => theme.remove());
    
    // Adicionar temas personalizados
    savedCustomThemes.forEach(theme => {
        const themeCard = document.createElement('div');
        themeCard.className = 'theme-card';
        themeCard.dataset.theme = `custom-theme-${theme.id}`;
        
        // Verificar se é o tema atual
        if (currentTheme === `custom-theme-${theme.id}`) {
            themeCard.classList.add('active');
        }
        
        // Criar preview da primeira peça da imagem
        const previewImage = theme.imageData && theme.imageData[0] ? theme.imageData[0] : '';
        
        themeCard.innerHTML = `
            <div class="theme-preview">
                <div class="theme-example" style="background-image: url('${previewImage}'); background-size: cover; background-position: center; width: 100%; height: 100%;"></div>
            </div>
            <div class="theme-info">
                <h3>${theme.name}</h3>
                <p>Criado por: ${theme.createdByName}</p>
            </div>
        `;
        
        // Adicionar badge se for administrador
        if (currentUser) {
            checkIfUserIsAdmin(currentUser.uid).then(isAdmin => {
                if (isAdmin) {
                    const badge = document.createElement('div');
                    badge.className = 'theme-badge';
                    badge.innerHTML = `<i class="fas fa-edit"></i> Editar`;
                    badge.style.cursor = 'pointer';
                    badge.onclick = (e) => {
                        e.stopPropagation();
                        openEditCustomThemeModal(theme.id, theme.name);
                    };
                    
                    const deleteBadge = document.createElement('div');
                    deleteBadge.className = 'theme-badge';
                    deleteBadge.innerHTML = `<i class="fas fa-trash"></i> Excluir`;
                    deleteBadge.style.cursor = 'pointer';
                    deleteBadge.style.backgroundColor = 'var(--danger-color)';
                    deleteBadge.style.marginTop = '5px';
                    deleteBadge.onclick = (e) => {
                        e.stopPropagation();
                        deleteCustomTheme(theme.id);
                    };
                    
                    const actionsDiv = document.createElement('div');
                    actionsDiv.style.position = 'absolute';
                    actionsDiv.style.top = '10px';
                    actionsDiv.style.right = '10px';
                    actionsDiv.appendChild(badge);
                    actionsDiv.appendChild(deleteBadge);
                    
                    themeCard.appendChild(actionsDiv);
                }
            });
        }
        
        // Adicionar event listener
        themeCard.addEventListener('click', function() {
            changeTheme(`custom-theme-${theme.id}`);
        });
        
        themesGrid.appendChild(themeCard);
    });
}

// Abrir modal para editar tema personalizado
function openEditCustomThemeModal(themeId, currentName) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-edit"></i> Editar Tema</h2>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
                <form id="edit-theme-form">
                    <div class="form-group">
                        <label for="edit-theme-name">Nome do Tema</label>
                        <input type="text" id="edit-theme-name" value="${currentName}" required>
                    </div>
                    <div class="form-group">
                        <button type="submit" class="btn btn-primary btn-block">
                            <i class="fas fa-save"></i> Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Fechar modal
    modal.querySelector('.close-modal').onclick = () => modal.remove();
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    // Submeter formulário
    modal.querySelector('#edit-theme-form').onsubmit = async (e) => {
        e.preventDefault();
        const newName = modal.querySelector('#edit-theme-name').value;
        await updateCustomTheme(themeId, newName);
        modal.remove();
    };
}

// Atualizar tema personalizado
async function updateCustomTheme(themeId, newName) {
    try {
        await db.collection('customThemes').doc(themeId).update({
            name: newName,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Recarregar temas
        await loadSavedCustomThemes();
        loadCustomThemes();
        
        alert('Tema atualizado com sucesso!');
        
    } catch (error) {
        console.error("Erro ao atualizar tema:", error);
        alert('Erro ao atualizar tema. Tente novamente.');
    }
}

// Excluir tema personalizado
async function deleteCustomTheme(themeId) {
    if (!confirm('Tem certeza que deseja excluir este tema?')) {
        return;
    }
    
    try {
        await db.collection('customThemes').doc(themeId).delete();
        
        // Recarregar temas
        await loadSavedCustomThemes();
        loadCustomThemes();
        
        // Se o tema atual foi excluído, mudar para tema padrão
        if (currentTheme === `custom-theme-${themeId}`) {
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
            query = query.where('theme', '==', theme);
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
                // Garantir que a data seja um objeto Date
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
                        <div class="ranking-email">${formattedDate} • ${getDifficultyText(score.difficulty)} • ${score.themeName || getThemeName(score.theme)}</div>
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

// Carregar progresso do usuário
async function loadUserProgress() {
    if (!currentUser) {
        const progressSection = document.getElementById('progress-section');
        if (progressSection) {
            progressSection.innerHTML = `
                <div class="section-header">
                    <h2><i class="fas fa-chart-line"></i> Meu Progresso</h2>
                    <p>Faça login para ver suas estatísticas</p>
                </div>
            `;
        }
        return;
    }
    
    try {
        // Carregar pontuações do usuário
        const userScoresSnapshot = await db.collection('scores')
            .where('userId', '==', currentUser.uid)
            .orderBy('date', 'desc')
            .limit(100)
            .get();
        
        const userScores = [];
        userScoresSnapshot.forEach(doc => {
            const data = doc.data();
            userScores.push({
                id: doc.id,
                ...data,
                date: data.date && data.date.toDate ? data.date.toDate() : new Date()
            });
        });
        
        // Calcular estatísticas
        const totalGames = userScores.length;
        const totalMoves = userScores.reduce((sum, score) => sum + score.moves, 0);
        const totalTime = userScores.reduce((sum, score) => sum + score.time, 0);
        const avgMoves = totalGames > 0 ? Math.round(totalMoves / totalGames) : 0;
        const avgTime = totalGames > 0 ? Math.round(totalTime / totalGames) : 0;
        
        // Encontrar melhor pontuação
        let bestScore = null;
        if (userScores.length > 0) {
            bestScore = userScores.reduce((best, current) => {
                if (current.moves < best.moves || (current.moves === best.moves && current.time < best.time)) {
                    return current;
                }
                return best;
            });
        }
        
        // Atualizar interface
        const progressSection = document.getElementById('progress-section');
        if (progressSection) {
            progressSection.innerHTML = `
                <div class="section-header">
                    <h2><i class="fas fa-chart-line"></i> Meu Progresso</h2>
                    <p>Estatísticas das suas partidas</p>
                </div>
                
                <div class="stats-section">
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
                            <div class="stat-value">${bestScore ? bestScore.moves : 0}</div>
                            <div class="stat-label">Melhor (movimentos)</div>
                        </div>
                    </div>
                </div>
                
                <div class="recent-games">
                    <h3><i class="fas fa-history"></i> Partidas Recentes</h3>
                    <div class="scores-list">
                        ${userScores.length > 0 ? 
                            userScores.map(score => `
                                <div class="score-item">
                                    <div class="score-date">${score.date.toLocaleDateString('pt-BR')} ${score.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                                    <div class="score-info">
                                        <span class="score-difficulty">${getDifficultyText(score.difficulty)}</span>
                                        <span class="score-theme">${score.themeName || getThemeName(score.theme)}</span>
                                    </div>
                                    <div class="score-details">
                                        <span>${score.moves} movimentos</span>
                                        <span>${formatTime(score.time)}</span>
                                    </div>
                                </div>
                            `).join('') : 
                            '<p class="no-scores">Nenhuma partida encontrada.</p>'
                        }
                    </div>
                </div>
            `;
        }
        
    } catch (error) {
        console.error("Erro ao carregar progresso do usuário:", error);
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
        const isAdmin = await checkIfUserIsAdmin(currentUser.uid);
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
                            <button class="btn btn-danger btn-icon delete-user-btn" data-user-id="${user.id}">
                                <i class="fas fa-trash"></i>
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
                
                // Adicionar event listeners aos botões de exclusão
                const deleteButtons = document.querySelectorAll('.delete-user-btn');
                deleteButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        const userId = this.dataset.userId;
                        deleteUser(userId);
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
        
        // Atualizar senha se fornecida
        if (password && password.length >= 6) {
            // Nota: Para atualizar a senha no Firebase Auth, é necessário reautenticação
            // ou uso do Admin SDK. Vamos apenas atualizar no Firestore por enquanto.
            showFormMessage(messageElement, 'Para alterar a senha, use a opção de recuperação de senha.', 'warning');
        }
        
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

// Excluir usuário
async function deleteUser(userId) {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        // Verificar se é o próprio usuário
        if (currentUser && userId === currentUser.uid) {
            alert('Você não pode excluir sua própria conta.');
            return;
        }
        
        // Excluir do Firestore
        await db.collection('users').doc(userId).delete();
        
        // Excluir pontuações do usuário
        const scoresSnapshot = await db.collection('scores').where('userId', '==', userId).get();
        const batch = db.batch();
        scoresSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        
        alert('Usuário excluído com sucesso!');
        
        // Recarregar lista de usuários
        loadAdminUsers();
        
    } catch (error) {
        console.error("Erro ao excluir usuário:", error);
        alert('Erro ao excluir usuário. Tente novamente.');
    }
}

// Carregar pontuações para administração
async function loadAdminScores() {
    const loadingElement = document.getElementById('admin-scores-loading');
    const scoresListElement = document.getElementById('admin-scores-list');
    
    if (!currentUser) return;
    
    // Verificar se o usuário atual é administrador
    const isAdmin = await checkIfUserIsAdmin(currentUser.uid);
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
            query = query.where('theme', '==', theme);
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
                            <span class="score-difficulty">${getDifficultyText(score.difficulty)} • ${score.themeName || getThemeName(score.theme)}</span>
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
        const isAdmin = await checkIfUserIsAdmin(currentUser.uid);
        if (!isAdmin) {
            showFormMessage(messageElement, 'Apenas administradores podem criar novas contas.', 'error');
            return;
        }
        
        // Verificar se já existe um administrador master
        const adminExists = await checkAdminExists();
        if (role === 'admin' && adminExists) {
            // Verificar se o administrador atual é o primeiro (master)
            const currentUserDoc = await db.collection('users').doc(currentUser.uid).get();
            const currentUserData = currentUserDoc.data();
            
            // Buscar o primeiro administrador criado
            const firstAdminSnapshot = await db.collection('users')
                .where('role', '==', 'admin')
                .orderBy('createdAt')
                .limit(1)
                .get();
            
            let isMasterAdmin = false;
            firstAdminSnapshot.forEach(doc => {
                if (doc.id === currentUser.uid) {
                    isMasterAdmin = true;
                }
            });
            
            if (!isMasterAdmin) {
                showFormMessage(messageElement, 'Apenas o administrador master pode criar novos administradores.', 'error');
                return;
            }
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
