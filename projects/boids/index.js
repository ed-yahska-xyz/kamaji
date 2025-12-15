
class Boid {
  constructor(x=Math.random(), y=Math.random()) {
    this.x = x;
    this.y = y;
    this.mx = 0;
    this.my = 0;
  }

  move(dx, dy) {
    this.x += dx;
    this.y += dy;
  }
}


class Boids {
  constructor(count=100) {
    this.count = count;
    this.birds = [...new Array(count)];
    for(let i = 0; i < this.birds.length; i++) {
      this.birds[i] = new Boid();
    }
  }
}


let container = document.querySelector('#app');
let boids = new Boids(100);
const canvas = document.getElementById("canvas");
canvas.height = container.clientHeight;
canvas.width = container.clientWidth;
const birdRadius = 5;
const margin = birdRadius / 2;
let effectiveWidth = canvas.width - margin;
let effectiveHeight = canvas.height - margin;
const ctx = canvas.getContext("2d");
ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvas.width, canvas.height);



function moveBoid(birds, index) {
  const add = (a, b) => a + b;
  const sub = (a, b) => a - b;
  let fx = Math.random() < 0.5 ? add : sub;
  let fy = Math.random() < 0.5 ? add : sub;
  if (birds[index].y > 0.95) fy = sub;
  if (birds[index].x > 0.95) fx = sub;
  if (birds[index].y < 0.05) fy = add;
  if (birds[index].x < 0.05) fx = add;
  birds[index].y = fy(birds[index].y, 0.01);
  birds[index].x = fx(birds[index].x, 0.01);
}

function throttle(func, timeFrame) {
  var lastTime = 0;
  return function (...args) {
      var now = new Date();
      if (now - lastTime >= timeFrame) {
          func(...args);
          lastTime = now;
      }
  };
}

window.addEventListener('resize', function () {
  throttle(init, 1000)();
})
const memory = new WebAssembly.Memory({
  initial: 32,
  maximum: 100
});
let importObject = {
  env: {
    memoryBase: 0,
    tableBase: 0,
    memory: memory,
    table: new WebAssembly.Table({initial: 32, element: 'anyfunc'}),
    abort: alert,
    jsRandom: function() {
      return Math.random()
    }
  }
}
WebAssembly.instantiateStreaming(fetch('./boids/boids.wasm'), importObject).then((result) => {
  const add = result.instance.exports.add;
  const createBoids = result.instance.exports.createBoids;
  const sizeOfBoid = 4
  const numberOfBoids = 1
  const boidz = createBoids(numberOfBoids);

  const b = new DataView(memory.buffer, boidz);
  for (let i=0; i<numberOfBoids; i+=1) {
    for (let j = 0; j < 4;) {
      boids.birds[j].x = b.getFloat32(i*j*sizeOfBoid, true);
      j+=1;
      boids.birds[j].y = b.getFloat32(i*j*sizeOfBoid, true);
      j+=1;
      boids.birds[j].mx = b.getFloat32(i*j*sizeOfBoid, true);
      j+=1;
      boids.birds[j].my = b.getFloat32(i*j*sizeOfBoid, true);
      j+=1;
    }
  }

  function init() {
    container = document.querySelector('#app');
    canvas.height = container.clientHeight;
    canvas.width = container.clientWidth;
    effectiveWidth = canvas.width - margin;
    effectiveHeight = canvas.height - margin;
    requestAnimationFrame(update)
  }
  
  function update() {
    ctx.fillStyle = "white";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle="black";
    ctx.beginPath();
  
    for(let i = 0; i < boids.birds.length; i++) {
      moveBoid(boids.birds, i);
      let x = margin + boids.birds[i].x * effectiveWidth;
      let y = margin + boids.birds[i].y * effectiveHeight;
      y = Math.min(effectiveHeight - birdRadius / 2, y);
      x = Math.min(effectiveWidth - birdRadius / 2, x);
      ctx.moveTo(x, y);
      ctx.arc(x, y, birdRadius, 0, 2*Math.PI);
    }
    ctx.fill();
    //requestAnimationFrame(update)
    setTimeout(() => {
      requestAnimationFrame(update)
    }, 16);
  }
  
  init();
});
