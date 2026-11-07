/* ============================================================
   PIXELTOLS — Image Resizer (tool-specific JS)
   Loaded on: tools/image-resizer.html
   ============================================================ */
(function () {
  "use strict";
  const MAX_FILE = 50 * 1024 * 1024;

  const uploadZone = document.getElementById("upload-zone");
  const fileInput = document.getElementById("file-input");
  const previewGrid = document.getElementById("preview-grid");
  const clearAll = document.getElementById("clear-all");
  const downloadAll = document.getElementById("download-all");

  let activeFiles = [];
  let aspectLocked = true;

  function handleFiles(fileList) {
    for (const file of fileList) {
      if (!file.type.startsWith("image/")) {
        showToast(`"${file.name}" is not an image. Please upload a JPG, PNG, or WebP file.`, "error");
        continue;
      }
      if (file.size > MAX_FILE) {
        showToast(`"${file.name}" is ${formatBytes(file.size)} — our limit is 50 MB.`, "error");
        continue;
      }
      activeFiles.push({ file, width: 0, height: 0, result: null, ratioLocked: true, selected: true });
    }
    renderFiles();
  }

  uploadZone.addEventListener("click", () => fileInput.click());
  uploadZone.addEventListener("dragover", (e) => { e.preventDefault(); uploadZone.classList.add("drag-over"); });
  uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("drag-over"));
  uploadZone.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadZone.classList.remove("drag-over");
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener("change", () => { if (fileInput.files.length) handleFiles(fileInput.files); fileInput.value = ""; });
  document.addEventListener("paste", (e) => {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (const item of items) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file && file.size <= MAX_FILE) {
          activeFiles.push({ file, width: 0, height: 0, result: null, ratioLocked: true, selected: true });
          renderFiles();
        } else if (file) {
          showToast(`"${file.name}" is too large (${formatBytes(file.size)}). Max 50 MB.`, "error");
        }
      }
    }
  });

  function renderFiles() {
    previewGrid.innerHTML = "";
    if (activeFiles.length === 0) {
      uploadZone.classList.remove("hidden");
      uploadZone.querySelector("p").textContent = "Drop an image here or click to browse";
      return;
    }
    uploadZone.classList.add("hidden");
    for (const entry of activeFiles) {
      const card = document.createElement("div");
      card.className = "preview-card";
      const idx = activeFiles.indexOf(entry);
      card.dataset.index = idx;

      const origLabel = document.createElement("div"); origLabel.className = "label"; origLabel.textContent = "Original";
      const origImg = document.createElement("img"); origImg.className = "preview-img"; origImg.alt = "Original preview";
      const origSize = document.createElement("div"); origSize.className = "size-field"; origSize.innerHTML = `<span class="label">Size</span><span class="value" id="orig-${idx}"></span>`;
      card.appendChild(origLabel); card.appendChild(origImg); card.appendChild(origSize);

      const compLabel = document.createElement("div"); compLabel.className = "label"; compLabel.textContent = "Resized";
      const compCanvas = document.createElement("canvas"); compCanvas.className = "preview-canvas"; compCanvas.style.display = "none";
      const compSize = document.createElement("div"); compSize.className = "size-field"; compSize.innerHTML = `<span class="label">Size</span><span class="value" id="comp-${idx}"></span>`;
      card.appendChild(compLabel); card.appendChild(compCanvas); card.appendChild(compSize);

      const controls = document.createElement("div");
      controls.className = "tool-tools";
      controls.innerHTML = `
                <div class="field-wrap"><label style="display:inline-flex;align-items:center;gap:var(--space-xs)">Width (px) <input type="number" min="1" step="1" value="800" id="w-${idx}"></label></div>
                <div class="field-wrap"><label style="display:inline-flex;align-items:center;gap:var(--space-xs)">Height (px) <input type="number" min="1" step="1" value="600" id="h-${idx}"></label></div>
                <label style="flex:1;display:inline-flex;align-items:center;gap:var(--space-xs)">Ratio locked <input type="checkbox" ${aspectLocked ? "checked" : ""} id="lock-${idx}"></label>
                <button class="btn btn-sm btn-outline" data-idx="${idx}">Resize</button>
                <input type="checkbox" id="sel-${idx}">
            `;
      card.appendChild(controls);
      previewGrid.appendChild(card);

      const idxC = activeFiles.indexOf(entry);
      card.querySelector(`[data-idx="${idxC}"]`).addEventListener("click", () => { if (!entry.result) resizeFile(entry); });
      card.querySelector(`#lock-${idxC}`).addEventListener("change", (e) => {
        entry.ratioLocked = e.target.checked;
        aspectLocked = e.target.checked;
      });
      card.querySelector(`#w-${idxC}`).addEventListener("input", (e) => { entry.width = parseInt(e.target.value, 10); });
      card.querySelector(`#h-${idxC}`).addEventListener("input", (e) => { entry.height = parseInt(e.target.value, 10); });
      card.querySelector(`#sel-${idxC}`).addEventListener("change", (e) => { entry.selected = e.target.checked; });
    }
    renderAllPreviews();
  }

  function resizeFile(entry) {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        let w = entry.width || img.width;
        let h = entry.height || img.height;
        if (entry.ratioLocked) {
          const ratio = img.width / img.height;
          if (w / h > ratio) { w = Math.round(h * ratio); }
          else { h = Math.round(w / ratio); }
        }
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        try {
          const blob = dataURItoBlob(canvas.toDataURL(entry.file.type === "image/webp" ? "image/webp" : "image/png"), entry.file.type);
          entry.result = blob;
          entry.width = w; entry.height = h;
          activeFiles[activeFiles.indexOf(entry)] = entry;
          renderPreview(entry, compCanvas, compSize);
          showToast(`"${entry.file.name}" resized to ${w} &times; ${h}.`, "success");
        } catch (err) {
          showToast(`Could not resize "${entry.file.name}".`, "error");
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(entry.file);
  }

  function renderPreview(entry, canvas, sizeEl) {
    sizeEl.textContent = formatBytes(entry.originalSize) + " → " + formatBytes(entry.result.size);
    entry.tmpCanvas = canvas;
  }

  function renderAllPreviews() {
    for (const entry of activeFiles) {
      if (entry.result && !entry.tmpCanvas) {
        resizeFile(entry);
      }
    }
  }

  function dataURItoBlob(dataURI, type) {
    const byteString = atob(dataURI.split(",")[1]);
    const mime = dataURI.split(",")[0].split(":")[1].split(";")[0];
    const ab = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) ab[i] = byteString.charCodeAt(i);
    return new Blob([ab], { type: mime || type });
  }

  function formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024; const sizes = ["B","KB","MB","GB"];
    const i = Math.floor(Math.log(bytes)/Math.log(k));
    return `${parseFloat((bytes/Math.pow(k,i)).toFixed(1))} ${sizes[i]}`;
  }

  clearAll.addEventListener("click", () => {
    activeFiles.forEach((f) => { if (f.result && f.tmpCanvas) URL.revokeObjectURL(f.tmpCanvas); });
    activeFiles = [];
    renderFiles();
    showToast("Cleared all images.", "info");
  });

  downloadAll.addEventListener("click", () => {
    if (!activeFiles.length) return;
    const zip = new JSZip();
    let count = 0;
    for (const entry of activeFiles) {
      if (entry.selected && entry.result) {
        const base = entry.file.name.replace(/\.[^.]+$/, "") + "_resized";
        zip.file(base + (entry.file.type === "image/png" ? ".png" : ".jpg"), entry.result);
        count++;
      }
    }
    if (count === 0) { showToast("No files selected for download.", "info"); return; }
    zip.generateAsync({ type: "blob" }).then((blob) => {
      downloadBlob(blob, "pixeltools-resized.zip", "application/zip");
      showToast(`Downloaded ${count} file(s) as a ZIP.`, "success");
    });
  });

  window.__pt = window.__pt || {};
  window.__pt.resizer = { activeFiles, renderFiles };
})();
