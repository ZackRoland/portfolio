(function () {
    const panel = document.querySelector('.skin-panel');

    if (!panel) {
        return;
    }

    const ignLabel = document.getElementById('minecraft-ign');
    const statusLabel = document.getElementById('minecraft-skin-status');
    const skinImage = document.getElementById('minecraft-skin-image');
    const skinCanvas = document.getElementById('minecraft-skin-canvas');
    const MAX_ROTATE_Y = 35;
    const MAX_ROTATE_Y_RADIANS = (MAX_ROTATE_Y * Math.PI) / 180;
    const IDLE_WALK_SPEED = 0.6;
    const HOVER_WALK_SPEED = 1;

    let skinViewer = null;
    let skinViewerUnavailable = false;

    const configuredIgn = panel.dataset.minecraftIgn;
    const configuredUuid = panel.dataset.minecraftUuid;

    function updateStatus(message) {
        if (message === 'Skin render loaded') {
            statusLabel.textContent = '';
            return;
        }
        statusLabel.textContent = message;
    }

    function providerUrls(uuid, ign) {
        const encodedIgn = encodeURIComponent(ign || '');
        return [
            `https://crafatar.com/renders/body/${uuid}?overlay=true&scale=8`,
            `https://mc-heads.net/body/${uuid}/right`,
            `https://mc-heads.net/body/${encodedIgn}/right`,
            `https://minotar.net/armor/body/${encodedIgn}/300.png`,
            `https://minotar.net/armor/body/${uuid}/300.png`
        ];
    }

    function skinTextureUrls(uuid, ign) {
        const encodedIgn = encodeURIComponent(ign || '');
        return [
            `https://mc-heads.net/skin/${uuid}`,
            `https://mc-heads.net/skin/${encodedIgn}`,
            `https://crafatar.com/skins/${uuid}`
        ];
    }

    function applySkinRotation(normalizedX) {
        if (skinViewer && skinViewer.playerObject) {
            skinViewer.playerObject.rotation.y = normalizedX * MAX_ROTATE_Y_RADIANS;
            return;
        }

        const rotateY = normalizedX * MAX_ROTATE_Y;
        skinImage.style.transform = `rotateY(${rotateY.toFixed(2)}deg)`;
    }

    function ensureSkinViewer() {
        if (skinViewerUnavailable || !skinCanvas || skinViewer) {
            return skinViewer;
        }

        if (!window.skinview3d) {
            skinViewerUnavailable = true;
            return null;
        }

        try {
            skinViewer = new window.skinview3d.SkinViewer({
                canvas: skinCanvas,
                width: 192,
                height: 256,
                model: panel.dataset.minecraftModel === 'slim' ? 'slim' : 'default'
            });

            skinViewer.fov = 45;
            skinViewer.zoom = 0.75;
            if (skinViewer.camera && skinViewer.camera.rotation) {
                skinViewer.camera.rotation.x = -0.05;
            }

            if (window.skinview3d.WalkingAnimation) {
                skinViewer.animation = new window.skinview3d.WalkingAnimation();
                skinViewer.animation.paused = false;
                if (typeof skinViewer.animation.speed === 'number') {
                    skinViewer.animation.speed = IDLE_WALK_SPEED;
                }
            }
        } catch (error) {
            skinViewerUnavailable = true;
            skinViewer = null;
            return null;
        }

        return skinViewer;
    }

    async function load3dSkin(uuid, ign) {
        if (!uuid) {
            return false;
        }

        const viewer = ensureSkinViewer();
        if (!viewer) {
            return false;
        }

        const urls = skinTextureUrls(uuid, ign);

        for (let i = 0; i < urls.length; i += 1) {
            try {
                await Promise.resolve(viewer.loadSkin(urls[i]));
                skinCanvas.hidden = false;
                skinImage.hidden = true;
                updateStatus('Skin render loaded');
                return true;
            } catch (error) {
                // Try next provider URL.
            }
        }

        skinCanvas.hidden = true;
        skinImage.hidden = false;
        return false;
    }

    function setupSkinHoverRotation() {
        panel.addEventListener('pointerenter', () => {
            panel.classList.add('is-hovering-skin');
            if (skinViewer && skinViewer.animation && typeof skinViewer.animation.speed === 'number') {
                skinViewer.animation.speed = HOVER_WALK_SPEED;
            }
        });

        panel.addEventListener('pointermove', (event) => {
            const rect = panel.getBoundingClientRect();
            const positionX = event.clientX - rect.left;
            const halfWidth = rect.width / 2;
            const normalizedX = (positionX - halfWidth) / halfWidth;
            const clampedX = Math.max(-1, Math.min(1, normalizedX));

            applySkinRotation(clampedX);
        });

        panel.addEventListener('pointerleave', () => {
            panel.classList.remove('is-hovering-skin');
            if (skinViewer && skinViewer.animation && typeof skinViewer.animation.speed === 'number') {
                skinViewer.animation.speed = IDLE_WALK_SPEED;
            }
            applySkinRotation(0);
        });
    }

    async function loadFromProviders(uuid, ign) {
        await load3dSkin(uuid, ign);

        const urls = providerUrls(uuid, ign);
        let index = 0;

        const tryNext = () => {
            if (index >= urls.length) {
                skinImage.removeAttribute('src');
                updateStatus('Could not load skin image from available render providers');
                return;
            }

            const current = urls[index++];
            skinImage.onerror = tryNext;
            skinImage.onload = () => {
                skinImage.onerror = null;
                updateStatus('Skin render loaded');
            };
            skinImage.src = current;
        };

        tryNext();
    }

    async function fetchJson(url, timeoutMs) {
        const proxiedUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(proxiedUrl, { signal: controller.signal });
            if (!response.ok) {
                throw new Error('Request failed');
            }
            return response.json();
        } finally {
            clearTimeout(timer);
        }
    }

    async function resolveUuid(ign) {
        const url = `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(ign)}`;
        const profile = await fetchJson(url, 4500);
        return {
            uuid: profile.id,
            ign: profile.name
        };
    }

    async function initializeSkin() {
        ignLabel.textContent = configuredIgn || 'Unknown Player';

        if (!configuredUuid && !configuredIgn) {
            updateStatus('Missing Minecraft IGN/UUID configuration');
            return;
        }

        updateStatus(configuredUuid ? 'Loading preferred skin render...' : 'Resolving player UUID...');

        try {
            let uuid = configuredUuid;
            let ign = configuredIgn;

            if (!uuid && ign) {
                const resolved = await resolveUuid(ign);
                uuid = resolved.uuid;
                ign = resolved.ign;
            }

            panel.dataset.minecraftUuid = uuid;
            ignLabel.textContent = ign;
            await loadFromProviders(uuid, ign);
        } catch (error) {
            if (configuredUuid) {
                updateStatus('Using configured UUID (Mojang sync unavailable)');
                await loadFromProviders(configuredUuid, configuredIgn);
            } else {
                updateStatus('Could not resolve player profile from Mojang');
            }
        }
    }

    setupSkinHoverRotation();
    initializeSkin();
})();
