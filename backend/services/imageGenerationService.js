/**
 * Image Generation Service
 * سرویس تولید خودکار عکس‌های مسیحی برای سایت
 * 
 * Features:
 * - Auto-generate images every 7 days
 * - Multiple AI image APIs support (OpenAI, Stability AI, Unsplash)
 * - Biblical themes and topics
 * - Persian and English captions
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class ImageGenerationService {
  constructor() {
    this.config = {
      openaiApiKey: process.env.OPENAI_API_KEY,
      stabilityApiKey: process.env.STABILITY_API_KEY,
      unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY,
      updateInterval: parseInt(process.env.IMAGE_UPDATE_INTERVAL) || 7 * 24 * 60 * 60 * 1000, // 7 days
      autoGenerate: process.env.AUTO_GENERATE_IMAGES === 'true',
      outputDir: process.env.IMAGE_OUTPUT_DIR || 'public/generated-images',
      topics: (process.env.IMAGE_TOPICS || 'jesus,cross,church,prayer,worship,bible').split(',')
    };
    
    this.lastUpdate = null;
    this.imageMetadata = [];
  }

  /**
   * Initialize service and create output directory
   */
  async initialize() {
    try {
      await fs.mkdir(this.config.outputDir, { recursive: true });
      
      // Load last update timestamp
      try {
        const metadataPath = path.join(this.config.outputDir, 'metadata.json');
        const metadata = await fs.readFile(metadataPath, 'utf8');
        const data = JSON.parse(metadata);
        this.lastUpdate = data.lastUpdate;
        this.imageMetadata = data.images || [];
      } catch (error) {
        console.log('📸 No previous image metadata found, starting fresh');
      }

      console.log('✅ Image Generation Service initialized');
      
      // Start auto-update if enabled
      if (this.config.autoGenerate) {
        this.startAutoUpdate();
      }
    } catch (error) {
      console.error('❌ Failed to initialize Image Generation Service:', error.message);
    }
  }

  /**
   * Start automatic image generation
   */
  startAutoUpdate() {
    // Check if update is needed
    this.checkAndUpdate();
    
    // Schedule periodic updates
    setInterval(() => {
      this.checkAndUpdate();
    }, 60 * 60 * 1000); // Check every hour
  }

  /**
   * Check if images need update and generate if needed
   */
  async checkAndUpdate() {
    const now = Date.now();
    
    if (!this.lastUpdate || (now - this.lastUpdate) > this.config.updateInterval) {
      console.log('🎨 Time to generate new images...');
      await this.generateAllImages();
      this.lastUpdate = now;
      await this.saveMetadata();
    } else {
      const timeLeft = this.config.updateInterval - (now - this.lastUpdate);
      const daysLeft = Math.ceil(timeLeft / (24 * 60 * 60 * 1000));
      console.log(`⏰ Next image update in ${daysLeft} days`);
    }
  }

  /**
   * Generate images for all topics
   */
  async generateAllImages() {
    console.log('🎨 Starting image generation...');
    this.imageMetadata = [];

    for (const topic of this.config.topics) {
      try {
        console.log(`📸 Generating image for: ${topic}`);
        
        // Try different APIs in order of preference
        let imageData = null;
        
        if (this.config.unsplashAccessKey) {
          imageData = await this.generateWithUnsplash(topic);
        } else if (this.config.openaiApiKey) {
          imageData = await this.generateWithOpenAI(topic);
        } else if (this.config.stabilityApiKey) {
          imageData = await this.generateWithStability(topic);
        } else {
          console.warn('⚠️  No API keys configured, using placeholder images');
          imageData = await this.generatePlaceholder(topic);
        }

        if (imageData) {
          this.imageMetadata.push(imageData);
          console.log(`✅ Generated image for ${topic}`);
        }
      } catch (error) {
        console.error(`❌ Failed to generate image for ${topic}:`, error.message);
      }
    }

    await this.saveMetadata();
    console.log(`🎉 Image generation complete! Generated ${this.imageMetadata.length} images`);
  }

  /**
   * Generate image using Unsplash API (Free, high-quality stock photos)
   */
  async generateWithUnsplash(topic) {
    try {
      // Biblical search queries in English
      const queries = {
        jesus: 'jesus christ religious',
        cross: 'christian cross faith',
        church: 'church building worship',
        prayer: 'praying hands faith',
        worship: 'worship praise church',
        bible: 'bible scripture holy book',
        faith: 'faith hope religious',
        hope: 'hope light darkness',
        love: 'love heart compassion',
        peace: 'peace dove freedom',
        salvation: 'salvation redemption',
        grace: 'grace mercy light'
      };

      const searchQuery = queries[topic] || `${topic} christian`;

      const response = await axios.get('https://api.unsplash.com/search/photos', {
        params: {
          query: searchQuery,
          orientation: 'landscape',
          per_page: 1,
          order_by: 'relevant'
        },
        headers: {
          'Authorization': `Client-ID ${this.config.unsplashAccessKey}`
        }
      });

      if (response.data.results && response.data.results.length > 0) {
        const photo = response.data.results[0];
        
        // Download image
        const imageUrl = photo.urls.regular;
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const filename = `${topic}-${Date.now()}.jpg`;
        const filepath = path.join(this.config.outputDir, filename);
        
        await fs.writeFile(filepath, imageResponse.data);

        return {
          topic,
          filename,
          url: `/generated-images/${filename}`,
          source: 'unsplash',
          photographer: photo.user.name,
          photographerUrl: photo.user.links.html,
          downloadUrl: photo.links.download_location,
          description: photo.description || photo.alt_description || searchQuery,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.error(`Unsplash API error for ${topic}:`, error.message);
      throw error;
    }
  }

  /**
   * Generate image using OpenAI DALL-E API
   */
  async generateWithOpenAI(topic) {
    try {
      // Persian and English prompts for biblical themes
      const prompts = {
        jesus: 'A divine and peaceful portrait of Jesus Christ with warm lighting, sacred atmosphere, high quality religious art',
        cross: 'A beautiful Christian cross with rays of light, heavenly background, inspirational religious imagery',
        church: 'A majestic church building with stained glass windows, divine light streaming through, spiritual atmosphere',
        prayer: 'Hands folded in prayer with heavenly light, peaceful and spiritual scene, religious devotion',
        worship: 'People worshipping with raised hands, divine presence, spiritual celebration, church setting',
        bible: 'An ancient open Bible with golden light shining on pages, sacred scripture, spiritual revelation',
        faith: 'Abstract representation of faith - a person reaching toward heaven, hope and trust, spiritual journey',
        hope: 'A beacon of light breaking through darkness, symbol of hope and salvation, inspirational religious art',
        love: 'Heart radiating divine love and compassion, warm glowing light, Christian love and grace',
        peace: 'A white dove with olive branch, peaceful sky background, symbol of peace and Holy Spirit',
        salvation: 'Empty tomb with light emanating, resurrection symbol, Easter morning, salvation imagery',
        grace: 'Divine grace represented by flowing light from heaven, mercy and forgiveness, spiritual blessing'
      };

      const prompt = prompts[topic] || `Christian religious art depicting ${topic}, inspirational and peaceful`;

      const response = await axios.post('https://api.openai.com/v1/images/generations', {
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1792x1024', // Landscape format
        quality: 'standard'
      }, {
        headers: {
          'Authorization': `Bearer ${this.config.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.data && response.data.data.length > 0) {
        const imageUrl = response.data.data[0].url;
        
        // Download image
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const filename = `${topic}-${Date.now()}.png`;
        const filepath = path.join(this.config.outputDir, filename);
        
        await fs.writeFile(filepath, imageResponse.data);

        return {
          topic,
          filename,
          url: `/generated-images/${filename}`,
          source: 'openai-dalle',
          prompt,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.error(`OpenAI API error for ${topic}:`, error.message);
      throw error;
    }
  }

  /**
   * Generate image using Stability AI API
   */
  async generateWithStability(topic) {
    try {
      const prompts = {
        jesus: 'Divine portrait of Jesus Christ, warm lighting, peaceful expression, religious art masterpiece',
        cross: 'Christian cross with heavenly rays of light, inspirational and sacred',
        church: 'Beautiful church interior with stained glass, divine atmosphere',
        prayer: 'Praying hands with heavenly light, spiritual devotion',
        worship: 'Worship scene with raised hands, spiritual celebration',
        bible: 'Ancient Bible with divine light, sacred scripture',
        faith: 'Person reaching toward heaven, faith and hope',
        hope: 'Light breaking through darkness, hope and salvation',
        love: 'Heart radiating divine love, Christian grace',
        peace: 'White dove with olive branch, peace symbol',
        salvation: 'Empty tomb with light, resurrection imagery',
        grace: 'Divine light from heaven, mercy and grace'
      };

      const prompt = prompts[topic] || `Christian religious art: ${topic}`;

      const response = await axios.post(
        'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
        {
          text_prompts: [
            {
              text: prompt,
              weight: 1
            }
          ],
          cfg_scale: 7,
          height: 1024,
          width: 1792, // Landscape
          steps: 30,
          samples: 1
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.stabilityApiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      if (response.data.artifacts && response.data.artifacts.length > 0) {
        const imageBase64 = response.data.artifacts[0].base64;
        const filename = `${topic}-${Date.now()}.png`;
        const filepath = path.join(this.config.outputDir, filename);
        
        await fs.writeFile(filepath, Buffer.from(imageBase64, 'base64'));

        return {
          topic,
          filename,
          url: `/generated-images/${filename}`,
          source: 'stability-ai',
          prompt,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.error(`Stability AI error for ${topic}:`, error.message);
      throw error;
    }
  }

  /**
   * Generate placeholder image (fallback when no API keys available)
   */
  async generatePlaceholder(topic) {
    // Use a free service like Lorem Picsum or placeholder.com
    const width = 1792;
    const height = 1024;
    const imageUrl = `https://picsum.photos/${width}/${height}?random=${Date.now()}`;
    
    try {
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const filename = `${topic}-placeholder-${Date.now()}.jpg`;
      const filepath = path.join(this.config.outputDir, filename);
      
      await fs.writeFile(filepath, imageResponse.data);

      return {
        topic,
        filename,
        url: `/generated-images/${filename}`,
        source: 'placeholder',
        description: `Placeholder image for ${topic}`,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error(`Placeholder generation error for ${topic}:`, error.message);
      return null;
    }
  }

  /**
   * Save metadata to JSON file
   */
  async saveMetadata() {
    const metadataPath = path.join(this.config.outputDir, 'metadata.json');
    const data = {
      lastUpdate: this.lastUpdate,
      images: this.imageMetadata,
      topics: this.config.topics,
      nextUpdate: this.lastUpdate + this.config.updateInterval
    };
    
    await fs.writeFile(metadataPath, JSON.stringify(data, null, 2));
    console.log('💾 Metadata saved');
  }

  /**
   * Get all generated images
   */
  getImages() {
    return this.imageMetadata;
  }

  /**
   * Get image by topic
   */
  getImageByTopic(topic) {
    return this.imageMetadata.find(img => img.topic === topic);
  }

  /**
   * Force regenerate all images (manual trigger)
   */
  async forceRegenerate() {
    console.log('🔄 Force regenerating all images...');
    await this.generateAllImages();
    return this.imageMetadata;
  }
}

module.exports = new ImageGenerationService();
