
const generateDeck = () => {
  const suits = ['H', 'D', 'C', 'S']; // Coeurs, Carreaux, Trèfles, Piques
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  return suits.flatMap((suit) => values.map((value) => `${value}${suit}`));
};

const shuffleDeck = () => {
  const deck = generateDeck();
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};




module.exports = shuffleDeck;