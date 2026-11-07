/* ============================================================
   PIXELTOLS — JPG/PNG Converter (tool-specific JS)
   Loaded on: tools/jpg-to-png.html
   ============================================================ */
(function () {
  "use strict";
  const MAX_FILE = 50 * 1024 * 1024;

  const uploadZone = document.getElementById("upload-zone");
  const fileInput = document.getElementById("file-input");
  const previewGrid = document.getElementById("preview-grid");
  const clearAll = document.getElementById("clear-all");
  const downloadAll = document.getElementById("download-all");
  const direction = document.getElementById("direction");

  let activeFiles = [];
  let toPng = true;

  function handleFiles(fileList) {
    for (const file of fileList) {
      if (!file.type.startsWith("image/")) { showToast(`"${file.name}" is not an image.`, "error"); continue; }
      if (file.size > MAX_FILE) { showToast(`"${file.name}" is ${formatBytes(file.size)} — max 50 MB.`, "error"); continue; }
      activeFiles.push({ file, outputType: toPng ? "png" : "jpg", result: null, selected: true });
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
          activeFiles.push({ file, outputType: toPng ? "png" : "jpg", result: null, selected: true });
          renderFiles();
        } else if (file) { showToast(`"${file.name}" is too large.`, "error"); }
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

      const compLabel = document.createElement("div"); compLabel.className = "label"; compLabel.textContent = toPng ? "PNG" : "JPG";
      const compCanvas = document.createElement("canvas"); compCanvas.className = "preview-canvas"; compCanvas.style.display = "none";
      const compSize = document.createElement("div"); compSize.className = "size-field"; compSize.innerHTML = `<span class="label">Size</span><span class="value" id="comp-${idx}"></span>`;
      card.appendChild(compLabel); card.appendChild(compCanvas); card.appendChild(compSize);

      const controls = document.createElement("div");
      controls.className = "tool-tools";
      controls.innerHTML = `
                <label style="flex:1">Direction <select id="dir-${idx}"><option value="png" ${toPng ? "selected" : ""}>PNG (lossless)</option><option value="jpg" ${!toPng ? "selected" : ""}>JPG (smaller)</option></select></label>
                <button class="btn btn-sm btn-outline" data-idx="${idx}">Convert</button>
                <input type="checkbox" id="sel-${idx}">
            `;
      card.appendChild(controls);
      previewGrid.appendChild(card);

      const idxC = activeFiles.indexOf(entry);
      card.querySelector(`[data-idx="${idxC}"]`).addEventListener("click", () => { if (!entry.result) convertFile(entry); });
      card.querySelector(`#dir-${idxC}`).addEventListener("change", (e) => {
        toPng = e.target.value === "png";
        entry.outputType = e.target.value;
        if (entry.result) renderPreview(entry, compCanvas, compSize);
      });
      card.querySelector(`#sel-${idxC}`).addEventListener("change", (e) => { entry.selected = e.target.checked; });
    }
    renderAllPreviews();
  }

  function convertFile(entry) {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { alpha: true });
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        try {
          let mime = "image/png";
          if (toPng === false) {
            // Fill transparent areas with white before encoding to JPG
            const temp = document.createElement("canvas");
            temp.width = canvas.width; temp.height = canvas.height;
            const tctx = temp.getContext("2d");
            tctx.fillStyle = "#ffffff";
            tctx.fillRect(0, 0, temp.width, temp.height);
            tctx.drawImage(canvas, 0, 0);
            canvas = temp;
            mime = "image/jpeg";
          }
          const blob = dataURItoBlob(canvas.toDataURL(mime, 0.95), mime);
          entry.result = blob;
          entry.outputType = toPng ? "png" : "jpg";
          activeFiles[activeFiles.indexOf(entry)] = entry;
          renderPreview(entry, compCanvas, compSize);
          showToast(`"${entry.file.name}" converted to ${toPng ? "PNG" : "JPG"}.`, "success");
        } catch (err) {
          showToast(`Could not convert "${entry.file.name}".`, "error");
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(entry.file);
  }

  function renderPreview(entry, canvas, sizeEl) {
    sizeEl.textContent = formatBytes(entry.originalSize) + " → " + formatBytes(entry.result.size);
  }

  function renderAllPreviews() {
    for (const entry of activeFiles) {
      if (entry.result) { convertFile(entry); }
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
    activeFiles.forEach((f) => f.result && URL.revokeObjectURL(f.result));
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
        const base = entry.file.name.replace(/\.[^.]+$/, "") + "_converted";
        zip.file(base + "." + (entry.outputType || (toPng ? "png" : "jpg")), entry.result);
        count++;
      }
    }
    if (count === 0) { showToast("No files selected for download.", "info"); return; }
    zip.generateAsync({ type: "blob" }).then((blob) => {
      downloadBlob(blob, "pixeltools-conversions.zip", "application/zip");
      showToast(`Downloaded ${count} file(s) as a ZIP.`, "success");
    });
  });

  window.__pt = window.__pt || {};
  window.__pt.converter = { activeFiles, renderFiles };
})();
