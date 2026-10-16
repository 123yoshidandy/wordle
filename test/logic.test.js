import { describe, expect, it } from 'vitest';
import { checkGuess, evaluateGuess, pickAnswer, toHiragana, toKatakana } from '../js/logic.js';
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
