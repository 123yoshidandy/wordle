// 解答となる可能性のある単語リスト
const ANSWER_WORDS = [
    "APPLE", "BEACH", "CHAIR", "DANCE", "EAGLE", "FLAME", "GHOST", "HOUSE", "IMAGE", "JUICE", 
    "KNIFE", "LIGHT", "MUSIC", "NORTH", "OCEAN", "PIANO", "QUEEN", "RIVER", "STONE", "TABLE", 
    "URBAN", "VIRUS", "WATER", "XEROX", "YOUTH", "ZEBRA", "BRAVE", "CREST", "DREAM", "EARTH", 
    "FRUIT", "GLASS", "HEART", "ISLAND", "JELLY", "KITE", "LEMON", "MAGNET", "NIGHT", "ORANGE", 
    "POWER", "QUILT", "RADIO", "SNAKE", "TIGER", "UMBRELLA", "VALUE", "WORLD", "XYLOPHONE", "YELLOW"
];

// プレイヤーが入力できる有効な単語リスト（解答候補を含む）
const VALID_WORDS = [
    // 解答候補の単語をすべて含める
    ...ANSWER_WORDS,
    // 追加の有効な単語
    "ABOUT", "ABOVE", "ABUSE", "ACTOR", "ADAPT", "ADMIT", "ADOPT", "ADULT", "AFTER", "AGAIN", 
    "AGENT", "AGREE", "AHEAD", "ALARM", "ALBUM", "ALERT", "ALIKE", "ALIVE", "ALLOW", "ALONE", 
    "ALONG", "ALTER", "AMONG", "ANGER", "ANGLE", "ANGRY", "ANKLE", "APART", "APPLE", "APPLY", 
    "ARENA", "ARGUE", "ARISE", "ARMOR", "ARMY", "AROMA", "ARRAY", "ARROW", "ASSET", "AVOID", 
    "AWARD", "AWARE", "AWFUL", "BACON", "BADGE", "BADLY", "BAKER", "BASES", "BASIC", "BASIS", 
    "BATCH", "BEAST", "BEGAN", "BEGIN", "BEGUN", "BEING", "BELOW", "BENCH", "BERRY", "BIRTH", 
    "BLACK", "BLADE", "BLANK", "BLAST", "BLAZE", "BLEAK", "BLEND", "BLESS", "BLIND", "BLOCK", 
    "BLOOD", "BLOOM", "BLUES", "BLUNT", "BOARD", "BOAST", "BONUS", "BOOST", "BOOTH", "BORN", 
    "BOUND", "BRACE", "BRAIN", "BRAKE", "BRAND", "BRAVE", "BREAD", "BREAK", "BREED", "BRICK", 
    "BRIDE", "BRIEF", "BRING", "BROAD", "BROKE", "BROWN", "BRUSH", "BUILD", "BUILT", "BUNCH",
    "BURST", "CABIN", "CABLE", "CAMEL", "CANDY", "CARVE", "CATCH", "CAUSE", "CEASE", "CHAIN",
    // 必要に応じてさらに単語を追加
];
