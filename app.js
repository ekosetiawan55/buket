const grid = document.getElementById("grid");
const preview = document.getElementById("preview");
const content = document.getElementById("preview-content");
const searchInput = document.getElementById("search");

let files = [];
let viewMode = "grid";

async function loadFiles() {
  const res = await fetch(`${API_BASE}/list-files`);
  files = await res.json();
  render();
}

function render() {
  grid.className = viewMode;
  grid.innerHTML = "";

  const keyword = searchInput.value.toLowerCase();

  files
    .filter(f => f.fileName.toLowerCase().includes(keyword))
    .forEach(file => {
      const div = document.createElement("div");
      div.className = "file";

      div.innerHTML = `
        <span>${file.fileName}</span>
        <div>
          <button onclick="event.stopPropagation();renameFile('${file.fileName}')">✏️</button>
          <button onclick="event.stopPropagation();deleteFile('${file.fileName}')">🗑️</button>
        </div>
      `;

      div.onclick = () => openPreview(file.fileName);
      grid.appendChild(div);
    });
}

function getUrl(name) {
  return BUCKET_URL + name;
}

function openPreview(name) {
  const url = getUrl(name);
  preview.style.display = "flex";
  content.innerHTML = "";

  if (name.match(/\.(jpg|png|jpeg|webp)$/)) {
    content.innerHTML = `<img src="${url}">`;
  } else if (name.match(/\.(mp4|webm)$/)) {
    content.innerHTML = `<video src="${url}" controls autoplay></video>`;
  } else if (name.match(/\.pdf$/)) {
    content.innerHTML = `<iframe src="${url}"></iframe>`;
  } else {
    window.open(url);
  }
}

preview.onclick = () => preview.style.display = "none";

async function uploadFile(file) {
  const progress = document.getElementById("progress");

  const res = await fetch(`${API_BASE}/upload-url`);
  const data = await res.json();

  const xhr = new XMLHttpRequest();
  xhr.open("POST", data.uploadUrl);

  xhr.setRequestHeader("Authorization", data.authorizationToken);
  xhr.setRequestHeader("X-Bz-File-Name", encodeURIComponent(file.name));
  xhr.setRequestHeader("Content-Type", "b2/x-auto");
  xhr.setRequestHeader("X-Bz-Content-Sha1", "do_not_verify");

  xhr.upload.onprogress = e => {
    progress.style.width = (e.loaded / e.total) * 100 + "%";
  };

  xhr.onload = () => {
    progress.style.width = "0%";
    loadFiles();
  };

  xhr.send(file);
}

document.getElementById("upload").onchange = e => {
  uploadFile(e.target.files[0]);
};

document.getElementById("dropzone").ondrop = e => {
  e.preventDefault();
  uploadFile(e.dataTransfer.files[0]);
};

document.getElementById("dropzone").ondragover = e => e.preventDefault();

function toggleView() {
  viewMode = viewMode === "grid" ? "list" : "grid";
  render();
}

async function deleteFile(name) {
  if (!confirm("Hapus file?")) return;

  await fetch(`${API_BASE}/delete-file`, {
    method: "POST",
    body: JSON.stringify({ fileName: name })
  });

  loadFiles();
}

async function renameFile(oldName) {
  const newName = prompt("Nama baru:", oldName);
  if (!newName) return;

  await fetch(`${API_BASE}/rename-file`, {
    method: "POST",
    body: JSON.stringify({ oldName, newName })
  });

  loadFiles();
}

searchInput.oninput = render;

loadFiles();
