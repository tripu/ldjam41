{
  'use strict';

  //=================================== CONSTANTS

  //--------------- Macroeconomics

  const MACRO = {
    UNEMP: {type: 'negative', min: .03, max: .11},      // Unemployment (%)
    INFLATION: {type: 'negative', min: -.15, max: .20}, // Inflation (%)
    R: {type: 'positive', min: 0, max: .2},             // Interest rate (%)
    DOW: {type: 'positive', min: 8300, max: 26300},     // Dow Jones index
    CYCLES: {min: 6, max: 24}         // Duration of cycles (months)
  };

  //--------------- Environment and game elements

  const DEBUG = false,
    W = 1067,     // Width
    H = 600,      // Height
    DH = 50,      // Dashboard Height
    UH = H - DH,  // Useful Height
    FPS = 60,     // Frames Per Second
    G = UH * 2,   // Gravity
    J = -UH,       // Jump speed
    S = W / 200,  // Speed
    T = FPS,      // Time (how many frames is one month)
    BS = S / 4,   // Background Speed
    FS = S / 2,   // Foreground Speed
    GSF = -S,     // Guy's Speed Forward
    GSB = S * 2,  // Guy's Speed Backward
    TS = {        // Text Style
      fontFamily: 'Helvetica,Verdana,sans-serif',
      fontSize: 18,
      color: '#e0e0e0'
    };

  //--------------- Helpers

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  //--------------- Config

  const CONFIG = {
    type: Phaser.AUTO,
    width: W,
    height: H,
    parent: 'container',
    // loader: {
    //   baseURL: 'img'
    // },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: {
          y: G
        },
        debug: DEBUG
      }
    },
    scene: {
      preload: PRELOAD,
      create: CREATE,
      update: UPDATE
    }
  };

  //=================================== ROUTINES

  //--------------- Macroeconomics

  const UPDATE_MACRO = () => {
    let change = 0;
    cycleDuration ++;
    if (cycleDuration >= MACRO.CYCLES.max * T)
      change = 1;
    else if (cycleDuration >= MACRO.CYCLES.min)
      change
    if (change >= 1) {
    }
  };

  //--------------- Our guy's finances

  const UPDATE_GUY = () => {
    if (0 === elapsed && employed)
      assets.cash += assets.income / 12;
    wealthMsg.setText('$' + parseInt(worth));
    wealthMsg.x = guy.x - wealthMsg.displayWidth / 2;
    wealthMsg.y = guy.y - guy.displayHeight;
  };

  //--------------- World (ie, platforms)

  const INIT_WORLD = () => {
    world = scene.physics.add.staticGroup();
    const P = world.create(W/2, UH/2, 'platform').setScale(6, 1).refreshBody();
    // console.dir(P);
  };

  const UPDATE_WORLD = () => {
    let rightmost,
      top = Number.MIN_SAFE_INTEGER,
      lost = [];
    for (let i of world.children.entries) {
      const right = i.getBounds().right;
      if (right < W / -10)
        lost.push(i);
      else if (right > top) {
        rightmost = i;
        top = i.getBounds().right;
      }
    }
    if (top < W * 1.5) {
      const N = parseInt(1 + Math.random() * 2);
      console.log(W, top, world.children.size);
      console.log('Creating ' + N);
      // console.dir(lastPlatform);
      for (let i = 0; i < N; i ++) {
        let x = top + 100 + Math.random() * 200,
          y = -1;
        while (y < 100 || y > UH - 100)
          y = guy.y + 58 - 300 + Math.random() * 600;
        world.create(x, y, 'platform').setScale(1 + Math.random() * 3, 1).refreshBody();
      }
    }
    for (let i of lost)
      world.remove(i, true);
  };

  //--------------- Dashboard

  const INIT_DASHBOARD = () => {
    dashb.unemp = scene.add.text(0, H - DH, 'Unemployment:\nn/a', TS);
    dashb.inflation = scene.add.text(200, H - DH, 'Inflation:\nn/a', TS);
    dashb.r = scene.add.text(400, H - DH, 'Interest rate:\nn/a', TS);
    dashb.dow = scene.add.text(600, H - DH, 'Dow Jones:\nn/a', TS);
    dashb.overall = scene.add.text(W - 200, H - DH, 'Economy:\nn/a', TS);
    dashb.date = scene.add.text(W * .9, 0, 'n/a', TS);
  };

  const UPDATE_DASHBOARD = () => {
    dashb.unemp.setText('Unemployment:\n' + (economy.unemp * 100).toFixed(1) + '%');
    dashb.unemp.setFill(COLOURISE_MACRO(economy.unemp, MACRO.UNEMP));
    dashb.inflation.setText('Inflation:\n' + (economy.unemp * 100).toFixed(1) + '%');
    dashb.inflation.setFill(COLOURISE_MACRO(economy.inflation, MACRO.INFLATION));
    dashb.r.setText('Interest rate:\n' + (economy.r * 100).toFixed(1) + '%');
    dashb.r.setFill(COLOURISE_MACRO(economy.r, MACRO.R));
    dashb.dow.setText('Dow Jones:\n' + parseInt(economy.dow));
    dashb.dow.setFill(COLOURISE_MACRO(economy.dow, MACRO.DOW));
    dashb.overall.setText('Economy:\n' + parseInt(economyOverall * 200 - 100) + '%');
    dashb.overall.setFill(COLOURISE_MACRO(economy.dow, MACRO.DOW));
    dashb.date.setText(year + '\n' + MONTHS[month]);
  };

  //--------------- Helpers

  const PICK_START_CONDITION = (boundaries) =>
    boundaries.min + (boundaries.max - boundaries.min) * (.3333 + Math.random() * .3333);

  const EVALUATE_MACRO = (value, boundaries) => (value - boundaries.min) / (boundaries.max - boundaries.min) * ('positive' === boundaries.type ? -1 : 1);

  const COMPUTE_ECONOMY = () => {
    economyOverall =
      (EVALUATE_MACRO(economy.unemp, MACRO.UNEMP) +
      EVALUATE_MACRO(economy.inflation, MACRO.INFLATION) +
      EVALUATE_MACRO(economy.r, MACRO.R) +
      EVALUATE_MACRO(economy.dow, MACRO.DOW)) / 4;
  };

  const COLOURISE_MACRO = (value, boundaries) => {
    const R = EVALUATE_MACRO(value, boundaries);
    if (R < .2)
      return '#ff0000';
    if (R < .4)
      return '#e08080';
    if (R < .6)
      return '#c0c0c0';
    if (R < .8)
      return '#80e080';
    else
      return '#00ff00';
  };

  const PAUSE = () => {
    scene.physics.world.isPaused = !scene.physics.world.isPaused;
  };

  const COMPUTE_WORTH = () => {
    worth = assets.cash + assets.bonds + assets.stocks + assets.realEstate + assets.crypto;
  };

  const HANDLE_COLLISION = (sprite, group) => {
    // console.dir(guy);
    // for (let i of world.children.entries)
    //   console.dir(i);
  };

  //--------------- Phaser's standard routines
  // @TODO: why not fat arrow syntax here?

  function PRELOAD () {
    scene = this;
    this.load.image('bg', 'img/bg.jpeg');
    this.load.image('fg', 'img/fg.png');
    this.load.image('platform', 'img/platform.png');
    this.load.image('guy', 'img/guy.png');
    this.load.audio('jump', 'snd/uh.mp3');
  };

  function CREATE() {
    bg = this.add.tileSprite(W/2, UH/2, W, UH, 'bg');
    fg = this.add.tileSprite(W/2, UH/2, W, UH, 'fg');
    INIT_WORLD(this);
    guy = this.physics.add.sprite(W/4, UH/2-27-31, 'guy');
    // guy.body.onCollide = (e) => console.dir(e);
    guy.setBounce(.3);
    guy.setCollideWorldBounds(false);
    wealthMsg = this.add.text(0, 0, 'n/a', TS);
    message = this.add.text(16, 16, '', TS);
    INIT_DASHBOARD(this);
    sfx.uh = this.sound.add('jump');
    this.physics.add.collider(world, guy, HANDLE_COLLISION);
    controls.cursor = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on('keydown_PAUSE', PAUSE);
    this.input.keyboard.on('keydown_P', PAUSE);
  };

  function UPDATE(delta) {
    if (over)
      return window.setTimeout(() => {
        window.location.reload(false)
      }, 2000);
    if (scene.physics.world.isPaused)
      return;
    elapsed++;
    if (elapsed >= T) {
      month ++;
      if (month > 11) {
        year ++;
        month = 0;
      }
      elapsed = 0;
    }
    COMPUTE_ECONOMY();
    COMPUTE_WORTH();
    UPDATE_MACRO();
    UPDATE_GUY();
    UPDATE_WORLD();
    UPDATE_DASHBOARD();
    message.setText();
    bg.tilePositionX += BS;
    fg.tilePositionX += FS;
    for (let i of world.children.entries) {
      i.x -= S;
      i.body.x -= S;
    }
    if (guy.y >= UH) {
      message.setText('You\'re bankrupt! Game over :(');
      over = true;
      return;
    }
    if (guy.x <= 0) {
      message.setText('The system crunched you! Game over :(');
      over = true;
      return;
    }
    if (guy.y >= UH - guy.height / 2 || guy.x <= guy.width / 2)
      this.cameras.main.shake(50, 0.01);
    if (controls.cursor.left.isDown)
      guy.x -= GSB;
    else if (controls.cursor.right.isDown)
      guy.x -= GSF;
    else
      guy.x -= S;
    if (controls.cursor.up.isDown && guy.body.touching.down) {
      guy.setVelocityY(J);
      sfx.uh.play();
    }
  };

  //--------------- Main function, initialisation

  const INIT = () => {
    const HTML_CLASSES = document.firstElementChild.classList,
      CONTAINER = document.getElementById('container'),
      LINK = document.getElementById('play');
    window.removeEventListener('load', INIT);
    LINK.addEventListener('click', () => {
      CONTAINER.innerHTML = null;
      HTML_CLASSES.remove('no-js');
      HTML_CLASSES.add('js');
      game = new Phaser.Game(CONFIG);
    });
  };

  //=================================== VARIABLES

  //--------------- Economy

  let cycle = 'neutral',
    cycleDuration = 0,
    economy = {
      unemp: PICK_START_CONDITION(MACRO.UNEMP),
      inflation: PICK_START_CONDITION(MACRO.INFLATION),
      r: PICK_START_CONDITION(MACRO.R),
      dow: PICK_START_CONDITION(MACRO.DOW)
    },
    economyOverall = COMPUTE_ECONOMY;

  //--------------- Our guy's finances

  let assets = {
      cash: 2000,
      income: 40000,
      bonds: 0,
      stocks: 0,
      realEstate: 0,
      crypto: 0
    },
    liabilities = {
    },
    employed = true,
    employedDuration = 0,
    healthy = true,
    healthyDuration = 0,
    worth;

  //--------------- General status and controls

  let scene,
    over = false,
    lastPlatform,
    now = new Date(),
    year = now.getFullYear(),
    month = now.getMonth(),
    elapsed = 0,
    controls = {};

  //--------------- Game elements

  let bg,
    fg,
    world,
    guy,
    wealthMsg,
    message,
    dashb = {},
    sfx = {};

  window.addEventListener('load', INIT);
}
