/**
 * Image Generation Routes
 * مسیرهای API برای مدیریت تولید عکس خودکار
 */

const express = require('express');
const router = express.Router();
const imageService = require('../services/imageGenerationService');

/**
 * GET /api/images/all
 * دریافت لیست تمام عکس‌های تولید شده
 */
router.get('/all', async (req, res) => {
  try {
    const images = imageService.getImages();
    res.json({
      success: true,
      count: images.length,
      images,
      lastUpdate: imageService.lastUpdate,
      nextUpdate: imageService.lastUpdate ? 
        new Date(imageService.lastUpdate + imageService.config.updateInterval) : null
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch images',
      message: error.message
    });
  }
});

/**
 * GET /api/images/topic/:topic
 * دریافت عکس بر اساس موضوع
 */
router.get('/topic/:topic', async (req, res) => {
  try {
    const { topic } = req.params;
    const image = imageService.getImageByTopic(topic);
    
    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Image not found',
        message: `No image found for topic: ${topic}`
      });
    }

    res.json({
      success: true,
      image
    });
  } catch (error) {
    console.error('Error fetching image by topic:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch image',
      message: error.message
    });
  }
});

/**
 * POST /api/images/generate
 * تولید دستی عکس‌های جدید (force update)
 */
router.post('/generate', async (req, res) => {
  try {
    console.log('🎨 Manual image generation triggered');
    
    // Run generation in background
    imageService.forceRegenerate().then(() => {
      console.log('✅ Background image generation completed');
    }).catch(error => {
      console.error('❌ Background image generation failed:', error);
    });

    res.json({
      success: true,
      message: 'Image generation started in background',
      status: 'processing'
    });
  } catch (error) {
    console.error('Error starting image generation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start image generation',
      message: error.message
    });
  }
});

/**
 * GET /api/images/status
 * وضعیت سیستم تولید عکس
 */
router.get('/status', async (req, res) => {
  try {
    const now = Date.now();
    const lastUpdate = imageService.lastUpdate;
    const updateInterval = imageService.config.updateInterval;
    
    let status = 'idle';
    let timeUntilNext = null;
    let daysUntilNext = null;

    if (lastUpdate) {
      const timeSinceUpdate = now - lastUpdate;
      timeUntilNext = updateInterval - timeSinceUpdate;
      daysUntilNext = Math.ceil(timeUntilNext / (24 * 60 * 60 * 1000));
      
      if (timeUntilNext > 0) {
        status = 'scheduled';
      } else {
        status = 'ready';
      }
    } else {
      status = 'never_run';
    }

    res.json({
      success: true,
      status,
      config: {
        autoGenerate: imageService.config.autoGenerate,
        updateIntervalDays: updateInterval / (24 * 60 * 60 * 1000),
        topics: imageService.config.topics,
        outputDir: imageService.config.outputDir
      },
      lastUpdate: lastUpdate ? new Date(lastUpdate) : null,
      nextUpdate: lastUpdate && timeUntilNext > 0 ? 
        new Date(lastUpdate + updateInterval) : null,
      daysUntilNext,
      imageCount: imageService.getImages().length,
      apisConfigured: {
        openai: !!imageService.config.openaiApiKey,
        stability: !!imageService.config.stabilityApiKey,
        unsplash: !!imageService.config.unsplashAccessKey
      }
    });
  } catch (error) {
    console.error('Error fetching status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch status',
      message: error.message
    });
  }
});

/**
 * GET /api/images/random
 * دریافت یک عکس تصادفی
 */
router.get('/random', async (req, res) => {
  try {
    const images = imageService.getImages();
    
    if (images.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No images available',
        message: 'No generated images found. Try generating images first.'
      });
    }

    const randomImage = images[Math.floor(Math.random() * images.length)];
    
    res.json({
      success: true,
      image: randomImage
    });
  } catch (error) {
    console.error('Error fetching random image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch random image',
      message: error.message
    });
  }
});

module.exports = router;
