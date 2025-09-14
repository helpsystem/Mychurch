--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (84ade85)
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bible_books; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.bible_books (
    id integer NOT NULL,
    book_number integer NOT NULL,
    name_en character varying(255) NOT NULL,
    name_fa character varying(255) NOT NULL,
    abbreviation character varying(10) NOT NULL,
    testament character varying(10) NOT NULL,
    chapters_count integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.bible_books OWNER TO neondb_owner;

--
-- Name: bible_books_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.bible_books_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bible_books_id_seq OWNER TO neondb_owner;

--
-- Name: bible_books_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.bible_books_id_seq OWNED BY public.bible_books.id;


--
-- Name: bible_chapters; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.bible_chapters (
    id integer NOT NULL,
    book_id integer,
    chapter_number integer NOT NULL,
    verses_count integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.bible_chapters OWNER TO neondb_owner;

--
-- Name: bible_chapters_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.bible_chapters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bible_chapters_id_seq OWNER TO neondb_owner;

--
-- Name: bible_chapters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.bible_chapters_id_seq OWNED BY public.bible_chapters.id;


--
-- Name: bible_verses; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.bible_verses (
    id integer NOT NULL,
    chapter_id integer,
    verse_number integer NOT NULL,
    text_en text NOT NULL,
    text_fa text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.bible_verses OWNER TO neondb_owner;

--
-- Name: bible_verses_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.bible_verses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bible_verses_id_seq OWNER TO neondb_owner;

--
-- Name: bible_verses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.bible_verses_id_seq OWNED BY public.bible_verses.id;


--
-- Name: church_announcements; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.church_announcements (
    id integer NOT NULL,
    title_en text NOT NULL,
    title_fa text,
    content_en text NOT NULL,
    content_fa text,
    announcement_type character varying(50) DEFAULT 'general'::character varying,
    priority character varying(20) DEFAULT 'normal'::character varying,
    target_audience jsonb DEFAULT '["all"]'::jsonb,
    channels jsonb DEFAULT '["website"]'::jsonb,
    auto_translate boolean DEFAULT false,
    source_language character varying(5) DEFAULT 'en'::character varying,
    author_id integer,
    author_email character varying(255),
    status character varying(20) DEFAULT 'draft'::character varying,
    publish_date timestamp without time zone,
    expiry_date timestamp without time zone,
    reference_number character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.church_announcements OWNER TO neondb_owner;

--
-- Name: church_announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.church_announcements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.church_announcements_id_seq OWNER TO neondb_owner;

--
-- Name: church_announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.church_announcements_id_seq OWNED BY public.church_announcements.id;


--
-- Name: church_letters; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.church_letters (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    from_field jsonb DEFAULT '{}'::jsonb,
    to_field jsonb DEFAULT '{}'::jsonb,
    requested_by jsonb DEFAULT '{}'::jsonb,
    body jsonb DEFAULT '{}'::jsonb,
    author_email character varying(255),
    authorized_users jsonb DEFAULT '[]'::jsonb
);


ALTER TABLE public.church_letters OWNER TO neondb_owner;

--
-- Name: church_letters_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.church_letters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.church_letters_id_seq OWNER TO neondb_owner;

--
-- Name: church_letters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.church_letters_id_seq OWNED BY public.church_letters.id;


--
-- Name: daily_contents; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.daily_contents (
    id integer NOT NULL,
    date date NOT NULL,
    scripture jsonb,
    worship_song jsonb,
    devotional_theme jsonb,
    is_active boolean DEFAULT true,
    created_by character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.daily_contents OWNER TO neondb_owner;

--
-- Name: daily_contents_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.daily_contents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.daily_contents_id_seq OWNER TO neondb_owner;

--
-- Name: daily_contents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.daily_contents_id_seq OWNED BY public.daily_contents.id;


--
-- Name: daily_messages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.daily_messages (
    id integer NOT NULL,
    title jsonb NOT NULL,
    content jsonb NOT NULL,
    bible_verse jsonb,
    scheduled_date date NOT NULL,
    scheduled_time time without time zone NOT NULL,
    channels jsonb DEFAULT '["website"]'::jsonb NOT NULL,
    is_published boolean DEFAULT false,
    sent_at timestamp without time zone,
    recipient_count integer DEFAULT 0,
    created_by character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.daily_messages OWNER TO neondb_owner;

--
-- Name: daily_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.daily_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.daily_messages_id_seq OWNER TO neondb_owner;

--
-- Name: daily_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.daily_messages_id_seq OWNED BY public.daily_messages.id;


--
-- Name: environment_variables; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.environment_variables (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    value text NOT NULL,
    is_secret boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.environment_variables OWNER TO neondb_owner;

--
-- Name: environment_variables_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.environment_variables_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.environment_variables_id_seq OWNER TO neondb_owner;

--
-- Name: environment_variables_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.environment_variables_id_seq OWNED BY public.environment_variables.id;


--
-- Name: events; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.events (
    id integer NOT NULL,
    title jsonb NOT NULL,
    date jsonb NOT NULL,
    description jsonb NOT NULL,
    imageurl character varying(500) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    location jsonb DEFAULT '{}'::jsonb,
    starttime time without time zone,
    endtime time without time zone
);


ALTER TABLE public.events OWNER TO neondb_owner;

--
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.events_id_seq OWNER TO neondb_owner;

--
-- Name: events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;


--
-- Name: files; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.files (
    id character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    path character varying(500) NOT NULL,
    url character varying(500) NOT NULL,
    size integer NOT NULL,
    type character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.files OWNER TO neondb_owner;

--
-- Name: galleries; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.galleries (
    id integer NOT NULL,
    title jsonb NOT NULL,
    description jsonb DEFAULT '{}'::jsonb,
    images jsonb DEFAULT '[]'::jsonb,
    coverimage character varying(500),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.galleries OWNER TO neondb_owner;

--
-- Name: galleries_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.galleries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.galleries_id_seq OWNER TO neondb_owner;

--
-- Name: galleries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.galleries_id_seq OWNED BY public.galleries.id;


--
-- Name: leaders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.leaders (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    title jsonb NOT NULL,
    imageurl character varying(500),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    bio jsonb DEFAULT '{}'::jsonb,
    whatsappnumber character varying(50)
);


ALTER TABLE public.leaders OWNER TO neondb_owner;

--
-- Name: leaders_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.leaders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leaders_id_seq OWNER TO neondb_owner;

--
-- Name: leaders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.leaders_id_seq OWNED BY public.leaders.id;


--
-- Name: message_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.message_logs (
    id integer NOT NULL,
    reference_id integer,
    reference_type character varying(50),
    channel character varying(50),
    recipient_type character varying(50),
    recipient_address text,
    language character varying(5),
    subject_en text,
    subject_fa text,
    content_en text,
    content_fa text,
    status character varying(20) DEFAULT 'pending'::character varying,
    sent_at timestamp without time zone,
    delivery_status character varying(50),
    error_message text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.message_logs OWNER TO neondb_owner;

--
-- Name: message_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.message_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.message_logs_id_seq OWNER TO neondb_owner;

--
-- Name: message_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.message_logs_id_seq OWNED BY public.message_logs.id;


--
-- Name: pages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pages (
    id integer NOT NULL,
    slug character varying(255) NOT NULL,
    title jsonb NOT NULL,
    content jsonb NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pages_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'published'::character varying])::text[])))
);


ALTER TABLE public.pages OWNER TO neondb_owner;

--
-- Name: pages_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.pages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pages_id_seq OWNER TO neondb_owner;

--
-- Name: pages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.pages_id_seq OWNED BY public.pages.id;


--
-- Name: prayer_requests; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.prayer_requests (
    id integer NOT NULL,
    text text NOT NULL,
    category character varying(50) DEFAULT 'other'::character varying,
    is_anonymous boolean DEFAULT false,
    author_name character varying(255),
    author_email character varying(255),
    author_phone character varying(50),
    prayer_count integer DEFAULT 0,
    urgency character varying(20) DEFAULT 'normal'::character varying,
    is_public boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT prayer_requests_category_check CHECK (((category)::text = ANY ((ARRAY['thanksgiving'::character varying, 'healing'::character varying, 'guidance'::character varying, 'family'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT prayer_requests_urgency_check CHECK (((urgency)::text = ANY ((ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'urgent'::character varying])::text[])))
);


ALTER TABLE public.prayer_requests OWNER TO neondb_owner;

--
-- Name: prayer_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.prayer_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.prayer_requests_id_seq OWNER TO neondb_owner;

--
-- Name: prayer_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.prayer_requests_id_seq OWNED BY public.prayer_requests.id;


--
-- Name: prayers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.prayers (
    id integer NOT NULL,
    title jsonb NOT NULL,
    description jsonb NOT NULL,
    author character varying(255) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT prayers_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.prayers OWNER TO neondb_owner;

--
-- Name: prayers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.prayers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.prayers_id_seq OWNER TO neondb_owner;

--
-- Name: prayers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.prayers_id_seq OWNED BY public.prayers.id;


--
-- Name: presentations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.presentations (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    slides jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_by character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.presentations OWNER TO neondb_owner;

--
-- Name: presentations_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.presentations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.presentations_id_seq OWNER TO neondb_owner;

--
-- Name: presentations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.presentations_id_seq OWNED BY public.presentations.id;


--
-- Name: schedule_events; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.schedule_events (
    id integer NOT NULL,
    title jsonb NOT NULL,
    description jsonb NOT NULL,
    leader character varying(255) NOT NULL,
    date date NOT NULL,
    starttime time without time zone NOT NULL,
    endtime time without time zone NOT NULL,
    type character varying(20) NOT NULL,
    location character varying(500) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT schedule_events_type_check CHECK (((type)::text = ANY ((ARRAY['in-person'::character varying, 'online'::character varying, 'hybrid'::character varying])::text[])))
);


ALTER TABLE public.schedule_events OWNER TO neondb_owner;

--
-- Name: schedule_events_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.schedule_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.schedule_events_id_seq OWNER TO neondb_owner;

--
-- Name: schedule_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.schedule_events_id_seq OWNED BY public.schedule_events.id;


--
-- Name: sermons; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sermons (
    id integer NOT NULL,
    title jsonb NOT NULL,
    speaker character varying(255) NOT NULL,
    date date NOT NULL,
    audiourl character varying(500) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    series jsonb DEFAULT '{}'::jsonb,
    notesurl character varying(500)
);


ALTER TABLE public.sermons OWNER TO neondb_owner;

--
-- Name: sermons_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sermons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sermons_id_seq OWNER TO neondb_owner;

--
-- Name: sermons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sermons_id_seq OWNED BY public.sermons.id;


--
-- Name: settings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.settings (
    id integer NOT NULL,
    key character varying(255) NOT NULL,
    value jsonb NOT NULL,
    description text,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.settings OWNER TO neondb_owner;

--
-- Name: settings_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.settings_id_seq OWNER TO neondb_owner;

--
-- Name: settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.settings_id_seq OWNED BY public.settings.id;


--
-- Name: testimonials; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.testimonials (
    id integer NOT NULL,
    title jsonb NOT NULL,
    content jsonb NOT NULL,
    author character varying(255) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT testimonials_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.testimonials OWNER TO neondb_owner;

--
-- Name: testimonials_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.testimonials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.testimonials_id_seq OWNER TO neondb_owner;

--
-- Name: testimonials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.testimonials_id_seq OWNED BY public.testimonials.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(20) NOT NULL,
    permissions jsonb DEFAULT '[]'::jsonb,
    profiledata jsonb DEFAULT '{}'::jsonb,
    invitations jsonb DEFAULT '[]'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['USER'::character varying, 'MANAGER'::character varying, 'SUPER_ADMIN'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: worship_songs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.worship_songs (
    id integer NOT NULL,
    title jsonb NOT NULL,
    artist character varying(255) NOT NULL,
    youtubeid character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    lyrics jsonb DEFAULT '{}'::jsonb,
    audiourl character varying(500),
    videourl character varying(500)
);


ALTER TABLE public.worship_songs OWNER TO neondb_owner;

--
-- Name: worship_songs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.worship_songs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.worship_songs_id_seq OWNER TO neondb_owner;

--
-- Name: worship_songs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.worship_songs_id_seq OWNED BY public.worship_songs.id;


--
-- Name: bible_books id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bible_books ALTER COLUMN id SET DEFAULT nextval('public.bible_books_id_seq'::regclass);


--
-- Name: bible_chapters id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bible_chapters ALTER COLUMN id SET DEFAULT nextval('public.bible_chapters_id_seq'::regclass);


--
-- Name: bible_verses id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bible_verses ALTER COLUMN id SET DEFAULT nextval('public.bible_verses_id_seq'::regclass);


--
-- Name: church_announcements id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.church_announcements ALTER COLUMN id SET DEFAULT nextval('public.church_announcements_id_seq'::regclass);


--
-- Name: church_letters id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.church_letters ALTER COLUMN id SET DEFAULT nextval('public.church_letters_id_seq'::regclass);


--
-- Name: daily_contents id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.daily_contents ALTER COLUMN id SET DEFAULT nextval('public.daily_contents_id_seq'::regclass);


--
-- Name: daily_messages id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.daily_messages ALTER COLUMN id SET DEFAULT nextval('public.daily_messages_id_seq'::regclass);


--
-- Name: environment_variables id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.environment_variables ALTER COLUMN id SET DEFAULT nextval('public.environment_variables_id_seq'::regclass);


--
-- Name: events id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);


--
-- Name: galleries id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.galleries ALTER COLUMN id SET DEFAULT nextval('public.galleries_id_seq'::regclass);


--
-- Name: leaders id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.leaders ALTER COLUMN id SET DEFAULT nextval('public.leaders_id_seq'::regclass);


--
-- Name: message_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.message_logs ALTER COLUMN id SET DEFAULT nextval('public.message_logs_id_seq'::regclass);


--
-- Name: pages id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pages ALTER COLUMN id SET DEFAULT nextval('public.pages_id_seq'::regclass);


--
-- Name: prayer_requests id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.prayer_requests ALTER COLUMN id SET DEFAULT nextval('public.prayer_requests_id_seq'::regclass);


--
-- Name: prayers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.prayers ALTER COLUMN id SET DEFAULT nextval('public.prayers_id_seq'::regclass);


--
-- Name: presentations id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.presentations ALTER COLUMN id SET DEFAULT nextval('public.presentations_id_seq'::regclass);


--
-- Name: schedule_events id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.schedule_events ALTER COLUMN id SET DEFAULT nextval('public.schedule_events_id_seq'::regclass);


--
-- Name: sermons id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sermons ALTER COLUMN id SET DEFAULT nextval('public.sermons_id_seq'::regclass);


--
-- Name: settings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.settings ALTER COLUMN id SET DEFAULT nextval('public.settings_id_seq'::regclass);


--
-- Name: testimonials id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.testimonials ALTER COLUMN id SET DEFAULT nextval('public.testimonials_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: worship_songs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.worship_songs ALTER COLUMN id SET DEFAULT nextval('public.worship_songs_id_seq'::regclass);


--
-- Data for Name: bible_books; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.bible_books (id, book_number, name_en, name_fa, abbreviation, testament, chapters_count, created_at) FROM stdin;
43	26	Ezekiel	حزقیال	Ezek	OT	48	2025-09-09 17:17:01.431193
44	27	Daniel	دانیال	Dan	OT	12	2025-09-09 17:17:01.496041
45	28	Hosea	هوشع	Hos	OT	14	2025-09-09 17:17:01.561014
46	29	Joel	یوئیل	Joel	OT	3	2025-09-09 17:17:01.626321
47	30	Amos	عاموس	Amos	OT	9	2025-09-09 17:17:01.691461
64	47	2 Corinthians	دوم قرنتیان	2Cor	NT	13	2025-09-09 17:17:02.802756
65	48	Galatians	غلاطیان	Gal	NT	6	2025-09-09 17:17:02.874261
66	49	Ephesians	افسسیان	Eph	NT	6	2025-09-09 17:17:02.939304
17	66	Revelation	مکاشفۀ یوحنا	Rev	NT	22	2025-09-09 16:32:21.901234
23	6	Joshua	یوشع	Josh	OT	24	2025-09-09 17:17:00.119902
24	7	Judges	داوران	Judg	OT	21	2025-09-09 17:17:00.188585
25	8	Ruth	روت	Ruth	OT	4	2025-09-09 17:17:00.253579
26	9	1 Samuel	اول سموئیل	1Sam	OT	31	2025-09-09 17:17:00.319145
27	10	2 Samuel	دوم سموئیل	2Sam	OT	24	2025-09-09 17:17:00.384437
28	11	1 Kings	اول پادشاهان	1Kgs	OT	22	2025-09-09 17:17:00.449767
29	12	2 Kings	دوم پادشاهان	2Kgs	OT	25	2025-09-09 17:17:00.515104
48	31	Obadiah	عوبدیا	Obad	OT	1	2025-09-09 17:17:01.756748
49	32	Jonah	یونس	Jonah	OT	4	2025-09-09 17:17:01.8216
50	33	Micah	میکاه	Mic	OT	7	2025-09-09 17:17:01.887013
51	34	Nahum	ناحوم	Nah	OT	3	2025-09-09 17:17:01.952249
52	35	Habakkuk	حبقوق	Hab	OT	3	2025-09-09 17:17:02.017198
53	36	Zephaniah	صفنیا	Zeph	OT	3	2025-09-09 17:17:02.082308
54	37	Haggai	حجی	Hag	OT	2	2025-09-09 17:17:02.147457
55	38	Zechariah	زکریا	Zech	OT	14	2025-09-09 17:17:02.212338
56	39	Malachi	ملاکی	Mal	OT	4	2025-09-09 17:17:02.279889
9	40	Matthew	متی	Matt	NT	28	2025-09-09 16:32:21.901234
10	41	Mark	مرقس	Mark	NT	16	2025-09-09 16:32:21.901234
11	42	Luke	لوقا	Luke	NT	24	2025-09-09 16:32:21.901234
12	43	John	یوحنا	John	NT	21	2025-09-09 16:32:21.901234
13	44	Acts	اعمال رسولان	Acts	NT	28	2025-09-09 16:32:21.901234
14	45	Romans	رومیان	Rom	NT	16	2025-09-09 16:32:21.901234
67	50	Philippians	فیلیپیان	Phil	NT	4	2025-09-09 17:17:03.004858
68	51	Colossians	کولسیان	Col	NT	4	2025-09-09 17:17:03.070329
69	52	1 Thessalonians	اول تسالونیکیان	1Thess	NT	5	2025-09-09 17:17:03.13561
70	53	2 Thessalonians	دوم تسالونیکیان	2Thess	NT	3	2025-09-09 17:17:03.214839
71	54	1 Timothy	اول تیموتائوس	1Tim	NT	6	2025-09-09 17:17:03.282455
72	55	2 Timothy	دوم تیموتائوس	2Tim	NT	4	2025-09-09 17:17:03.348789
73	56	Titus	تیطس	Titus	NT	3	2025-09-09 17:17:03.413875
74	57	Philemon	فیلیمون	Phlm	NT	1	2025-09-09 17:17:03.479434
16	58	Hebrews	عبرانیان	Heb	NT	13	2025-09-09 16:32:21.901234
76	59	James	یعقوب	Jas	NT	5	2025-09-09 17:17:03.609997
77	60	1 Peter	اول پطرس	1Pet	NT	5	2025-09-09 17:17:03.675813
78	61	2 Peter	دوم پطرس	2Pet	NT	3	2025-09-09 17:17:03.742799
79	62	1 John	اول یوحنا	1John	NT	5	2025-09-09 17:17:03.810219
80	63	2 John	دوم یوحنا	2John	NT	1	2025-09-09 17:17:03.878597
81	64	3 John	سوم یوحنا	3John	NT	1	2025-09-09 17:17:03.944019
82	65	Jude	یهودا	Jude	NT	1	2025-09-09 17:17:04.008968
1	1	Genesis	پیدایش	Gen	OT	50	2025-09-09 16:32:21.901234
2	2	Exodus	خروج	Ex	OT	40	2025-09-09 16:32:21.901234
3	3	Leviticus	لاویان	Lev	OT	27	2025-09-09 16:32:21.901234
4	4	Numbers	اعداد	Num	OT	36	2025-09-09 16:32:21.901234
5	5	Deuteronomy	تثنیه	Dt	OT	34	2025-09-09 16:32:21.901234
30	13	1 Chronicles	اول تواریخ	1Chr	OT	29	2025-09-09 17:17:00.580209
31	14	2 Chronicles	دوم تواریخ	2Chr	OT	36	2025-09-09 17:17:00.646545
32	15	Ezra	عزرا	Ezra	OT	10	2025-09-09 17:17:00.711587
33	16	Nehemiah	نحمیا	Neh	OT	13	2025-09-09 17:17:00.776927
34	17	Esther	استر	Est	OT	10	2025-09-09 17:17:00.843257
35	18	Job	ایوب	Job	OT	42	2025-09-09 17:17:00.908948
6	19	Psalms	مزامیر	Ps	OT	150	2025-09-09 16:32:21.901234
7	20	Proverbs	امثال سلیمان	Prov	OT	31	2025-09-09 16:32:21.901234
38	21	Ecclesiastes	جامعه	Eccl	OT	12	2025-09-09 17:17:01.104237
39	22	Song of Songs	غزل غزلهای سلیمان	Song	OT	8	2025-09-09 17:17:01.169282
8	23	Isaiah	اشعیا	Isa	OT	66	2025-09-09 16:32:21.901234
41	24	Jeremiah	ارمیا	Jer	OT	52	2025-09-09 17:17:01.300119
42	25	Lamentations	مراثی ارمیا	Lam	OT	5	2025-09-09 17:17:01.365775
15	46	1 Corinthians	اول قرنتیان	1Cor	NT	16	2025-09-09 16:32:21.901234
\.


--
-- Data for Name: bible_chapters; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.bible_chapters (id, book_id, chapter_number, verses_count, created_at) FROM stdin;
2	1	2	25	2025-09-09 16:32:24.084748
3	1	3	24	2025-09-09 16:32:24.084748
4	12	1	51	2025-09-09 16:32:24.084748
5	12	2	25	2025-09-09 16:32:24.084748
6	12	3	36	2025-09-09 16:32:24.084748
7	12	4	54	2025-09-09 16:32:24.084748
8	14	1	32	2025-09-09 16:32:24.084748
9	14	2	29	2025-09-09 16:32:24.084748
10	14	3	31	2025-09-09 16:32:24.084748
1	1	1	17	2025-09-09 16:32:24.084748
\.


--
-- Data for Name: bible_verses; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.bible_verses (id, chapter_id, verse_number, text_en, text_fa, created_at) FROM stdin;
1	1	1	English verse 1 of chapter 1 in book 1 (placeholder - to be updated with real English Bible API)	در ابتدا، خدا آسمانها و زمین‌ را آفرید.	2025-09-09 17:20:18.099307
2	1	2	English verse 2 of chapter 1 in book 1 (placeholder - to be updated with real English Bible API)	وزمین‌ تهی‌ و بایر بود و تاریكی‌ بر روی‌ لجه‌ و روح‌ خدا سطح‌ آبها را فرو گرفت‌.	2025-09-09 17:20:18.172457
3	1	3	English verse 3 of chapter 1 in book 1 (placeholder - to be updated with real English Bible API)	و خدا روشنایی‌ را دید كه‌ نیكوست‌ و خدا روشنایی‌ را از تاریكی‌ جدا ساخت‌.	2025-09-09 17:20:18.237531
4	1	4	English verse 4 of chapter 1 in book 1 (placeholder - to be updated with real English Bible API)	و خدا روشنایی‌ را روز نامید و تاریكی‌ را شب‌ نامید. و شام‌ بود و صبح‌ بود، روزی‌ اول‌.	2025-09-09 17:20:18.302522
5	1	5	English verse 5 of chapter 1 in book 1 (placeholder - to be updated with real English Bible API)	و خدا فلك‌ را بساخت‌ و آبهای‌ زیر فلك‌ را از آبهای‌ بالای‌ فلك‌ جدا كرد. و چنین‌ شد.	2025-09-09 17:20:18.367634
6	1	6	English verse 6 of chapter 1 in book 1 (placeholder - to be updated with real English Bible API)	و خدا فلك‌ را آسمان‌ نامید. و شام‌ بود و صبح‌ بود، روزی‌ دوم‌.	2025-09-09 17:20:18.43263
7	1	7	English verse 7 of chapter 1 in book 1 (placeholder - to be updated with real English Bible API)	و خدا خشكی‌ را زمین‌ نامید و اجتماع‌ آبها را دریا نامید. و خدا دید كه‌ نیكوست‌.	2025-09-09 17:20:18.497714
8	1	8	English verse 8 of chapter 1 in book 1 (placeholder - to be updated with real English Bible API)	و زمین‌ نباتات‌ را رویانید، علفی‌ كه‌ موافق‌ جنس‌ خود تخم‌ آورد و درخت‌ میوه‌داری‌ كه‌ تخمش‌ در آن‌، موافق‌ جنس‌ خود باشد. و خدا دید كه‌ نیكوست‌.	2025-09-09 17:20:18.562704
9	1	9	English verse 9 of chapter 1 in book 1 (placeholder - to be updated with real English Bible API)	و خدا دو نیر بزرگ‌ ساخت‌، نیر اعظم‌ را برای‌ سلطنت‌ روز و نیر اصغر را برای‌ سلطنت‌ شب‌، و ستارگان‌ را.	2025-09-09 17:20:18.6278
10	1	10	English verse 10 of chapter 1 in book 1 (placeholder - to be updated with real English Bible API)	و خدا آنها را در فلك‌ آسمان‌ گذاشت‌ تا بر زمین‌ روشنایی‌ دهند،	2025-09-09 17:20:18.692786
11	1	11	English verse 11 of chapter 1 in book 1 (placeholder - to be updated with real English Bible API)	و تا سلطنت‌ نمایند بر روز و بر شب‌، و روشنایی‌ را از تاریكی‌ جدا كنند. و خدا دید كه‌ نیكوست‌.	2025-09-09 17:20:18.757768
12	1	12	English verse 12 of chapter 1 in book 1 (placeholder - to be updated with real English Bible API)	پس‌ خدا نهنگان‌ بزرگ‌ آفرید و همۀ جانداران‌ خزنده‌ را، كه‌ آبها از آنها موافق‌ اجناس‌ آنها پر شد، و همۀ پرندگان‌ بالدار را به‌ اجناس‌ آنها. و خدا دید كه‌ نیكوست‌.	2025-09-09 17:20:18.822542
13	1	13	English verse 13 of chapter 1 in book 1 (placeholder - to be updated with real English Bible API)	و خدا آنها را بركت‌ داده‌، گفت‌	2025-09-09 17:20:18.887625
14	1	14	English verse 14 of chapter 1 in book 1 (placeholder - to be updated with real English Bible API)	پس‌ خدا حیوانات‌ زمین‌ را به‌ اجناس‌ آنها بساخت‌ و بهایم‌ را به‌ اجناس‌ آنها و همۀ حشرات‌ زمین‌ را به‌ اجناس‌ آنها. و خدا دید كه‌ نیكوست‌.	2025-09-09 17:20:18.958002
15	1	15	English verse 15 of chapter 1 in book 1 (placeholder - to be updated with real English Bible API)	پس‌ خدا آدم‌ را بصورت‌ خود آفرید. او را بصورت‌ خدا آفرید. ایشان‌ را نر و ماده‌ آفرید.	2025-09-09 17:20:19.023118
16	1	16	English verse 16 of chapter 1 in book 1 (placeholder - to be updated with real English Bible API)	و خدا ایشان‌ را بركت‌ داد و خدا بدیشان‌ گفت‌	2025-09-09 17:20:19.088135
17	1	17	English verse 17 of chapter 1 in book 1 (placeholder - to be updated with real English Bible API)	و خدا هر چه‌ ساختـه‌ بـود، دیـد و همانـا بسیار نیكـو بود. و شام‌ بـود و صبح‌ بـود، روز ششـم‌.	2025-09-09 17:20:19.15355
\.


--
-- Data for Name: church_announcements; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.church_announcements (id, title_en, title_fa, content_en, content_fa, announcement_type, priority, target_audience, channels, auto_translate, source_language, author_id, author_email, status, publish_date, expiry_date, reference_number, created_at, updated_at) FROM stdin;
2	Christmas Eve Service	\N	Join us for a special Christmas Eve service on December 24th at 6:00 PM, celebrating the Nativity of our Lord Jesus Christ.  We will share in carol singing, special prayers, and fellowship.  All members and visitors are warmly welcome.	\N	event	high	["all"]	["website", "email", "sms", "whatsapp"]	t	en	\N	help.system@ymail.com	published	2025-12-20 10:00:00	\N	EVT-20250911-907	2025-09-11 20:48:47.198907	2025-09-11 20:49:07.855613
1	Church Service Update	به‌روزرسانی مراسم کلیسا	Dear church family, please note that this Sunday we will have a special prayer service starting at 10:00 AM. All are welcome to join us for this meaningful time of worship and fellowship.	خانواده‌ی محترم کلیسا، به اطلاع می‌رساند که این یکشنبه، مراسم نیایش ویژه‌ای از ساعت ۱۰:۰۰ صبح برگزار خواهد شد. حضور همه شما عزیزان در این لحظات معنوی پر فیض عبادت و رفاقت، گرامی و خوشایند خواهد بود.	announcement	high	["all"]	["website"]	t	en	\N	help.system@ymail.com	published	2025-09-11 20:48:02.598703	\N	ANN-20250911-887	2025-09-11 20:36:56.492599	2025-09-11 20:51:06.292638
3	New Year Prayer Meeting - دعای سال نو	\N	Dear beloved church family, we invite you to join us for our special New Year prayer meeting on January 1st, 2025. Let us come together to thank God for His blessings in the past year and seek His guidance for the year ahead. The service will be held at 7:00 PM with traditional Persian hymns and prayers.	\N	event	high	["all"]	["website", "email", "sms", "whatsapp"]	t	en	\N	help.system@ymail.com	published	2024-12-25 10:00:00	\N	EVT-20250911-102	2025-09-11 20:51:25.870577	2025-09-11 20:51:27.836983
4	Test Announcement	اطلاعیه تست	This is a test announcement	این یک اطلاعیه تست است	announcement	normal	["all"]	["email", "website"]	f	en	\N	admin@church.com	published	\N	\N	MSG-20250912-001	2025-09-12 00:26:36.878141	2025-09-12 00:26:36.878141
\.


--
-- Data for Name: church_letters; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.church_letters (id, created_at, from_field, to_field, requested_by, body, author_email, authorized_users) FROM stdin;
1	2025-09-11 16:36:14.039698	{"en": "Pastor John", "fa": "کشیش جان"}	{"en": "Church Members", "fa": "اعضای کلیسا"}	{"en": "Board of Directors", "fa": "هیئت مدیره"}	{"en": "Dear church family, we are pleased to announce...", "fa": "خانواده محترم کلیسا، با خوشحالی اعلام می‌کنیم..."}	help.system@ymail.com	["help.system@ymail.com"]
2	2025-09-11 16:37:45.317375	{"en": "Rev. Javad Pishghadamian", "fa": "کشیش جواد پیشقدمیان"}	{"en": "Dear Church Family", "fa": "خانواده عزیز کلیسا"}	{"en": "Church Leadership", "fa": "رهبری کلیسا"}	{"en": "Grace and peace to you in the name of our Lord Jesus Christ.\\n\\nWe are writing to inform you about upcoming church activities and invite your participation in our spiritual journey together. Your presence and support mean everything to our community.\\n\\nMay God bless you and your families.\\n\\nIn His Service,\\nRev. Javad Pishghadamian", "fa": "فیض و صلح بر شما باد به نام خداوند ما عیسی مسیح.\\n\\nبدین وسیله در خصوص فعالیت‌های آتی کلیسا به اطلاع شما می‌رسانیم و از شما دعوت می‌کنیم تا در سفر معنوی مشترک ما شرکت نمایید. حضور و حمایت شما برای جامعه ما بسیار ارزشمند است.\\n\\nخداوند شما و خانواده‌هایتان را برکت دهد.\\n\\nدر خدمت او،\\nکشیش جواد پیشقدمیان"}	help.system@ymail.com	["help.system@ymail.com"]
\.


--
-- Data for Name: daily_contents; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.daily_contents (id, date, scripture, worship_song, devotional_theme, is_active, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: daily_messages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.daily_messages (id, title, content, bible_verse, scheduled_date, scheduled_time, channels, is_published, sent_at, recipient_count, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: environment_variables; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.environment_variables (id, name, value, is_secret, created_at) FROM stdin;
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.events (id, title, date, description, imageurl, created_at, location, starttime, endtime) FROM stdin;
\.


--
-- Data for Name: files; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.files (id, name, path, url, size, type, created_at) FROM stdin;
\.


--
-- Data for Name: galleries; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.galleries (id, title, description, images, coverimage, created_at) FROM stdin;
\.


--
-- Data for Name: leaders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.leaders (id, name, title, imageurl, created_at, bio, whatsappnumber) FROM stdin;
\.


--
-- Data for Name: message_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.message_logs (id, reference_id, reference_type, channel, recipient_type, recipient_address, language, subject_en, subject_fa, content_en, content_fa, status, sent_at, delivery_status, error_message, metadata, created_at) FROM stdin;
1	1	announcement	website	broadcast	multiple	fa	Church Service Update	به‌روزرسانی مراسم کلیسا	Dear church family, please note that this Sunday we will have a special prayer service starting at 10:00 AM. All are welcome to join us for this meaningful time of worship and fellowship.	خانواده‌ی محترم کلیسا، به اطلاع می‌رساند که این یکشنبه، مراسم نیایش ویژه‌ای از ساعت ۱۰:۰۰ صبح برگزار خواهد شد. حضور همه شما عزیزان در این لحظات معنوی پر فیض عبادت و رفاقت، گرامی و خوشایند خواهد بود.	sent	2025-09-11 20:51:06.192	delivered	\N	{"url": "/announcements/ANN-20250911-887", "success": true, "provider": "website", "messageId": "website_1757623866193", "recipientCount": 1}	2025-09-11 20:51:06.216834
2	3	announcement	website	broadcast	multiple	both	New Year Prayer Meeting - دعای سال نو		Dear beloved church family, we invite you to join us for our special New Year prayer meeting on January 1st, 2025. Let us come together to thank God for His blessings in the past year and seek His guidance for the year ahead. The service will be held at 7:00 PM with traditional Persian hymns and prayers.		sent	2025-09-11 20:51:27.556	delivered	\N	{"url": "/announcements/EVT-20250911-102", "success": true, "provider": "website", "messageId": "website_1757623887557", "recipientCount": 1}	2025-09-11 20:51:27.580522
3	3	announcement	email	broadcast	multiple	both	New Year Prayer Meeting - دعای سال نو		Dear beloved church family, we invite you to join us for our special New Year prayer meeting on January 1st, 2025. Let us come together to thank God for His blessings in the past year and seek His guidance for the year ahead. The service will be held at 7:00 PM with traditional Persian hymns and prayers.		sent	2025-09-11 20:51:27.556	delivered	\N	{"success": true, "provider": "mock-email", "messageId": "email_1757623887622", "recipientCount": 3}	2025-09-11 20:51:27.645407
4	3	announcement	sms	broadcast	multiple	both	New Year Prayer Meeting - دعای سال نو		Dear beloved church family, we invite you to join us for our special New Year prayer meeting on January 1st, 2025. Let us come together to thank God for His blessings in the past year and seek His guidance for the year ahead. The service will be held at 7:00 PM with traditional Persian hymns and prayers.		sent	2025-09-11 20:51:27.556	delivered	\N	{"success": true, "provider": "mock-sms", "messageId": "sms_1757623887686", "recipientCount": 2}	2025-09-11 20:51:27.709978
5	3	announcement	whatsapp	broadcast	multiple	both	New Year Prayer Meeting - دعای سال نو		Dear beloved church family, we invite you to join us for our special New Year prayer meeting on January 1st, 2025. Let us come together to thank God for His blessings in the past year and seek His guidance for the year ahead. The service will be held at 7:00 PM with traditional Persian hymns and prayers.		sent	2025-09-11 20:51:27.556	delivered	\N	{"success": true, "provider": "mock-whatsapp", "messageId": "whatsapp_1757623887750", "recipientCount": 2}	2025-09-11 20:51:27.773911
\.


--
-- Data for Name: pages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.pages (id, slug, title, content, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: prayer_requests; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.prayer_requests (id, text, category, is_anonymous, author_name, author_email, author_phone, prayer_count, urgency, is_public, created_at) FROM stdin;
1	Please pray for healing and peace in our community	healing	f	Test User	test@example.com	\N	1	normal	t	2025-09-12 00:54:04.512016
\.


--
-- Data for Name: prayers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.prayers (id, title, description, author, status, created_at) FROM stdin;
\.


--
-- Data for Name: presentations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.presentations (id, title, slides, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: schedule_events; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.schedule_events (id, title, description, leader, date, starttime, endtime, type, location, created_at) FROM stdin;
\.


--
-- Data for Name: sermons; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sermons (id, title, speaker, date, audiourl, created_at, series, notesurl) FROM stdin;
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.settings (id, key, value, description, updated_at) FROM stdin;
\.


--
-- Data for Name: testimonials; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.testimonials (id, title, content, author, status, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, password, role, permissions, profiledata, invitations, created_at) FROM stdin;
2	help.system@ymail.com	$2b$10$PAGinR7E3u8oY36O3wGNrer/edPy.w1igO086Ow4UHSiPiGPwitXi	SUPER_ADMIN	["all"]	{}	[]	2025-09-09 19:12:57.884781
3	test.member@church.com		USER	[]	{"name": "", "imageUrl": ""}	[{"date": "2025-09-11T15:08:43.623Z", "invitedBy": "help.system@ymail.com"}]	2025-09-11 15:08:43.658092
\.


--
-- Data for Name: worship_songs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.worship_songs (id, title, artist, youtubeid, created_at, lyrics, audiourl, videourl) FROM stdin;
\.


--
-- Name: bible_books_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.bible_books_id_seq', 215, true);


--
-- Name: bible_chapters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.bible_chapters_id_seq', 11, true);


--
-- Name: bible_verses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.bible_verses_id_seq', 17, true);


--
-- Name: church_announcements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.church_announcements_id_seq', 4, true);


--
-- Name: church_letters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.church_letters_id_seq', 2, true);


--
-- Name: daily_contents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.daily_contents_id_seq', 1, false);


--
-- Name: daily_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.daily_messages_id_seq', 1, false);


--
-- Name: environment_variables_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.environment_variables_id_seq', 1, false);


--
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.events_id_seq', 1, false);


--
-- Name: galleries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.galleries_id_seq', 1, false);


--
-- Name: leaders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.leaders_id_seq', 1, false);


--
-- Name: message_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.message_logs_id_seq', 5, true);


--
-- Name: pages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.pages_id_seq', 1, false);


--
-- Name: prayer_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.prayer_requests_id_seq', 1, true);


--
-- Name: prayers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.prayers_id_seq', 1, false);


--
-- Name: presentations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.presentations_id_seq', 1, false);


--
-- Name: schedule_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.schedule_events_id_seq', 1, false);


--
-- Name: sermons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sermons_id_seq', 1, false);


--
-- Name: settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.settings_id_seq', 1, false);


--
-- Name: testimonials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.testimonials_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- Name: worship_songs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.worship_songs_id_seq', 1, false);


--
-- Name: bible_books bible_books_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bible_books
    ADD CONSTRAINT bible_books_pkey PRIMARY KEY (id);


--
-- Name: bible_chapters bible_chapters_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bible_chapters
    ADD CONSTRAINT bible_chapters_pkey PRIMARY KEY (id);


--
-- Name: bible_verses bible_verses_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bible_verses
    ADD CONSTRAINT bible_verses_pkey PRIMARY KEY (id);


--
-- Name: church_announcements church_announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.church_announcements
    ADD CONSTRAINT church_announcements_pkey PRIMARY KEY (id);


--
-- Name: church_announcements church_announcements_reference_number_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.church_announcements
    ADD CONSTRAINT church_announcements_reference_number_key UNIQUE (reference_number);


--
-- Name: church_letters church_letters_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.church_letters
    ADD CONSTRAINT church_letters_pkey PRIMARY KEY (id);


--
-- Name: daily_contents daily_contents_date_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.daily_contents
    ADD CONSTRAINT daily_contents_date_key UNIQUE (date);


--
-- Name: daily_contents daily_contents_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.daily_contents
    ADD CONSTRAINT daily_contents_pkey PRIMARY KEY (id);


--
-- Name: daily_messages daily_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.daily_messages
    ADD CONSTRAINT daily_messages_pkey PRIMARY KEY (id);


--
-- Name: daily_messages daily_messages_scheduled_date_scheduled_time_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.daily_messages
    ADD CONSTRAINT daily_messages_scheduled_date_scheduled_time_key UNIQUE (scheduled_date, scheduled_time);


--
-- Name: environment_variables environment_variables_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.environment_variables
    ADD CONSTRAINT environment_variables_name_key UNIQUE (name);


--
-- Name: environment_variables environment_variables_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.environment_variables
    ADD CONSTRAINT environment_variables_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- Name: galleries galleries_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.galleries
    ADD CONSTRAINT galleries_pkey PRIMARY KEY (id);


--
-- Name: leaders leaders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.leaders
    ADD CONSTRAINT leaders_pkey PRIMARY KEY (id);


--
-- Name: message_logs message_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.message_logs
    ADD CONSTRAINT message_logs_pkey PRIMARY KEY (id);


--
-- Name: pages pages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT pages_pkey PRIMARY KEY (id);


--
-- Name: pages pages_slug_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT pages_slug_key UNIQUE (slug);


--
-- Name: prayer_requests prayer_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.prayer_requests
    ADD CONSTRAINT prayer_requests_pkey PRIMARY KEY (id);


--
-- Name: prayers prayers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.prayers
    ADD CONSTRAINT prayers_pkey PRIMARY KEY (id);


--
-- Name: presentations presentations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.presentations
    ADD CONSTRAINT presentations_pkey PRIMARY KEY (id);


--
-- Name: schedule_events schedule_events_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.schedule_events
    ADD CONSTRAINT schedule_events_pkey PRIMARY KEY (id);


--
-- Name: sermons sermons_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sermons
    ADD CONSTRAINT sermons_pkey PRIMARY KEY (id);


--
-- Name: settings settings_key_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_key_key UNIQUE (key);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: testimonials testimonials_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.testimonials
    ADD CONSTRAINT testimonials_pkey PRIMARY KEY (id);


--
-- Name: bible_chapters unique_book_chapter; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bible_chapters
    ADD CONSTRAINT unique_book_chapter UNIQUE (book_id, chapter_number);


--
-- Name: bible_books unique_book_number; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bible_books
    ADD CONSTRAINT unique_book_number UNIQUE (book_number);


--
-- Name: bible_verses unique_chapter_verse; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bible_verses
    ADD CONSTRAINT unique_chapter_verse UNIQUE (chapter_id, verse_number);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: worship_songs worship_songs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.worship_songs
    ADD CONSTRAINT worship_songs_pkey PRIMARY KEY (id);


--
-- Name: bible_chapters bible_chapters_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bible_chapters
    ADD CONSTRAINT bible_chapters_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.bible_books(id) ON DELETE CASCADE;


--
-- Name: bible_verses bible_verses_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bible_verses
    ADD CONSTRAINT bible_verses_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.bible_chapters(id) ON DELETE CASCADE;


--
-- Name: church_announcements church_announcements_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.church_announcements
    ADD CONSTRAINT church_announcements_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

