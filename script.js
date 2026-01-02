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
let isMasterAdmin = false;
let rememberMe = false;

// Elementos do DOM
let welcomeScreen, mainApp;
let puzzleBoard, moveCounter, timerElement, shuffleBtn, solveBtn, resetBtn, hintBtn;
let playAgainBtn, completionMessage, finalMoves, finalTime;
let difficultyBtns, authModal, loginBtn, registerBtn, logoutBtn, userInfo, userName;
let adminNavItem, homeSection, gameSection, rankingSection, themesSection, progressSection, adminSection;
let rankingList, userScoresList, usersList, adminScoresList;
let loginForm, registerForm, resetForm, adminRegisterForm, editUserForm;
let authButtons, userInfoContainer, dbStatus;
let playGuestBtn, welcomeLoginBtn, welcomeRegisterBtn, quickPlayBtn;
let heroPlayBtn, heroHowtoBtn, changeThemeBtn;
let instructionsModal, startPlayingBtn;
let imageUploadModal, imageUploadForm, imageFileInput, useImageBtn, imagePreviewContainer;
let themeEditorModal, themeEditorForm, themeNameInput, themeDescriptionInput, themeImageFileInput;
let progressCharts, recentScoresList;
let themesGrid, themesAdminList;

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

// Temas disponíveis
const themes = {
    numbers: {
        name: "Números",
        items: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', null],
        className: 'number',
        solutionText: "1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15",
        isCustom: false
    },
    words: {
        name: "Palavras",
        items: ['M', 'A', 'T', 'O', 'A', 'T', 'A', 'R', 'C', 'U', 'C', 'A', 'A', 'M', 'O', null],
        className: 'word',
        solutionText: "M A T O\nA T A R\nC U C A\nA M O",
        isCustom: false
    },
    animals: {
        name: "Animais",
        items: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', null],
        className: 'emoji',
        solutionText: "🐶 🐱 🐭 🐹\n🐰 🦊 🐻 🐼\n🐨 🦁 🐮 🐷\n🐸 🐵 🐔",
        isCustom: false
    },
    fruits: {
        name: "Frutas",
        items: ['🍎', '🍌', '🍇', '🍓', '🍉', '🍊', '🍑', '🍍', '🥭', '🍒', '🥝', '🍏', '🥥', '🍈', '🫐', null],
        className: 'emoji',
        solutionText: "🍎 🍌 🍇 🍓\n🍉 🍊 🍑 🍍\n🥭 🍒 🥝 🍏\n🥥 🍈 🫐",
        isCustom: false
    },
    flags: {
        name: "Bandeiras",
        items: ['🇧🇷', '🇺🇸', '🇨🇳', '🇯🇵', '🇩🇪', '🇫🇷', '🇮🇹', '🇪🇸', '🇬🇧', '🇨🇦', '🇦🇺', '🇰🇷', '🇦🇷', '🇲🇽', '🇵🇹', null],
        className: 'emoji',
        solutionText: "🇧🇷 🇺🇸 🇨🇳 🇯🇵\n🇩🇪 🇫🇷 🇮🇹 🇪🇸\n🇬🇧 🇨🇦 🇦🇺 🇰🇷\n🇦🇷 🇲🇽 🇵🇹",
        isCustom: false
    },
    emoji: {
        name: "Emojis",
        items: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '😍', '😘', '😋', '😜', '🤪', null],
        className: 'emoji',
        solutionText: "😀 😃 😄 😁\n😆 😅 😂 🤣\n😊 😇 😍 😘\n😋 😜 🤪",
        isCustom: false
    }
};

// Temas personalizados (carregados do Firebase)
let customThemes = {};

// Variáveis para gráficos
let difficultyChart = null;
let themeChart = null;
let gamesPerDayChart = null;
let usersDistributionChart = null;

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
    
    // Carregar temas personalizados
    loadCustomThemes();
    
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
        
        // Atualizar opção de cadastro de admin
        updateAdminRegistrationOption();
    } catch (error) {
        console.error("Erro ao verificar administrador:", error);
    }
}

// Atualizar opção de cadastro de administrador
function updateAdminRegistrationOption() {
    const adminRoleOption = document.getElementById('admin-role-option');
    const registerRoleGroup = document.getElementById('register-role-group');
    const registerRoleSelect = document.getElementById('register-role');
    
    if (adminRoleOption) {
        if (adminUserExists) {
            adminRoleOption.disabled = true;
            adminRoleOption.title = "Já existe um administrador no sistema";
        } else {
            adminRoleOption.disabled = false;
            adminRoleOption.title = "";
        }
    }
    
    if (registerRoleGroup && registerRoleSelect) {
        if (adminUserExists) {
            // Remover opção de admin do cadastro público
            registerRoleSelect.innerHTML = '<option value="player">Jogador</option>';
        } else {
            // Manter opção de admin no cadastro público
            registerRoleSelect.innerHTML = `
                <option value="player">Jogador</option>
                <option value="admin">Administrador</option>
            `;
        }
    }
}

// Verificar se há usuário lembrado
function checkRememberedUser() {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const rememberedPassword = localStorage.getItem('rememberedPassword');
    
    if (rememberedEmail && rememberedPassword) {
        document.getElementById('login-email').value = rememberedEmail;
        document.getElementById('login-password').value = rememberedPassword;
        document.getElementById('remember-me').checked = true;
        rememberMe = true;
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
    themesSection = document.getElementById('themes-section');
    progressSection = document.getElementById('progress-section');
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
    themesAdminList = document.getElementById('themes-admin-list');
    
    // Elementos de temas
    themesGrid = document.getElementById('themes-grid');
    
    // Elementos de progresso
    progressCharts = document.querySelector('.progress-charts');
    recentScoresList = document.getElementById('recent-scores-list');
    
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
    
    // Modal de editor de tema
    themeEditorModal = document.getElementById('theme-editor-modal');
    themeEditorForm = document.getElementById('theme-editor-form');
    themeNameInput = document.getElementById('theme-name');
    themeDescriptionInput = document.getElementById('theme-description');
    themeImageFileInput = document.getElementById('theme-image-file');
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
    if (currentTheme.startsWith('custom-') && customThemes[currentTheme]) {
        // Tema personalizado salvo
        const themeData = customThemes[currentTheme];
        board = themeData.items.map(item => item);
        customImageData = themeData.items;
        customImageName = themeData.name;
    } else if (currentTheme === 'custom-image' && customImageData) {
        // Imagem temporária do usuário comum
        board = [...customImageData];
    } else {
        // Tema padrão
        board = [...themes[currentTheme].items];
        customImageData = null;
        customImageName = null;
    }
}

// Renderizar o tabuleiro com suporte a drag and drop
function renderBoard() {
    puzzleBoard.innerHTML = '';
    
    board.forEach((value, index) => {
        const tile = document.createElement('div');
        
        if (currentTheme.startsWith('custom-') || currentTheme === 'custom-image') {
            tile.className = `puzzle-tile image-piece`;
        } else {
            tile.className = `puzzle-tile ${themes[currentTheme].className}`;
        }
        
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
            if (currentTheme.startsWith('custom-') && customThemes[currentTheme]) {
                correctValue = customThemes[currentTheme].items[index];
            } else if (currentTheme === 'custom-image' && customImageData) {
                correctValue = customImageData[index];
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
    if (currentTheme.startsWith('custom-') && customThemes[currentTheme]) {
        board = customThemes[currentTheme].items.map(item => item);
    } else if (currentTheme === 'custom-image' && customImageData) {
        board = [...customImageData];
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
        if (currentTheme.startsWith('custom-') && customThemes[currentTheme]) {
            correctValue = customThemes[currentTheme].items[i];
        } else if (currentTheme === 'custom-image' && customImageData) {
            correctValue = customImageData[i];
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
        if (currentTheme.startsWith('custom-') && customThemes[currentTheme]) {
            correctValue = customThemes[currentTheme].items[i];
        } else if (currentTheme === 'custom-image' && customImageData) {
            correctValue = customImageData[i];
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
            themeName: customImageName || themes[currentTheme]?.name || currentTheme,
            date: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Salvar no Firestore
        await db.collection('scores').add(scoreData);
        
        console.log("Pontuação salva automaticamente");
        
        // Atualizar estatísticas globais
        loadGlobalStats();
        
        // Atualizar estatísticas do usuário
        if (progressSection.classList.contains('active')) {
            loadUserProgress();
        }
        
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
    
    // Limpar estilos anteriores
    solutionBoard.style.gridTemplateColumns = 'repeat(4, 1fr)';
    solutionBoard.style.gridTemplateRows = 'repeat(4, 1fr)';
    solutionBoard.style.gap = '4px';
    solutionBoard.style.padding = '4px';
    solutionBoard.style.backgroundColor = 'white';
    solutionBoard.style.borderRadius = '6px';
    
    if (currentTheme.startsWith('custom-') && customThemes[currentTheme]) {
        // Tema personalizado salvo - mostrar imagem completa
        const themeData = customThemes[currentTheme];
        
        // Criar uma peça grande com a imagem completa
        const fullImage = document.createElement('div');
        fullImage.className = 'solution-full-image';
        fullImage.style.backgroundImage = `url(${themeData.fullImage})`;
        fullImage.style.backgroundSize = 'cover';
        fullImage.style.backgroundPosition = 'center';
        fullImage.style.width = '100%';
        fullImage.style.height = '200px';
        fullImage.style.borderRadius = '6px';
        fullImage.style.marginBottom = '10px';
        
        solutionBoard.appendChild(fullImage);
        
        // Adicionar nome do tema
        const themeName = document.createElement('div');
        themeName.textContent = themeData.name;
        themeName.style.textAlign = 'center';
        themeName.style.fontWeight = 'bold';
        themeName.style.color = 'var(--primary-color)';
        themeName.style.marginTop = '5px';
        
        solutionBoard.appendChild(themeName);
        
    } else if (currentTheme === 'custom-image' && customImageData) {
        // Imagem temporária - mostrar imagem completa reconstruída
        solutionBoard.style.display = 'grid';
        
        // Reconstruir a imagem completa a partir das peças
        const fullImage = document.createElement('canvas');
        const ctx = fullImage.getContext('2d');
        
        // Supor que cada peça é de 100x100px
        fullImage.width = 400;
        fullImage.height = 400;
        
        // Para simplificar, vamos mostrar as peças em ordem
        for (let i = 0; i < 16; i++) {
            const tile = document.createElement('div');
            tile.className = 'solution-tile';
            tile.style.backgroundImage = customImageData[i] ? `url(${customImageData[i]})` : 'none';
            tile.style.backgroundSize = 'cover';
            tile.style.backgroundPosition = 'center';
            solutionBoard.appendChild(tile);
        }
        
    } else {
        // Tema padrão - mostrar texto da solução
        solutionBoard.style.display = 'flex';
        solutionBoard.style.flexDirection = 'column';
        solutionBoard.style.justifyContent = 'center';
        solutionBoard.style.alignItems = 'center';
        solutionBoard.style.padding = '15px';
        
        const currentThemeData = themes[currentTheme];
        const solutionText = currentThemeData.solutionText;
        
        // Dividir o texto da solução em linhas
        const lines = solutionText.split('\n');
        
        lines.forEach(line => {
            const lineDiv = document.createElement('div');
            lineDiv.style.fontSize = currentTheme === 'numbers' ? '1.1rem' : '1.4rem';
            lineDiv.style.fontWeight = '700';
            lineDiv.style.color = 'var(--primary-color)';
            lineDiv.style.margin = '2px 0';
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
    const navThemes = document.getElementById('nav-themes');
    const navProgress = document.getElementById('nav-progress');
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
    if (navThemes) navThemes.addEventListener('click', () => {
        showSection('themes-section');
        loadThemes();
    });
    if (navProgress) navProgress.addEventListener('click', () => {
        showSection('progress-section');
        loadUserProgress();
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
    
    // Upload de imagem para usuários comuns
    if (imageUploadForm) {
        imageUploadForm.addEventListener('submit', handleImageUpload);
    }
    
    if (useImageBtn) {
        useImageBtn.addEventListener('click', useCustomImage);
    }
    
    // Editor de tema para administradores
    if (themeEditorForm) {
        themeEditorForm.addEventListener('submit', handleThemeEditor);
    }
    
    if (themeImageFileInput) {
        themeImageFileInput.addEventListener('change', handleThemeImagePreview);
    }
    
    // Botão de criar tema
    const createThemeBtn = document.getElementById('create-theme-btn');
    if (createThemeBtn) {
        createThemeBtn.addEventListener('click', openThemeEditor);
    }
    
    // "Lembrar-me" checkbox
    const rememberMeCheckbox = document.getElementById('remember-me');
    if (rememberMeCheckbox) {
        rememberMeCheckbox.addEventListener('change', function() {
            rememberMe = this.checked;
        });
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
        updateCurrentThemeName();
    } else if (sectionId === 'ranking-section') {
        document.getElementById('nav-ranking').classList.add('active');
    } else if (sectionId === 'themes-section') {
        document.getElementById('nav-themes').classList.add('active');
    } else if (sectionId === 'progress-section') {
        document.getElementById('nav-progress').classList.add('active');
    } else if (sectionId === 'admin-section') {
        document.getElementById('nav-admin').classList.add('active');
    }
}

// Atualizar nome do tema atual
function updateCurrentThemeName() {
    const themeNameElement = document.getElementById('current-theme');
    if (themeNameElement) {
        if (currentTheme.startsWith('custom-') && customThemes[currentTheme]) {
            themeNameElement.textContent = customThemes[currentTheme].name;
        } else if (currentTheme === 'custom-image' && customImageName) {
            themeNameElement.textContent = `Imagem: ${customImageName}`;
        } else if (themes[currentTheme]) {
            themeNameElement.textContent = themes[currentTheme].name;
        } else {
            themeNameElement.textContent = 'Desconhecido';
        }
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
    
    // Carregar dados específicos da aba
    if (tabId === 'themes-admin-tab') {
        loadAdminThemes();
    } else if (tabId === 'stats-admin-tab') {
        loadAdminStats();
    }
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
            
            // Salvar credenciais se "Lembrar-me" estiver ativo
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', user.email);
                // Nota: Em uma aplicação real, não armazene senhas em localStorage
                // Isso é apenas para demonstração
            }
            
            // Atualizar interface para usuário logado
            updateUIForLoggedInUser(user);
            
            // Verificar se o usuário é administrador
            const userData = await loadUserData(user.uid);
            const isAdmin = userData?.role === 'admin';
            updateUIForAdmin(isAdmin);
            
            // Verificar se é o administrador master (primeiro admin)
            if (isAdmin) {
                const isMaster = await checkIfUserIsMasterAdmin(user.uid);
                isMasterAdmin = isMaster;
            }
            
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
}

// Atualizar UI para usuário não logado
function updateUIForLoggedOutUser() {
    // Mostrar botões de autenticação
    if (userInfoContainer) userInfoContainer.style.display = 'none';
    if (authButtons) authButtons.style.display = 'flex';
    
    // Esconder link para admin
    if (adminNavItem) adminNavItem.style.display = 'none';
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

// Verificar se o usuário é o administrador master
async function checkIfUserIsMasterAdmin(uid) {
    try {
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('role', '==', 'admin').orderBy('createdAt').limit(1).get();
        
        if (!snapshot.empty) {
            const firstAdmin = snapshot.docs[0];
            return firstAdmin.id === uid;
        }
        return false;
    } catch (error) {
        console.error("Erro ao verificar se é admin master:", error);
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
            return await loadUserData(uid); // Recarregar após criar
        }
    } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
        return null;
    }
}

// Criar documento do usuário no Firestore
async function createUserDocument(uid) {
    try {
        const user = auth.currentUser;
        if (!user) return;
        
        const userData = {
            uid: uid,
            email: user.email,
            name: user.displayName || user.email.split('@')[0],
            role: 'player', // Padrão é jogador
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'active'
        };
        
        await db.collection('users').doc(uid).set(userData);
        console.log("Documento do usuário criado com sucesso");
        
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
    
    // Validar entrada
    if (!email || !password) {
        showFormMessage(messageElement, 'Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    try {
        showFormMessage(messageElement, 'Entrando...', 'info');
        
        // Configurar persistência de autenticação
        if (rememberMe) {
            await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        } else {
            await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
        }
        
        // Fazer login com Firebase Auth
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Salvar credenciais se "Lembrar-me" estiver ativo
        if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
            localStorage.setItem('rememberedPassword', password);
        } else {
            localStorage.removeItem('rememberedEmail');
            localStorage.removeItem('rememberedPassword');
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
    const roleSelect = document.getElementById('register-role');
    const role = roleSelect ? roleSelect.value : 'player';
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
    
    // Verificar se já existe admin e se está tentando criar outro
    if (adminUserExists && role === 'admin') {
        showFormMessage(messageElement, 'Já existe um administrador no sistema. Apenas administradores existentes podem criar novos administradores.', 'error');
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
            role: role,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'active'
        };
        
        await db.collection('users').doc(user.uid).set(userData);
        
        // Atualizar flag de admin existente
        if (role === 'admin') {
            adminUserExists = true;
            updateAdminRegistrationOption();
        }
        
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
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
        
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
    // Verificar se é um tema personalizado
    if (theme.startsWith('custom-') && customThemes[theme]) {
        currentTheme = theme;
        customImageData = null;
        customImageName = customThemes[theme].name;
    } 
    // Verificar se é upload temporário de imagem
    else if (theme === 'custom-image') {
        // Abrir modal para upload de imagem
        imageUploadModal.style.display = 'flex';
        imagePreviewContainer.style.display = 'none';
        imageUploadForm.reset();
        return;
    }
    // Tema padrão
    else if (themes[theme]) {
        currentTheme = theme;
        customImageData = null;
        customImageName = null;
    } else {
        console.error("Tema não encontrado:", theme);
        return;
    }
    
    // Atualizar nome do tema na interface
    updateCurrentThemeName();
    
    // Recriar o tabuleiro com o novo tema
    createBoard();
    renderBoard();
    createSolutionBoard();
    
    // Se estiver na seção de temas, voltar para o jogo
    if (themesSection.classList.contains('active')) {
        showSection('game-section');
    }
}

// Manipular upload de imagem (usuários comuns)
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
                    const dataUrl = pieceCanvas.toDataURL('image/png');
                    
                    // Adicionar ao array (a última peça será null para o espaço vazio)
                    if (row === 3 && col === 3) {
                        imagePieces.push(null);
                    } else {
                        imagePieces.push(dataUrl);
                        
                        // Criar elemento de pré-visualização
                        const pieceElement = document.createElement('div');
                        pieceElement.className = 'puzzle-tile image-piece';
                        pieceElement.style.backgroundImage = `url(${dataUrl})`;
                        previewBoard.appendChild(pieceElement);
                    }
                }
            }
            
            // Armazenar os dados da imagem
            customImageData = imagePieces;
            customImageName = file.name.replace(/\.[^/.]+$/, ""); // Remover extensão
            
            // Mostrar preview
            imagePreviewContainer.style.display = 'block';
            
            showFormMessage(messageElement, 'Imagem processada com sucesso! Clique em "Usar Esta Imagem" para aplicar.', 'success');
        };
        
        img.src = event.target.result;
    };
    
    reader.readAsDataURL(file);
}

// Usar imagem personalizada temporária
function useCustomImage() {
    if (!customImageData) {
        alert('Por favor, faça upload de uma imagem primeiro.');
        return;
    }
    
    // Fechar modal
    imageUploadModal.style.display = 'none';
    
    // Mudar para o tema de imagem personalizada
    currentTheme = 'custom-image';
    updateCurrentThemeName();
    
    // Criar tabuleiro com a imagem
    createBoard();
    renderBoard();
    createSolutionBoard();
    
    // Limpar formulário
    imageUploadForm.reset();
    imagePreviewContainer.style.display = 'none';
    clearFormMessage(document.getElementById('image-upload-message'));
    
    // Voltar para o jogo
    showSection('game-section');
}

// Carregar temas personalizados do Firebase
async function loadCustomThemes() {
    try {
        const themesSnapshot = await db.collection('customThemes').get();
        customThemes = {};
        
        themesSnapshot.forEach(doc => {
            const themeData = doc.data();
            const themeId = `custom-${doc.id}`;
            customThemes[themeId] = {
                id: doc.id,
                ...themeData
            };
        });
        
        // Atualizar interface com os temas
        loadThemes();
        
    } catch (error) {
        console.error("Erro ao carregar temas personalizados:", error);
    }
}

// Carregar temas na interface
function loadThemes() {
    if (!themesGrid) return;
    
    themesGrid.innerHTML = '';
    
    // Adicionar temas padrão
    Object.keys(themes).forEach(themeKey => {
        const theme = themes[themeKey];
        const themeCard = createThemeCard(themeKey, theme.name, theme.solutionText, false);
        themesGrid.appendChild(themeCard);
    });
    
    // Adicionar temas personalizados
    Object.keys(customThemes).forEach(themeKey => {
        const theme = customThemes[themeKey];
        const themeCard = createThemeCard(themeKey, theme.name, `Tema personalizado: ${theme.name}`, true);
        themesGrid.appendChild(themeCard);
    });
    
    // Adicionar opção de imagem personalizada (temporária)
    const customImageCard = document.createElement('div');
    customImageCard.className = 'theme-card';
    customImageCard.dataset.theme = 'custom-image';
    customImageCard.innerHTML = `
        <div class="theme-preview">
            <div class="theme-example">
                <i class="fas fa-image" style="font-size: 2.5rem; color: white;"></i>
            </div>
        </div>
        <div class="theme-info">
            <h3>Imagem Personalizada</h3>
            <p>Faça upload de uma imagem para criar seu próprio quebra-cabeça (temporário)</p>
        </div>
    `;
    
    customImageCard.addEventListener('click', function() {
        changeTheme('custom-image');
    });
    
    themesGrid.appendChild(customImageCard);
}

// Criar card de tema
function createThemeCard(themeKey, themeName, description, isCustom) {
    const themeCard = document.createElement('div');
    themeCard.className = 'theme-card';
    if (currentTheme === themeKey) {
        themeCard.classList.add('active');
    }
    themeCard.dataset.theme = themeKey;
    
    // Determinar conteúdo do preview
    let previewContent = '';
    if (isCustom) {
        previewContent = `<i class="fas fa-image" style="font-size: 2.5rem; color: white;"></i>`;
    } else if (themeKey === 'numbers') {
        previewContent = `1 2 3 4<br>5 6 7 8<br>9 10 11 12<br>13 14 15`;
    } else if (themeKey === 'words') {
        previewContent = `R A C H A<br>C U C A &nbsp;<br>M A T O<br>A T A R`;
    } else {
        const theme = themes[themeKey];
        const lines = theme.solutionText.split('\n');
        previewContent = lines.slice(0, 2).join('<br>');
    }
    
    themeCard.innerHTML = `
        <div class="theme-preview">
            <div class="theme-example">
                ${previewContent}
            </div>
        </div>
        <div class="theme-info">
            <h3>${themeName}</h3>
            <p>${description}</p>
        </div>
        ${currentTheme === themeKey ? '<div class="theme-badge"><i class="fas fa-check"></i> Ativo</div>' : ''}
    `;
    
    themeCard.addEventListener('click', function() {
        changeTheme(themeKey);
    });
    
    return themeCard;
}

// Abrir editor de tema (para administradores)
function openThemeEditor(themeId = null) {
    const title = document.getElementById('theme-editor-title');
    const button = document.getElementById('theme-editor-button');
    const form = document.getElementById('theme-editor-form');
    
    if (themeId) {
        // Modo edição
        title.textContent = 'Editar Tema';
        button.textContent = 'Atualizar Tema';
        
        const theme = customThemes[`custom-${themeId}`];
        if (theme) {
            document.getElementById('theme-editor-id').value = themeId;
            document.getElementById('theme-name').value = theme.name;
            document.getElementById('theme-description').value = theme.description || '';
        }
    } else {
        // Modo criação
        title.textContent = 'Criar Novo Tema';
        button.textContent = 'Salvar Tema';
        
        // Limpar formulário
        form.reset();
        document.getElementById('theme-editor-id').value = '';
    }
    
    // Limpar preview
    document.getElementById('theme-preview-container').style.display = 'none';
    clearFormMessage(document.getElementById('theme-editor-message'));
    
    // Mostrar modal
    themeEditorModal.style.display = 'flex';
}

// Manipular preview de imagem no editor de tema
function handleThemeImagePreview(e) {
    const file = e.target.files[0];
    const previewContainer = document.getElementById('theme-preview-container');
    const previewBoard = document.getElementById('theme-preview-board');
    
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            // Limpar preview board
            previewBoard.innerHTML = '';
            
            // Criar elemento de pré-visualização da imagem completa
            const fullImage = document.createElement('div');
            fullImage.className = 'puzzle-tile image-piece';
            fullImage.style.backgroundImage = `url(${event.target.result})`;
            fullImage.style.backgroundSize = 'cover';
            fullImage.style.backgroundPosition = 'center';
            fullImage.style.width = '100%';
            fullImage.style.height = '200px';
            
            previewBoard.appendChild(fullImage);
            previewContainer.style.display = 'block';
        };
        
        img.src = event.target.result;
    };
    
    reader.readAsDataURL(file);
}

// Manipular criação/edição de tema
async function handleThemeEditor(e) {
    e.preventDefault();
    
    const themeId = document.getElementById('theme-editor-id').value;
    const name = document.getElementById('theme-name').value;
    const description = document.getElementById('theme-description').value;
    const file = document.getElementById('theme-image-file').files[0];
    const messageElement = document.getElementById('theme-editor-message');
    
    if (!name || !file) {
        showFormMessage(messageElement, 'Por favor, preencha o nome e selecione uma imagem.', 'error');
        return;
    }
    
    try {
        showFormMessage(messageElement, 'Processando tema...', 'info');
        
        // Processar imagem
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
                
                // Preparar dados do tema
                const themeData = {
                    name: name,
                    description: description,
                    items: imagePieces,
                    fullImage: event.target.result, // Imagem completa para preview
                    createdBy: currentUser.uid,
                    createdAt: themeId ? undefined : firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                // Salvar no Firebase
                if (themeId) {
                    // Atualizar tema existente
                    await db.collection('customThemes').doc(themeId).update(themeData);
                    showFormMessage(messageElement, 'Tema atualizado com sucesso!', 'success');
                } else {
                    // Criar novo tema
                    await db.collection('customThemes').add(themeData);
                    showFormMessage(messageElement, 'Tema criado com sucesso!', 'success');
                }
                
                // Recarregar temas após 1.5 segundos
                setTimeout(() => {
                    themeEditorModal.style.display = 'none';
                    loadCustomThemes();
                    loadAdminThemes();
                    
                    // Atualizar filtros de ranking
                    updateThemeFilters();
                }, 1500);
            };
            
            img.src = event.target.result;
        };
        
        reader.readAsDataURL(file);
        
    } catch (error) {
        console.error("Erro ao salvar tema:", error);
        showFormMessage(messageElement, 'Erro ao salvar tema. Tente novamente.', 'error');
    }
}

// Carregar temas para administração
async function loadAdminThemes() {
    const loadingElement = document.getElementById('themes-admin-loading');
    const themesListElement = document.getElementById('themes-admin-list');
    
    if (!themesListElement) return;
    
    if (loadingElement) loadingElement.style.display = 'flex';
    themesListElement.innerHTML = '';
    
    try {
        const themesSnapshot = await db.collection('customThemes').orderBy('createdAt', 'desc').get();
        
        if (themesSnapshot.empty) {
            themesListElement.innerHTML = '<p class="no-themes">Nenhum tema personalizado encontrado.</p>';
        } else {
            themesSnapshot.forEach(doc => {
                const themeData = doc.data();
                const themeItem = document.createElement('div');
                themeItem.className = 'theme-admin-item';
                
                themeItem.innerHTML = `
                    <div class="theme-admin-info">
                        <div class="theme-admin-name">${themeData.name}</div>
                        <div class="theme-admin-description">${themeData.description || 'Sem descrição'}</div>
                        <div class="theme-admin-meta">
                            Criado em: ${themeData.createdAt?.toDate().toLocaleDateString('pt-BR') || 'Data desconhecida'}
                        </div>
                    </div>
                    <div class="theme-admin-actions">
                        <button class="btn btn-secondary btn-icon edit-theme-btn" data-theme-id="${doc.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-icon delete-theme-btn" data-theme-id="${doc.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                
                themesListElement.appendChild(themeItem);
            });
            
            // Adicionar event listeners
            const editButtons = document.querySelectorAll('.edit-theme-btn');
            const deleteButtons = document.querySelectorAll('.delete-theme-btn');
            
            editButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const themeId = this.dataset.themeId;
                    openThemeEditor(themeId);
                });
            });
            
            deleteButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const themeId = this.dataset.themeId;
                    deleteTheme(themeId);
                });
            });
        }
        
    } catch (error) {
        console.error("Erro ao carregar temas:", error);
        themesListElement.innerHTML = '<p class="error-message">Erro ao carregar temas.</p>';
    } finally {
        if (loadingElement) loadingElement.style.display = 'none';
    }
}

// Excluir tema
async function deleteTheme(themeId) {
    if (!confirm('Tem certeza que deseja excluir este tema? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        await db.collection('customThemes').doc(themeId).delete();
        
        // Recarregar temas
        loadCustomThemes();
        loadAdminThemes();
        
        // Se o tema atual for excluído, mudar para tema padrão
        if (currentTheme === `custom-${themeId}`) {
            currentTheme = 'numbers';
            createBoard();
            renderBoard();
            createSolutionBoard();
            updateCurrentThemeName();
        }
        
        alert('Tema excluído com sucesso!');
        
    } catch (error) {
        console.error("Erro ao excluir tema:", error);
        alert('Erro ao excluir tema. Tente novamente.');
    }
}

// Atualizar filtros de tema
function updateThemeFilters() {
    // Atualizar filtro de ranking
    const rankingThemeSelect = document.getElementById('ranking-theme');
    const adminScoreThemeSelect = document.getElementById('admin-score-theme');
    
    if (rankingThemeSelect) {
        updateThemeSelectOptions(rankingThemeSelect);
    }
    
    if (adminScoreThemeSelect) {
        updateThemeSelectOptions(adminScoreThemeSelect);
    }
}

function updateThemeSelectOptions(selectElement) {
    // Salvar valor atual
    const currentValue = selectElement.value;
    
    // Limpar opções (mantendo "Todos os Temas")
    selectElement.innerHTML = '<option value="all">Todos os Temas</option>';
    
    // Adicionar temas padrão
    Object.keys(themes).forEach(themeKey => {
        const option = document.createElement('option');
        option.value = themeKey;
        option.textContent = themes[themeKey].name;
        selectElement.appendChild(option);
    });
    
    // Adicionar temas personalizados
    Object.keys(customThemes).forEach(themeKey => {
        const theme = customThemes[themeKey];
        const option = document.createElement('option');
        option.value = themeKey;
        option.textContent = `⭐ ${theme.name}`;
        selectElement.appendChild(option);
    });
    
    // Restaurar valor selecionado se ainda existir
    if (currentValue && Array.from(selectElement.options).some(opt => opt.value === currentValue)) {
        selectElement.value = currentValue;
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
                
                // Obter nome do tema
                let themeName = score.themeName || 'Desconhecido';
                if (score.theme.startsWith('custom-') && customThemes[score.theme]) {
                    themeName = customThemes[score.theme].name;
                } else if (themes[score.theme]) {
                    themeName = themes[score.theme].name;
                }
                
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
                        <div class="ranking-email">${formattedDate} • ${getDifficultyText(score.difficulty)} • ${themeName}</div>
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
    if (!currentUser || isGuest) {
        document.getElementById('progress-section').innerHTML = `
            <div class="section-header">
                <h2><i class="fas fa-chart-line"></i> Meu Progresso</h2>
                <p>Faça login para acompanhar suas estatísticas</p>
            </div>
            <div class="progress-container">
                <p style="text-align: center; padding: 40px;">Faça login para ver suas estatísticas de progresso.</p>
            </div>
        `;
        return;
    }
    
    try {
        // Carregar pontuações do usuário
        const scoresSnapshot = await db.collection('scores')
            .where('userId', '==', currentUser.uid)
            .orderBy('date', 'desc')
            .get();
        
        const scores = [];
        scoresSnapshot.forEach(doc => {
            const data = doc.data();
            scores.push({
                ...data,
                date: data.date && data.date.toDate ? data.date.toDate() : new Date()
            });
        });
        
        // Atualizar estatísticas
        const totalGames = scores.length;
        document.getElementById('total-games-user').textContent = totalGames;
        
        // Calcular média de movimentos
        let totalMoves = 0;
        let bestMoves = Infinity;
        let bestTime = Infinity;
        
        scores.forEach(score => {
            totalMoves += score.moves;
            if (score.moves < bestMoves) bestMoves = score.moves;
            if (score.time < bestTime) bestTime = score.time;
        });
        
        const avgMoves = totalGames > 0 ? Math.round(totalMoves / totalGames) : 0;
        document.getElementById('avg-moves-user').textContent = avgMoves;
        document.getElementById('best-moves').textContent = bestMoves === Infinity ? 0 : bestMoves;
        document.getElementById('best-time').textContent = bestTime === Infinity ? '00:00' : formatTime(bestTime);
        
        // Atualizar gráficos
        updateUserCharts(scores);
        
        // Atualizar últimas partidas
        updateRecentScores(scores.slice(0, 10));
        
    } catch (error) {
        console.error("Erro ao carregar progresso do usuário:", error);
    }
}

// Atualizar gráficos do usuário
function updateUserCharts(scores) {
    // Destruir gráficos existentes
    if (difficultyChart) difficultyChart.destroy();
    if (themeChart) themeChart.destroy();
    
    // Preparar dados para gráfico de dificuldade
    const difficultyData = {
        easy: 0,
        normal: 0,
        hard: 0
    };
    
    // Preparar dados para gráfico de tema
    const themeData = {};
    
    scores.forEach(score => {
        // Contar por dificuldade
        difficultyData[score.difficulty] = (difficultyData[score.difficulty] || 0) + 1;
        
        // Contar por tema
        let themeName = score.themeName || score.theme;
        if (score.theme.startsWith('custom-') && customThemes[score.theme]) {
            themeName = customThemes[score.theme].name;
        } else if (themes[score.theme]) {
            themeName = themes[score.theme].name;
        }
        
        themeData[themeName] = (themeData[themeName] || 0) + 1;
    });
    
    // Gráfico de dificuldade
    const difficultyCtx = document.getElementById('difficulty-chart').getContext('2d');
    difficultyChart = new Chart(difficultyCtx, {
        type: 'bar',
        data: {
            labels: ['Fácil', 'Normal', 'Difícil'],
            datasets: [{
                label: 'Jogos por Dificuldade',
                data: [difficultyData.easy, difficultyData.normal, difficultyData.hard],
                backgroundColor: [
                    'rgba(39, 174, 96, 0.7)',
                    'rgba(44, 62, 80, 0.7)',
                    'rgba(231, 76, 60, 0.7)'
                ],
                borderColor: [
                    'rgb(39, 174, 96)',
                    'rgb(44, 62, 80)',
                    'rgb(231, 76, 60)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
    
    // Gráfico de tema
    const themeCtx = document.getElementById('theme-chart').getContext('2d');
    const themeLabels = Object.keys(themeData);
    const themeValues = Object.values(themeData);
    
    // Gerar cores dinamicamente
    const themeColors = themeLabels.map((_, i) => {
        const hue = (i * 137) % 360; // Golden angle para distribuição uniforme
        return `hsla(${hue}, 70%, 60%, 0.7)`;
    });
    
    themeChart = new Chart(themeCtx, {
        type: 'pie',
        data: {
            labels: themeLabels,
            datasets: [{
                data: themeValues,
                backgroundColor: themeColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Atualizar últimas partidas
function updateRecentScores(scores) {
    const recentScoresList = document.getElementById('recent-scores-list');
    if (!recentScoresList) return;
    
    if (scores.length === 0) {
        recentScoresList.innerHTML = '<p class="no-scores">Nenhuma partida recente encontrada.</p>';
        return;
    }
    
    recentScoresList.innerHTML = '';
    
    scores.forEach(score => {
        const scoreItem = document.createElement('div');
        scoreItem.className = 'score-item';
        
        const date = score.date;
        const formattedDate = date.toLocaleDateString('pt-BR');
        const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        // Obter nome do tema
        let themeName = score.themeName || 'Desconhecido';
        if (score.theme.startsWith('custom-') && customThemes[score.theme]) {
            themeName = customThemes[score.theme].name;
        } else if (themes[score.theme]) {
            themeName = themes[score.theme].name;
        }
        
        scoreItem.innerHTML = `
            <div class="score-date">${formattedDate} ${formattedTime}</div>
            <div class="score-info">
                <span class="score-difficulty">${getDifficultyText(score.difficulty)}</span>
                <span class="score-theme">${themeName}</span>
            </div>
            <div class="score-details">
                <span>${score.moves} movimentos</span>
                <span>${formatTime(score.time)}</span>
            </div>
        `;
        
        recentScoresList.appendChild(scoreItem);
    });
}

// Carregar estatísticas de administração
async function loadAdminStats() {
    try {
        // Carregar total de usuários
        const usersSnapshot = await db.collection('users').get();
        const totalUsers = usersSnapshot.size;
        document.getElementById('admin-total-users').textContent = totalUsers;
        
        // Contar usuários ativos (últimos 7 dias)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        let activeUsers = 0;
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            if (userData.lastLogin && userData.lastLogin.toDate() > weekAgo) {
                activeUsers++;
            }
        });
        document.getElementById('admin-active-users').textContent = activeUsers;
        
        // Carregar total de jogos
        const scoresSnapshot = await db.collection('scores').get();
        const totalGames = scoresSnapshot.size;
        document.getElementById('admin-total-games').textContent = totalGames;
        
        // Calcular média de movimentos
        let totalMoves = 0;
        scoresSnapshot.forEach(doc => {
            totalMoves += doc.data().moves;
        });
        const avgMoves = totalGames > 0 ? Math.round(totalMoves / totalGames) : 0;
        document.getElementById('admin-avg-moves').textContent = avgMoves;
        
        // Atualizar gráficos
        updateAdminCharts();
        
    } catch (error) {
        console.error("Erro ao carregar estatísticas de administração:", error);
    }
}

// Atualizar gráficos de administração
async function updateAdminCharts() {
    // Destruir gráficos existentes
    if (gamesPerDayChart) gamesPerDayChart.destroy();
    if (usersDistributionChart) usersDistributionChart.destroy();
    
    try {
        // Gráfico de jogos por dia (últimos 30 dias)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const scoresSnapshot = await db.collection('scores')
            .where('date', '>=', thirtyDaysAgo)
            .get();
        
        // Agrupar por dia
        const gamesByDay = {};
        const labels = [];
        
        // Preparar labels para os últimos 30 dias
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            labels.push(dateStr);
            gamesByDay[dateStr] = 0;
        }
        
        // Contar jogos por dia
        scoresSnapshot.forEach(doc => {
            const score = doc.data();
            if (score.date && score.date.toDate) {
                const date = score.date.toDate();
                const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                if (gamesByDay[dateStr] !== undefined) {
                    gamesByDay[dateStr]++;
                }
            }
        });
        
        const gamesData = labels.map(label => gamesByDay[label] || 0);
        
        // Criar gráfico
        const gamesCtx = document.getElementById('games-per-day-chart').getContext('2d');
        gamesPerDayChart = new Chart(gamesCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Jogos por Dia',
                    data: gamesData,
                    borderColor: 'rgb(44, 62, 80)',
                    backgroundColor: 'rgba(44, 62, 80, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
        
        // Gráfico de distribuição de usuários
        const usersSnapshot = await db.collection('users').get();
        
        let players = 0;
        let admins = 0;
        
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            if (userData.role === 'admin') {
                admins++;
            } else {
                players++;
            }
        });
        
        const usersCtx = document.getElementById('users-distribution-chart').getContext('2d');
        usersDistributionChart = new Chart(usersCtx, {
            type: 'doughnut',
            data: {
                labels: ['Jogadores', 'Administradores'],
                datasets: [{
                    data: [players, admins],
                    backgroundColor: [
                        'rgba(44, 62, 80, 0.7)',
                        'rgba(243, 156, 18, 0.7)'
                    ],
                    borderColor: [
                        'rgb(44, 62, 80)',
                        'rgb(243, 156, 18)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
        
    } catch (error) {
        console.error("Erro ao atualizar gráficos de administração:", error);
    }
}

// As funções restantes (loadAdminUsers, openEditUserModal, handleEditUser, loadAdminScores, deleteScore, clearOldScores, handleAdminRegister)
// permanecem as mesmas do código original, apenas ajustando para incluir a verificação de admin master

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
    
    // Verificar se é admin master tentando criar outro admin
    if (role === 'admin' && !isMasterAdmin) {
        showFormMessage(messageElement, 'Apenas o administrador master pode criar novos administradores.', 'error');
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
        
        // Atualizar flag de admin existente se criou um admin
        if (role === 'admin') {
            adminUserExists = true;
            updateAdminRegistrationOption();
        }
        
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
