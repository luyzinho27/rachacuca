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
let adminNavItem, homeSection, gameSection, rankingSection, themesSection, progressSection, adminSection;
let rankingList, userScoresList, usersList, adminScoresList;
let loginForm, registerForm, resetForm, adminRegisterForm, editUserForm;
let authButtons, userInfoContainer, dbStatus;
let playGuestBtn, welcomeLoginBtn, welcomeRegisterBtn, quickPlayBtn;
let heroPlayBtn, heroHowtoBtn, changeThemeBtn, themeCards;
let instructionsModal, startPlayingBtn;
let imageUploadModal, imageUploadForm, imageFileInput, useImageBtn, imagePreviewContainer;
let themeEditorModal, themeEditorForm, createThemeBtn, themesGrid;
let progressLoading, userStats, noProgress, startPlayingProgressBtn;
let difficultyChart, themeChart;

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
let temporaryImageTheme = null;
let themes = {};

// Variáveis para drag and drop
let draggedTile = null;
let dragStartX = 0;
let dragStartY = 0;
let isDragging = false;

// Inicialização do aplicativo
document.addEventListener('DOMContentLoaded', function() {
    initializeFirebase();
    initializeDOMElements();
    setupEventListeners();
    loadThemesFromFirestore().then(() => {
        initializeGame();
        checkAuthState();
        initializePreviewBoard();
        loadGlobalStats();
    });
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
        
        // Configurar persistência de autenticação
        firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        
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
        
        // Se não existir admin, verificar se o primeiro usuário deve ser admin
        if (!adminUserExists) {
            // Verificar se há usuários no sistema
            const allUsersSnapshot = await usersRef.limit(1).get();
            if (allUsersSnapshot.empty) {
                console.log("Sistema vazio, primeiro usuário será admin");
            }
        }
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
    themesSection = document.getElementById('themes-section');
    progressSection = document.getElementById('progress-section');
    adminSection = document.getElementById('admin-section');
    
    // Navegação
    const navHome = document.getElementById('nav-home');
    const navGame = document.getElementById('nav-game');
    const navRanking = document.getElementById('nav-ranking');
    const navThemes = document.getElementById('nav-themes');
    const navProgress = document.getElementById('nav-progress');
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
    createThemeBtn = document.getElementById('create-theme-btn');
    themesGrid = document.getElementById('themes-grid');
    
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
    
    // Modal de edição de tema
    themeEditorModal = document.getElementById('theme-editor-modal');
    themeEditorForm = document.getElementById('theme-editor-form');
    
    // Elementos de progresso
    progressLoading = document.getElementById('progress-loading');
    userStats = document.getElementById('user-stats');
    noProgress = document.getElementById('no-progress');
    startPlayingProgressBtn = document.getElementById('start-playing-progress');
    
    // Elementos dos gráficos
    difficultyChart = document.getElementById('difficulty-chart');
    themeChart = document.getElementById('theme-chart');
}

// Carregar temas do Firestore
async function loadThemesFromFirestore() {
    try {
        // Temas padrão
        themes = {
            numbers: {
                id: 'numbers',
                name: "Números",
                items: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', null],
                className: 'number',
                category: 'numbers',
                status: 'active',
                isDefault: true
            },
            words: {
                id: 'words',
                name: "Palavras",
                items: ['M', 'A', 'T', 'O', 'A', 'T', 'A', 'R', 'C', 'U', 'C', 'A', 'A', 'M', 'O', null],
                className: 'word',
                category: 'words',
                status: 'active',
                isDefault: true
            },
            animals: {
                id: 'animals',
                name: "Animais",
                items: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', null],
                className: 'emoji',
                category: 'emoji',
                status: 'active',
                isDefault: true
            },
            fruits: {
                id: 'fruits',
                name: "Frutas",
                items: ['🍎', '🍌', '🍇', '🍓', '🍉', '🍊', '🍑', '🍍', '🥭', '🍒', '🥝', '🍏', '🥥', '🍈', '🫐', null],
                className: 'emoji',
                category: 'emoji',
                status: 'active',
                isDefault: true
            },
            flags: {
                id: 'flags',
                name: "Bandeiras",
                items: ['🇧🇷', '🇺🇸', '🇨🇳', '🇯🇵', '🇩🇪', '🇫🇷', '🇮🇹', '🇪🇸', '🇬🇧', '🇨🇦', '🇦🇺', '🇰🇷', '🇦🇷', '🇲🇽', '🇵🇹', null],
                className: 'emoji',
                category: 'emoji',
                status: 'active',
                isDefault: true
            },
            emoji: {
                id: 'emoji',
                name: "Emojis",
                items: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '😍', '😘', '😋', '😜', '🤪', null],
                className: 'emoji',
                category: 'emoji',
                status: 'active',
                isDefault: true
            }
        };
        
        // Carregar temas personalizados do Firestore
        const themesSnapshot = await db.collection('themes').where('status', '==', 'active').get();
        
        themesSnapshot.forEach(doc => {
            const themeData = doc.data();
            themes[doc.id] = {
                id: doc.id,
                name: themeData.name,
                items: themeData.pieces || [],
                className: 'image-piece',
                category: themeData.category || 'images',
                status: themeData.status,
                isDefault: false,
                imageUrl: themeData.imageUrl
            };
        });
        
        console.log("Temas carregados:", Object.keys(themes).length);
        renderThemesGrid();
        
    } catch (error) {
        console.error("Erro ao carregar temas:", error);
    }
}

// Renderizar grid de temas
function renderThemesGrid() {
    if (!themesGrid) return;
    
    themesGrid.innerHTML = '';
    
    // Adicionar tema de imagem personalizada temporária
    const tempImageTheme = {
        id: 'custom-image-temp',
        name: "Imagem Personalizada (Temporária)",
        className: 'image-piece',
        category: 'images',
        isDefault: false,
        isTemporary: true
    };
    
    // Criar card para imagem temporária
    const tempThemeCard = document.createElement('div');
    tempThemeCard.className = 'theme-card';
    tempThemeCard.dataset.theme = 'custom-image-temp';
    
    if (currentTheme === 'custom-image-temp') {
        tempThemeCard.classList.add('active');
    }
    
    tempThemeCard.innerHTML = `
        <div class="theme-preview">
            <div class="theme-example">
                <i class="fas fa-image" style="font-size: 3rem; color: white;"></i>
            </div>
        </div>
        <div class="theme-info">
            <h3>Imagem Personalizada</h3>
            <p>Faça upload de uma imagem para jogar (apenas nesta sessão)</p>
        </div>
        ${currentTheme === 'custom-image-temp' ? '<div class="theme-badge"><i class="fas fa-check"></i> Ativo</div>' : ''}
    `;
    
    tempThemeCard.addEventListener('click', () => {
        imageUploadModal.style.display = 'flex';
        imagePreviewContainer.style.display = 'none';
        imageUploadForm.reset();
    });
    
    themesGrid.appendChild(tempThemeCard);
    
    // Adicionar temas padrão e personalizados
    Object.values(themes).forEach(theme => {
        if (theme.status === 'active' || theme.isDefault) {
            const themeCard = document.createElement('div');
            themeCard.className = 'theme-card';
            themeCard.dataset.theme = theme.id;
            
            if (currentTheme === theme.id) {
                themeCard.classList.add('active');
            }
            
            let previewContent = '';
            if (theme.category === 'numbers') {
                previewContent = '1 2 3 4<br>5 6 7 8<br>9 10 11 12<br>13 14 15';
            } else if (theme.category === 'words') {
                previewContent = 'R A C H A<br>C U C A &nbsp;<br>M A T O<br>A T A R';
            } else if (theme.category === 'emoji') {
                // Mostrar alguns emojis do tema
                const emojis = theme.items.slice(0, 4).join(' ') + '<br>' +
                              theme.items.slice(4, 8).join(' ') + '<br>' +
                              theme.items.slice(8, 12).join(' ') + '<br>' +
                              theme.items.slice(12, 16).join(' ');
                previewContent = emojis;
            } else if (theme.imageUrl) {
                // Para temas com imagem, mostrar preview da imagem
                themeCard.querySelector = function() {
                    const previewDiv = document.createElement('div');
                    previewDiv.className = 'theme-preview';
                    previewDiv.style.backgroundImage = `url(${theme.imageUrl})`;
                    previewDiv.style.backgroundSize = 'cover';
                    previewDiv.style.backgroundPosition = 'center';
                    return previewDiv;
                };
            }
            
            themeCard.innerHTML = `
                <div class="theme-preview" ${theme.imageUrl ? `style="background-image: url(${theme.imageUrl}); background-size: cover; background-position: center;"` : ''}>
                    ${!theme.imageUrl ? `<div class="theme-example">${previewContent}</div>` : ''}
                </div>
                <div class="theme-info">
                    <h3>${theme.name}</h3>
                    <p>${theme.isDefault ? 'Tema padrão' : 'Tema personalizado'}</p>
                </div>
                ${currentTheme === theme.id ? '<div class="theme-badge"><i class="fas fa-check"></i> Ativo</div>' : ''}
            `;
            
            themeCard.addEventListener('click', () => {
                if (theme.id === 'custom-image-temp') {
                    imageUploadModal.style.display = 'flex';
                } else {
                    changeTheme(theme.id);
                }
            });
            
            themesGrid.appendChild(themeCard);
        }
    });
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
    const theme = themes[currentTheme];
    
    if (currentTheme === 'custom-image-temp' && customImageData) {
        board = [...customImageData];
    } else if (theme && theme.items) {
        board = [...theme.items];
    } else {
        // Fallback para tema números
        board = [...themes.numbers.items];
        currentTheme = 'numbers';
    }
}

// Renderizar o tabuleiro com suporte a drag and drop
function renderBoard() {
    puzzleBoard.innerHTML = '';
    
    board.forEach((value, index) => {
        const tile = document.createElement('div');
        
        if (currentTheme === 'custom-image-temp' && customImageData) {
            tile.className = `puzzle-tile image-piece`;
        } else {
            const theme = themes[currentTheme];
            tile.className = `puzzle-tile ${theme ? theme.className : 'number'}`;
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
            if (currentTheme === 'custom-image-temp' && customImageData) {
                correctValue = customImageData[index];
            } else {
                const theme = themes[currentTheme];
                correctValue = theme ? theme.items[index] : themes.numbers.items[index];
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
    if (currentTheme === 'custom-image-temp' && customImageData) {
        board = [...customImageData];
    } else {
        const theme = themes[currentTheme];
        if (theme && theme.items) {
            board = [...theme.items];
        } else {
            board = [...themes.numbers.items];
        }
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
        if (currentTheme === 'custom-image-temp' && customImageData) {
            correctValue = customImageData[i];
        } else {
            const theme = themes[currentTheme];
            correctValue = theme ? theme.items[i] : themes.numbers.items[i];
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
        if (currentTheme === 'custom-image-temp' && customImageData) {
            correctValue = customImageData[i];
        } else {
            const theme = themes[currentTheme];
            correctValue = theme ? theme.items[i] : themes.numbers.items[i];
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
            theme: currentTheme === 'custom-image-temp' ? 'custom-image' : currentTheme,
            date: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Salvar no Firestore
        await db.collection('scores').add(scoreData);
        
        console.log("Pontuação salva automaticamente");
        
        // Atualizar estatísticas globais
        loadGlobalStats();
        
        // Se estiver na seção de progresso, atualizar gráficos
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
    
    // Usar o tema atual para a solução
    const currentThemeData = themes[currentTheme];
    
    if (currentTheme === 'custom-image-temp' && customImageData) {
        // Para imagem personalizada, mostrar a imagem completa redimensionada
        const container = document.createElement('div');
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        
        const img = document.createElement('img');
        img.src = customImageData[0]; // Usar a primeira peça como referência
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        img.style.borderRadius = '5px';
        img.alt = 'Solução do quebra-cabeça';
        
        container.appendChild(img);
        solutionBoard.appendChild(container);
    } else if (currentThemeData) {
        // Para temas normais, mostrar a grade de solução
        if (currentThemeData.category === 'numbers') {
            const solutionText = "1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15";
            const lines = solutionText.split('\n');
            
            lines.forEach(line => {
                const lineDiv = document.createElement('div');
                lineDiv.style.gridColumn = '1 / -1';
                lineDiv.style.display = 'flex';
                lineDiv.style.justifyContent = 'center';
                lineDiv.style.alignItems = 'center';
                lineDiv.style.fontSize = '1.1rem';
                lineDiv.style.fontWeight = '700';
                lineDiv.style.color = 'var(--primary-color)';
                lineDiv.textContent = line;
                solutionBoard.appendChild(lineDiv);
            });
        } else if (currentThemeData.imageUrl) {
            // Para temas com imagem, mostrar a imagem completa
            const container = document.createElement('div');
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
            
            const img = document.createElement('img');
            img.src = currentThemeData.imageUrl;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '100%';
            img.style.borderRadius = '5px';
            img.alt = `Solução do tema ${currentThemeData.name}`;
            
            container.appendChild(img);
            solutionBoard.appendChild(container);
        } else {
            // Para outros temas, mostrar representação textual
            const items = currentThemeData.items.slice(0, 15);
            const rows = [];
            for (let i = 0; i < 4; i++) {
                rows.push(items.slice(i * 4, i * 4 + 4).join(' '));
            }
            
            rows.forEach(row => {
                const lineDiv = document.createElement('div');
                lineDiv.style.gridColumn = '1 / -1';
                lineDiv.style.display = 'flex';
                lineDiv.style.justifyContent = 'center';
                lineDiv.style.alignItems = 'center';
                lineDiv.style.fontSize = currentThemeData.category === 'emoji' ? '1.4rem' : '1.1rem';
                lineDiv.style.fontWeight = '700';
                lineDiv.style.color = 'var(--primary-color)';
                lineDiv.textContent = row;
                solutionBoard.appendChild(lineDiv);
            });
        }
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
        renderThemesGrid();
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
    
    if (startPlayingProgressBtn) {
        startPlayingProgressBtn.addEventListener('click', () => {
            showSection('game-section');
            resetGame();
        });
    }
    
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
    
    // Gerenciamento de temas
    if (createThemeBtn) {
        createThemeBtn.addEventListener('click', () => {
            openThemeEditor();
        });
    }
    
    if (themeEditorForm) {
        themeEditorForm.addEventListener('submit', handleThemeEditorSubmit);
    }
    
    // Upload de imagem para tema
    const themeImageFile = document.getElementById('theme-image-file');
    if (themeImageFile) {
        themeImageFile.addEventListener('change', handleThemeImageUpload);
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
        const theme = themes[currentTheme];
        document.getElementById('current-theme').textContent = theme ? theme.name : 'Números';
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
    if (tabId === 'users-tab') {
        loadAdminUsers();
    } else if (tabId === 'scores-tab') {
        loadAdminScores();
    } else if (tabId === 'themes-admin-tab') {
        loadAdminThemes();
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
            
            // Atualizar interface para usuário logado
            updateUIForLoggedInUser(user);
            
            // Verificar se o usuário é administrador
            const isAdmin = await checkIfUserIsAdmin(user.uid);
            updateUIForAdmin(isAdmin);
            
            // Carregar dados do usuário
            await loadUserData(user.uid);
            
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
        
        // Se é o primeiro usuário do sistema, tornar admin
        const usersCount = await db.collection('users').count().get();
        if (usersCount.data().count === 0) {
            // Primeiro usuário, definir como admin
            const userData = {
                uid: uid,
                email: currentUser.email,
                name: currentUser.displayName || currentUser.email.split('@')[0],
                role: 'admin',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'active'
            };
            
            await db.collection('users').doc(uid).set(userData);
            return true;
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
        
        // Verificar se é o primeiro usuário
        const usersCount = await db.collection('users').count().get();
        const isFirstUser = usersCount.data().count === 0;
        
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
        
        // Atualizar UI se for admin
        if (isFirstUser) {
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
        
        // Configurar persistência baseada na opção "Lembrar-me"
        const persistence = rememberMeCheckbox && rememberMeCheckbox.checked ? 
            firebase.auth.Auth.Persistence.LOCAL : 
            firebase.auth.Auth.Persistence.SESSION;
        
        await firebase.auth().setPersistence(persistence);
        
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
        
        // Determinar a função do usuário
        const usersCount = await db.collection('users').count().get();
        const isFirstUser = usersCount.data().count === 0;
        const userRole = isFirstUser ? 'admin' : 'player';
        
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
            
            // Atualizar UI se for admin
            if (isFirstUser) {
                updateUIForAdmin(true);
            }
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
        
        // Limpar dados da sessão
        currentUser = null;
        isGuest = false;
        
        // Redirecionar para a página inicial
        showSection('home-section');
        
        // Atualizar UI
        updateUIForLoggedOutUser();
        
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
function changeTheme(themeId) {
    if (!themes[themeId]) {
        console.error("Tema não encontrado:", themeId);
        return;
    }
    
    const theme = themes[themeId];
    currentTheme = themeId;
    
    // Atualizar nome do tema na interface
    document.getElementById('current-theme').textContent = theme.name;
    
    // Recriar o tabuleiro com o novo tema
    createBoard();
    renderBoard();
    createSolutionBoard();
    
    // Se estiver na seção de temas, voltar para o jogo
    if (themesSection.classList.contains('active')) {
        showSection('game-section');
    }
    
    // Atualizar grid de temas
    renderThemesGrid();
}

// Manipular upload de imagem para jogo temporário
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
    
    // Verificar tamanho da imagem (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showFormMessage(messageElement, 'A imagem deve ter no máximo 5MB.', 'error');
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
            
            // Redimensionar imagem se for muito grande
            let width = img.width;
            let height = img.height;
            const maxSize = 800;
            
            if (width > maxSize || height > maxSize) {
                if (width > height) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                } else {
                    width = (width * maxSize) / height;
                    height = maxSize;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            // Tamanho de cada peça (dividir em 4x4)
            const pieceWidth = width / 4;
            const pieceHeight = height / 4;
            
            // Limpar preview board
            previewBoard.innerHTML = '';
            previewBoard.style.gridTemplateColumns = 'repeat(4, 1fr)';
            previewBoard.style.gridTemplateRows = 'repeat(4, 1fr)';
            previewBoard.style.gap = '4px';
            previewBoard.style.padding = '4px';
            
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
                        canvas,
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
            
            showFormMessage(messageElement, 'Imagem processada com sucesso! Clique em "Usar Esta Imagem" para aplicar.', 'success');
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
    
    // Fechar modal
    imageUploadModal.style.display = 'none';
    
    // Mudar para o tema de imagem personalizada temporária
    currentTheme = 'custom-image-temp';
    
    // Atualizar interface
    document.getElementById('current-theme').textContent = 'Imagem Personalizada';
    
    // Recriar o jogo com a nova imagem
    createBoard();
    renderBoard();
    createSolutionBoard();
    
    // Limpar formulário
    imageUploadForm.reset();
    imagePreviewContainer.style.display = 'none';
    clearFormMessage(document.getElementById('image-upload-message'));
    
    // Atualizar grid de temas
    renderThemesGrid();
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
        let query = db.collection('scores').orderBy('moves').orderBy('time').limit(50);
        
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
                
                // Obter nome do tema
                const themeName = themes[score.theme] ? themes[score.theme].name : score.theme;
                
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
        if (progressLoading) progressLoading.style.display = 'none';
        if (userStats) userStats.style.display = 'none';
        if (noProgress) noProgress.style.display = 'block';
        return;
    }
    
    if (progressLoading) progressLoading.style.display = 'flex';
    if (userStats) userStats.style.display = 'none';
    if (noProgress) noProgress.style.display = 'none';
    
    try {
        // Carregar pontuações do usuário
        const scoresSnapshot = await db.collection('scores')
            .where('userId', '==', currentUser.uid)
            .orderBy('date', 'desc')
            .limit(100)
            .get();
        
        if (scoresSnapshot.empty) {
            if (progressLoading) progressLoading.style.display = 'none';
            if (userStats) userStats.style.display = 'none';
            if (noProgress) noProgress.style.display = 'block';
            return;
        }
        
        const scores = [];
        scoresSnapshot.forEach(doc => {
            const data = doc.data();
            scores.push({
                ...data,
                date: data.date && data.date.toDate ? data.date.toDate() : new Date()
            });
        });
        
        // Calcular estatísticas
        const totalGames = scores.length;
        let bestMoves = Infinity;
        let bestTime = Infinity;
        let totalMoves = 0;
        let totalTime = 0;
        
        // Agrupar por dificuldade e tema
        const difficultyStats = {};
        const themeStats = {};
        
        scores.forEach(score => {
            // Melhores pontuações
            if (score.moves < bestMoves) bestMoves = score.moves;
            if (score.time < bestTime) bestTime = score.time;
            
            // Totais
            totalMoves += score.moves;
            totalTime += score.time;
            
            // Estatísticas por dificuldade
            if (!difficultyStats[score.difficulty]) {
                difficultyStats[score.difficulty] = {
                    count: 0,
                    totalMoves: 0,
                    totalTime: 0
                };
            }
            difficultyStats[score.difficulty].count++;
            difficultyStats[score.difficulty].totalMoves += score.moves;
            difficultyStats[score.difficulty].totalTime += score.time;
            
            // Estatísticas por tema
            const themeKey = score.theme || 'unknown';
            if (!themeStats[themeKey]) {
                themeStats[themeKey] = {
                    count: 0,
                    totalMoves: 0,
                    totalTime: 0
                };
            }
            themeStats[themeKey].count++;
            themeStats[themeKey].totalMoves += score.moves;
            themeStats[themeKey].totalTime += score.time;
        });
        
        // Atualizar estatísticas na interface
        document.getElementById('total-games-user').textContent = totalGames;
        document.getElementById('best-moves').textContent = bestMoves === Infinity ? 0 : bestMoves;
        document.getElementById('best-time').textContent = bestTime === Infinity ? '00:00' : formatTime(bestTime);
        document.getElementById('avg-moves-user').textContent = totalGames > 0 ? Math.round(totalMoves / totalGames) : 0;
        
        // Atualizar gráficos
        updateCharts(difficultyStats, themeStats);
        
        // Atualizar jogos recentes
        updateRecentGames(scores.slice(0, 10));
        
        if (progressLoading) progressLoading.style.display = 'none';
        if (userStats) userStats.style.display = 'block';
        
    } catch (error) {
        console.error("Erro ao carregar progresso do usuário:", error);
        if (progressLoading) progressLoading.style.display = 'none';
        if (userStats) userStats.style.display = 'none';
        if (noProgress) noProgress.style.display = 'block';
    }
}

// Atualizar gráficos
function updateCharts(difficultyStats, themeStats) {
    // Gráfico por dificuldade
    const difficultyCtx = document.getElementById('difficulty-chart');
    if (difficultyCtx) {
        // Destruir gráfico anterior se existir
        if (window.difficultyChartInstance) {
            window.difficultyChartInstance.destroy();
        }
        
        const labels = [];
        const data = [];
        const colors = ['#4CAF50', '#2196F3', '#FF9800'];
        
        ['easy', 'normal', 'hard'].forEach((diff, index) => {
            if (difficultyStats[diff]) {
                labels.push(getDifficultyText(diff));
                const avgMoves = Math.round(difficultyStats[diff].totalMoves / difficultyStats[diff].count);
                data.push(avgMoves);
            }
        });
        
        window.difficultyChartInstance = new Chart(difficultyCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Média de Movimentos',
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderColor: colors.slice(0, labels.length).map(c => c.replace('0.8', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
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
    
    // Gráfico por tema
    const themeCtx = document.getElementById('theme-chart');
    if (themeCtx) {
        // Destruir gráfico anterior se existir
        if (window.themeChartInstance) {
            window.themeChartInstance.destroy();
        }
        
        const labels = [];
        const data = [];
        const backgroundColors = [];
        
        Object.keys(themeStats).slice(0, 8).forEach((themeKey, index) => {
            const themeName = themes[themeKey] ? themes[themeKey].name : themeKey;
            labels.push(themeName);
            const avgMoves = Math.round(themeStats[themeKey].totalMoves / themeStats[themeKey].count);
            data.push(avgMoves);
            
            // Gerar cor baseada no índice
            const hue = (index * 45) % 360;
            backgroundColors.push(`hsl(${hue}, 70%, 60%)`);
        });
        
        window.themeChartInstance = new Chart(themeCtx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Média de Movimentos',
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(c => c.replace('0.8', '1')),
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
    }
}

// Atualizar jogos recentes
function updateRecentGames(recentScores) {
    const recentGamesList = document.getElementById('recent-games-list');
    if (!recentGamesList) return;
    
    recentGamesList.innerHTML = '';
    
    recentScores.forEach(score => {
        const gameItem = document.createElement('div');
        gameItem.className = 'recent-game-item';
        
        const themeName = themes[score.theme] ? themes[score.theme].name : score.theme;
        const dateStr = score.date.toLocaleDateString('pt-BR');
        
        gameItem.innerHTML = `
            <div class="recent-game-info">
                <div class="recent-game-theme">${themeName}</div>
                <div class="recent-game-details">${dateStr} • ${getDifficultyText(score.difficulty)}</div>
            </div>
            <div class="recent-game-score">
                <div class="recent-game-moves">${score.moves} movimentos</div>
                <div class="recent-game-time">${formatTime(score.time)}</div>
            </div>
        `;
        
        recentGamesList.appendChild(gameItem);
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
                    
                    // Obter nome do tema
                    const themeName = themes[score.theme] ? themes[score.theme].name : score.theme;
                    
                    scoreItem.innerHTML = `
                        <div class="score-date">${formattedDate} ${formattedTime}</div>
                        <div class="score-info">
                            <span class="score-user">${score.userName}</span>
                            <span class="score-difficulty">${getDifficultyText(score.difficulty)} • ${themeName}</span>
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

// Carregar temas para administração
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
        // Carregar temas personalizados do Firestore
        const themesSnapshot = await db.collection('themes').orderBy('name').get();
        
        const adminThemes = [];
        themesSnapshot.forEach(doc => {
            const themeData = doc.data();
            adminThemes.push({
                id: doc.id,
                ...themeData
            });
        });
        
        // Atualizar lista de temas
        if (themesListElement) {
            if (adminThemes.length === 0) {
                themesListElement.innerHTML = '<p class="no-themes">Nenhum tema personalizado encontrado.</p>';
            } else {
                adminThemes.forEach(theme => {
                    const themeItem = document.createElement('div');
                    themeItem.className = 'theme-admin-item';
                    
                    themeItem.innerHTML = `
                        <div class="theme-admin-preview" style="background-image: url(${theme.imageUrl})"></div>
                        <div class="theme-admin-info">
                            <div class="theme-admin-name">${theme.name}</div>
                            <div class="theme-admin-category">${theme.category}</div>
                            <span class="theme-admin-status ${theme.status}">${theme.status === 'active' ? 'Ativo' : 'Inativo'}</span>
                        </div>
                        <div class="theme-admin-actions">
                            <button class="btn btn-secondary btn-icon edit-theme-btn" data-theme-id="${theme.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger btn-icon delete-theme-btn" data-theme-id="${theme.id}">
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
                        openThemeEditor(themeId);
                    });
                });
                
                const deleteButtons = document.querySelectorAll('.delete-theme-btn');
                deleteButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        const themeId = this.dataset.themeId;
                        deleteTheme(themeId);
                    });
                });
            }
        }
        
    } catch (error) {
        console.error("Erro ao carregar temas:", error);
        if (themesListElement) {
            themesListElement.innerHTML = '<p class="error-message">Erro ao carregar temas. Tente novamente.</p>';
        }
    } finally {
        if (loadingElement) loadingElement.style.display = 'none';
    }
}

// Abrir editor de tema
async function openThemeEditor(themeId = null) {
    const modalTitle = document.getElementById('theme-modal-title');
    const submitText = document.getElementById('theme-submit-text');
    const form = document.getElementById('theme-editor-form');
    
    if (themeId) {
        // Modo edição
        modalTitle.textContent = 'Editar Tema';
        submitText.textContent = 'Atualizar Tema';
        
        try {
            const themeDoc = await db.collection('themes').doc(themeId).get();
            if (themeDoc.exists) {
                const themeData = themeDoc.data();
                
                document.getElementById('edit-theme-id').value = themeId;
                document.getElementById('theme-name').value = themeData.name || '';
                document.getElementById('theme-category').value = themeData.category || 'images';
                document.getElementById('theme-status').value = themeData.status || 'active';
                
                // Mostrar preview se houver imagem
                if (themeData.imageUrl) {
                    document.getElementById('theme-preview-container').style.display = 'block';
                    const previewBoard = document.getElementById('theme-preview-board');
                    previewBoard.style.backgroundImage = `url(${themeData.imageUrl})`;
                    previewBoard.style.backgroundSize = 'cover';
                    previewBoard.style.backgroundPosition = 'center';
                }
            }
        } catch (error) {
            console.error("Erro ao carregar tema para edição:", error);
            alert('Erro ao carregar dados do tema.');
            return;
        }
    } else {
        // Modo criação
        modalTitle.textContent = 'Criar Novo Tema';
        submitText.textContent = 'Salvar Tema';
        
        // Limpar formulário
        form.reset();
        document.getElementById('edit-theme-id').value = '';
        document.getElementById('theme-preview-container').style.display = 'none';
    }
    
    themeEditorModal.style.display = 'flex';
}

// Manipular upload de imagem para tema
function handleThemeImageUpload(e) {
    const file = e.target.files[0];
    const previewContainer = document.getElementById('theme-preview-container');
    const previewBoard = document.getElementById('theme-preview-board');
    
    if (!file) return;
    
    // Verificar se é uma imagem
    if (!file.type.match('image.*')) {
        alert('Por favor, selecione um arquivo de imagem.');
        e.target.value = '';
        return;
    }
    
    // Verificar tamanho da imagem (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB.');
        e.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            // Redimensionar imagem se for muito grande
            let width = img.width;
            let height = img.height;
            const maxSize = 800;
            
            if (width > maxSize || height > maxSize) {
                if (width > height) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                } else {
                    width = (width * maxSize) / height;
                    height = maxSize;
                }
            }
            
            // Criar canvas para redimensionar
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Atualizar preview
            previewBoard.style.backgroundImage = `url(${canvas.toDataURL('image/jpeg', 0.8)})`;
            previewBoard.style.backgroundSize = 'cover';
            previewBoard.style.backgroundPosition = 'center';
            previewContainer.style.display = 'block';
        };
        
        img.src = event.target.result;
    };
    
    reader.readAsDataURL(file);
}

// Manipular envio do formulário de tema
async function handleThemeEditorSubmit(e) {
    e.preventDefault();
    
    const themeId = document.getElementById('edit-theme-id').value;
    const name = document.getElementById('theme-name').value;
    const category = document.getElementById('theme-category').value;
    const status = document.getElementById('theme-status').value;
    const imageFile = document.getElementById('theme-image-file').files[0];
    const messageElement = document.getElementById('theme-editor-message');
    const loadingElement = document.getElementById('theme-editor-loading');
    
    // Validar entrada
    if (!name || !category || !status) {
        showFormMessage(messageElement, 'Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    // Em modo criação, é obrigatório ter uma imagem
    if (!themeId && !imageFile) {
        showFormMessage(messageElement, 'Por favor, selecione uma imagem para o tema.', 'error');
        return;
    }
    
    try {
        // Mostrar loading
        if (loadingElement) loadingElement.style.display = 'flex';
        showFormMessage(messageElement, 'Processando tema...', 'info');
        
        let imageUrl = '';
        let pieces = [];
        
        // Processar imagem se for fornecida
        if (imageFile) {
            const reader = new FileReader();
            
            await new Promise((resolve, reject) => {
                reader.onload = async function(event) {
                    try {
                        const img = new Image();
                        
                        await new Promise((imgResolve, imgReject) => {
                            img.onload = function() {
                                // Redimensionar imagem
                                let width = img.width;
                                let height = img.height;
                                const maxSize = 800;
                                
                                if (width > maxSize || height > maxSize) {
                                    if (width > height) {
                                        height = (height * maxSize) / width;
                                        width = maxSize;
                                    } else {
                                        width = (width * maxSize) / height;
                                        height = maxSize;
                                    }
                                }
                                
                                // Criar canvas para imagem completa
                                const fullCanvas = document.createElement('canvas');
                                fullCanvas.width = width;
                                fullCanvas.height = height;
                                const fullCtx = fullCanvas.getContext('2d');
                                fullCtx.drawImage(img, 0, 0, width, height);
                                
                                // Gerar URL da imagem completa
                                imageUrl = fullCanvas.toDataURL('image/jpeg', 0.8);
                                
                                // Dividir imagem em peças
                                const pieceWidth = width / 4;
                                const pieceHeight = height / 4;
                                
                                for (let row = 0; row < 4; row++) {
                                    for (let col = 0; col < 4; col++) {
                                        // Criar canvas para cada peça
                                        const pieceCanvas = document.createElement('canvas');
                                        pieceCanvas.width = pieceWidth;
                                        pieceCanvas.height = pieceHeight;
                                        const pieceCtx = pieceCanvas.getContext('2d');
                                        
                                        // Desenhar a parte da imagem
                                        pieceCtx.drawImage(
                                            fullCanvas,
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
                                            pieces.push(null);
                                        } else {
                                            pieces.push(dataUrl);
                                        }
                                    }
                                }
                                
                                imgResolve();
                            };
                            
                            img.onerror = imgReject;
                            img.src = event.target.result;
                        });
                        
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                };
                
                reader.onerror = reject;
                reader.readAsDataURL(imageFile);
            });
        }
        
        // Preparar dados do tema
        const themeData = {
            name: name,
            category: category,
            status: status,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: currentUser.uid
        };
        
        // Adicionar imagem se processada
        if (imageUrl) {
            themeData.imageUrl = imageUrl;
            themeData.pieces = pieces;
        }
        
        // Salvar no Firestore
        if (themeId) {
            // Atualizar tema existente
            await db.collection('themes').doc(themeId).update(themeData);
            showFormMessage(messageElement, 'Tema atualizado com sucesso!', 'success');
        } else {
            // Criar novo tema
            themeData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            themeData.createdBy = currentUser.uid;
            
            await db.collection('themes').add(themeData);
            showFormMessage(messageElement, 'Tema criado com sucesso!', 'success');
        }
        
        // Recarregar temas após 1.5 segundos
        setTimeout(() => {
            themeEditorModal.style.display = 'none';
            clearFormMessage(messageElement);
            if (loadingElement) loadingElement.style.display = 'none';
            
            // Recarregar temas
            loadThemesFromFirestore().then(() => {
                loadAdminThemes();
            });
            
            // Limpar formulário
            document.getElementById('theme-editor-form').reset();
            document.getElementById('theme-preview-container').style.display = 'none';
        }, 1500);
        
    } catch (error) {
        console.error("Erro ao salvar tema:", error);
        showFormMessage(messageElement, 'Erro ao salvar tema. Tente novamente.', 'error');
        if (loadingElement) loadingElement.style.display = 'none';
    }
}

// Excluir tema
async function deleteTheme(themeId) {
    if (!confirm('Tem certeza que deseja excluir este tema? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        await db.collection('themes').doc(themeId).delete();
        
        // Recarregar temas
        loadThemesFromFirestore().then(() => {
            loadAdminThemes();
        });
        
        alert('Tema excluído com sucesso!');
        
    } catch (error) {
        console.error("Erro ao excluir tema:", error);
        alert('Erro ao excluir tema. Tente novamente.');
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
