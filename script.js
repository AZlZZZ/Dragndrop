document.addEventListener("DOMContentLoaded", () => {
    // ====== DATA (unchanged) ======
    const data = [
        { id: "1", name: "flex1", uap: "zone1", qte: 500, cadence: 600, color: "orange", defaut: 20 },
        { id: "2", name: "flex2", uap: "zone1", qte: 500, cadence: 650, color: "orange", defaut: 20 },
        { id: "3", name: "flex3", uap: "zone1", qte: 500, cadence: 670, color: "orange", defaut: 20 },
        { id: "4", name: "cm3/cm4 ligne1", uap: "zone2", qte: 200, cadence: 600, color: "red", defaut: 20 },
        { id: "5", name: "cm3/cm4 ligne2", uap: "zone2", qte: 700, cadence: 600, color: "green", defaut: 20 },
        { id: "6", name: "cm3/cm4 ligne2", uap: "zone3", qte: 700, cadence: 600, color: "green", defaut: 20 },
        { id: "7", name: "flex4", uap: "zone1", qte: 450, cadence: 580, color: "red", defaut: 20 },
        { id: "8", name: "flex5", uap: "zone1", qte: 520, cadence: 620, color: "green", defaut: 20 },
        { id: "9", name: "flex6", uap: "zone2", qte: 300, cadence: 610, color: "yellow", defaut: 20 },
        { id: "10", name: "line1", uap: "zone2", qte: 800, cadence: 630, color: "red", defaut: 20 },
        { id: "11", name: "line2", uap: "zone3", qte: 600, cadence: 640, color: "green", defaut: 20 },
        { id: "12", name: "line3", uap: "zone3", qte: 750, cadence: 660, color: "yellow", defaut: 20 },
        { id: "13", name: "line4", uap: "zone4", qte: 400, cadence: 600, color: "red", defaut: 20 },
        { id: "14", name: "line5", uap: "zone4", qte: 900, cadence: 670, color: "green", defaut: 20 },


    ];

    const zonesContainer = document.getElementById("zones-container");
    const tooltip = document.getElementById("tooltip");

    // ====== STATE PERSISTENCE ======
    const LS_KEY = "uapLayoutState";

    function readState() {
        try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
        catch { return []; }
    }
    function writeState(elementsArray) {
        try { localStorage.setItem(LS_KEY, JSON.stringify(elementsArray)); }
        catch (e) { /* ignore quota/permission errors */ }
    }

    function serializeAll() {
        const elements = [];
        document.querySelectorAll(".zone").forEach(zoneDiv => {
            const parent = zoneDiv.dataset.parent || ""; // ✅ canonical parent slug
            const canvas = zoneDiv.querySelector(".canvas");
            if (!canvas) return;

            // Lines
            canvas.querySelectorAll(".line-item").forEach(el => {
                const cs = getComputedStyle(el);
                elements.push({
                    id: el.dataset.id,
                    type: "line",
                    shape: null,
                    parent,
                    left: parseFloat(el.style.left) || 0,
                    top: parseFloat(el.style.top) || 0,
                    width: parseFloat(cs.width),
                    height: parseFloat(cs.height),
                    rotation: parseFloat(el.dataset.rotation || 0)
                });
            });

            // Sub-zones
            canvas.querySelectorAll(".sub-zone").forEach(el => {
                const cs = getComputedStyle(el);
                elements.push({
                    id: el.dataset.id,
                    type: "sub-zone",
                    shape: el.dataset.shape || "rectangle",
                    parent,
                    left: el.offsetLeft,
                    top: el.offsetTop,
                    width: parseFloat(cs.width),
                    height: parseFloat(cs.height),
                    rotation: 0
                });
            });

            // Separator lines
            canvas.querySelectorAll(".separator-line").forEach(el => {
                const cs = getComputedStyle(el);
                elements.push({
                    id: el.dataset.id,
                    type: "separator-line",
                    shape: "line",
                    parent,
                    left: parseFloat(el.style.left) || 0,
                    top: parseFloat(el.style.top) || 0,
                    width: parseFloat(cs.width),
                    height: parseFloat(cs.height),
                    rotation: parseFloat(el.dataset.rotation || 0)
                });
            });
        });
        return elements;
    }

    function saveState() { writeState(serializeAll()); }
    function newId(prefix) { return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`; }
    function getSavedByParent(parent) { return readState().filter(s => s.parent === parent); }

    // Utility: convert any CSS color to rgba with a custom alpha
    function colorWithAlpha(inputColor, alpha) {
        const probe = document.createElement('div');
        probe.style.position = 'fixed';
        probe.style.left = '-9999px';
        probe.style.top = '-9999px';
        probe.style.height = '0';
        probe.style.width = '0';
        probe.style.color = inputColor;
        document.body.appendChild(probe);
        const computed = getComputedStyle(probe).color; // rgb(...) or rgba(...)
        document.body.removeChild(probe);
        const m = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);
        if (m) {
            const r = parseInt(m[1], 10), g = parseInt(m[2], 10), b = parseInt(m[3], 10);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return inputColor;
    }

    // ====== GROUP BY ZONE ======
    const grouped = {};
    data.forEach(item => {
        if (!grouped[item.uap]) grouped[item.uap] = [];
        grouped[item.uap].push(item);
    });

    // ====== CORE GEOMETRY HELPERS ======
    function getRotatedAABB(x, y, width, height, angleDeg) {
        const angle = angleDeg * Math.PI / 180;
        const cx = x + width / 2, cy = y + height / 2;
        const corners = [
            { x, y }, { x: x + width, y }, { x: x + width, y: y + height }, { x, y: y + height }
        ];
        const rotated = corners.map(pt => {
            const dx = pt.x - cx, dy = pt.y - cy;
            return { x: cx + dx * Math.cos(angle) - dy * Math.sin(angle), y: cy + dx * Math.sin(angle) + dy * Math.cos(angle) };
        });
        const xs = rotated.map(p => p.x), ys = rotated.map(p => p.y);
        return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
    }
    function checkCollision(r1, r2) {
        return !(r1.right < r2.left || r1.left > r2.right || r1.bottom < r2.top || r1.top > r2.bottom);
    }
    function wouldCollideFactory(canvas) {
        return function wouldCollide(item, x, y, w, h, angle) {
            const proposed = getRotatedAABB(x, y, w, h, angle || 0);
            const others = Array.from(canvas.children).filter(el => el !== item);
            for (const other of others) {
                if (other.classList.contains('sub-zone')) continue;
                const ox = parseInt(other.style.left) || 0;
                const oy = parseInt(other.style.top) || 0;
                const ow = other.offsetWidth, oh = other.offsetHeight;
                const oa = parseFloat(other.dataset.rotation) || 0;
                const aabb = getRotatedAABB(ox, oy, ow, oh, oa);
                if (checkCollision(proposed, aabb)) return true;
            }
            return false;
        };
    }

    // ====== BUILD ZONES ======
    Object.entries(grouped).forEach(([zoneName, lines]) => {
        const parentSlug = zoneName.toLowerCase(); // ✅ stable key

        const zoneDiv = document.createElement("div");
        zoneDiv.className = "zone";
        zoneDiv.dataset.parent = parentSlug;      // ✅ store canonical parent on the zone element

        const titleDiv = document.createElement("div");
        titleDiv.className = "zone-title";
        titleDiv.textContent = zoneName.toUpperCase();

        const addSubZoneBtn = document.createElement("button");
        addSubZoneBtn.textContent = "+";
        addSubZoneBtn.className = "add-subzone-btn";
        addSubZoneBtn.title = "Add a new sub-zone (rectangle / circle / triangle)";
        titleDiv.appendChild(addSubZoneBtn);

        // Reset button per UAP (zone)
        // Create the reset button
        const resetBtn = document.createElement("button");
        resetBtn.className = "reset-zone-btn";
        resetBtn.title = "Remove all shapes and reset lines to default positions";

        // Use a clean single-path circular arrow (like Flaticon)
        resetBtn.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2v4M12 22v-4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" 
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
`;

        // Append to your divs
        titleDiv.appendChild(resetBtn);
        zoneDiv.appendChild(titleDiv);

        // Optional: add hover effect in CSS
        // .reset-zone-btn svg { transition: transform 0.2s; }
        // .reset-zone-btn:hover svg { transform: rotate(20deg); }


        const canvas = document.createElement("div");
        canvas.className = "canvas";
        zoneDiv.appendChild(canvas);

        zonesContainer.appendChild(zoneDiv);

        const wouldCollide = wouldCollideFactory(canvas);

        // ====== SHAPE MENU ======
        let shapeMenu = null;
        addSubZoneBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (shapeMenu) { shapeMenu.remove(); shapeMenu = null; return; }
            shapeMenu = document.createElement("div");
            shapeMenu.className = "shape-menu";
            Object.assign(shapeMenu.style, {
                position: "absolute", display: "flex", gap: "40px", background: "#fff",
                border: "3.5px solid #2563eb", borderRadius: "24px", boxShadow: "0 8px 32px rgba(30,60,120,0.22)",
                padding: "38px 60px", zIndex: 300, minWidth: "420px", minHeight: "160px"
            });
            shapeMenu.style.left = Math.max(0, Math.floor((canvas.offsetWidth - 420) / 2)) + "px";
            shapeMenu.style.top = Math.max(0, Math.floor((canvas.offsetHeight - 160) / 2)) + "px";

            function spawn(shape) { createSubZone(shape); shapeMenu.remove(); shapeMenu = null; }

            const rectBtn = document.createElement("button");
            rectBtn.className = "shape-btn rect-btn";
            rectBtn.title = "Add rectangle sub-zone";
            rectBtn.innerHTML = '<svg width="96" height="96"><rect x="8" y="24" width="80" height="48" rx="18" fill="#2563eb" stroke="#1e40af" stroke-width="4"/></svg>';
            rectBtn.addEventListener("click", ev => { ev.stopPropagation(); spawn("rectangle"); });

            const circBtn = document.createElement("button");
            circBtn.className = "shape-btn circ-btn";
            circBtn.title = "Add circle sub-zone";
            circBtn.innerHTML = '<svg width="96" height="96"><circle cx="48" cy="48" r="40" fill="#eab308" stroke="#b45309" stroke-width="4"/></svg>';
            circBtn.addEventListener("click", ev => { ev.stopPropagation(); spawn("circle"); });

            const triBtn = document.createElement("button");
            triBtn.className = "shape-btn tri-btn";
            triBtn.title = "Add triangle sub-zone";
            triBtn.innerHTML = '<svg width="96" height="96"><polygon points="48,16 88,80 8,80" fill="#10b981" stroke="#047857" stroke-width="6"/></svg>';
            triBtn.addEventListener("click", ev => { ev.stopPropagation(); spawn("triangle"); });

            const lineBtn = document.createElement("button");
            lineBtn.className = "shape-btn line-btn";
            lineBtn.title = "Add separator line";
            lineBtn.innerHTML = '<svg width="96" height="96"><rect x="10" y="46" width="76" height="4" rx="2" fill="#8b5cf6" stroke="#7c3aed" stroke-width="1"/></svg>';
            lineBtn.addEventListener("click", ev => { ev.stopPropagation(); spawn("line"); });

            shapeMenu.append(rectBtn, circBtn, triBtn, lineBtn);
            setTimeout(() => { document.addEventListener("mousedown", closeMenu, { once: true }); }, 0);
            function closeMenu(ev) { if (!shapeMenu.contains(ev.target)) { shapeMenu.remove(); shapeMenu = null; } }
            canvas.appendChild(shapeMenu);
        });

        // ====== ZONE RESET ======
        function resetZoneLayout() {
            // Remove all sub-zones and separator lines
            Array.from(canvas.querySelectorAll('.sub-zone, .separator-line')).forEach(el => el.remove());

            // Reset all lines for this zone back to default placement/size/rotation
            const lineElements = Array.from(canvas.querySelectorAll('.line-item'));
            lineElements.forEach((lineEl, i) => {
                lineEl.classList.remove('colliding', 'colliding-anim');
                lineEl.style.left = `${0 + i * 100}px`;
                lineEl.style.top = `${120 + (i % 2) * 80}px`;
                lineEl.style.width = '';
                lineEl.style.height = '';
                lineEl.dataset.rotation = '0';
                lineEl.style.transform = '';
                lineEl.style.setProperty('--rotation', '0deg');
            });

            // Persist the new clean state
            saveState();
        }

        resetBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Optional confirm; commented to keep UX fast
            // if (!confirm(`Reset ${zoneName}?`)) return;
            if (shapeMenu) { shapeMenu.remove(); shapeMenu = null; }
            resetZoneLayout();
        });

        // ====== SUB-ZONE CREATION ======
        function createSubZone(shape, preset = null) {
            if (shape === "line") {
                return createCustomLine(preset);
            }
            const subZone = document.createElement("div");
            subZone.className = "sub-zone";
            subZone.dataset.shape = shape;
            subZone.dataset.type = "sub-zone";
            subZone.dataset.parent = parentSlug;         // ✅ match zone
            subZone.dataset.id = preset?.id || newId("subzone");
            Object.assign(subZone.style, { position: "absolute", zIndex: 1 });

            const canvasW = canvas.offsetWidth, canvasH = canvas.offsetHeight;

            if (preset) {
                subZone.style.width = `${preset.width}px`;
                subZone.style.height = `${preset.height}px`;
                subZone.style.left = `${preset.left}px`;
                subZone.style.top = `${preset.top}px`;
            } else {
                const size = Math.max(80, Math.floor(Math.min(canvasW, canvasH) * 0.35));
                subZone.style.width = size + "px";
                subZone.style.height = size + "px";
                subZone.style.left = Math.floor((canvasW - size) / 2) + "px";
                subZone.style.top = Math.floor((canvasH - size) / 2) + "px";
            }

            if (shape === "circle") {
                Object.assign(subZone.style, { background: "rgba(100,180,255,0.13)", border: "2px dashed #3b82f6", borderRadius: "50%" });
            } else if (shape === "triangle") {
                Object.assign(subZone.style, { background: "none", border: "none", borderRadius: "0" });
                const triangleDiv = document.createElement("div");
                Object.assign(triangleDiv.style, {
                    width: "100%", height: "100%", background: "rgba(16,185,129,0.18)",
                    border: "2px dashed #047857", clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)", position: "absolute", left: 0, top: 0, zIndex: 0
                });
                subZone.appendChild(triangleDiv);
            } else {
                Object.assign(subZone.style, { background: "rgba(100,255,180,0.13)", border: "2px dashed #3b82f6", borderRadius: "18px" });
            }

            const removeBtn = document.createElement("button");
            removeBtn.textContent = "×";
            removeBtn.title = "Remove this sub-zone";
            Object.assign(removeBtn.style, {
                position: "absolute", top: "-12px", right: "-12px", width: "22px", height: "22px",
                background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", cursor: "pointer", zIndex: 3
            });
            removeBtn.addEventListener("click", (e) => { e.stopPropagation(); subZone.remove(); saveState(); });
            subZone.appendChild(removeBtn);

            const resizeHandle = document.createElement("div");
            resizeHandle.className = "resize-handle subzone-resize";
            Object.assign(resizeHandle.style, {
                position: "absolute", right: "-10px", bottom: "-10px", width: "18px", height: "18px",
                background: "#3b82f6", borderRadius: "50%", cursor: "nwse-resize", zIndex: 2
            });
            subZone.appendChild(resizeHandle);

            resizeHandle.addEventListener("mousedown", (e) => {
                e.stopPropagation();
                const startX = e.clientX, startY = e.clientY;
                const startW = subZone.offsetWidth, startH = subZone.offsetHeight;
                const startLeft = parseInt(subZone.style.left) || 0;
                const startTop = parseInt(subZone.style.top) || 0;
                function resize(ev) {
                    let newW = Math.max(40, startW + (ev.clientX - startX));
                    let newH = Math.max(40, startH + (ev.clientY - startY));
                    newW = Math.min(newW, canvas.offsetWidth - startLeft);
                    newH = Math.min(newH, canvas.offsetHeight - startTop);
                    subZone.style.width = newW + "px";
                    subZone.style.height = newH + "px";
                }
                function stopResize() {
                    document.removeEventListener("mousemove", resize);
                    document.removeEventListener("mouseup", stopResize);
                    saveState();
                }
                document.addEventListener("mousemove", resize);
                document.addEventListener("mouseup", stopResize);
            });

            subZone.addEventListener("mousedown", (e) => {
                if (e.target.classList.contains('resize-handle')) return;
                const rect = subZone.getBoundingClientRect();
                const canvasRect = canvas.getBoundingClientRect();
                const offsetX = e.clientX - rect.left;
                const offsetY = e.clientY - rect.top;
                function move(ev) {
                    let newX = ev.clientX - canvasRect.left - offsetX;
                    let newY = ev.clientY - canvasRect.top - offsetY;
                    newX = Math.max(0, Math.min(newX, canvas.offsetWidth - subZone.offsetWidth));
                    newY = Math.max(0, Math.min(newY, canvas.offsetHeight - subZone.offsetHeight));
                    subZone.style.left = newX + "px";
                    subZone.style.top = newY + "px";
                }
                function stop() {
                    document.removeEventListener("mousemove", move);
                    document.removeEventListener("mouseup", stop);
                    saveState();
                }
                document.addEventListener("mousemove", move);
                document.addEventListener("mouseup", stop);
            });

            canvas.appendChild(subZone);
            if (!preset) saveState();
            return subZone;
        }

        // ====== CUSTOM LINE CREATION ======
        function createCustomLine(preset = null) {
            const customLine = document.createElement("div");
            customLine.className = "separator-line";
            customLine.dataset.type = "separator-line";
            customLine.dataset.parent = parentSlug;
            customLine.dataset.id = preset?.id || newId("separator");
            Object.assign(customLine.style, {
                position: "absolute",
                transformOrigin: "50% 50%"
            });

            const canvasW = canvas.offsetWidth, canvasH = canvas.offsetHeight;

            if (preset) {
                customLine.style.left = `${preset.left}px`;
                customLine.style.top = `${preset.top}px`;
                customLine.style.width = `${preset.width}px`;
                customLine.style.height = `${preset.height}px`;
                customLine.dataset.rotation = preset.rotation || 0;
                customLine.style.transform = preset.rotation ? `rotate(${preset.rotation}deg)` : "";
            } else {
                const size = Math.max(100, Math.floor(Math.min(canvasW, canvasH) * 0.3));
                customLine.style.width = size + "px";
                customLine.style.height = "4px";
                customLine.style.left = Math.floor((canvasW - size) / 2) + "px";
                customLine.style.top = Math.floor((canvasH - 4) / 2) + "px";
                customLine.dataset.rotation = "0";
            }

            // Style the separator line
            customLine.style.backgroundColor = "#8b5cf6";
            customLine.style.border = "none";
            customLine.style.borderRadius = "2px";
            customLine.style.cursor = "grab";
            customLine.style.zIndex = "40";
            customLine.style.userSelect = "none";

            // Add rotate handle
            const rotateHandle = document.createElement("div");
            rotateHandle.className = "rotate-handle";
            rotateHandle.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 13C2.8 11.3 2.7 9.1 3.8 7.3C5.1 5.1 8.1 4.2 10.6 5.5C13.1 6.8 14 9.8 12.7 12" stroke="#111" stroke-width="1.5" fill="none"/>
                    <polygon points="14.5,12.5 17,11.5 15.5,14.2" fill="#111"/>
                </svg>
            `;
            customLine.appendChild(rotateHandle);

            // Add resize handles (only width resizing)
            const handlesDef = [
                { class: "left", directions: ['left'] },
                { class: "right", directions: ['right'] }
            ];

            handlesDef.forEach(h => {
                const handle = document.createElement("div");
                handle.className = `resize-handle ${h.class}`;
                customLine.appendChild(handle);
            });

            // Function to update handle rotations
            function updateHandleRotations() {
                const rotation = parseFloat(customLine.dataset.rotation) || 0;
                const leftHandle = customLine.querySelector('.resize-handle.left');
                const rightHandle = customLine.querySelector('.resize-handle.right');
                
                if (leftHandle) {
                    leftHandle.style.transform = `rotate(${rotation}deg)`;
                }
                if (rightHandle) {
                    rightHandle.style.transform = `rotate(${rotation}deg)`;
                }
            }

            // Initial rotation update
            updateHandleRotations();

            // Setup rotation
            rotateHandle.addEventListener("mousedown", (e) => {
                e.stopPropagation();
                const rect = customLine.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const startAngle = parseFloat(customLine.dataset.rotation) || 0;
                const getAngle = (ev) => Math.atan2(ev.clientY - centerY, ev.clientX - centerX) * 180 / Math.PI;
                const initialMouseAngle = getAngle(e);
                function onMouseMove(ev) {
                    const currentMouseAngle = getAngle(ev);
                    const newAngle = startAngle + (currentMouseAngle - initialMouseAngle);
                    customLine.dataset.rotation = newAngle;
                    customLine.style.transform = `rotate(${newAngle}deg)`;
                    updateHandleRotations();
                }
                function onMouseUp() {
                    document.removeEventListener("mousemove", onMouseMove);
                    document.removeEventListener("mouseup", onMouseUp);
                    saveState();
                }
                document.addEventListener("mousemove", onMouseMove);
                document.addEventListener("mouseup", onMouseUp);
            });

            // Setup resize (width only, rotation-aware)
            function setupResize(handle, directions) {
                handle.addEventListener("mousedown", (e) => {
                    e.stopPropagation();
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startW = customLine.offsetWidth;
                    const startL = parseInt(customLine.style.left) || 0;
                    const startT = parseInt(customLine.style.top) || 0;
                    const minW = 30;
                    const rotation = parseFloat(customLine.dataset.rotation) || 0;
                    const angleRad = rotation * Math.PI / 180;

                    function onMouseMove(e2) {
                        const dX = e2.clientX - startX;
                        const dY = e2.clientY - startY;
                        
                        // Project the mouse movement onto the line's direction
                        const projectedDistance = dX * Math.cos(angleRad) + dY * Math.sin(angleRad);

                        if (directions.includes('right')) {
                            // Only extend from right end
                            const newW = Math.max(startW + projectedDistance, minW);
                            customLine.style.width = newW + "px";
                        }
                        if (directions.includes('left')) {
                            // Only extend from left end, keep center fixed
                            const newW = Math.max(startW - projectedDistance, minW);
                            const widthChange = startW - newW;
                            
                            // Calculate new position to keep the center fixed
                            const centerOffsetX = (widthChange / 2) * Math.cos(angleRad);
                            const centerOffsetY = (widthChange / 2) * Math.sin(angleRad);
                            
                            customLine.style.width = newW + "px";
                            customLine.style.left = (startL + centerOffsetX) + "px";
                            customLine.style.top = (startT + centerOffsetY) + "px";
                        }
                    }
                    function onMouseUp() {
                        document.removeEventListener("mousemove", onMouseMove);
                        document.removeEventListener("mouseup", onMouseUp);
                        saveState();
                    }
                    document.addEventListener("mousemove", onMouseMove);
                    document.addEventListener("mouseup", onMouseUp);
                });
            }
            handlesDef.forEach(h => setupResize(customLine.querySelector(`.resize-handle.${h.class}`), h.directions));

            // Setup drag
            customLine.addEventListener("mousedown", (e) => {
                if (e.target.classList.contains('resize-handle') || e.target.classList.contains('rotate-handle')) return;
                
                const rect = customLine.getBoundingClientRect();
                const canvasRect = canvas.getBoundingClientRect();
                const rotation = parseFloat(customLine.dataset.rotation) || 0;
                
                // Calculate offset relative to the element's center
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const offsetX = e.clientX - centerX;
                const offsetY = e.clientY - centerY;
                
                function move(ev) {
                    // Calculate new center position
                    let newCenterX = ev.clientX - offsetX;
                    let newCenterY = ev.clientY - offsetY;
                    
                    // Convert center position to top-left position
                    const itemW = customLine.offsetWidth;
                    const itemH = customLine.offsetHeight;
                    let newX = newCenterX - canvasRect.left - itemW / 2;
                    let newY = newCenterY - canvasRect.top - itemH / 2;
                    
                    // Constrain to canvas bounds
                    newX = Math.max(0, Math.min(newX, canvas.offsetWidth - itemW));
                    newY = Math.max(0, Math.min(newY, canvas.offsetHeight - itemH));
                    
                    customLine.style.left = newX + "px";
                    customLine.style.top = newY + "px";
                }
                
                function stop() {
                    document.removeEventListener("mousemove", move);
                    document.removeEventListener("mouseup", stop);
                    saveState();
                }
                
                document.addEventListener("mousemove", move);
                document.addEventListener("mouseup", stop);
            });

            canvas.appendChild(customLine);
            if (!preset) saveState();
            return customLine;
        }

        // ====== LINES ======
        let globalResizingInProgress = false;

        const handlesDef = [
            { class: "top-left", directions: ['left', 'top'] },
            { class: "top", directions: ['top'] },
            { class: "top-right", directions: ['right', 'top'] },
            { class: "right", directions: ['right'] },
            { class: "bottom-right", directions: ['right', 'bottom'] },
            { class: "bottom", directions: ['bottom'] },
            { class: "bottom-left", directions: ['left', 'bottom'] },
            { class: "left", directions: ['left'] }
        ];

        lines.forEach((line, index) => {
            const lineDiv = document.createElement("div");
            lineDiv.className = "line-item";
            lineDiv.dataset.id = `line-${line.id}`;
            lineDiv.dataset.type = "line";
            lineDiv.dataset.parent = parentSlug; // ✅ match zone
            Object.assign(lineDiv.style, {
                position: "absolute",
                left: `${0 + index * 100}px`,
                top: `${120 + (index % 2) * 80}px`,
                transformOrigin: "50% 50%"
            });
            lineDiv.style.backgroundColor = colorWithAlpha(line.color, 0.55);
            lineDiv.dataset.rotation = "0";

            const contentSpan = document.createElement("span");
            contentSpan.textContent = line.name.toUpperCase();
            lineDiv.appendChild(contentSpan);

            const rotateHandle = document.createElement("div");
            rotateHandle.className = "rotate-handle";
            rotateHandle.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 13C2.8 11.3 2.7 9.1 3.8 7.3C5.1 5.1 8.1 4.2 10.6 5.5C13.1 6.8 14 9.8 12.7 12" stroke="#111" stroke-width="1.5" fill="none"/>
          <polygon points="14.5,12.5 17,11.5 15.5,14.2" fill="#111"/>
        </svg>
      `;
            lineDiv.appendChild(rotateHandle);

            rotateHandle.addEventListener("mousedown", (e) => {
                e.stopPropagation();
                const rect = lineDiv.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const startAngle = parseFloat(lineDiv.dataset.rotation) || 0;
                const getAngle = (ev) => Math.atan2(ev.clientY - centerY, ev.clientX - centerX) * 180 / Math.PI;
                const initialMouseAngle = getAngle(e);
                function onMouseMove(ev) {
                    const currentMouseAngle = getAngle(ev);
                    const newAngle = startAngle + (currentMouseAngle - initialMouseAngle);
                    lineDiv.dataset.rotation = newAngle;
                    lineDiv.style.transform = `rotate(${newAngle}deg)`;
                    lineDiv.style.setProperty('--rotation', `${newAngle}deg`);
                }
                function onMouseUp() {
                    document.removeEventListener("mousemove", onMouseMove);
                    document.removeEventListener("mouseup", onMouseUp);
                    saveState();
                }
                document.addEventListener("mousemove", onMouseMove);
                document.addEventListener("mouseup", onMouseUp);
            });

            lineDiv.dataset.tooltip = `QTE: ${line.qte} | Cadence: ${line.cadence} | Defaut: ${line.defaut}`;

            // 8 handles
            handlesDef.forEach(h => {
                const handle = document.createElement("div");
                handle.className = `resize-handle ${h.class}`;
                lineDiv.appendChild(handle);
            });

            function setupResize(handle, directions) {
                handle.addEventListener("mousedown", (e) => {
                    e.stopPropagation();
                    globalResizingInProgress = true;

                    const startX = e.clientX, startY = e.clientY;
                    const startW = lineDiv.offsetWidth, startH = lineDiv.offsetHeight;
                    const startL = parseInt(lineDiv.style.left) || 0;
                    const startT = parseInt(lineDiv.style.top) || 0;
                    const minW = 50, minH = 30;

                    let capToSubZone = null, capToShape = null, capToRect = null, capToCircle = null;
                    const subZones = Array.from(canvas.querySelectorAll('.sub-zone'));
                    for (const sz of subZones) {
                        const szX = sz.offsetLeft, szY = sz.offsetTop, szW = sz.offsetWidth, szH = sz.offsetHeight;
                        if (startL >= szX && startT >= szY && (startL + startW) <= (szX + szW) && (startT + startH) <= (szY + szH)) {
                            capToSubZone = sz; capToShape = sz.dataset.shape; capToRect = { left: szX, top: szY, right: szX + szW, bottom: szY + szH };
                            if (capToShape === "circle") capToCircle = { cx: szX + szW / 2, cy: szY + szH / 2, r: Math.min(szW, szH) / 2 };
                            break;
                        }
                    }
                    const wouldCollideLocal = (x, y, w, h) => wouldCollide(lineDiv, x, y, w, h, parseFloat(lineDiv.dataset.rotation) || 0);

                    function getMaxResize(dirs, dX, dY) {
                        let maxDX = dX, maxDY = dY, step = 1;

                        if (dirs.includes('right')) {
                            for (let dx = 0; dx <= dX; dx += step) {
                                let w = startW + dx, r = startL + w;
                                if (w < minW || r > canvas.offsetWidth || wouldCollideLocal(startL, startT, w, startH)) { maxDX = dx - step; break; }
                                if (capToSubZone) {
                                    if (capToShape !== "circle") { if (r > capToRect.right) { maxDX = dx - step; break; } }
                                    else {
                                        const corners = [
                                            { x: startL, y: startT }, { x: startL + w, y: startT },
                                            { x: startL, y: startT + startH }, { x: startL + w, y: startT + startH }
                                        ];
                                        if (!corners.every(pt => ((pt.x - capToCircle.cx) ** 2 + (pt.y - capToCircle.cy) ** 2) <= capToCircle.r ** 2)) { maxDX = dx - step; break; }
                                    }
                                }
                                maxDX = dx;
                            }
                        }
                        if (dirs.includes('left')) {
                            for (let dx = 0; dx >= dX; dx -= step) {
                                let w = startW - dx, l = startL + dx;
                                if (w < minW || l < 0 || wouldCollideLocal(l, startT, w, startH)) { maxDX = dx + step; break; }
                                if (capToSubZone) {
                                    if (capToShape !== "circle") { if (l < capToRect.left) { maxDX = dx + step; break; } }
                                    else {
                                        const corners = [
                                            { x: l, y: startT }, { x: l + w, y: startT },
                                            { x: l, y: startT + startH }, { x: l + w, y: startT + startH }
                                        ];
                                        if (!corners.every(pt => ((pt.x - capToCircle.cx) ** 2 + (pt.y - capToCircle.cy) ** 2) <= capToCircle.r ** 2)) { maxDX = dx + step; break; }
                                    }
                                }
                                maxDX = dx;
                            }
                        }
                        if (dirs.includes('bottom')) {
                            for (let dy = 0; dy <= dY; dy += step) {
                                let h = startH + dy, b = startT + h;
                                if (h < minH || b > canvas.offsetHeight || wouldCollideLocal(startL, startT, startW, h)) { maxDY = dy - step; break; }
                                if (capToSubZone) {
                                    if (capToShape !== "circle") { if (b > capToRect.bottom) { maxDY = dy - step; break; } }
                                    else {
                                        const corners = [
                                            { x: startL, y: startT }, { x: startL + startW, y: startT },
                                            { x: startL, y: startT + h }, { x: startL + startW, y: startT + h }
                                        ];
                                        if (!corners.every(pt => ((pt.x - capToCircle.cx) ** 2 + (pt.y - capToCircle.cy) ** 2) <= capToCircle.r ** 2)) { maxDY = dy - step; break; }
                                    }
                                }
                                maxDY = dy;
                            }
                        }
                        if (dirs.includes('top')) {
                            for (let dy = 0; dy >= dY; dy -= step) {
                                let h = startH - dy, t = startT + dy;
                                if (h < minH || t < 0 || wouldCollideLocal(startL, t, startW, h)) { maxDY = dy + step; break; }
                                if (capToSubZone) {
                                    if (capToShape !== "circle") { if (t < capToRect.top) { maxDY = dy + step; break; } }
                                    else {
                                        const corners = [
                                            { x: startL, y: t }, { x: startL + startW, y: t },
                                            { x: startL, y: t + h }, { x: startL + startW, y: t + h }
                                        ];
                                        if (!corners.every(pt => ((pt.x - capToCircle.cx) ** 2 + (pt.y - capToCircle.cy) ** 2) <= capToCircle.r ** 2)) { maxDY = dy + step; break; }
                                    }
                                }
                                maxDY = dy;
                            }
                        }
                        return { maxDX, maxDY };
                    }

                    function onMouseMove(e2) {
                        let dX = e2.clientX - startX;
                        let dY = e2.clientY - startY;
                        const { maxDX, maxDY } = getMaxResize(directions, dX, dY);

                        if (directions.includes('right')) lineDiv.style.width = Math.max(startW + maxDX, minW) + "px";
                        if (directions.includes('left')) {
                            const width = Math.max(startW - maxDX, minW);
                            const left = startL + (startW - width);
                            lineDiv.style.width = width + "px";
                            lineDiv.style.left = left + "px";
                        }
                        if (directions.includes('bottom')) lineDiv.style.height = Math.max(startH + maxDY, minH) + "px";
                        if (directions.includes('top')) {
                            const height = Math.max(startH - maxDY, minH);
                            const top = startT + (startH - height);
                            lineDiv.style.height = height + "px";
                            lineDiv.style.top = top + "px";
                        }
                    }
                    function onMouseUp() {
                        document.removeEventListener("mousemove", onMouseMove);
                        document.removeEventListener("mouseup", onMouseUp);
                        setTimeout(() => { globalResizingInProgress = false; }, 50);
                        saveState();
                    }
                    document.addEventListener("mousemove", onMouseMove);
                    document.addEventListener("mouseup", onMouseUp);
                });
            }
            handlesDef.forEach(h => setupResize(lineDiv.querySelector(`.resize-handle.${h.class}`), h.directions));

            // Tooltip
            lineDiv.addEventListener("mouseenter", () => { tooltip.style.display = "block"; tooltip.textContent = lineDiv.dataset.tooltip; });
            lineDiv.addEventListener("mousemove", (e) => {
                tooltip.style.display = "block"; tooltip.textContent = lineDiv.dataset.tooltip;
                const tooltipWidth = tooltip.offsetWidth || 120;
                tooltip.style.left = (e.pageX - tooltipWidth / 2) + "px";
                tooltip.style.top = (e.pageY + 22) + "px";
            });
            lineDiv.addEventListener("mouseleave", () => { tooltip.style.display = "none"; });

            // Drag with snap
            lineDiv.addEventListener("mousedown", (e) => {
                if (e.target.classList.contains('resize-handle') || globalResizingInProgress) return;
                const rect = lineDiv.getBoundingClientRect();
                const canvasRect = canvas.getBoundingClientRect();
                const offsetX = e.clientX - rect.left;
                const offsetY = e.clientY - rect.top;
                let lastValidX = parseInt(lineDiv.style.left) || 0;
                let lastValidY = parseInt(lineDiv.style.top) || 0;

                function move(ev) {
                    let newX = ev.clientX - canvasRect.left - offsetX;
                    let newY = ev.clientY - canvasRect.top - offsetY;
                    const itemW = lineDiv.offsetWidth, itemH = lineDiv.offsetHeight;
                    newX = Math.max(0, Math.min(newX, canvas.offsetWidth - itemW));
                    newY = Math.max(0, Math.min(newY, canvas.offsetHeight - itemH));

                    let fullyInside = false, fullyOutside = true;
                    const subZones = Array.from(canvas.querySelectorAll('.sub-zone'));
                    const lineRect = { left: newX, top: newY, right: newX + itemW, bottom: newY + itemH };
                    for (const sz of subZones) {
                        const szX = sz.offsetLeft, szY = sz.offsetTop, szW = sz.offsetWidth, szH = sz.offsetHeight;
                        if (lineRect.left >= szX && lineRect.top >= szY && lineRect.right <= szX + szW && lineRect.bottom <= szY + szH) { fullyInside = true; fullyOutside = false; break; }
                        if (lineRect.right > szX && lineRect.left < szX + szW && lineRect.bottom > szY && lineRect.top < szY + szH) { fullyOutside = false; }
                    }
                    if (!wouldCollide(lineDiv, newX, newY, itemW, itemH, parseFloat(lineDiv.dataset.rotation) || 0) && (fullyInside || fullyOutside)) {
                        lineDiv.classList.remove('colliding', 'colliding-anim');
                        lineDiv.style.left = newX + "px"; lineDiv.style.top = newY + "px";
                        lastValidX = newX; lastValidY = newY;
                    } else {
                        if (!lineDiv.classList.contains('colliding')) {
                            lineDiv.classList.add('colliding-anim', 'colliding');
                            setTimeout(() => { lineDiv.classList.remove('colliding'); }, 370);
                        }
                    }
                }
                function stop() {
                    document.removeEventListener("mousemove", move);
                    document.removeEventListener("mouseup", stop);
                    const itemW = lineDiv.offsetWidth, itemH = lineDiv.offsetHeight;
                    const newX = parseInt(lineDiv.style.left) || 0, newY = parseInt(lineDiv.style.top) || 0;
                    let fullyInside = false, fullyOutside = true;
                    const subZones = Array.from(canvas.querySelectorAll('.sub-zone'));
                    const lineRect = { left: newX, top: newY, right: newX + itemW, bottom: newY + itemH };
                    for (const sz of subZones) {
                        const szX = sz.offsetLeft, szY = sz.offsetTop, szW = sz.offsetWidth, szH = sz.offsetHeight;
                        if (lineRect.left >= szX && lineRect.top >= szY && lineRect.right <= szX + szW && lineRect.bottom <= szY + szH) { fullyInside = true; fullyOutside = false; break; }
                        if (lineRect.right > szX && lineRect.left < szX + szW && lineRect.bottom > szY && lineRect.top < szY + szH) { fullyOutside = false; }
                    }
                    if (!(fullyInside || fullyOutside)) {
                        lineDiv.style.left = lastValidX + "px"; lineDiv.style.top = lastValidY + "px";
                    }
                    saveState();
                }
                document.addEventListener("mousemove", move);
                document.addEventListener("mouseup", stop);
            });

            canvas.appendChild(lineDiv);
        });

        // ====== LOAD STATE FOR THIS ZONE ======
        const savedForZone = getSavedByParent(parentSlug);

        // 1) Restore sub-zones first (create if missing)
        savedForZone.filter(s => s.type === "sub-zone").forEach(sz => {
            const exists = canvas.querySelector(`.sub-zone[data-id="${sz.id}"]`);
            if (!exists) createSubZone(sz.shape || "rectangle", sz);
        });

        // 2) Restore separator lines (create if missing)
        savedForZone.filter(s => s.type === "separator-line").forEach(cl => {
            const exists = canvas.querySelector(`.separator-line[data-id="${cl.id}"]`);
            if (!exists) createSubZone("line", cl);
        });

        // 3) Restore lines (apply pos/size/rotation)
        const savedLinesMap = new Map(savedForZone.filter(s => s.type === "line").map(s => [s.id, s]));
        canvas.querySelectorAll(".line-item").forEach(lineEl => {
            const sid = lineEl.dataset.id;
            const s = savedLinesMap.get(sid);
            if (s) {
                lineEl.style.left = `${s.left}px`;
                lineEl.style.top = `${s.top}px`;
                if (s.width) lineEl.style.width = `${s.width}px`;
                if (s.height) lineEl.style.height = `${s.height}px`;
                lineEl.dataset.rotation = s.rotation || 0;
                lineEl.style.transform = s.rotation ? `rotate(${s.rotation}deg)` : "";
            }
        });
    });

    // If there was no saved state yet, capture the initial layout once
    if (readState().length === 0) saveState();

    // Extra safety: save on unload
    window.addEventListener("beforeunload", () => { saveState(); });
});
