document.addEventListener('DOMContentLoaded', () => {
    // State
    let plugins = [];
    let repoOwner = 'sachetto';
    let repoName = 'monoalg3d-plugins-repo';
    let branch = 'main';

    // Auto-detect GitHub Pages URL details
    const hostname = window.location.hostname;
    const pathname = window.location.pathname; // e.g. "/repo-name/"
    
    if (hostname.endsWith('.github.io')) {
        repoOwner = hostname.split('.')[0];
        // Remove leading/trailing slashes and get first path segment
        const cleanPath = pathname.replace(/^\/|\/$/g, '');
        if (cleanPath) {
            repoName = cleanPath.split('/')[0];
        }
    }

    // DOM Elements
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const sidebarRepoBadge = document.getElementById('sidebar-repo-badge');
    const pluginGrid = document.getElementById('plugin-grid');
    const searchInput = document.getElementById('gallery-search');
    
    // Update placeholders in the setup guide
    document.querySelectorAll('.owner-placeholder').forEach(el => el.textContent = repoOwner);
    document.querySelectorAll('.name-placeholder').forEach(el => el.textContent = repoName);
    sidebarRepoBadge.textContent = `${repoOwner}/${repoName}`;

    // Navigation Tab Switches
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            navButtons.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            btn.classList.add('active');
            const targetPane = document.getElementById(`tab-${targetTab}`);
            if (targetPane) targetPane.classList.add('active');
        });
    });

    // Fetch local registry.json (CORS safe relative fetch)
    fetch('registry.json')
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error ${res.status}`);
            return res.json();
        })
        .then(data => {
            plugins = data;
            renderPlugins(plugins);
        })
        .catch(err => {
            console.error("Failed to load registry.json", err);
            showErrorState("Could not load registry.json. Ensure it exists in the root of the repository.");
        });

    function renderPlugins(modelsList) {
        if (!modelsList || modelsList.length === 0) {
            pluginGrid.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1.5" fill="none" style="margin-bottom: 15px; color: var(--text-muted);"><rect x="2" y="2" width="20" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    <h3>No models available</h3>
                    <p>No cellular models have been registered yet. Upload a model via the CLI to publish it here.</p>
                </div>
            `;
            return;
        }

        pluginGrid.innerHTML = '';
        modelsList.forEach(plugin => {
            const card = document.createElement('div');
            card.className = 'model-card glass-card';
            
            const fileBrowseUrl = `https://github.com/${repoOwner}/${repoName}/tree/${branch}/${plugin.id}`;
            const cliCommand = `python scripts/pm.py install ${plugin.id}`;

            card.innerHTML = `
                <div class="card-header">
                    <h4 class="model-title">${escapeHTML(plugin.name)}</h4>
                    <span class="version-badge">v${escapeHTML(plugin.version || '1.0.0')}</span>
                </div>
                <p class="model-desc">${escapeHTML(plugin.description || 'No description provided.')}</p>
                <div class="card-metadata">
                    <div class="meta-row">
                        <span class="meta-label">ID:</span>
                        <span class="meta-value mono">${escapeHTML(plugin.id)}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Author:</span>
                        <span class="meta-value">${escapeHTML(plugin.author)}</span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn-secondary copy-cmd-btn" data-cmd="${escapeHTML(cliCommand)}">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        <span>CLI Install</span>
                    </button>
                    <a href="${fileBrowseUrl}" target="_blank" class="btn-secondary">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
                        <span>Code</span>
                    </a>
                </div>
            `;
            pluginGrid.appendChild(card);
        });

        // Copy Install Command Listeners
        document.querySelectorAll('.copy-cmd-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const cmd = btn.getAttribute('data-cmd');
                navigator.clipboard.writeText(cmd)
                    .then(() => showToast(`Copied install command to clipboard!`, 'success'))
                    .catch(err => showToast(`Failed to copy: ${err}`, 'error'));
            });
        });
    }

    function showErrorState(msg) {
        pluginGrid.innerHTML = `
            <div class="empty-state" style="border-color: var(--accent-pink)">
                <h3>Registry Error</h3>
                <p>${escapeHTML(msg)}</p>
            </div>
        `;
    }

    // Search Filter
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filtered = plugins.filter(p => 
            p.name.toLowerCase().includes(query) ||
            p.id.toLowerCase().includes(query) ||
            p.author.toLowerCase().includes(query) ||
            (p.description && p.description.toLowerCase().includes(query))
        );
        renderPlugins(filtered);
    });

    /* --- Toasts --- */
    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const successIcon = '<svg viewBox="0 0 24 24" width="18" height="18" stroke="#10b981" stroke-width="2" fill="none"><polyline points="20 6 9 17 4 12"/></svg>';
        const infoIcon = '<svg viewBox="0 0 24 24" width="18" height="18" stroke="#3b82f6" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
        
        toast.innerHTML = `${type === 'success' ? successIcon : infoIcon}<span>${escapeHTML(message)}</span>`;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }
});
