<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Aras Tax AI Engine v2 - Enhanced Local AI
 * - Auto-detects user language
 * - Responds in user's language naturally
 * - Human-like translation with context awareness
 * - Smart text suggestions per language
 */
class Aras_Tax_AI_Engine {

    private $ollama_url;
    private $model;
    private $system_prompt;

    /**
     * Language-aware system prompts
     */
    private $localized_prompts = array(
        'en' => "You are the official AI assistant for Aras Tax Services (aras-cpa.com), a professional tax and accounting firm. Answer in English. Be warm, professional, and human-like. Use simple language anyone can understand.",
        'ar' => "أنت المساعد الرسمي لشركة Aras Tax Services (aras-cpa.com) المتخصصة في الضرائب والمحاسبة. أجب باللغة العربية الفصحى. كن دافئاً ومهنياً وإنسانياً في ردودك. استخدم لغة بسيطة يفهمها الجميع.",
        'ku' => "تۆ یاریدەدەری فەرمی کۆمپانیای Aras Tax Services (aras-cpa.com)یت کە لە بووی باج و ژمێریاری کار دەکات. بە زمانی کوردی وەڵام بدەوە. گەرم و پیشەیی و مرۆڤانە وەڵام بدەوە.",
        'fa' => "شما دستیار رسمی شرکت Aras Tax Services (aras-cpa.com) هستید که در زمینه مالیات و حسابداری فعالیت می‌کند. به زبان فارسی پاسخ دهید. گرم، حرفه‌ای و انسانی پاسخ دهید. از زبان ساده استفاده کنید.",
        'es' => "Eres el asistente oficial de Aras Tax Services (aras-cpa.com). Responde en español. Sé cálido, profesional y natural.",
        'tr' => "Aras Tax Services (aras-cpa.com) resmi AI asistanısınız. Türkçe yanıt verin. Sıcak, profesyonel ve doğal olun.",
        'fr' => "Vous êtes l'assistant officiel d'Aras Tax Services (aras-cpa.com). Répondez en français avec un ton chaleureux et professionnel.",
        'de' => "Sie sind der offizielle AI-Assistent von Aras Tax Services (aras-cpa.com). Antworten Sie auf Deutsch, warm und professionell.",
        'zh' => "您是Aras Tax Services (aras-cpa.com)的官方AI助手。请用中文回答，语气温暖专业。",
        'ru' => "Вы официальный AI-ассистент Aras Tax Services (aras-cpa.com). Отвечайте на русском языке тепло и профессионально.",
    );

    public function __construct() {
        $options = get_option( 'aras_tax_ai_options', array() );

        $this->ollama_url    = isset( $options['aras_ai_ollama_url'] ) ? $options['aras_ai_ollama_url'] : 'http://localhost:11434';
        $this->model         = isset( $options['aras_ai_model'] ) ? $options['aras_ai_model'] : 'llama3.2';
        $this->system_prompt = isset( $options['aras_ai_system_prompt'] ) && ! empty( $options['aras_ai_system_prompt'] )
            ? $options['aras_ai_system_prompt']
            : '';

        add_action( 'wp_ajax_aras_ai_chat', array( $this, 'handle_chat' ) );
        add_action( 'wp_ajax_nopriv_aras_ai_chat', array( $this, 'handle_chat' ) );

        add_action( 'wp_ajax_aras_ai_translate', array( $this, 'handle_translate' ) );
        add_action( 'wp_ajax_nopriv_aras_ai_translate', array( $this, 'handle_translate' ) );

        add_action( 'wp_ajax_aras_ai_suggest', array( $this, 'handle_suggestions' ) );
        add_action( 'wp_ajax_nopriv_aras_ai_suggest', array( $this, 'handle_suggestions' ) );

        add_action( 'wp_ajax_aras_ai_detect_language', array( $this, 'handle_detect_language' ) );
        add_action( 'wp_ajax_nopriv_aras_ai_detect_language', array( $this, 'handle_detect_language' ) );

        add_action( 'wp_ajax_aras_ai_check_status', array( $this, 'check_status' ) );
        add_action( 'wp_ajax_nopriv_aras_ai_check_status', array( $this, 'check_status' ) );
    }

    /**
     * Handle chat with auto language detection
     */
    public function handle_chat() {
        check_ajax_referer( 'aras_ai_nonce', 'nonce' );

        $message = sanitize_textarea_field( $_POST['message'] ?? '' );
        $history = isset( $_POST['history'] ) ? json_decode( stripslashes( $_POST['history'] ), true ) : array();
        $user_lang = isset( $_POST['lang'] ) ? sanitize_text_field( $_POST['lang'] ) : '';

        if ( empty( $message ) ) {
            wp_send_json_error( array( 'message' => __( 'Please enter a message.', 'aras-tax' ) ) );
        }

        // Auto-detect language if not provided
        if ( empty( $user_lang ) ) {
            $user_lang = $this->detect_language( $message );
        }

        // Get language-specific system prompt
        $system_prompt = $this->get_localized_prompt( $user_lang );

        // Build messages array
        $messages = array(
            array(
                'role'    => 'system',
                'content' => $system_prompt,
            ),
        );

        // Add conversation history (last 10 messages)
        if ( ! empty( $history ) ) {
            $history = array_slice( $history, -10 );
            foreach ( $history as $msg ) {
                $messages[] = array(
                    'role'    => $msg['role'],
                    'content' => $msg['content'],
                );
            }
        }

        $messages[] = array(
            'role'    => 'user',
            'content' => $message,
        );

        $response = $this->call_ollama_api( $messages );

        if ( is_wp_error( $response ) ) {
            wp_send_json_error( array(
                'message' => __( 'AI service is currently unavailable.', 'aras-tax' ),
                'error'   => $response->get_error_message(),
            ) );
        }

        $body = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( isset( $body['message']['content'] ) ) {
            wp_send_json_success( array(
                'reply'    => $body['message']['content'],
                'language' => $user_lang,
                'lang_name' => $this->get_language_name( $user_lang ),
                'model'    => $this->model,
            ) );
        } else {
            wp_send_json_error( array( 'message' => __( 'Failed to get AI response.', 'aras-tax' ) ) );
        }
    }

    /**
     * Handle human-like translation with both directions
     */
    public function handle_translate() {
        check_ajax_referer( 'aras_ai_nonce', 'nonce' );

        $text      = sanitize_textarea_field( $_POST['text'] ?? '' );
        $from_lang = sanitize_text_field( $_POST['from'] ?? 'auto' );
        $to_lang   = sanitize_text_field( $_POST['to'] ?? 'ar' );

        if ( empty( $text ) ) {
            wp_send_json_error( array( 'message' => __( 'Please enter text to translate.', 'aras-tax' ) ) );
        }

        // Auto-detect source language
        if ( $from_lang === 'auto' ) {
            $from_lang = $this->detect_language( $text );
        }

        $language_names = self::get_available_languages();
        $from_name = isset( $language_names[ $from_lang ] ) ? $language_names[ $from_lang ] : $from_lang;
        $to_name   = isset( $language_names[ $to_lang ] ) ? $language_names[ $to_lang ] : $to_lang;

        // Human-like translation system prompt
        $system_prompt = "You are a professional human translator specializing in tax, accounting, and business terminology. "
            . "Translate the following text from {$from_name} to {$to_name}. "
            . "RULES:\n"
            . "1. Use natural, human-like language — not robotic or literal translations\n"
            . "2. Maintain the professional tone appropriate for financial services\n"
            . "3. Use correct terminology for tax and accounting in the target language\n"
            . "4. Adapt idioms and expressions to natural equivalents in the target language\n"
            . "5. Keep the formatting and structure of the original\n"
            . "6. If the text is a question, translate it as a natural question in the target language\n"
            . "ONLY output the translated text, nothing else. No explanations, no notes.";

        $messages = array(
            array( 'role' => 'system', 'content' => $system_prompt ),
            array( 'role' => 'user',   'content' => $text ),
        );

        $response = $this->call_ollama_api( $messages, 0.1 );

        if ( is_wp_error( $response ) ) {
            wp_send_json_error( array(
                'message' => __( 'Translation service unavailable.', 'aras-tax' ),
            ) );
        }

        $body = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( isset( $body['message']['content'] ) ) {
            $translation = trim( $body['message']['content'] );

            // Also provide back-translation for quality check
            $back_translation = '';
            $back_prompt = "Translate this text from {$to_name} back to {$from_name} naturally. Only output the translation.";
            $back_response = $this->call_ollama_api( array(
                array( 'role' => 'system', 'content' => $back_prompt ),
                array( 'role' => 'user',   'content' => $translation ),
            ), 0.1 );

            if ( ! is_wp_error( $back_response ) ) {
                $back_body = json_decode( wp_remote_retrieve_body( $back_response ), true );
                if ( isset( $back_body['message']['content'] ) ) {
                    $back_translation = trim( $back_body['message']['content'] );
                }
            }

            wp_send_json_success( array(
                'translation'      => $translation,
                'detected_from'    => $from_lang,
                'detected_from_name' => $this->get_language_name( $from_lang ),
                'to'               => $to_lang,
                'to_name'          => $this->get_language_name( $to_lang ),
                'back_translation' => $back_translation,
                'original'         => $text,
            ) );
        } else {
            wp_send_json_error( array( 'message' => __( 'Failed to translate.', 'aras-tax' ) ) );
        }
    }

    /**
     * Handle smart suggestions in user's language
     */
    public function handle_suggestions() {
        check_ajax_referer( 'aras_ai_nonce', 'nonce' );

        $user_lang = isset( $_POST['lang'] ) ? sanitize_text_field( $_POST['lang'] ) : 'en';
        $context   = isset( $_POST['context'] ) ? sanitize_text_field( $_POST['context'] ) : '';

        $suggestions = $this->get_smart_suggestions( $user_lang, $context );

        wp_send_json_success( array(
            'suggestions' => $suggestions,
            'language'    => $user_lang,
        ) );
    }

    /**
     * Handle language detection
     */
    public function handle_detect_language() {
        check_ajax_referer( 'aras_ai_nonce', 'nonce' );

        $text = sanitize_textarea_field( $_POST['text'] ?? '' );

        if ( empty( $text ) ) {
            wp_send_json_error( array( 'message' => __( 'Please enter text.', 'aras-tax' ) ) );
        }

        $detected = $this->detect_language( $text );

        wp_send_json_success( array(
            'language'    => $detected,
            'name'        => $this->get_language_name( $detected ),
            'confidence'  => 'high',
        ) );
    }

    /**
     * Check Ollama status
     */
    public function check_status() {
        check_ajax_referer( 'aras_ai_nonce', 'nonce' );

        $response = wp_remote_get( $this->ollama_url . '/api/tags', array( 'timeout' => 5 ) );

        if ( is_wp_error( $response ) ) {
            wp_send_json_success( array(
                'status'  => 'offline',
                'message' => __( 'Ollama is not running.', 'aras-tax' ),
            ) );
        }

        $body = json_decode( wp_remote_retrieve_body( $response ), true );
        $models = array();
        if ( isset( $body['models'] ) ) {
            foreach ( $body['models'] as $m ) {
                $models[] = $m['name'];
            }
        }

        wp_send_json_success( array(
            'status'  => 'online',
            'models'  => $models,
            'message' => sprintf( __( 'Ollama running with %d model(s).', 'aras-tax' ), count( $models ) ),
        ) );
    }

    /**
     * Detect language of text
     * Uses character-level heuristics for common languages
     */
    private function detect_language( $text ) {
        // Arabic script
        if ( preg_match('/[\x{0600}-\x{06FF}\x{0750}-\x{077F}\x{08A0}-\x{08FF}]/u', $text) ) {
            // Kurdish uses Arabic script too, check for common Kurdish words
            $kurdish_words = array('دەتوانیت', 'باشە', 'چۆن', 'زۆر', 'سوپاس', 'لە', 'بۆ', 'کە');
            $persian_words = array('می‌توانید', 'خوب', 'چطور', 'خیلی', 'ممنون', 'در', 'برای', 'که');

            $is_kurdish = false;
            foreach ( $kurdish_words as $kw ) {
                if ( mb_strpos( $text, $kw ) !== false ) {
                    $is_kurdish = true;
                    break;
                }
            }

            if ( $is_kurdish ) return 'ku';

            $is_persian = false;
            foreach ( $persian_words as $pw ) {
                if ( mb_strpos( $text, $pw ) !== false ) {
                    $is_persian = true;
                    break;
                }
            }

            if ( $is_persian ) return 'fa';

            // Default to Arabic if Arabic script detected
            return 'ar';
        }

        // Chinese
        if ( preg_match('/[\x{4E00}-\x{9FFF}\x{3400}-\x{4DBF}]/u', $text) ) {
            return 'zh';
        }

        // Japanese
        if ( preg_match('/[\x{3040}-\x{309F}\x{30A0}-\x{30FF}]/u', $text) ) {
            return 'ja';
        }

        // Korean
        if ( preg_match('/[\x{AC00}-\x{D7AF}\x{1100}-\x{11FF}]/u', $text) ) {
            return 'ko';
        }

        // Russian / Cyrillic
        if ( preg_match('/[\x{0400}-\x{04FF}]/u', $text) ) {
            return 'ru';
        }

        // Hindi / Devanagari
        if ( preg_match('/[\x{0900}-\x{097F}]/u', $text) ) {
            return 'hi';
        }

        // Turkish check
        if ( preg_match('/[çğıöşüÇĞİÖŞÜ]/u', $text) ) {
            // Could also be other Turkic languages, but Turkish is most common
            return 'tr';
        }

        // Persian specific characters
        if ( preg_match('/[پچژکگی]/u', $text) ) {
            return 'fa';
        }

        // Default to English for Latin script
        return 'en';
    }

    /**
     * Get localized system prompt
     */
    private function get_localized_prompt( $lang ) {
        if ( ! empty( $this->system_prompt ) ) {
            return $this->system_prompt;
        }

        return isset( $this->localized_prompts[ $lang ] )
            ? $this->localized_prompts[ $lang ]
            : $this->localized_prompts['en'];
    }

    /**
     * Get smart suggestions per language
     */
    private function get_smart_suggestions( $lang, $context = '' ) {
        $all_suggestions = array(
            'en' => array(
                array( 'text' => 'What are the tax deadlines for 2025?', 'icon' => '📅' ),
                array( 'text' => 'What deductions can I claim?', 'icon' => '💰' ),
                array( 'text' => 'How do I file a W-4 form?', 'icon' => '📄' ),
                array( 'text' => 'What is self-employment tax?', 'icon' => '🏢' ),
                array( 'text' => 'How to reduce my tax bill?', 'icon' => '📉' ),
                array( 'text' => 'What is a 1099 form?', 'icon' => '📋' ),
            ),
            'ar' => array(
                array( 'text' => 'ما هي المواعيد النهائية للضرائب لعام ٢٠٢٥؟', 'icon' => '📅' ),
                array( 'text' => 'ما هي الخصومات التي يمكنني المطالبة بها؟', 'icon' => '💰' ),
                array( 'text' => 'كيف أقدم نموذج W-4؟', 'icon' => '📄' ),
                array( 'text' => 'ما هي ضريبة العمل الحر؟', 'icon' => '🏢' ),
                array( 'text' => 'كيف أقلل فاتورة الضرائب الخاصة بي؟', 'icon' => '📉' ),
                array( 'text' => 'ما هو نموذج 1099؟', 'icon' => '📋' ),
            ),
            'ku' => array(
                array( 'text' => 'واپەی کۆتایی باجەکان بۆ ٢٠٢٥ چین؟', 'icon' => '📅' ),
                array( 'text' => 'چ داواکارییەکانم دەتوانم بکەم؟', 'icon' => '💰' ),
                array( 'text' => 'چۆن فۆرمی W-4 پڕ بکەمەوە؟', 'icon' => '📄' ),
                array( 'text' => 'باجی کاری سەربەخۆ چییە؟', 'icon' => '🏢' ),
                array( 'text' => 'چۆن باجەکەم کەم بکەمەوە؟', 'icon' => '📉' ),
            ),
            'fa' => array(
                array( 'text' => 'مهلت‌های مالیاتی ۲۰۲۵ چیست؟', 'icon' => '📅' ),
                array( 'text' => 'چه کسوراتی می‌توانم استفاده کنم؟', 'icon' => '💰' ),
                array( 'text' => 'چگونه فرم W-4 را پر کنم؟', 'icon' => '📄' ),
                array( 'text' => 'مالیات خوداشتغالی چیست؟', 'icon' => '🏢' ),
                array( 'text' => 'چگونه مالیات خود را کاهش دهم؟', 'icon' => '📉' ),
            ),
            'es' => array(
                array( 'text' => '¿Cuáles son los plazos fiscales para 2025?', 'icon' => '📅' ),
                array( 'text' => '¿Qué deducciones puedo reclamar?', 'icon' => '💰' ),
                array( 'text' => '¿Cómo presento el formulario W-4?', 'icon' => '📄' ),
                array( 'text' => '¿Qué es el impuesto de trabajo autónomo?', 'icon' => '🏢' ),
            ),
            'tr' => array(
                array( 'text' => '2025 vergi son tarihleri nelerdir?', 'icon' => '📅' ),
                array( 'text' => 'Hangi indirimleri talep edebilirim?', 'icon' => '💰' ),
                array( 'text' => 'W-4 formunu nasıl doldururum?', 'icon' => '📄' ),
                array( 'text' => 'Serbest meslek vergisi nedir?', 'icon' => '🏢' ),
            ),
            'fr' => array(
                array( 'text' => 'Quelles sont les dates limites fiscales pour 2025?', 'icon' => '📅' ),
                array( 'text' => 'Quelles déductions puis-je réclamer?', 'icon' => '💰' ),
                array( 'text' => 'Comment remplir le formulaire W-4?', 'icon' => '📄' ),
            ),
            'zh' => array(
                array( 'text' => '2025年的税务截止日期是什么？', 'icon' => '📅' ),
                array( 'text' => '我可以申请哪些扣除？', 'icon' => '💰' ),
                array( 'text' => '如何填写W-4表格？', 'icon' => '📄' ),
            ),
            'ru' => array(
                array( 'text' => 'Какие налоговые сроки на 2025 год?', 'icon' => '📅' ),
                array( 'text' => 'Какие вычеты я могу получить?', 'icon' => '💰' ),
                array( 'text' => 'Как заполнить форму W-4?', 'icon' => '📄' ),
            ),
        );

        // Default to English suggestions if language not found
        return isset( $all_suggestions[ $lang ] ) ? $all_suggestions[ $lang ] : $all_suggestions['en'];
    }

    /**
     * Call Ollama API
     */
    private function call_ollama_api( $messages, $temperature = 0.7 ) {
        $payload = array(
            'model'       => $this->model,
            'messages'    => $messages,
            'stream'      => false,
            'temperature' => $temperature,
        );

        $args = array(
            'method'   => 'POST',
            'body'     => json_encode( $payload ),
            'headers'  => array( 'Content-Type' => 'application/json' ),
            'timeout'  => 120,
            'blocking' => true,
        );

        return wp_remote_post( trailingslashit( $this->ollama_url ) . 'api/chat', $args );
    }

    /**
     * Get language display name
     */
    private function get_language_name( $code ) {
        $languages = self::get_available_languages();
        return isset( $languages[ $code ] ) ? $languages[ $code ] : $code;
    }

    /**
     * Get all available languages
     */
    public static function get_available_languages() {
        return array(
            'auto' => '🔍 Auto-Detect',
            'en'   => '🇺🇸 English',
            'ar'   => '🇸🇦 العربية',
            'ku'   => '🇮🇶 کوردی',
            'fa'   => '🇮🇷 فارسی',
            'es'   => '🇪🇸 Español',
            'fr'   => '🇫🇷 Français',
            'de'   => '🇩🇪 Deutsch',
            'tr'   => '🇹🇷 Türkçe',
            'zh'   => '🇨🇳 中文',
            'ru'   => '🇷🇺 Русский',
            'hi'   => '🇮🇳 हिन्दी',
            'pt'   => '🇧🇷 Português',
            'ja'   => '🇯🇵 日本語',
            'ko'   => '🇰🇷 한국어',
        );
    }
}
