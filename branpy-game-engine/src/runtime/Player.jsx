import React, { useRef, useEffect } from "react";
import * as THREE from "three";

export default function Player({ camera, scene }) {
  const keys = useRef({});
  const velocity = useRef(new THREE.Vector3());
  const pitch = useRef(0);
  const yaw = useRef(0);

  useEffect(() => {
    const onKey = (e) => { keys.current[e.key.toLowerCase()] = e.type === "keydown"; };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKey); };
  }, []);

  useEffect(() => {
    if (!camera) return;
    const onMouse = (e) => {
      if (document.pointerLockElement) {
        yaw.current -= e.movementX * 0.002;
        pitch.current -= e.movementY * 0.002;
        pitch.current = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch.current));
      }
    };
    document.addEventListener("mousemove", onMouse);
    return () => document.removeEventListener("mousemove", onMouse);
  }, [camera]);

  useEffect(() => {
    if (!camera) return;
    let running = true;
    const speed = 4;
    const clock = new THREE.Clock();

    const update = () => {
      if (!running) return;
      const dt = clock.getDelta();

      const forward = new THREE.Vector3(-Math.sin(yaw.current), 0, -Math.cos(yaw.current));
      const right = new THREE.Vector3(forward.z, 0, -forward.x);

      const move = new THREE.Vector3();
      if (keys.current["w"]) move.add(forward);
      if (keys.current["s"]) move.sub(forward);
      if (keys.current["a"]) move.sub(right);
      if (keys.current["d"]) move.add(right);

      if (move.length() > 0) move.normalize().multiplyScalar(speed * dt);
      velocity.current.x += move.x;
      velocity.current.z += move.z;
      velocity.current.multiplyScalar(0.9);

      if (keys.current[" "] && camera.position.y <= 0.5) {
        velocity.current.y = 3;
      }
      velocity.current.y -= 9.8 * dt;

      camera.position.x += velocity.current.x;
      camera.position.y += velocity.current.y;
      camera.position.z += velocity.current.z;

      if (camera.position.y < 0.5) {
        camera.position.y = 0.5;
        velocity.current.y = 0;
      }

      const ep = new THREE.Euler(pitch.current, yaw.current, 0, "YXZ");
      camera.quaternion.setFromEuler(ep);

      requestAnimationFrame(update);
    };
    update();
    return () => { running = false; };
  }, [camera]);

  return null;
}
