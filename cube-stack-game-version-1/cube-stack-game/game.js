let scene, camera, renderer, stack = [], overhangs = [], speed = 0.14;
let gameStarted = false, score = 0, animationId;

const boxHeight = 1, originalBoxSize = 3;

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 100);
  camera.position.set(4, 4, 8);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  addLayer(0, 0, originalBoxSize, originalBoxSize);
  addLayer(-10, 0, originalBoxSize, originalBoxSize, 'x');

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
  dirLight.position.set(10, 20, 0);
  scene.add(dirLight);
}

function startGame() {
  document.getElementById("menu").style.display = "none";
  document.getElementById("score").style.display = "block";
  gameStarted = true;
  animate();
}

function gameOver() {
  cancelAnimationFrame(animationId);
  document.getElementById("game-over").style.display = "flex";
  document.getElementById('final-score').textContent = 'Your Score: ' + score;
}

function restartGame() {
  window.location.reload();
}

function placeBlock() {
  if (!gameStarted) return;

  const topLayer = stack[stack.length - 1];
  const previousLayer = stack[stack.length - 2];

  const direction = topLayer.direction;
  const delta = topLayer.threejs.position[direction] - previousLayer.threejs.position[direction];
  const overhangSize = Math.abs(delta);
  const size = direction === 'x' ? topLayer.width : topLayer.depth;

  const overlap = size - overhangSize;
  if (overlap > 0) {
    cutBox(topLayer, overlap, delta);
    const nextX = direction === 'x' ? topLayer.threejs.position.x : -10;
    const nextZ = direction === 'z' ? topLayer.threejs.position.z : -10;
    const newWidth = direction === 'x' ? overlap : topLayer.width;
    const newDepth = direction === 'z' ? overlap : topLayer.depth;
    addLayer(nextX, nextZ, newWidth, newDepth, direction === 'x' ? 'z' : 'x');

    score++;
    document.getElementById('score').textContent = 'Score: ' + score;

    camera.position.y += boxHeight;
  } else {
    gameOver();
  }
}

function addLayer(x, z, width, depth, direction) {
  const y = boxHeight * stack.length;
  const geometry = new THREE.BoxGeometry(width, boxHeight, depth);
  const material = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  scene.add(mesh);

  stack.push({ threejs: mesh, width, depth, direction });
}

function cutBox(topLayer, overlap, delta) {
  const direction = topLayer.direction;
  const newWidth = direction === 'x' ? overlap : topLayer.width;
  const newDepth = direction === 'z' ? overlap : topLayer.depth;

  const oldWidth = topLayer.width;
  const oldDepth = topLayer.depth;

  topLayer.width = newWidth;
  topLayer.depth = newDepth;

  topLayer.threejs.scale[direction] = overlap / (direction === 'x' ? oldWidth : oldDepth);
  topLayer.threejs.position[direction] -= delta / 2;

  const overhangShift = (overlap / 2 + Math.abs(delta) / 2) * Math.sign(delta);
  const overhangX = direction === 'x' ? topLayer.threejs.position.x + overhangShift : topLayer.threejs.position.x;
  const overhangZ = direction === 'z' ? topLayer.threejs.position.z + overhangShift : topLayer.threejs.position.z;
  const overhangWidth = direction === 'x' ? Math.abs(delta) : newWidth;
  const overhangDepth = direction === 'z' ? Math.abs(delta) : newDepth;

  addOverhang(overhangX, overhangZ, overhangWidth, overhangDepth);
}

function addOverhang(x, z, width, depth) {
  const y = boxHeight * (stack.length - 1);
  const geometry = new THREE.BoxGeometry(width, boxHeight, depth);
  const material = new THREE.MeshLambertMaterial({ color: 0xdddddd });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  overhangs.push(mesh);
}

function animate() {
  const topLayer = stack[stack.length - 1];
  topLayer.threejs.position[topLayer.direction] += speed;

  if (topLayer.threejs.position[topLayer.direction] > 10) speed = -Math.abs(speed);
  if (topLayer.threejs.position[topLayer.direction] < -10) speed = Math.abs(speed);

  overhangs.forEach(overhang => {
    overhang.position.y -= 0.2;
    if (overhang.position.y < -50) scene.remove(overhang);
  });

  renderer.render(scene, camera);
  animationId = requestAnimationFrame(animate);
}

window.addEventListener('mousedown', placeBlock);
window.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    e.preventDefault();
    placeBlock();
  }
});

document.getElementById("startButton").addEventListener("click", startGame);
document.getElementById("restartButton").addEventListener("click", restartGame);

init();