const _ = require('lodash');
const { Schema } = require('mongoose');
const Utils = require('../../utils');
const Card = require('../card');

const schema = new Schema({
  type: String,
  cards: [Card.schema],
});

// Group cards according to an attribute (e.g. rank, suit)
function groupAttr(cards, attr) {
  return (
    Object
      .values(
        _.groupBy(cards, (card) => Card[attr](card)),
      )
      .sort((a, b) => b.length - a.length)
  );
}

function bestCards(cards, count = 5) {
  return (
    _.flatten(cards)
      .sort(Card.sort)
      .slice(0, count)
  );
}

function pairType(...shape) {
  return {
    pairShape: [4],
    tieIndexes: [0, 4],
    evaluate: ({ groupedRanks }) => {
      if (!Utils.hasShape(groupedRanks, shape)) {
        return null;
      }

      const pairedCards = _.flatten(
        groupedRanks.slice(0, shape.length),
      );

      const kickers = bestCards(
        groupedRanks.slice(shape.length),
        5 - pairedCards.length,
      );

      return [...pairedCards, ...kickers];
    },
  };
}

function evaluateStraight(cards) {
  const chunked = Utils.chunkIf(
    cards.sort(Card.sort),
    (a, b) => {
      const diff = Card.rank(a) - Card.rank(b);
      return diff === 1;
    },
  );

  const match = chunked.find((chunk) => chunk.length >= 5);

  if (!match) {
    return null;
  }

  return match.slice(0, 5);
}

function evaluateStraightFlush(groupedSuits) {
  if (!Utils.hasShape(groupedSuits, [5])) {
    return null;
  }

  const match = evaluateStraight(groupedSuits[0]);

  if (!match) {
    return null;
  }

  return bestCards(match, 5);
}

const TYPES = [
  {
    name: 'ROYAL_FLUSH',
    evaluate: ({ groupedSuits }) => {
      const match = evaluateStraightFlush(groupedSuits);

      if (!match || !Card.isAce(match[0])) {
        return null;
      }

      return match;
    },
  },
  {
    name: 'STRAIGHT_FLUSH',
    tieIndexes: [0],
    evaluate: ({ groupedSuits }) => (
      evaluateStraightFlush(groupedSuits)
    ),
  },
  {
    name: 'FOUR_OF_A_KIND',
    ...pairType(4),
  },
  {
    name: 'FULL_HOUSE',
    ...pairType(3, 2),
  },
  {
    name: 'FLUSH',
    tieIndexes: _.range(0, 5),
    evaluate: ({ groupedSuits }) => {
      if (!Utils.hasShape(groupedSuits, [5])) {
        return null;
      }

      return bestCards(groupedSuits[0]);
    },
  },
  {
    name: 'STRAIGHT',
    tieIndexes: [0],
    evaluate: ({ cards }) => evaluateStraight(cards),
  },
  {
    name: 'THREE_OF_A_KIND',
    ...pairType(3),
  },
  {
    name: 'TWO_PAIR',
    ...pairType(2, 2),
  },
  {
    name: 'PAIR',
    ...pairType(2),
  },
  {
    name: 'HIGH_CARD',
    tieIndexes: _.range(0, 5),
    evaluate: ({ cards }) => bestCards(cards),
  },
];

function create(cards) {
  const cardData = {
    cards,
    groupedRanks: groupAttr(cards, 'rank'),
    groupedSuits: groupAttr(cards, 'suit'),
  };

  return Utils.mapFind(
    TYPES,
    ({ name, evaluate }) => {
      const match = evaluate(cardData);

      if (!match) {
        return null;
      }

      return {
        type: name,
        cards: match,
      };
    },
  );
}

module.exports = {
  TYPES,
  schema,
  create,
};
