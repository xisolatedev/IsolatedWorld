
import * as THREE from "./three.js";

export function createBlastSystem(scene, camera, planet) {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const projectiles = [];
    const impacts = [];

    const projectileGeometry = new THREE.SphereGeometry(0.055, 12, 12);


    const explosions = [];

    // Reusable geometry for explosion fragments.
    const fragmentGeometry = new THREE.IcosahedronGeometry(0.045, 0);

    function nuke(clientX, clientY, canvas) {
        const rect = canvas.getBoundingClientRect();

        pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(pointer, camera);

        const hits = raycaster.intersectObject(planet, false);
        if (hits.length === 0) return false;

        const hit = hits[0];
        const localPoint = planet.worldToLocal(hit.point.clone());
        const normal = localPoint.clone().normalize();

        const explosion = new THREE.Group();
        explosion.position.copy(localPoint).addScaledVector(normal, 0.06);
        explosion.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            normal
        );

        // Expanding red shockwave.
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(0.1, 0.15, 96),
            new THREE.MeshBasicMaterial({
                color: 0xff3333,
                transparent: true,
                opacity: 1,
                side: THREE.DoubleSide,
                depthWrite: false
            })
        );

        explosion.add(ring);

        // Bright impact flash.
        const flash = new THREE.Mesh(
            new THREE.SphereGeometry(0.25, 24, 24),
            new THREE.MeshBasicMaterial({
                color: 0xffddaa,
                transparent: true,
                opacity: 1,
                depthWrite: false
            })
        );

        explosion.add(flash);

        // Expanding energy shell.
        const shell = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 32, 32),
            new THREE.MeshBasicMaterial({
                color: 0xff5522,
                transparent: true,
                opacity: 0.35,
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            })
        );

        explosion.add(shell);

        // Fragments travel outward from the impact.
        const fragments = [];

        for (let i = 0; i < 85; i++) {
            const fragment = new THREE.Mesh(
                fragmentGeometry,
                new THREE.MeshBasicMaterial({
                    color: Math.random() > 0.5 ? 0xff5522 : 0xffcc66,
                    transparent: true,
                    opacity: 1
                })
            );

            const direction = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                Math.random() * 1.5 + 0.3
            ).normalize();

            const speed = 1.5 + Math.random() * 3;

            fragment.userData.velocity = direction.multiplyScalar(speed);

            fragment.scale.setScalar(0.5 + Math.random() * 2);

            explosion.add(fragment);
            fragments.push(fragment);
        }

        planet.add(explosion);

        explosions.push({
            group: explosion,
            ring,
            flash,
            shell,
            fragments,
            elapsed: 0,
            duration: 2.5
        });

        return true;
    }

    function isHoveringPlanet() {
        return marker.visible;
    }

    function updateExplosions(delta) {
        for (let i = explosions.length - 1; i >= 0; i--) {
            const explosion = explosions[i];

            explosion.elapsed += delta;

            const t = Math.min(
                explosion.elapsed / explosion.duration,
                1
            );

            // Large expanding shockwave.
            explosion.ring.scale.setScalar(1 + t * 30);
            explosion.ring.material.opacity = Math.pow(1 - t, 2);

            // Flash expands quickly, then fades.
            explosion.flash.scale.setScalar(1 + t * 8);
            explosion.flash.material.opacity = Math.pow(1 - t, 5);

            // Energy shell expands and disappears.
            explosion.shell.scale.setScalar(1 + t * 15);
            explosion.shell.material.opacity = 0.35 * (1 - t);

            // Animate fragments.
            for (const fragment of explosion.fragments) {
                fragment.position.addScaledVector(
                    fragment.userData.velocity,
                    delta
                );

                fragment.rotation.x += delta * 3;
                fragment.rotation.y += delta * 2;

                fragment.material.opacity = 1 - t;
            }

            if (t >= 1) {
                planet.remove(explosion.group);

                explosion.group.traverse(object => {
                    if (!object.isMesh) return;

                    // Shared fragment geometry is disposed separately.
                    if (object.geometry !== fragmentGeometry) {
                        object.geometry.dispose();
                    }

                    object.material.dispose();
                });

                explosions.splice(i, 1);
            }
        }
    }

    // 3D targeting marker.
    const marker = new THREE.Group();

    const markerMaterial = new THREE.MeshBasicMaterial({
        color: 0xff3030,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
        depthWrite: false
    });

    // Outer targeting ring.
    const markerRing = new THREE.Mesh(
        new THREE.RingGeometry(0.11, 0.125, 48),
        markerMaterial
    );
    marker.add(markerRing);

    // Center targeting dot.
    const markerDot = new THREE.Mesh(
        new THREE.CircleGeometry(0.025, 24),
        markerMaterial
    );
    marker.add(markerDot);

    // Four radial targeting ticks.
    const tickGeometry = new THREE.PlaneGeometry(0.055, 0.012);

    for (let i = 0; i < 4; i++) {
        const angle = i * Math.PI / 2;

        const tick = new THREE.Mesh(
            tickGeometry,
            markerMaterial
        );

        tick.position.set(
            Math.cos(angle) * 0.17,
            Math.sin(angle) * 0.17,
            0
        );

        tick.rotation.z = angle;
        marker.add(tick);
    }

    marker.visible = false;

    // Parent to the planet so the marker uses its local coordinates.
    planet.add(marker);

    const normalAxis = new THREE.Vector3(0, 0, 1);

    const markerNormal = new THREE.Vector3();
    const targetNormal = new THREE.Vector3();
    const currentNormal = new THREE.Vector3();

    const rotationFrom = new THREE.Quaternion();
    const rotationTo = new THREE.Quaternion();
    const rotationStep = new THREE.Quaternion();

    let markerInitialized = false;

    const planetRadius = 2;
    const markerOffset = 0.045;
    function hover(clientX, clientY, canvas) {
        const rect = canvas.getBoundingClientRect();

        pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(pointer, camera);

        const hits = raycaster.intersectObject(planet, false);

        if (hits.length === 0) {
            hideMarker();
            canvas.style.cursor = "crosshair";
            return;
        }

        canvas.style.cursor = "none";

        const hit = hits[0];
        const localPoint = planet.worldToLocal(hit.point.clone());

        targetNormal.copy(localPoint).normalize();

        if (!markerInitialized) {
            // First appearance: snap to cursor.
            currentNormal.copy(targetNormal);
            markerInitialized = true;
        }

        marker.visible = true;
    }


function updateMarker(delta) {
    if (!marker.visible || !markerInitialized) return;

    // Angular distance between current and target surface normals.
    const angle = currentNormal.angleTo(targetNormal);

    // Small movements track slowly; large movements catch up quickly.
    const minSpeed = 3;
    const maxSpeed = 22;

    const distanceFactor = THREE.MathUtils.smoothstep(
        angle,
        0.02,
        1.2
    );

    const responsiveness = THREE.MathUtils.lerp(
        minSpeed,
        maxSpeed,
        distanceFactor
    );

    // Frame-rate-independent interpolation.
    const alpha = 1 - Math.exp(-responsiveness * delta);

    // Rotate the current normal toward the target normal.
    rotationFrom.setFromUnitVectors(normalAxis, currentNormal);
    rotationTo.setFromUnitVectors(normalAxis, targetNormal);

    rotationStep.copy(rotationFrom).slerp(rotationTo, alpha);

    currentNormal
        .set(0, 0, 1)
        .applyQuaternion(rotationStep)
        .normalize();

    // Always project the marker onto the sphere surface.
    marker.position
        .copy(currentNormal)
        .multiplyScalar(planetRadius + markerOffset);

    // Orient the marker to the interpolated surface normal.
    marker.quaternion.setFromUnitVectors(
        normalAxis,
        currentNormal
    );

    // Gentle pulse.
    const time = performance.now() * 0.001;
    const pulse = 1 + Math.sin(time * 4) * 0.06;

    marker.scale.setScalar(pulse);
}



    function hideMarker() {
        marker.visible = false;
        markerInitialized = false;
    }


    function fire(clientX, clientY, canvas) {
        const rect = canvas.getBoundingClientRect();

        pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(pointer, camera);

        const hits = raycaster.intersectObject(planet, false);
        if (hits.length === 0) return;

        const hit = hits[0];

        // Store the impact in the planet's local coordinates.
        // This ensures the effect follows the rotating planet.
        const localPoint = planet.worldToLocal(hit.point.clone());

        const normal = localPoint.clone().normalize();
        const projectile = new THREE.Mesh(
            projectileGeometry,
            new THREE.MeshBasicMaterial({
                color: 0x7565a7
            })
        );

        // Launch from a point near the camera.
        const start = camera.position.clone();

        // Aim toward the impact point.
        const end = hit.point.clone();

        projectile.position.copy(start);
        //scene.add(projectile);

        projectiles.push({
            mesh: projectile,
            start,
            end,
            localPoint,
            normal,
            elapsed: 0,
            duration: 0.35
        });
    }

    function createImpact(localPoint, normal) {
        const group = new THREE.Group();

        // Impact position is relative to the planet.
        group.position.copy(localPoint);

        // Align the shockwave with the surface normal.
        group.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            normal
        );

        const ring = new THREE.Mesh(
            new THREE.RingGeometry(0.03, 0.08, 48),
            new THREE.MeshBasicMaterial({
                color: 0x7565a7,
                transparent: true,
                opacity: 1,
                side: THREE.DoubleSide,
                depthWrite: false
            })
        );

        const flash = new THREE.Mesh(
            new THREE.SphereGeometry(0.09, 16, 16),
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 1,
                depthWrite: false
            })
        );

        group.add(ring, flash);

        // Parent the impact to the planet so it rotates with it.
        planet.add(group);

        impacts.push({
            group,
            ring,
            flash,
            elapsed: 0,
            duration: 0.65
        });
    }

    function update(delta) {

        updateMarker(delta);
        // Animate projectiles.
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const blast = projectiles[i];

            blast.elapsed += delta;

            const t = Math.min(blast.elapsed / blast.duration, 1);

            // Ease out.
            const eased = 1 - Math.pow(1 - t, 3);

            // Follow the moving planet's target position.
            const target = planet.localToWorld(blast.localPoint.clone());

            blast.mesh.position.lerpVectors(
                blast.start,
                target,
                eased
            );

            const scale = 1 + t * 1.5;
            blast.mesh.scale.setScalar(scale);

            if (t >= 1) {
                createImpact(blast.localPoint, blast.normal);

                scene.remove(blast.mesh);
                blast.mesh.material.dispose();

                projectiles.splice(i, 1);
            }
        }

        // Animate impact shockwaves.
        for (let i = impacts.length - 1; i >= 0; i--) {
            const impact = impacts[i];

            impact.elapsed += delta;

            const t = Math.min(impact.elapsed / impact.duration, 1);

            impact.ring.scale.setScalar(1 + t * 5);
            impact.ring.material.opacity = 1 - t;

            impact.flash.scale.setScalar(1 + t * 2);
            impact.flash.material.opacity = 1 - t;

            if (t >= 1) {
                planet.remove(impact.group);

                impact.ring.geometry.dispose();
                impact.ring.material.dispose();

                impact.flash.geometry.dispose();
                impact.flash.material.dispose();

                impacts.splice(i, 1);
            }
        }

        updateExplosions(delta);
    }

    function dispose() {
        for (const blast of projectiles) {
            scene.remove(blast.mesh);
            blast.mesh.material.dispose();
        }

        for (const impact of impacts) {
            planet.remove(impact.group);

            impact.ring.geometry.dispose();
            impact.ring.material.dispose();

            impact.flash.geometry.dispose();
            impact.flash.material.dispose();
        }
        planet.remove(marker);

        for (const explosion of explosions) {
            planet.remove(explosion.group);

            explosion.group.traverse(object => {
                if (!object.isMesh) return;

                if (object.geometry !== fragmentGeometry) {
                    object.geometry.dispose();
                }

                object.material.dispose();
            });
        }

        explosions.length = 0;
        fragmentGeometry.dispose();

        markerRing.geometry.dispose();
        markerDot.geometry.dispose();
        tickGeometry.dispose();
        markerMaterial.dispose();
        projectileGeometry.dispose();
        projectiles.length = 0;
        impacts.length = 0;
    }

    return {
        fire,
        nuke,
        hover,
        hideMarker,
        isHoveringPlanet,
        update,
        dispose
    };
}
