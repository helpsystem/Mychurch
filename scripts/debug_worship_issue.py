#!/usr/bin/env python3
import requests

print("🔍 Debugging Worship Page Issue")
print("="*70)

# Test 1: Check if JSON loads
print("\n1. Testing JSON Load:")
try:
    response = requests.get("https://samanabyar.online/worship/data/worship_songs.json", timeout=10)
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ JSON loaded: {len(data)} songs")
        print(f"   First song: {data[0].get('title', {}).get('fa', 'N/A')}")
    else:
        print(f"   ❌ Status: {response.status_code}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 2: Check if React app loads
print("\n2. Testing React App Load:")
try:
    response = requests.get("https://samanabyar.online/", timeout=10)
    content = response.text
    
    # Check for worship route
    if 'worship' in content.lower():
        print("   ✅ 'worship' found in HTML")
    else:
        print("   ⚠️  'worship' NOT found in HTML")
    
    # Check for React
    if 'react' in content.lower():
        print("   ✅ React detected")
    else:
        print("   ⚠️  React NOT detected")
        
    # Check for router
    if 'router' in content.lower():
        print("   ✅ Router detected")
    else:
        print("   ⚠️  Router NOT detected")
        
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 3: Check browser console
print("\n3. Common Issues:")
print("   - React Router might not be loading WorshipPage component")
print("   - WorshipPage.tsx might have import errors")
print("   - ContentContext might be failing to load worship songs")
print("\n💡 Solution: Check browser console (F12) for errors")

print("\n4. Manual Test URLs:")
print("   Homepage: https://samanabyar.online/")
print("   Worship: https://samanabyar.online/#/worship")
print("   JSON: https://samanabyar.online/worship/data/worship_songs.json")

print("\n" + "="*70)
