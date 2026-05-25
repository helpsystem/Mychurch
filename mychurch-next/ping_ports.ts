async function test() {
    const urls = ["http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001", "http://localhost:3002"];
    for (const url of urls) {
        try {
            const res = await fetch(url);
            console.log(url, res.status);
            if (!res.ok) {
                const text = await res.text();
                console.log(url, "Body:", text.substring(0, 200));
            }
        } catch (e) {
            console.log(url, "Fetch failed");
        }
    }
}
test();
