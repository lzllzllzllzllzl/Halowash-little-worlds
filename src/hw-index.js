/* HaloWash overview page bootstrap: four architectural building dioramas
 * (home care villa, hospital, nursing home, scalp salon) built procedurally
 * in three.js, arranged 2×2 on a dark navy stage. Bundled to an IIFE
 * exposing window.HWIndex.start(config). No external assets — works from
 * file:// with nothing but this bundle. */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const START_THETA = 45;      /* camera azimuth the fronts are composed against */
const AUTO_SPIN = 0.45;
const CELLS = [[-1, 1], [1, 1], [-1, -1], [1, -1]];

/* ---------------------------------------------------------------- palette */
const P = {
  stone:   new THREE.MeshStandardMaterial({ color: 0xd5cec1, roughness: .7 }),
  stoneLt: new THREE.MeshStandardMaterial({ color: 0xcfc8ba, roughness: .8 }),
  pave:    new THREE.MeshStandardMaterial({ color: 0xbdb9af, roughness: .85 }),
  paveDk:  new THREE.MeshStandardMaterial({ color: 0x585b5d, roughness: .9 }),
  side:    new THREE.MeshStandardMaterial({ color: 0x6a6967, roughness: .85 }),
  white:   new THREE.MeshStandardMaterial({ color: 0xe8e6e0, roughness: .55 }),
  grey:    new THREE.MeshStandardMaterial({ color: 0x9a978f, roughness: .6 }),
  char:    new THREE.MeshStandardMaterial({ color: 0x23262a, roughness: .5, metalness: .25 }),
  char2:   new THREE.MeshStandardMaterial({ color: 0x35383c, roughness: .55, metalness: .2 }),
  wood:    new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: .55 }),
  woodLt:  new THREE.MeshStandardMaterial({ color: 0x8a6242, roughness: .55 }),
  glass:   new THREE.MeshStandardMaterial({ color: 0x1d2b33, roughness: .15, metalness: .35 }),
  glassLt: new THREE.MeshStandardMaterial({ color: 0x39525c, roughness: .18, metalness: .25 }),
  win:     new THREE.MeshStandardMaterial({ color: 0x2a2118, roughness: .4, emissive: 0xff9c4a, emissiveIntensity: 2.1 }),
  winSoft: new THREE.MeshStandardMaterial({ color: 0x302820, roughness: .5, emissive: 0xffb877, emissiveIntensity: 1.2 }),
  lamp:    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .5, emissive: 0xffd9a0, emissiveIntensity: 3.2 }),
  grnD:    new THREE.MeshStandardMaterial({ color: 0x2c5a2e, roughness: .85 }),
  grnM:    new THREE.MeshStandardMaterial({ color: 0x3f7a34, roughness: .85 }),
  grnL:    new THREE.MeshStandardMaterial({ color: 0x5c9440, roughness: .85 }),
  trunk:   new THREE.MeshStandardMaterial({ color: 0x5c452e, roughness: .8 }),
  pink:    new THREE.MeshStandardMaterial({ color: 0xd0a0bc, roughness: .7 }),
  red:     new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: .45 }),
  ambW:    new THREE.MeshStandardMaterial({ color: 0xeff0ee, roughness: .4 }),
  heart:   new THREE.MeshStandardMaterial({ color: 0xd9b98c, roughness: .5 }),
  teal:    new THREE.MeshStandardMaterial({ color: 0x2aa39a, roughness: .45 }),
  blueL:   new THREE.MeshStandardMaterial({ color: 0x3359b3, roughness: .4 })
};

/* ---------------------------------------------------------------- helpers */
const G = 0.05;   /* ground level on the plinth */

function box(g, w, h, d, x, y, z, m, ry = 0) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y, z); o.rotation.y = ry;
  o.castShadow = o.receiveShadow = true;
  g.add(o); return o;
}
function cyl(g, r, h, x, y, z, m, rt, seg = 16) {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(rt ?? r, r, h, seg), m);
  o.position.set(x, y, z);
  o.castShadow = o.receiveShadow = true;
  g.add(o); return o;
}
function sph(g, r, x, y, z, m, sx = 1, sy = 1, sz = 1) {
  const o = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), m);
  o.position.set(x, y, z); o.scale.set(sx, sy, sz);
  o.castShadow = o.receiveShadow = true;
  g.add(o); return o;
}
/* row of thin vertical wood slats spanning x0..x1, height z0..z1, on plane z */
function slats(g, x0, x1, y0, y1, z, n, m, depth = .06) {
  for (let i = 0; i < n; i++) {
    const x = x0 + (x1 - x0) * (i + .5) / n;
    box(g, (x1 - x0) / n * .5, y1 - y0, depth, x, (y0 + y1) / 2, z, m);
  }
}
function win(g, w, h, x, y, z, m, ry = 0) {
  return box(g, w, h, .06, x, y, z, m || P.win, ry);
}
function tree(g, x, z, s, blossom) {
  const h = 1.15 * s;
  cyl(g, .055 * s, h, x, G + h / 2, z, P.trunk, .04 * s, 8);
  const c1 = blossom ? P.pink : P.grnM, c2 = blossom ? P.pink : P.grnL;
  sph(g, .42 * s, x, G + h + .18 * s, z, c1);
  sph(g, .30 * s, x + .18 * s, G + h + .42 * s, z - .1 * s, c2, 1, .85, 1);
  sph(g, .26 * s, x - .16 * s, G + h + .34 * s, z + .14 * s, c1, 1, .8, 1);
}
function bush(g, x, z, s, m) {
  sph(g, .22 * s, x, G + .12 * s, z, m || P.grnD, 1, .7, .9);
}
function hedge(g, x, z, w, d) {
  box(g, w, .34, d, x, G + .17, z, P.grnD);
}
function bollard(g, x, z) {
  cyl(g, .055, .62, x, G + .31, z, P.char2, .05, 10);
  cyl(g, .045, .07, x, G + .66, z, P.lamp, .045, 10);
}
function glight(g, x, z) {
  sph(g, .055, x, G + .05, z, P.lamp, 1, .55, 1);
}
function planter(g, x, z, w, d, y0) {
  const b = y0 ?? G;
  box(g, w, .34, d, x, b + .17, z, P.stoneLt);
  const n = Math.max(2, Math.round(w / .55));
  for (let i = 0; i < n; i++)
    sph(g, .16, x - w / 2 + (i + .5) * w / n, b + .42, z, i % 2 ? P.grnL : P.grnM, 1, .75, .8);
}
function plinth(g, half) {
  box(g, half * 2, 1.1, half * 2, 0, -.55, 0, P.side);
  box(g, half * 2 - .5, .16, half * 2 - .5, 0, -.02, 0, P.pave);
  box(g, half * 2 - .6, .05, half * 2 - .6, 0, G - .02, 0, P.pave);
}

/* ========================================================== ① 居家护理
 * U-shaped two-storey villa: beige stone, wood slat screens, glass balcony,
 * roof planters, front wall with a dark slat gate, warm windows. */
function buildHome() {
  const g = new THREE.Group(); g.name = "home";
  plinth(g, 4.9);
  const S = P.stone;
  box(g, 7.2, 4.0, 2.9, -.7, G + 2.0, 2.5, S);            // back volume
  box(g, 7.36, .12, 3.06, -.7, G + 4.04, 2.5, P.char2);   // parapet cap
  box(g, 2.6, 3.6, 4.6, 2.6, G + 1.8, .6, S);             // right wing
  box(g, 2.74, .12, 4.74, 2.6, G + 3.64, .6, P.char2);
  box(g, 2.4, 3.6, 4.2, -3.2, G + 1.8, .4, S);            // left wing
  box(g, 2.54, .12, 4.34, -3.2, G + 3.64, .4, P.char2);
  box(g, 5.0, 1.7, 2.3, -.9, G + 3.15, 1.35, P.white);    // 2nd-floor front volume
  slats(g, -3.2, 1.4, G + 2.45, G + 3.85, 2.42, 14, P.wood);   // slat screen
  win(g, 1.5, 1.1, -3.35, G + 1.1, -1.72);                // left wing front
  win(g, 1.9, 1.5, 2.6, G + 1.15, -1.62);                 // right wing front
  win(g, 3.4, 1.6, -.9, G + 1.15, .21);                   // courtyard face
  win(g, 2.4, 1.2, -3.2, G + 2.9, 2.43);                  // left 2nd floor glazing
  box(g, .06, 1.5, 2.6, -1.92, G + 1.15, -.5, P.win);     // courtyard side
  /* balcony on left wing */
  box(g, 2.3, .12, 1.0, -3.2, G + 2.15, -1.9, P.grey);
  box(g, 2.3, .85, .05, -3.2, G + 2.65, -2.35, P.glassLt);
  planter(g, -3.9, -2.05, .8, .5, G + 2.2);
  planter(g, -2.5, -2.05, .8, .5, G + 2.2);
  planter(g, -2.4, 3.2, 3.2, .7, G + 4.1);                // roof planters
  planter(g, .8, 3.2, 1.8, .7, G + 4.1);
  /* garage + front perimeter wall + slat gate */
  box(g, 2.2, 1.5, 2.4, 3.3, G + .75, -2.6, S);
  box(g, 2.34, .1, 2.54, 3.3, G + 1.55, -2.6, P.char2);
  box(g, 1.7, 1.05, .05, 3.3, G + .62, -3.82, P.woodLt);
  box(g, 4.6, 1.1, .3, -1.6, G + .55, -4.15, S);
  box(g, 2.2, 1.1, .3, 2.6, G + .55, -4.15, S);
  box(g, 1.5, 2.1, .12, .4, G + 1.05, -4.15, P.char);     // gate
  slats(g, -.25, 1.05, G + .2, G + 2.0, -4.12, 7, P.wood, .05);
  for (const x of [-.45, 1.25]) {
    box(g, .4, 1.5, .42, x, G + .75, -4.15, P.stoneLt);   // piers
    box(g, .18, .08, .18, x, G + 1.05, -4.37, P.lamp);
  }
  box(g, 2.2, .14, .5, .4, G - .03, -3.72, P.stoneLt);    // steps
  box(g, 2.2, .14, .5, .4, G + .1, -3.35, P.stoneLt);
  box(g, 2.2, .14, .6, .4, G + .23, -2.92, P.stoneLt);
  box(g, 6.4, .06, 4.6, .2, G + .03, -1.4, P.stoneLt);    // courtyard paving
  tree(g, -4.05, -3.3, 1.15); tree(g, 4.0, 1.9, 1.35); tree(g, -4.1, 2.6, 1.0);
  bush(g, -2.2, -3.6, 1.1); bush(g, 1.7, -3.5, .9); bush(g, 3.9, -1.3, 1.0);
  bush(g, -4.15, -.6, .8);
  hedge(g, -1.5, -4.0, 1.6, .5); hedge(g, 3.4, 3.6, 1.8, .6);
  bollard(g, -.9, -3.8); bollard(g, 2.0, -3.8);
  glight(g, -2.6, -2.9); glight(g, 1.2, .9); glight(g, 3.8, .2);
  return g;
}

/* ========================================================== ② 病房护理
 * Hospital: white tower with glass strip and warm window rows, dark fin
 * column, red cross, drop-off canopy with ambulance, crosswalk plaza. */
function buildWard() {
  const g = new THREE.Group(); g.name = "ward";
  plinth(g, 5.3);
  const W = P.white;
  box(g, 10.1, .06, 10.1, 0, G + .03, 0, P.pave);          // plaza
  box(g, 5.4, .07, 4.4, 0, G + .045, -2.4, P.paveDk);      // driveway
  for (let i = 0; i < 5; i++)
    box(g, .28, .012, 1.0, -1.6 + i * .8, G + .085, -4.3, P.ambW);  // crosswalk
  box(g, 7.6, 8.2, 2.6, -.4, G + 4.1, 2.9, W);             // tower
  box(g, 2.6, 7.2, .12, -.4, G + 3.9, 1.56, P.glassLt);      // central glass strip
  for (let f = 0; f < 5; f++) {
    const y = G + 1.5 + f * 1.3;
    win(g, 1.9, .5, -2.95, y, 1.58);
    win(g, 1.9, .5, 2.15, y, 1.58);
  }
  box(g, .35, 8.0, 2.72, 3.85, G + 4.0, 2.9, P.char);      // fin column
  for (let i = 0; i < 8; i++)
    box(g, .1, 7.6, .24, 3.3 + i * .17, G + 3.95, 1.42, P.char);
  box(g, 1.3, .06, 1.3, -3.3, G + 6.6, 1.58, P.ambW);      // red cross panel
  box(g, .3, .95, .08, -3.3, G + 6.6, 1.62, P.red);
  box(g, .95, .3, .08, -3.3, G + 6.6, 1.62, P.red);
  /* podium wings with driveway between */
  box(g, 3.3, 2.6, 3.0, -3.3, G + 1.3, -.6, W);
  box(g, 2.6, 2.6, 3.0, 3.85, G + 1.3, -.6, W);
  box(g, 2.6, 1.5, .06, -3.3, G + .95, -2.12, P.glass);
  box(g, 2.0, 1.5, .06, 3.85, G + .95, -2.12, P.glass);
  for (let f = 0; f < 2; f++)
    win(g, 2.2, .4, -3.3, G + 1.0 + f, .92);
  box(g, 6.0, .18, 3.0, 0, G + 3.1, -2.2, W);              // drop-off canopy
  box(g, 6.14, .06, 3.14, 0, G + 2.99, -2.2, P.char2);
  cyl(g, .09, 3.0, -2.6, G + 1.5, -3.4, P.char2, .09, 12);
  cyl(g, .09, 3.0, 2.6, G + 1.5, -3.4, P.char2, .09, 12);
  box(g, 4.6, 2.3, .08, .2, G + 1.15, 1.05, P.glassLt);    // entrance glazing
  ambulance(g, -.2, -2.3);
  tree(g, -4.5, 1.6, 1.2); tree(g, 4.5, 1.2, 1.1);
  tree(g, -4.4, -3.6, 1.0); tree(g, 4.5, -3.4, 1.25);
  hedge(g, -1.9, 4.6, 2.2, .5); hedge(g, 1.7, 4.6, 2.0, .5);
  bush(g, -2.6, -4.0, 1.0); bush(g, 2.9, -4.0, .9);
  planter(g, -4.5, -1.2, .8, .8); planter(g, 4.6, -1.4, .8, .8);
  bollard(g, -2.2, -4.6); bollard(g, 2.2, -4.6); bollard(g, 0, -4.9);
  glight(g, -4.6, .2); glight(g, 4.6, .4); glight(g, 3.4, 2.6);
  return g;
}

function ambulance(g, x, z) {
  const y = G + .55;
  box(g, 2.6, 1.5, 1.7, x - .75, y + .45, z, P.ambW);      // box body
  box(g, 1.3, 1.25, 1.75, x + 1.15, y + .32, z, P.ambW);   // cab
  box(g, .06, .55, 1.5, x + 1.79, y + .55, z, P.glass);    // windshield
  box(g, 2.6, .32, .03, x - .75, y + .5, z - .89, P.red);  // stripes
  box(g, 2.6, .32, .03, x - .75, y + .5, z + .89, P.red);
  box(g, .7, .7, .03, x - .75, y + .75, z - .91, P.ambW);  // side cross
  box(g, .16, .5, .02, x - .75, y + .75, z - .93, P.red);
  box(g, .5, .16, .02, x - .75, y + .75, z - .93, P.red);
  for (const wx of [-1.35, -.15, 1.0])
    for (const wz of [-.92, .92]) {
      const wheel = cyl(g, .3, .18, x + wx, G + .3, z + wz, P.char, .3, 14);
      wheel.rotation.x = Math.PI / 2;
    }
  box(g, .5, .16, .5, x - .75, y + 1.28, z, P.red);        // light bar
  box(g, .2, .17, .5, x - 1.0, y + 1.28, z, P.blueL);
}

/* ========================================================== ③ 养老院护理
 * Nursing home: horizontal three-storey slab, deep entry canopy (white
 * fascia, wood soffit), courtyard with heart-sign wall, ramp, lamp posts. */
function buildGarden() {
  const g = new THREE.Group(); g.name = "garden";
  plinth(g, 5.1);
  const W = P.white;
  box(g, 9.2, 5.6, 2.4, .2, G + 2.8, 2.7, W);              // main slab
  box(g, 9.34, .12, 2.54, .2, G + 5.64, 2.7, P.char2);
  box(g, 2.2, 5.0, .1, -3.4, G + 2.5, 1.52, P.wood);       // wood accents
  box(g, 1.6, 5.0, .1, 3.7, G + 2.5, 1.52, P.wood);
  for (let f = 0; f < 3; f++) {
    const y = G + 1.2 + f * 1.6;
    win(g, 1.8, .6, -1.5, y, 1.52);
    win(g, 2.0, .6, 1.9, y, 1.52);
  }
  box(g, 5.2, 2.6, .08, .4, G + 1.3, 1.5, P.glassLt);      // entrance glazing
  for (const x of [-2.3, 0, 2.4])
    cyl(g, .11, 3.4, x, G + 1.7, 1.2, P.char2, .11, 12);
  box(g, 7.6, .2, 3.6, .3, G + 3.5, -.6, W);               // canopy
  box(g, 7.5, .05, 3.5, .3, G + 3.37, -.6, P.woodLt);      // warm soffit
  box(g, 7.72, .1, 3.72, .3, G + 3.62, -.6, P.char2);      // fascia cap
  planter(g, -3.2, 3.2, 3.4, .8, G + 5.7);                 // roof planting
  planter(g, 2.0, 3.2, 2.0, .8, G + 5.7);
  box(g, 9.6, .06, 6.4, 0, G + .03, -1.4, P.pave);         // courtyard
  box(g, 2.6, .045, 5.2, .3, G + .045, -2.4, P.stoneLt);   // path
  cyl(g, 1.7, .05, .3, G + .05, -1.7, P.stoneLt, 1.7, 28); // circular pad
  cyl(g, 1.15, .3, -1.1, G + .2, -3.6, P.grnD, 1.15, 24);   // garden bed
  sph(g, .3, -1.4, G + .45, -3.4, P.grnM, 1, .7, .9);
  sph(g, .26, -.65, G + .42, -3.7, P.grnL, 1, .7, .9);
  box(g, 1.9, 1.25, .4, -1.1, G + .95, -3.75, W);          // heart-sign wall
  box(g, 2.02, .1, .5, -1.1, G + 1.6, -3.75, P.grey);
  sph(g, .13, -1.2, G + 1.15, -3.96, P.heart, 1, .55, 1);
  sph(g, .13, -1.0, G + 1.15, -3.96, P.heart, 1, .55, 1);
  box(g, .3, .3, .1, -1.1, G + 1.05, -3.96, P.heart, Math.PI / 4);
  const ramp = box(g, 1.4, .12, 3.2, 3.9, G + .55, -2.6, P.stoneLt);  // ramp
  ramp.rotation.x = -.24;
  box(g, .05, .05, 3.0, 3.35, G + 1.05, -2.6, P.char2).rotation.x = -.24;
  box(g, .05, .05, 3.0, 4.45, G + 1.05, -2.6, P.char2).rotation.x = -.24;
  for (const [x, z] of [[-2.8, -3.9], [2.6, -4.2], [-4.2, -1.2]]) {
    cyl(g, .05, 2.3, x, G + 1.15, z, P.char2, .04, 10);
    sph(g, .12, x, G + 2.35, z, P.lamp);
  }
  tree(g, -4.2, -2.0, 1.25, true); tree(g, 4.3, 1.0, 1.1); tree(g, -4.3, .6, 1.0);
  bush(g, -1.4, -4.4, 1.0); bush(g, 1.9, -4.4, .9);
  bush(g, -3.3, -4.2, .8); bush(g, 4.4, -4.0, .9);
  hedge(g, -2.4, 4.4, 2.4, .5); hedge(g, 2.6, 4.4, 2.2, .5);
  glight(g, -1.9, -3.6); glight(g, 2.0, -1.2); glight(g, 4.5, -2.2);
  return g;
}

/* ========================================================== ④ 头皮沙龙
 * Salon storefront: dark box, full-height glass with warm lit interior
 * (shelves, counter, chairs), vertical wood slats on the right third. */
function buildSalon() {
  const g = new THREE.Group(); g.name = "salon";
  plinth(g, 4.6);
  const bodyM = new THREE.MeshStandardMaterial({ color: 0x4d4f53, roughness: .55 });
  const fasciaM = new THREE.MeshStandardMaterial({ color: 0x24262a, roughness: .5 });
  const clr = new THREE.MeshStandardMaterial({ color: 0xaec4cc, roughness: .12, metalness: .35, transparent: true, opacity: .28 });
  /* hollow shell: roof + back/side walls, glass front — interior shows */
  box(g, 8.0, .35, 4.6, 0, G + 4.35, .7, bodyM);            // roof slab
  box(g, 8.14, .3, 4.74, 0, G + 4.5, .7, fasciaM);          // fascia band
  box(g, 8.0, 4.35, .3, 0, G + 2.17, 2.85, bodyM);          // back wall
  box(g, 7.4, 3.7, .06, 0, G + 2.15, 2.66,
    new THREE.MeshStandardMaterial({ color: 0x8c8072, roughness: .6, emissive: 0xffc890, emissiveIntensity: 1.6 }));  // lit inner wall
  box(g, .3, 4.35, 4.6, 3.85, G + 2.17, .7, bodyM);         // right wall (solid)
  box(g, .3, 4.35, 2.0, -3.85, G + 2.17, 2.0, bodyM);       // left wall rear part
  box(g, .3, 4.35, .3, -3.85, G + 2.17, -.85, bodyM);       // left corner mullion
  box(g, 5.2, 3.4, .06, -1.2, G + 1.9, -1.62, clr);         // glass curtain wall
  box(g, .06, 3.4, 2.5, -4.02, G + 1.9, .55, clr);          // left glass
  box(g, 1.1, 3.4, .06, 1.3, G + 1.7, -1.62, fasciaM);      // front mullion strip
  box(g, 7.6, .08, 5.6, 0, G + .04, .8,
    new THREE.MeshStandardMaterial({ color: 0x7d6e60, roughness: .7 }));  // interior floor
  for (const x of [-3, -1.4, .2, 1.8])
    box(g, .3, .05, .3, x, G + 4.1, .8, P.lamp);            // ceiling spots
  box(g, 3.2, 2.4, .5, 2.2, G + 1.5, 2.5, P.woodLt);        // shelf wall
  const prodCols = [0xcc8066, 0x66998c, 0xbfae94, 0x807399];
  for (let lvl = 0; lvl < 3; lvl++) {
    const y = G + .7 + lvl * .75;
    box(g, 3.1, .06, .4, 2.2, y, 2.45, P.wood);
    for (let i = 0; i < 6; i++)
      box(g, .16, .3, .18, .85 + i * .5, y + .2, 2.4,
        new THREE.MeshStandardMaterial({ color: prodCols[(i + lvl) % 4], roughness: .4, emissive: prodCols[(i + lvl) % 4], emissiveIntensity: .8 }));
  }
  box(g, 2.2, .95, .7, -2.4, G + .5, 1.7, P.wood);          // counter
  for (const cx of [-3.0, -1.6]) {                          // salon chairs
    cyl(g, .26, .1, cx, G + .4, .1, P.char2, .24, 14);
    cyl(g, .06, .5, cx, G + .7, .1, P.char2, .06, 10);
    box(g, .5, .12, .5, cx, G + 1.0, .1, P.teal);
    box(g, .5, .5, .14, cx, G + 1.3, -.14, P.teal);
  }
  box(g, 2.5, 4.3, .05, 2.75, G + 2.25, -1.58, P.char);     // slat backing
  slats(g, 1.6, 3.9, G + .1, G + 4.35, -1.66, 12, P.wood, .1);
  box(g, 1.1, 2.6, .06, -2.9, G + 1.4, -1.64, clr);         // door
  box(g, 2.6, .14, .5, -2.9, G - .02, -2.1, P.stoneLt);     // steps
  box(g, 2.6, .14, .5, -2.9, G + .1, -1.75, P.stoneLt);
  for (const [x, z] of [[-4.0, -2.6], [3.6, -2.9]]) {
    box(g, .9, .6, .9, x, G + .3, z, P.stoneLt);            // planter pots
    tree(g, x, z, .85);
    g.children[g.children.length - 1].position.y = G + .55;  // lift tree onto pot
  }
  for (const x of [-3.4, -.6, 1.2, 3.3]) glight(g, x, -2.35);
  bollard(g, -3.2, -4.0); bollard(g, 1.4, -4.0);
  bush(g, 4.0, -1.6, .9); bush(g, -4.1, 1.9, .8); bush(g, 2.0, -4.1, .8);
  return g;
}

/* ------------------------------------------------------- floating sign */
function makeSign(name) {
  const cnv = document.createElement("canvas");
  cnv.width = 512; cnv.height = 192;
  const cx = cnv.getContext("2d");
  cx.beginPath();
  if (cx.roundRect) cx.roundRect(12, 12, 488, 168, 52);
  else cx.rect(12, 12, 488, 168);
  cx.fillStyle = "#173145"; cx.fill();
  cx.lineWidth = 14; cx.strokeStyle = "#2ea8a0"; cx.stroke();
  cx.fillStyle = "#d9f3ef";
  cx.font = "700 96px 'PingFang SC','Microsoft YaHei',system-ui,sans-serif";
  cx.textAlign = "center"; cx.textBaseline = "middle";
  cx.fillText(name, 286, 100);
  cx.beginPath(); cx.arc(80, 96, 20, 0, Math.PI * 2);
  cx.fillStyle = "#54c7b6"; cx.fill();
  const tex = new THREE.CanvasTexture(cnv);
  if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
  const group = new THREE.Group();
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(3.0, 1.12),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide })
  );
  board.renderOrder = 6;
  const gem = new THREE.Mesh(
    new THREE.OctahedronGeometry(1, 0),
    new THREE.MeshStandardMaterial({ color: 0x54c7b6, emissive: 0x2ea8a0, emissiveIntensity: .45, roughness: .4 })
  );
  gem.scale.setScalar(.18); gem.position.y = .95;
  group.add(board, gem);
  return { group, board, gem };
}

/* --------------------------------------------------------------- start */
async function start(config) {
  const canvas = document.getElementById("world");
  const fallback = document.getElementById("fallback");
  const worlds = config.worlds;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    fallback.hidden = false;
    document.getElementById("loading")?.remove();
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.5;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 600);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = .07;
  controls.enablePan = false;
  controls.rotateSpeed = .55;
  controls.zoomSpeed = .8;
  controls.minPolarAngle = Math.PI * .14;
  controls.maxPolarAngle = Math.PI * .49;
  controls.autoRotate = true;
  controls.autoRotateSpeed = AUTO_SPIN;

  scene.add(new THREE.HemisphereLight(0xcfe4f2, 0x2a3550, .55));
  const key = new THREE.DirectionalLight(0xfff1dd, 2.4);
  key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096);
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x9fd8e8, 1.1);
  scene.add(rim);

  const catcher = new THREE.Mesh(
    new THREE.PlaneGeometry(240, 240),
    new THREE.ShadowMaterial({ opacity: .28 })
  );
  catcher.rotation.x = -Math.PI / 2;
  catcher.position.y = -.02;
  catcher.receiveShadow = true;
  scene.add(catcher);

  /* build the four buildings + signs on their grid cells */
  const builders = { home: buildHome, ward: buildWard, garden: buildGarden, salon: buildSalon };
  const items = worlds.map((w, i) => {
    const model = builders[w.key]();
    model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    const box3 = new THREE.Box3().setFromObject(model);
    const size = box3.getSize(new THREE.Vector3());
    const center = box3.getCenter(new THREE.Vector3());
    const foot = w.footprint || 9.8;
    const s = foot / Math.max(size.x, size.z);
    const wrap = new THREE.Group();
    model.scale.setScalar(s);
    model.position.set(-center.x * s, -box3.min.y * s, -center.z * s);  /* centered, base on y=0 */
    wrap.add(model);
    const sign = makeSign(w.name);
    sign.group.position.y = size.y * s + 1.15;
    wrap.add(sign.group);
    scene.add(wrap);
    return { wrap, model, sign, spec: w, index: i, phase: i * 1.3 };
  });

  /* the builders compose fronts toward -Z; rotate them to face the start
   * azimuth (plus a per-scene nudge in degrees for variety) */
  for (const it of items)
    it.model.rotation.y = THREE.MathUtils.degToRad(START_THETA - 180 + (it.spec.yaw || 0));

  /* layout: landscape 2×2, portrait tightened */
  let portrait = null;
  const homePos = new THREE.Vector3();
  let userMoved = false;
  function layout() {
    const p = camera.aspect < 0.9;
    const changed = p !== portrait;
    portrait = p;
    const gap = p ? 10.2 : 12.6;
    for (const it of items) {
      const [cx, cz] = CELLS[it.index];
      it.wrap.position.set(cx * gap / 2, 0, cz * gap / 2);
    }
    scene.updateMatrixWorld(true);
    const gridBox = new THREE.Box3();
    for (const it of items)
      gridBox.union(new THREE.Box3().setFromObject(it.wrap));  /* world coords incl. sign */
    const center = gridBox.getCenter(new THREE.Vector3());
    const sph = new THREE.Sphere();
    gridBox.getBoundingSphere(sph);
    if (!userMoved || changed) {
      const vfov = THREE.MathUtils.degToRad(camera.fov);
      const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
      const dist = sph.radius / Math.sin(Math.min(vfov, hfov) / 2) * (p ? 0.95 : 0.82);
      const spherical = new THREE.Spherical(dist, THREE.MathUtils.degToRad(60), THREE.MathUtils.degToRad(START_THETA));
      camera.position.copy(center).add(new THREE.Vector3().setFromSpherical(spherical));
      controls.target.copy(center);
      controls.minDistance = dist * .3;
      controls.maxDistance = dist * 1.9;
      controls.update();
      homePos.copy(camera.position);
    }
    const gs = sph.radius;
    key.shadow.camera.left = -gs; key.shadow.camera.right = gs;
    key.shadow.camera.top = gs; key.shadow.camera.bottom = -gs;
    key.shadow.camera.near = .1; key.shadow.camera.far = gs * 8;
    key.shadow.bias = -.0004;
    key.position.copy(center).add(new THREE.Vector3(gs * .9, gs * 1.4, gs * .6));
    key.target.position.copy(center);
    key.shadow.camera.updateProjectionMatrix();
    rim.position.copy(center).add(new THREE.Vector3(-gs, gs * 1.2, -gs));
    return changed;
  }

  function resize() {
    const w = Math.max(1, window.innerWidth), h = Math.max(1, window.innerHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    layout();
  }
  window.addEventListener("resize", resize, { passive: true });
  resize();

  /* HUD */
  const pauseBtn = document.getElementById("pause");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let paused = reduced;
  function applyPaused() {
    controls.autoRotate = !paused && !userMoved;
    pauseBtn.textContent = paused ? "▶ 播放" : "⏸ 暂停";
    pauseBtn.setAttribute("aria-pressed", String(paused));
  }
  controls.addEventListener("start", () => { userMoved = true; controls.autoRotate = false; canvas.dataset.view = "interactive"; });
  pauseBtn.addEventListener("click", () => { paused = !paused; applyPaused(); });
  applyPaused();

  /* hover chip + click-to-enter */
  const chip = document.getElementById("enter-chip");
  const raycaster = new THREE.Raycaster();
  let hovered = null;
  function pick(e) {
    const r = canvas.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2(
      (e.clientX - r.left) / r.width * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1
    ), camera);
    const hits = raycaster.intersectObjects(items.map(i => i.wrap), true);
    if (!hits.length) return null;
    let o = hits[0].object;
    while (o.parent && !items.some(i => i.wrap === o)) o = o.parent;
    return items.find(i => i.wrap === o) || null;
  }
  function showChip(it) {
    hovered = it;
    chip.textContent = it.spec.name + " · 进入场景 →";
    chip.setAttribute("aria-label", "打开" + it.spec.name + "页面");
    chip.hidden = false;
    canvas.style.cursor = "pointer";
  }
  function hideChip() {
    hovered = null;
    chip.hidden = true;
    canvas.style.cursor = "grab";
  }
  chip.addEventListener("click", () => { if (hovered) location.href = hovered.spec.href; });
  canvas.addEventListener("click", e => {
    const it = pick(e);
    if (it) location.href = it.spec.href;
  });
  canvas.addEventListener("pointermove", e => {
    const it = pick(e);
    if (it) showChip(it); else if (hovered) hideChip();
  });
  window.addEventListener("keydown", e => {
    if (e.key === "Enter" && hovered) { e.preventDefault(); location.href = hovered.spec.href; }
    if (e.key === " ") { e.preventDefault(); paused = !paused; applyPaused(); }
    if (e.key === "Escape") {
      controls.target.set(0, controls.target.y, 0);
      camera.position.copy(homePos);
      controls.update();
    }
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
      const off = camera.position.clone().sub(controls.target);
      const sp = new THREE.Spherical().setFromVector3(off);
      if (e.key === "ArrowLeft") sp.theta -= .075;
      if (e.key === "ArrowRight") sp.theta += .075;
      if (e.key === "ArrowUp") sp.phi -= .065;
      if (e.key === "ArrowDown") sp.phi += .065;
      sp.phi = THREE.MathUtils.clamp(sp.phi, controls.minPolarAngle, controls.maxPolarAngle);
      camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sp));
      controls.update();
    }
  });

  /* animation loop: gentle diorama bob + billboard signs */
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime();
    if (!paused) {
      for (const it of items) {
        it.wrap.position.y = Math.sin(t * .6 + it.phase) * .05;
        it.sign.board.position.y = Math.sin(t * 1.25 + it.phase) * .07;
        it.sign.gem.position.y = .78 + Math.sin(t * 1.25 + it.phase) * .08;
        it.sign.gem.rotation.y = t * .8;
      }
    }
    for (const it of items) it.sign.board.quaternion.copy(camera.quaternion);
    controls.update();
    renderer.render(scene, camera);
  });

  canvas.classList.add("ready");
  document.getElementById("loading")?.remove();

  canvas.addEventListener("webglcontextlost", e => {
    e.preventDefault();
    fallback.hidden = false;
  });
  renderer.domElement.addEventListener("webglcontextrestored", () => location.reload());
}

window.HWIndex = { start };
