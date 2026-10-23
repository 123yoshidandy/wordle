import { describe, expect, it } from 'vitest';
import { baseKana, checkGuess, cycleVariant, evaluateGuess, pickAnswer, toHiragana, toKatakana } from '../js/logic.js';
import { ANSWER_WORDS } from '../js/words.js';
import { POKEMON_NAMES } from '../js/pokemon-names.js';

describe('evaluateGuess', () => {
    it('位置も合う・位置違い・含まれないを判定する', () => {
        expect(evaluateGuess('あいうえお', 'おいかきく')).toEqual(['absent', 'correct', 'absent', 'absent', 'present']);
    });

    it('同じ文字が答えより多いときは、余った分を含まれないにする', () => {
        expect(evaluateGuess('ああああい', 'いあうえお')).toEqual(['absent', 'correct', 'absent', 'absent', 'present']);
    });

    it('全部合えば全部 correct', () => {
        expect(evaluateGuess('ミュウ', 'ミュウ')).toEqual(['correct', 'correct', 'correct']);
    });
});

describe('checkGuess', () => {
    it('文字数が違えば断る', () => {
        expect(checkGuess('pokemon', 'ミュウ', 5)).toBe('5文字入力してください');
    });

    it('ポケモンモードは図鑑にある名前だけ', () => {
        expect(checkGuess('pokemon', 'ピカチュウ', 5)).toBeNull();
        expect(checkGuess('pokemon', 'アアアアア', 5)).toBe('図鑑にない名前です');
    });

    it('ことばモードはひらがなだけ', () => {
        expect(checkGuess('word', 'なつやすみ', 5)).toBeNull();
        expect(checkGuess('word', 'ナツヤスミ', 5)).toBe('ひらがなで入力してください');
    });
});

describe('「゛゜小」キーの切り替え', () => {
    const cycle = (ch, times) => Array.from({ length: times }).reduce(c => cycleVariant(c), ch);

    it('清音 → 濁音 → 清音', () => {
        expect(cycle('か', 1)).toBe('が');
        expect(cycle('か', 2)).toBe('か');
    });

    it('は行は半濁音まで、つ・うは小さい字と濁音まで回る', () => {
        expect([1, 2, 3].map(n => cycle('は', n))).toEqual(['ば', 'ぱ', 'は']);
        expect([1, 2, 3].map(n => cycle('つ', n))).toEqual(['っ', 'づ', 'つ']);
        expect([1, 2, 3].map(n => cycle('う', n))).toEqual(['ぅ', 'ゔ', 'う']);
    });

    it('カタカナでも同じように回り、切り替えのない字は null', () => {
        expect(cycle('ヒ', 2)).toBe('ピ');
        expect(cycle('ユ', 1)).toBe('ュ');
        expect(cycleVariant('ン')).toBeNull();
        expect(cycleVariant('ー')).toBeNull();
    });

    it('清音の字に戻す（キーの色に使う）', () => {
        expect(baseKana('ぱ')).toBe('は');
        expect(baseKana('ッ')).toBe('ツ');
        expect(baseKana('ヴ')).toBe('ウ');
        expect(baseKana('ン')).toBe('ン');
    });

    it('ポケモンの名前の字は、すべてキーと切り替えで打てる', () => {
        const keys = new Set([...'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんー'].map(toKatakana));
        const reachable = new Set(keys);
        for (const key of keys) {
            for (let ch = cycleVariant(key); ch && ch !== key; ch = cycleVariant(ch)) reachable.add(ch);
        }
        const missing = new Set(POKEMON_NAMES.flatMap(name => [...name]).filter(ch => !reachable.has(ch)));
        expect([...missing]).toEqual([]);
    });
});

describe('文字の変換と答え', () => {
    it('ひらがなとカタカナを行き来できる（ー はそのまま）', () => {
        expect([...'ゔぁー'].map(toKatakana).join('')).toBe('ヴァー');
        expect([...'ヴァー'].map(toHiragana).join('')).toBe('ゔぁー');
    });

    it('答えは各モードの一覧から選ぶ', () => {
        expect(POKEMON_NAMES).toContain(pickAnswer('pokemon', () => 0.5));
        expect(ANSWER_WORDS).toContain(pickAnswer('word', () => 0.5));
    });

    it('ことばの答えは5文字のひらがな、ポケモンの名前はカタカナと ー だけ', () => {
        ANSWER_WORDS.forEach(word => expect(word).toMatch(/^[ぁ-ゖー]{5}$/));
        POKEMON_NAMES.forEach(name => expect(name).toMatch(/^[ァ-ヴー]{2,6}$/));
        expect(new Set(POKEMON_NAMES).size).toBe(POKEMON_NAMES.length);
    });
});
