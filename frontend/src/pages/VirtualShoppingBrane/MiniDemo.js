import React, { useRef, useEffect } from "react";
import * as THREE from "three";

export default function MiniDemo() {
  const mountRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const w = container.clientWidth;
    const h = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x08080e);

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(6, 5, 8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x404060, 0.5);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0x4488ff, 0x884422, 0.4);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffcc88, 1.2);
    sun.position.set(8, 12, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(512, 512);
    sun.shadow.camera.near = 0.1;
    sun.shadow.camera.far = 25;
    sun.shadow.camera.left = -8;
    sun.shadow.camera.right = 8;
    sun.shadow.camera.top = 8;
    sun.shadow.camera.bottom = -8;
    scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 14),
      new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.8, metalness: 0.1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(14, 14, 0x7c5cfc, 0x333355);
    grid.position.y = 0.01;
    scene.add(grid);

    function createTree(x, z, s) {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08 * s, 0.12 * s, 0.6 * s, 6),
        new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 })
      );
      trunk.position.set(x, 0.3 * s, z);
      trunk.castShadow = true;
      scene.add(trunk);

      const foliage = new THREE.Mesh(
        new THREE.SphereGeometry(0.35 * s, 6, 6),
        new THREE.MeshStandardMaterial({ color: 0x44aa44, roughness: 0.8, emissive: 0x224422, emissiveIntensity: 0.1 })
      );
      foliage.position.set(x, 0.8 * s + 0.2 * s, z);
      foliage.castShadow = true;
      scene.add(foliage);
    }

    createTree(-3, -2, 1);
    createTree(4, -3, 0.8);
    createTree(-4, 3, 1.1);
    createTree(3, 4, 0.7);
    createTree(-2, -4, 0.9);
    createTree(5, 1, 0.6);

    const playerGroup = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.6, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x4488ff, roughness: 0.3, metalness: 0.2, emissive: 0x2244aa, emissiveIntensity: 0.2 })
    );
    body.position.y = 0.3;
    body.castShadow = true;
    playerGroup.add(body);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xffccaa, roughness: 0.5 })
    );
    head.position.y = 0.75;
    head.castShadow = true;
    playerGroup.add(head);

    const eyeL = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0x44ccff, emissive: 0x44ccff, emissiveIntensity: 0.5 })
    );
    eyeL.position.set(-0.08, 0.78, 0.16);
    playerGroup.add(eyeL);

    const eyeR = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0x44ccff, emissive: 0x44ccff, emissiveIntensity: 0.5 })
    );
    eyeR.position.set(0.08, 0.78, 0.16);
    playerGroup.add(eyeR);

    playerGroup.position.set(0, 0, 0);
    scene.add(playerGroup);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.2, 1.5, 32),
      new THREE.MeshBasicMaterial({ color: 0x7c5cfc, transparent: true, opacity: 0.15, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    scene.add(ring);

    const glowParticles = new THREE.BufferGeometry();
    const gpCount = 40;
    const gpPos = new Float32Array(gpCount * 3);
    for (let i = 0; i < gpCount * 3; i++) gpPos[i] = (Math.random() - 0.5) * 12;
    glowParticles.setAttribute("position", new THREE.BufferAttribute(gpPos, 3));
    const gpMat = new THREE.PointsMaterial({
      color: 0x7c5cfc,
      size: 0.04,
      transparent: true,
      opacity: 0.4,
    });
    const gpMesh = new THREE.Points(glowParticles, gpMat);
    gpMesh.position.y = 0.3;
    scene.add(gpMesh);

    let time = 0;
    const orbitSpeed = 0.3;

    const onResize = () => {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
      renderer.setSize(cw, ch);
    };
    window.addEventListener("resize", onResize);

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      time += 0.016;

      const angle = time * orbitSpeed;
      playerGroup.position.x = Math.sin(angle) * 2.5;
      playerGroup.position.z = Math.cos(angle) * 2.5;
      playerGroup.rotation.y = -angle + Math.PI / 4;
      playerGroup.position.y = Math.sin(time * 2) * 0.08;

      ring.rotation.z = time * 0.2;

      const positions = gpMesh.geometry.attributes.position.array;
      for (let i = 0; i < gpCount; i++) {
        positions[i * 3 + 1] += Math.sin(time + i) * 0.002;
      }
      gpMesh.geometry.attributes.position.needsUpdate = true;

      camera.position.x = 6 * Math.cos(angle * 0.15);
      camera.position.z = 6 * Math.sin(angle * 0.15);
      camera.lookAt(0, 0.5, 0);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="bs-mini-demo" />;
}
