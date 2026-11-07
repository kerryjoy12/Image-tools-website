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
  const preview = document.getElementById("cropper-preview");
  const toolArea = document.getElementById("cropper-tool-area");
  const aspectRatioWrap = document.getElementById("aspect-ratio-wrap");
  const aspectRatioInput = document.getElementById("aspect-ratio");
  const aspectRatioDisplay = document.getElementById("aspect-ratio-display");
  const aspectFree = document.getElementById("aspect-free");
  const clearAll = document.getElementById("clear-all");
  const downloadCropped = document.getElementById("download-cropped");

  let activeFiles = [];
  let cropper = null;

  function handleFiles(fileList) {
    for (const file of fileList) {
      if (!file.type.startsWith("image/")) { showToast(`"${file.name}" is not an image.`, "error"); continue; }
      if (file.size > MAX_FILE) { showToast(`"${file.name}" is ${formatBytes(file.size)} — max 50 MB.`, "error"); continue; }
      activeFiles.push({ file, result: null, selected: true, aspect: getAspectValue() });
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
          activeFiles.push({ file, result: null, selected: true, aspect: getAspectValue() });
          renderFiles();
        } else if (file) { showToast(`"${file.name}" is too large.`, "error"); }
      }
    }
  });

  function getAspectValue() {
    return aspectRatioInput.value === "" ? null : parseFloat(aspectRatioInput.value);
  }

  function renderFiles() {
    preview.innerHTML = "";
    toolArea.innerHTML = "";
    clearAll.classList.add("hidden");
    downloadCropped.classList.add("hidden");

    if (activeFiles.length === 0) {
      uploadZone.classList.remove("hidden");
      uploadZone.querySelector("p").textContent = "Drop an image here or click to browse";
      return;
    }
    uploadZone.classList.add("hidden");
    clearAll.classList.remove("hidden");
    downloadCropped.classList.remove("hidden");

    for (const entry of activeFiles) {
      const btn = document.createElement("button");
      btn.className = "btn btn-sm btn-outline";
      btn.textContent = "✕";
      btn.addEventListener("click", () => {
        const i = activeFiles.indexOf(entry);
        if (i >= 0) { activeFiles.splice(i, 1); renderFiles(); }
      });
      toolArea.appendChild(btn);
    }

    const num = activeFiles.length;
    toolArea.insertAdjacentHTML("beforeend",
      `<span class="tool-area-label">${num} image${num !== 1 ? "s" : ""} loaded</span>`);
    if (num > 1) {
      toolArea.insertAdjacentHTML("beforeend", `<button class="btn btn-sm btn-outline" id="undo-crops">↩ Undo last crop</button>`);
      document.getElementById("undo-crops").addEventListener("click", undoLastCrop);
    }
  }

  function initCropper(img, box) {
    // Destroy any existing cropper before switching images
    if (cropper) { cropper.destroy(); cropper = null; }
    try {
      cropper = new Cropper(box, {
        aspectRatio: getAspectValue(),
        viewMode: 1,
        background: true,
        autoCropArea: 1,
        ready: () => {
          setTimeout(() => autoCrop(), 60);
        },
        crop: () => updateAspectDisplay()
      });
      updateAspectDisplay();
    } catch (err) {
      showToast("Could not initialise the cropper. Try a different image.", "error");
    }
  }

  function autoCrop() {
    if (!cropper) return;
    cropper.autoCrop();
  }

  function undoLastCrop() {
    if (!cropper) return;
    cropper.clear();
    showToast("Undo — cropped area cleared.", "info");
  }

  aspectRatioInput.addEventListener("input", () => {
    aspectRatioDisplay.textContent = aspectRatioInput.value || "Free";
    if (cropper) { cropper.destroy(); cropper = null; }
    renderFiles();
  });
  aspectFree.addEventListener("change", () => {
    aspectRatioInput.value = "";
    aspectRatioDisplay.textContent = "Free";
    if (cropper) { cropper.destroy(); cropper = null; }
    renderFiles();
  });

  preview.addEventListener("click", () => {
    const box = document.getElementById("cropper-box");
    if (box && cropper) { cropper.crop(); showToast("Cropped area marked.", "info"); }
  });

  downloadCropped.addEventListener("click", () => {
    if (!cropper) { showToast("Load an image first.", "info"); return; }
    const canvas = cropper.getCroppedCanvas();
    if (!canvas) { showToast("No crop selected — try again.", "info"); return; }
    const a = document.createElement("a");
    a.download = "cropped-" + activeFiles.find(f => f.result === null).file.name.replace(/\.[^.]+$/, "") + ".jpg";
    a.href = canvas.toDataURL("image/jpeg", 0.95);
    a.click();
    showToast("Cropped image downloaded.", "success");
  });

  window.__pt = window.__pt || {};
  window.__pt.cropper = { activeFiles, renderFiles };
})();
