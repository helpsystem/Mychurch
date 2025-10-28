/**
 * 🎨 Daily Images API Routes
 * مسیرهای API برای مدیریت تصاویر روزانه AI
 */

const express = require('express');
const router = express.Router();
const imageGenerationService = require('../services/imageGenerationService');

/**
 * GET /api/daily-images
 * دریافت لیست تمام تصاویر تولید شده
 */
router.get('/', async (req, res) => {
  try {
    const images = imageGenerationService.getImages();
    
    res.json({
      success: true,
      count: images.length,
      images,
      lastUpdate: imageGenerationService.lastUpdate,
    });
  } catch (error) {
    console.error('❌ Error getting images:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت تصاویر',
      error: error.message,
    });
  }
});

/**
 * GET /api/daily-images/today
 * دریافت تصویر امروز
 */
router.get('/today', async (req, res) => {
  try {
    const images = imageGenerationService.getImages();
    
    if (images.length === 0) {
      return res.json({
        success: true,
        message: 'هنوز تصویری تولید نشده است',
        image: null,
      });
    }
    
    // Get most recent image
    const todayImage = images.reduce((latest, current) => 
      current.timestamp > latest.timestamp ? current : latest
    );
    
    res.json({
      success: true,
      image: todayImage,
    });
  } catch (error) {
    console.error('❌ Error getting today\'s image:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت تصویر امروز',
      error: error.message,
    });
  }
});

/**
 * GET /api/daily-images/topic/:topic
 * دریافت تصویر بر اساس موضوع
 */
router.get('/topic/:topic', async (req, res) => {
  try {
    const { topic } = req.params;
    const image = imageGenerationService.getImageByTopic(topic);
    
    if (!image) {
      return res.status(404).json({
        success: false,
        message: `تصویری با موضوع ${topic} یافت نشد`,
      });
    }
    
    res.json({
      success: true,
      image,
    });
  } catch (error) {
    console.error('❌ Error getting image by topic:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت تصویر',
      error: error.message,
    });
  }
});

/**
 * POST /api/daily-images/generate
 * تولید دستی تصاویر جدید (نیاز به احراز هویت ادمین)
 */
router.post('/generate', async (req, res) => {
  try {
    // TODO: Add admin authentication middleware
    // if (!req.user || !['SUPER_ADMIN', 'MANAGER'].includes(req.user.role)) {
    //   return res.status(403).json({ message: 'دسترسی غیرمجاز' });
    // }
    
    console.log('🎨 Manual image generation triggered');
    const images = await imageGenerationService.forceRegenerate();
    
    res.json({
      success: true,
      message: `${images.length} تصویر با موفقیت تولید شد`,
      images,
    });
  } catch (error) {
    console.error('❌ Error generating images:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در تولید تصاویر',
      error: error.message,
    });
  }
});

/**
 * GET /api/daily-images/status
 * دریافت وضعیت سرویس تولید تصویر
 */
router.get('/status', async (req, res) => {
  try {
    const images = imageGenerationService.getImages();
    const config = imageGenerationService.config;
    
    const hasApiKey = !!(
      config.openaiApiKey || 
      config.stabilityApiKey || 
      config.unsplashAccessKey
    );
    
    const nextUpdate = imageGenerationService.lastUpdate 
      ? new Date(imageGenerationService.lastUpdate + config.updateInterval)
      : null;
    
    res.json({
      success: true,
      status: {
        enabled: config.autoGenerate,
        hasApiKey,
        apiServices: {
          openai: !!config.openaiApiKey,
          stability: !!config.stabilityApiKey,
          unsplash: !!config.unsplashAccessKey,
        },
        imagesCount: images.length,
        lastUpdate: imageGenerationService.lastUpdate 
          ? new Date(imageGenerationService.lastUpdate) 
          : null,
        nextUpdate,
        updateInterval: `${config.updateInterval / (24 * 60 * 60 * 1000)} days`,
        topics: config.topics,
      },
    });
  } catch (error) {
    console.error('❌ Error getting status:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت وضعیت',
      error: error.message,
    });
  }
});

module.exports = router;
