import * as THREE from "./three.js";

// Creates the planet, its blue atmosphere, and two orbit lines.
export function createPlanet() {
    const planetGroup = new THREE.Group();
    const textureLoader = new THREE.TextureLoader();

    const colorMap = textureLoader.load("./assets/world-texture.webp");
    colorMap.colorSpace = THREE.SRGBColorSpace;

    const cityLights = textureLoader.load("./assets/world-lights.webp");
    cityLights.colorSpace = THREE.SRGBColorSpace;

    const planet = new THREE.Mesh(
        new THREE.SphereGeometry(2, 72, 72),
        new THREE.MeshStandardMaterial({
            map: colorMap,
            roughness: 0.95,
            metalness: 0,
            emissive: 0x7ea6d6,
            emissiveMap: cityLights,
            emissiveIntensity: 0.60
        })
    );
    planet.rotation.y = -0.6;
    planet.rotation.z = -0.12;
    planetGroup.add(planet);

    // The glow is brightest at the edge of the sphere (the atmosphere).
    const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(2.15, 64, 64),
        new THREE.ShaderMaterial({
            transparent: true,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexShader: `
                varying vec3 surfaceNormal;
                varying vec3 eyeDirection;

                void main() {
                    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
                    surfaceNormal = normalize(normalMatrix * normal);
                    eyeDirection = normalize(-viewPosition.xyz);
                    gl_Position = projectionMatrix * viewPosition;
                }
            `,
            fragmentShader: `
                varying vec3 surfaceNormal;
                varying vec3 eyeDirection;

                void main() {
                    float glow = pow(0.85 - dot(surfaceNormal, eyeDirection), 3.0);
                    gl_FragColor = vec4(0.22, 0.66, 1.0, glow * 0.36);
                }
            `
        })
    );
    planetGroup.add(atmosphere);

    const orbitOne = createOrbit(2.75, 0.16, -0.44);
    const orbitTwo = createOrbit(2.91, -0.4, 0.35);
    planetGroup.add(orbitOne, orbitTwo);

    const satellite = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xa5e5ff })
    );
    satellite.position.set(2.75, 0, 0);
    orbitOne.add(satellite);

    return {
        group: planetGroup,
        mesh: planet,

        update(delta) {
            planet.rotation.y += delta * 0.06;
            orbitOne.rotation.z += delta * 0.04;
            orbitTwo.rotation.y += delta * 0.025;
        }
    };
}

function createOrbit(radius, tiltX, tiltY) {
    const points = [];

    for (let index = 0; index <= 180; index++) {
        const angle = index / 180 * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0x70b2da, transparent: true, opacity: 0.27 });
    const orbit = new THREE.LineLoop(geometry, material);
    orbit.rotation.x = tiltX;
    orbit.rotation.y = tiltY;
    return orbit;
}
