$(document).ready(function(){
    new App();
});

var App = function()
{
    AppClass = this;
    
    var types           = ['Clubs', 'Diamonds', 'Hearts', 'Spades'],
        cards           = [],
        cardsIndex      = 0,
        isPlaying       = false,
        dealNav         = $('#deal'),
        actionsNav      = $('#actions'),
        pCardsContainer = $('#player-cards'),
        dCardsContainer = $('#dealer-cards'),
        playerTotal     = $('#player-total'),
        playerScore     = 0,
        playerCards     = [],
        playerAces      = 0;
        
  
//  Initialisation
    this.init = function()
    {
        $('a[href="#"]').bind('click', function(e){ e.preventDefault(); });
        initDeck();
    };
    
// Cards management
    var initDeck = function()
    {
        for ( var i = 0; i < types.length; i++ ) {
          for ( var j = 1; j <= 13; j++ ) {
            var value = ( j > 10 ) ? 10 : j;
            cards.push({ card:j, value: value, type: types[i] });
          };
        }
        
        //cards.shuffle();
    };
    
//  Game management
    var deal = function()
    {
        if ( isPlaying ) return;
        isPlaying = true;
        
        ditributeCards();
    };
    
    var hit = function()
    {
        addCard('front', 'player');
    };
    
    var stand = function()
    {
        
    };
    
    var double = function()
    {
        
    };
    
    var ditributeCards = function()
    {
        addCard('front', 'player');
        setTimeout(function(){ addCard('front', 'dealer'); }, 200);
        setTimeout(function(){ addCard('front', 'player'); }, 400);
        setTimeout(function(){ addCard('back', 'dealer'); }, 600);
        
        dealNav.hide();
        actionsNav.show();
    };
    
    var addCard = function ( side, player )
    {
        var cardData  = cards[cardsIndex],
            container = ( player == 'player' ) ? pCardsContainer : dCardsContainer;
            card      = ( side == 'front' )
                        ? $('<div data-id="'+cardsIndex+'" class="card">'+cardData.card+' '+cardData.type+'</div>')
                        : $('<div data-id="'+cardsIndex+'" class="card back">Back</div>');
        
        cardsIndex++;
        if ( player == 'player' ) addToPlayerTotal(cardData.value);
        
        container.append(card);
    };
    
    var addToPlayerTotal = function ( value )
    {
        if ( value == 1 ) {
          value = 11;
          playerAces++;
        }
        
        playerCards.push(value);
        playerTotal.html(calculateScore());
    };
    
    var calculateScore = function()
    {
        var score = playerCards.sum();
        
        if ( score > 21 && playerAces > 0 ) {
          playerCards.splice(playerCards.indexOf(11), 1, 1);
          playerAces--;
          score = calculateScore();
        }
        
        return score;
    };
    
//  Public access
    this.deal   = function() { deal(); };
    this.hit    = function() { hit(); };
    this.stand  = function() { stand(); };
    this.double = function() { double(); };
  
//  Constructor
    (function() {
      AppClass.init();
    })();
};

/* 
 * Array shuffle <http://snipplr.com/view/535>
 * Array sum <http://snipplr.com/view/533>
*/
Array.prototype.shuffle = function() { for(var j, x, i = this.length; i; j = Math.floor(Math.random() * i), x = this[--i], this[i] = this[j], this[j] = x); }
Array.prototype.sum = function() { for(var s = 0, i = this.length; i; s += this[--i]); return s; };