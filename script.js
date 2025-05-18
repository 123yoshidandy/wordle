document.addEventListener('DOMContentLoaded', () => {
    // ゲームの状態
    const state = {
        secret: '',
        grid: Array(6).fill().map(() => Array(5).fill('')),
        currentRow: 0,
        currentCol: 0,
        gameOver: false
    };
    
    // ゲームボードを初期化
    function initializeBoard() {
        const board = document.getElementById('board');
        board.innerHTML = '';
        
        for (let i = 0; i < 6; i++) {
            const row = document.createElement('div');
            row.classList.add('row');
            
            for (let j = 0; j < 5; j++) {
                const tile = document.createElement('div');
                tile.classList.add('tile');
                tile.dataset.row = i;
                tile.dataset.col = j;
                row.appendChild(tile);
            }
            
            board.appendChild(row);
        }
    }
    
    // キーボードイベントのセットアップ
    function setupKeyboard() {
        const keys = document.querySelectorAll('.keyboard-row button');
        
        for (let i = 0; i < keys.length; i++) {
            keys[i].addEventListener('click', ({ target }) => {
                const key = target.getAttribute('data-key');
                
                if (key === 'ENTER') {
                    handleEnterKey();
                } else if (key === 'BACKSPACE') {
                    handleBackspace();
                } else {
                    handleLetter(key);
                }
            });
        }
        
        document.addEventListener('keydown', handleKeyDown);
    }
    
    // キーボード入力の処理
    function handleKeyDown(e) {
        if (state.gameOver) return;
        
        const key = e.key.toUpperCase();
        
        if (key === 'ENTER') {
            handleEnterKey();
        } else if (key === 'BACKSPACE' || key === 'DELETE' || key === 'ARROWLEFT') {
            handleBackspace();
        } else if (/^[A-Z]$/.test(key)) {
            handleLetter(key);
        }
    }
    
    // 文字入力の処理
    function handleLetter(key) {
        if (state.gameOver) return;
        if (state.currentCol >= 5) return;
        
        const tile = document.querySelector(`[data-row="${state.currentRow}"][data-col="${state.currentCol}"]`);
        state.grid[state.currentRow][state.currentCol] = key;
        
        tile.textContent = key;
        tile.classList.add('pop');
        setTimeout(() => {
            tile.classList.remove('pop');
        }, 100);
        
        state.currentCol++;
    }
    
    // バックスペースの処理
    function handleBackspace() {
        if (state.currentCol === 0) return;
        
        state.currentCol--;
        state.grid[state.currentRow][state.currentCol] = '';
        
        const tile = document.querySelector(`[data-row="${state.currentRow}"][data-col="${state.currentCol}"]`);
        tile.textContent = '';
    }
    
    // Enterキーの処理
    function handleEnterKey() {
        if (state.currentCol !== 5) {
            showMessage('5文字入力してください');
            return;
        }
        
        const word = getCurrentWord();
        
        if (!isValidWord(word)) {
            showMessage('無効な単語です');
            return;
        }
        
        flipTiles();
        checkGameEnd();
    }
    
    // 現在の行の単語を取得
    function getCurrentWord() {
        return state.grid[state.currentRow].join('');
    }
    
    // 単語が有効かチェック
    function isValidWord(word) {
        return VALID_WORDS.includes(word);
    }
    
    // タイルをフリップしてチェックする
    function flipTiles() {
        const row = state.currentRow;
        const word = state.grid[row].join('');
        const tiles = document.querySelectorAll(`.tile[data-row="${row}"]`);
        
        // 各文字の状態をチェック
        const guessStatus = Array(5).fill('absent');
        const secretLetterCount = {};
        
        // 秘密の単語の文字数をカウント
        for (const char of state.secret) {
            secretLetterCount[char] = (secretLetterCount[char] || 0) + 1;
        }
        
        // 正しい位置の文字をチェック
        for (let i = 0; i < 5; i++) {
            const letter = word[i];
            if (letter === state.secret[i]) {
                guessStatus[i] = 'correct';
                secretLetterCount[letter]--;
            }
        }
        
        // 位置が間違っているが含まれる文字をチェック
        for (let i = 0; i < 5; i++) {
            if (guessStatus[i] !== 'correct') {
                const letter = word[i];
                if (secretLetterCount[letter] && secretLetterCount[letter] > 0) {
                    guessStatus[i] = 'present';
                    secretLetterCount[letter]--;
                }
            }
        }
        
        // アニメーションとともにタイルをフリップ
        for (let i = 0; i < 5; i++) {
            const tile = tiles[i];
            const letter = word[i];
            const status = guessStatus[i];
            
            setTimeout(() => {
                tile.classList.add('flip');
                setTimeout(() => {
                    tile.classList.add(status);
                    updateKeyboard(letter, status);
                }, 250);
            }, i * 500);
        }
        
        state.currentRow++;
        state.currentCol = 0;
    }
    
    // キーボードの色を更新
    function updateKeyboard(letter, status) {
        const key = document.querySelector(`button[data-key="${letter}"]`);
        if (key) {
            // すでに「correct」クラスがある場合は、より低い優先度のステータスで上書きしない
            if (key.classList.contains('correct')) return;
            
            // 「present」クラスがある場合は、「absent」で上書きしない
            if (key.classList.contains('present') && status === 'absent') return;
            
            // 既存のステータスクラスを削除
            key.classList.remove('correct', 'present', 'absent');
            key.classList.add(status);
        }
    }
    
    // ゲーム終了の確認
    function checkGameEnd() {
        const word = state.grid[state.currentRow - 1].join('');
        
        setTimeout(() => {
            if (word === state.secret) {
                showMessage('素晴らしい！正解です！');
                state.gameOver = true;
                return;
            }
            
            if (state.currentRow >= 6) {
                showMessage(`ゲームオーバー! 正解は ${state.secret} でした`);
                state.gameOver = true;
                return;
            }
        }, 3000);
    }
    
    // メッセージ表示
    function showMessage(msg) {
        const messageEl = document.getElementById('message');
        messageEl.textContent = msg;
        setTimeout(() => {
            messageEl.textContent = '';
        }, 4000);
    }
    
    // 新しいゲームを開始
    function startNewGame() {
        // ランダムに単語を選択
        state.secret = ANSWER_WORDS[Math.floor(Math.random() * ANSWER_WORDS.length)];
        
        // デバッグ用（コンソールに答えを表示）
        console.log('秘密の単語:', state.secret);
        
        // 状態をリセット
        state.grid = Array(6).fill().map(() => Array(5).fill(''));
        state.currentRow = 0;
        state.currentCol = 0;
        state.gameOver = false;
        
        // ボードをリセット
        initializeBoard();
        
        // キーボードをリセット
        const keys = document.querySelectorAll('.keyboard-row button');
        for (let i = 0; i < keys.length; i++) {
            keys[i].classList.remove('correct', 'present', 'absent');
        }
        
        // メッセージをクリア
        document.getElementById('message').textContent = '';
        
        showMessage('新しいゲームを開始しました');
    }
    
    // 新しいゲームボタンのイベントリスナー
    document.getElementById('new-game').addEventListener('click', startNewGame);
    
    // ゲームの初期化
    initializeBoard();
    setupKeyboard();
    startNewGame();
});
