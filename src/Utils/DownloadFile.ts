import fs from "node:fs";

export async function downloadFile(url: string, file: string) {
    if (fs.existsSync(file)) {
        return fs.readFileSync(file, 'utf-8');
    }

    const content = await fetch(url).then(res => {
        if (!res.ok) {
            throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
        }

        return res.text();
    });

    fs.writeFileSync(file, content);

    return content;
}