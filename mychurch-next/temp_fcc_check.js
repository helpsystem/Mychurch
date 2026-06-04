const token = "eba5d1f12b4499119a80351c20783852";

async function main() {
  const res = await fetch("https://www.freeconferencecall.com/api/v4/conferences", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Data:", JSON.stringify(data, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
