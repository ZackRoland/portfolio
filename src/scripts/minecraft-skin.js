(function () {
    const panel = document.querySelector('.skin-panel');

    if (!panel) {
        return;
    }

    const ignLabel = document.getElementById('minecraft-ign');
    const statusLabel = document.getElementById('minecraft-skin-status');
    const skinImage = document.getElementById('minecraft-skin-image');

    const configuredIgn = panel.dataset.minecraftIgn;
    const configuredUuid = panel.dataset.minecraftUuid;

    function updateStatus(message) {
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

    function loadFromProviders(uuid, ign) {
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

        if (configuredUuid) {
            loadFromProviders(configuredUuid, configuredIgn);
            updateStatus('Loading preferred skin render...');
        } else {
            updateStatus('Resolving player UUID...');
        }

        if (!configuredUuid && !configuredIgn) {
            updateStatus('Missing Minecraft IGN/UUID configuration');
            return;
        }

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
            loadFromProviders(uuid, ign);
        } catch (error) {
            if (configuredUuid) {
                updateStatus('Using configured UUID (Mojang sync unavailable)');
            } else {
                updateStatus('Could not resolve player profile from Mojang');
            }
        }
    }

    initializeSkin();
})();
