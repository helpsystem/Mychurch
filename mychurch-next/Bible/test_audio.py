import urllib.request, json, re

url = "https://www.bible.com/audio-bible/3034/GEN.1.BSB"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
resp = urllib.request.urlopen(req, timeout=15)
html = resp.read().decode("utf-8")

match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.DOTALL)
if match:
    data = json.loads(match.group(1))
    props = data.get("props", {}).get("pageProps", {})
    print("PAGE PROPS KEYS:", list(props.keys()))
    txt = json.dumps(props)
    
    # Find audio/media URLs
    urls = re.findall(r'https?://[^"]+(?:mp3|m4a|ogg|audio|cdn|stream|media)[^"]*', txt)
    print("MEDIA URLS:", urls[:10])
    
    # Print first 5000 chars of pageProps
    print("\n--- PAGE PROPS (first 5000 chars) ---")
    print(txt[:5000])
else:
    print("No __NEXT_DATA__ found")
    urls = re.findall(r'https?://[^"\']+(?:mp3|m4a|ogg|audio)[^"\']*', html)
    print("Audio refs in HTML:", urls[:10])

# Also try the bible text page 
print("\n\n=== BIBLE TEXT PAGE ===")
url2 = "https://www.bible.com/bible/118/GEN.1.nmv"
req2 = urllib.request.Request(url2, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
resp2 = urllib.request.urlopen(req2, timeout=15)
html2 = resp2.read().decode("utf-8")

match2 = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html2, re.DOTALL)
if match2:
    data2 = json.loads(match2.group(1))
    props2 = data2.get("props", {}).get("pageProps", {})
    print("TEXT PAGE PROPS KEYS:", list(props2.keys()))
    txt2 = json.dumps(props2, ensure_ascii=False)
    print("\n--- TEXT PAGE PROPS (first 5000 chars) ---")
    print(txt2[:5000])
