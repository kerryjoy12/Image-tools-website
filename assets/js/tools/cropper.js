/* ============================================================
   PIXELTOLS — Image Cropper (tool-specific JS)
   Loaded on: tools/image-cropper.html
   Requires: cropperjs (cdnjs)
   ============================================================ */
(function () {
  "use strict";
  const MAX_FILE = 50 * 1024 * 1024;

  const uploadZone = document.getElementById("upload-zone");
  const fileInput = document.getElementById("file-input");
  const previewGrid = document.getElementById("preview-grid");
  const clearAll = document.getElementById("clear-all");
  const downloadCropped = document.getElementById("download-cropped");
  const cropperBox = document.getElementById("cropper-box");

  let activeFiles = [];
  let cropper = null;

  function handleFiles(fileList) {
    for (const file of fileList) {
      if (!file.type.startsWith("image/")) {
        showToast(`"${file.name}" is not an image.`, "error");
        continue;
      }
      if (file.size > MAX_FILE) {
        showToast(`"${file.name}" is ${formatBytes(file.size)} — max 50 MB.`, "error");
        continue;
      }
      activeFiles.push({ file, result: null, selected: true });
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
  fileInput.addEventListener("change", () => { if (fileInput.files.length) handleFiles(fileInput.files); fileInput.value = ""; });
  document.addEventListener("paste", (e) => {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (const item of items) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file && file.size <= MAX_FILE) {
          activeFiles.push({ file, result: null, selected: true });
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
      cropperBox.innerHTML = "";
      downloadCropped.classList.add("hidden");
      clearAll.classList.add("hidden");
      return;
    }
    uploadZone.classList.add("hidden");
    clearAll.classList.remove("hidden");
    downloadCropped.classList.remove("hidden");

    for (const entry of activeFiles) {
      const card = document.createElement("div");
      card.className = "preview-card";
      card.style.textAlign = "center";
      card.style.overflow = "hidden";
      card.style.border = "1px solid var(--color-border)";
      card.style.borderRadius = "var(--radius)";

      const origLabel = document.createElement("div");
      origLabel.className = "label";
      origLabel.textContent = "Original";
      const origImg = document.createElement("img");
      origImg.className = "preview-img";
      origImg.alt = "Original preview of " + entry.file.name;
      const origSize = document.createElement("div");
      origSize.className = "size-field";
      origSize.innerHTML = '<span class="label">Size</span><span class="value" id="orig-' + activeFiles.indexOf(entry) + '"></span>';

      card.appendChild(origLabel);
      card.appendChild(origImg);
      card.appendChild(origSize);

      const controls = document.createElement("div");
      controls.className = "tool-tools";
      controls.style.padding = "var(--space-md)";
      controls.style.display = "flex";
      controls.style.alignItems = "center";
      controls.style.gap = "var(--space-sm)";
      controls.innerHTML =
        '<button class="btn btn-sm btn-outline" id="crop-' + activeFiles.indexOf(entry) + '">Crop & Download</button>' +
        '<input type="checkbox" id="sel-' + activeFiles.indexOf(entry) + '">';
      card.appendChild(controls);
      previewGrid.appendChild(card);

      const idx = activeFiles.indexOf(entry);
      document.getElementById("crop-" + idx).addEventListener("click", () => { cropAndDownload(entry); });
      document.getElementById("sel-" + idx).addEventListener("change", (e) => { entry.selected = e.target.checked; });
    }
    renderAllPreviews();
  }

  function cropAndDownload(entry) {
    if (!cropper) {
      showToast("Load an image first.", "info");
      return;
    }
    const canvas = cropper.getCroppedCanvas();
    if (!canvas) { showToast("No crop selected — try again.", "info"); return; }
    const a = document.createElement("a");
    a.download = "cropped-" + entry.file.name.replace(/\.[^.]+$/, "") + ".jpg";
    a.href = canvas.toDataURL("image/jpeg", 0.95);
    a.click();
    showToast("Cropped image downloaded.", "success");
  }

  function newCropper(imgEl) {
    if (cropper) { cropper.destroy(); cropper = null; }
    try {
      cropper = new Cropper(imgEl, {
        aspectRatio: 1,
        viewMode: 1,
        background: true,
        autoCropArea: 1,
        minContainerWidth: 200,
        minContainerHeight: 200,
        ready: () => {
          setTimeout(() => {
            if (cropper) { cropper.autoCrop(); }
          }, 150);
        },
        crop: () => {}
      });
    } catch (err) {
      showToast("Could not initialise the cropper. Try a different image.", "error");
    }
  }

  function renderPreview(entry, imgEl, sizeEl) {
    sizeEl.textContent = formatBytes(entry.originalSize) + " → " + formatBytes(entry.result.size);
  }

  function renderAllPreviews() {
    for (const entry of activeFiles) {
      if (entry.result) {
        const idx = activeFiles.indexOf(entry);
        const card = previewGrid.querySelector('.preview-card[data-idx="' + idx + '"]');
        if (!card) continue;
        const origImg = card.querySelector(".preview-img");
        const sizeEl = card.querySelector(".size-field .value");
        if (cropper) { cropper.destroy(); cropper = null; }
        cropper = new Cropper(origImg, {
          aspectRatio: 1,
          viewMode: 1,
          background: true,
          autoCropArea: 1,
          minContainerWidth: 200,
          minContainerHeight: 200,
          ready: () => {
            setTimeout(() => {
              if (cropper) { cropper.autoCrop(); }
            }, 150);
          },
          crop: () => {}
        });
        if (entry.result) {
          const canvas = cropper.getCroppedCanvas();
          if (canvas) {
            const blob = dataURItoBlob(canvas.toDataURL("image/jpeg", 0.95), "image/jpeg");
            entry.result = blob;
            activeFiles[activeFiles.indexOf(entry)] = entry;
            renderPreview(entry, origImg, sizeEl);
          }
        }
      }
    }
  }

  clearAll.addEventListener("click", () => {
    activeFiles.forEach((f) => { if (f.result) URL.revokeObjectURL(f.result); });
    activeFiles = [];
    renderFiles();
    showToast("Cleared all images.", "info");
  });

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

  window.__pt = window.__pt || {};
  window.__pt.cropper = { activeFiles, renderFiles };
})();
