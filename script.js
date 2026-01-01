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

// Elementos do DOM
let puzzleBoard, moveCounter, timerElement, shuffleBtn, solveBtn, resetBtn, hintBtn;
let playAgainBtn, saveScoreBtn, completionMessage, finalMoves, finalTime;
let difficultyBtns, authModal, loginBtn, registerBtn, logoutBtn, userInfo, userName;
let adminNavItem, gameSection, rankingSection, profileSection, adminSection;
let rankingList, userScoresList, usersList, adminScoresList;
let loginForm, registerForm, resetForm, adminRegisterForm, editUserForm;
let authButtons, userInfoContainer, dbStatus, saveScoreContainer;

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

// Inicialização do aplicativo
document.addEventListener('DOMContentLoaded', function() {
    initializeFirebase();
    initializeDOMElements();
    initializeGame();
    setupEventListeners();
    checkAuthState();
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

// Inicializar elementos do DOM
function initializeDOMElements() {
    // Elementos do jogo
    puzzleBoard = document.getElementById('puzzle-board');
    moveCounter = document.getElementById('move-counter');
    timerElement = document.getElementById('timer');
    shuffleBtn = document.getElementById('shuffle-btn');
    solveBtn = document.getElementById('solve-btn');
    resetBtn = document.getElementById('reset-btn');
    hintBtn = document.getElementById('hint-btn');
    playAgainBtn = document.getElementById('play-again-btn');
    saveScoreBtn = document.getElementById('save-score-btn');
    completionMessage = document.getElementById('completion-message');
    finalMoves = document.getElementById('final-moves');
    finalTime = document.getElementById('final-time');
    difficultyBtns = document.querySelectorAll('.difficulty-btn');
    
    // Seções da página
    gameSection = document.getElementById('game-section');
    rankingSection = document.getElementById('ranking-section');
    profileSection = document.getElementById('profile-section');
    adminSection = document.getElementById('admin-section');
    
    // Navegação
    const navHome = document.getElementById('nav-home');
    const navRanking = document.getElementById('nav-ranking');
    const navProfile = document.getElementById('nav-profile');
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
    editUserForm = document.getElementById('edit-user-modal');
    
    // Elementos do ranking
    rankingList = document.getElementById('ranking-list');
    
    // Elementos do perfil
    userScoresList = document.getElementById('user-scores-list');
    
    // Elementos de administração
    usersList = document.getElementById('users-list');
    adminScoresList = document.getElementById('admin-scores-list');
    
    // Status do banco de dados
    dbStatus = document.getElementById('db-status');
    
    // Container para salvar pontuação
    saveScoreContainer = document.getElementById('save-score-container');
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
    board = [];
    for (let i = 1; i <= 15; i++) {
        board.push(i);
    }
    board.push(null); // Espaço vazio
}

// Renderizar o tabuleiro
function renderBoard() {
    puzzleBoard.innerHTML = '';
    
    board.forEach((value, index) => {
        const tile = document.createElement('div');
        tile.className = 'puzzle-tile';
        
        if (value === null) {
            tile.classList.add('empty');
            tile.textContent = '';
            emptyTileIndex = index;
        } else {
            tile.textContent = value;
            tile.dataset.index = index;
            tile.dataset.value = value;
            
            // Verificar se a peça está na posição correta
            if (value === index + 1) {
                tile.classList.add('correct-position');
            }
            
            // Verificar se a peça pode ser movida
            if (isMovable(index)) {
                tile.classList.add('movable');
                tile.addEventListener('click', () => moveTile(index));
                
                // Adicionar suporte a arrastar (opcional)
                tile.setAttribute('draggable', 'true');
                tile.addEventListener('dragstart', handleDragStart);
                tile.addEventListener('dragover', handleDragOver);
                tile.addEventListener('drop', handleDrop);
                tile.addEventListener('dragend', handleDragEnd);
            } else {
                tile.style.cursor = 'default';
                tile.removeAttribute('draggable');
            }
        }
        
        puzzleBoard.appendChild(tile);
    });
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

// Funções de arrastar e soltar (drag and drop)
let draggedTile = null;

function handleDragStart(e) {
    if (!isMovable(parseInt(e.target.dataset.index))) {
        e.preventDefault();
        return;
    }
    draggedTile = e.target;
    e.dataTransfer.setData('text/plain', e.target.dataset.index);
    setTimeout(() => {
        e.target.style.opacity = '0.7';
    }, 0);
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    if (e.target.classList.contains('empty')) {
        const tileIndex = parseInt(draggedTile.dataset.index);
        moveTile(tileIndex);
    }
}

function handleDragEnd(e) {
    e.target.style.opacity = '1';
    draggedTile = null;
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
    
    // Esconder botão de salvar pontuação
    if (saveScoreContainer) {
        saveScoreContainer.style.display = 'none';
    }
    
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
    const solvedBoard = [];
    for (let i = 1; i <= 15; i++) {
        solvedBoard.push(i);
    }
    solvedBoard.push(null);
    
    // Atualizar o tabuleiro atual
    board = [...solvedBoard];
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
    
    // Esconder botão de salvar pontuação
    if (saveScoreContainer) {
        saveScoreContainer.style.display = 'none';
    }
    
    // Criar tabuleiro ordenado
    createBoard();
    renderBoard();
}

// Mostrar dica
function showHint() {
    // Encontrar a primeira peça fora do lugar que pode ser movida
    for (let i = 0; i < board.length; i++) {
        if (board[i] !== null && board[i] !== i + 1 && isMovable(i)) {
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
        if (board[i] !== i + 1) {
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
    
    // Mostrar botão para salvar pontuação se o usuário estiver logado
    if (currentUser && saveScoreContainer) {
        saveScoreContainer.style.display = 'block';
    }
    
    // Rolar para a mensagem
    completionMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
    
    for (let i = 1; i <= 16; i++) {
        const tile = document.createElement('div');
        tile.className = 'solution-tile';
        
        if (i <= 15) {
            tile.textContent = i;
        } else {
            tile.classList.add('empty');
        }
        
        solutionBoard.appendChild(tile);
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Event listeners do jogo
    if (shuffleBtn) shuffleBtn.addEventListener('click', shuffleBoard);
    if (solveBtn) solveBtn.addEventListener('click', showSolution);
    if (resetBtn) resetBtn.addEventListener('click', resetGame);
    if (hintBtn) hintBtn.addEventListener('click', showHint);
    if (playAgainBtn) playAgainBtn.addEventListener('click', resetGame);
    if (saveScoreBtn) saveScoreBtn.addEventListener('click', saveScore);
    
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
    const navRanking = document.getElementById('nav-ranking');
    const navProfile = document.getElementById('nav-profile');
    const navAdmin = document.getElementById('nav-admin');
    
    if (navHome) navHome.addEventListener('click', () => showSection('game-section'));
    if (navRanking) navRanking.addEventListener('click', () => {
        showSection('ranking-section');
        loadRanking();
    });
    if (navProfile) navProfile.addEventListener('click', () => {
        showSection('profile-section');
        loadUserProfile();
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
    if (editUserForm) editUserForm.addEventListener('submit', handleEditUser);
    
    // Filtros de ranking
    const rankingDifficulty = document.getElementById('ranking-difficulty');
    const rankingPeriod = document.getElementById('ranking-period');
    
    if (rankingDifficulty) rankingDifficulty.addEventListener('change', loadRanking);
    if (rankingPeriod) rankingPeriod.addEventListener('change', loadRanking);
    
    // Filtros de administração
    const adminScoreDifficulty = document.getElementById('admin-score-difficulty');
    const adminScoreDate = document.getElementById('admin-score-date');
    const userSearch = document.getElementById('user-search');
    const clearScoresBtn = document.getElementById('clear-scores-btn');
    
    if (adminScoreDifficulty) adminScoreDifficulty.addEventListener('change', loadAdminScores);
    if (adminScoreDate) adminScoreDate.addEventListener('change', loadAdminScores);
    if (userSearch) userSearch.addEventListener('input', loadAdminUsers);
    if (clearScoresBtn) clearScoresBtn.addEventListener('click', clearOldScores);
    
    // Embaralhar o tabuleiro inicialmente
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
    const targetNavLink = document.querySelector(`[href="#"]`);
    if (sectionId === 'game-section') {
        document.getElementById('nav-home').classList.add('active');
    } else if (sectionId === 'ranking-section') {
        document.getElementById('nav-ranking').classList.add('active');
    } else if (sectionId === 'profile-section') {
        document.getElementById('nav-profile').classList.add('active');
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

// Verificar estado de autenticação
function checkAuthState() {
    if (!auth) return;
    
    auth.onAuthStateChanged(async (user) => {
        currentUser = user;
        
        if (user) {
            // Usuário está logado
            console.log("Usuário logado:", user.email);
            
            // Atualizar interface para usuário logado
            updateUIForLoggedInUser(user);
            
            // Verificar se o usuário é administrador
            const isAdmin = await checkIfUserIsAdmin(user.uid);
            updateUIForAdmin(isAdmin);
            
            // Carregar dados do usuário
            await loadUserData(user.uid);
        } else {
            // Usuário não está logado
            console.log("Usuário não logado");
            
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
    
    // Mostrar link para perfil
    const navProfile = document.getElementById('nav-profile');
    if (navProfile) navProfile.style.display = 'flex';
    
    // Mostrar botão de salvar pontuação se o jogo estiver ativo
    if (saveScoreContainer && gameActive) {
        saveScoreContainer.style.display = 'block';
    }
}

// Atualizar UI para usuário não logado
function updateUIForLoggedOutUser() {
    // Mostrar botões de autenticação
    if (userInfoContainer) userInfoContainer.style.display = 'none';
    if (authButtons) authButtons.style.display = 'flex';
    
    // Esconder link para perfil
    const navProfile = document.getElementById('nav-profile');
    if (navProfile) navProfile.style.display = 'none';
    
    // Esconder link para admin
    if (adminNavItem) adminNavItem.style.display = 'none';
    
    // Esconder botão de salvar pontuação
    if (saveScoreContainer) saveScoreContainer.style.display = 'none';
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
            
            // Atualizar informações no perfil se necessário
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
        showSection('game-section');
        
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

// Salvar pontuação
async function saveScore() {
    if (!currentUser || !gameCompleted) {
        alert('Complete o jogo primeiro e certifique-se de estar logado para salvar sua pontuação!');
        return;
    }
    
    try {
        // Criar objeto de pontuação
        const scoreData = {
            userId: currentUser.uid,
            userName: currentUser.displayName || currentUser.email.split('@')[0],
            moves: moves,
            time: timer,
            difficulty: currentDifficulty,
            date: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Salvar no Firestore
        await db.collection('scores').add(scoreData);
        
        alert('Pontuação salva com sucesso!');
        
        // Esconder botão de salvar pontuação
        if (saveScoreContainer) {
            saveScoreContainer.style.display = 'none';
        }
        
        // Recarregar ranking se estiver visível
        if (rankingSection.classList.contains('active')) {
            loadRanking();
        }
        
        // Recarregar perfil se estiver visível
        if (profileSection.classList.contains('active')) {
            loadUserProfile();
        }
        
    } catch (error) {
        console.error("Erro ao salvar pontuação:", error);
        alert('Erro ao salvar pontuação. Tente novamente.');
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
        
        // Construir query
        let query = db.collection('scores').orderBy('moves').limit(50);
        
        // Aplicar filtro de dificuldade
        if (difficulty !== 'all') {
            query = query.where('difficulty', '==', difficulty);
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
            scores.push({
                id: doc.id,
                ...doc.data()
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
                const date = score.date.toDate ? score.date.toDate() : new Date();
                const formattedDate = date.toLocaleDateString('pt-BR');
                
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
                        <div class="ranking-email">${formattedDate} • ${getDifficultyText(score.difficulty)}</div>
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

// Carregar perfil do usuário
async function loadUserProfile() {
    if (!currentUser) {
        showSection('game-section');
        showLoginModal();
        return;
    }
    
    const loadingElement = document.getElementById('user-scores-loading');
    const scoresListElement = document.getElementById('user-scores-list');
    
    if (loadingElement) loadingElement.style.display = 'flex';
    if (scoresListElement) scoresListElement.innerHTML = '';
    
    try {
        // Carregar pontuações do usuário
        const scoresSnapshot = await db.collection('scores')
            .where('userId', '==', currentUser.uid)
            .orderBy('date', 'desc')
            .limit(10)
            .get();
        
        const scores = [];
        scoresSnapshot.forEach(doc => {
            scores.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Atualizar lista de pontuações
        if (scoresListElement) {
            if (scores.length === 0) {
                scoresListElement.innerHTML = '<p class="no-scores">Nenhuma pontuação salva ainda.</p>';
            } else {
                scores.forEach(score => {
                    const scoreItem = document.createElement('div');
                    scoreItem.className = 'score-item';
                    
                    const date = score.date.toDate ? score.date.toDate() : new Date();
                    const formattedDate = date.toLocaleDateString('pt-BR');
                    
                    scoreItem.innerHTML = `
                        <div class="score-date">${formattedDate}</div>
                        <div class="score-info">
                            <span class="score-difficulty ${score.difficulty}">${getDifficultyText(score.difficulty)}</span>
                        </div>
                        <div class="score-details">
                            <span>${score.moves} movimentos</span>
                            <span>${formatTime(score.time)}</span>
                        </div>
                    `;
                    
                    scoresListElement.appendChild(scoreItem);
                });
            }
        }
        
        // Carregar estatísticas do usuário
        await loadUserStats();
        
    } catch (error) {
        console.error("Erro ao carregar perfil do usuário:", error);
        if (scoresListElement) {
            scoresListElement.innerHTML = '<p class="error-message">Erro ao carregar pontuações.</p>';
        }
    } finally {
        if (loadingElement) loadingElement.style.display = 'none';
    }
}

// Carregar estatísticas do usuário
async function loadUserStats() {
    try {
        const scoresSnapshot = await db.collection('scores')
            .where('userId', '==', currentUser.uid)
            .get();
        
        const scores = [];
        scoresSnapshot.forEach(doc => {
            scores.push(doc.data());
        });
        
        // Calcular estatísticas
        const totalGames = scores.length;
        const bestMoveScore = scores.length > 0 ? Math.min(...scores.map(s => s.moves)) : '-';
        const bestTimeScore = scores.length > 0 ? Math.min(...scores.map(s => s.time)) : '-';
        const avgMoves = scores.length > 0 ? 
            Math.round(scores.reduce((sum, s) => sum + s.moves, 0) / scores.length) : '-';
        
        // Atualizar elementos da UI
        const totalGamesElement = document.getElementById('total-games');
        const bestMovesElement = document.getElementById('best-moves');
        const bestTimeElement = document.getElementById('best-time');
        const avgMovesElement = document.getElementById('avg-moves');
        
        if (totalGamesElement) totalGamesElement.textContent = totalGames;
        if (bestMovesElement) bestMovesElement.textContent = bestMoveScore;
        if (bestTimeElement) bestTimeElement.textContent = bestTimeScore !== '-' ? formatTime(bestTimeScore) : '-';
        if (avgMovesElement) avgMovesElement.textContent = avgMoves;
        
    } catch (error) {
        console.error("Erro ao carregar estatísticas do usuário:", error);
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
    
    if (loadingElement) loadingElement.style.display = 'flex';
    if (scoresListElement) scoresListElement.innerHTML = '';
    
    try {
        // Obter filtros
        const difficulty = document.getElementById('admin-score-difficulty').value;
        const dateFilter = document.getElementById('admin-score-date').value;
        
        // Construir query
        let query = db.collection('scores').orderBy('date', 'desc').limit(100);
        
        // Aplicar filtro de dificuldade
        if (difficulty !== 'all') {
            query = query.where('difficulty', '==', difficulty);
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
            scores.push({
                id: doc.id,
                ...doc.data()
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
                    
                    const date = score.date.toDate ? score.date.toDate() : new Date();
                    const formattedDate = date.toLocaleDateString('pt-BR');
                    const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    
                    scoreItem.innerHTML = `
                        <div class="score-date">${formattedDate} ${formattedTime}</div>
                        <div class="score-info">
                            <span class="score-user">${score.userName}</span>
                            <span class="score-difficulty ${score.difficulty}">${getDifficultyText(score.difficulty)}</span>
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
            scoresListElement.innerHTML = '<p class="error-message">Erro ao carregar pontuações.</p>';
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