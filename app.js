const grid = document.getElementById("grid");
const preview = document.getElementById("preview");
const previewImg = document.getElementById("preview-img");

let files = [];

async function loadFiles() {
    const res = await fetch(`${API_BASE}/list-files`);
    files = await res.json();
    render();
}

function render() {
    grid.innerHTML = "";

    files.forEach(file => {
        const div = document.createElement("div");
        div.className = "file";

        const url = getFileUrl(file.fileName);

        div.innerHTML = `
        <div>📄</div>
        <small>${file.fileName}</small>
        `;

        div.onclick = () => openPreview(url);

        grid.appendChild(div);
    });
}

function getFileUrl(name) {
    return `https://f000.backblazeb2.com/file/YOUR_BUCKET/${name}`;
}

function openPreview(url) {
    preview.style.display = "flex";

    if (url.match(/\.(jpg|png|jpeg|webp)$/)) {
        previewImg.src = url;
        previewImg.style.display = "block";
    } else {
        window.open(url, "_blank");
    }
}

preview.onclick = () => {
    preview.style.display = "none";
};

async function uploadFile(file) {
    const res = await fetch(`${API_BASE}/upload-url`);
    const data = await res.json();

    await fetch(data.uploadUrl, {
        method: "POST",
        headers: {
            Authorization: data.authorizationToken,
            "X-Bz-File-Name": encodeURIComponent(file.name),
                "Content-Type": "b2/x-auto",
                "X-Bz-Content-Sha1": "do_not_verify"
        },
        body: file
    });

    loadFiles();
}

document.getElementById("upload").addEventListener("change", e => {
    uploadFile(e.target.files[0]);
});

loadFiles();
