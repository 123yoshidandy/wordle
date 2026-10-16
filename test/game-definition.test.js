import { describe, expect, it } from 'vitest';
import { createTestServer } from '../server/netplay/testing.js';
import game from '../server/src/game-definition.js';
import { POKEMON_NAMES } from '../js/pokemon-names.js';

// 部屋を作って対戦を始め、各人の接続と答えを返す
async function startMatch(names = ['あお', 'みどり'], settings = null) {
    const server = createTestServer(game);
    const clients = await server.createRoom(names);
    if (settings) await clients[0].send('setSettings', { settings });
    await clients[0].send('start');
    const room = await server.store.getRoom(clients.code);
    return { server, clients, secret: room.game.secret, matchId: clients[0].last('lobby').matchId };
}

const guess = (client, matchId, round, word) => client.send('guess', { matchId, round, word });
const view = (client) => client.last('state').view;
const wrongWord = (secret) => (secret === 'あいうえお' ? 'かきくけこ' : 'あいうえお');

describe('ラウンドの進め方', () => {
    it('全員がそろうまで公開せず、出したことだけを相手に見せる', async () => {
        const { clients: [a, b], secret, matchId } = await startMatch();
        await guess(a, matchId, 1, wrongWord(secret));

        expect(view(a).myPending).toBe(wrongWord(secret));
        expect(view(b).myPending).toBeNull();
        expect(view(b).players[0]).toMatchObject({ submitted: true, rows: [] });
        expect(view(b).round).toBe(1);
    });

    it('全員そろったら、全員の結果をいっせいに公開して次のラウンドへ', async () => {
        const { clients: [a, b], secret, matchId } = await startMatch();
        await guess(a, matchId, 1, wrongWord(secret));
        await guess(b, matchId, 1, wrongWord(secret));

        for (const client of [a, b]) {
            const v = view(client);
            expect(v.round).toBe(2);
            expect(v.players.map(p => p.rows.length)).toEqual([1, 1]);
            expect(v.players[1].rows[0].word).toBe(wrongWord(secret));
            expect(v.players[1].rows[0].result).toHaveLength(5);
            expect(v.myPending).toBeNull();
        }
    });

    it('前のラウンドの操作や二重の操作は黙って捨てる', async () => {
        const { clients: [a, b], secret, matchId } = await startMatch();
        await guess(a, matchId, 1, wrongWord(secret));
        a.clear();
        await guess(a, matchId, 1, secret);
        await guess(a, matchId, 2, secret);
        expect(a.messages).toEqual([]);
        expect(view(b).players[0].submitted).toBe(true);
    });

    it('決められない答えは断る', async () => {
        const { clients: [a], matchId } = await startMatch(['あお', 'みどり'], { mode: 'pokemon' });
        await guess(a, matchId, 1, 'アアア');
        expect(a.last('error').code).toBe('rejected');
        expect(view(a).myPending).toBeNull();
    });
});

describe('答えを隠す', () => {
    it('決着するまで、答えはどの端末にも届かない', async () => {
        const { clients: [a, b], secret, matchId } = await startMatch();
        await guess(a, matchId, 1, wrongWord(secret));
        await guess(b, matchId, 1, wrongWord(secret));
        for (const client of [a, b]) {
            expect(JSON.stringify(client.messages)).not.toContain(secret);
            expect(view(client).secret).toBeNull();
        }
    });
});

describe('決着', () => {
    it('当てた人の勝ち。答えを公開して対戦を終える', async () => {
        const { clients: [a, b], secret, matchId } = await startMatch();
        await guess(a, matchId, 1, secret);
        await guess(b, matchId, 1, wrongWord(secret));

        expect(view(b)).toMatchObject({ phase: 'end', winners: [0], secret });
        expect(b.last('lobby').status).toBe('ended');
    });

    it('同じラウンドで当てたら同着', async () => {
        const { clients: [a, b], secret, matchId } = await startMatch();
        await guess(a, matchId, 1, secret);
        await guess(b, matchId, 1, secret);
        expect(view(a).winners).toEqual([0, 1]);
    });

    it('10ラウンドで誰も当てられなければ引き分け', async () => {
        const { clients: [a, b], secret, matchId } = await startMatch();
        for (let round = 1; round <= 10; round++) {
            await guess(a, matchId, round, wrongWord(secret));
            await guess(b, matchId, round, wrongWord(secret));
        }
        expect(view(a)).toMatchObject({ phase: 'end', winners: [], secret });
        expect(view(a).players[0].rows).toHaveLength(10);
    });

    it('もう1回で、新しい答えの対戦が始まる', async () => {
        const { server, clients: [a, b], secret, matchId } = await startMatch();
        await guess(a, matchId, 1, secret);
        await guess(b, matchId, 1, secret);
        await a.send('ready', { ready: true });
        await b.send('ready', { ready: true });

        expect(a.last('lobby')).toMatchObject({ status: 'playing', matchId: matchId + 1 });
        expect(view(a)).toMatchObject({ phase: 'playing', round: 1, winners: [] });
        const room = await server.store.getRoom(a.last('joined').roomCode);
        expect(room.game.rows).toEqual([[], []]);
    });
});

describe('抜けた人', () => {
    it('対戦中に退出した人は待たずに公開する', async () => {
        const { clients: [a, b, c], secret, matchId } = await startMatch(['あお', 'みどり', 'あか']);
        await guess(a, matchId, 1, wrongWord(secret));
        await guess(b, matchId, 1, wrongWord(secret));
        await c.send('leave');

        expect(view(a).round).toBe(2);
        expect(view(a).players[2]).toMatchObject({ left: true, rows: [] });
    });

    it('答えを出したあとに退出しても、残った人に退出が伝わる', async () => {
        const { clients: [a, b, c], secret, matchId } = await startMatch(['あお', 'みどり', 'あか']);
        await guess(a, matchId, 1, wrongWord(secret));
        await a.send('leave');

        expect(view(b).players[0]).toMatchObject({ left: true, submitted: false });
        expect(view(b).round).toBe(1);
        await guess(b, matchId, 1, wrongWord(secret));
        await guess(c, matchId, 1, wrongWord(secret));
        expect(view(b).round).toBe(2);
        expect(view(b).players[0].rows).toEqual([]);
    });

    it('切断した人は戻ってくるのを待ち、つなぎ直したら続きから出せる', async () => {
        const { server, clients: [a, b], secret, matchId } = await startMatch();
        await guess(a, matchId, 1, wrongWord(secret));
        await b.disconnect();
        expect(view(a).round).toBe(1);

        const b2 = await server.reconnect(b);
        expect(view(b2).players[0].submitted).toBe(true);
        await guess(b2, matchId, 1, wrongWord(secret));
        expect(view(a).round).toBe(2);
    });
});

describe('ポケモンモード', () => {
    it('答えは図鑑の名前で、マスの数は名前の文字数', async () => {
        const { clients: [a], secret } = await startMatch(['あお', 'みどり'], { mode: 'pokemon' });
        expect(POKEMON_NAMES).toContain(secret);
        expect(view(a)).toMatchObject({ mode: 'pokemon', length: secret.length });
    });

    it('ロビーの設定は正しいモードだけ受け付ける', async () => {
        const server = createTestServer(game);
        const [a] = await server.createRoom(['あお', 'みどり']);
        await a.send('setSettings', { settings: { mode: 'english' } });
        expect(a.last('error').message).toBe('モードの指定が正しくありません');
        expect(a.last('lobby').settings.mode).toBe('word');
    });
});
