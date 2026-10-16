/**
 * Wordle のオンライン対戦（ゲームの定義）
 * 部屋の作成・参加・再接続・保存・送信などは netplay-kit の共通部品（server/netplay/）が行い、ここでは対戦の中身だけを決める
 *
 * 2〜4人が同じ答えを当てる。毎ラウンド全員が1つずつ答えを出し、全員がそろったら全員の結果をいっせいに公開する
 * そのラウンドで当てた人が勝ち（同じラウンドなら同着）。10ラウンドで誰も当てられなければ引き分け
 * 答えはサーバーだけが持ち、決着するまで端末には送らない。出したばかりの答えも、公開するまで本人にしか見せない
 * ラウンドの番号（round）で、前のラウンドの遅れた操作や二重の操作を黙って捨てる
 */

import { GameError } from '../netplay/room-service.js';
import { MAX_ROWS, MODES, checkGuess, evaluateGuess, pickAnswer } from '../../js/logic.js';

export default {
    minPlayers: 2,
    maxPlayers: 4,
    rematch: 'ready',             // 対戦のあとは、全員が「もう1回」を押したら、同じ顔ぶれで次の対戦を始める
    roomTtlSeconds: 24 * 60 * 60, // 部屋は最後の操作から1日で消える

    // ロビーの設定：ことば／ポケモン
    settings: {
        defaults: () => ({ mode: 'word' }),
        validate(patch, current) {
            const mode = patch.mode ?? current.mode;
            if (!MODES.includes(mode)) throw new GameError('モードの指定が正しくありません');
            return { ...current, mode };
        }
    },

    create({ players, settings, random }) {
        const secret = pickAnswer(settings.mode, random);
        return {
            mode: settings.mode,
            secret,
            length: secret.length,
            round: 1,
            phase: 'playing',
            names: players.map(player => player.name),
            rows: players.map(() => []),       // 公開した答え（{ word, result }）
            pending: players.map(() => null),  // このラウンドに出した、まだ公開していない答え
            winners: []
        };
    },

    view(game, seat, { room }) {
        return {
            mode: game.mode,
            length: game.length,
            maxRows: MAX_ROWS,
            round: game.round,
            phase: game.phase,
            players: game.names.map((name, s) => ({
                name,
                rows: game.rows[s],
                submitted: game.pending[s] !== null,
                left: Boolean(room?.players?.find(player => player.seat === s)?.left)
            })),
            myPending: game.pending[seat] ?? null,
            winners: game.winners,
            secret: game.phase === 'end' ? game.secret : null
        };
    },

    actions: {
        guess(ctx) {
            const { game, seat, message, reject } = ctx;
            if (game.phase !== 'playing' || message.round !== game.round || game.pending[seat] !== null) return ctx.ignore();

            const error = checkGuess(game.mode, message.word, game.length);
            if (error) reject(error);

            game.pending[seat] = message.word;
            revealIfReady(ctx);
        }
    },

    isOver: (game) => game.phase === 'end',

    // 対戦中に抜けた人は待たない（切断は戻ってくるかもしれないので待つ）
    // 抜けたことを全員の表示に出すため、公開しなくてもビューを送る
    onPlayerGone(ctx, { seat, reason }) {
        if (reason !== 'left') return ctx.ignore();
        ctx.game.pending[seat] = null;
        revealIfReady(ctx);
    }
};

// 抜けていない全員が答えを出したら、いっせいに公開する。公開したら true
function revealIfReady(ctx) {
    const game = ctx.game;
    if (game.phase !== 'playing') return false;

    const seats = game.names.map((_, s) => s).filter(s => !ctx.players[s]?.left);
    if (seats.length === 0 || seats.some(s => game.pending[s] === null)) return false;

    for (const s of seats) {
        const word = game.pending[s];
        game.rows[s].push({ word, result: evaluateGuess(word, game.secret) });
        if (word === game.secret) game.winners.push(s);
    }
    game.pending = game.names.map(() => null);

    if (game.winners.length > 0 || game.round >= MAX_ROWS) {
        game.phase = 'end';
    } else {
        game.round += 1;
    }
    return true;
}
