/*
 * @class   App
 * @author  EtienneLem
 * Special thanks to rafBM <http://twitter.com/#!/rafbm/> for the prototype class structure.
 */

// Static class hack (auto init)
$(document).ready(function(){ window.App = new App() });

//  Class
var App = function() { this.initialize.apply(this, arguments) };
App.prototype = (function() { var pro = {};

  //  Contants
      
  //  Variables
  var types           = ['clubs', 'diamonds', 'hearts', 'spades'],
      cards           = [],
      cardsIndex      = 0,
      isPlaying       = false,
      gameDealed      = false,
      dealNav         = $('#deal'),
      actionsNav      = $('#actions'),
      doubleBtn       = $('#double'),
      pCardsContainer = $('#player-cards'),
      dCardsContainer = $('#dealer-cards'),
      playerTotal     = $('#player-total'),
      playerCards     = [],
      playerAces      = 0,
      dealerTotal     = $('#dealer-total'),
      dealerCards     = [],
      dealerAces      = 0,
      allChips        = $('.chip'),
      bank            = 100,
      bankroll        = $('#bankroll'),
      doubled         = false,
      currentBet      = allChips.first().data('value');
      
  //  public
  pro.initialize = function(opts) { initialize() };
  pro.deal       = function() { deal() };
  pro.hit        = function() { hit() };
  pro.stand      = function() { stand() };
  pro.doubledown = function() { doubledown() };
  
  //  private
  var initialize = function()
  {
      $('a[href="#"]').bind('click', function(e){ e.preventDefault(); });
      initBet();
  }
  
  //  Cards management
  var initDeck = function()
  {
      for ( var i = 0; i < types.length; i++ ) {
        for ( var j = 1; j <= 13; j++ ) {
          var value = ( j > 10 ) ? 10 : j;
          cards.push({ card:j, value: value, type: types[i] });
        };
      }
    
      cards.shuffle();
  };

  var addCard = function ( side, player )
  {
      var cardData  = cards[cardsIndex],
      container = ( player == 'player' ) ? pCardsContainer : dCardsContainer;
      card      = buildCard(cardsIndex, cardData.type, cardData.card, side);
    
      cardsIndex++;
      if ( player == 'player' ) addToPlayerTotal(cardData.value);
      else                      addToDealerTotal(cardData.value);
    
      container.append(card);
  };
  
  var buildCard = function (id, type, value, side)
  {
      var card;
      if ( side == 'back' ) card = $('<div data-id="'+id+'" class="card back"></div>');
      else {
        var cardValue = ( value == 1 ) ? 'A' : ( value == 11 ) ? 'J' : ( value == 12 ) ? 'Q' : ( value == 13 ) ? 'K' : value,
            cardIcon  = ( type == 'hearts' ) ? '♥' : ( type == 'diamonds' ) ? '♦' : ( type == 'spades' ) ? '♠' : '♣',
            corner    = '<div><span>'+cardValue+'</span><span>'+cardIcon+'</span></div>',
            icons     = '<div><div class="cl"></div><div class="cc"></div><div class="cr"></div></div>';
      
        card =  $('<div data-id="'+id+'" class="card '+type+'">'+corner+'<div class="icons">'+icons+'</div>'+corner+'</div>');
      }
    
      return card;
  };

  //  Game management
  var deal = function()
  {
      if ( isPlaying ) return;
      isPlaying = true;
    
      if ( gameDealed ) {
        doubleBtn.removeClass('desactivate');
        playerTotal.html('');
        dealerTotal.html('');
        playerAces = 0;
        dealerAces = 0;
        playerCards = [];
        dealerCards = [];
        cards = [];
        cardsIndex = 0;
        doubled = false;
      }
    
      pCardsContainer.html('');
      dCardsContainer.html('');
      initDeck();
    
      changeBankroll(-1);
      ditributeCards();
      gameDealed = true;
  };

  var hit = function()
  {
      doubleBtn.addClass('desactivate');
      addCard('front', 'player');
      if ( playerCards.sum() > 21 ) lose('busted');
  };

  var stand = function()
  {
      revealDealerCard();
      if ( dealerCards.sum() < 17 ) dealerTurn();
      else end();
  };

  var dealerTurn = function()
  {
      addCard('front', 'dealer');
      dealerTotal.html(calculateDealerScore());

      if ( dealerCards.sum() < 17 ) dealerTurn();
      else end();
  };

  var doubledown = function()
  {
      if ( doubleBtn.hasClass('desactivate') ) return;

      changeBankroll(-1);
      doubled = true;
      addCard('front', 'player');
      if ( playerCards.sum() > 21 ) lose('busted');
      else stand();
  };

  var push = function()
  {
      //console.log('push');
      changeBankroll(1);
      stopGame();
  };

  var win = function ( msg )
  {
      //console.log('win', msg);
      var increment = ( doubled ) ? 4 : 2;
      changeBankroll(increment);
      stopGame();
  };

  var lose = function ( msg )
  {
      //console.log('lose', msg);
      changeBankroll(0);
      stopGame();
  };

  var end = function()
  {
      var pScore  = playerCards.sum(),
          dScore  = dealerCards.sum();

      if ( dScore > 21 ) win('dealer busted');
      else if ( dScore > pScore ) lose('');
      else if ( pScore > dScore ) win('');
      else if ( pScore == dScore ) push();
  };

  var stopGame = function()
  {
      isPlaying = false;
      dealNav.show();
      actionsNav.hide();
  };

  var ditributeCards = function()
  {
      addCard('front', 'player');
      addCard('front', 'dealer');
      addCard('front', 'player');
      addCard('back', 'dealer');

      dealNav.hide();
      actionsNav.show();

      checkBlackjack();
  };

  var checkBlackjack = function()
  {
      var pScore  = playerCards.sum(),
          dScore  = dealerCards.sum();

      if ( pScore == 21 && dScore == 21 ) push();
      else if ( pScore == 21 ) win('blackjack');
      else if ( dScore == 21 ) {
        lose('blackjack');
        revealDealerCard();
      }
  };

  //  Player management
    var addToPlayerTotal = function ( value )
    {
        if ( value == 1 ) {
          value = 11;
          playerAces++;
        }

        playerCards.push(value);
        playerTotal.html(calculatePlayerScore());
    };

    var calculatePlayerScore = function()
    {
        var score = playerCards.sum();

        if ( score > 21 && playerAces > 0 ) {
          playerCards.splice(playerCards.indexOf(11), 1, 1);
          playerAces--;
          score = calculatePlayerScore();
        }

        return score;
    };

  //  Dealer management
  var revealDealerCard = function()
  {
      var card  = $('.back'),
          id    = card.data('id'),
          data  = cards[id];

      card.html(data.card + ' ' + data.type);
      dealerTotal.html(calculateDealerScore());
  };

  var addToDealerTotal = function ( value )
  {
      if ( value == 1 ) {
        value = 11;
        dealerAces++;
      }

      dealerCards.push(value);
  };

  var calculateDealerScore = function()
  {
      var score = dealerCards.sum();

      if ( score > 21 && dealerAces > 0 ) {
        dealerCards.splice(dealerCards.indexOf(11), 1, 1);
        dealerAces--;
        score = calculateDealerScore();
      }

      return score;
  };

  //  Bet management
  var initBet = function()
  {
      allChips.bind('click', function(e){
        allChips.removeClass('bet');

        var chip = $(this);
        chip.addClass('bet');
        changeBet(chip.data('value'));
      });
  };

  var changeBet = function ( newValue ) {
      if ( isPlaying ) return;
      currentBet = newValue;
  };

  var changeBankroll = function ( increment ) {
      bank += increment * currentBet;
      bankroll.html((bank / 10) + 'k');
  };

return pro })();

/* 
 * Array shuffle <http://snipplr.com/view/535>
 * Array sum <http://snipplr.com/view/533>
*/
Array.prototype.shuffle = function() { for(var j, x, i = this.length; i; j = Math.floor(Math.random() * i), x = this[--i], this[i] = this[j], this[j] = x); }
Array.prototype.sum = function() { for(var s = 0, i = this.length; i; s += this[--i]); return s; };