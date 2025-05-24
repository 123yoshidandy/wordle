// 単語リストの各単語の文字数を検証する
const { ANSWER_WORDS } = require('./words.js');

console.log('単語リストの検証:');
console.log('-------------------');
const nonFiveLetterWords = [];

ANSWER_WORDS.forEach(word => {
    console.log(`${word}: ${word.length}文字`);
    if (word.length !== 5) {
        nonFiveLetterWords.push(word);
    }
});

console.log('\n5文字ではない単語:');
console.log('-------------------');
nonFiveLetterWords.forEach(word => {
    console.log(`${word}: ${word.length}文字`);
});

console.log(`\n合計: ${ANSWER_WORDS.length}単語中、${nonFiveLetterWords.length}単語が5文字ではありません。`);
