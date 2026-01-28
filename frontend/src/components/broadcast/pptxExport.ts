/**
 * 📊 PowerPoint Export Utility
 * 
 * ساخت PPTX از اسلایدهای Broadcast Console
 * با پشتیبانی از فونت Vazirmatn برای فارسی
 */

import { Slide, AppLanguage } from './types';

// Types
export interface PPTXExportOptions {
  includeBackground?: boolean;
  backgroundImage?: string;
  backgroundColor?: string;
  fontFamily?: string;
  primaryColor?: string;
  secondaryColor?: string;
  titleSize?: number;
  bodySize?: number;
  lang: AppLanguage;
}

export interface PPTXSlide {
  title?: string;
  body?: string;
  reference?: string;
  imageUrl?: string;
  type: 'title' | 'scripture' | 'lyrics' | 'blank' | 'image';
}

// Default options
const DEFAULT_OPTIONS: PPTXExportOptions = {
  includeBackground: true,
  backgroundColor: '#0f172a',
  fontFamily: 'Vazirmatn',
  primaryColor: '#ffffff',
  secondaryColor: '#10b981',
  titleSize: 44,
  bodySize: 32,
  lang: 'fa',
};

/**
 * تبدیل Slide به فرمت PPTX
 */
function convertSlideForPPTX(slide: Slide, lang: AppLanguage): PPTXSlide {
  switch (slide.type) {
    case 'SCRIPTURE': {
      const content = slide.content as any;
      return {
        type: 'scripture',
        title: content.pages?.[0]?.bookName?.[lang] || 'Scripture',
        body: content.pages?.[0]?.textPrimary || content.pages?.[0]?.textSecondary || '',
        reference: `${content.pages?.[0]?.book} ${content.pages?.[0]?.chapter}:${content.pages?.[0]?.verses}`,
      };
    }
      
    case 'LYRICS': {
      const content = slide.content as any;
      const bodyText = content.lines?.map((l: any) => l.text || l).join('\n') || '';
      return {
        type: 'lyrics',
        title: content.title || 'Lyrics',
        body: bodyText,
      };
    }
      
    case 'MEDIA': {
      const content = slide.content as any;
      return {
        type: 'image',
        imageUrl: content.url || content.imageUrl,
        title: content.title || 'Media',
      };
    }
      
    case 'ANNOUNCEMENT': {
      const content = slide.content as any;
      return {
        type: 'title',
        title: content.title || 'Announcement',
        body: content.content || '',
      };
    }
      
    default:
      return {
        type: 'blank',
      };
  }
}

/**
 * Generate XML for a slide
 */
function generateSlideXML(slide: PPTXSlide, options: PPTXExportOptions, slideNumber: number): string {
  const isRTL = options.lang === 'fa';
  const textAlign = isRTL ? 'r' : 'l';
  const rtlAttr = isRTL ? ' rtl="1"' : '';
  
  // EMU units (914400 per inch)
  const slideWidth = 9144000; // 10 inches
  const slideHeight = 6858000; // 7.5 inches
  
  let contentXML = '';
  
  // Title
  if (slide.title) {
    contentXML += `
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="2" name="Title"/>
          <p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>
          <p:nvPr><p:ph type="title"/></p:nvPr>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="457200" y="274638"/>
            <a:ext cx="8229600" cy="1143000"/>
          </a:xfrm>
        </p:spPr>
        <p:txBody>
          <a:bodyPr${rtlAttr}/>
          <a:lstStyle/>
          <a:p>
            <a:pPr algn="${textAlign}"/>
            <a:r>
              <a:rPr lang="${isRTL ? 'fa-IR' : 'en-US'}" sz="${(options.titleSize || 44) * 100}" b="1">
                <a:solidFill>
                  <a:srgbClr val="${(options.primaryColor || '#ffffff').replace('#', '')}"/>
                </a:solidFill>
                <a:latin typeface="${options.fontFamily || 'Vazirmatn'}"/>
                <a:cs typeface="${options.fontFamily || 'Vazirmatn'}"/>
              </a:rPr>
              <a:t>${escapeXML(slide.title)}</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>`;
  }
  
  // Body
  if (slide.body) {
    const bodyLines = slide.body.split('\n');
    const paragraphs = bodyLines.map(line => `
      <a:p>
        <a:pPr algn="ctr"/>
        <a:r>
          <a:rPr lang="${isRTL ? 'fa-IR' : 'en-US'}" sz="${(options.bodySize || 32) * 100}">
            <a:solidFill>
              <a:srgbClr val="${(options.primaryColor || '#ffffff').replace('#', '')}"/>
            </a:solidFill>
            <a:latin typeface="${options.fontFamily || 'Vazirmatn'}"/>
            <a:cs typeface="${options.fontFamily || 'Vazirmatn'}"/>
          </a:rPr>
          <a:t>${escapeXML(line)}</a:t>
        </a:r>
      </a:p>`).join('');
    
    contentXML += `
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="3" name="Content"/>
          <p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>
          <p:nvPr><p:ph idx="1"/></p:nvPr>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="457200" y="${slide.title ? '1600200' : '914400'}"/>
            <a:ext cx="8229600" cy="${slide.title ? '4525963' : '5486400'}"/>
          </a:xfrm>
        </p:spPr>
        <p:txBody>
          <a:bodyPr${rtlAttr} anchor="ctr"/>
          <a:lstStyle/>
          ${paragraphs}
        </p:txBody>
      </p:sp>`;
  }
  
  // Reference (for scripture)
  if (slide.reference && slide.type === 'scripture') {
    contentXML += `
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="4" name="Reference"/>
          <p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="457200" y="6096000"/>
            <a:ext cx="8229600" cy="457200"/>
          </a:xfrm>
        </p:spPr>
        <p:txBody>
          <a:bodyPr${rtlAttr}/>
          <a:lstStyle/>
          <a:p>
            <a:pPr algn="${textAlign}"/>
            <a:r>
              <a:rPr lang="${isRTL ? 'fa-IR' : 'en-US'}" sz="2400" i="1">
                <a:solidFill>
                  <a:srgbClr val="${(options.secondaryColor || '#10b981').replace('#', '')}"/>
                </a:solidFill>
                <a:latin typeface="${options.fontFamily || 'Vazirmatn'}"/>
                <a:cs typeface="${options.fontFamily || 'Vazirmatn'}"/>
              </a:rPr>
              <a:t>— ${escapeXML(slide.reference)}</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>`;
  }
  
  // Background
  const bgXML = options.includeBackground ? `
    <p:bg>
      <p:bgPr>
        <a:solidFill>
          <a:srgbClr val="${(options.backgroundColor || '#0f172a').replace('#', '')}"/>
        </a:solidFill>
      </p:bgPr>
    </p:bg>` : '';
  
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    ${bgXML}
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
      ${contentXML}
    </p:spTree>
  </p:cSld>
</p:sld>`;
}

/**
 * Generate content_types.xml
 */
function generateContentTypesXML(slideCount: number): string {
  const slideOverrides = Array.from({ length: slideCount }, (_, i) => 
    `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
  ).join('\n  ');
  
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  ${slideOverrides}
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;
}

/**
 * Generate presentation.xml
 */
function generatePresentationXML(slideCount: number): string {
  const slideIds = Array.from({ length: slideCount }, (_, i) => 
    `<p:sldId id="${256 + i}" r:id="rId${3 + i}"/>`
  ).join('\n      ');
  
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" saveSubsetFonts="1">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
    ${slideIds}
  </p:sldIdLst>
  <p:sldSz cx="9144000" cy="6858000" type="screen4x3"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`;
}

/**
 * Escape XML special characters
 */
function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Export slides to PPTX (via backend)
 */
export async function exportToPPTX(
  slides: Slide[],
  filename: string,
  options: Partial<PPTXExportOptions> = {}
): Promise<void> {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // Convert slides to PPTX format
  const pptxSlides = slides.map(slide => 
    convertSlideForPPTX(slide, finalOptions.lang)
  );
  
  try {
    // Send to backend for PPTX generation
    const response = await fetch('/api/broadcast/export-pptx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slides: pptxSlides,
        options: finalOptions,
        filename,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate PPTX');
    }
    
    // Download the generated file
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.pptx') ? filename : `${filename}.pptx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('📊 PPTX exported successfully');
  } catch (error) {
    console.error('PPTX export error:', error);
    
    // Fallback: Export as JSON for manual import
    const jsonData = {
      slides: pptxSlides,
      options: finalOptions,
      exportedAt: new Date().toISOString(),
    };
    
    const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    
    const a = document.createElement('a');
    a.href = jsonUrl;
    a.download = `${filename}_slides.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(jsonUrl);
    
    throw error;
  }
}

/**
 * Export to ProPresenter format (.pro6)
 */
export async function exportToProPresenter(
  slides: Slide[],
  filename: string,
  lang: AppLanguage
): Promise<void> {
  const pptxSlides = slides.map(slide => convertSlideForPPTX(slide, lang));
  
  try {
    const response = await fetch('/api/broadcast/export-propresenter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slides: pptxSlides,
        filename,
        lang,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate ProPresenter file');
    }
    
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.pro6') ? filename : `${filename}.pro6`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('ProPresenter export error:', error);
    throw error;
  }
}

/**
 * Export to plain text (for teleprompter)
 */
export function exportToText(slides: Slide[], lang: AppLanguage): string {
  return slides.map((slide, index) => {
    const content = slide.content as any;
    const title = content.title || content.pages?.[0]?.bookName?.[lang] || `Slide ${index + 1}`;
    const body = content.lines?.map((l: any) => l.text || l).join('\n') || 
                 content.pages?.[0]?.textPrimary || 
                 content.content || '';
    
    let text = `=== ${title} ===\n`;
    if (body) text += `\n${body}\n`;
    text += '\n';
    
    return text;
  }).join('\n');
}

export default {
  exportToPPTX,
  exportToProPresenter,
  exportToText,
};
