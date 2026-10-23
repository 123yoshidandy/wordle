/**
 * ゲームの判定（画面とオンライン対戦のサーバーで共通）。DOM には触らない
 */

import { ANSWER_WORDS } from './words.js';
import { POKEMON_NAMES } from './pokemon-names.js';

export const MAX_ROWS = 10;
export const MODES = ['word', 'pokemon'];

const POKEMON_NAME_SET = new Set(POKEMON_NAMES);

// ひらがな⇔カタカナの変換（1文字）
export function toKatakana(ch) {
    const code = ch.charCodeAt(0);
    return code >= 0x3041 && code <= 0x3096 ? String.fromCharCode(code + 0x60) : ch;
}

export function toHiragana(ch) {
    const code = ch.charCodeAt(0);
    return code >= 0x30A1 && code <= 0x30F6 ? String.fromCharCode(code - 0x60) : ch;
}

// モードに合わせた文字にそろえる
export function normalizeLetter(mode, ch) {
    return mode === 'pokemon' ? toKatakana(ch) : toHiragana(ch);
}

// 「゛゜小」キーで切り替わる字（清音 → 濁音・半濁音・小さい字 → 清音 の順に回る）
const VARIANTS = {
    'か': 'が', 'き': 'ぎ', 'く': 'ぐ', 'け': 'げ', 'こ': 'ご',
    'さ': 'ざ', 'し': 'じ', 'す': 'ず', 'せ': 'ぜ', 'そ': 'ぞ',
    'た': 'だ', 'ち': 'ぢ', 'つ': 'っづ', 'て': 'で', 'と': 'ど',
    'は': 'ばぱ', 'ひ': 'びぴ', 'ふ': 'ぶぷ', 'へ': 'べぺ', 'ほ': 'ぼぽ',
    'あ': 'ぁ', 'い': 'ぃ', 'う': 'ぅゔ', 'え': 'ぇ', 'お': 'ぉ',
    'や': 'ゃ', 'ゆ': 'ゅ', 'よ': 'ょ', 'わ': 'ゎ'
};
const FAMILY = {};
for (const [base, variants] of Object.entries(VARIANTS)) {
    const family = [base, ...variants];
    family.forEach(ch => { FAMILY[ch] = family; });
}

const isKatakana = (ch) => ch !== toHiragana(ch);

// 清音の字（が → か、ッ → ツ）。切り替えのない字はそのまま
export function baseKana(ch) {
    const family = FAMILY[toHiragana(ch)];
    if (!family) return ch;
    return isKatakana(ch) ? toKatakana(family[0]) : family[0];
}

// 「゛゜小」で次の字にする。切り替えのない字なら null
export function cycleVariant(ch) {
    const hira = toHiragana(ch);
    const family = FAMILY[hira];
    if (!family) return null;
    const next = family[(family.indexOf(hira) + 1) % family.length];
    return isKatakana(ch) ? toKatakana(next) : next;
}

// 答えを選ぶ（random は 0 以上 1 未満を返す関数）
export function pickAnswer(mode, random = Math.random) {
    const answers = mode === 'pokemon' ? POKEMON_NAMES : ANSWER_WORDS;
    return answers[Math.floor(random() * answers.length)];
}

// 決定できる入力か。だめなら理由を返し、よければ null
export function checkGuess(mode, guess, length) {
    if (typeof guess !== 'string' || guess.length !== length) return `${length}文字入力してください`;
    if (mode === 'pokemon') {
        return POKEMON_NAME_SET.has(guess) ? null : '図鑑にない名前です';
    }
    return /^[ぁ-ゖー]+$/.test(guess) ? null : 'ひらがなで入力してください';
}

// 1文字ずつの判定：correct（位置も合う）・present（含まれるが位置が違う）・absent（含まれない）
export function evaluateGuess(guess, secret) {
    const result = Array(guess.length).fill('absent');
    const remaining = {};

    // 正しい位置の文字を先に数え、残った文字で位置違いを判定する
    for (let i = 0; i < secret.length; i++) {
        if (guess[i] === secret[i]) {
            result[i] = 'correct';
        } else {
            remaining[secret[i]] = (remaining[secret[i]] || 0) + 1;
        }
    }
    for (let i = 0; i < guess.length; i++) {
        if (result[i] !== 'correct' && remaining[guess[i]] > 0) {
            result[i] = 'present';
            remaining[guess[i]]--;
        }
    }
    return result;
}
