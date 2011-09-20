/*
 *  BytesJack <https://github.com/EtienneLem/bytesjack>
 *
 *  Dev      Etienne Lemay <http://twitter.com/#!/EtienneLem>
 *  Design   Tristan L'abbé <http://twitter.com/#!/_Tristan>
 *
 *  Special thanks to rafBM <http://twitter.com/#!/rafbm> for some JS tricks!
 */

// Static class hack (auto init)
$(document).ready(function(){ window.App = new App() });

//  Class
var App = function() { this.initialize.apply(this, arguments) };
App.prototype = (function() { var pro = {};

  //  Contants
  var ANIM_DELAY  = 300,
      KEY_SPACE   = 32,
      KEY_S       = 83,
      KEY_D       = 68,
      KEY_1       = 49,
      KEY_2       = 50,
      KEY_3       = 51,
      PATTERNS    = [
        [{deg: 0, top: 0}],
        [{deg: 5, top: 0}, {deg: -5, top: 0}],
        [{deg: 5, top: 15}, {deg: -1, top: 0}, {deg: -5, top: 15}],
        [{deg: 9, top: 20}, {deg: 4, top: 0}, {deg: -4, top: 0}, {deg: -9, top: 15}],
        [{deg: 12, top: 50}, {deg: 8, top: 10}, {deg: -4, top: 0}, {deg: -12, top: 15}, {deg: -16, top: 40}],
        [{deg: 14, top: 40}, {deg: 8, top: 10}, {deg: -2, top: 5}, {deg: -5, top: 15}, {deg: -8, top: 40}, {deg: -14, top: 70}],
        [{deg: 14, top: 70}, {deg: 8, top: 30}, {deg: 4, top: 10}, {deg: 0, top: 5}, {deg: -4, top: 20}, {deg: -8, top: 40}, {deg: -16, top: 70}]
      ];
      
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
      chips           = $('#chips'),
      allChips        = $('.chip'),
      bank            = 100,
      bankroll        = $('#bankroll'),
      doubled         = false,
      currentBet      = allChips.first().data('value'),
      resizeTimer     = null,
      canDoAction     = true,
      isStanding      = false,
      gameEnded       = false;
      
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
      initResize();
      initKeyboardKeys();
      
      setTimeout(function(){
        window.scrollTo(0, 1)
      }, 500);
  }
  
  //  Resize management
  var initResize = function()
  {
      $(window).bind('resize', onWindowResize);
      onWindowResize(null);
  };
  
  var onWindowResize = function ( e )
  {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function(){
        centerContainers();
      }, 100);
  };
  
  //  Keyboard managment
  var initKeyboardKeys = function() {
      $(document).bind('keydown', onKeyDown);
      $(document).bind('keyup', onKeyUp);
  };
  
  var onKeyDown = function ( e )
  {
      switch ( e.keyCode ) {
        case KEY_SPACE :
          ( isPlaying )
            ? actionsNav.children('li:first-child').children('a').addClass('active')
            : dealNav.children('a').addClass('active');
        break;
        case KEY_S : actionsNav.children('li:nth-child(2)').children('a').addClass('active'); break;
        case KEY_D : actionsNav.children('li:nth-child(3)').children('a').addClass('active'); break;
        case KEY_1 : selectChip(0); break;
        case KEY_2 : selectChip(1); break;
        case KEY_3 : selectChip(2); break;
      }
  };
  
  var onKeyUp = function ( e )
  {
      e.preventDefault();
      
      switch ( e.keyCode ) {
        case KEY_SPACE :
          if ( isPlaying ) {
            hit();
            actionsNav.children('li:first-child').children('a').removeClass('active') 
          } else {
            deal();
            dealNav.children('a').removeClass('active');
          }
        case KEY_S :
          stand();
          actionsNav.children('li:nth-child(2)').children('a').removeClass('active');
        break;
        case KEY_D :
          doubledown();
          actionsNav.children('li:nth-child(3)').children('a').removeClass('active');
        break;
        case KEY_1 : selectChip(0); break;
        case KEY_2 : selectChip(1); break;
        case KEY_3 : selectChip(2); break;
      }
  };
  
  var selectChip = function ( index )
  {
      if ( isPlaying || gameEnded ) return;
      allChips.eq(index).trigger('click');
  };
  
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

  var addCard = function ( side, player, callback )
  {
      var cardData  = cards[cardsIndex],
          container = ( player == 'player' ) ? pCardsContainer : dCardsContainer,
          card      = buildCard(cardsIndex, cardData.type, cardData.card, side),
          zIndex    = 0;
    
      cardsIndex++;
      canDoAction = false;
      
      card.css({
        'top'   : '-150%',
        'left'  : '100%'
      });  
    
      container.append(card);
      zIndex = ( player == 'player' ) ? card.index() : 50-card.index();
      card.css('z-index', zIndex);
      
      setTimeout(function(){
        card.css({
          'top'     : '0%',
          'left'    : 10 * card.index() + '%'
        });
        rotateCards(container, (player == 'player'));
        
        
        setTimeout(function(){
          centerContainer(container);
          if ( player == 'player' ) addToPlayerTotal(cardData.value);
          else                      addToDealerTotal(cardData.value);
          
          canDoAction = true;
          if ( callback != undefined ) callback.call();
        }, ANIM_DELAY + 100);
      }, 10);
  };
  
  var rotateCards = function ( container, isPlayer )
  {
      var cards     = container.children('.card'),
          numCards  = cards.size() - 1,
          increment = ( isPlayer ) ? -1 : 1,
          pattern   = ( PATTERNS[numCards] ) ? PATTERNS[numCards] : PATTERNS[PATTERNS.length-1];
      
      cards.each(function(i){
        var deg     = ( i < pattern.length ) ? pattern[i].deg : pattern[pattern.length-1].deg,
            offset  = ( i < pattern.length ) ? pattern[i].top : pattern[pattern.length-1].top + (20 * (i - pattern.length + 1));
        
        $(this).css({
          '-webkit-transform' : 'rotate('+ deg * increment +'deg)',
          '-khtml-transform' : 'rotate('+ deg * increment +'deg)',
          '-moz-transform' : 'rotate('+ deg * increment +'deg)',
          '-ms-transform' : 'rotate('+ deg * increment +'deg)',
          'transform' : 'rotate('+ deg * increment +'deg)',
          'top' : offset * -increment + 'px'
        });
      });
  };
  
  var centerContainers = function()
  {
      centerContainer(pCardsContainer);
      centerContainer(dCardsContainer);
  };
  
  var centerContainer = function ( container )
  {
      var lastCard    = container.children('.card:last-child'),
          totalWidth  = 0;
      
      if ( lastCard.size() == 0 ) return;
      
      totalWidth = lastCard.position().left + lastCard.width();
      container.css('margin-left', -totalWidth / 2 + 'px');
  };
  
  var buildCard = function (id, type, value, side)
  {
      var card;
      if ( side == 'back' ) card = $('<div data-id="'+id+'" class="card back"></div>');
      else {
        var cardValue = ( value == 1 ) ? 'A' : ( value == 11 ) ? 'J' : ( value == 12 ) ? 'Q' : ( value == 13 ) ? 'K' : value,
            cardIcon  = ( type == 'hearts' ) ? '♥' : ( type == 'diamonds' ) ? '♦' : ( type == 'spades' ) ? '♠' : '♣',
            corner    = '<div><span>'+cardValue+'</span><span>'+cardIcon+'</span></div>',
            icons     = '';
        
        if ( value <= 10 ) {
          for ( var i=1, l=value; i <= l; i++ ) {
            icons += '<span>'+cardIcon+'</span>';
          }
        } else icons = ( value == 11 ) ? '<span>♝</span>' : ( value == 12 ) ? '<span>♛</span>' : ( value == 13 ) ? '<span>♚</span>' : '';
      
        card =  $('<div data-id="'+id+'" class="card value'+cardValue+' '+type+'">'+corner+'<div class="icons">'+icons+'</div>'+corner+'</div>');
      }
    
      return card;
  };

  //  Game management
  var deal = function()
  {
      if ( isPlaying || !canDoAction || gameEnded ) return;
      
      isPlaying = true;
    
      if ( gameDealed ) {
        doubleBtn.removeClass('desactivate');
        playerTotal.html('');
        dealerTotal.html('');
        playerAces  = 0;
        dealerAces  = 0;
        playerCards = [];
        dealerCards = [];
        cards       = [];
        cardsIndex  = 0;
        doubled     = false;
        canDoAction = true;
        isStanding  = false;
        $('#message').remove();
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
      if ( !isPlaying || !canDoAction || isStanding || gameEnded ) return;
      
      doubleBtn.addClass('desactivate');
      addCard('front', 'player', function(){
        if ( playerCards.sum() > 21 ) lose('lose-busted');
      });
  };

  var stand = function()
  {
      if ( !isPlaying || !canDoAction || isStanding || gameEnded ) return;
      
      isStanding = true;
      revealDealerCard();
      
      setTimeout(function(){
        if ( dealerCards.sum() < 17 ) dealerTurn();
        else end();
      }, ANIM_DELAY);
  };

  var dealerTurn = function()
  {
      addCard('front', 'dealer', function(){
        dealerTotal.html(calculateDealerScore());

        if ( dealerCards.sum() < 17 ) dealerTurn();
        else end();
      });
  };

  var doubledown = function()
  {
      if ( !isPlaying || !canDoAction || isStanding || doubleBtn.hasClass('desactivate') || gameEnded ) return;

      changeBankroll(-1);
      doubled = true;
      addCard('front', 'player', function(){
        if ( playerCards.sum() > 21 ) lose('lose-busted');
        else stand();
      });
  };

  var push = function ( msg )
  {
      showMessage(msg);
      var increment = ( doubled ) ? 2 : 1;
      changeBankroll(increment);
      stopGame();
  };

  var win = function ( msg )
  {
      showMessage(msg);
      var increment = ( doubled ) ? 4 : 2;
      changeBankroll(increment);
      stopGame();
  };

  var lose = function ( msg )
  {
      showMessage(msg);
      changeBankroll(0);
      stopGame();
  };
  
  var showMessage = function ( status )
  {
      var msg       = document.createElement('div'),
          content   = '',
          message   = $('#message');
          
      if ( message.size() > 0 ) message.remove();
          
      msg.className = status;
      msg.id        = 'message';
          
      switch ( status ) {
        case 'win': content = 'You win'; break;
        case 'win-blackjack': content = 'You win<span>Blackjack</span>'; break;
        case 'win-dealer-busted': content = 'You win<span>Dealer busted</span>'; break;
        case 'lose': content = 'You loose'; break;
        case 'lose-blackjack': content = 'You loose<span>Blackjack</span>'; break;
        case 'lose-busted': content = 'You loose<span>Busted</span>'; break;
        case 'push': content = 'Push<span>No winner</span>'; break;
        case 'game-over': content = 'Game over'; break;
        default: content = '<span>Something broke, don’t know what happened...</span>'; break;
      }
      
      msg.innerHTML = content;
      pCardsContainer.after(msg);
  };

  var end = function()
  {
      var pScore  = playerCards.sum(),
          dScore  = dealerCards.sum();

      if ( dScore > 21 ) win('win-dealer-busted');
      else if ( dScore > pScore ) lose('lose');
      else if ( pScore > dScore ) win('win');
      else if ( pScore == dScore ) push('push');
  };
  
  var endGame = function()
  {
      showMessage('game-over');
      gameEnded = true;
      
      var overlay = document.createElement('div');
      overlay.id = 'overlay';
      
      $('body').append(overlay);
  };

  var stopGame = function()
  {
      isPlaying = false;
      dealNav.show();
      actionsNav.hide();
      chips.removeClass('disabled');
      
      allChips.each(function(i){
        var chip = $(this);
        if ( chip.data('value') > bank ) {
          chip.addClass('desactivate');
          
          var chipsAvailable = allChips.removeClass('bet').not('.desactivate');
          if ( chipsAvailable.size() == 0 ) endGame();
          else {
            var newChip = chipsAvailable.last();
            newChip.addClass('bet');
            changeBet(newChip.data('value'));
            chips.prepend(newChip);
          }
           
        } else if ( chip.hasClass('desactivate') ) chip.removeClass('desactivate');
      });
  };

  var ditributeCards = function()
  {
      canDoAction = false;
      
      addCard('front', 'player', function(){
        addCard('front', 'dealer', function(){
          addCard('front', 'player', function(){
            addCard('back', 'dealer', function(){
              checkBlackjack();
            });
          });
        });
      });
      
      dealNav.hide();
      actionsNav.show();
      chips.addClass('disabled');
  };

  var checkBlackjack = function()
  {
      var pScore  = playerCards.sum(),
          dScore  = dealerCards.sum();
      
      if ( pScore == 21 && dScore == 21 ) push('Push - No winner');
      else if ( pScore == 21 ) win('win-blackjack');
      else if ( dScore == 21 ) {
        lose('lose-blackjack');
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
      var card    = $('.back'),
          id      = card.data('id'),
          data    = cards[id],
          newCard = buildCard(id, data.type, data.value, 'front');
      
      newCard.css({
        'left' : 10 * card.index() + '%',
        'z-index' : 50-card.index()
      });
      
      card.after(newCard).remove();
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
        var chip = $(this);
        if ( isPlaying || chip.hasClass('desactivate') ) return;
        
        allChips.removeClass('bet');
        chip.addClass('bet');
        changeBet(chip.data('value'));
        
        chips.prepend(chip);
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

/* 
 * Browser Detect <http://teev.io/blog/text/13423292>
*/
var BrowserDetect = {
    init: function () {
        this.browser = this.searchString(this.dataBrowser) || "An unknown browser";
        this.version = this.searchVersion(navigator.userAgent)
        || this.searchVersion(navigator.appVersion)
        || "an unknown version";
        this.OS = this.searchString(this.dataOS) || "an unknown OS";

        var b = document.documentElement;
        b.setAttribute('browser',  this.browser);
        b.setAttribute('version', this.version );		
        b.setAttribute('os', this.OS);
    },
    searchString: function (data) {
        for (var i=0;i<data.length;i++)	{
            var dataString = data[i].string;
            var dataProp = data[i].prop;
            this.versionSearchString = data[i].versionSearch || data[i].identity;
            if (dataString) {
                if (dataString.indexOf(data[i].subString) != -1)
                return data[i].identity;
            }
            else if (dataProp)
            return data[i].identity;
        }
    },
    searchVersion: function (dataString) {
        var index = dataString.indexOf(this.versionSearchString);
        if (index == -1) return;
        return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
    },
    dataBrowser: [
    {
        string: navigator.userAgent,
        subString: "Chrome",
        identity: "Chrome"
    },
    { 	string: navigator.userAgent,
        subString: "OmniWeb",
        versionSearch: "OmniWeb/",
        identity: "OmniWeb"
    },
    {
        string: navigator.vendor,
        subString: "Apple",
        identity: "Safari",
        versionSearch: "Version"
    },
    {
        prop: window.opera,
        identity: "Opera",
        versionSearch: "Version"
    },
    {
        string: navigator.vendor,
        subString: "iCab",
        identity: "iCab"
    },
    {
        string: navigator.vendor,
        subString: "KDE",
        identity: "Konqueror"
    },
    {
        string: navigator.userAgent,
        subString: "Firefox",
        identity: "Firefox"
    },
    {
        string: navigator.vendor,
        subString: "Camino",
        identity: "Camino"
    },
    {		// for newer Netscapes (6+)
        string: navigator.userAgent,
        subString: "Netscape",
        identity: "Netscape"
    },
    {
        string: navigator.userAgent,
        subString: "MSIE",
        identity: "Explorer",
        versionSearch: "MSIE"
    },
    {
        string: navigator.userAgent,
        subString: "Gecko",
        identity: "Mozilla",
        versionSearch: "rv"
    },
    { 		// for older Netscapes (4-)
        string: navigator.userAgent,
        subString: "Mozilla",
        identity: "Netscape",
        versionSearch: "Mozilla"
    }
    ],
    dataOS : [
    {
        string: navigator.platform,
        subString: "Win",
        identity: "Windows"
    },
    {
        string: navigator.platform,
        subString: "Mac",
        identity: "Mac"
    },
    {
        string: navigator.userAgent,
        subString: "iPhone",
        identity: "iPhone/iPod"
    },
    {
        string: navigator.platform,
        subString: "Linux",
        identity: "Linux"
    }
    ]
};
BrowserDetect.init();