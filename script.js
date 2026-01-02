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
let adminNavItem, homeSection, gameSection, progressSection, rankingSection, themesSection, adminSection;
let rankingList, userScoresList, usersList, adminScoresList;
let loginForm, registerForm, resetForm, adminRegisterForm, editUserForm;
let authButtons, userInfoContainer, dbStatus;
let playGuestBtn, welcomeLoginBtn, welcomeRegisterBtn, quickPlayBtn;
let heroPlayBtn, heroHowtoBtn, changeThemeBtn, themeCards;
let instructionsModal, startPlayingBtn;
let createCustomThemeBtn, manageThemesBtn, themeEditModal, themeEditForm;
let confirmationModal, confirmActionBtn, cancelActionBtn;
let progressCharts = {};

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
let selectedThemeId = null;

// Temas padrão
const defaultThemes = {
    numbers: {
        id: 'numbers',
        name: "Números",
        type: 'default',
        items: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', null],
        className: 'number',
        solutionText: "1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15",
        previewText: "1 2 3 4<br>5 6 7 8<br>9 10 11 12<br>13 14 15"
    },
    words: {
        id: 'words',
        name: "Palavras",
        type: 'default',
        items: ['M', 'A', 'T', 'O', 'A', 'T', 'A', 'R', 'C', 'U', 'C', 'A', 'A', 'M', 'O', null],
        className: 'word',
        solutionText: "M A T O\nA T A R\nC U C A\nA M O",
        previewText: "M A T O<br>A T A R<br>C U C A<br>A M O"
    },
    animals: {
        id: 'animals',
        name: "Animais",
        type: 'default',
        items: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', null],
        className: 'emoji',
        solutionText: "🐶 🐱 🐭 🐹\n🐰 🦊 🐻 🐼\n🐨 🦁 🐮 🐷\n🐸 🐵 🐔",
        previewText: "🐶 🐱 🐭 🐹<br>🐰 🦊 🐻 🐼<br>🐨 🦁 🐮 🐷<br>🐸 🐵 🐔"
    },
    fruits: {
        id: 'fruits',
        name: "Frutas",
        type: 'default',
        items: ['🍎', '🍌', '🍇', '🍓', '🍉', '🍊', '🍑', '🍍', '🥭', '🍒', '🥝', '🍏', '🥥', '🍈', '🫐', null],
        className: 'emoji',
        solutionText: "🍎 🍌 🍇 🍓\n🍉 🍊 🍑 🍍\n🥭 🍒 🥝 🍏\n🥥 🍈 🫐",
        previewText: "🍎 🍌 🍇 🍓<br>🍉 🍊 🍑 🍍<br>🥭 🍒 🥝 🍏<br>🥥 🍈 🫐"
    },
    flags: {
        id: 'flags',
        name: "Bandeiras",
        type: 'default',
        items: ['🇧🇷', '🇺🇸', '🇨🇳', '🇯🇵', '🇩🇪', '🇫🇷', '🇮🇹', '🇪🇸', '🇬🇧', '🇨🇦', '🇦🇺', '🇰🇷', '🇦🇷', '🇲🇽', '🇵🇹', null],
        className: 'emoji',
        solutionText: "🇧🇷 🇺🇸 🇨🇳 🇯🇵\n🇩🇪 🇫🇷 🇮🇹 🇪🇸\n🇬🇧 🇨🇦 🇦🇺 🇰🇷\n🇦🇷 🇲🇽 🇵🇹",
        previewText: "🇧🇷 🇺🇸 🇨🇳 🇯🇵<br>🇩🇪 🇫🇷 🇮🇹 🇪🇸<br>🇬🇧 🇨🇦 🇦🇺 🇰🇷<br>🇦🇷 🇲🇽 🇵🇹"
    },
    emoji: {
        id: 'emoji',
        name: "Emojis",
        type: 'default',
        items: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '😍', '😘', '😋', '😜', '🤪', null],
        className: 'emoji',
        solutionText: "😀 😃 😄 😁\n😆 😅 😂 🤣\n😊 😇 😍 😘\n😋 😜 🤪",
        previewText: "😀 😃 😄 😁<br>😆 😅 😂 🤣<br>😊 😇 😍 😘<br>😋 😜 🤪"
    }
};

// Temas personalizados carregados do Firebase
let customThemes = {};

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
    loadDefaultThemes();
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
        auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
            .catch(error => {
                console.error("Erro ao configurar persistência:", error);
            });
        
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
    progressSection = document.getElementById('progress-section');
    rankingSection = document.getElementById('ranking-section');
    themesSection = document.getElementById('themes-section');
    adminSection = document.getElementById('admin-section');
    
    // Navegação
    const navHome = document.getElementById('nav-home');
    const navGame = document.getElementById('nav-game');
    const navProgress = document.getElementById('nav-progress');
    const navRanking = document.getElementById('nav-ranking');
    const navThemes = document.getElementById('nav-themes');
    const navAdmin = document.getElementById('nav-admin');
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
    
    // Elementos de temas
    createCustomThemeBtn = document.getElementById('create-custom-theme-btn');
    manageThemesBtn = document.getElementById('manage-themes-btn');
    themeEditModal = document.getElementById('theme-edit-modal');
    themeEditForm = document.getElementById('theme-edit-form');
    
    // Modal de confirmação
    confirmationModal = document.getElementById('confirmation-modal');
    confirmActionBtn = document.getElementById('confirm-action-btn');
    cancelActionBtn = document.getElementById('cancel-action-btn');
}

// Carregar temas padrão na interface
function loadDefaultThemes() {
    const themesGrid = document.getElementById('themes-grid');
    if (!themesGrid) return;
    
    themesGrid.innerHTML = '';
    
    Object.values(defaultThemes).forEach(theme => {
        const themeCard = document.createElement('div');
        themeCard.className = `theme-card ${currentTheme === theme.id ? 'active' : ''}`;
        themeCard.dataset.themeId = theme.id;
        themeCard.dataset.themeType = 'default';
        
        themeCard.innerHTML = `
            <div class="theme-preview">
                <div class="theme-example">${theme.previewText}</div>
            </div>
            <div class="theme-info">
                <h3>${theme.name}</h3>
                <p>Tema padrão do jogo</p>
            </div>
            ${currentTheme === theme.id ? '<div class="theme-badge"><i class="fas fa-check"></i> Ativo</div>' : ''}
        `;
        
        themesGrid.appendChild(themeCard);
    });
    
    // Carregar temas personalizados
    loadCustomThemes();
}

// Carregar temas personalizados do Firebase
async function loadCustomThemes() {
    try {
        const themesSnapshot = await db.collection('themes')
            .where('status', '==', 'active')
            .orderBy('createdAt', 'desc')
            .get();
        
        customThemes = {};
        const customThemesGrid = document.getElementById('custom-themes-grid');
        const noCustomThemes = document.getElementById('no-custom-themes');
        
        if (!customThemesGrid) return;
        
        customThemesGrid.innerHTML = '';
        
        themesSnapshot.forEach(doc => {
            const themeData = doc.data();
            customThemes[doc.id] = {
                id: doc.id,
                ...themeData
            };
            
            const themeCard = document.createElement('div');
            themeCard.className = `theme-card ${currentTheme === doc.id ? 'active' : ''}`;
            themeCard.dataset.themeId = doc.id;
            themeCard.dataset.themeType = 'custom';
            
            const previewContent = themeData.imageUrl ? 
                `<img src="${themeData.imageUrl}" class="theme-preview-image" alt="${themeData.name}">` :
                `<div class="theme-example">Imagem Personalizada</div>`;
            
            themeCard.innerHTML = `
                <div class="theme-preview">
                    ${previewContent}
                </div>
                <div class="theme-info">
                    <h3>${themeData.name}</h3>
                    <p>${themeData.description || 'Tema personalizado'}</p>
                    <small>Criado por: ${themeData.creatorName || 'Admin'}</small>
                </div>
                ${currentTheme === doc.id ? '<div class="theme-badge"><i class="fas fa-check"></i> Ativo</div>' : ''}
            `;
            
            customThemesGrid.appendChild(themeCard);
        });
        
        // Mostrar/ocultar mensagem de "nenhum tema"
        if (noCustomThemes) {
            noCustomThemes.style.display = themesSnapshot.empty ? 'block' : 'none';
        }
        
    } catch (error) {
        console.error("Erro ao carregar temas personalizados:", error);
    }
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
    if (selectedThemeId && customThemes[selectedThemeId]) {
        // Usar tema personalizado
        const theme = customThemes[selectedThemeId];
        board = Array(16).fill(null);
        emptyTileIndex = 15;
        currentTheme = selectedThemeId;
    } else if (defaultThemes[currentTheme]) {
        // Usar tema padrão
        board = [...defaultThemes[currentTheme].items];
    } else {
        // Fallback para números
        board = [...defaultThemes.numbers.items];
    }
}

// Renderizar o tabuleiro com suporte a drag and drop
function renderBoard() {
    puzzleBoard.innerHTML = '';
    
    board.forEach((value, index) => {
        const tile = document.createElement('div');
        
        if (selectedThemeId && customThemes[selectedThemeId]) {
            // Tema personalizado
            tile.className = `puzzle-tile image-piece`;
            if (value === null) {
                tile.classList.add('empty');
                emptyTileIndex = index;
            } else {
                tile.style.backgroundImage = `url(${value})`;
                tile.dataset.index = index;
                tile.dataset.value = value;
                
                // Verificar se está na posição correta
                const correctValue = index === 15 ? null : `piece-${index}`;
                if (value === correctValue) {
                    tile.classList.add('correct-position');
                }
            }
        } else {
            // Tema padrão
            const themeData = defaultThemes[currentTheme];
            tile.className = `puzzle-tile ${themeData.className}`;
            
            if (value === null) {
                tile.classList.add('empty');
                tile.textContent = '';
                emptyTileIndex = index;
            } else {
                tile.textContent = value;
                tile.dataset.index = index;
                tile.dataset.value = value;
                
                // Verificar se a peça está na posição correta
                const correctValue = themeData.items[index];
                if (value === correctValue) {
                    tile.classList.add('correct-position');
                }
            }
        }
        
        if (value !== null) {
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
    createBoard();
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
        if (board[i] !== null && isMovable(i)) {
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
        if (board[i] === null) return false;
        if (selectedThemeId && customThemes[selectedThemeId]) {
            // Para temas personalizados, verificar se a peça está na posição correta
            if (board[i] !== `piece-${i}`) {
                return false;
            }
        } else if (defaultThemes[currentTheme]) {
            // Para temas padrão
            if (board[i] !== defaultThemes[currentTheme].items[i]) {
                return false;
            }
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
            themeId: selectedThemeId,
            themeName: getThemeName(currentTheme, selectedThemeId),
            date: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Salvar no Firestore
        await db.collection('scores').add(scoreData);
        
        console.log("Pontuação salva automaticamente");
        
        // Atualizar estatísticas globais
        loadGlobalStats();
        
        // Se estiver na seção de progresso, atualizar
        if (progressSection.classList.contains('active')) {
            loadUserProgress();
        }
        
    } catch (error) {
        console.error("Erro ao salvar pontuação automaticamente:", error);
    }
}

// Obter nome do tema
function getThemeName(themeKey, themeId) {
    if (themeId && customThemes[themeId]) {
        return customThemes[themeId].name;
    } else if (defaultThemes[themeKey]) {
        return defaultThemes[themeKey].name;
    }
    return "Desconhecido";
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
    const imageSolutionPreview = document.getElementById('image-solution-preview');
    
    if (!solutionBoard) return;
    
    solutionBoard.innerHTML = '';
    imageSolutionPreview.style.display = 'none';
    imageSolutionPreview.innerHTML = '';
    
    if (selectedThemeId && customThemes[selectedThemeId]) {
        // Mostrar imagem completa para tema personalizado
        const theme = customThemes[selectedThemeId];
        imageSolutionPreview.style.display = 'block';
        
        const img = document.createElement('img');
        img.src = theme.imageUrl;
        img.alt = theme.name;
        img.style.maxWidth = '100%';
        img.style.borderRadius = '6px';
        
        imageSolutionPreview.appendChild(img);
        solutionBoard.style.display = 'none';
    } else {
        // Mostrar grade de solução para temas padrão
        solutionBoard.style.display = 'grid';
        const themeData = defaultThemes[currentTheme];
        if (!themeData) return;
        
        const solutionText = themeData.solutionText;
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
    const navProgress = document.getElementById('nav-progress');
    const navRanking = document.getElementById('nav-ranking');
    const navThemes = document.getElementById('nav-themes');
    const navAdmin = document.getElementById('nav-admin');
    
    if (navHome) navHome.addEventListener('click', () => showSection('home-section'));
    if (navGame) navGame.addEventListener('click', () => {
        showSection('game-section');
        resetGame();
    });
    if (navProgress) navProgress.addEventListener('click', () => {
        showSection('progress-section');
        loadUserProgress();
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
        loadAdminStats();
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
                if (tabId === 'themes-management-tab') {
                    loadAdminThemes();
                } else if (tabId === 'admin-stats-tab') {
                    loadAdminStats();
                }
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
    
    // Temas
    if (createCustomThemeBtn) {
        createCustomThemeBtn.addEventListener('click', () => {
            if (currentUser && (await checkIfUserIsAdmin(currentUser.uid))) {
                openThemeEditModal();
            } else {
                alert('Apenas administradores podem criar temas personalizados.');
            }
        });
    }
    
    if (manageThemesBtn) {
        manageThemesBtn.addEventListener('click', () => {
            showSection('admin-section');
            switchAdminTab('themes-management-tab');
        });
    }
    
    // Event delegation para cards de tema
    document.addEventListener('click', function(e) {
        const themeCard = e.target.closest('.theme-card');
        if (themeCard) {
            const themeId = themeCard.dataset.themeId;
            const themeType = themeCard.dataset.themeType;
            
            if (themeType === 'default') {
                changeTheme(themeId);
            } else if (themeType === 'custom') {
                selectCustomTheme(themeId);
            }
        }
    });
    
    // Formulário de edição de tema
    if (themeEditForm) {
        themeEditForm.addEventListener('submit', handleThemeSave);
    }
    
    const themeImageInput = document.getElementById('theme-image');
    if (themeImageInput) {
        themeImageInput.addEventListener('change', previewThemeImage);
    }
    
    // Modal de confirmação
    if (confirmActionBtn) {
        confirmActionBtn.addEventListener('click', handleConfirmAction);
    }
    
    if (cancelActionBtn) {
        cancelActionBtn.addEventListener('click', () => {
            confirmationModal.style.display = 'none';
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
        document.getElementById('current-theme').textContent = getThemeName(currentTheme, selectedThemeId);
    } else if (sectionId === 'progress-section') {
        document.getElementById('nav-progress').classList.add('active');
    } else if (sectionId === 'ranking-section') {
        document.getElementById('nav-ranking').classList.add('active');
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
            
            // Carregar temas personalizados
            loadCustomThemes();
            
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
    
    // Esconder botão de gerenciar temas
    if (manageThemesBtn) manageThemesBtn.style.display = 'none';
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
    
    if (manageThemesBtn) {
        manageThemesBtn.style.display = isAdmin ? 'block' : 'none';
    }
    
    if (createCustomThemeBtn) {
        createCustomThemeBtn.style.display = isAdmin ? 'block' : 'none';
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
        
        const userData = {
            uid: uid,
            email: user.email,
            name: user.displayName || user.email.split('@')[0],
            role: 'player',
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
    const rememberMeCheckbox = document.getElementById('remember-me');
    rememberMe = rememberMeCheckbox ? rememberMeCheckbox.checked : false;
    const messageElement = document.getElementById('login-message');
    
    // Validar entrada
    if (!email || !password) {
        showFormMessage(messageElement, 'Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    try {
        showFormMessage(messageElement, 'Entrando...', 'info');
        
        // Configurar persistência baseada na escolha do usuário
        const persistence = rememberMe ? 
            firebase.auth.Auth.Persistence.LOCAL : 
            firebase.auth.Auth.Persistence.SESSION;
        
        await auth.setPersistence(persistence);
        
        // Fazer login com Firebase Auth
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
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
            role: 'player',
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
        await auth.signOut();
        console.log("Usuário deslogado com sucesso");
        
        // Redirecionar para a página inicial
        showSection('home-section');
        isGuest = false;
        
        // Resetar tema para padrão
        selectedThemeId = null;
        currentTheme = 'numbers';
        createBoard();
        renderBoard();
        createSolutionBoard();
        
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

// Mudar tema padrão
function changeTheme(themeKey) {
    if (!defaultThemes[themeKey]) return;
    
    // Atualizar cards de tema
    document.querySelectorAll('.theme-card').forEach(card => {
        card.classList.remove('active');
        if (card.dataset.themeId === themeKey) {
            card.classList.add('active');
        }
    });
    
    selectedThemeId = null;
    currentTheme = themeKey;
    
    // Atualizar nome do tema na interface
    document.getElementById('current-theme').textContent = defaultThemes[themeKey].name;
    
    // Recriar o tabuleiro com o novo tema
    createBoard();
    renderBoard();
    createSolutionBoard();
    
    // Se estiver na seção de temas, voltar para o jogo
    if (themesSection.classList.contains('active')) {
        showSection('game-section');
    }
}

// Selecionar tema personalizado
function selectCustomTheme(themeId) {
    if (!customThemes[themeId]) return;
    
    // Atualizar cards de tema
    document.querySelectorAll('.theme-card').forEach(card => {
        card.classList.remove('active');
        if (card.dataset.themeId === themeId) {
            card.classList.add('active');
        }
    });
    
    selectedThemeId = themeId;
    
    // Atualizar nome do tema na interface
    document.getElementById('current-theme').textContent = customThemes[themeId].name;
    
    // Recriar o tabuleiro com o novo tema
    createBoard();
    renderBoard();
    createSolutionBoard();
    
    // Se estiver na seção de temas, voltar para o jogo
    if (themesSection.classList.contains('active')) {
        showSection('game-section');
    }
}

// Abrir modal de edição de tema
function openThemeEditModal(themeId = null) {
    const modalTitle = document.getElementById('theme-modal-title');
    const themeIdInput = document.getElementById('theme-id');
    const themeNameInput = document.getElementById('theme-name');
    const themeDescriptionInput = document.getElementById('theme-description');
    const themeImageInput = document.getElementById('theme-image');
    const themePreviewContainer = document.getElementById('theme-preview-container');
    
    if (themeId && customThemes[themeId]) {
        // Modo edição
        const theme = customThemes[themeId];
        modalTitle.innerHTML = '<i class="fas fa-edit"></i> Editar Tema';
        themeIdInput.value = themeId;
        themeNameInput.value = theme.name;
        themeDescriptionInput.value = theme.description || '';
        themeImageInput.required = false;
        themePreviewContainer.style.display = 'none';
    } else {
        // Modo criação
        modalTitle.innerHTML = '<i class="fas fa-palette"></i> Criar Tema Personalizado';
        themeIdInput.value = '';
        themeNameInput.value = '';
        themeDescriptionInput.value = '';
        themeImageInput.required = true;
        themePreviewContainer.style.display = 'none';
    }
    
    themeEditModal.style.display = 'flex';
    clearFormMessage(document.getElementById('theme-edit-message'));
}

// Pré-visualizar imagem do tema
function previewThemeImage() {
    const file = document.getElementById('theme-image').files[0];
    const previewContainer = document.getElementById('theme-preview-container');
    const previewGrid = document.getElementById('theme-preview-grid');
    
    if (!file) {
        previewContainer.style.display = 'none';
        return;
    }
    
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
            
            // Limpar preview grid
            previewGrid.innerHTML = '';
            
            // Gerar as 16 peças
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
                    pieceElement.className = 'theme-preview-piece';
                    pieceElement.style.backgroundImage = `url(${dataUrl})`;
                    
                    // Se for a última peça (vazia), deixar com fundo cinza
                    if (row === 3 && col === 3) {
                        pieceElement.style.backgroundColor = 'var(--gray-light)';
                        pieceElement.style.backgroundImage = 'none';
                    }
                    
                    previewGrid.appendChild(pieceElement);
                }
            }
            
            // Mostrar preview
            previewContainer.style.display = 'block';
        };
        
        img.src = event.target.result;
    };
    
    reader.readAsDataURL(file);
}

// Salvar tema personalizado
async function handleThemeSave(e) {
    e.preventDefault();
    
    const themeId = document.getElementById('theme-id').value;
    const themeName = document.getElementById('theme-name').value;
    const themeDescription = document.getElementById('theme-description').value;
    const themeImageFile = document.getElementById('theme-image').files[0];
    const messageElement = document.getElementById('theme-edit-message');
    
    // Validar entrada
    if (!themeName) {
        showFormMessage(messageElement, 'Por favor, insira um nome para o tema.', 'error');
        return;
    }
    
    // Para criação, é necessária uma imagem
    if (!themeId && !themeImageFile) {
        showFormMessage(messageElement, 'Por favor, selecione uma imagem para o tema.', 'error');
        return;
    }
    
    try {
        showFormMessage(messageElement, 'Salvando tema...', 'info');
        
        let imageUrl = '';
        
        // Se houver uma nova imagem, processá-la
        if (themeImageFile) {
            const imageData = await processImageForTheme(themeImageFile);
            imageUrl = imageData.fullImage;
        } else if (themeId && customThemes[themeId]) {
            // Usar imagem existente
            imageUrl = customThemes[themeId].imageUrl;
        }
        
        // Preparar dados do tema
        const themeData = {
            name: themeName,
            description: themeDescription,
            imageUrl: imageUrl,
            status: 'active',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Se for um novo tema, adicionar informações adicionais
        if (!themeId) {
            themeData.creatorId = currentUser.uid;
            themeData.creatorName = currentUser.displayName || currentUser.email.split('@')[0];
            themeData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        }
        
        // Salvar no Firestore
        if (themeId) {
            // Atualizar tema existente
            await db.collection('themes').doc(themeId).update(themeData);
        } else {
            // Criar novo tema
            const docRef = await db.collection('themes').add(themeData);
            themeData.id = docRef.id;
        }
        
        showFormMessage(messageElement, 'Tema salvo com sucesso!', 'success');
        
        // Fechar modal após 1.5 segundos
        setTimeout(() => {
            themeEditModal.style.display = 'none';
            clearFormMessage(messageElement);
            
            // Recarregar temas
            loadCustomThemes();
            
            // Se estiver na aba de administração de temas, recarregar
            if (document.getElementById('themes-management-tab').classList.contains('active')) {
                loadAdminThemes();
            }
        }, 1500);
        
    } catch (error) {
        console.error("Erro ao salvar tema:", error);
        showFormMessage(messageElement, 'Erro ao salvar tema. Tente novamente.', 'error');
    }
}

// Processar imagem para tema
async function processImageForTheme(imageFile) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                // Criar um canvas para a imagem completa
                const fullCanvas = document.createElement('canvas');
                fullCanvas.width = 400;
                fullCanvas.height = 400;
                const fullCtx = fullCanvas.getContext('2d');
                
                // Desenhar a imagem redimensionada
                fullCtx.drawImage(img, 0, 0, 400, 400);
                
                // Converter para data URL
                const fullImageUrl = fullCanvas.toDataURL('image/jpeg', 0.8);
                
                resolve({
                    fullImage: fullImageUrl
                });
            };
            
            img.src = event.target.result;
        };
        
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
    });
}

// Carregar temas na administração
async function loadAdminThemes() {
    const loadingElement = document.getElementById('admin-themes-loading');
    const themesListElement = document.getElementById('admin-themes-list');
    
    if (!currentUser) return;
    
    // Verificar se o usuário atual é administrador
    const isAdmin = await checkIfUserIsAdmin(currentUser.uid);
    if (!isAdmin) {
        if (themesListElement) {
            themesListElement.innerHTML = '<p class="error-message">Acesso negado. Apenas administradores podem acessar esta área.</p>';
        }
        return;
    }
    
    if (loadingElement) loadingElement.style.display = 'flex';
    if (themesListElement) themesListElement.innerHTML = '';
    
    try {
        // Carregar todos os temas
        const themesSnapshot = await db.collection('themes').orderBy('createdAt', 'desc').get();
        
        if (themesSnapshot.empty) {
            themesListElement.innerHTML = '<p class="no-themes-message">Nenhum tema personalizado criado ainda.</p>';
            return;
        }
        
        themesSnapshot.forEach(doc => {
            const themeData = doc.data();
            const themeItem = document.createElement('div');
            themeItem.className = 'admin-theme-item';
            
            const previewContent = themeData.imageUrl ? 
                `<img src="${themeData.imageUrl}" alt="${themeData.name}">` :
                '<div class="theme-example">Sem imagem</div>';
            
            const statusBadge = themeData.status === 'active' ? 
                '<span class="user-status active">Ativo</span>' : 
                '<span class="user-status suspended">Inativo</span>';
            
            themeItem.innerHTML = `
                <div class="admin-theme-preview">
                    ${previewContent}
                </div>
                <div class="admin-theme-info">
                    <h4>${themeData.name}</h4>
                    <p>${themeData.description || 'Sem descrição'}</p>
                    <div class="admin-theme-stats">
                        <span>Criado por: ${themeData.creatorName || 'Admin'}</span>
                        ${statusBadge}
                    </div>
                </div>
                <div class="admin-theme-actions">
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
        
        // Adicionar event listeners aos botões
        const editButtons = document.querySelectorAll('.edit-theme-btn');
        editButtons.forEach(button => {
            button.addEventListener('click', function() {
                const themeId = this.dataset.themeId;
                openThemeEditModal(themeId);
            });
        });
        
        const deleteButtons = document.querySelectorAll('.delete-theme-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function() {
                const themeId = this.dataset.themeId;
                confirmDeleteTheme(themeId);
            });
        });
        
    } catch (error) {
        console.error("Erro ao carregar temas:", error);
        if (themesListElement) {
            themesListElement.innerHTML = '<p class="error-message">Erro ao carregar temas. Tente novamente.</p>';
        }
    } finally {
        if (loadingElement) loadingElement.style.display = 'none';
    }
}

// Confirmar exclusão de tema
function confirmDeleteTheme(themeId) {
    if (!themeId || !customThemes[themeId]) return;
    
    const theme = customThemes[themeId];
    const messageElement = document.getElementById('confirmation-message');
    
    messageElement.textContent = `Tem certeza que deseja excluir o tema "${theme.name}"? Esta ação não pode ser desfeita.`;
    
    confirmationModal.style.display = 'flex';
    
    // Configurar ação de confirmação
    confirmActionBtn.onclick = async () => {
        await deleteTheme(themeId);
        confirmationModal.style.display = 'none';
    };
}

// Excluir tema
async function deleteTheme(themeId) {
    try {
        // Atualizar status para "deleted" em vez de excluir completamente
        await db.collection('themes').doc(themeId).update({
            status: 'deleted',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Recarregar temas
        loadCustomThemes();
        loadAdminThemes();
        
        // Se o tema excluído estava selecionado, voltar para tema padrão
        if (selectedThemeId === themeId) {
            selectedThemeId = null;
            currentTheme = 'numbers';
            createBoard();
            renderBoard();
            createSolutionBoard();
            document.getElementById('current-theme').textContent = 'Números';
        }
        
        alert('Tema excluído com sucesso!');
        
    } catch (error) {
        console.error("Erro ao excluir tema:", error);
        alert('Erro ao excluir tema. Tente novamente.');
    }
}

// Manipular ação de confirmação
async function handleConfirmAction() {
    // Esta função é preenchida dinamicamente por outras funções
    console.log("Ação confirmada");
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
            if (theme === 'custom') {
                // Filtrar por temas personalizados
                query = query.where('themeId', '!=', null);
            } else {
                query = query.where('theme', '==', theme);
            }
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
        const usersSnapshot = await db.collection('users').where('status', '==', 'active').get();
        const totalPlayers = usersSnapshot.size;
        document.getElementById('total-players').textContent = totalPlayers;
        
    } catch (error) {
        console.error("Erro ao carregar estatísticas globais:", error);
    }
}

// Carregar progresso do usuário
async function loadUserProgress() {
    if (!currentUser) {
        // Redirecionar para login se não estiver logado
        showSection('home-section');
        showLoginModal();
        return;
    }
    
    try {
        // Carregar estatísticas do usuário
        const scoresSnapshot = await db.collection('scores')
            .where('userId', '==', currentUser.uid)
            .orderBy('date', 'desc')
            .get();
        
        const totalGames = scoresSnapshot.size;
        let totalMoves = 0;
        let totalTime = 0;
        let bestScore = Infinity;
        
        const gamesByDifficulty = { easy: 0, normal: 0, hard: 0 };
        const gamesByTheme = {};
        
        const recentGames = [];
        
        scoresSnapshot.forEach(doc => {
            const data = doc.data();
            
            // Estatísticas gerais
            totalMoves += data.moves;
            totalTime += data.time;
            
            // Melhor pontuação (menos movimentos)
            if (data.moves < bestScore) {
                bestScore = data.moves;
            }
            
            // Estatísticas por dificuldade
            gamesByDifficulty[data.difficulty] = (gamesByDifficulty[data.difficulty] || 0) + 1;
            
            // Estatísticas por tema
            const themeName = data.themeName || data.theme;
            gamesByTheme[themeName] = (gamesByTheme[themeName] || 0) + 1;
            
            // Jogos recentes (últimos 5)
            if (recentGames.length < 5) {
                recentGames.push({
                    theme: themeName,
                    difficulty: data.difficulty,
                    moves: data.moves,
                    time: data.time,
                    date: data.date && data.date.toDate ? data.date.toDate() : new Date()
                });
            }
        });
        
        // Atualizar estatísticas na interface
        document.getElementById('user-total-games').textContent = totalGames;
        document.getElementById('user-total-moves').textContent = totalMoves;
        document.getElementById('user-total-time').textContent = formatTime(totalTime);
        document.getElementById('user-best-score').textContent = bestScore === Infinity ? 0 : bestScore;
        
        // Atualizar lista de jogos recentes
        updateRecentGamesList(recentGames);
        
        // Criar gráficos
        createProgressCharts(gamesByDifficulty, gamesByTheme);
        
    } catch (error) {
        console.error("Erro ao carregar progresso do usuário:", error);
    }
}

// Atualizar lista de jogos recentes
function updateRecentGamesList(games) {
    const gamesListElement = document.getElementById('recent-games-list');
    if (!gamesListElement) return;
    
    gamesListElement.innerHTML = '';
    
    if (games.length === 0) {
        gamesListElement.innerHTML = '<p class="no-games">Nenhum jogo encontrado.</p>';
        return;
    }
    
    games.forEach(game => {
        const gameItem = document.createElement('div');
        gameItem.className = 'game-item';
        
        const formattedDate = game.date.toLocaleDateString('pt-BR');
        const formattedTime = formatTime(game.time);
        
        gameItem.innerHTML = `
            <div class="game-info-small">
                <div class="game-theme">${game.theme}</div>
                <div class="game-details">${getDifficultyText(game.difficulty)} • ${formattedDate}</div>
            </div>
            <div class="game-score">
                <div class="game-moves">${game.moves} movimentos</div>
                <div class="game-time">${formattedTime}</div>
            </div>
        `;
        
        gamesListElement.appendChild(gameItem);
    });
}

// Criar gráficos de progresso
function createProgressCharts(difficultyData, themeData) {
    // Gráfico de desempenho por dificuldade
    const difficultyCtx = document.getElementById('difficulty-chart').getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (progressCharts.difficultyChart) {
        progressCharts.difficultyChart.destroy();
    }
    
    progressCharts.difficultyChart = new Chart(difficultyCtx, {
        type: 'bar',
        data: {
            labels: ['Fácil', 'Normal', 'Difícil'],
            datasets: [{
                label: 'Jogos Concluídos',
                data: [difficultyData.easy || 0, difficultyData.normal || 0, difficultyData.hard || 0],
                backgroundColor: [
                    'rgba(39, 174, 96, 0.7)',
                    'rgba(44, 62, 80, 0.7)',
                    'rgba(231, 76, 60, 0.7)'
                ],
                borderColor: [
                    'rgba(39, 174, 96, 1)',
                    'rgba(44, 62, 80, 1)',
                    'rgba(231, 76, 60, 1)'
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
    
    // Gráfico de distribuição por tema
    const themeCtx = document.getElementById('theme-chart').getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (progressCharts.themeChart) {
        progressCharts.themeChart.destroy();
    }
    
    const themeLabels = Object.keys(themeData);
    const themeValues = Object.values(themeData);
    
    // Gerar cores aleatórias para os temas
    const backgroundColors = themeLabels.map(() => {
        const r = Math.floor(Math.random() * 200) + 55;
        const g = Math.floor(Math.random() * 200) + 55;
        const b = Math.floor(Math.random() * 200) + 55;
        return `rgba(${r}, ${g}, ${b}, 0.7)`;
    });
    
    progressCharts.themeChart = new Chart(themeCtx, {
        type: 'pie',
        data: {
            labels: themeLabels,
            datasets: [{
                label: 'Jogos por Tema',
                data: themeValues,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true
        }
    });
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
        
        // Se uma nova senha foi fornecida, atualizá-la no Firebase Auth
        if (password && password.length >= 6) {
            // Nota: Para atualizar a senha de outro usuário, você precisaria
            // de privilégios de administrador no Firebase Auth
            // Esta funcionalidade requer configuração adicional
            console.log("Atualização de senha solicitada para usuário:", userId);
        }
        
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
            if (theme === 'custom') {
                // Filtrar por temas personalizados
                query = query.where('themeId', '!=', null);
            } else {
                query = query.where('theme', '==', theme);
            }
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

// Carregar estatísticas administrativas
async function loadAdminStats() {
    if (!currentUser) return;
    
    // Verificar se o usuário atual é administrador
    const isAdmin = await checkIfUserIsAdmin(currentUser.uid);
    if (!isAdmin) return;
    
    try {
        // Carregar estatísticas de usuários
        const usersSnapshot = await db.collection('users').get();
        const totalUsers = usersSnapshot.size;
        
        let adminCount = 0;
        let playerCount = 0;
        let activeCount = 0;
        let suspendedCount = 0;
        
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            if (userData.role === 'admin') {
                adminCount++;
            } else {
                playerCount++;
            }
            
            if (userData.status === 'suspended') {
                suspendedCount++;
            } else {
                activeCount++;
            }
        });
        
        // Atualizar estatísticas de usuários
        document.getElementById('admin-total-users').textContent = totalUsers;
        
        // Gráfico de distribuição de usuários
        const usersCtx = document.getElementById('admin-users-chart').getContext('2d');
        new Chart(usersCtx, {
            type: 'doughnut',
            data: {
                labels: ['Administradores', 'Jogadores'],
                datasets: [{
                    data: [adminCount, playerCount],
                    backgroundColor: [
                        'rgba(243, 156, 18, 0.7)',
                        'rgba(44, 62, 80, 0.7)'
                    ]
                }]
            }
        });
        
        // Carregar estatísticas de jogos
        const scoresSnapshot = await db.collection('scores').get();
        const totalGames = scoresSnapshot.size;
        
        // Calcular média de movimentos
        let totalMoves = 0;
        scoresSnapshot.forEach(doc => {
            totalMoves += doc.data().moves;
        });
        const avgMoves = totalGames > 0 ? Math.round(totalMoves / totalGames) : 0;
        
        // Atualizar estatísticas de jogos
        document.getElementById('admin-total-games').textContent = totalGames;
        document.getElementById('admin-avg-score').textContent = avgMoves;
        
        // Carregar estatísticas de temas
        const themesSnapshot = await db.collection('themes').where('status', '==', 'active').get();
        const totalThemes = themesSnapshot.size;
        document.getElementById('admin-total-themes').textContent = totalThemes;
        
        // Carregar estatísticas de jogos por dia (últimos 7 dias)
        const last7Days = [];
        const gamesByDay = {};
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            last7Days.push(dateString);
            gamesByDay[dateString] = 0;
        }
        
        // Contar jogos por dia
        scoresSnapshot.forEach(doc => {
            const gameDate = doc.data().date;
            if (gameDate && gameDate.toDate) {
                const dateObj = gameDate.toDate();
                const dateString = dateObj.toISOString().split('T')[0];
                
                if (gamesByDay[dateString] !== undefined) {
                    gamesByDay[dateString]++;
                }
            }
        });
        
        // Gráfico de jogos por dia
        const gamesCtx = document.getElementById('admin-games-chart').getContext('2d');
        new Chart(gamesCtx, {
            type: 'line',
            data: {
                labels: last7Days.map(date => {
                    const d = new Date(date);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                }),
                datasets: [{
                    label: 'Jogos por Dia',
                    data: last7Days.map(date => gamesByDay[date] || 0),
                    borderColor: 'rgba(44, 62, 80, 1)',
                    backgroundColor: 'rgba(44, 62, 80, 0.1)',
                    fill: true,
                    tension: 0.4
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
        
    } catch (error) {
        console.error("Erro ao carregar estatísticas administrativas:", error);
    }
}
