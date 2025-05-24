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
            row.dataset.row = i;
            
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
        
        if (e.key === 'Enter') {
            handleEnterKey();
        } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'ArrowLeft') {
            handleBackspace();
        } else if (/^[ぁ-んー]$/.test(e.key)) {
            // ひらがな入力を処理
            handleLetter(e.key);
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
        updateCurrentRowFocus();
    }
    
    // バックスペースの処理
    function handleBackspace() {
        if (state.currentCol === 0) return;
        
        state.currentCol--;
        state.grid[state.currentRow][state.currentCol] = '';
        
        const tile = document.querySelector(`[data-row="${state.currentRow}"][data-col="${state.currentCol}"]`);
        tile.textContent = '';
        updateCurrentRowFocus();
    }
    
    // Enterキーの処理
    function handleEnterKey() {
        if (state.currentCol !== 5) {
            showMessage('5文字入力してください');
            return;
        }
        
        const word = getCurrentWord();
        
        flipTiles();
        checkGameEnd();
    }
    
    // 現在の行の単語を取得
    function getCurrentWord() {
        return state.grid[state.currentRow].join('');
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
        
        // 現在の行（row）要素にフォーカススタイルを追加
        const currentRowElement = document.querySelector(`.row[data-row="${row}"]`);
        if (currentRowElement) {
            currentRowElement.classList.add('active-row');
            setTimeout(() => {
                currentRowElement.classList.remove('active-row');
            }, 2500);
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
            }, i * 300); // アニメーション速度を速くする
        }
        
        state.currentRow++;
        state.currentCol = 0;
        
        // 少し遅延してから次の行にフォーカスを移す
        setTimeout(() => {
            updateCurrentRowFocus();
        }, 1500);
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
        messageEl.style.opacity = '1';
        
        setTimeout(() => {
            messageEl.style.opacity = '0';
            setTimeout(() => {
                messageEl.textContent = '';
            }, 300);
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
        
        // 現在の行のフォーカスを更新
        updateCurrentRowFocus();
        
        // キーボードをリセット
        const keys = document.querySelectorAll('.keyboard-row button');
        for (let i = 0; i < keys.length; i++) {
            keys[i].classList.remove('correct', 'present', 'absent');
        }
        
        // メッセージをクリア
        document.getElementById('message').textContent = '';
        document.getElementById('message').style.opacity = '0';
        
        showMessage('新しいゲームを開始しました');
    }
    
    // 新しいゲームボタンのイベントリスナー
    document.getElementById('new-game').addEventListener('click', startNewGame);
    
    // ヘルプモーダルのセットアップ
    function setupModal() {
        const infoButton = document.getElementById('info-button');
        const infoModal = document.getElementById('info-modal');
        const closeButton = document.getElementById('close-info');
        
        if (!infoButton || !infoModal || !closeButton) {
            console.error('モーダル関連の要素が見つかりません');
            return;
        }
        
        infoButton.addEventListener('click', () => {
            infoModal.classList.remove('hidden');
        });
        
        closeButton.addEventListener('click', () => {
            infoModal.classList.add('hidden');
            console.log('モーダルを閉じました');
        });
        
        // モーダル外をクリックしても閉じる
        infoModal.addEventListener('click', (e) => {
            if (e.target === infoModal) {
                infoModal.classList.add('hidden');
            }
        });
        
        // ESCキーでも閉じられるようにする
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !infoModal.classList.contains('hidden')) {
                infoModal.classList.add('hidden');
            }
        });
        
        console.log('モーダル機能を設定しました');
    }
    
    // ゲームの初期化
    initializeBoard();
    setupKeyboard();
    startNewGame();
    setupModal();
    
    // 現在の行にフォーカススタイルを適用する
    function updateCurrentRowFocus() {
        // 全ての行からアクティブクラスを削除
        document.querySelectorAll('.row').forEach(row => {
            row.classList.remove('current-row');
        });
        
        // 現在の行にアクティブクラスを追加
        const currentRow = document.querySelector(`.row[data-row="${state.currentRow}"]`);
        if (currentRow && !state.gameOver) {
            currentRow.classList.add('current-row');
        }
    }
});
