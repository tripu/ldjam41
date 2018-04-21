{
  'use strict';

  const W = 800,
    H = 600,
    FPS = 60,
    G = H,
    V = W / 200,
    VB = V / 4,
    VF = V / 2,
    VGF = -V,
    VGB = V * 2;

  var CONFIG = {
    type: Phaser.AUTO,
    width: W,
    height: H,
    parent: 'container',
    loader: {
      baseURL: 'img'
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: {
          y: G
        },
        debug: false
      }
    },
    scene: {
      preload: PRELOAD,
      create: CREATE,
      update: UPDATE
    }
  };

  const CREATE_WORLD = (scene) => {
    const RESULT = scene.physics.add.staticGroup();
    RESULT.create(0, 0, 'platform').setScale(6, 1).refreshBody();
    RESULT.create(0, H/2, 'platform').setScale(6, 1).refreshBody();
    RESULT.create(W/5*4, H/6*1, 'platform');
    RESULT.create(W, H/3*2, 'platform');
    return RESULT;
  };

  function PRELOAD () {
    this.load.image('bg', 'bg.jpeg');
    this.load.image('fg', 'fg.png');
    this.load.image('platform', 'platform.png');
    this.load.image('guy', 'guy.png');
  };

  function CREATE() {
    bg = this.add.tileSprite(W/2, H/2, W, H, 'bg');
    fg = this.add.tileSprite(W/2, H/2, W, H, 'fg');
    world = CREATE_WORLD(this);
    guy = this.physics.add.sprite(W/4, H/2-27-31, 'guy');
    guy.setBounce(.3);
    guy.setCollideWorldBounds(false);
    message = this.add.text(16, 16, score, {fontSize: '32px', color: '#ffffff'});
    this.physics.add.collider(world, guy);
    controls.cursor = this.input.keyboard.createCursorKeys();
    controls.p = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    controls.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  };

  function UPDATE(delta) {
    if (controls.p.isDown || controls.space.isDown)
      paused = !paused;
    if (over || paused)
      return;
    score = delta / 100;
    message.setText('Score: ' + parseInt(score));
    bg.tilePositionX += VB;
    fg.tilePositionX += VF;
    for (let i of world.children.entries) {
      i.x -= V;
      i.body.x -= V;
    }
    if (guy.y >= H) {
      message.setText('You\'re bankrupt! Game over :(');
      over = true;
      return;
    }
    if (guy.x <= 0) {
      message.setText('The system crunched you! Game over :(');
      over = true;
      return;
    }
    if (guy.y >= H - guy.height / 2 || guy.x <= guy.width / 2)
      this.cameras.main.shake(50, 0.01);
    if (controls.cursor.left.isDown)
      guy.x -= VGB;
    else if (controls.cursor.right.isDown)
      guy.x -= VGF;
    else
      guy.x -= V;
    if (controls.cursor.up.isDown && guy.body.touching.down)
      guy.setVelocityY(-G);
  };

  const init = () => {
    const HTML_CLASSES = document.firstElementChild.classList;
    window.removeEventListener('load', init);
    HTML_CLASSES.remove('no-js');
    HTML_CLASSES.add('js');
    game = new Phaser.Game(CONFIG);
  };

  let bg,
    fg,
    world,
    guy,
    message,
    controls = {},
    score = 0,
    over = false,
    paused = false;

  window.addEventListener('load', init);
}
