{
  'use strict';

  const W = 800,
    H = 600;

  function PRELOAD () {
    this.load.image('bg', 'bg.jpeg');
    // this.load.spritesheet('dude',
    //     'src/games/firstgame/assets/dude.png',
    //     { frameWidth: 32, frameHeight: 48 }
    // );
  };

  function CREATE() {
    bg = this.add.tileSprite(W/2, H/2, W, H, 'bg');
  };

  function UPDATE() {
    bg.tilePositionX ++;
    // bg.tilePositionX ++;
  };

  var CONFIG = {
    type: Phaser.AUTO,
    width: W,
    height: H,
    parent: 'container',
    loader: {
      baseURL: 'img'
    },
    scene: {
      preload: PRELOAD,
      create: CREATE,
      update: UPDATE
    }
  };

  const init = () => {
    const HTML_CLASSES = document.firstElementChild.classList;
    window.removeEventListener('load', init);
    HTML_CLASSES.remove('no-js');
    HTML_CLASSES.add('js');
    game = new Phaser.Game(CONFIG);
  };

  let game, bg;

  window.addEventListener('load', init);
}
