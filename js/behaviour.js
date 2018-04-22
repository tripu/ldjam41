{
  'use strict';

  //=================================== CONSTANTS

  //--------------- Macroeconomics

  const MACRO = {
      UNEMP: {type: 'negative', min: .03, max: .11},      // Unemployment (%)
      INFLATION: {type: 'negative', min: -.15, max: .20}, // Inflation (%)
      R: {type: 'positive', min: 0, max: .2},             // Interest rate (%)
      DOW: {type: 'positive', min: 8300, max: 26300},     // Dow Jones index
      CYCLES: {min: 3, max: 12}                           // Duration of cycles (months)
    },
    CYCLES = {
      recession: {msg: 'Oh, no!\nRecession hit!!', sign: -.3},
      inflation: {msg: 'Welcome to\ninflationary period.', sign: -.15},
      neutral: {msg: 'Things got normal again.', sign: 0},
      growth: {msg: 'Markets are\non fire.', sign: .15},
      expansion: {msg: 'The economy is\nexpanding!!', sign: .3}
    },
    MOVES = {
      good: [
        'HODL!!',
        'Collect dividends',
        'Get your bonus',
        'Smart crypto',
        'Be frugal',
        'You\'re on demand!',
        'Education pays',
        'Salary raise!',
        'Lottery',
        'Effective Altruism',
        'Better job'
      ],
      bad: [
        'Pay insurance',
        'Taxes!',
        'Prices rise',
        'Lavish holidays',
        'Car crash',
        'No $%^ raise',
        'Bad stock perf',
        'Ethereum plummets',
        'Sell your gold',
        'Nobody loves you',
        'LD Jam fiasco',
        'Banks suffer',
        'Stuck at work'
      ]
    };

  //--------------- Environment and game elements

  const DEBUG = false,
    W = 1067,     // Width
    H = 600,      // Height
    DH = 50,      // Dashboard Height
    UH = H - DH,  // Useful Height
    FPS = 60,     // Frames Per Second
    G = UH * 2,   // Gravity
    J = -UH,      // Jump speed
    S = W / 200,  // Speed
    T = FPS * 4,  // Time (how many frames is one month)
    BSF = .25,    // Background Speed Factor
    FSF = .5,     // Foreground Speed Factor
    GSF = -S,     // Guy's Speed Forward
    GSB = S * 2,  // Guy's Speed Backward
    PDD = 500,    // Platform Drop Duration
    MD = 1500,    // Message Duration
    MDD = 200,    // Message Drop Duration
    CFD = 1000,   // Camera Flash Duration
    MNP = 12,     // Maximum Number of Platforms
    LP = 10000,   // Life Price
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

  const UPDATE_MACRO = () => {
    cycleDuration ++;
    if (cycleDuration >= thisCycleTotal * T) {
      const C = Object.keys(CYCLES);
      let newCycle = parseInt(Math.random() * C.length);
      while (cycle === C[newCycle])
        newCycle = parseInt(Math.random() * C.length);
      cycle = C[newCycle];
      let SIGN = CYCLES[cycle].sign;
      SHOW_MESSAGE(CYCLES[cycle].msg, SIGN < 0 ? 0xff8080 : (SIGN > 0 ? 0x80ff80 : 0xc0c0c0));
      thisCycleTotal = MACRO.CYCLES.min + Math.random() * (MACRO.CYCLES.max - MACRO.CYCLES.min),
      cycleDuration = 0;
    }
  };

  //--------------- Our guy's finances

  const COMPUTE_WORTH = () => {
    worth = assets.cash + assets.bonds + assets.stocks + assets.realEstate + assets.crypto;
  };

  const UPDATE_CASH = (delta) => {
    if (assets.cash + delta <= 0) {
      lives = 1;
      return RESPAWN_OR_DIE('Bankrupcy!\nYou are in red.');
    }
    if (delta > 0)
      sfx.money.play();
    else if (delta < 0)
      sfx.ouch.play();
    assets.cash += delta;
    cashMsg.setScale(3);
    scene.tweens.add({
      targets: cashMsg,
      scaleX: 1,
      scaleY: 1,
      duration: PDD,
      ease: 'Quad.easeOut'
    });
  };

  const UPDATE_GUY = () => {
    if (0 === elapsed) {
      const SALARY = assets.income / 12;
      let delta = 0;
      if (employed)
        delta += SALARY;
      if (healthy)
        delta -= SALARY * .8;
      else
        delta -= SALARY * 1.2;
      UPDATE_CASH(delta);
    }
    cashMsg.setText('$' + parseInt(assets.cash));
    cashMsg.x = guy.x - cashMsg.displayWidth / 2;
    cashMsg.y = guy.y - guy.displayHeight;
  };

  //--------------- World (ie, platforms)

  const FIND_PLATFORM_INDEX = (element) => {
    let result = -1;
    for (let i in world)
      if (element === world[i]) {
        result = i;
        break;
      }
    return result;
  };

  const CREATE_PLATFORM = (x, y, s, text, c) => {
    let p = scene.physics.add.staticImage(x, y, 'platform').setScale(s, 1).refreshBody();
    for (let i of world)
      if (scene.physics.world.intersects(p.body, i.body)) {
        p.destroy();
        p = null;
        break;
      }
    if (p) {
      world.push(p);
      if (c)
        p.tint = c;
      if (text) {
        p.label = scene.add.text(x - s * 185 / 2, y, text, {
          fontFamily: 'Helvetica,Verdana,sans-serif',
          fontSize: 24,
          color: '#000000'
        });
        p.offsetX = 185 * s / 2.2;
        p.offsetY = (p.displayHeight - p.label.displayHeight) / 2;
      }
      p.id = totalPlats ++;
    }
    return p;
  };

  const DESTROY_PLATFORM = (p, hard = false) => {
    if (hard)
      world.splice(FIND_PLATFORM_INDEX(p), 1);
    if (p.label)
      p.label.destroy();
    p.destroy();
  };

  const DROP_PLATFORM = (p) => {
    world.splice(FIND_PLATFORM_INDEX(p), 1);
    scene.tweens.add({
      targets: p,
      y: H*1.1,
      alpha: 0,
      duration: PDD,
      ease: 'Quad.easeIn',
      onComplete: () => DESTROY_PLATFORM(p)
    });
  };

  const INIT_WORLD = () => {
    const START = [
      {x: W/3, y: UH/2, s: 4},
      {x: W, y: UH*.33, s: 2},
      {x: W*1.2, y: UH*.67, s: 3},
      {x: W*1.5, y: UH/2, s: 1}
    ];
    bg = scene.add.tileSprite(W/2, UH/2, W, UH, 'bg');
    bg.tint = 0xc0c0ff;
    fg = scene.add.tileSprite(W/2, UH/2, W, UH, 'fg');
    fg.tint = 0xc0ffc0;
    for (let i of START)
      CREATE_PLATFORM(i.x, i.y, i.s);
  };

  const UPDATE_WORLD = () => {
    let rightmost = 0,
      lost = [];
    for (let i of world) {
      const BOUNDS = i.getBounds();
      if (BOUNDS.right < W / -10) // || BOUNDS.bottom < UH / -10 || BOUNDS.top > UH * 1.1)
        lost.push(i);
      else if (BOUNDS.RIGHT > rightmost)
        rightmost = i.getBounds().right;
    }
    if (/* rightmost < W * 1.5 && */ lastPlatform && world.length < MNP) {
      const N = MNP - world.length,
        BASE = lastPlatform.y;
      let created = 0;
      while (created < N) {
        const PROB = Math.random();
        let p,
          x = rightmost - 200 + Math.random() * 4000,
          y = -1,
          v,
          c,
          m;
        while (y < 0 || y > UH)
          y = BASE /* + 53 */ - 300 + Math.random() * 600;
        if (PROB >= .8) {
          v = assets.income / 48;
          c = 0x00ff00;
          m = MOVES.good[parseInt(Math.random() * MOVES.good.length)];
        } else
          if (PROB <= .2) {
            v = assets.income / -48;
            c = 0xff0000;
            m = MOVES.bad[parseInt(Math.random() * MOVES.bad.length)];
        }
        if (!v)
          c = (parseInt(64 + Math.random() * 128) << 16) +
            (parseInt(64 + Math.random() * 128) << 8) +
            parseInt(64 + Math.random() * 128);
        p = CREATE_PLATFORM(x, y, 1 + Math.random() * 4, m, c);
        if (p) {
          if (v)
            p.value = v;
          created ++;
        }
      }
    }
    for (let i of lost)
      DESTROY_PLATFORM(i, true);
    bg.tilePositionX += S * BSF;
    bg.tilePositionY -= S * BSF * CYCLES[cycle].sign;
    fg.tilePositionX += S * FSF;
    fg.tilePositionY -= S * FSF * CYCLES[cycle].sign;
    for (let i of world) {
      i.x -= S;
      i.y += S * CYCLES[cycle].sign;
      i.refreshBody();
      if (i.label) {
        i.label.x = i.x - i.offsetX;
        i.label.y = i.y - i.offsetY;
      }
    }
  };

  //--------------- Dashboard

  const INIT_DASHBOARD = () => {
    dashb.unemp = scene.add.text(W/6, H - DH, 'Unemp:\nn/a', TS);
    dashb.inflation = scene.add.text(W/6*2, H - DH, 'Inflation:\nn/a', TS);
    dashb.r = scene.add.text(W/6*3, H - DH, 'Int. rate:\nn/a', TS);
    dashb.dow = scene.add.text(W/6*4, H - DH, 'Dow Jones:\nn/a', TS);
    dashb.overall = scene.add.text(W/6*5, H - DH, 'Economy:\nn/a', TS);
    dashb.date = scene.add.text(W * .94, 10, 'n/a', TS);
  };

  const UPDATE_DASHBOARD = () => {
    dashb.unemp.setText('Unemp:\n' + (economy.unemp * 100).toFixed(1) + '%');
    dashb.unemp.setFill(COLOURISE_MACRO(economy.unemp, MACRO.UNEMP));
    dashb.inflation.setText('Inflation:\n' + (economy.unemp * 100).toFixed(1) + '%');
    dashb.inflation.setFill(COLOURISE_MACRO(economy.inflation, MACRO.INFLATION));
    dashb.r.setText('Int. rate:\n' + (economy.r * 100).toFixed(1) + '%');
    dashb.r.setFill(COLOURISE_MACRO(economy.r, MACRO.R));
    dashb.dow.setText('Dow Jones:\n' + parseInt(economy.dow));
    dashb.dow.setFill(COLOURISE_MACRO(economy.dow, MACRO.DOW));
    dashb.overall.setText('Economy:\n' + parseInt(economyOverall * 200 - 100) + '%');
    dashb.overall.setFill(COLOURISE_MACRO(economy.dow, MACRO.DOW));
    dashb.date.setText(year + '\n' + MONTHS[month]);
  };

  //--------------- Helpers

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

  const BUY_LIFE = () => {
    if (assets.cash > LP) {
      scene.cameras.main.flash(CFD, 255, 255, 255);
      sfx.warning.play();
      assets.cash -= LP;
      livesCounter.push(scene.add.image(20 * (lives + 1), 20, 'guy').setScale(.4));
      lives ++;
    }
  };
  const PAUSE = () => {
    if(scene.physics.world.isPaused) {
      sfx.music.resume();
      scene.physics.world.isPaused = false;
    } else {
      sfx.music.pause();
      scene.physics.world.isPaused = true;
    }
  };

  const HANDLE_COLLISION = (foo, image) => {
    if (image && foo.body.touching.down) {
      if (!lastPlatform)
        lastPlatform = image;
      else if (image !== lastPlatform) {
        DROP_PLATFORM(lastPlatform);
        lastPlatform = image;
        if (image.value)
          UPDATE_CASH(image.value);
      }
    }
  };

  const INIT_MESSAGE = () => {
    message = scene.add.text(-W, -H, '', {
      fontFamily: 'Helvetica,Verdana,sans-serif',
      fontSize: 72,
      fontWeight: 'bold',
      color: '#ffffff',
    });
    message.alpha = 0;
  };

  const SHOW_MESSAGE = (text, c, duration) => {
    if (text) {
      scene.children.bringToTop(message);
      sfx.warning.play();
      scene.physics.world.isPaused = true;
      scene.cameras.main.flash(CFD, (c & 0xff0000) >> 16, (c & 0xff00) >> 8, c & 0xff);
      message.setText(text);
      message.x = (W -  message.displayWidth) / 2;
      message.y = -message.displayHeight;
      scene.tweens.add({
        targets: message,
        y: (UH - message.displayHeight) / 2,
        alpha: 1,
        duration: MDD,
        ease: 'Quad.easeOut',
        onComplete: () => {
          scene.tweens.add({
            targets: message,
            y: H,
            alpha: 0,
            delay: duration ? duration : MD,
            duration: MDD,
            ease: 'Quad.easeOut',
            onComplete: () => {
              scene.physics.world.isPaused = false;
            }
          });
        }
      });
    }
  };

  const RESPAWN_OR_DIE = (message) => {
    sfx.ouch.play();
    assets.cash /= 2;
    lives --;
    livesCounter.pop().destroy();
    if (lives > 0) {
      guy.setVelocity(0, 0);
      guy.x = W / 2;
      guy.y = UH / 4;
      scene.cameras.main.flash(CFD, 255, 255, 255);
    } else {
      SHOW_MESSAGE(message ? message : 'The system crunched you!\nYou made $' + parseInt(assets.cash) + '.', 0xff0000, 10000)
      cashMsg.destroy();
      over = true;
    }
  };

  //--------------- Phaser's standard routines
  // @TODO: why not fat arrow syntax here?

  function PRELOAD() {
    scene = this;
    scene.load.image('bg', 'img/bg.jpeg');
    scene.load.image('fg', 'img/fg.png');
    scene.load.image('platform', 'img/platform.png');
    scene.load.image('guy', 'img/guy.png');
    scene.load.audio('music', 'snd/music.mp3');
    scene.load.audio('warning', 'snd/warning.mp3');
    scene.load.audio('jump', 'snd/uh.mp3');
    scene.load.audio('money', 'snd/money.mp3');
    scene.load.audio('ouch', 'snd/ouch.mp3');
  };

  function CREATE() {
    const DIM_MUSIC = () => {
      sfx.music.mute = true;
    };
    const RESUME_MUSIC = () => {
      sfx.music.mute = over;
    };
    INIT_WORLD();
    INIT_DASHBOARD();
    INIT_MESSAGE();
    guy = scene.physics.add.sprite(W/2, UH/2-28-33, 'guy');
    guy.setBounce(.3);
    guy.setCollideWorldBounds(false);
    scene.physics.add.collider(guy, world, HANDLE_COLLISION);
    livesCounter.push(scene.add.image(20, 20, 'guy').setScale(.4));
    livesCounter.push(scene.add.image(40, 20, 'guy').setScale(.4));
    livesCounter.push(scene.add.image(60, 20, 'guy').setScale(.4));
    cashMsg = scene.add.text(0, 0, 'n/a', TS);
    sfx.music = scene.sound.add('music');
    sfx.music.setLoop(true);
    sfx.warning = scene.sound.add('warning');
    sfx.warning.on('play', DIM_MUSIC);
    sfx.warning.on('ended', RESUME_MUSIC);
    sfx.uh = scene.sound.add('jump');
    sfx.money = scene.sound.add('money');
    sfx.money.on('PLAY', DIM_MUSIC);
    sfx.money.on('ended', RESUME_MUSIC);
    sfx.ouch = scene.sound.add('ouch');
    controls.cursor = scene.input.keyboard.createCursorKeys();
    scene.input.keyboard.on('keydown_PAUSE', PAUSE);
    scene.input.keyboard.on('keydown_P', PAUSE);
    scene.input.keyboard.on('keydown_SPACE', BUY_LIFE);
    sfx.music.play();
  };

  function UPDATE(delta) {
    if (over)
      return window.setTimeout(() => {
        game.destroy(true);
        return window.setTimeout(() => {
          window.location.reload(false);
        }, 1000);
      }, 10000);
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
      dashb.date.setScale(3);
      scene.tweens.add({
        targets: dashb.date,
        scaleX: 1,
        scaleY: 1,
        duration: PDD,
        ease: 'Quad.easeOut'
      });
    }
    COMPUTE_ECONOMY();
    COMPUTE_WORTH();
    UPDATE_MACRO();
    UPDATE_GUY();
    UPDATE_WORLD();
    UPDATE_DASHBOARD();
    if (guy.y >= UH || guy.x <= 0)
      RESPAWN_OR_DIE();
    else {
      if (guy.y >= UH - guy.height / 2 || guy.x <= guy.width / 2)
        scene.cameras.main.shake(100, 0.05);
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
    }
  };

  //--------------- Main function, initialisation

  const START = (e) => {
    const CONTAINER = document.getElementById('container');
    if (e && ('Enter' === e.code || 'click' === e.type)) {
      if (e.cancelable)
        e.preventDefault();
      document.removeEventListener('keydown', START);
      document.getElementById('play').removeEventListener('click', START);
      CONTAINER.innerHTML = null;
      game = new Phaser.Game(CONFIG);
    }
  };

  const INIT = () => {
    const HTML_CLASSES = document.firstElementChild.classList,
      LINK = document.getElementById('play');
    HTML_CLASSES.remove('no-js');
    HTML_CLASSES.add('js');
    window.removeEventListener('load', INIT);
    document.addEventListener('keydown', START);
    LINK.addEventListener('click', START);
  };

  //=================================== VARIABLES

  //--------------- Economy

  let cycle = 'neutral',
    cycleDuration = 0,
    thisCycleTotal = MACRO.CYCLES.min + Math.random() * (MACRO.CYCLES.max - MACRO.CYCLES.min),
    economy = {
      unemp: PICK_START_CONDITION(MACRO.UNEMP),
      inflation: PICK_START_CONDITION(MACRO.INFLATION),
      r: PICK_START_CONDITION(MACRO.R),
      dow: PICK_START_CONDITION(MACRO.DOW)
    },
    economyOverall = COMPUTE_ECONOMY;

  //--------------- Our guy's finances

  let lives = 3,
    assets = {
      cash: 20000,
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

  let game,
    bg,
    fg,
    world = [],
    guy,
    livesCounter = [],
    cashMsg,
    message,
    totalPlats = 0;
    dashb = {},
    sfx = {};

  window.addEventListener('load', INIT);
}
