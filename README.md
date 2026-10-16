# 日本語Wordle

## プロジェクト概要

日本語版Wordle風ゲームです。プレイヤーは5文字のひらがな単語を10回以内に当てることを目指します。1人プレイは画面だけで動き、オンライン対戦は AWS（API Gateway WebSocket + Lambda + DynamoDB）のサーバーを使います。

## 機能

- 5文字の日本語（ひらがな）単語を推測するゲーム
- ポケモンモード：全世代のポケモンの名前（カタカナ）を当てる。マスの数は名前の文字数（2〜6文字）に合わせて変わり、図鑑にある名前だけ入力できる
  - 名前の一覧（`js/pokemon-names.js`）は PokeAPI の `pokemon_species_names.csv` から作成。記号や数字を含む名前（ニドラン♀、ポリゴン２、タイプ：ヌル、カプ・コケコなど）は除外している
- オンライン対戦（2〜4人）：全員が同じ答えを当てる。毎ラウンド全員が1つずつ答えを出し、そろったらいっせいに全員の結果（文字と色）を公開する。そのラウンドで当てた人の勝ち（同じラウンドなら同着）、10ラウンドで誰も当てられなければ引き分け
  - 答えの判定はサーバーで行い、答えは決着するまで端末に送らない
  - 部屋番号か招待URLで参加する。ことば／ポケモンはロビーでホストが選ぶ。対戦後は全員が「もう1回」を押すと再戦する
  - 対戦中に部屋を出た人は待たずに進める。通信が切れた人は戻るのを待ち、再読み込みすると同じ席に戻る
- 10回までの推測チャンス
- 文字の状態に応じたビジュアルフィードバック：
  - 緑色：正しい文字が正しい位置にある
  - 黄色：正しい文字だが位置が異なる
  - 灰色：単語に含まれない文字
- 画面上のキーボードでの入力対応
- 物理キーボードでの入力対応
- レスポンシブデザイン
- 新しいゲーム機能

## 使い方

1. キーボードまたは画面上のボタンを使って単語を入力
2. 「決定」ボタンまたはEnterキーを押して回答を提出
3. 色付きのフィードバックを基に次の推測を行う
4. 「新規」ボタンでいつでも新しい単語にチャレンジできます。「対戦」ボタンからオンライン対戦の部屋を作る・参加する

## 技術スタック

- 画面：HTML / CSS / JavaScript（ES Modules、ビルドなし）
- オンライン対戦：[netplay-kit](../netplay-kit) の共通部品（`server/netplay/`・`js/netplay/` にコピー。版は `netplay-kit.lock.json`）
- テスト：Vitest（Node 22）

## フォルダ構成

- `index.html` / `styles.css`：画面
- `js/main.js`：1人プレイと盤面の表示
- `js/logic.js`：判定（画面とサーバーで共通）
- `js/online.js`：オンライン対戦の部屋と通信
- `js/online-config.js`：本番のサーバーの URL
- `js/words.js` / `js/pokemon-names.js`：答えの一覧
- `server/src/game-definition.js`：オンライン対戦の中身（netplay-kit のゲームの定義）
- `server/template.yaml` / `server/samconfig.toml`：AWS SAM の設定（スタック `wordle-online`、東京リージョン）
- `test/`：テスト

## ローカルでの実行方法

ES Modules を使うので、`index.html` をファイルとして直接開くのではなく、HTTP サーバーで配信して開きます。

```bash
python3 -m http.server 8080   # http://localhost:8080/ を開く
```

オンライン対戦を手元で試すときは、テスト用サーバーも動かします（localhost で開くと ws://localhost:8787 につながる）。

```bash
npm install
npm run dev:server            # ポートを変えるときは PORT=8788 npm run dev:server と ?server=ws://localhost:8788
npm test
```

## オンライン対戦のサーバー（AWS）

```bash
npm run deploy:server         # esbuild でまとめて sam deploy（変更セットを確認してから反映）
```

デプロイしたら、出力された `WebSocketUrl` を `js/online-config.js` の `ONLINE_DEPLOYED_SERVER_URL` に書きます。書くまでは、公開ページに「対戦」ボタンは出ません。

netplay-kit を新しい版にするときは、netplay-kit の側で `node scripts/sync.mjs ~/MyProjects/wordle` を実行します。コピーしたファイルは直接直しません。