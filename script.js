const data = [
    { id: "1", name: "flex1", uap: "zone1", qte: 500, cadence: 600, color: "orange", defaut: 20 },
    { id: "2", name: "flex2", uap: "zone1", qte: 500, cadence: 650, color: "orange", defaut: 20 },
    { id: "3", name: "flex3", uap: "zone1", qte: 500, cadence: 670, color: "orange", defaut: 20 },
    { id: "4", name: "cm3/cm4 ligne1", uap: "zone2", qte: 200, cadence: 600, color: "red", defaut: 20 },
    { id: "5", name: "cm3/cm4 ligne2", uap: "zone2", qte: 700, cadence: 600, color: "green", defaut: 20 },
    { id: "6", name: "cm3/cm4 ligne2", uap: "zone3", qte: 700, cadence: 600, color: "green", defaut: 20 }
];

const zonesContainer = document.getElementById("zones-container");
const tooltip = document.getElementById("tooltip");

// Group data by uap (zone)
const grouped = {};
data.forEach(item => {
    if (!grouped[item.uap]) grouped[item.uap] = [];
    grouped[item.uap].push(item);
});

Object.entries(grouped).forEach(([zoneName, lines]) => {
    const zoneDiv = document.createElement("div");
    zoneDiv.className = "zone";


    // Zone title and sub-zone add button
    const titleDiv = document.createElement("div");
    titleDiv.className = "zone-title";
    titleDiv.textContent = zoneName.toUpperCase();
    // Add sub-zone button
    const addSubZoneBtn = document.createElement("button");
    addSubZoneBtn.textContent = "+";
    addSubZoneBtn.className = "add-subzone-btn";
    addSubZoneBtn.title = "Add a new sub-zone (rectangle or circle) to this zone";
    titleDiv.appendChild(addSubZoneBtn);
    zoneDiv.appendChild(titleDiv);

    // Canvas
    const canvas = document.createElement("div");
    canvas.className = "canvas";
    zoneDiv.appendChild(canvas);

    zonesContainer.appendChild(zoneDiv);

    // Sub-zone creation logic with visual shape menu
    let shapeMenu = null;
        addSubZoneBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            // Remove any existing menu
            if (shapeMenu) {
                shapeMenu.remove();
                shapeMenu = null;
                return;
            }
            shapeMenu = document.createElement("div");
            shapeMenu.className = "shape-menu";
            shapeMenu.style.position = "absolute";
            // Center the menu in the canvas
            const canvasRect = canvas.getBoundingClientRect();
            const parentRect = canvas.offsetParent.getBoundingClientRect();
            const menuWidth = 420; // match min-width in CSS
            const menuHeight = 160; // match min-height in CSS
            shapeMenu.style.left = ((canvas.offsetWidth - menuWidth) / 2) + "px";
            shapeMenu.style.top = ((canvas.offsetHeight - menuHeight) / 2) + "px";
            shapeMenu.style.display = "flex";
            shapeMenu.style.gap = "40px";
            shapeMenu.style.background = "#fff";
            shapeMenu.style.border = "3.5px solid #2563eb";
            shapeMenu.style.borderRadius = "24px";
            shapeMenu.style.boxShadow = "0 8px 32px rgba(30,60,120,0.22)";
            shapeMenu.style.padding = "38px 60px";
            shapeMenu.style.zIndex = 30;


                // Rectangle button
                const rectBtn = document.createElement("button");
                rectBtn.className = "shape-btn rect-btn";
                rectBtn.title = "Add rectangle sub-zone";
                rectBtn.innerHTML = '<svg width="96" height="96"><rect x="8" y="24" width="80" height="48" rx="18" fill="#2563eb" stroke="#1e40af" stroke-width="4"/></svg>';
                rectBtn.addEventListener("click", (ev) => {
                    ev.stopPropagation();
                    createSubZone("rectangle");
                    shapeMenu.remove();
                    shapeMenu = null;
                });
                shapeMenu.appendChild(rectBtn);

                // Circle button
                const circBtn = document.createElement("button");
                circBtn.className = "shape-btn circ-btn";
                circBtn.title = "Add circle sub-zone";
                circBtn.innerHTML = '<svg width="96" height="96"><circle cx="48" cy="48" r="40" fill="#eab308" stroke="#b45309" stroke-width="4"/></svg>';
                circBtn.addEventListener("click", (ev) => {
                    ev.stopPropagation();
                    createSubZone("circle");
                    shapeMenu.remove();
                    shapeMenu = null;
                });
                shapeMenu.appendChild(circBtn);

                // Triangle button
                const triBtn = document.createElement("button");
                triBtn.className = "shape-btn tri-btn";
                triBtn.title = "Add triangle sub-zone";
                triBtn.innerHTML = '<svg width="96" height="96"><polygon points="48,16 88,80 8,80" fill="#10b981" stroke="#047857" stroke-width="6"/></svg>';
                triBtn.addEventListener("click", (ev) => {
                    ev.stopPropagation();
                    createSubZone("triangle");
                    shapeMenu.remove();
                    shapeMenu = null;
                });
                shapeMenu.appendChild(triBtn);

        // Close menu if clicking outside
        setTimeout(() => {
            document.addEventListener("mousedown", closeMenu, { once: true });
        }, 0);
        function closeMenu(ev) {
            if (!shapeMenu.contains(ev.target)) {
                shapeMenu.remove();
                shapeMenu = null;
            }
        }

        titleDiv.appendChild(shapeMenu);
    });

    // Helper to create a sub-zone (fills canvas with margin)
    function createSubZone(shape) {
        const subZone = document.createElement("div");
        subZone.className = "sub-zone";
        subZone.dataset.shape = shape;
        subZone.style.position = "absolute";
        // Spawn at smaller size, centered
        const margin = 4;
        const canvasW = canvas.offsetWidth;
        const canvasH = canvas.offsetHeight;
    // Make width and height equal, based on the smaller canvas dimension
    const size = Math.max(80, Math.floor(Math.min(canvasW, canvasH) * 0.35));
    subZone.style.width = size + "px";
    subZone.style.height = size + "px";
    // Center the sub-zone in the canvas
    subZone.style.left = Math.floor((canvasW - size) / 2) + "px";
    subZone.style.top = Math.floor((canvasH - size) / 2) + "px";
        if (shape === "circle") {
            subZone.style.background = "rgba(100,180,255,0.13)";
            subZone.style.border = "2px dashed #3b82f6";
            subZone.style.borderRadius = "50%";
            subZone.style.clipPath = "none";
        } else if (shape === "triangle") {
            subZone.style.background = "none";
            subZone.style.border = "none";
            subZone.style.borderRadius = "0";
            subZone.style.clipPath = "none";
            // Add a child div for the triangle visual
            const triangleDiv = document.createElement("div");
            triangleDiv.style.width = "100%";
            triangleDiv.style.height = "100%";
            triangleDiv.style.background = "rgba(16,185,129,0.18)";
            triangleDiv.style.border = "2px dashed #047857";
            triangleDiv.style.clipPath = "polygon(50% 0%, 100% 100%, 0% 100%)";
            triangleDiv.style.position = "absolute";
            triangleDiv.style.left = 0;
            triangleDiv.style.top = 0;
            triangleDiv.style.zIndex = 0;
            subZone.appendChild(triangleDiv);
        } else {
            subZone.style.background = "rgba(100,255,180,0.13)";
            subZone.style.border = "2px dashed #3b82f6";
            subZone.style.borderRadius = "18px";
            subZone.style.clipPath = "none";
        }
        subZone.style.zIndex = 1;

        // Always add remove button for all shapes (including triangle)
        const triangleRemoveBtn = document.createElement("button");
        triangleRemoveBtn.textContent = "×";
        triangleRemoveBtn.title = "Remove this sub-zone";
        triangleRemoveBtn.className = "remove-subzone-btn";
        triangleRemoveBtn.style.position = "absolute";
        triangleRemoveBtn.style.top = "-12px";
        triangleRemoveBtn.style.right = "-12px";
        triangleRemoveBtn.style.width = "22px";
        triangleRemoveBtn.style.height = "22px";
        triangleRemoveBtn.style.background = "#ef4444";
        triangleRemoveBtn.style.color = "#fff";
        triangleRemoveBtn.style.border = "none";
        triangleRemoveBtn.style.borderRadius = "50%";
        triangleRemoveBtn.style.cursor = "pointer";
        triangleRemoveBtn.style.zIndex = 3;
        triangleRemoveBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            subZone.remove();
        });
        subZone.appendChild(triangleRemoveBtn);

        // Add resize handle (bottom-right corner)
        const resizeHandle = document.createElement("div");
        resizeHandle.className = "resize-handle subzone-resize";
        resizeHandle.style.position = "absolute";
        resizeHandle.style.right = "-10px";
        resizeHandle.style.bottom = "-10px";
        resizeHandle.style.width = "18px";
        resizeHandle.style.height = "18px";
        resizeHandle.style.background = "#3b82f6";
        resizeHandle.style.borderRadius = "50%";
        resizeHandle.style.cursor = "nwse-resize";
        resizeHandle.style.zIndex = 2;
        subZone.appendChild(resizeHandle);

        resizeHandle.addEventListener("mousedown", function(e) {
            e.stopPropagation();
            const startX = e.clientX;
            const startY = e.clientY;
            const startW = subZone.offsetWidth;
            const startH = subZone.offsetHeight;
            const startLeft = parseInt(subZone.style.left) || 0;
            const startTop = parseInt(subZone.style.top) || 0;
            function resize(ev) {
                let newW = Math.max(40, startW + (ev.clientX - startX));
                let newH = Math.max(40, startH + (ev.clientY - startY));
                // Clamp so right/bottom edge stays inside canvas
                newW = Math.min(newW, canvas.offsetWidth - startLeft);
                newH = Math.min(newH, canvas.offsetHeight - startTop);
                subZone.style.width = newW + "px";
                subZone.style.height = newH + "px";
            }
            function stopResize() {
                document.removeEventListener("mousemove", resize);
                document.removeEventListener("mouseup", stopResize);
            }
            document.addEventListener("mousemove", resize);
            document.addEventListener("mouseup", stopResize);
        });

        // Drag logic for sub-zone
        subZone.addEventListener("mousedown", function (e) {
            if (e.target.classList.contains('resize-handle')) return;
            const rect = subZone.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;
            function move(ev) {
                let newX = ev.clientX - canvasRect.left - offsetX;
                let newY = ev.clientY - canvasRect.top - offsetY;
                // Clamp so sub-zone stays fully inside canvas
                newX = Math.max(0, Math.min(newX, canvas.offsetWidth - subZone.offsetWidth));
                newY = Math.max(0, Math.min(newY, canvas.offsetHeight - subZone.offsetHeight));
                subZone.style.left = newX + "px";
                subZone.style.top = newY + "px";
            }
            function stop() {
                document.removeEventListener("mousemove", move);
                document.removeEventListener("mouseup", stop);
            }
            document.addEventListener("mousemove", move);
            document.addEventListener("mouseup", stop);
        });

        // Remove button for undo
        const removeBtn = document.createElement("button");
        removeBtn.textContent = "×";
        removeBtn.title = "Remove this sub-zone";
        removeBtn.className = "remove-subzone-btn";
        removeBtn.style.position = "absolute";
        removeBtn.style.top = "-12px";
        removeBtn.style.right = "-12px";
        removeBtn.style.width = "22px";
        removeBtn.style.height = "22px";
        removeBtn.style.background = "#ef4444";
        removeBtn.style.color = "#fff";
        removeBtn.style.border = "none";
        removeBtn.style.borderRadius = "50%";
        removeBtn.style.cursor = "pointer";
        removeBtn.style.zIndex = 3;
        removeBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            subZone.remove();
        });
        subZone.appendChild(removeBtn);

        canvas.appendChild(subZone);
    }

    // Helper to get the axis-aligned bounding box of a rotated rectangle
    function getRotatedAABB(x, y, width, height, angleDeg) {
        const angle = angleDeg * Math.PI / 180;
        const cx = x + width / 2;
        const cy = y + height / 2;
        // Four corners before rotation
        const corners = [
            { x: x, y: y },
            { x: x + width, y: y },
            { x: x + width, y: y + height },
            { x: x, y: y + height }
        ];
        // Rotate each corner
        const rotated = corners.map(pt => {
            const dx = pt.x - cx;
            const dy = pt.y - cy;
            return {
                x: cx + dx * Math.cos(angle) - dy * Math.sin(angle),
                y: cy + dx * Math.sin(angle) + dy * Math.cos(angle)
            };
        });
        // Compute AABB
        const xs = rotated.map(pt => pt.x);
        const ys = rotated.map(pt => pt.y);
        return {
            left: Math.min(...xs),
            right: Math.max(...xs),
            top: Math.min(...ys),
            bottom: Math.max(...ys)
        };
    }

    // Helper function to check collision between two rectangles (AABB)
    function checkCollision(rect1, rect2) {
        return !(rect1.right < rect2.left ||
            rect1.left > rect2.right ||
            rect1.bottom < rect2.top ||
            rect1.top > rect2.bottom);
    }

    // Helper function to get all items in this canvas except the current one
    function getOtherItems(currentItem) {
        return Array.from(canvas.children).filter(item => item !== currentItem);
    }

    // Helper function to check if a position/size would cause collision (with rotation)
    function wouldCollide(item, x, y, width, height, angle) {
        const proposedAABB = getRotatedAABB(x, y, width, height, angle || 0);
        const otherItems = getOtherItems(item);
        for (const otherItem of otherItems) {
            // Ignore sub-zones for collision
            if (otherItem.classList.contains('sub-zone')) continue;
            const otherX = parseInt(otherItem.style.left) || 0;
            const otherY = parseInt(otherItem.style.top) || 0;
            const otherW = otherItem.offsetWidth;
            const otherH = otherItem.offsetHeight;
            const otherAngle = parseFloat(otherItem.dataset.rotation) || 0;
            const otherAABB = getRotatedAABB(otherX, otherY, otherW, otherH, otherAngle);
            if (checkCollision(proposedAABB, otherAABB)) {
                return true;
            }
        }
        return false;
    }

    let globalResizingInProgress = false;
    lines.forEach((line, index) => {
        const lineDiv = document.createElement("div");
        lineDiv.className = "line-item";
        lineDiv.style.position = "absolute";
        lineDiv.style.left = `${0 + index * 100}px`;
        lineDiv.style.top = `${120 + (index % 2) * 80}px`;
        lineDiv.style.backgroundColor = line.color;
        lineDiv.style.transformOrigin = "50% 50%";

        // Add line name span
        const contentSpan = document.createElement("span");
        contentSpan.textContent = line.name.toUpperCase();
        lineDiv.appendChild(contentSpan);

        // Add rotation handle (SVG icon)
        const rotateHandle = document.createElement("div");
        rotateHandle.className = "rotate-handle";
        rotateHandle.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 13C2.8 11.3 2.7 9.1 3.8 7.3C5.1 5.1 8.1 4.2 10.6 5.5C13.1 6.8 14 9.8 12.7 12" stroke="#111" stroke-width="1.5" fill="none"/>
                <polygon points="14.5,12.5 17,11.5 15.5,14.2" fill="#111"/>
            </svg>
        `;
        lineDiv.appendChild(rotateHandle);

        // Store rotation angle
        lineDiv.dataset.rotation = "0";

        // Rotation logic
        rotateHandle.addEventListener("mousedown", function (e) {
            e.stopPropagation();
            const rect = lineDiv.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const startAngle = parseFloat(lineDiv.dataset.rotation) || 0;

            function getAngle(e) {
                const dx = e.clientX - centerX;
                const dy = e.clientY - centerY;
                return Math.atan2(dy, dx) * 180 / Math.PI;
            }

            const initialMouseAngle = getAngle(e);

            function onMouseMove(ev) {
                const currentMouseAngle = getAngle(ev);
                let newAngle = startAngle + (currentMouseAngle - initialMouseAngle);
                lineDiv.dataset.rotation = newAngle;
                lineDiv.style.transform = `rotate(${newAngle}deg)`;
                lineDiv.style.setProperty('--rotation', `${newAngle}deg`);
            }

            function onMouseUp() {
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
            }

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        });

        // Tooltip data
        lineDiv.dataset.tooltip = `QTE: ${line.qte} | Cadence: ${line.cadence} | Defaut: ${line.defaut}`;

        // Create all 8 resize handles
        const handles = [
            { class: "top-left", directions: ['left', 'top'] },
            { class: "top", directions: ['top'] },
            { class: "top-right", directions: ['right', 'top'] },
            { class: "right", directions: ['right'] },
            { class: "bottom-right", directions: ['right', 'bottom'] },
            { class: "bottom", directions: ['bottom'] },
            { class: "bottom-left", directions: ['left', 'bottom'] },
            { class: "left", directions: ['left'] }
        ];

        handles.forEach(handleInfo => {
            const handle = document.createElement("div");
            handle.className = `resize-handle ${handleInfo.class}`;
            lineDiv.appendChild(handle);
        });

        // Resize functionality
        function setupResize(handle, directions) {
            handle.addEventListener("mousedown", (e) => {
                e.stopPropagation();
                globalResizingInProgress = true;

                const startX = e.clientX;
                const startY = e.clientY;
                const startWidth = lineDiv.offsetWidth;
                const startHeight = lineDiv.offsetHeight;
                const startLeft = parseInt(lineDiv.style.left) || 0;
                const startTop = parseInt(lineDiv.style.top) || 0;
                const minWidth = 50;
                const minHeight = 30;

                // Detect if line is fully inside a sub-zone at start
                let capToSubZone = null;
                let capToShape = null;
                let capToRect = null;
                let capToCircle = null;
                let capToTriangle = null;
                const subZones = Array.from(canvas.querySelectorAll('.sub-zone'));
                for (const sz of subZones) {
                    const szX = sz.offsetLeft;
                    const szY = sz.offsetTop;
                    const szW = sz.offsetWidth;
                    const szH = sz.offsetHeight;
                    if (
                        startLeft >= szX &&
                        startTop >= szY &&
                        (startLeft + startWidth) <= (szX + szW) &&
                        (startTop + startHeight) <= (szY + szH)
                    ) {
                        capToSubZone = sz;
                        capToShape = sz.dataset.shape;
                        capToRect = { left: szX, top: szY, right: szX + szW, bottom: szY + szH };
                        if (capToShape === "circle") {
                            capToCircle = { cx: szX + szW/2, cy: szY + szH/2, r: Math.min(szW, szH)/2 };
                        }
                        if (capToShape === "triangle") {
                            // For now, treat as bounding box
                            capToTriangle = { left: szX, top: szY, right: szX + szW, bottom: szY + szH };
                        }
                        break;
                    }
                }

                function getMaxResize(directions, deltaX, deltaY) {
                    let maxDeltaX = deltaX;
                    let maxDeltaY = deltaY;
                    let step = 1;
                    // Horizontal
                    if (directions.includes('right')) {
                        for (let dx = 0; dx <= deltaX; dx += step) {
                            let w = startWidth + dx;
                            let r = startLeft + w;
                            if (w < minWidth || r > canvas.offsetWidth || wouldCollide(lineDiv, startLeft, startTop, w, startHeight, parseFloat(lineDiv.dataset.rotation) || 0)) {
                                maxDeltaX = dx - step;
                                break;
                            }
                            // Cap to sub-zone right edge
                            if (capToSubZone) {
                                if (capToShape === "rectangle" || capToShape === "triangle") {
                                    if (r > capToRect.right) { maxDeltaX = dx - step; break; }
                                } else if (capToShape === "circle") {
                                    // All 4 corners must stay inside the circle
                                    let corners = [
                                        {x: startLeft, y: startTop},
                                        {x: startLeft + w, y: startTop},
                                        {x: startLeft, y: startTop + startHeight},
                                        {x: startLeft + w, y: startTop + startHeight}
                                    ];
                                    if (!corners.every(pt => ((pt.x - capToCircle.cx) ** 2 + (pt.y - capToCircle.cy) ** 2) <= capToCircle.r ** 2)) {
                                        maxDeltaX = dx - step; break;
                                    }
                                }
                            }
                            maxDeltaX = dx;
                        }
                    }
                    if (directions.includes('left')) {
                        for (let dx = 0; dx >= deltaX; dx -= step) {
                            let w = startWidth - dx;
                            let l = startLeft + dx;
                            if (w < minWidth || l < 0 || wouldCollide(lineDiv, l, startTop, w, startHeight, parseFloat(lineDiv.dataset.rotation) || 0)) {
                                maxDeltaX = dx + step;
                                break;
                            }
                            if (capToSubZone) {
                                if (capToShape === "rectangle" || capToShape === "triangle") {
                                    if (l < capToRect.left) { maxDeltaX = dx + step; break; }
                                } else if (capToShape === "circle") {
                                    let corners = [
                                        {x: l, y: startTop},
                                        {x: l + w, y: startTop},
                                        {x: l, y: startTop + startHeight},
                                        {x: l + w, y: startTop + startHeight}
                                    ];
                                    if (!corners.every(pt => ((pt.x - capToCircle.cx) ** 2 + (pt.y - capToCircle.cy) ** 2) <= capToCircle.r ** 2)) {
                                        maxDeltaX = dx + step; break;
                                    }
                                }
                            }
                            maxDeltaX = dx;
                        }
                    }
                    // Vertical
                    if (directions.includes('bottom')) {
                        for (let dy = 0; dy <= deltaY; dy += step) {
                            let h = startHeight + dy;
                            let b = startTop + h;
                            if (h < minHeight || b > canvas.offsetHeight || wouldCollide(lineDiv, startLeft, startTop, startWidth, h, parseFloat(lineDiv.dataset.rotation) || 0)) {
                                maxDeltaY = dy - step;
                                break;
                            }
                            if (capToSubZone) {
                                if (capToShape === "rectangle" || capToShape === "triangle") {
                                    if (b > capToRect.bottom) { maxDeltaY = dy - step; break; }
                                } else if (capToShape === "circle") {
                                    let corners = [
                                        {x: startLeft, y: startTop},
                                        {x: startLeft + startWidth, y: startTop},
                                        {x: startLeft, y: startTop + h},
                                        {x: startLeft + startWidth, y: startTop + h}
                                    ];
                                    if (!corners.every(pt => ((pt.x - capToCircle.cx) ** 2 + (pt.y - capToCircle.cy) ** 2) <= capToCircle.r ** 2)) {
                                        maxDeltaY = dy - step; break;
                                    }
                                }
                            }
                            maxDeltaY = dy;
                        }
                    }
                    if (directions.includes('top')) {
                        for (let dy = 0; dy >= deltaY; dy -= step) {
                            let h = startHeight - dy;
                            let t = startTop + dy;
                            if (h < minHeight || t < 0 || wouldCollide(lineDiv, startLeft, t, startWidth, h, parseFloat(lineDiv.dataset.rotation) || 0)) {
                                maxDeltaY = dy + step;
                                break;
                            }
                            if (capToSubZone) {
                                if (capToShape === "rectangle" || capToShape === "triangle") {
                                    if (t < capToRect.top) { maxDeltaY = dy + step; break; }
                                } else if (capToShape === "circle") {
                                    let corners = [
                                        {x: startLeft, y: t},
                                        {x: startLeft + startWidth, y: t},
                                        {x: startLeft, y: t + h},
                                        {x: startLeft + startWidth, y: t + h}
                                    ];
                                    if (!corners.every(pt => ((pt.x - capToCircle.cx) ** 2 + (pt.y - capToCircle.cy) ** 2) <= capToCircle.r ** 2)) {
                                        maxDeltaY = dy + step; break;
                                    }
                                }
                            }
                            maxDeltaY = dy;
                        }
                    }
                    return { maxDeltaX, maxDeltaY };
                }

                function onMouseMove(e) {
                    let deltaX = e.clientX - startX;
                    let deltaY = e.clientY - startY;
                    let { maxDeltaX, maxDeltaY } = getMaxResize(directions, deltaX, deltaY);

                    let newWidth = startWidth;
                    let newHeight = startHeight;
                    let newLeft = startLeft;
                    let newTop = startTop;

                    if (directions.includes('right')) {
                        newWidth = startWidth + maxDeltaX;
                    }
                    if (directions.includes('left')) {
                        newWidth = startWidth - maxDeltaX;
                        newLeft = startLeft + maxDeltaX;
                    }
                    if (directions.includes('bottom')) {
                        newHeight = startHeight + maxDeltaY;
                    }
                    if (directions.includes('top')) {
                        newHeight = startHeight - maxDeltaY;
                        newTop = startTop + maxDeltaY;
                    }

                    if (directions.includes('right')) {
                        lineDiv.style.width = Math.max(newWidth, minWidth) + "px";
                        // Right edge moves, left stays fixed
                    }
                    if (directions.includes('left')) {
                        const width = Math.max(newWidth, minWidth);
                        const left = startLeft + (startWidth - width);
                        lineDiv.style.width = width + "px";
                        lineDiv.style.left = left + "px";
                        // Left edge moves, right stays fixed
                    }
                    if (directions.includes('bottom')) {
                        lineDiv.style.height = Math.max(newHeight, minHeight) + "px";
                        // Bottom edge moves, top stays fixed
                    }
                    if (directions.includes('top')) {
                        const height = Math.max(newHeight, minHeight);
                        const top = startTop + (startHeight - height);
                        lineDiv.style.height = height + "px";
                        lineDiv.style.top = top + "px";
                        // Top edge moves, bottom stays fixed
                    }
                }
                function onMouseUp() {
                    document.removeEventListener("mousemove", onMouseMove);
                    document.removeEventListener("mouseup", onMouseUp);
                    setTimeout(() => { globalResizingInProgress = false; }, 50); // Small delay to prevent drag after resize
                }
                document.addEventListener("mousemove", onMouseMove);
                document.addEventListener("mouseup", onMouseUp);
            });
        }

        // Setup resize for all handles
        handles.forEach(handleInfo => {
            const handle = lineDiv.querySelector(`.resize-handle.${handleInfo.class}`);
            setupResize(handle, handleInfo.directions);
        });

        // Tooltip events
        lineDiv.addEventListener("mouseenter", () => {
            tooltip.style.display = "block";
            tooltip.textContent = lineDiv.dataset.tooltip;
        });
        lineDiv.addEventListener("mousemove", (e) => {
            tooltip.style.display = "block";
            tooltip.textContent = lineDiv.dataset.tooltip;
            // Position tooltip directly below the cursor, centered
            const tooltipWidth = tooltip.offsetWidth || 120;
            tooltip.style.left = (e.pageX - tooltipWidth / 2) + "px";
            tooltip.style.top = (e.pageY + 22) + "px";
        });
        lineDiv.addEventListener("mouseleave", () => {
            tooltip.style.display = "none";
        });


        // Drag logic with snap-to-subzone
        lineDiv.addEventListener("mousedown", (e) => {
            if (e.target.classList.contains('resize-handle') || globalResizingInProgress) {
                return;
            }
            const rect = lineDiv.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;
            // Track last valid position (either fully inside a sub-zone or fully outside all sub-zones)
            let lastValidX = parseInt(lineDiv.style.left) || 0;
            let lastValidY = parseInt(lineDiv.style.top) || 0;
            function move(ev) {
                let newX = ev.clientX - canvasRect.left - offsetX;
                let newY = ev.clientY - canvasRect.top - offsetY;
                const itemWidth = lineDiv.offsetWidth;
                const itemHeight = lineDiv.offsetHeight;
                const canvasWidth = canvas.offsetWidth;
                const canvasHeight = canvas.offsetHeight;
                newX = Math.max(0, Math.min(newX, canvasWidth - itemWidth));
                newY = Math.max(0, Math.min(newY, canvasHeight - itemHeight));
                // Check if fully inside any sub-zone or fully outside all sub-zones
                let fullyInside = false;
                let fullyOutside = true;
                const subZones = Array.from(canvas.querySelectorAll('.sub-zone'));
                const lineRect = {
                    left: newX,
                    top: newY,
                    right: newX + itemWidth,
                    bottom: newY + itemHeight
                };
                for (const sz of subZones) {
                    const szX = sz.offsetLeft;
                    const szY = sz.offsetTop;
                    const szW = sz.offsetWidth;
                    const szH = sz.offsetHeight;
                    if (
                        lineRect.left >= szX &&
                        lineRect.top >= szY &&
                        lineRect.right <= szX + szW &&
                        lineRect.bottom <= szY + szH
                    ) {
                        fullyInside = true;
                        fullyOutside = false;
                        break;
                    }
                    // If any overlap, not fully outside
                    if (
                        lineRect.right > szX &&
                        lineRect.left < szX + szW &&
                        lineRect.bottom > szY &&
                        lineRect.top < szY + szH
                    ) {
                        fullyOutside = false;
                    }
                }
                if (!wouldCollide(lineDiv, newX, newY, itemWidth, itemHeight, parseFloat(lineDiv.dataset.rotation) || 0) && (fullyInside || fullyOutside)) {
                    lineDiv.classList.remove('colliding');
                    lineDiv.classList.remove('colliding-anim');
                    lineDiv.style.left = newX + "px";
                    lineDiv.style.top = newY + "px";
                    lastValidX = newX;
                    lastValidY = newY;
                } else {
                    if (!lineDiv.classList.contains('colliding')) {
                        lineDiv.classList.add('colliding-anim');
                        lineDiv.classList.add('colliding');
                        setTimeout(() => {
                            lineDiv.classList.remove('colliding');
                        }, 370);
                    }
                }
            }
            function stop(ev) {
                document.removeEventListener("mousemove", move);
                document.removeEventListener("mouseup", stop);
                // On drop, if not fully inside any sub-zone and not fully outside all sub-zones, snap back to last valid position
                const itemWidth = lineDiv.offsetWidth;
                const itemHeight = lineDiv.offsetHeight;
                const newX = parseInt(lineDiv.style.left) || 0;
                const newY = parseInt(lineDiv.style.top) || 0;
                let fullyInside = false;
                let fullyOutside = true;
                const subZones = Array.from(canvas.querySelectorAll('.sub-zone'));
                const lineRect = {
                    left: newX,
                    top: newY,
                    right: newX + itemWidth,
                    bottom: newY + itemHeight
                };
                for (const sz of subZones) {
                    const szX = sz.offsetLeft;
                    const szY = sz.offsetTop;
                    const szW = sz.offsetWidth;
                    const szH = sz.offsetHeight;
                    if (
                        lineRect.left >= szX &&
                        lineRect.top >= szY &&
                        lineRect.right <= szX + szW &&
                        lineRect.bottom <= szY + szH
                    ) {
                        fullyInside = true;
                        fullyOutside = false;
                        break;
                    }
                    // If any overlap, not fully outside
                    if (
                        lineRect.right > szX &&
                        lineRect.left < szX + szW &&
                        lineRect.bottom > szY &&
                        lineRect.top < szY + szH
                    ) {
                        fullyOutside = false;
                    }
                }
                if (!(fullyInside || fullyOutside)) {
                    lineDiv.style.left = lastValidX + "px";
                    lineDiv.style.top = lastValidY + "px";
                } else {
                    lastValidX = newX;
                    lastValidY = newY;
                }
            }
            document.addEventListener("mousemove", move);
            document.addEventListener("mouseup", stop);
        });

        canvas.appendChild(lineDiv);
    });
}); 