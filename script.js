document.addEventListener('DOMContentLoaded', () => {
    const MAX_ROWS = 10;
    const MODE_STORAGE_KEY = 'wordle-mode';
    const POKEMON_NAME_SET = new Set(POKEMON_NAMES);

    // ゲームの状態
    const state = {
        mode: loadMode(),
        secret: '',
        length: 5,
        grid: [],
        currentRow: 0,
        currentCol: 0,
        gameOver: false
    };

    // 保存したモードを読み込む
    function loadMode() {
        try {
            return localStorage.getItem(MODE_STORAGE_KEY) === 'pokemon' ? 'pokemon' : 'word';
        } catch (e) {
            return 'word';
        }
    }

    function saveMode(mode) {
        try {
            localStorage.setItem(MODE_STORAGE_KEY, mode);
        } catch (e) {
            // 保存できなくても遊べるので無視する
        }
    }

    // ひらがな⇔カタカナの変換
    function toKatakana(ch) {
        const code = ch.charCodeAt(0);
        return code >= 0x3041 && code <= 0x3096 ? String.fromCharCode(code + 0x60) : ch;
    }

    function toHiragana(ch) {
        const code = ch.charCodeAt(0);
        return code >= 0x30A1 && code <= 0x30F6 ? String.fromCharCode(code - 0x60) : ch;
    }

    // モードに合わせた文字にそろえる
    function normalizeLetter(ch) {
        return state.mode === 'pokemon' ? toKatakana(ch) : toHiragana(ch);
    }

    // ゲームボードを初期化
    function initializeBoard() {
        const board = document.getElementById('board');
        board.innerHTML = '';
        board.classList.toggle('long-word', state.length >= 6);

        for (let i = 0; i < MAX_ROWS; i++) {
            const row = document.createElement('div');
            row.classList.add('row');
            row.dataset.row = i;
            row.style.gridTemplateColumns = `repeat(${state.length}, 1fr)`;

            for (let j = 0; j < state.length; j++) {
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
            // 元のひらがなを覚えておき、モードに合わせて表示を切り替える
            keys[i].dataset.kana = keys[i].getAttribute('data-key');

            keys[i].addEventListener('click', ({ target }) => {
                const key = target.getAttribute('data-key');

                if (key === 'ENTER') {
                    handleEnterKey();
                } else if (key === 'BACKSPACE') {
                    handleBackspace();
                } else if (key.trim() !== '') {
                    handleLetter(key);
                }
            });
        }

        document.addEventListener('keydown', handleKeyDown);
    }

    // キーボードの文字をモードに合わせる
    function updateKeyboardLabels() {
        const keys = document.querySelectorAll('.keyboard-row button');
        for (let i = 0; i < keys.length; i++) {
            const kana = keys[i].dataset.kana;
            if (kana === 'ENTER' || kana === 'BACKSPACE' || kana.trim() === '') continue;

            const letter = normalizeLetter(kana);
            keys[i].setAttribute('data-key', letter);
            keys[i].textContent = letter;
        }
    }

    // キーボード入力の処理
    function handleKeyDown(e) {
        if (state.gameOver) return;

        if (e.key === 'Enter') {
            handleEnterKey();
        } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'ArrowLeft') {
            handleBackspace();
        } else if (/^[ぁ-んゔァ-ヴー]$/.test(e.key)) {
            // ひらがな・カタカナ入力を処理
            handleLetter(normalizeLetter(e.key));
        }
    }

    // 文字入力の処理
    function handleLetter(key) {
        if (state.gameOver) return;
        if (state.currentCol >= state.length) return;

        const tile = document.querySelector(`.tile[data-row="${state.currentRow}"][data-col="${state.currentCol}"]`);
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
        if (state.gameOver) return;
        if (state.currentCol === 0) return;

        state.currentCol--;
        state.grid[state.currentRow][state.currentCol] = '';

        const tile = document.querySelector(`.tile[data-row="${state.currentRow}"][data-col="${state.currentCol}"]`);
        tile.textContent = '';
        updateCurrentRowFocus();
    }

    // Enterキーの処理
    function handleEnterKey() {
        if (state.gameOver) return;

        if (state.currentCol !== state.length) {
            showMessage(`${state.length}文字入力してください`);
            return;
        }

        const word = getCurrentWord();

        if (state.mode === 'pokemon' && !POKEMON_NAME_SET.has(word)) {
            showMessage('図鑑にない名前です');
            return;
        }

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
        const guessStatus = Array(state.length).fill('absent');
        const secretLetterCount = {};

        // 秘密の単語の文字数をカウント
        for (const char of state.secret) {
            secretLetterCount[char] = (secretLetterCount[char] || 0) + 1;
        }

        // 正しい位置の文字をチェック
        for (let i = 0; i < state.length; i++) {
            const letter = word[i];
            if (letter === state.secret[i]) {
                guessStatus[i] = 'correct';
                secretLetterCount[letter]--;
            }
        }

        // 位置が間違っているが含まれる文字をチェック
        for (let i = 0; i < state.length; i++) {
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
        for (let i = 0; i < state.length; i++) {
            const tile = tiles[i];
            const letter = word[i];
            const status = guessStatus[i];

            setTimeout(() => {
                tile.classList.add('flip');
                setTimeout(() => {
                    tile.classList.add(status);
                    updateKeyboard(letter, status);
                }, 150);
            }, i * 200); // アニメーション速度をさらに速く
        }

        state.currentRow++;
        state.currentCol = 0;

        // 少し遅延してから次の行にフォーカスを移す
        setTimeout(() => {
            updateCurrentRowFocus();
        }, 800);
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
        // 判定が済んだ時点で入力を止める
        if (word === state.secret || state.currentRow >= MAX_ROWS) {
            state.gameOver = true;
        }

        const secret = state.secret;
        setTimeout(() => {
            if (secret !== state.secret) return; // 待つ間に新しいゲームが始まった

            if (word === secret) {
                showMessage('素晴らしい！正解です！');
                return;
            }

            if (state.currentRow >= MAX_ROWS) {
                showMessage(`ゲームオーバー! 正解は ${secret} でした`);
            }
        }, 1500);
    }

    // メッセージ表示
    let messageTimer = null;
    function showMessage(msg) {
        const messageEl = document.getElementById('message');
        messageEl.textContent = msg;
        messageEl.style.opacity = '1';

        clearTimeout(messageTimer);
        messageTimer = setTimeout(() => {
            messageEl.style.opacity = '0';
        }, 2500);
    }

    // モードに合わせて表示を切り替える
    function applyMode() {
        document.querySelectorAll('.mode-button').forEach(button => {
            button.classList.toggle('active', button.dataset.mode === state.mode);
        });

        document.getElementById('rule-text').textContent = state.mode === 'pokemon'
            ? 'ポケモンの名前をカタカナで当ててください。マスの数が名前の文字数です。図鑑にある名前だけ入力できます。10回まで挑戦できます。'
            : '5文字のひらがなの単語を当ててください。10回まで挑戦できます。';

        updateKeyboardLabels();
    }

    // 新しいゲームを開始
    function startNewGame() {
        // ランダムに単語を選択
        const answers = state.mode === 'pokemon' ? POKEMON_NAMES : ANSWER_WORDS;
        state.secret = answers[Math.floor(Math.random() * answers.length)];
        state.length = state.secret.length;

        // デバッグ用（コンソールに答えを表示）
        console.log('秘密の単語:', state.secret);

        // 状態をリセット
        state.grid = Array(MAX_ROWS).fill().map(() => Array(state.length).fill(''));
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

        showMessage(state.mode === 'pokemon'
            ? `${state.length}文字のポケモンです`
            : '新しいゲームを開始しました');
    }

    // モード切り替え
    function setupModeToggle() {
        document.querySelectorAll('.mode-button').forEach(button => {
            button.addEventListener('click', () => {
                if (button.dataset.mode === state.mode) return;
                state.mode = button.dataset.mode;
                saveMode(state.mode);
                applyMode();
                startNewGame();
            });
        });
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
    }

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

    // ゲームの初期化
    setupKeyboard();
    setupModeToggle();
    setupModal();
    applyMode();
    startNewGame();
});
