// my-scene.js - 自主实践：星球宇宙（Three.js）
// 主题：太阳系简化版——中央恒星 + 多颗行星公转 + 行星环 + 星空背景
// 设计：整体围绕"宇宙星系"主题，恒星发光照亮行星，行星绕恒星公转并自转

// 1.场景
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000511);
scene.fog = new THREE.Fog(0x000511, 30, 80);

// 2.相机
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 8, 18);
camera.lookAt(0, 0, 0);

// 3.渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// 4.轨道控制器
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// 5.光源
// 中央恒星作为点光源向外照射；环境光打底防止阴影面全黑
scene.add(new THREE.AmbientLight(0xffffff, 0.15));
const sunLight = new THREE.PointLight(0xffd54f, 2, 100, 2);
scene.add(sunLight);

// 6.中央恒星——自发光球体（MeshBasicMaterial 不受光）
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(1.4, 48, 48),
  new THREE.MeshBasicMaterial({ color: 0xffca28 })
);
scene.add(sun);

// 恒星外发光晕（一层半透明大球）
const sunGlow = new THREE.Mesh(
  new THREE.SphereGeometry(1.7, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xff8f00, transparent: true, opacity: 0.35 })
);
scene.add(sunGlow);

// 7.行星数据：半径、距太阳距离、公转速度、自转速度、颜色、是否带环
const planetData = [
  { radius: 0.25, distance: 3.0, orbitSpeed: 0.025, rotSpeed: 0.02,  color: 0xb0bec5 }, // 水星-灰
  { radius: 0.40, distance: 4.2, orbitSpeed: 0.018, rotSpeed: 0.015, color: 0xffab91 }, // 金星-橙
  { radius: 0.45, distance: 5.5, orbitSpeed: 0.013, rotSpeed: 0.025, color: 0x4fc3f7 }, // 地球-蓝
  { radius: 0.35, distance: 6.8, orbitSpeed: 0.010, rotSpeed: 0.022, color: 0xef5350 }, // 火星-红
  { radius: 0.85, distance: 9.0, orbitSpeed: 0.006, rotSpeed: 0.04,  color: 0xffb74d, hasRing: true } // 木星-带环
];

// 创建行星 + 轨道线
const planets = [];
planetData.forEach(data => {
  // 行星本体（Standard 材质受光照）
  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(data.radius, 32, 32),
    new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.7, metalness: 0.1 })
  );
  planet.position.x = data.distance;
  scene.add(planet);

  // 木星：加圆环
  if (data.hasRing) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(data.radius * 1.6, 0.06, 8, 80),
      new THREE.MeshStandardMaterial({ color: 0xd4a574, side: THREE.DoubleSide })
    );
    ring.rotation.x = Math.PI / 2.2;
    planet.add(ring);
  }

  // 轨道线：圆环线框
  const orbitGeo = new THREE.RingGeometry(data.distance - 0.005, data.distance + 0.005, 96);
  const orbitMat = new THREE.MeshBasicMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.18, side: THREE.DoubleSide });
  const orbit = new THREE.Mesh(orbitGeo, orbitMat);
  orbit.rotation.x = -Math.PI / 2;
  scene.add(orbit);

  planets.push({ mesh: planet, data });
});

// 8.星空背景：点云粒子（用 Points 而非 Mesh，与行星不同类对象）
const starCount = 2000;
const starsGeo = new THREE.BufferGeometry();
const positions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  const r = 60 + Math.random() * 40;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(Math.random() * 2 - 1);
  positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
  positions[i * 3 + 1] = r * Math.cos(phi);
  positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
}
starsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const stars = new THREE.Points(
  starsGeo,
  new THREE.PointsMaterial({ color: 0xffffff, size: 0.4, sizeAttenuation: true })
);
scene.add(stars);

// 9.动画循环：恒星脉动、行星公转 + 自转、星空缓转
let t = 0;
const animate = () => {
  requestAnimationFrame(animate);
  t += 0.01;

  // 恒星呼吸
  sun.scale.setScalar(1 + Math.sin(t) * 0.03);
  sunGlow.scale.setScalar(1 + Math.sin(t * 1.3) * 0.05);

  // 行星公转 + 自转
  planets.forEach(p => {
    const { mesh, data } = p;
    const angle = t * data.orbitSpeed * 10;
    mesh.position.x = Math.cos(angle) * data.distance;
    mesh.position.z = Math.sin(angle) * data.distance;
    mesh.rotation.y += data.rotSpeed;
  });

  // 星空缓慢旋转
  stars.rotation.y += 0.0003;

  controls.update();
  renderer.render(scene, camera);
};
animate();

// 10.窗口适配
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
});
