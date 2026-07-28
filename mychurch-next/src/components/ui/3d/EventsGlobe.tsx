"use client";

/**
 * EventsGlobe
 * -----------
 * A quiet, dotted globe representing the church's reach — home groups,
 * livestream viewers, sister congregations — each marked by a warm point
 * of light. A small cross of light hovers above the globe, echoing the
 * hero section and standing in for "Christ over all the earth."
 *
 * Usage:
 *   <EventsGlobe
 *     locations={[
 *       { name: "Sunday Service — Sanctuary", lat: 38.99, lng: -77.03, time: "Sundays 11:00 AM" },
 *       { name: "خانه‌ی دعا — Falls Church", lat: 38.88, lng: -77.17, time: "چهارشنبه‌ها ۷:۳۰ شب" },
 *     ]}
 *     onSelectLocation={(loc) => console.log(loc)}
 *   />
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export type EventLocation = {
  name: string;
  lat: number;
  lng: number;
  time?: string;
  description?: string;
};

type EventsGlobeProps = {
  locations: EventLocation[];
  onSelectLocation?: (location: EventLocation) => void;
  color?: string;
  className?: string;
};

function latLngToVector3(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

export default function EventsGlobe({
  locations,
  onSelectLocation,
  color = "#F3C989",
  className = "",
}: EventsGlobeProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const GLOBE_RADIUS = 2.4;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#080D1A");

    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 1, 7);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enableZoom = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controls.minPolarAngle = Math.PI / 3;
    controls.maxPolarAngle = Math.PI - Math.PI / 3;

    // ---------- dotted globe (point-cloud sphere, not a solid mesh) ----------
    const dotCount = 3200;
    const dotPositions = new Float32Array(dotCount * 3);
    for (let i = 0; i < dotCount; i++) {
      // Fibonacci sphere distribution for even coverage
      const y = 1 - (i / (dotCount - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = (Math.PI * (1 + Math.sqrt(5))) * i;
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;
      dotPositions[i * 3] = x * GLOBE_RADIUS;
      dotPositions[i * 3 + 1] = y * GLOBE_RADIUS;
      dotPositions[i * 3 + 2] = z * GLOBE_RADIUS;
    }
    const dotGeometry = new THREE.BufferGeometry();
    dotGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(dotPositions, 3)
    );
    const dotMaterial = new THREE.PointsMaterial({
      color: "#3A4A66",
      size: 0.02,
      transparent: true,
      opacity: 0.55,
    });
    const globeDots = new THREE.Points(dotGeometry, dotMaterial);
    scene.add(globeDots);

    // faint inner sphere for depth / occlusion of far-side markers
    const coreGeometry = new THREE.SphereGeometry(GLOBE_RADIUS * 0.985, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: "#050810",
      transparent: true,
      opacity: 0.85,
    });
    scene.add(new THREE.Mesh(coreGeometry, coreMaterial));

    // ---------- location markers ----------
    const markerGroup = new THREE.Group();
    const markerMeshes: THREE.Mesh[] = [];
    const markerGeometry = new THREE.SphereGeometry(0.045, 12, 12);

    locations.forEach((loc) => {
      const pos = latLngToVector3(loc.lat, loc.lng, GLOBE_RADIUS + 0.02);
      const material = new THREE.MeshBasicMaterial({ color });
      const marker = new THREE.Mesh(markerGeometry, material);
      marker.position.copy(pos);
      marker.userData.location = loc;
      markerGroup.add(marker);
      markerMeshes.push(marker);

      // soft glow halo behind each marker
      const haloGeometry = new THREE.SphereGeometry(0.09, 12, 12);
      const haloMaterial = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.25,
      });
      const halo = new THREE.Mesh(haloGeometry, haloMaterial);
      halo.position.copy(pos);
      markerGroup.add(halo);
    });
    scene.add(markerGroup);

    // ---------- small cross of light above the globe ----------
    const crossGroup = new THREE.Group();
    const barMaterial = new THREE.MeshBasicMaterial({
      color: "#FFE9C7",
      transparent: true,
      opacity: 0.9,
    });
    const vertical = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.55, 8),
      barMaterial
    );
    const horizontal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.32, 8),
      barMaterial
    );
    horizontal.rotation.z = Math.PI / 2;
    horizontal.position.y = 0.1;
    crossGroup.add(vertical, horizontal);
    crossGroup.position.set(0, GLOBE_RADIUS + 0.9, 0);
    scene.add(crossGroup);

    const crossGlow = new THREE.PointLight("#FFE9C7", 1.4, 4);
    crossGlow.position.copy(crossGroup.position);
    scene.add(crossGlow);
    scene.add(new THREE.AmbientLight("#2A3550", 1.2));

    // ---------- interaction: click a marker ----------
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();

    function handleClick(event: PointerEvent) {
      const rect = mount!.getBoundingClientRect();
      pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(markerMeshes);
      if (hits.length > 0) {
        const loc = hits[0].object.userData.location as EventLocation;
        onSelectLocation?.(loc);
      }
    }
    renderer.domElement.addEventListener("click", handleClick);

    function handleResize() {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    }
    window.addEventListener("resize", handleResize);

    let rafId = 0;
    function animate() {
      rafId = requestAnimationFrame(animate);
      crossGroup.rotation.y += 0.004;
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("click", handleClick);
      controls.dispose();
      dotGeometry.dispose();
      dotMaterial.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      markerGeometry.dispose();
      markerMeshes.forEach((m) => (m.material as THREE.Material).dispose());
      renderer.dispose();
      mount?.removeChild(renderer.domElement);
    };
  }, [locations, onSelectLocation, color]);

  return (
    <div
      ref={mountRef}
      className={`h-full w-full cursor-grab active:cursor-grabbing ${className}`}
    />
  );
}
