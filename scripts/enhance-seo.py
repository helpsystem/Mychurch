"""
SEO Enhancement Script for index.html
Updates meta tags, adds JSON-LD structured data, and noscript content for Google bot visibility
"""

import re

# Read the current index.html
with open('d:/Windows.old/Users/Sami/Desktop/Iran Church DC/Git/Mychurch/frontend/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update primary meta description
content = re.sub(
    r'<meta name="description"\s+content="Welcome to Iranian Christian Church[^"]*"',
    '<meta name="description"\n    content="Advanced community platform powered by Google Gemini AI featuring real-time voice chat, intelligent audio transcription with word-level timing, TTS with 40+ voices, and personalized content delivery for Persian-speaking Christian community in Washington DC. Built with cutting-edge AI technology for seamless worship, Bible study, and fellowship."',
    content,
    flags=re.DOTALL
)

# 2. Update keywords
content = re.sub(
    r'<meta name="keywords"\s+content="Persian Christian Church[^"]*"',
    '<meta name="keywords"\n    content="Gemini AI, Google AI, Community Platform, AI EdTech, Persian Christian, Machine Learning, Voice AI, TTS, Audio Transcription, Real-time AI, LLM, Persian Bible, Farsi Church, Washington DC, Google for Startups, AI Startup, Audio Synchronization, Karaoke Bible, Intelligent Platform"',
    content,
    flags=re.DOTALL
)

# 3. Update author
content = re.sub(
    r'<meta name="author" content="Iranian Christian Church DC"',
    '<meta name="author" content="Iranian Christian Church DC - AI Innovation Team"',
    content
)

# 4. Add application-name and generator meta tags after robots
content = re.sub(
    r'(<meta name="robots" content="index, follow">)',
    r'\1\n  <meta name="application-name" content="AI-Powered Persian Community Platform">\n  <meta name="generator" content="React + Google Gemini AI">',
    content
)

# 5. Update meta name="title" 
content = re.sub(
    r'<meta name="title" content="[^"]*کلیسای ایرانیان[^"]*"',
    '<meta name="title" content="AI-Powered Persian Community Platform | Iranian Christian Church DC"',
    content
)

# 6. Add JSON-LD Structured Data before </body>
json_ld = '''
  <!-- Structured Data (JSON-LD) for Search Engines -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Iranian Christian Church of Washington DC",
    "alternateName": "AI-Powered Persian Community Platform",
    "description": "Advanced community platform powered by Google Gemini AI featuring real-time voice chat, intelligent audio transcription, TTS, and personalized content delivery for Persian-speaking Christians.",
    "url": "https://samanabyar.online",
    "logo": "https://samanabyar.online/images/logo.png",
    "foundingDate": "2024",
    "areaServed": {
      "@type": "Place",
      "name": "Washington DC"
    },
    "slogan": "AI-Powered Community Platform for Persian-Speaking Christians",
    "knowsAbout": [
      "Artificial Intelligence",
      "Google Gemini AI",
      "Machine Learning",
      "Natural Language Processing",
      "Text-to-Speech Technology",
      "Audio Transcription",
      "Community Platform Development",
      "EdTech Solutions"
    ]
  }
  </script>
  
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "AI-Powered Persian Community Platform",
    "description": "Revolutionary platform built with Google Gemini AI providing real-time voice chat, intelligent transcription, and personalized experiences.",
    "url": "https://samanabyar.online",
    "applicationCategory": "CommunityApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "Real-time Voice Chat with Gemini Live API",
      "Intelligent Audio Transcription with Word-Level Timing",
      "Text-to-Speech with 40+ Voice Options powered by Gemini 2.5 Flash",
      "Auto-Synchronized Bible Reading with Highlighting",
      "AI-Powered Content Generation",
      "Multilingual Support (Persian/Farsi and English)",
      "Audio-Text Synchronization using Gemini AI",
      "Live Church Event Recording with AI Transcription",
      "Worship Song Management with Auto-Timing",
      "AI Image Generation for Presentations"
    ],
    "softwareVersion": "4.0",
    "creator": {
      "@type": "Organization",
      "name": "Iranian Christian Church DC - AI Innovation Team"
    }
  }
  </script>

  <!-- Noscript Fallback Content for Search Engine Bots -->
  <noscript>
    <div style="max-width:800px;margin:50px auto;padding:40px;background:#fff;color:#000;font-family:Arial,sans-serif;border-radius:10px;">
      <h1 style="color:#00040F;margin-bottom:20px;">🤖 AI-Powered Persian Community Platform</h1>
      <h2 style="color:#333;font-size:24px;margin-bottom:15px;">Iranian Christian Church of Washington DC</h2>
      
      <p style="font-size:18px;line-height:1.6;margin-bottom:20px;">
        <strong>Advanced community platform powered by Google Gemini AI</strong> featuring cutting-edge technology for seamless worship, Bible study, and fellowship experiences.
      </p>

      <h3 style="color:#00040F;margin-top:30px;margin-bottom:15px;">🚀 AI-Powered Features</h3>
      <ul style="line-height:1.8;margin-bottom:20px;">
        <li><strong>Gemini Live Voice Chat:</strong> Real-time AI voice conversation using Gemini 2.0 for Bible study and worship assistance</li>
        <li><strong>Intelligent Audio Transcription:</strong> Word-level timing extraction with Gemini Flash for precise synchronization</li>
        <li><strong>Advanced TTS System:</strong> Text-to-Speech with 40+ multilingual voices powered by Gemini 2.5 Flash</li>
        <li><strong>Auto-Synchronized Bible Reading:</strong> Karaoke-style highlighting that follows along with audio automatically</li>
        <li><strong>AI Content Generation:</strong> Automated prayer generation, sermon summaries, and presentation creation</li>
        <li><strong>Image Generation:</strong> AI-powered visual content for worship presentations</li>
        <li><strong>Live Event Recording:</strong> Church events with real-time AI transcription and analysis</li>
        <li><strong>Smart Timing Analysis:</strong> Automatic synchronization of worship songs and Bible verses with audio</li>
      </ul>

      <h3 style="color:#00040F;margin-top:30px;margin-bottom:15px;">💡 Technology Stack</h3>
      <ul style="line-height:1.8;margin-bottom:20px;">
        <li>Google Gemini 2.0 Flash - High-speed AI processing</li>
        <li>Gemini 2.5 Flash - Advanced TTS capabilities</li>
        <li>Gemini Live API - Real-time voice interaction</li>
        <li>React.js - Modern web application framework</li>
        <li>Machine Learning - Personalized content delivery</li>
        <li>Natural Language Processing - Multi-language support</li>
      </ul>

      <h3 style="color:#00040F;margin-top:30px;margin-bottom:15px;">🌍 Community Focus</h3>
      <p style="line-height:1.6;margin-bottom:15px;">
        We serve the Persian-speaking Christian community in Washington DC by combining spiritual growth with technological innovation. Our platform makes worship, Bible study, and fellowship accessible through AI-powered tools that understand and respond in both Persian (Farsi) and English.
      </p>

      <h3 style="color:#00040F;margin-top:30px;margin-bottom:15px;">📱 Key Pages</h3>
      <ul style="line-height:1.8;">
        <li><a href="/" style="color:#00F6FF;">Home - AI Platform Overview</a></li>
        <li><a href="/bible" style="color:#00F6FF;">AI-Enhanced Bible Study</a></li>
        <li><a href="/sermons" style="color:#00F6FF;">Sermon Library with Transcriptions</a></li>
        <li><a href="/worship" style="color:#00F6FF;">Worship Songs with Auto-Sync</a></li>
        <li><a href="/ai-helper" style="color:#00F6FF;">AI Assistant for Spiritual Questions</a></li>
        <li><a href="/events" style="color:#00F6FF;">Community Events & Programs</a></li>
        <li><a href="/contact" style="color:#00F6FF;">Contact Information</a></li>
      </ul>

      <div style="margin-top:40px;padding:20px;background:#f0f0f0;border-left:4px solid #00F6FF;">
        <p style="margin:0;font-size:14px;color:#666;">
          <strong>Note:</strong> This website requires JavaScript to access the full AI-powered experience. Please enable JavaScript in your browser to interact with our Gemini AI features, including voice chat, intelligent transcription, and personalized content.
        </p>
      </div>

      <div style="margin-top:30px;text-align:center;padding:20px;border-top:2px solid #eee;">
        <p style="color:#666;font-size:14px;margin:0;">
          <strong>Built with Google Gemini AI</strong> | EdTech & Community Innovation Platform<br>
          Contact: <a href="mailto:info@samanabyar.online" style="color:#00F6FF;">info@samanabyar.online</a>
        </p>
      </div>
    </div>
  </noscript>

'''

# Insert JSON-LD and noscript before the root div
content = re.sub(
    r'(\s*<div id="root"></div>)',
    json_ld + r'\1',
    content
)

# Write the updated content
with open('d:/Windows.old/Users/Sami/Desktop/Iran Church DC/Git/Mychurch/frontend/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ SEO enhancements successfully applied to index.html!")
print("\n📊 Changes made:")
print("  ✓ Updated meta description with AI focus")
print("  ✓ Enhanced keywords with Gemini AI terms")
print("  ✓ Updated author to include AI Innovation Team")
print("  ✓ Added application-name and generator meta tags")
print("  ✓ Updated meta title tag")
print("  ✓ Added JSON-LD Organization schema")
print("  ✓ Added JSON-LD WebApplication schema")
print("  ✓ Added comprehensive noscript fallback content")
print("\n🔍 Google bots will now be able to:")
print("  • See AI-focused content even without JavaScript")
print("  • Understand the platform as an AI/EdTech application")
print("  • Index Gemini integration and features properly")
