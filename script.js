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
let imageUploadModal, imageUploadForm, imageFileInput, useImageBtn, imagePreviewContainer, saveImageThemeBtn;
let themeEditModal, themeEditForm, themeNameInput, themeDescriptionInput, themeImageFileInput;
let savePuzzleBtn;

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
let customImagePreview = null;

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

// Variáveis para gráficos
let userDifficultyChart = null;
let userTimelineChart = null;
let adminDifficultyChart = null;
let adminDailyChart = null;

// Inicialização do aplicativo
document.addEventListener('DOMContentLoaded', function() {
    initializeFirebase();
    initializeDOMElements();
    initializeGame();
    setupEventListeners();
    checkAuthState();
    initializePreviewBoard();
    loadGlobalStats();
    
    // Verificar se há um usuário salvo no localStorage
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
        
        // Atualizar a interface baseado na existência de administrador
        updateAdminRegisterOption();
    } catch (error) {
        console.error("Erro ao verificar administrador:", error);
    }
}

// Atualizar opção de cadastro como administrador
function updateAdminRegisterOption() {
    const adminCheckbox = document.getElementById('register-admin');
    const adminContainer = document.getElementById('admin-register-container');
    
    if (adminCheckbox && adminContainer) {
        if (adminUserExists) {
            adminContainer.style.display = 'none';
        } else {
            adminContainer.style.display = 'block';
        }
    }
}

// Verificar se há usuário lembrado
function checkRememberedUser() {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
        try {
            const userData = JSON.parse(rememberedUser);
            if (userData.email && userData.password) {
                // Preencher formulário de login automaticamente
                document.getElementById('login-email').value = userData.email;
                document.getElementById('login-password').value = userData.password;
                document.getElementById('remember-me').checked = true;
            }
        } catch (e) {
            console.log("Erro ao carregar usuário lembrado:", e);
        }
    }
}

// Salvar credenciais do usuário
function saveUserCredentials(email, password) {
    const rememberMe = document.getElementById('remember-me');
    if (rememberMe && rememberMe.checked) {
        const userData = { email: email, password: password };
        localStorage.setItem('rememberedUser', JSON.stringify(userData));
    } else {
        localStorage.removeItem('rememberedUser');
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
    savePuzzleBtn = document.getElementById('save-puzzle-btn');
    difficultyBtns = document.querySelectorAll('.difficulty-btn');
    themeCards = document.querySelectorAll('.theme-card');
    
    // Seções da página
    homeSection = document.getElementById('home-section');
    gameSection = document.getElementById('game-section');
    rankingSection = document.getElementById('ranking-section');
    progressSection = document.getElementById('progress-section');
    themesSection = document.getElementById('themes-section');
    adminSection = document.getElementById('admin-section');
    
    // Navegação
    const navHome = document.getElementById('nav-home');
    const navGame = document.getElementById('nav-game');
    const navRanking = document.getElementById('nav-ranking');
    const navProgress = document.getElementById('nav-progress');
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
    
    // Modal de upload de imagem
    imageUploadModal = document.getElementById('image-upload-modal');
    imageUploadForm = document.getElementById('image-upload-form');
    imageFileInput = document.getElementById('image-file');
    useImageBtn = document.getElementById('use-image-btn');
    saveImageThemeBtn = document.getElementById('save-image-theme-btn');
    imagePreviewContainer = document.getElementById('image-preview-container');
    
    // Modal de edição de tema
    themeEditModal = document.getElementById('theme-edit-modal');
    themeEditForm = document.getElementById('theme-edit-form');
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
    if (currentTheme === 'custom-image' && customImageData) {
        board = [...customImageData];
    } else {
        board = [...themes[currentTheme].items];
    }
}

// Renderizar o tabuleiro com suporte a drag and drop
function renderBoard() {
    puzzleBoard.innerHTML = '';
    
    board.forEach((value, index) => {
        const tile = document.createElement('div');
        tile.className = `puzzle-tile ${themes[currentTheme].className}`;
        
        if (value === null) {
            tile.classList.add('empty');
            tile.textContent = '';
            emptyTileIndex = index;
        } else {
            // Verificar se é uma URL de imagem
            if (typeof value === 'string' && (value.startsWith('data:image') || value.startsWith('blob:'))) {
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
            } else {
                correctValue = themes[currentTheme].items[index];
            }
            
            if (value === correctValue) {
                tile.classList.add('correct-position');
            }
            
            // Verificar se a peça pode ser movida
            if (isMovable(index)) {
                tile.classList.add('movable');
                tile.addEventListener('click', () => moveTile(index));
            } else {
                tile.style.cursor = 'default';
            }
        }
        
        puzzleBoard.appendChild(tile);
    });
    
    // Atualizar botão de salvar puzzle
    if (savePuzzleBtn) {
        if (currentUser && currentUser.role === 'admin' && currentTheme === 'custom-image' && customImageData) {
            savePuzzleBtn.style.display = 'inline-block';
        } else {
            savePuzzleBtn.style.display = 'none';
        }
    }
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
        
        // Carregar estatísticas do usuário
        loadUserProgress();
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
    
    if (currentTheme === 'custom-image' && customImagePreview) {
        // Para imagem personalizada, mostrar a imagem completa
        const solutionImage = document.createElement('div');
        solutionImage.className = 'solution-image';
        solutionImage.style.backgroundImage = `url(${customImagePreview})`;
        solutionImage.style.backgroundSize = 'cover';
        solutionImage.style.backgroundPosition = 'center';
        solutionImage.style.width = '100%';
        solutionImage.style.height = '200px';
        solutionImage.style.borderRadius = '8px';
        solutionImage.style.margin = '10px 0';
        
        solutionBoard.appendChild(solutionImage);
        
        // Adicionar legenda
        const caption = document.createElement('p');
        caption.textContent = 'Imagem completa (solução)';
        caption.style.textAlign = 'center';
        caption.style.fontSize = '0.9rem';
        caption.style.color = '#7f8c8d';
        caption.style.marginTop = '5px';
        
        solutionBoard.appendChild(caption);
    } else {
        // Usar o tema atual para a solução
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
    if (savePuzzleBtn) savePuzzleBtn.addEventListener('click', savePuzzleAsTheme);
    
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
                    // Verificar se é admin para mostrar opção de salvar
                    const isAdmin = currentUser && currentUser.role === 'admin';
                    
                    // Abrir modal para upload de imagem
                    imageUploadModal.style.display = 'flex';
                    imagePreviewContainer.style.display = 'none';
                    imageUploadForm.reset();
                    
                    // Mostrar botão de salvar como tema apenas para admin
                    if (isAdmin) {
                        saveImageThemeBtn.style.display = 'inline-block';
                    } else {
                        saveImageThemeBtn.style.display = 'none';
                    }
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
        loadUserProgress();
    });
    if (navThemes) navThemes.addEventListener('click', () => {
        showSection('themes-section');
        loadSavedThemes();
    });
    if (navAdmin) navAdmin.addEventListener('click', () => {
        showSection('admin-section');
        loadAdminUsers();
        loadAdminThemes();
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
    if (createThemeBtn) createThemeBtn.addEventListener('click', openCreateThemeModal);
    
    // Upload de imagem
    if (imageUploadForm) {
        imageUploadForm.addEventListener('submit', handleImageUpload);
    }
    
    if (useImageBtn) {
        useImageBtn.addEventListener('click', useCustomImage);
    }
    
    if (saveImageThemeBtn) {
        saveImageThemeBtn.addEventListener('click', saveCustomImageAsTheme);
    }
    
    // Formulário de edição de tema
    if (themeEditForm) {
        themeEditForm.addEventListener('submit', handleThemeSave);
    }
    
    if (themeImageFileInput) {
        themeImageFileInput.addEventListener('change', previewThemeImage);
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
        document.getElementById('current-theme').textContent = themes[currentTheme].name;
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
            
            // Carregar temas salvos se for admin
            if (isAdmin) {
                loadSavedThemes();
            }
            
            // Carregar progresso do usuário
            loadUserProgress();
            
        } else if (!isGuest) {
            // Usuário não está logado e não é visitante
            currentUser = null;
            
            // Atualizar interface para usuário não logado
            updateUIForLoggedOutUser();
        }
    });
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
    
    // Mostrar seção de temas salvos se for admin
    const savedThemesSection = document.getElementById('saved-themes-section');
    if (savedThemesSection && currentUser && currentUser.role === 'admin') {
        savedThemesSection.style.display = 'block';
    }
}

// Atualizar UI para usuário não logado
function updateUIForLoggedOutUser() {
    // Mostrar botões de autenticação
    if (userInfoContainer) userInfoContainer.style.display = 'none';
    if (authButtons) authButtons.style.display = 'flex';
    
    // Esconder link para admin
    if (adminNavItem) adminNavItem.style.display = 'none';
    
    // Esconder seção de temas salvos
    const savedThemesSection = document.getElementById('saved-themes-section');
    if (savedThemesSection) {
        savedThemesSection.style.display = 'none';
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
            
            // Atualizar informações do usuário
            updateProfileInfo(userData);
            
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

// Atualizar informações do perfil
function updateProfileInfo(userData) {
    // Atualizar elementos do perfil se estiverem visíveis
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileRole = document.getElementById('profile-role');
    const profileJoined = document.getElementById('profile-joined');
    
    if (profileName && userData.name) {
        profileName.textContent = userData.name;
    }
    
    if (profileEmail && userData.email) {
        profileEmail.textContent = userData.email;
    }
    
    if (profileRole) {
        profileRole.textContent = userData.role === 'admin' ? 'Administrador' : 'Jogador';
    }
    
    if (profileJoined && userData.createdAt) {
        // Converter timestamp do Firestore para data
        const date = userData.createdAt.toDate ? userData.createdAt.toDate() : new Date();
        profileJoined.textContent = `Membro desde: ${date.toLocaleDateString('pt-BR')}`;
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
        
        // Salvar credenciais se "Lembrar-me" estiver marcado
        const rememberMe = document.getElementById('remember-me').checked;
        if (rememberMe) {
            saveUserCredentials(email, password);
        }
        
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
    const isAdmin = document.getElementById('register-admin') ? document.getElementById('register-admin').checked : false;
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
    
    // Verificar se já existe um administrador
    if (isAdmin && adminUserExists) {
        showFormMessage(messageElement, 'Já existe um administrador no sistema. Apenas o administrador master pode criar novos administradores.', 'error');
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
        const userRole = isAdmin ? 'admin' : 'player';
        
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
        
        // Atualizar a flag de administrador existente
        if (isAdmin) {
            adminUserExists = true;
            updateAdminRegisterOption();
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
        await auth.signOut();
        console.log("Usuário deslogado com sucesso");
        
        // Limpar credenciais salvas
        localStorage.removeItem('rememberedUser');
        
        // Redirecionar para a página inicial
        showSection('home-section');
        isGuest = false;
        currentUser = null;
        
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
    if (!themes[theme] && !theme.startsWith('saved-')) return;
    
    // Atualizar cards de tema
    const allThemeCards = document.querySelectorAll('.theme-card, .saved-theme-card');
    allThemeCards.forEach(card => {
        card.classList.remove('active');
    });
    
    // Ativar card correspondente
    const themeCard = document.querySelector(`[data-theme="${theme}"]`);
    if (themeCard) {
        themeCard.classList.add('active');
    }
    
    // Se for um tema salvo, carregar do Firestore
    if (theme.startsWith('saved-')) {
        loadSavedTheme(theme.replace('saved-', ''));
    } else {
        currentTheme = theme;
        
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
}

// Carregar tema salvo do Firestore
async function loadSavedTheme(themeId) {
    try {
        const themeDoc = await db.collection('savedThemes').doc(themeId).get();
        
        if (themeDoc.exists) {
            const themeData = themeDoc.data();
            
            // Processar as peças da imagem
            const imagePieces = themeData.pieces || [];
            
            // Atualizar variáveis do tema
            customImageData = imagePieces;
            customImagePreview = themeData.preview || imagePieces[0];
            currentTheme = 'custom-image';
            
            // Atualizar nome do tema na interface
            document.getElementById('current-theme').textContent = themeData.name;
            
            // Recriar o tabuleiro com o novo tema
            createBoard();
            renderBoard();
            createSolutionBoard();
            
            // Se estiver na seção de temas, voltar para o jogo
            if (themesSection.classList.contains('active')) {
                showSection('game-section');
            }
        }
    } catch (error) {
        console.error("Erro ao carregar tema salvo:", error);
        alert('Erro ao carregar tema. Tente novamente.');
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
            
            // Salvar a imagem completa para preview
            const fullImageCanvas = document.createElement('canvas');
            fullImageCanvas.width = img.width;
            fullImageCanvas.height = img.height;
            const fullImageCtx = fullImageCanvas.getContext('2d');
            fullImageCtx.drawImage(img, 0, 0);
            const fullImageData = fullImageCanvas.toDataURL('image/jpeg', 0.7);
            customImagePreview = fullImageData;
            
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
                    const dataUrl = pieceCanvas.toDataURL('image/jpeg', 0.7);
                    
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
    
    // Fechar modal
    imageUploadModal.style.display = 'none';
    
    // Mudar para o tema de imagem personalizada
    currentTheme = 'custom-image';
    document.getElementById('current-theme').textContent = 'Imagem Personalizada';
    
    // Criar tabuleiro com imagem personalizada
    createBoard();
    renderBoard();
    createSolutionBoard();
    
    // Limpar formulário
    imageUploadForm.reset();
    imagePreviewContainer.style.display = 'none';
    clearFormMessage(document.getElementById('image-upload-message'));
}

// Salvar imagem personalizada como tema (apenas para admin)
async function saveCustomImageAsTheme() {
    if (!currentUser || currentUser.role !== 'admin') {
        alert('Apenas administradores podem salvar temas.');
        return;
    }
    
    if (!customImageData || !customImagePreview) {
        alert('Por favor, faça upload de uma imagem primeiro.');
        return;
    }
    
    const themeName = prompt('Digite um nome para este tema:');
    if (!themeName) return;
    
    try {
        // Salvar tema no Firestore
        const themeData = {
            name: themeName,
            pieces: customImageData,
            preview: customImagePreview,
            createdBy: currentUser.uid,
            createdByName: currentUser.displayName || currentUser.email.split('@')[0],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            isPublic: true
        };
        
        const docRef = await db.collection('savedThemes').add(themeData);
        
        alert('Tema salvo com sucesso!');
        
        // Fechar modal
        imageUploadModal.style.display = 'none';
        
        // Atualizar lista de temas salvos
        loadSavedThemes();
        
    } catch (error) {
        console.error("Erro ao salvar tema:", error);
        alert('Erro ao salvar tema. Tente novamente.');
    }
}

// Salvar puzzle como tema (apenas para admin)
async function savePuzzleAsTheme() {
    if (!currentUser || currentUser.role !== 'admin') {
        alert('Apenas administradores podem salvar temas.');
        return;
    }
    
    if (!customImageData || !customImagePreview) {
        alert('Não há imagem personalizada para salvar.');
        return;
    }
    
    const themeName = prompt('Digite um nome para este tema:');
    if (!themeName) return;
    
    try {
        // Salvar tema no Firestore
        const themeData = {
            name: themeName,
            pieces: customImageData,
            preview: customImagePreview,
            createdBy: currentUser.uid,
            createdByName: currentUser.displayName || currentUser.email.split('@')[0],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            isPublic: true
        };
        
        const docRef = await db.collection('savedThemes').add(themeData);
        
        alert('Tema salvo com sucesso!');
        
        // Atualizar lista de temas salvos
        loadSavedThemes();
        
    } catch (error) {
        console.error("Erro ao salvar tema:", error);
        alert('Erro ao salvar tema. Tente novamente.');
    }
}

// Carregar temas salvos
async function loadSavedThemes() {
    try {
        const savedThemesGrid = document.getElementById('saved-themes-grid');
        if (!savedThemesGrid) return;
        
        // Limpar grid
        savedThemesGrid.innerHTML = '';
        
        // Buscar temas salvos
        const themesSnapshot = await db.collection('savedThemes')
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();
        
        if (themesSnapshot.empty) {
            savedThemesGrid.innerHTML = '<p class="no-themes">Nenhum tema salvo encontrado.</p>';
            return;
        }
        
        themesSnapshot.forEach(doc => {
            const themeData = doc.data();
            const themeId = doc.id;
            
            const themeCard = document.createElement('div');
            themeCard.className = 'saved-theme-card theme-card';
            themeCard.dataset.theme = `saved-${themeId}`;
            
            themeCard.innerHTML = `
                <div class="theme-preview">
                    <div class="theme-example">
                        <div class="saved-theme-preview" style="width: 100%; height: 100%; background-image: url(${themeData.preview}); background-size: cover; background-position: center; border-radius: 4px;"></div>
                    </div>
                </div>
                <div class="theme-info">
                    <h3>${themeData.name}</h3>
                    <p>Criado por: ${themeData.createdByName}</p>
                </div>
                ${currentUser && currentUser.role === 'admin' ? `
                <div class="theme-actions">
                    <button class="btn btn-icon btn-small delete-theme-btn" data-theme-id="${themeId}" title="Excluir tema">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                ` : ''}
            `;
            
            savedThemesGrid.appendChild(themeCard);
            
            // Adicionar evento de clique para selecionar o tema
            themeCard.addEventListener('click', function(e) {
                if (!e.target.classList.contains('delete-theme-btn')) {
                    changeTheme(`saved-${themeId}`);
                }
            });
            
            // Adicionar evento para botão de exclusão (apenas admin)
            if (currentUser && currentUser.role === 'admin') {
                const deleteBtn = themeCard.querySelector('.delete-theme-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        const themeId = this.dataset.themeId;
                        deleteSavedTheme(themeId);
                    });
                }
            }
        });
        
    } catch (error) {
        console.error("Erro ao carregar temas salvos:", error);
    }
}

// Excluir tema salvo
async function deleteSavedTheme(themeId) {
    if (!confirm('Tem certeza que deseja excluir este tema?')) {
        return;
    }
    
    try {
        await db.collection('savedThemes').doc(themeId).delete();
        alert('Tema excluído com sucesso!');
        
        // Recarregar lista de temas
        loadSavedThemes();
        
    } catch (error) {
        console.error("Erro ao excluir tema:", error);
        alert('Erro ao excluir tema. Tente novamente.');
    }
}

// Abrir modal para criar novo tema (admin)
function openCreateThemeModal() {
    document.getElementById('theme-modal-title').textContent = 'Criar Novo Tema';
    document.getElementById('theme-id').value = '';
    document.getElementById('theme-name').value = '';
    document.getElementById('theme-description').value = '';
    document.getElementById('theme-image-file').value = '';
    document.getElementById('theme-image-preview').style.display = 'none';
    themeEditModal.style.display = 'flex';
}

// Pré-visualizar imagem do tema
function previewThemeImage() {
    const file = themeImageFileInput.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('theme-preview-image').style.backgroundImage = `url(${e.target.result})`;
        document.getElementById('theme-image-preview').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// Salvar/editar tema
async function handleThemeSave(e) {
    e.preventDefault();
    
    if (!currentUser || currentUser.role !== 'admin') {
        alert('Apenas administradores podem salvar temas.');
        return;
    }
    
    const themeId = document.getElementById('theme-id').value;
    const themeName = document.getElementById('theme-name').value;
    const themeDescription = document.getElementById('theme-description').value;
    const themeImageFile = document.getElementById('theme-image-file').files[0];
    const messageElement = document.getElementById('theme-edit-message');
    
    if (!themeName || !themeImageFile) {
        showFormMessage(messageElement, 'Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }
    
    try {
        showFormMessage(messageElement, 'Processando imagem...', 'info');
        
        // Processar a imagem
        const imagePieces = await processImageForTheme(themeImageFile);
        
        // Criar objeto do tema
        const themeData = {
            name: themeName,
            description: themeDescription,
            pieces: imagePieces.pieces,
            preview: imagePieces.preview,
            createdBy: currentUser.uid,
            createdByName: currentUser.displayName || currentUser.email.split('@')[0],
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            isPublic: true
        };
        
        // Adicionar campo createdBy apenas para novos temas
        if (!themeId) {
            themeData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        }
        
        // Salvar no Firestore
        if (themeId) {
            await db.collection('savedThemes').doc(themeId).update(themeData);
            showFormMessage(messageElement, 'Tema atualizado com sucesso!', 'success');
        } else {
            await db.collection('savedThemes').add(themeData);
            showFormMessage(messageElement, 'Tema criado com sucesso!', 'success');
        }
        
        // Fechar modal após 1.5 segundos
        setTimeout(() => {
            themeEditModal.style.display = 'none';
            clearFormMessage(messageElement);
            
            // Atualizar lista de temas
            loadSavedThemes();
            loadAdminThemes();
        }, 1500);
        
    } catch (error) {
        console.error("Erro ao salvar tema:", error);
        showFormMessage(messageElement, 'Erro ao salvar tema. Tente novamente.', 'error');
    }
}

// Processar imagem para tema
function processImageForTheme(file) {
    return new Promise((resolve, reject) => {
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
                
                // Array para armazenar as partes da imagem
                const imagePieces = [];
                
                // Salvar a imagem completa para preview
                const fullImageCanvas = document.createElement('canvas');
                fullImageCanvas.width = img.width;
                fullImageCanvas.height = img.height;
                const fullImageCtx = fullImageCanvas.getContext('2d');
                fullImageCtx.drawImage(img, 0, 0);
                const fullImageData = fullImageCanvas.toDataURL('image/jpeg', 0.7);
                
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
                        const dataUrl = pieceCanvas.toDataURL('image/jpeg', 0.7);
                        
                        // Adicionar ao array (a última peça será null para o espaço vazio)
                        if (row === 3 && col === 3) {
                            imagePieces.push(null);
                        } else {
                            imagePieces.push(dataUrl);
                        }
                    }
                }
                
                resolve({
                    pieces: imagePieces,
                    preview: fullImageData
                });
            };
            
            img.src = event.target.result;
        };
        
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Carregar temas para administração
async function loadAdminThemes() {
    try {
        const adminThemesList = document.getElementById('admin-themes-list');
        const loadingElement = document.getElementById('admin-themes-loading');
        
        if (loadingElement) loadingElement.style.display = 'flex';
        if (adminThemesList) adminThemesList.innerHTML = '';
        
        // Buscar temas
        const themesSnapshot = await db.collection('savedThemes')
            .orderBy('createdAt', 'desc')
            .get();
        
        if (adminThemesList) {
            if (themesSnapshot.empty) {
                adminThemesList.innerHTML = '<p class="no-themes">Nenhum tema encontrado.</p>';
            } else {
                themesSnapshot.forEach(doc => {
                    const themeData = doc.data();
                    const themeId = doc.id;
                    
                    const themeItem = document.createElement('div');
                    themeItem.className = 'admin-theme-item';
                    
                    // Formatar data
                    const createdAt = themeData.createdAt ? themeData.createdAt.toDate().toLocaleDateString('pt-BR') : 'N/A';
                    
                    themeItem.innerHTML = `
                        <div class="admin-theme-preview">
                            <div style="width: 60px; height: 60px; background-image: url(${themeData.preview}); background-size: cover; background-position: center; border-radius: 4px;"></div>
                        </div>
                        <div class="admin-theme-info">
                            <div class="admin-theme-name">${themeData.name}</div>
                            <div class="admin-theme-meta">
                                <span>Criado por: ${themeData.createdByName}</span>
                                <span>${createdAt}</span>
                            </div>
                            ${themeData.description ? `<div class="admin-theme-description">${themeData.description}</div>` : ''}
                        </div>
                        <div class="admin-theme-actions">
                            <button class="btn btn-secondary btn-icon edit-theme-btn" data-theme-id="${themeId}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger btn-icon delete-theme-btn" data-theme-id="${themeId}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                    
                    adminThemesList.appendChild(themeItem);
                    
                    // Adicionar eventos aos botões
                    const editBtn = themeItem.querySelector('.edit-theme-btn');
                    const deleteBtn = themeItem.querySelector('.delete-theme-btn');
                    
                    if (editBtn) {
                        editBtn.addEventListener('click', () => {
                            editTheme(themeId, themeData);
                        });
                    }
                    
                    if (deleteBtn) {
                        deleteBtn.addEventListener('click', () => {
                            deleteSavedTheme(themeId);
                        });
                    }
                });
            }
        }
        
    } catch (error) {
        console.error("Erro ao carregar temas para admin:", error);
    } finally {
        const loadingElement = document.getElementById('admin-themes-loading');
        if (loadingElement) loadingElement.style.display = 'none';
    }
}

// Editar tema
async function editTheme(themeId, themeData) {
    try {
        document.getElementById('theme-modal-title').textContent = 'Editar Tema';
        document.getElementById('theme-id').value = themeId;
        document.getElementById('theme-name').value = themeData.name;
        document.getElementById('theme-description').value = themeData.description || '';
        
        // Mostrar preview da imagem existente
        if (themeData.preview) {
            document.getElementById('theme-preview-image').style.backgroundImage = `url(${themeData.preview})`;
            document.getElementById('theme-image-preview').style.display = 'block';
        }
        
        themeEditModal.style.display = 'flex';
        
    } catch (error) {
        console.error("Erro ao carregar tema para edição:", error);
        alert('Erro ao carregar tema. Tente novamente.');
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
                        <div class="ranking-email">${formattedDate} • ${getDifficultyText(score.difficulty)} • ${getThemeName(score.theme)}</div>
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

// Obter nome do tema
function getThemeName(themeKey) {
    if (themes[themeKey]) {
        return themes[themeKey].name;
    } else if (themeKey.startsWith('saved-')) {
        return 'Tema Personalizado';
    }
    return themeKey;
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
    if (!currentUser || isGuest) return;
    
    try {
        // Buscar pontuações do usuário
        const scoresSnapshot = await db.collection('scores')
            .where('userId', '==', currentUser.uid)
            .orderBy('date', 'desc')
            .limit(50)
            .get();
        
        const scores = [];
        let totalMoves = 0;
        let totalTime = 0;
        let bestMoves = Infinity;
        let bestTime = Infinity;
        
        const difficultyStats = {
            easy: { count: 0, moves: 0, time: 0 },
            normal: { count: 0, moves: 0, time: 0 },
            hard: { count: 0, moves: 0, time: 0 }
        };
        
        const timelineData = {};
        
        scoresSnapshot.forEach(doc => {
            const data = doc.data();
            scores.push({
                id: doc.id,
                ...data,
                date: data.date && data.date.toDate ? data.date.toDate() : new Date()
            });
            
            // Atualizar estatísticas
            totalMoves += data.moves;
            totalTime += data.time;
            
            if (data.moves < bestMoves) bestMoves = data.moves;
            if (data.time < bestTime) bestTime = data.time;
            
            // Estatísticas por dificuldade
            if (difficultyStats[data.difficulty]) {
                difficultyStats[data.difficulty].count++;
                difficultyStats[data.difficulty].moves += data.moves;
                difficultyStats[data.difficulty].time += data.time;
            }
            
            // Dados para timeline
            const dateStr = data.date.toDate().toISOString().split('T')[0];
            if (!timelineData[dateStr]) {
                timelineData[dateStr] = { count: 0, moves: 0 };
            }
            timelineData[dateStr].count++;
            timelineData[dateStr].moves += data.moves;
        });
        
        const totalGames = scores.length;
        
        // Atualizar estatísticas na interface
        document.getElementById('user-total-games').textContent = totalGames;
        document.getElementById('user-best-moves').textContent = bestMoves === Infinity ? 0 : bestMoves;
        document.getElementById('user-best-time').textContent = bestTime === Infinity ? '00:00' : formatTime(bestTime);
        document.getElementById('user-avg-moves').textContent = totalGames > 0 ? Math.round(totalMoves / totalGames) : 0;
        
        // Atualizar histórico recente
        updateProgressHistory(scores.slice(0, 10));
        
        // Criar gráficos
        createUserCharts(difficultyStats, timelineData);
        
    } catch (error) {
        console.error("Erro ao carregar progresso do usuário:", error);
    }
}

// Atualizar histórico de progresso
function updateProgressHistory(scores) {
    const historyList = document.getElementById('progress-history-list');
    if (!historyList) return;
    
    if (scores.length === 0) {
        historyList.innerHTML = '<p class="no-history">Nenhum jogo registrado ainda.</p>';
        return;
    }
    
    historyList.innerHTML = '';
    
    scores.forEach(score => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const date = score.date.toLocaleDateString('pt-BR');
        const time = score.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        historyItem.innerHTML = `
            <div class="history-date">${date} ${time}</div>
            <div class="history-info">
                <span class="history-difficulty">${getDifficultyText(score.difficulty)}</span>
                <span class="history-theme">${getThemeName(score.theme)}</span>
            </div>
            <div class="history-score">
                <span>${score.moves} movimentos</span>
                <span>${formatTime(score.time)}</span>
            </div>
        `;
        
        historyList.appendChild(historyItem);
    });
}

// Criar gráficos do usuário
function createUserCharts(difficultyStats, timelineData) {
    // Gráfico de desempenho por dificuldade
    const difficultyCtx = document.getElementById('difficulty-chart');
    if (difficultyCtx) {
        // Destruir gráfico anterior se existir
        if (userDifficultyChart) {
            userDifficultyChart.destroy();
        }
        
        const difficultyLabels = ['Fácil', 'Normal', 'Difícil'];
        const difficultyCounts = [
            difficultyStats.easy.count,
            difficultyStats.normal.count,
            difficultyStats.hard.count
        ];
        
        userDifficultyChart = new Chart(difficultyCtx, {
            type: 'bar',
            data: {
                labels: difficultyLabels,
                datasets: [{
                    label: 'Jogos por Dificuldade',
                    data: difficultyCounts,
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 99, 132, 0.7)'
                    ],
                    borderColor: [
                        'rgb(75, 192, 192)',
                        'rgb(54, 162, 235)',
                        'rgb(255, 99, 132)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
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
    }
    
    // Gráfico de timeline
    const timelineCtx = document.getElementById('timeline-chart');
    if (timelineCtx && Object.keys(timelineData).length > 0) {
        // Destruir gráfico anterior se existir
        if (userTimelineChart) {
            userTimelineChart.destroy();
        }
        
        // Ordenar datas
        const sortedDates = Object.keys(timelineData).sort();
        const last7Dates = sortedDates.slice(-7); // Últimos 7 dias
        
        const timelineLabels = last7Dates.map(date => {
            const d = new Date(date);
            return `${d.getDate()}/${d.getMonth() + 1}`;
        });
        
        const timelineCounts = last7Dates.map(date => timelineData[date].count);
        
        userTimelineChart = new Chart(timelineCtx, {
            type: 'line',
            data: {
                labels: timelineLabels,
                datasets: [{
                    label: 'Jogos por Dia',
                    data: timelineCounts,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
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
    }
}

// Carregar estatísticas de administração
async function loadAdminStats() {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    try {
        // Buscar total de usuários
        const usersSnapshot = await db.collection('users').get();
        const totalUsers = usersSnapshot.size;
        document.getElementById('total-users').textContent = totalUsers;
        
        // Buscar usuários ativos (últimos 7 dias)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const activeUsersSnapshot = await db.collection('users')
            .where('lastLogin', '>=', weekAgo)
            .get();
        
        const activeUsers = activeUsersSnapshot.size;
        document.getElementById('active-users').textContent = activeUsers;
        
        // Buscar estatísticas de jogos
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
        
        // Criar gráficos de administração
        createAdminCharts(scoresSnapshot);
        
    } catch (error) {
        console.error("Erro ao carregar estatísticas de admin:", error);
    }
}

// Criar gráficos de administração
function createAdminCharts(scoresSnapshot) {
    // Gráfico de jogos por dificuldade
    const adminDifficultyCtx = document.getElementById('admin-difficulty-chart');
    if (adminDifficultyCtx) {
        // Destruir gráfico anterior se existir
        if (adminDifficultyChart) {
            adminDifficultyChart.destroy();
        }
        
        const difficultyCounts = {
            easy: 0,
            normal: 0,
            hard: 0
        };
        
        scoresSnapshot.forEach(doc => {
            const data = doc.data();
            if (difficultyCounts[data.difficulty] !== undefined) {
                difficultyCounts[data.difficulty]++;
            }
        });
        
        adminDifficultyChart = new Chart(adminDifficultyCtx, {
            type: 'doughnut',
            data: {
                labels: ['Fácil', 'Normal', 'Difícil'],
                datasets: [{
                    data: [difficultyCounts.easy, difficultyCounts.normal, difficultyCounts.hard],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 99, 132, 0.7)'
                    ],
                    borderColor: [
                        'rgb(75, 192, 192)',
                        'rgb(54, 162, 235)',
                        'rgb(255, 99, 132)'
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
    }
    
    // Gráfico de jogos por dia (últimos 30 dias)
    const adminDailyCtx = document.getElementById('admin-daily-chart');
    if (adminDailyCtx) {
        // Destruir gráfico anterior se existir
        if (adminDailyChart) {
            adminDailyChart.destroy();
        }
        
        // Coletar dados dos últimos 30 dias
        const dailyData = {};
        const today = new Date();
        
        // Inicializar últimos 30 dias
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            dailyData[dateStr] = 0;
        }
        
        // Contar jogos por dia
        scoresSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.date && data.date.toDate) {
                const gameDate = data.date.toDate();
                const dateStr = gameDate.toISOString().split('T')[0];
                
                if (dailyData[dateStr] !== undefined) {
                    dailyData[dateStr]++;
                }
            }
        });
        
        // Preparar dados para o gráfico
        const dates = Object.keys(dailyData).sort();
        const formattedDates = dates.map(date => {
            const d = new Date(date);
            return `${d.getDate()}/${d.getMonth() + 1}`;
        });
        
        const gameCounts = dates.map(date => dailyData[date]);
        
        adminDailyChart = new Chart(adminDailyCtx, {
            type: 'line',
            data: {
                labels: formattedDates,
                datasets: [{
                    label: 'Jogos por Dia',
                    data: gameCounts,
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgb(153, 102, 255)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
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
        
    } catch (error) {
        console.error("Erro ao abrir modal de edição de usuário:", error);
        alert('Erro ao carregar dados do usuário.');
    }
}

// Manipular edição de usuário
async function handleEditUser(e) {
    e.preventDefault();
    
    const userId = document.getElementById('edit-user-id').value;
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
            // Nota: Para atualizar a senha, precisaríamos do Firebase Admin SDK no backend
            // Por enquanto, apenas adicionamos um campo para futura implementação
            updateData.passwordUpdated = true;
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

// Carregar pontuações para administração
async function loadAdminScores() {
    const loadingElement = document.getElementById('admin-scores-loading');
    const scoresListElement = document.getElementById('admin-scores-list');
    
    if (!currentUser) return;
    
    // Verificar se o usuário atual é administrador
    if (currentUser.role !== 'admin') {
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
                            <span class="score-difficulty">${getDifficultyText(score.difficulty)} • ${getThemeName(score.theme)}</span>
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
        
        // Criar usuário com Firebase Auth (apenas administradores podem fazer isso)
        const isAdmin = await checkIfUserIsAdmin(currentUser.uid);
        if (!isAdmin) {
            showFormMessage(messageElement, 'Apenas administradores podem criar novas contas.', 'error');
            return;
        }
        
        // Nota: Para criar usuários programaticamente, precisaríamos do Firebase Admin SDK no backend
        // Por enquanto, vamos apenas criar o documento no Firestore
        // Em um sistema real, você precisaria de uma função backend para criar o usuário
        
        // Criar documento do usuário no Firestore
        // Gerar um ID temporário (em produção, use o UID do Firebase Auth)
        const tempUserId = 'temp_' + Date.now();
        
        const userData = {
            uid: tempUserId,
            email: email,
            name: name,
            role: role,
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: currentUser.uid,
            requiresAuthSetup: true,
            tempPassword: password // Em produção, NUNCA armazene senhas em texto claro
        };
        
        await db.collection('users').doc(tempUserId).set(userData);
        
        showFormMessage(messageElement, 'Usuário cadastrado com sucesso! Nota: Para acesso completo, configure o Firebase Admin SDK no backend.', 'success');
        
        // Limpar formulário após 3 segundos
        setTimeout(() => {
            adminRegisterForm.reset();
            clearFormMessage(messageElement);
            
            // Recarregar lista de usuários
            loadAdminUsers();
        }, 3000);
        
    } catch (error) {
        console.error("Erro ao criar conta de usuário:", error);
        showFormMessage(messageElement, 'Erro ao criar conta de usuário. Tente novamente.', 'error');
    }
}


