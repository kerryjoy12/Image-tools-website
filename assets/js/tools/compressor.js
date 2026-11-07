/* ============================================================
   PIXELTOLS — Image Compressor (tool-specific JS)
   Loaded on: tools/image-compressor.html
   ============================================================ */
(function () {
  "use strict";
  const MAX_FILE = 50 * 1024 * 1024; // 50 MB

  const uploadZone = document.getElementById("upload-zone");
  const fileInput = document.getElementById("file-input");
  const previewGrid = document.getElementById("preview-grid");
  const clearAll = document.getElementById("clear-all");
  const downloadAll = document.getElementById("download-all");
  const qualitySlider = document.getElementById("quality");
  const previewQuality = document.getElementById("preview-quality");

  // State: files currently being processed
  let activeFiles = [];

  // ---- Upload handlers ----
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
      activeFiles.push({ file, quality: 82, result: null });
    }
    renderFiles();
  }

  uploadZone.addEventListener("click", () => fileInput.click());
  uploadZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadZone.classList.add("drag-over");
  });
  uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("drag-over"));
  uploadZone.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadZone.classList.remove("drag-over");
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length) handleFiles(fileInput.files);
    fileInput.value = "";
  });
  document.addEventListener("paste", (e) => {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (const item of items) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file && file.size <= MAX_FILE) {
          activeFiles.push({ file, quality: 82, result: null });
          renderFiles();
        } else if (file) {
          showToast(`"${file.name}" is too large (${formatBytes(file.size)}). Max 50 MB.`, "error");
        }
      }
    }
  });

  // ---- Rendering ----
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
      card.dataset.index = activeFiles.indexOf(entry);

      const origLabel = document.createElement("div");
      origLabel.className = "label";
      origLabel.textContent = "Original";
      const origImg = document.createElement("img");
      origImg.className = "preview-img";
      origImg.alt = "Original preview of " + entry.file.name;
      const origSize = document.createElement("div");
      origSize.className = "size-field";
      origSize.innerHTML = `<span class="label">Size</span><span class="value" id="orig-${activeFiles.indexOf(entry)}"></span>`;

      card.appendChild(origLabel);
      card.appendChild(origImg);
      card.appendChild(origSize);

      const compLabel = document.createElement("div");
      compLabel.className = "label";
      compLabel.textContent = "Compressed";
      const compCanvas = document.createElement("canvas");
      compCanvas.className = "preview-canvas";
      compCanvas.style.display = "none";
      compCanvas.width = entry.file.width || 800;
      compCanvas.height = entry.file.height || 600;
      const compSize = document.createElement("div");
      compSize.className = "size-field";
      compSize.innerHTML = `<span class="label">Size</span><span class="value" id="comp-${activeFiles.indexOf(entry)}"></span>`;

      card.appendChild(compLabel);
      card.appendChild(compCanvas);
      card.appendChild(compSize);

      const controls = document.createElement("div");
      controls.className = "tool-tools";
      controls.innerHTML = `
                <label style="flex:1">Quality <input type="range" min="10" max="95" step="1" value="${entry.quality}" id="q-${activeFiles.indexOf(entry)}"> <span id="val-${activeFiles.indexOf(entry)}">${entry.quality}</span></label>
                <button class="btn btn-sm btn-outline" data-idx="${activeFiles.indexOf(entry)}">Compress</button>
                <input type="checkbox" id="sel-${activeFiles.indexOf(entry)}">
            `;
      card.appendChild(controls);
      previewGrid.appendChild(card);

      const idx = activeFiles.indexOf(entry);
      card.querySelector(`[data-idx="${idx}"]`).addEventListener("click", () => {
        if (!entry.result) processFile(entry);
      });
      card.querySelector(`#q-${idx}`).addEventListener("input", (e) => {
        entry.quality = parseInt(e.target.value, 10);
        previewQuality.textContent = entry.quality;
        if (entry.result) renderPreview(entry, compCanvas, compSize);
      });
      card.querySelector(`#sel-${idx}`).addEventListener("change", (e) => {
        entry.selected = e.target.checked;
      });
    }
    renderAllPreviews();
  }

  // ---- Processing ----
  function processFile(entry) {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d", { alpha: entry.file.type === "image/png" });
          const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const quality = entry.quality / 100;
          let type = entry.file.type;
          // PNG output stays PNG; WebP stays WebP; JPG goes to JPG
          let dataUrl;
          if (type === "image/webp") {
            dataUrl = canvas.toDataURL("image/webp", quality);
          } else if (type === "image/png") {
            dataUrl = canvas.toDataURL("image/png");
          } else {
            dataUrl = canvas.toDataURL("image/jpeg", quality);
          }
          const blob = dataURItoBlob(dataUrl, entry.file.type);
          const saved = { ...entry, result: blob, originalSize: entry.file.size };
          activeFiles[activeFiles.indexOf(entry)] = saved;
          renderPreview(saved, compCanvas, compSize);
          showToast(`"${entry.file.name}" compressed successfully.`, "success");
        } catch (err) {
          showToast(`Could not process "${entry.file.name}". The file may be corrupt.`, "error");
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(entry.file);
  }

  function renderPreview(entry, canvas, sizeEl) {
    const idx = activeFiles.indexOf(entry);
    sizeEl.textContent = formatBytes(entry.originalSize) + " → " + formatBytes(entry.result.size);
    // Store the processed canvas image for later download
    entry.tmpCanvas = canvas;
  }

  function renderAllPreviews() {
    for (const entry of activeFiles) {
      if (entry.result) {
        // Re-process if needed
        if (!entry.tmpCanvas) {
          processFile(entry);
        }
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
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
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
        const base = entry.file.name.replace(/\.[^.]+$/, "") + "_compressed";
        zip.file(base + (entry.file.type === "image/png" ? ".png" : ".jpg"), entry.result);
        count++;
      }
    }
    if (count === 0) { showToast("No files selected for download.", "info"); return; }
    zip.generateAsync({ type: "blob" }).then((blob) => {
      downloadBlob(blob, "pixeltools-compressed.zip", "application/zip");
      showToast(`Downloaded ${count} file(s) as a ZIP.`, "success");
    });
  });

  // Expose internals for the generic handlers
  window.__pt = window.__pt || {};
  window.__pt.compressor = { activeFiles, renderFiles };
})();
