var WIDTH=1000, HEIGHT=600, pi=Math.PI;
var UpArrow=38, DownArrow=40;
var canvas, ctx, keystate;
var player, ai;
var balls = [];
var game_running = false;

// Collision helper functions
var RectRectIntersect = function(a, b) {
  /*
    Used for checking collisions between two rectangles.
  */
  var axIntersect = a.x < (b.x + b.width);
  var bxIntersect = b.x < (a.x + a.width);
  var ayIntersect = a.y < (b.y + b.height);
  var byIntersect = b.y < (a.y + a.height);
  return axIntersect && bxIntersect && ayIntersect && byIntersect;
};

var RectBallIntersect = function(rect, ball) {
  /*
    Used for checking collisions between a ball and a rectangle.
  */
  var rxIntersect = rect.x < ball.x + ball.radius;
  var bxIntersect = ball.x - ball.radius < rect.x + rect.width;
  var ryIntersect = rect.y < ball.y + ball.radius;
  var byIntersect = ball.y - ball.radius < rect.y + rect.height;
  return rxIntersect && bxIntersect && ryIntersect && byIntersect;
};

player = {
  x: null,
  y: null,
  width: 20,
  height: 100,
  score: 0,

  update: function() {
    if (keystate[UpArrow]) this.y -= 7;
    else if (keystate[DownArrow]) this.y += 7;
    this.y = Math.max(Math.min(this.y, HEIGHT - this.height), 0);
  },
  draw: function() {
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
};

ai = {
  x: null,
  y: null,
  width: 20,
  height: 100,
  score: 0,
  speed: 0.1, // 1 === always hits ball
  max_speed: 5,

  update: function() {
    // Get the closest ball on x axis
    var closest = balls[0];
    for (i = 1; i < balls.length; i++) {
      if (closest.x < balls[i].x) {
        closest = balls[i];
      }
    }
    // Follow the closest ball
    if (closest) {
      // Destination y coordinate is at the center of the ball
      var desty = closest.y - (this.height - closest.radius) * 0.5;
      this.y += Math.min((desty - this.y) * this.speed, this.max_speed);
      this.y = Math.max(Math.min(this.y, HEIGHT - this.height), 0);
    }
  },
  draw: function() {
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
};

class Ball {

  constructor(){
    this.x = 0;
    this.y = 0;
    this.color = "rgb(" +
      Math.round(Math.random() * 255) + "," +
      Math.round(Math.random() * 255) + "," +
      Math.round(Math.random() * 255) + ")";
    this.vel = {
      x: 0,
      y: 0,
    };
    this.radius = 10;
    this.start_speed = 5;
    this.speed = this.start_speed;
  }

  serve(side) {
    // Spawns ball on the paddle at random y
    var r = Math.random() - 0.5; // -0.5 to 0.5
    r /= 4 // -0.125 to 0.125
    var paddle = side===1 ? player : ai;
    this.x = side===1 ? player.x + player.width : ai.x - this.radius;
    this.y = paddle.y + (paddle.height)/2;
    this.y += (paddle.height)*r;

    this.bounce(paddle); // Set the ball of at corresponding angle
  }

  bounce(paddle) {
    // Bounces the ball from paddle at an angle.
    this.x = paddle===player ? player.x + player.width : ai.x - this.radius;
    var n = (this.y + this.radius - paddle.y)/(paddle.height + this.radius);
    var phi = 0.25*pi*(2*n - 1); // pi/4 = 45 degrees

    this.vel.x = (paddle===player ? 1 : -1)*this.speed * Math.cos(phi);
    this.vel.y = this.speed * Math.sin(phi);
    this.speed += 0.1 * this.start_speed;
    // Speed cannot be more than paddle width, otherwise it will skip through
    this.speed = Math.min(this.speed, paddle.width);
  }

  update() {
    this.x += this.vel.x;
    this.y += this.vel.y;

    // Check if ball is below or above screen
    if (0 > this.y - this.radius || this.y + this.radius > HEIGHT) {
      var offset = this.vel.y < 0 ? - (this.y - this.radius) : HEIGHT - (this.y+this.radius);
      this.y += 2*offset; // Get a nice bouncy effect
      this.vel.y *= -1;
    }

    // Check if ball hits a paddle
    var paddle = this.vel.x < 0 ? player : ai;
    if (RectBallIntersect(paddle, this)) {
      this.bounce(paddle);
      if (paddle === player) {
        player.score++;
      }
    }

    // Check if ball is out of bounds
    if (0 > this.x+this.radius || this.x > WIDTH) {
      if (paddle === player) {
        // Destroy ball
        var index = balls.indexOf(this);
        balls.splice(index, 1);
        // Check if all balls are destroyed
        if (balls.length === 0) {
          game_over();
        }
      }
      else {
        // Spawn more balls
        var len = balls.length;
        var balls_to_spawn = 1;
        for (i = len; i < len + balls_to_spawn; i++) {
          balls[i] = new Ball();
          balls[i].serve(paddle===player ? 1 : -1);
          // Randomize speed from 0.5 to 1.5
          balls[i].speed = this.speed * (Math.random() + 0.5);
        }

      }
      // Put ball back in game
      this.serve(paddle===player ? 1 : -1);
    }
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2*pi, false);
    ctx.lineWidth = 2;
    ctx.strokeStyle = this.color;
    ctx.stroke();
  }
};

function game_over() {
  //TODO Implement a game over menu
  //var string = "Game over!";
  //string += "\n";
  //string += "You scored ";
  //string += player.score;
  //alert(string);
  init();
}

function main() {
  /*
    Creates a new HTML5 canvas element, adds listeners for input and
    contains the main loop.
  */
  canvas = document.createElement("canvas")
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  ctx = canvas.getContext("2d");

  // Attempt to find a document element with specific id, otherwise attach the
  // canvas to document body.
  attach_to = document.getElementById('attached_script');
  if (attach_to == null)
  {
      attach_to = document.body;
  }
  attach_to.appendChild(canvas);

  // Add listeners for keydown and keyup
  keystate = {};
  document.addEventListener("keydown", function(evt) {
    if (evt.keyCode === UpArrow || evt.keyCode === DownArrow) {
      // Prevent up and down arrows from scrolling the website
      evt.preventDefault();
    }
    keystate[evt.keyCode] = true;
  });

  document.addEventListener("keyup", function(evt) {
    delete keystate[evt.keyCode];
  });

  init();
  var loop = function() {
    /*
      The main loop where all the magic happens.
    */
    update();
    draw();
    window.requestAnimationFrame(loop, canvas);
  };
  window.requestAnimationFrame(loop, canvas);
}

function init() {
  /*
    Sets the game to its initial positions. Can be used for restarting
    after game over.
  */
  keystate = {}; // Reset the keystate to avoid stuck buttons
  player.x = player.width;
  player.y = (HEIGHT - player.height)/2;
  player.score = 0;

  ai.x = WIDTH - (player.width + ai.width);
  ai.y = (HEIGHT - ai.height)/2;

  balls = [];
  balls[0] = new Ball();
  balls[0].serve(1);
}

function update() {
  /*
    Calls update function from every object. Essentially handles the
    physics and gameflow.
  */
  for (i = 0; i < balls.length; i++) {
    balls[i].update();
  }
  player.update();
  ai.update();
}

function draw() {
  /*
    Draws all components in game.
  */
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.save();
  ctx.fillStyle = "#fff";
  for (i = 0; i < balls.length; i++) {
    balls[i].draw();
  }
  player.draw();
  ai.draw();
  var w = 4;
  var x = (WIDTH - w)*0.5;
  var y = 0;
  var step = HEIGHT/20;
  while(y < HEIGHT) {
    ctx.fillRect(x, y+step*0.25, w, step*0.5);
    y += step;
  }
  draw_score();
  ctx.restore();
}

function draw_score() {
  /*
    Draws the current score of the player.
  */
  ctx.fillStyle = "#fff";
  ctx.font="20px Georgia";
  ctx.fillText("SCORE: " + player.score ,0.1*WIDTH,0.1*HEIGHT);
  //ctx.fillText(ai.score,0.9*WIDTH,0.1*HEIGHT);
}


main();
