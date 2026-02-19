--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 14.18 (Homebrew)

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

--
-- Name: assettype; Type: TYPE; Schema: public; Owner: niha_user
--

CREATE TYPE public.assettype AS ENUM (
    'EUR',
    'CEA',
    'EUA'
);


ALTER TYPE public.assettype OWNER TO niha_user;

--
-- Name: authmethod; Type: TYPE; Schema: public; Owner: niha_user
--

CREATE TYPE public.authmethod AS ENUM (
    'PASSWORD',
    'MAGIC_LINK'
);


ALTER TYPE public.authmethod OWNER TO niha_user;

--
-- Name: autotradepricemode; Type: TYPE; Schema: public; Owner: niha_user
--

CREATE TYPE public.autotradepricemode AS ENUM (
    'FIXED',
    'SPREAD_FROM_BEST',
    'PERCENTAGE_FROM_MARKET',
    'RANDOM_SPREAD'
);


ALTER TYPE public.autotradepricemode OWNER TO niha_user;

--
-- Name: autotradequantitymode; Type: TYPE; Schema: public; Owner: niha_user
--

CREATE TYPE public.autotradequantitymode AS ENUM (
    'FIXED',
    'PERCENTAGE_OF_BALANCE',
    'RANDOM_RANGE'
);


ALTER TYPE public.autotradequantitymode OWNER TO niha_user;

--
-- Name: certificatestatus; Type: TYPE; Schema: public; Owner: niha_user
--

CREATE TYPE public.certificatestatus AS ENUM (
    'AVAILABLE',
    'RESERVED',
    'SOLD'
);


ALTER TYPE public.certificatestatus OWNER TO niha_user;

--
-- Name: certificatetype; Type: TYPE; Schema: public; Owner: niha_user
--

CREATE TYPE public.certificatetype AS ENUM (
    'EUA',
    'CEA'
);


ALTER TYPE public.certificatetype OWNER TO niha_user;

--
-- Name: contactstatus; Type: TYPE; Schema: public; Owner: niha_user
--

CREATE TYPE public.contactstatus AS ENUM (
    'NEW',
    'CONTACTED',
    'ENROLLED',
    'REJECTED'
);


ALTER TYPE public.contactstatus OWNER TO niha_user;

--
-- Name: currency; Type: TYPE; Schema: public; Owner: niha_user
--

CREATE TYPE public.currency AS ENUM (
    'EUR',
    'USD',
    'CNY',
    'HKD'
);


ALTER TYPE public.currency OWNER TO niha_user;

--
-- Name: depositstatus; Type: TYPE; Schema: public; Owner: niha_user
--

CREATE TYPE public.depositstatus AS ENUM (
    'PENDING',
    'CONFIRMED',
    'REJECTED'
);


ALTER TYPE public.depositstatus OWNER TO niha_user;

--
-- Name: documentstatus; Type: TYPE; Schema: public; Owner: niha_user
--

CREATE TYPE public.documentstatus AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public.documentstatus OWNER TO niha_user;

--
-- Name: documenttype; Type: TYPE; Schema: public; Owner: niha_user
--

CREATE TYPE public.documenttype AS ENUM (
    'REGISTRATION',
    'TAX_CERTIFICATE',
    'ARTICLES',
    'FINANCIAL_STATEMENTS',
    'GHG_PERMIT',
    'ID',
    'PROOF_AUTHORITY',
    'CONTACT_INFO'
);


ALTER TYPE public.documenttype OWNER TO niha_user;

--
-- Name: jurisdiction; Type: TYPE; Schema: public; Owner: niha_user
--

CREATE TYPE public.jurisdiction AS ENUM (
    'EU',
    'CN',
    'HK',
    'OTHER'
);


ALTER TYPE public.jurisdiction OWNER TO niha_user;

--
-- Name: kycstatus; Type: TYPE; Schema: public; Owner: niha_user
--

CREATE TYPE public.kycstatus AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public.kycstatus OWNER TO niha_user;

--
-- Name: mailprovider; Type: TYPE; Schema: public; Owner: niha_user
--

CREATE TYPE public.mailprovider AS ENUM (
    'RESEND',
    'SMTP'
);


ALTER TYPE public.mailprovider OWNER TO niha_user;

--
-- Name: marketmakerstatus; Type: TYPE; Schema: public; Owner: niha_user
--

CREATE TYPE public.marketmakerstatus AS ENUM (
    'ACTIVE',
    'PAUSED',
    'DISABLED'
);


ALTER TYPE public.marketmakerstatus OWNER TO niha_user;

--
-- Name: marketmakertype; Type: TYPE; Schema: public; Owner: niha_user
--

CREATE TYPE public.marketmakertype AS ENUM (
    'CEA_CASH_SELLER',
    'CASH_BUYER',
    'SWAP_MAKER'
);


ALTER TYPE public.marketmakertype OWNER TO niha_user;

--
-- Name: markettype; Type: TYPE; Schema: public; Owner: niha_user
--

CREATE TYPE public.markettype AS ENUM (
    'CEA_CASH',
    'SWAP'
);


ALTER TYPE public.markettype OWNER TO niha_user;

--
-- Name: orderside; Type: TYPE; Schema: public; Owner: niha_user
--

CREATE TYPE public.orderside AS ENUM (
    'BUY',
    'SELL'
);


ALTER TYPE public.orderside OWNER TO niha_user;

--
-- Name: orderstatus; Type: TYPE; Schema: public; Owner: niha_user
--

CREATE TYPE public.orderstatus AS ENUM (
    'OPEN',
    'PARTIALLY_FILLED',
    'FILLED',
    'CANCELLED'
);


ALTER TYPE public.orderstatus OWNER TO niha_user;

--
-- Name: ordertype; Type: TYPE; Schema: public; Owner: niha_user
--

CREATE TYPE public.ordertype AS ENUM (
    'MARKET',
    'LIMIT'
);


ALTER TYPE public.ordertype OWNER TO niha_user;

--
-- Name: scrapelibrary; Type: TYPE; Schema: public; Owner: niha_user
--

CREATE TYPE public.scrapelibrary AS ENUM (
    'HTTPX',
    'BEAUTIFULSOUP',
    'SELENIUM',
    'PLAYWRIGHT'
);


ALTER TYPE public.scrapelibrary OWNER TO niha_user;

--
-- Name: scrapestatus; Type: TYPE; Schema: public; Owner: niha_user
--

CREATE TYPE public.scrapestatus AS ENUM (
    'SUCCESS',
    'FAILED',
    'TIMEOUT'
);


ALTER TYPE public.scrapestatus OWNER TO niha_user;

--
-- Name: settlementstatus; Type: TYPE; Schema: public; Owner: niha_user
--

CREATE TYPE public.settlementstatus AS ENUM (
    'PENDING',
    'TRANSFER_INITIATED',
    'IN_TRANSIT',
    'AT_CUSTODY',
    'SETTLED',
    'FAILED'
);


ALTER TYPE public.settlementstatus OWNER TO niha_user;

--
-- Name: settlementtype; Type: TYPE; Schema: public; Owner: niha_user
--

CREATE TYPE public.settlementtype AS ENUM (
    'CEA_PURCHASE',
    'SWAP_CEA_TO_EUA'
);


ALTER TYPE public.settlementtype OWNER TO niha_user;

--
-- Name: swapstatus; Type: TYPE; Schema: public; Owner: niha_user
--

CREATE TYPE public.swapstatus AS ENUM (
    'OPEN',
    'MATCHED',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public.swapstatus OWNER TO niha_user;

--
-- Name: ticketeventtype; Type: TYPE; Schema: public; Owner: niha_user
--

CREATE TYPE public.ticketeventtype AS ENUM (
    'DEPOSIT',
    'DEPOSIT_CONFIRMED',
    'LIMIT_ORDER_PLACED',
    'LIMIT_ORDER_MODIFIED',
    'LIMIT_ORDER_CANCELLED',
    'MARKET_ORDER_EXECUTED',
    'TRADE_EXECUTED',
    'WITHDRAWAL',
    'AI_ORDER_PLACED',
    'AI_ORDER_CANCELLED',
    'AI_LIQUIDITY_ADJUSTED',
    'ai_client_created',
    'ai_client_balance_added'
);


ALTER TYPE public.ticketeventtype OWNER TO niha_user;

--
-- Name: ticketstatus; Type: TYPE; Schema: public; Owner: niha_user
--

CREATE TYPE public.ticketstatus AS ENUM (
    'SUCCESS',
    'FAILED'
);


ALTER TYPE public.ticketstatus OWNER TO niha_user;

--
-- Name: tradestatus; Type: TYPE; Schema: public; Owner: niha_user
--

CREATE TYPE public.tradestatus AS ENUM (
    'PENDING',
    'CONFIRMED',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public.tradestatus OWNER TO niha_user;

--
-- Name: tradetype; Type: TYPE; Schema: public; Owner: niha_user
--

CREATE TYPE public.tradetype AS ENUM (
    'BUY',
    'SELL',
    'SWAP'
);


ALTER TYPE public.tradetype OWNER TO niha_user;

--
-- Name: transactiontype; Type: TYPE; Schema: public; Owner: niha_user
--

CREATE TYPE public.transactiontype AS ENUM (
    'DEPOSIT',
    'WITHDRAWAL',
    'TRADE_BUY',
    'TRADE_SELL',
    'ADJUSTMENT'
);


ALTER TYPE public.transactiontype OWNER TO niha_user;

--
-- Name: userrole; Type: TYPE; Schema: public; Owner: niha_user
--

CREATE TYPE public.userrole AS ENUM (
    'ADMIN',
    'PENDING',
    'APPROVED',
    'FUNDED',
    'MARKET_MAKER'
);


ALTER TYPE public.userrole OWNER TO niha_user;

--
-- Name: withdrawalstatus; Type: TYPE; Schema: public; Owner: niha_user
--

CREATE TYPE public.withdrawalstatus AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'REJECTED'
);


ALTER TYPE public.withdrawalstatus OWNER TO niha_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.activity_logs (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    action character varying(100) NOT NULL,
    details json,
    ip_address character varying(45),
    user_agent character varying(500),
    session_id character varying(100),
    created_at timestamp without time zone
);


ALTER TABLE public.activity_logs OWNER TO niha_user;

--
-- Name: agent_action_logs; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.agent_action_logs (
    id uuid NOT NULL,
    market_maker_id uuid,
    action_type character varying(50) NOT NULL,
    certificate_type public.certificatetype,
    prompt_sent text,
    llm_response text,
    model_used character varying(100),
    tokens_used integer,
    response_time_ms integer,
    order_id uuid,
    order_side public.orderside,
    order_price numeric(18,4),
    order_quantity numeric(18,2),
    success boolean,
    error_message text,
    created_at timestamp without time zone
);


ALTER TABLE public.agent_action_logs OWNER TO niha_user;

--
-- Name: agent_config; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.agent_config (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    is_active boolean,
    ollama_base_url character varying(500),
    model_name character varying(100),
    temperature numeric(3,2),
    max_tokens integer,
    top_p numeric(3,2),
    system_prompt text,
    action_prompt_template text,
    run_interval_seconds integer,
    max_orders_per_run integer,
    cooldown_after_trade integer,
    last_run_at timestamp without time zone,
    last_run_status character varying(50),
    last_run_error text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.agent_config OWNER TO niha_user;

--
-- Name: ai_clients; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.ai_clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id character varying(20) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    eur_balance numeric(18,2) DEFAULT 0 NOT NULL,
    cea_balance numeric(18,2) DEFAULT 0 NOT NULL,
    eua_balance numeric(18,2) DEFAULT 0 NOT NULL,
    max_order_size numeric(18,2) DEFAULT 10000 NOT NULL,
    max_daily_volume numeric(18,2) DEFAULT 100000 NOT NULL,
    trading_enabled boolean DEFAULT true NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    notes text,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ai_clients OWNER TO niha_user;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO niha_user;

--
-- Name: asset_transactions; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.asset_transactions (
    id uuid NOT NULL,
    entity_id uuid,
    asset_type public.assettype,
    transaction_type public.transactiontype NOT NULL,
    amount numeric(18,2) NOT NULL,
    balance_before numeric(18,2) NOT NULL,
    balance_after numeric(18,2) NOT NULL,
    reference character varying(100),
    notes text,
    created_by uuid NOT NULL,
    created_at timestamp without time zone,
    market_maker_id uuid,
    certificate_type public.certificatetype,
    ticket_id character varying(30)
);


ALTER TABLE public.asset_transactions OWNER TO niha_user;

--
-- Name: authentication_attempts; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.authentication_attempts (
    id uuid NOT NULL,
    user_id uuid,
    email character varying(255) NOT NULL,
    success boolean NOT NULL,
    method public.authmethod NOT NULL,
    ip_address character varying(45),
    user_agent character varying(500),
    failure_reason character varying(255),
    created_at timestamp without time zone
);


ALTER TABLE public.authentication_attempts OWNER TO niha_user;

--
-- Name: auto_trade_market_settings; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.auto_trade_market_settings (
    id uuid NOT NULL,
    market_key character varying(20) NOT NULL,
    enabled boolean NOT NULL,
    target_liquidity numeric(18,2),
    price_deviation_pct numeric(5,2) NOT NULL,
    avg_order_count integer NOT NULL,
    min_order_volume_eur numeric(18,2) NOT NULL,
    volume_variety integer NOT NULL,
    avg_order_count_variation_pct numeric(5,2) NOT NULL,
    max_orders_per_price_level integer NOT NULL,
    max_orders_per_level_variation_pct numeric(5,2) NOT NULL,
    min_order_value_variation_pct numeric(5,2) NOT NULL,
    interval_seconds integer NOT NULL,
    order_interval_variation_pct numeric(5,2) NOT NULL,
    max_order_volume_eur numeric(18,2),
    max_liquidity_threshold numeric(18,2),
    internal_trade_interval integer,
    internal_trade_volume_min numeric(18,2),
    internal_trade_volume_max numeric(18,2),
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.auto_trade_market_settings OWNER TO niha_user;

--
-- Name: auto_trade_rules; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.auto_trade_rules (
    id uuid NOT NULL,
    market_maker_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    enabled boolean NOT NULL,
    side public.orderside NOT NULL,
    order_type character varying(20) NOT NULL,
    price_mode public.autotradepricemode NOT NULL,
    fixed_price numeric(18,4),
    spread_from_best numeric(18,4),
    spread_min numeric(18,4),
    spread_max numeric(18,4),
    percentage_from_market numeric(8,4),
    max_price_deviation numeric(8,4),
    quantity_mode public.autotradequantitymode NOT NULL,
    fixed_quantity numeric(18,2),
    percentage_of_balance numeric(8,4),
    min_quantity numeric(18,2),
    max_quantity numeric(18,2),
    interval_mode character varying(20) NOT NULL,
    interval_minutes integer NOT NULL,
    interval_min_minutes integer,
    interval_max_minutes integer,
    interval_seconds integer,
    interval_min_seconds integer,
    interval_max_seconds integer,
    min_balance numeric(18,2),
    max_active_orders integer,
    last_executed_at timestamp without time zone,
    next_execution_at timestamp without time zone,
    execution_count integer NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.auto_trade_rules OWNER TO niha_user;

--
-- Name: auto_trade_settings; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.auto_trade_settings (
    id uuid NOT NULL,
    certificate_type character varying(10) NOT NULL,
    target_ask_liquidity numeric(18,2),
    target_bid_liquidity numeric(18,2),
    liquidity_limit_enabled boolean NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.auto_trade_settings OWNER TO niha_user;

--
-- Name: cash_market_trades; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.cash_market_trades (
    id uuid NOT NULL,
    ticket_id character varying(30),
    buy_order_id uuid NOT NULL,
    sell_order_id uuid NOT NULL,
    buyer_entity_id uuid,
    buyer_user_id uuid,
    seller_entity_id uuid,
    seller_user_id uuid,
    seller_id uuid,
    market_maker_id uuid,
    certificate_type public.certificatetype NOT NULL,
    price numeric(18,4) NOT NULL,
    price_eur numeric(18,4),
    quantity numeric(18,2) NOT NULL,
    gross_cost numeric(18,2),
    platform_fee numeric(18,2),
    swap_commission numeric(18,2),
    total_cost numeric(18,2),
    executed_at timestamp without time zone,
    ai_client_id uuid
);


ALTER TABLE public.cash_market_trades OWNER TO niha_user;

--
-- Name: certificates; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.certificates (
    id uuid NOT NULL,
    entity_id uuid NOT NULL,
    certificate_type public.certificatetype NOT NULL,
    quantity numeric(18,2) NOT NULL,
    unit_price numeric(18,4) NOT NULL,
    vintage_year integer,
    status public.certificatestatus,
    anonymous_code character varying(10) NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.certificates OWNER TO niha_user;

--
-- Name: contact_requests; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.contact_requests (
    id uuid NOT NULL,
    entity_name character varying(255) NOT NULL,
    contact_email character varying(255) NOT NULL,
    contact_name character varying(255),
    "position" character varying(100),
    reference character varying(255),
    request_type character varying(50),
    nda_file_path character varying(500),
    nda_file_name character varying(255),
    nda_file_data bytea,
    nda_file_mime_type character varying(100),
    submitter_ip character varying(45),
    status public.contactstatus,
    notes text,
    agent_id uuid,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    contact_first_name character varying(128),
    contact_last_name character varying(128)
);


ALTER TABLE public.contact_requests OWNER TO niha_user;

--
-- Name: deposits; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.deposits (
    id uuid NOT NULL,
    ticket_id character varying(30),
    entity_id uuid NOT NULL,
    user_id uuid,
    reported_amount numeric(18,2),
    reported_currency public.currency,
    amount numeric(18,2),
    currency public.currency,
    wire_reference character varying(100),
    bank_reference character varying(100),
    status public.depositstatus,
    reported_at timestamp without time zone,
    confirmed_at timestamp without time zone,
    confirmed_by uuid,
    confirmation_ticket_id character varying(30),
    notes text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.deposits OWNER TO niha_user;

--
-- Name: entities; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.entities (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    legal_name character varying(255),
    jurisdiction public.jurisdiction NOT NULL,
    registration_number character varying(100),
    verified boolean,
    kyc_status public.kycstatus,
    kyc_submitted_at timestamp without time zone,
    kyc_approved_at timestamp without time zone,
    kyc_approved_by uuid,
    balance_amount numeric(18,2),
    balance_currency public.currency,
    total_deposited numeric(18,2),
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.entities OWNER TO niha_user;

--
-- Name: entity_fee_overrides; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.entity_fee_overrides (
    id uuid NOT NULL,
    entity_id uuid NOT NULL,
    market public.markettype NOT NULL,
    bid_fee_rate numeric(8,6),
    ask_fee_rate numeric(8,6),
    is_active boolean,
    created_at timestamp without time zone,
    updated_by uuid
);


ALTER TABLE public.entity_fee_overrides OWNER TO niha_user;

--
-- Name: entity_holdings; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.entity_holdings (
    id uuid NOT NULL,
    entity_id uuid NOT NULL,
    asset_type public.assettype NOT NULL,
    quantity numeric(18,2) NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.entity_holdings OWNER TO niha_user;

--
-- Name: exchange_rate_sources; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.exchange_rate_sources (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    from_currency character varying(3) NOT NULL,
    to_currency character varying(3) NOT NULL,
    url character varying(500) NOT NULL,
    scrape_library public.scrapelibrary,
    is_active boolean,
    is_primary boolean,
    scrape_interval_minutes integer,
    last_rate numeric(18,8),
    last_scraped_at timestamp without time zone,
    last_scrape_status public.scrapestatus,
    config json,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.exchange_rate_sources OWNER TO niha_user;

--
-- Name: kyc_documents; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.kyc_documents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    entity_id uuid,
    document_type public.documenttype NOT NULL,
    file_path character varying(500) NOT NULL,
    file_name character varying(255) NOT NULL,
    file_size integer,
    mime_type character varying(100),
    status public.documentstatus,
    reviewed_by uuid,
    reviewed_at timestamp without time zone,
    notes text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.kyc_documents OWNER TO niha_user;

--
-- Name: liquidity_operations; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.liquidity_operations (
    id uuid NOT NULL,
    ticket_id character varying(30) NOT NULL,
    certificate_type public.certificatetype NOT NULL,
    target_bid_liquidity_eur numeric(18,2) NOT NULL,
    target_ask_liquidity_eur numeric(18,2) NOT NULL,
    actual_bid_liquidity_eur numeric(18,2) NOT NULL,
    actual_ask_liquidity_eur numeric(18,2) NOT NULL,
    market_makers_used jsonb NOT NULL,
    orders_created uuid[] NOT NULL,
    reference_price numeric(18,4) NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp without time zone NOT NULL,
    notes text
);


ALTER TABLE public.liquidity_operations OWNER TO niha_user;

--
-- Name: mail_config; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.mail_config (
    id uuid NOT NULL,
    provider public.mailprovider NOT NULL,
    use_env_credentials boolean,
    from_email character varying(255) NOT NULL,
    resend_api_key character varying(500),
    smtp_host character varying(255),
    smtp_port integer,
    smtp_use_tls boolean,
    smtp_username character varying(255),
    smtp_password character varying(500),
    invitation_subject character varying(255),
    invitation_body_html text,
    invitation_link_base_url character varying(500),
    invitation_token_expiry_days integer,
    verification_method character varying(50),
    auth_method character varying(50),
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.mail_config OWNER TO niha_user;

--
-- Name: market_maker_clients; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.market_maker_clients (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    client_code character varying(20) NOT NULL,
    status public.marketmakerstatus,
    eur_balance numeric(18,2),
    cea_balance numeric(18,2),
    eua_balance numeric(18,2),
    max_order_size numeric(18,2),
    min_order_size numeric(18,2),
    daily_volume_limit numeric(18,2),
    daily_volume_used numeric(18,2),
    max_spread_pct numeric(5,4),
    min_spread_pct numeric(5,4),
    total_orders integer,
    total_volume_traded numeric(18,2),
    notes text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    mm_type public.marketmakertype DEFAULT 'CEA_CASH_SELLER'::public.marketmakertype NOT NULL,
    user_id uuid NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid NOT NULL
);


ALTER TABLE public.market_maker_clients OWNER TO niha_user;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.orders (
    id uuid NOT NULL,
    ticket_id character varying(30),
    entity_id uuid,
    user_id uuid,
    seller_id uuid,
    market_maker_id uuid,
    certificate_type public.certificatetype NOT NULL,
    side public.orderside NOT NULL,
    order_type public.ordertype,
    price numeric(18,4) NOT NULL,
    quantity numeric(18,2) NOT NULL,
    filled_quantity numeric(18,2),
    status public.orderstatus,
    all_or_none boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    ai_client_id uuid,
    market public.markettype NOT NULL
);


ALTER TABLE public.orders OWNER TO niha_user;

--
-- Name: price_history; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.price_history (
    id uuid NOT NULL,
    certificate_type public.certificatetype NOT NULL,
    price numeric(18,4) NOT NULL,
    currency character varying(3) NOT NULL,
    source character varying(100),
    recorded_at timestamp without time zone
);


ALTER TABLE public.price_history OWNER TO niha_user;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.refresh_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    revoked boolean DEFAULT false,
    revoked_at timestamp without time zone,
    used boolean DEFAULT false,
    used_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.refresh_tokens OWNER TO niha_user;

--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: public; Owner: niha_user
--

COMMENT ON TABLE public.refresh_tokens IS 'Stores refresh tokens for secure token rotation with reuse detection';


--
-- Name: COLUMN refresh_tokens.token_hash; Type: COMMENT; Schema: public; Owner: niha_user
--

COMMENT ON COLUMN public.refresh_tokens.token_hash IS 'SHA256 hash of refresh token (tokens never stored in plaintext)';


--
-- Name: COLUMN refresh_tokens.revoked; Type: COMMENT; Schema: public; Owner: niha_user
--

COMMENT ON COLUMN public.refresh_tokens.revoked IS 'Allow manual revocation of tokens';


--
-- Name: COLUMN refresh_tokens.used; Type: COMMENT; Schema: public; Owner: niha_user
--

COMMENT ON COLUMN public.refresh_tokens.used IS 'Track if token was used for reuse detection (security feature)';


--
-- Name: scraping_sources; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.scraping_sources (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    url character varying(500) NOT NULL,
    certificate_type public.certificatetype NOT NULL,
    scrape_library public.scrapelibrary,
    is_active boolean,
    scrape_interval_minutes integer,
    last_scrape_at timestamp without time zone,
    last_scrape_status public.scrapestatus,
    last_price numeric(18,4),
    config json,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.scraping_sources OWNER TO niha_user;

--
-- Name: sellers; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.sellers (
    id uuid NOT NULL,
    client_code character varying(20) NOT NULL,
    name character varying(255) NOT NULL,
    company_name character varying(255),
    jurisdiction public.jurisdiction,
    cea_balance numeric(18,2),
    cea_sold numeric(18,2),
    total_transactions integer,
    is_active boolean,
    notes text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.sellers OWNER TO niha_user;

--
-- Name: settlement_batches; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.settlement_batches (
    id uuid NOT NULL,
    batch_reference character varying(50) NOT NULL,
    entity_id uuid NOT NULL,
    order_id uuid,
    trade_id uuid,
    counterparty_id uuid,
    settlement_type public.settlementtype NOT NULL,
    status public.settlementstatus NOT NULL,
    asset_type public.certificatetype NOT NULL,
    quantity numeric(18,2) NOT NULL,
    price numeric(18,4) NOT NULL,
    total_value_eur numeric(18,2) NOT NULL,
    expected_settlement_date timestamp without time zone NOT NULL,
    actual_settlement_date timestamp without time zone,
    registry_reference character varying(100),
    notes text,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.settlement_batches OWNER TO niha_user;

--
-- Name: settlement_status_history; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.settlement_status_history (
    id uuid NOT NULL,
    settlement_batch_id uuid NOT NULL,
    status public.settlementstatus NOT NULL,
    notes text,
    updated_by uuid,
    created_at timestamp without time zone NOT NULL
);


ALTER TABLE public.settlement_status_history OWNER TO niha_user;

--
-- Name: swap_requests; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.swap_requests (
    id uuid NOT NULL,
    entity_id uuid NOT NULL,
    from_type public.certificatetype NOT NULL,
    to_type public.certificatetype NOT NULL,
    quantity numeric(18,2) NOT NULL,
    desired_rate numeric(10,6),
    status public.swapstatus,
    matched_with uuid,
    anonymous_code character varying(10) NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.swap_requests OWNER TO niha_user;

--
-- Name: ticket_logs; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.ticket_logs (
    id uuid NOT NULL,
    ticket_id character varying(30) NOT NULL,
    user_id uuid,
    entity_id uuid,
    seller_id uuid,
    market_maker_id uuid,
    counterparty_entity_id uuid,
    counterparty_user_id uuid,
    order_id uuid,
    trade_id uuid,
    deposit_id uuid,
    certificate_type public.certificatetype,
    side public.orderside,
    order_type public.ordertype,
    price numeric(18,4),
    price_eur numeric(18,4),
    volume numeric(18,2),
    amount numeric(18,2),
    currency public.currency,
    platform_fee numeric(18,2),
    swap_commission numeric(18,2),
    total_cost numeric(18,2),
    details json,
    notes text,
    ip_address character varying(45),
    created_at timestamp without time zone,
    ai_client_id uuid,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    action_type character varying(100) DEFAULT 'UNKNOWN'::character varying NOT NULL,
    entity_type character varying(50) DEFAULT 'Unknown'::character varying NOT NULL,
    status public.ticketstatus DEFAULT 'SUCCESS'::public.ticketstatus NOT NULL,
    request_payload jsonb,
    response_data jsonb,
    user_agent character varying(500),
    session_id uuid,
    before_state jsonb,
    after_state jsonb,
    related_ticket_ids character varying(30)[],
    tags character varying(50)[]
);


ALTER TABLE public.ticket_logs OWNER TO niha_user;

--
-- Name: trades; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.trades (
    id uuid NOT NULL,
    trade_type public.tradetype NOT NULL,
    buyer_entity_id uuid,
    seller_entity_id uuid,
    certificate_id uuid,
    certificate_type public.certificatetype NOT NULL,
    quantity numeric(18,2) NOT NULL,
    price_per_unit numeric(18,4) NOT NULL,
    total_value numeric(18,4) NOT NULL,
    status public.tradestatus,
    created_at timestamp without time zone,
    completed_at timestamp without time zone
);


ALTER TABLE public.trades OWNER TO niha_user;

--
-- Name: trading_fee_configs; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.trading_fee_configs (
    id uuid NOT NULL,
    market public.markettype NOT NULL,
    bid_fee_rate numeric(8,6) NOT NULL,
    ask_fee_rate numeric(8,6) NOT NULL,
    is_active boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    updated_by uuid
);


ALTER TABLE public.trading_fee_configs OWNER TO niha_user;

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.user_sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    ip_address character varying(45),
    user_agent character varying(500),
    device_info json,
    started_at timestamp without time zone,
    ended_at timestamp without time zone,
    duration_seconds integer,
    is_active boolean
);


ALTER TABLE public.user_sessions OWNER TO niha_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    entity_id uuid,
    email character varying(255) NOT NULL,
    password_hash character varying(255),
    first_name character varying(100),
    last_name character varying(100),
    "position" character varying(100),
    phone character varying(50),
    role public.userrole,
    is_active boolean,
    must_change_password boolean,
    invitation_token character varying(100),
    invitation_sent_at timestamp without time zone,
    invitation_expires_at timestamp without time zone,
    created_by uuid,
    creation_method character varying(20),
    last_login timestamp without time zone,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.users OWNER TO niha_user;

--
-- Name: withdrawals; Type: TABLE; Schema: public; Owner: niha_user
--

CREATE TABLE public.withdrawals (
    id uuid NOT NULL,
    entity_id uuid NOT NULL,
    user_id uuid,
    asset_type public.assettype NOT NULL,
    amount numeric(18,2) NOT NULL,
    status public.withdrawalstatus NOT NULL,
    destination_bank character varying(255),
    destination_iban character varying(50),
    destination_swift character varying(20),
    destination_account_holder character varying(255),
    destination_registry character varying(100),
    destination_account_id character varying(100),
    wire_reference character varying(100),
    internal_reference character varying(100),
    rejection_reason text,
    client_notes text,
    admin_notes text,
    requested_at timestamp without time zone,
    processed_at timestamp without time zone,
    completed_at timestamp without time zone,
    rejected_at timestamp without time zone,
    processed_by uuid,
    completed_by uuid,
    rejected_by uuid,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.withdrawals OWNER TO niha_user;

--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.activity_logs (id, user_id, action, details, ip_address, user_agent, session_id, created_at) FROM stdin;
\.


--
-- Data for Name: agent_action_logs; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.agent_action_logs (id, market_maker_id, action_type, certificate_type, prompt_sent, llm_response, model_used, tokens_used, response_time_ms, order_id, order_side, order_price, order_quantity, success, error_message, created_at) FROM stdin;
\.


--
-- Data for Name: agent_config; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.agent_config (id, name, is_active, ollama_base_url, model_name, temperature, max_tokens, top_p, system_prompt, action_prompt_template, run_interval_seconds, max_orders_per_run, cooldown_after_trade, last_run_at, last_run_status, last_run_error, created_at, updated_at) FROM stdin;
ceef2550-b308-4220-8211-131b59e2fd9a	Market Maker Agent	t	http://localhost:11434	mistral:7b	0.70	1024	0.90	You are a market maker agent for a carbon credit trading platform.\nYour role is to provide liquidity by placing buy and sell orders based on market conditions.\nAnalyze the order book, recent trades, and current spread to decide on optimal order placement.\nBe conservative with sizing and maintain tight spreads to minimize risk.\nAlways respond with valid JSON containing your trading decisions.	Current Market State:\n- Certificate Type: {certificate_type}\n- Best Bid: {best_bid} EUR (quantity: {bid_qty})\n- Best Ask: {best_ask} EUR (quantity: {ask_qty})\n- Spread: {spread} EUR ({spread_pct}%)\n- Last Trade: {last_price} EUR\n- 24h Volume: {volume_24h}\n\nAvailable Balances:\n- EUR: {eur_balance}\n- CEA: {cea_balance}\n\nRecent Trades (last 5):\n{recent_trades}\n\nBased on this data, suggest orders to place. Respond with JSON:\n{{"orders": [{{"side": "BUY"|"SELL", "price": float, "quantity": float, "reason": "string"}}]}}\nMaximum {max_orders} orders. Leave orders empty if market conditions don't warrant action.	60	3	10	2026-01-15 13:20:30.926214	success	\N	2026-01-15 06:05:48.669762	2026-01-16 03:28:45.249388
\.


--
-- Data for Name: ai_clients; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.ai_clients (id, client_id, name, description, eur_balance, cea_balance, eua_balance, max_order_size, max_daily_volume, trading_enabled, is_active, notes, created_by, created_at, updated_at) FROM stdin;
bb914409-4633-456c-9c43-a31e0269f8f6	ni-4BJ-MVKA6	Trader		10000000.00	100000.00	100000.00	10000.00	100000.00	t	t		1a32a0cb-26e9-407c-8f8b-a6c276d518bd	2026-01-15 13:24:12.073571	2026-01-15 13:24:12.073583
\.


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.alembic_version (version_num) FROM stdin;
2026_01_29_baseline
\.


--
-- Data for Name: asset_transactions; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.asset_transactions (id, entity_id, asset_type, transaction_type, amount, balance_before, balance_after, reference, notes, created_by, created_at, market_maker_id, certificate_type, ticket_id) FROM stdin;
6952b343-0176-4e5e-9794-81ea493ec779	300083df-1f88-49b5-b634-cdb49eb00779	EUR	DEPOSIT	1000000.00	0.00	1000000.00	\N	\N	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	2026-01-15 06:11:22.303032	\N	\N	\N
8afbc77f-d53b-48a2-8d64-97231f6b678e	\N	CEA	DEPOSIT	1000000.00	0.00	1000000.00	\N	Initial funding	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	2026-01-25 02:03:43.488369	7754f081-a1b1-4537-aacc-50f2db2d1f58	CEA	TKT-2026-000092
07b910aa-ea74-476f-9e6f-6940dac46b88	\N	CEA	DEPOSIT	100000.00	1000000.00	1100000.00	\N	\N	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	2026-01-25 02:18:01.761655	7754f081-a1b1-4537-aacc-50f2db2d1f58	CEA	TKT-2026-000095
\.


--
-- Data for Name: authentication_attempts; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.authentication_attempts (id, user_id, email, success, method, ip_address, user_agent, failure_reason, created_at) FROM stdin;
5ae6ded0-d915-458c-90d1-85b942c344e9	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	curl/8.7.1	\N	2026-01-15 04:23:31.033042
c9ebc79c-a08e-4b9f-a798-53532a41d74d	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	curl/8.7.1	\N	2026-01-15 04:25:47.676006
de2e345e-9022-4be8-a459-befa2ed3d571	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	f	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	invalid_password	2026-01-15 04:25:50.209123
f531f005-6b36-4682-8ce0-468811f7e9f2	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	f	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	invalid_password	2026-01-15 04:25:59.777644
879bfd12-d0d4-4623-84be-69a8459b8a20	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	f	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	invalid_password	2026-01-15 04:27:29.768757
c938e06c-8196-4df5-a9cd-ce7e3e5bbd98	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	f	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	invalid_password	2026-01-15 04:27:39.839392
34a5af9d-bf44-4efa-b56a-d15d454a57f9	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-15 04:28:17.146074
b271df67-dfe7-4403-80f6-547bae9d6ddc	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-15 04:44:46.811164
9136fda8-8713-4524-9a25-dd540a1badd2	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	curl/8.7.1	\N	2026-01-15 05:00:09.466552
f07cd371-307d-4113-b7de-916203dd5b17	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	curl/8.7.1	\N	2026-01-15 05:13:07.893765
827255c1-992e-481d-9f99-66279e16570b	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-15 05:23:41.013013
c33b85da-98c0-46ce-932c-5f620ff770e0	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-15 05:45:38.171637
99b9040f-f512-4984-9311-3fa5f7e1e608	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-15 06:19:06.033779
8b244cbd-d8d5-4165-b8e8-ea0990f861c9	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-15 06:49:29.123566
113a097f-bb28-40db-93b6-1b20dfcd5dda	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-15 08:07:17.15955
29cd3e21-6a00-4580-a6ee-d2384c6e40eb	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-15 11:00:08.966663
37d584c1-4db2-4adc-b018-7c74ecc24062	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-15 11:46:08.159626
97aa7170-1955-4f93-b763-65f3e18fedcb	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-15 11:47:08.381498
0902d1c8-26d1-4473-82e0-d848aff8d126	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-15 13:12:11.817362
a0215d62-f05d-457e-bb64-b48f83697b39	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-15 13:12:22.75845
ae89d618-e90f-4c98-ac77-1a02f62d4327	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-15 13:20:17.739468
693ed314-f887-4dc0-b4a3-07c9cc715e3e	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-15 13:21:24.248408
a3b6fd85-d1ca-4efd-a7d1-22a001f6565c	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-15 13:45:23.214786
2e549ba5-e5cb-4e96-9ee7-da27c2386d2e	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-15 14:18:50.99749
d28a744d-be5b-4daa-9056-9995d67ff243	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-15 15:08:20.615368
ee5a0021-4570-4485-8858-2d102134b941	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-15 16:03:52.745606
98f9252a-b2cb-4959-8d25-38eb43c1bc29	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-15 16:04:08.036812
29570036-c957-4245-84da-b0793b8f1f5a	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-15 16:11:46.54216
1ff2a68b-fafc-4c82-bf1f-87e6f5cb2cbe	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-15 16:46:27.04245
96ab340c-9c9e-4d59-b744-72c03cc6db65	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-15 21:43:53.633781
b9dcf911-d442-4423-b8e7-2849db463da2	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-15 21:45:05.595689
d9687c94-e579-4f13-a210-eb55f77a1160	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-16 03:58:56.403936
717c0711-a260-4523-90bf-f6c256f28629	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-16 03:59:30.71746
d137d8f8-4ddd-42d4-aea0-17c1a8c59693	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-16 03:59:54.917374
2ecdb362-ecfc-4be9-a2c2-0337843f1fd0	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-16 04:54:25.832004
2af7e519-cdae-4353-a872-4288a9fcd632	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-16 04:54:48.834011
5bb4c4a4-8e86-43d2-8dc1-a144ea0384eb	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-16 04:55:20.712426
b238bf39-0c36-4c08-8dcf-de1a853df96a	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	f	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	invalid_password	2026-01-24 23:22:05.459399
34eeb423-4eb8-42d0-a50d-74810766c51b	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	f	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	invalid_password	2026-01-24 23:22:09.501529
760f90d0-9261-4a1b-ad90-3d38af3a322e	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	f	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	invalid_password	2026-01-24 23:23:13.847516
c4ce91dd-fc93-4e8d-beb4-46f099ee3ffe	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	f	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	invalid_password	2026-01-24 23:23:22.077286
3cc7706e-a008-47dc-8375-d7d83338d955	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	f	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	invalid_password	2026-01-24 23:23:25.882328
a8de1003-af7c-433c-ab98-4ba26b2f19a9	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	f	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	invalid_password	2026-01-24 23:23:37.768874
2704c660-e0cf-4fb4-a816-7cd74de3f153	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	f	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	invalid_password	2026-01-24 23:23:51.05755
32db9dfe-e157-445e-8135-89d83d60dfb8	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	f	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	invalid_password	2026-01-24 23:25:08.84325
06c41d00-3302-41de-b072-8873c9d879af	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	f	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	invalid_password	2026-01-24 23:25:38.47304
006c3a2f-3d68-457a-9503-b7bd0612a2ef	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	f	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	invalid_password	2026-01-24 23:25:46.227597
2ba68801-ac2e-4272-ba01-82a5997cdab0	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	f	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	invalid_password	2026-01-24 23:25:49.423033
10ac2cee-431c-4ab6-acf3-c15b5e81cf88	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	f	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	invalid_password	2026-01-24 23:26:07.545682
4c522f30-f69f-48f4-964a-86135f14a4e3	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	f	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	invalid_password	2026-01-24 23:29:59.217114
0b0f7f80-d533-4d68-b30c-2980638bb4a2	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	f	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	invalid_password	2026-01-24 23:30:44.481677
13b6b72c-e486-4c06-86f7-ea69b4181aef	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	f	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	invalid_password	2026-01-24 23:30:52.152536
b399ec6a-8bc3-45f7-93cd-df3d5aaddb60	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	f	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	invalid_password	2026-01-24 23:31:00.039727
2b2ce640-edaf-43f0-a791-8ae2badfb465	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-24 23:37:06.015154
86b1bb61-e433-4591-bc18-b561ab0fc462	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-24 23:42:43.618203
2bfcf6c3-124e-4c5e-bbbf-e4704b135ea8	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-24 23:50:33.075466
1ee9d0bf-a78f-4eb2-bd54-ef6511c656c6	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-25 00:00:56.631395
5b6e940b-db55-4665-a8e7-e482f9cf1013	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-25 00:03:26.310091
42e476e3-9079-40b5-9bde-a79caa7e5e84	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-25 00:03:27.286914
6fad1c43-7ab3-424c-abd1-00ed74f60afd	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-25 00:03:30.953648
4910a54f-f929-4da5-ac29-64dacae88f8b	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	curl/8.7.1	\N	2026-01-25 00:12:36.16963
a61b12c3-d9a8-4213-82dc-788d57479cc4	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	curl/8.7.1	\N	2026-01-25 00:36:46.377811
ce134472-3215-4752-89ae-a2249791baf2	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	curl/8.7.1	\N	2026-01-25 00:37:08.934839
9cbac58e-badf-473f-b858-104ae30b4f7a	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-25 00:48:40.85581
993f7eb3-d613-4dfc-91d6-7fbaadd722ad	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-25 00:48:41.705707
e0490288-522c-4705-a827-ebf469aa2a22	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	curl/8.7.1	\N	2026-01-25 01:09:21.041046
5f776186-4279-4764-88d3-aa5e84cf66f6	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	curl/8.7.1	\N	2026-01-25 01:24:45.688705
fd5f3d20-a4fe-45e3-849d-8a9416d4ce94	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	curl/8.7.1	\N	2026-01-25 01:27:21.888736
0ccbbc78-af7a-455e-9eca-95e77967ec4a	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	curl/8.7.1	\N	2026-01-25 01:28:49.738028
576f6f90-b777-44cf-9206-28045cd0cc87	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	curl/8.7.1	\N	2026-01-25 01:29:00.848407
d329091c-fe20-4017-a6a1-5d39199d2477	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	curl/8.7.1	\N	2026-01-25 01:29:12.117205
d7e64cea-c071-4707-8055-b4668fbd880c	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	curl/8.7.1	\N	2026-01-25 01:30:05.966798
44652d6b-005c-41fb-ae82-e96ac2df0b87	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	curl/8.7.1	\N	2026-01-25 01:30:31.021913
75428837-1450-4ba9-a61b-67a212aef0a9	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	curl/8.7.1	\N	2026-01-25 01:30:39.861508
18cbaf83-56a0-410b-9331-ddaddfaeacbb	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	curl/8.7.1	\N	2026-01-25 01:32:46.082979
aec3d36a-95d2-4269-a8e3-35e00d821494	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	curl/8.7.1	\N	2026-01-25 01:32:57.675039
660f88b6-dc22-4569-be51-896f9e783d33	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	curl/8.7.1	\N	2026-01-25 01:33:38.557711
de373490-4b18-424c-8acc-e99303238ee0	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	curl/8.7.1	\N	2026-01-25 01:33:46.914879
b3e99f99-8309-45f3-8bcc-2c3feafc425b	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	curl/8.7.1	\N	2026-01-25 01:33:55.525494
ba62b965-8782-4d07-9ae9-ba20d7c5c4c4	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	curl/8.7.1	\N	2026-01-25 01:34:21.97788
0edf44b3-321c-44aa-8bb9-3b1b103a225b	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	curl/8.7.1	\N	2026-01-25 01:34:30.818142
6caf3aa0-9e93-4e12-b6bc-c10554bb9bd8	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	curl/8.7.1	\N	2026-01-25 01:35:06.490211
040125a1-d774-4670-a789-39f0d4dfda5d	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	curl/8.7.1	\N	2026-01-25 01:35:17.052893
c919db3f-12bf-4978-91e7-88b206478404	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	curl/8.7.1	\N	2026-01-25 01:35:29.641899
f1618eb4-a44f-4c05-9bb3-badca04f8135	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	curl/8.7.1	\N	2026-01-25 01:36:06.583446
18ec0b83-d5b8-4f5b-90f7-45f279c6653c	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	curl/8.7.1	\N	2026-01-25 01:36:14.821021
1bf9235b-9a5c-4ba9-a177-c6cd2e8ac6a2	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	curl/8.7.1	\N	2026-01-25 01:36:22.983908
92ae54ca-7f2a-446a-aaaa-5b201f17fe8c	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-25 01:41:10.223416
9032be3e-3def-4c7b-bb40-6f329424b086	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	curl/8.7.1	\N	2026-01-25 01:49:35.693361
4d334e11-42db-4eea-a509-00d5145df247	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	curl/8.7.1	\N	2026-01-25 01:49:46.154899
af45f650-1bf8-4f2a-8fff-20d88db85681	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	curl/8.7.1	\N	2026-01-25 01:51:21.358966
4ea6bc8c-f2dd-4522-b0e3-a9888bb8f4b8	\N	admin@nihao.com	f	PASSWORD	127.0.0.1	curl/8.7.1	user_not_found_or_no_password	2026-01-25 01:53:45.975325
86c1612c-54ef-43bb-8189-14fe74efc0f4	\N	admin@nihao.com	f	PASSWORD	127.0.0.1	curl/8.7.1	user_not_found_or_no_password	2026-01-25 01:53:55.976307
d3703fd4-fad0-42ac-ba29-e95ab849259b	\N	admin@nihao.com	f	PASSWORD	127.0.0.1	curl/8.7.1	user_not_found_or_no_password	2026-01-25 01:54:02.223938
2f87e390-e1c2-435a-aa15-859045324b7d	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-25 02:02:48.116218
df4a76a9-f25a-4dff-a13b-790244d80a4b	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-25 02:02:49.632921
983969bd-3c2c-4e6c-9f67-5b95d4653903	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-25 02:17:10.561542
5fd787ce-7248-4b99-8ab3-8948dae70d10	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-25 02:22:26.722858
b3aea894-9c60-488d-a9da-311666becc3c	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	2026-01-25 02:27:46.048806
7bad564f-0bcd-4259-a45f-b833ec0739c5	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	admin@nihaogroup.com	t	PASSWORD	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	2026-01-25 07:47:54.818803
\.


--
-- Data for Name: auto_trade_market_settings; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.auto_trade_market_settings (id, market_key, enabled, target_liquidity, price_deviation_pct, avg_order_count, min_order_volume_eur, volume_variety, avg_order_count_variation_pct, max_orders_per_price_level, max_orders_per_level_variation_pct, min_order_value_variation_pct, interval_seconds, order_interval_variation_pct, max_order_volume_eur, max_liquidity_threshold, internal_trade_interval, internal_trade_volume_min, internal_trade_volume_max, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: auto_trade_rules; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.auto_trade_rules (id, market_maker_id, name, enabled, side, order_type, price_mode, fixed_price, spread_from_best, spread_min, spread_max, percentage_from_market, max_price_deviation, quantity_mode, fixed_quantity, percentage_of_balance, min_quantity, max_quantity, interval_mode, interval_minutes, interval_min_minutes, interval_max_minutes, interval_seconds, interval_min_seconds, interval_max_seconds, min_balance, max_active_orders, last_executed_at, next_execution_at, execution_count, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: auto_trade_settings; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.auto_trade_settings (id, certificate_type, target_ask_liquidity, target_bid_liquidity, liquidity_limit_enabled, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: cash_market_trades; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.cash_market_trades (id, ticket_id, buy_order_id, sell_order_id, buyer_entity_id, buyer_user_id, seller_entity_id, seller_user_id, seller_id, market_maker_id, certificate_type, price, price_eur, quantity, gross_cost, platform_fee, swap_commission, total_cost, executed_at, ai_client_id) FROM stdin;
\.


--
-- Data for Name: certificates; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.certificates (id, entity_id, certificate_type, quantity, unit_price, vintage_year, status, anonymous_code, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: contact_requests; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.contact_requests (id, entity_name, contact_email, contact_name, "position", reference, request_type, nda_file_path, nda_file_name, nda_file_data, nda_file_mime_type, submitter_ip, status, notes, agent_id, created_at, updated_at, contact_first_name, contact_last_name) FROM stdin;
\.


--
-- Data for Name: deposits; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.deposits (id, ticket_id, entity_id, user_id, reported_amount, reported_currency, amount, currency, wire_reference, bank_reference, status, reported_at, confirmed_at, confirmed_by, confirmation_ticket_id, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: entities; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.entities (id, name, legal_name, jurisdiction, registration_number, verified, kyc_status, kyc_submitted_at, kyc_approved_at, kyc_approved_by, balance_amount, balance_currency, total_deposited, created_at, updated_at) FROM stdin;
dd9b9b61-acfe-494c-9c4f-a518bd994b7f	EU Carbon Trading	EU Carbon Trading GmbH	EU	\N	t	APPROVED	\N	\N	\N	0.00	\N	0.00	2026-01-15 04:23:12.888631	2026-01-15 04:23:12.888633
300083df-1f88-49b5-b634-cdb49eb00779	Nihao Group	Nihao Group Holdings Ltd	HK	\N	t	APPROVED	\N	\N	\N	1000000.00	EUR	1000000.00	2026-01-15 04:23:12.8863	2026-01-15 06:11:22.301842
\.


--
-- Data for Name: entity_fee_overrides; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.entity_fee_overrides (id, entity_id, market, bid_fee_rate, ask_fee_rate, is_active, created_at, updated_by) FROM stdin;
\.


--
-- Data for Name: entity_holdings; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.entity_holdings (id, entity_id, asset_type, quantity, created_at, updated_at) FROM stdin;
eb57b7e0-9256-42fd-8a8e-51d2369596f7	300083df-1f88-49b5-b634-cdb49eb00779	EUR	1000000.00	2026-01-15 06:11:22.292488	2026-01-15 06:11:22.294821
\.


--
-- Data for Name: exchange_rate_sources; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.exchange_rate_sources (id, name, from_currency, to_currency, url, scrape_library, is_active, is_primary, scrape_interval_minutes, last_rate, last_scraped_at, last_scrape_status, config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: kyc_documents; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.kyc_documents (id, user_id, entity_id, document_type, file_path, file_name, file_size, mime_type, status, reviewed_by, reviewed_at, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: liquidity_operations; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.liquidity_operations (id, ticket_id, certificate_type, target_bid_liquidity_eur, target_ask_liquidity_eur, actual_bid_liquidity_eur, actual_ask_liquidity_eur, market_makers_used, orders_created, reference_price, created_by, created_at, notes) FROM stdin;
\.


--
-- Data for Name: mail_config; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.mail_config (id, provider, use_env_credentials, from_email, resend_api_key, smtp_host, smtp_port, smtp_use_tls, smtp_username, smtp_password, invitation_subject, invitation_body_html, invitation_link_base_url, invitation_token_expiry_days, verification_method, auth_method, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: market_maker_clients; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.market_maker_clients (id, name, client_code, status, eur_balance, cea_balance, eua_balance, max_order_size, min_order_size, daily_volume_limit, daily_volume_used, max_spread_pct, min_spread_pct, total_orders, total_volume_traded, notes, created_at, updated_at, mm_type, user_id, description, is_active, created_by) FROM stdin;
3a49fe6c-d74f-4e3e-bd3e-b85785b73e70	Test MM 03:19:37	MM031937	ACTIVE	100000.00	0.00	0.00	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-21 03:19:37.974657	2026-01-21 03:19:37.974657	CASH_BUYER	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	\N	t	1a32a0cb-26e9-407c-8f8b-a6c276d518bd
e94be66a-a603-4df9-b2fd-66f43fe7b891	Test MM Email	MM-002	\N	10000.00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-25 01:35:06.748377	2026-01-25 01:35:06.748379	CASH_BUYER	8023c8c5-019d-4b8c-abe1-0a6addcd0cfd	Testing email field implementation	t	1a32a0cb-26e9-407c-8f8b-a6c276d518bd
eafa0f39-f3ae-49c5-92c6-b01766ab3a29	Final Test MM	MM-003	\N	25000.00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-25 01:35:29.896949	2026-01-25 01:35:29.896952	CASH_BUYER	5e870a5e-ddc5-4fd5-93c0-d26227c16ebb	Final test of email field implementation	t	1a32a0cb-26e9-407c-8f8b-a6c276d518bd
7754f081-a1b1-4537-aacc-50f2db2d1f58	mm4	MM-004	\N	0.00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-25 02:03:43.463427	2026-01-25 02:03:43.463428	CEA_CASH_SELLER	99b0e2ed-1a2a-451f-a595-f83cdd274c0f	\N	t	1a32a0cb-26e9-407c-8f8b-a6c276d518bd
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.orders (id, ticket_id, entity_id, user_id, seller_id, market_maker_id, certificate_type, side, order_type, price, quantity, filled_quantity, status, all_or_none, created_at, updated_at, ai_client_id, market) FROM stdin;
\.


--
-- Data for Name: price_history; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.price_history (id, certificate_type, price, currency, source, recorded_at) FROM stdin;
6c54a37a-68e4-433c-a0bc-ae1fc57c720b	EUA	92.1300	EUR	Carbon EUA	2026-01-15 04:45:50.223695
f09d1602-8073-49a3-8e9b-eaedbf17369b	CEA	78.5000	CNY	Carbon CEA	2026-01-15 04:46:09.696981
58e3c3fb-9843-44a3-96d7-28927866320e	CEA	78.5000	CNY	Carbon CEA	2026-01-15 06:13:23.866201
213fc656-ce73-47ec-8efe-46b649e9f2e8	EUA	92.1300	EUR	Carbon EUA	2026-01-15 06:13:25.206696
fd3282cf-ee86-41e0-b40b-3a1e0130c39c	CEA	78.5000	CNY	Carbon CEA	2026-01-15 13:45:59.036414
a6a1d5b3-0f52-48d6-96cc-4db97b253e4f	EUA	92.9600	EUR	Carbon EUA	2026-01-15 13:45:59.560829
65dafb51-e4c8-4144-a444-83972cb9fa30	CEA	10.2050	EUR	Carbon CEA	2026-01-15 14:57:39.441202
b6dd1ebc-f4d0-4336-9d98-8446bd3b2814	EUA	92.4700	EUR	Carbon EUA	2026-01-15 14:57:40.151745
1e928993-deac-4a6e-8fa6-e0fb26e90829	CEA	10.2050	EUR	Carbon CEA	2026-01-15 15:07:47.925826
d2ea325c-9bbb-4d75-b8f2-e208dda221ce	EUA	92.0300	EUR	Carbon EUA	2026-01-15 15:07:48.459945
3b031cbb-38e5-45f4-b67a-27a46044eb88	CEA	10.2050	EUR	Carbon CEA	2026-01-15 15:17:49.295932
143a71c2-c729-466b-8754-1a8e2108e788	EUA	92.0300	EUR	Carbon EUA	2026-01-15 15:17:49.828905
f5c7b83a-5c42-44e5-9b2b-e051a686e50c	CEA	10.2050	EUR	Carbon CEA	2026-01-15 15:27:50.728202
1b611823-04ef-4589-b84e-4c1a38361b97	EUA	92.0300	EUR	Carbon EUA	2026-01-15 15:27:51.261976
665f7d6c-fbc1-4b38-8b12-d38a7481d0de	CEA	10.2050	EUR	Carbon CEA	2026-01-15 15:37:52.096422
93df087c-031d-4de3-8f2e-4404714ded60	EUA	91.9700	EUR	Carbon EUA	2026-01-15 15:37:52.92802
9c98d49e-0236-430f-a9fb-b825b0a77bda	CEA	10.2050	EUR	Carbon CEA	2026-01-15 15:47:54.266253
a7643fc2-65ab-4010-8e67-2ef0f858fd57	EUA	91.9700	EUR	Carbon EUA	2026-01-15 15:47:54.804524
d13c87a6-fc8d-44e7-844b-5a14292008ac	CEA	10.2050	EUR	Carbon CEA	2026-01-15 15:57:55.698309
f864902a-7514-44c1-a11c-b80291c34ac4	EUA	91.9700	EUR	Carbon EUA	2026-01-15 15:57:56.232931
70c22c4e-e794-49ba-bcb2-f6d696fa62d5	CEA	10.2050	EUR	Carbon CEA	2026-01-15 16:05:36.095409
334d81b2-7583-4f32-b424-5d195bd9564b	EUA	92.1300	EUR	Carbon EUA	2026-01-15 16:05:40.293985
2e683c25-a449-4a51-8250-ecea05818b12	CEA	10.2050	EUR	Carbon CEA	2026-01-15 16:16:30.695193
911a8f1f-2c6e-47dd-a5e2-d702116229ea	EUA	92.1300	EUR	Carbon EUA	2026-01-15 16:16:31.168593
8b758ccf-c225-4344-bef8-f253e1e0f1cd	CEA	10.2050	EUR	Carbon CEA	2026-01-15 16:26:32.425673
5201e3a8-fb09-49ac-881a-070d32d9ba4e	EUA	92.1300	EUR	Carbon EUA	2026-01-15 16:26:32.962799
f384ee62-d9c7-4aee-a13f-401a20d8d63f	CEA	10.2050	EUR	Carbon CEA	2026-01-15 16:36:33.84767
cfe98be3-2bc6-4ac0-9b70-1f0eaa72a999	EUA	92.0500	EUR	Carbon EUA	2026-01-15 16:36:34.330572
03fa53cb-4721-438b-94ad-0667cd194ed2	CEA	10.2050	EUR	Carbon CEA	2026-01-15 16:46:35.222492
6e60b035-5fb1-4289-bb9e-66acb083fd2a	EUA	92.0500	EUR	Carbon EUA	2026-01-15 16:46:36.062744
6f182ac8-1518-4440-a875-bc8a42b9a9a3	CEA	10.2050	EUR	Carbon CEA	2026-01-15 16:56:42.405526
0bc28b74-9195-4e76-a7cc-fc312a82f462	EUA	92.0500	EUR	Carbon EUA	2026-01-15 16:56:42.949696
7b327a1b-8e71-4df9-b472-6046851718ea	CEA	10.2050	EUR	Carbon CEA	2026-01-15 17:06:43.859273
7e534088-863f-4768-b34e-3e07ade5ea62	EUA	92.0200	EUR	Carbon EUA	2026-01-15 17:06:44.377368
7fb855dc-6aff-47d6-b2ff-53dd839cfba9	CEA	10.2050	EUR	Carbon CEA	2026-01-15 17:16:45.356292
207f1caa-1cc8-4c32-9ffa-51a9e5f3d567	EUA	92.0200	EUR	Carbon EUA	2026-01-15 17:16:45.871578
74a26dae-1a8e-462c-9e16-739c47e760a3	CEA	10.2050	EUR	Carbon CEA	2026-01-15 17:26:46.759491
4f8af39e-3c25-4837-a75c-eceb598efb22	EUA	92.0200	EUR	Carbon EUA	2026-01-15 17:26:47.229078
796c6573-9755-46f5-8ca4-5e8f23751aea	CEA	10.2050	EUR	Carbon CEA	2026-01-15 17:36:48.16821
777ef03a-2db6-4c3f-8643-8cd0e8bd5a0f	EUA	91.9000	EUR	Carbon EUA	2026-01-15 17:36:48.959936
5bb0c7de-bd92-4929-9cd9-dc077756518c	CEA	10.2050	EUR	Carbon CEA	2026-01-15 17:46:49.924723
ccd9ba26-0c12-4c12-8cd9-dceb3161e7f5	EUA	91.9000	EUR	Carbon EUA	2026-01-15 17:46:50.422371
bf813401-d161-4ceb-bec3-ce7b5ea4416b	CEA	10.2050	EUR	Carbon CEA	2026-01-15 17:56:51.346161
7fd15637-46b7-4cc7-a769-125bb45de868	EUA	91.9000	EUR	Carbon EUA	2026-01-15 17:56:56.835205
96a21da6-6453-4a44-b257-b0991774fb36	CEA	10.2050	EUR	Carbon CEA	2026-01-15 18:06:59.270389
3bb76615-1b69-4e7e-8165-25f3190dcd2e	EUA	91.9000	EUR	Carbon EUA	2026-01-15 18:06:59.754581
239dcef2-900c-4f3b-8207-85dc1018c80e	CEA	10.2050	EUR	Carbon CEA	2026-01-15 18:17:00.699513
d2310cc7-f371-4692-9906-1e5f37269ffd	EUA	91.9000	EUR	Carbon EUA	2026-01-15 18:17:01.33031
be89f222-ca11-4274-bcc8-ae19725d9a9d	CEA	10.2050	EUR	Carbon CEA	2026-01-15 18:27:02.271335
db50ee26-94cf-4076-ae0a-5c0905862d43	EUA	91.9000	EUR	Carbon EUA	2026-01-15 18:27:02.756984
c3d60ecb-db48-4ae0-bbe4-38b2300a1c01	CEA	10.2050	EUR	Carbon CEA	2026-01-15 18:37:03.713609
0a37fd6c-224a-49b0-b036-eb4d10a1d8de	EUA	91.9000	EUR	Carbon EUA	2026-01-15 18:37:04.250936
42d71958-6e57-495a-b16e-550b9f7d17fe	CEA	10.2050	EUR	Carbon CEA	2026-01-15 18:47:05.16562
28fb7b5f-4a52-4aff-8ed9-7b717ac59502	EUA	91.9000	EUR	Carbon EUA	2026-01-15 18:47:05.677347
1eda2df7-ae7c-4212-a310-7456c4486b41	CEA	10.2050	EUR	Carbon CEA	2026-01-15 18:57:07.028574
572ccdb4-42e5-474f-bafc-f07391574e87	EUA	91.9000	EUR	Carbon EUA	2026-01-15 18:57:07.567907
9f6d994b-bb99-4f49-8d63-6b9f8825cb5b	CEA	10.2050	EUR	Carbon CEA	2026-01-15 19:07:08.913542
7416d6ad-26ab-474e-ba7b-782a997e5b0c	EUA	91.9000	EUR	Carbon EUA	2026-01-15 19:07:09.537187
27143d73-f6d7-4c2e-9030-9db652b2dc07	CEA	10.2050	EUR	Carbon CEA	2026-01-15 19:17:10.716869
beec608e-dff2-419e-9684-197138feeeb0	EUA	91.9000	EUR	Carbon EUA	2026-01-15 19:17:11.517004
6184a23a-49fe-4c08-b58f-9746595f2043	CEA	10.2050	EUR	Carbon CEA	2026-01-15 19:27:12.89158
267e1216-2d8d-45f1-a34a-fa8778c7427c	EUA	91.9000	EUR	Carbon EUA	2026-01-15 19:27:13.42609
b1ba0fbe-edcd-4cf8-ab9a-47dd8df7f898	CEA	10.2050	EUR	Carbon CEA	2026-01-15 19:37:14.352485
a11ffc1c-dfa8-4b58-a2d0-d1d3b2970440	EUA	91.9000	EUR	Carbon EUA	2026-01-15 19:37:14.858825
066f09b6-a75d-4b7b-9625-1a5596e6b1e4	CEA	10.2050	EUR	Carbon CEA	2026-01-15 19:47:15.802408
d47cdf88-1522-4dc5-b2bb-41c926133c72	EUA	91.9000	EUR	Carbon EUA	2026-01-15 19:47:16.314726
0deae59b-449a-408f-85d0-526eaea6a5b1	CEA	10.2050	EUR	Carbon CEA	2026-01-15 19:57:17.372334
b13e97fe-7408-4328-bc9f-1c20fb2025f4	EUA	91.9000	EUR	Carbon EUA	2026-01-15 19:57:17.913178
4eaa7d99-00d3-4094-ae7e-1832da603865	CEA	10.2050	EUR	Carbon CEA	2026-01-15 20:07:18.817851
a4941a5c-53d7-4ced-946d-929504dee0d9	EUA	91.9000	EUR	Carbon EUA	2026-01-15 20:07:19.35594
f85b28f4-ebfc-43c7-9083-ed4c94616ac8	CEA	10.2050	EUR	Carbon CEA	2026-01-15 20:17:20.266307
3ff4a417-1c1f-4728-af89-0feb389a2589	EUA	91.9000	EUR	Carbon EUA	2026-01-15 20:17:20.752162
7c2a5e65-62f8-4f06-99ff-9aaeae9af58d	CEA	10.2050	EUR	Carbon CEA	2026-01-15 20:27:21.593844
69f5d31a-5493-46ed-bf14-e65962fafcad	EUA	91.9000	EUR	Carbon EUA	2026-01-15 20:27:22.076615
025cb5d5-9be2-4202-8e5f-c48377a9d7e7	CEA	10.2050	EUR	Carbon CEA	2026-01-15 20:37:23.042215
c2fd711d-a885-4e60-8cbc-7e1e33736557	EUA	91.9000	EUR	Carbon EUA	2026-01-15 20:37:23.685936
86beaed2-49c1-4723-aed0-b95291864b50	CEA	10.2050	EUR	Carbon CEA	2026-01-15 20:47:24.545913
0f7ffc4a-0ec2-42aa-846b-d69fff449c9f	EUA	91.9000	EUR	Carbon EUA	2026-01-15 20:47:25.417813
755f5f99-59d9-460a-8758-c14274a94646	CEA	10.2050	EUR	Carbon CEA	2026-01-15 20:57:26.696709
27e1bb5b-64b1-407d-9760-abfafd78296b	EUA	91.9000	EUR	Carbon EUA	2026-01-15 20:57:27.154593
dd446254-60d0-43ee-b744-09b78c7b10e5	CEA	10.2050	EUR	Carbon CEA	2026-01-15 21:07:32.141325
1bc91093-7bc9-4f66-a846-7b7cb46249a1	EUA	91.9000	EUR	Carbon EUA	2026-01-15 21:07:32.668474
ec279798-5dc9-4e48-8f22-52f985ce6d1c	EUA	91.9000	EUR	Carbon EUA	2026-01-15 21:17:33.512628
66a10b7d-9518-4cef-9d3f-2a928f9ddbbb	CEA	10.2050	EUR	Carbon CEA	2026-01-15 21:17:34.375858
bd05bcfd-cc0c-4c84-adb4-f2afc01f8e9e	EUA	91.9000	EUR	Carbon EUA	2026-01-15 21:27:35.245685
aa60821d-2a35-41db-8fcd-df4b74db92a0	CEA	10.2050	EUR	Carbon CEA	2026-01-15 21:27:35.741696
389c8652-e18f-44b7-b521-38752c3982fb	EUA	91.9000	EUR	Carbon EUA	2026-01-15 21:37:36.650346
24cf94fb-8662-4beb-b512-d10bc3b8de8c	CEA	10.2050	EUR	Carbon CEA	2026-01-15 21:37:37.162364
21f166c1-d807-4ab3-8174-4c1f31b5a0f8	EUA	91.9000	EUR	Carbon EUA	2026-01-15 21:47:43.055223
d28eaf6a-a98f-41a6-823c-a81a186b390e	CEA	10.2050	EUR	Carbon CEA	2026-01-15 21:47:43.52791
de04adcf-30b2-4ef4-9c7a-1f737560e350	EUA	91.9000	EUR	Carbon EUA	2026-01-15 21:57:44.825762
207b8c32-40d9-486e-a6c6-131cca761689	CEA	10.2050	EUR	Carbon CEA	2026-01-15 21:57:45.297718
abf3d5fc-7f5b-4159-a294-d01c2ef55b92	EUA	91.9000	EUR	Carbon EUA	2026-01-15 22:07:46.20668
076e5fcf-55c8-4280-bbe0-eb868c3755ad	CEA	10.2050	EUR	Carbon CEA	2026-01-15 22:07:46.822339
d57cad71-1a3c-49b8-94d4-dbe385189cf8	EUA	91.9000	EUR	Carbon EUA	2026-01-15 22:17:47.882121
c221bd97-b8d2-466e-906e-7b7dc6a897ea	CEA	10.2050	EUR	Carbon CEA	2026-01-15 22:17:48.517435
6d4e5725-e082-4f99-87fc-488cb411295b	EUA	91.9000	EUR	Carbon EUA	2026-01-15 22:27:49.540149
9aa4e891-a3a6-4cb3-8cc9-fe4f47c12ef8	CEA	10.2050	EUR	Carbon CEA	2026-01-15 22:27:50.070731
5bb08547-3171-4a79-8468-96fba4aab23e	EUA	91.9000	EUR	Carbon EUA	2026-01-15 22:37:50.939956
152a11b4-b9e2-436d-af4d-69f485b9352c	CEA	10.2050	EUR	Carbon CEA	2026-01-15 22:37:51.788971
54888657-ac2a-4095-b36f-afafd1938cb2	EUA	91.9000	EUR	Carbon EUA	2026-01-15 22:47:52.782055
6e952872-9028-49d7-b48b-f10edd07e015	CEA	10.2050	EUR	Carbon CEA	2026-01-15 22:47:53.314838
f44bfb7c-32eb-41e2-8f70-3975522d1ce2	EUA	91.9000	EUR	Carbon EUA	2026-01-15 22:57:54.128513
e9827bc0-a198-4ef1-ab26-bdd748ce416e	CEA	10.2050	EUR	Carbon CEA	2026-01-15 22:57:54.962642
5f89089d-c320-4226-9c22-54fee09bcd2b	EUA	91.9000	EUR	Carbon EUA	2026-01-15 23:07:56.012375
cd7196e9-32e9-424f-8e24-dc492b805ca7	CEA	10.2050	EUR	Carbon CEA	2026-01-15 23:07:56.55009
53cf7af8-a521-4c65-a3ec-39e58e5ad260	EUA	91.9000	EUR	Carbon EUA	2026-01-15 23:18:06.892243
da00b540-9da2-4871-9d15-5daa83d6dfaf	CEA	10.2050	EUR	Carbon CEA	2026-01-15 23:18:09.191971
42131677-f52a-48b1-bf34-11428b8768e7	EUA	91.9000	EUR	Carbon EUA	2026-01-15 23:28:10.261629
0a72d8fa-77b5-4e37-80f4-902e499c7602	CEA	10.2050	EUR	Carbon CEA	2026-01-15 23:28:10.823613
8f5a6f0b-7500-41cf-b2c2-b7284aaf32a5	EUA	91.9000	EUR	Carbon EUA	2026-01-15 23:38:11.826995
b9b2007d-1326-413a-b70c-ebd24f912208	CEA	10.2050	EUR	Carbon CEA	2026-01-15 23:38:12.257442
8c1438f8-e191-4412-a593-41760fe4601d	EUA	91.9000	EUR	Carbon EUA	2026-01-15 23:48:13.204783
f606bd6f-e8f4-4da5-bb9d-434ee5dead08	CEA	10.2050	EUR	Carbon CEA	2026-01-15 23:48:13.65642
13d3b250-511e-4fc7-836c-bafcb5318a0a	EUA	91.9000	EUR	Carbon EUA	2026-01-15 23:58:14.86044
78e84a66-d7ff-4a2b-94ac-50af68229668	CEA	10.2050	EUR	Carbon CEA	2026-01-15 23:58:15.397092
6119f469-88b7-4296-a4ae-c41e90b27f7e	EUA	91.9000	EUR	Carbon EUA	2026-01-16 00:08:21.252
ea4a1cca-4ebf-44b2-b7d3-db14c0d06737	CEA	10.2050	EUR	Carbon CEA	2026-01-16 00:08:22.002492
16f1b1c9-ec47-45e9-8250-03d9e19ef63c	EUA	91.9000	EUR	Carbon EUA	2026-01-16 00:18:22.844447
d6c7bcd4-2ba9-4cc7-9aaa-f26b6ccd9130	CEA	10.2050	EUR	Carbon CEA	2026-01-16 00:18:23.366395
63719bb2-611c-4efa-9e1b-fef8215ac6d4	EUA	91.9000	EUR	Carbon EUA	2026-01-16 00:28:24.237842
a5e3739e-8010-4403-9db5-08b111044186	CEA	10.2050	EUR	Carbon CEA	2026-01-16 00:28:24.712089
f10b5f5e-cffc-4cec-8d4f-a15cdc529d56	EUA	91.9000	EUR	Carbon EUA	2026-01-16 00:38:25.536497
e1cccaae-4db2-4965-8bfb-e6cc89b03249	CEA	10.2050	EUR	Carbon CEA	2026-01-16 00:38:26.068617
e9908360-b7f0-481e-a255-0af6c646c965	EUA	91.9000	EUR	Carbon EUA	2026-01-16 00:48:26.965557
a996704a-dfe8-435d-ab71-58f9ccc854bb	CEA	10.2050	EUR	Carbon CEA	2026-01-16 00:48:27.421902
65729ba6-57fe-4df9-b70a-feda6a95f201	EUA	91.9000	EUR	Carbon EUA	2026-01-16 00:58:28.35177
28c54027-9a85-44da-b642-a4d58fe8097e	CEA	10.2050	EUR	Carbon CEA	2026-01-16 00:58:28.801213
2be66386-6b8c-4197-a4bc-7e6f77337981	EUA	91.9000	EUR	Carbon EUA	2026-01-16 01:08:29.778315
8695364e-c3b1-4dc6-a2b9-dcaac4e79290	CEA	10.2050	EUR	Carbon CEA	2026-01-16 01:08:30.242806
5e7477d8-c008-44a4-aa2d-08e3da83532d	EUA	91.9000	EUR	Carbon EUA	2026-01-16 01:18:31.491368
6f843647-4b1e-4aa4-a026-e4d8f10dd951	CEA	10.2050	EUR	Carbon CEA	2026-01-16 01:18:32.042079
22ef6143-7797-48c3-9cac-b120a156844b	EUA	91.9000	EUR	Carbon EUA	2026-01-16 01:28:33.02325
fa1840d9-2f2d-49ef-8bc0-fb18f51b5c0b	CEA	10.2050	EUR	Carbon CEA	2026-01-16 01:28:33.490882
04744675-e2d2-45a6-a6ee-9004ed36c1c4	EUA	91.9000	EUR	Carbon EUA	2026-01-16 01:38:34.467862
c09991b2-a9af-403b-89a2-5bcbf3ffd381	CEA	10.2050	EUR	Carbon CEA	2026-01-16 01:38:34.968512
e2301fc3-6ed7-4b64-a03c-1aa86b863eaf	EUA	91.9000	EUR	Carbon EUA	2026-01-16 01:48:36.08583
d5f894b6-2f41-4285-9d7c-ee0e2ecf64ff	CEA	10.2050	EUR	Carbon CEA	2026-01-16 01:48:36.626039
fad27699-3756-4366-8b0c-2d05b91a36c6	EUA	91.9000	EUR	Carbon EUA	2026-01-16 01:58:37.547554
19a65c8f-b247-4763-8306-5c61975d285f	CEA	10.2050	EUR	Carbon CEA	2026-01-16 01:58:38.053753
8f0d8cd0-2f81-41d0-8ec5-7ad60276bba1	EUA	91.9000	EUR	Carbon EUA	2026-01-16 02:08:38.903565
37b34115-eda6-4391-9d85-a5dcae451236	CEA	10.2050	EUR	Carbon CEA	2026-01-16 02:08:39.351949
72b07fef-4c8e-4aa3-ad77-62438c1e5312	EUA	91.9000	EUR	Carbon EUA	2026-01-16 02:18:40.228512
de5bc5fc-92e9-4836-879e-e544b795ee45	CEA	10.2050	EUR	Carbon CEA	2026-01-16 02:18:40.772243
f44122f5-faa4-48f3-84b1-0ab0ff3a03a3	EUA	91.9000	EUR	Carbon EUA	2026-01-16 02:28:41.623645
e1318d0c-b46e-4615-8e7f-c165be6eb20b	CEA	10.2050	EUR	Carbon CEA	2026-01-16 02:28:42.13261
62d2a130-4050-46a5-94e9-006d8377d560	EUA	91.9000	EUR	Carbon EUA	2026-01-16 02:38:43.470611
aadb7faf-bbce-410d-a53f-80e8519cea82	CEA	10.2050	EUR	Carbon CEA	2026-01-16 02:38:44.014492
5abf5827-3a6c-4207-983d-26b98da76295	EUA	91.9000	EUR	Carbon EUA	2026-01-16 02:48:44.928618
ec7d019b-2d5d-4fae-837a-865b7d4b52fc	CEA	10.2050	EUR	Carbon CEA	2026-01-16 02:48:45.430566
c2517e0c-c7fc-42a5-96fa-93555b77f89d	EUA	91.9000	EUR	Carbon EUA	2026-01-16 02:58:46.45603
7af3593e-2843-4b64-9a15-9f7a71dae2e7	CEA	10.2050	EUR	Carbon CEA	2026-01-16 02:58:46.923369
971c2b3f-8c9b-42f1-9a21-12f401de00cd	EUA	91.9000	EUR	Carbon EUA	2026-01-16 03:08:48.138628
fefa42c5-ceb6-4065-b827-f700bed592f6	CEA	10.2050	EUR	Carbon CEA	2026-01-16 03:08:48.685812
7939de0c-5466-453c-9761-6d3a91107329	EUA	91.9000	EUR	Carbon EUA	2026-01-16 03:18:49.665464
685a7e17-6098-4f51-bfd6-4dc3b96ee83e	CEA	10.2050	EUR	Carbon CEA	2026-01-16 03:18:50.101719
3d906b94-b085-4deb-81d9-b5eb3f385462	EUA	91.9000	EUR	Carbon EUA	2026-01-16 03:28:51.411173
fc7e2f56-9416-40ae-a24c-8050dcf0c89f	CEA	10.2050	EUR	Carbon CEA	2026-01-16 03:28:51.921997
91bd223b-c57e-484b-a78a-47d68eaeefb1	EUA	91.9000	EUR	Carbon EUA	2026-01-16 03:38:52.939203
8a03b274-e0e0-4002-b989-a274e69747cf	CEA	10.2050	EUR	Carbon CEA	2026-01-16 03:38:53.412614
10c7ed26-4ef3-43c9-acb8-2154d50b43ef	EUA	91.9000	EUR	Carbon EUA	2026-01-16 03:48:54.611671
9736b483-7a86-4bb1-836d-b6e648918ee1	CEA	10.2050	EUR	Carbon CEA	2026-01-16 03:48:55.15722
0cb52de8-73ca-416a-be86-90b39ab3a935	EUA	91.9000	EUR	Carbon EUA	2026-01-16 03:58:56.052097
581504a7-4172-43b6-97bb-1c7ac2d79648	CEA	10.2050	EUR	Carbon CEA	2026-01-16 03:58:56.501745
95f8f926-16d0-4013-a1b0-cc9a7d7cb521	CEA	10.2050	EUR	Carbon CEA	2026-01-16 04:00:32.992843
5a9ba2cb-842e-4593-bcd2-a582451abc6e	EUA	91.9000	EUR	Carbon EUA	2026-01-16 04:09:31.931185
a89236ed-5c2e-4b59-9be4-2c4ce41ca53c	CEA	10.2050	EUR	Carbon CEA	2026-01-16 04:11:32.517165
b73df624-4f58-488f-9e82-5fa6aea9d513	EUA	91.9000	EUR	Carbon EUA	2026-01-16 04:19:33.287095
44fa5ad4-16f9-4533-b4f5-eb4cc265487e	CEA	10.2050	EUR	Carbon CEA	2026-01-16 04:21:33.87104
83062732-e1d7-469e-923a-779bec023704	EUA	91.9000	EUR	Carbon EUA	2026-01-16 04:29:34.716889
d609b6d7-2128-4234-bde5-359dcdfb6fb0	CEA	10.2050	EUR	Carbon CEA	2026-01-16 04:31:35.300361
383d03e8-c4cb-4925-a857-efdbd1780c6e	EUA	91.9000	EUR	Carbon EUA	2026-01-16 04:39:36.14042
e8ced53c-d60b-49d6-ad89-4696b8e5902b	CEA	10.2050	EUR	Carbon CEA	2026-01-16 04:41:36.661591
f4c54064-cd15-43b2-8407-6c4ebd0b023a	EUA	91.9000	EUR	Carbon EUA	2026-01-16 04:49:37.425953
8fd7c0ce-f1bf-4f7a-ba22-f365f4793692	CEA	10.2050	EUR	Carbon CEA	2026-01-16 04:51:38.012548
bafbb595-1625-4d83-9ca1-c14a9ef1081e	CEA	10.2050	EUR	Carbon CEA	2026-01-16 04:55:37.093807
b10366af-7d4c-4ff2-b674-066c7db2ded1	EUA	91.9000	EUR	Carbon EUA	2026-01-16 04:55:38.314658
7d5e5351-7cdc-43af-a5e0-227ddc1c7bb4	CEA	10.2050	EUR	Carbon CEA	2026-01-16 05:05:38.97004
4af8c3ba-e5a5-49d5-9bfa-7c8d595ad3dd	EUA	91.9000	EUR	Carbon EUA	2026-01-16 05:05:39.506532
df7dcd30-bb2c-4cdd-beab-de781f4c5166	CEA	10.2050	EUR	Carbon CEA	2026-01-16 05:15:40.428988
6e42f505-3e00-4daa-ac1b-27b61d4bf76d	EUA	91.9000	EUR	Carbon EUA	2026-01-16 05:15:40.914801
56867c98-b14d-4d6c-97b3-7e4d1926b31c	CEA	10.2050	EUR	Carbon CEA	2026-01-16 05:25:41.726935
847bda26-285f-4309-964c-f9b0daf632a8	EUA	91.9000	EUR	Carbon EUA	2026-01-16 05:25:42.223428
15a891da-b258-4c19-91e1-da6bf431503f	CEA	10.2050	EUR	Carbon CEA	2026-01-16 05:35:43.046815
5d59f835-ecfc-4443-900f-43e69d80b783	EUA	91.9000	EUR	Carbon EUA	2026-01-16 05:35:43.588649
07139370-e99d-4d27-8306-114079c77385	CEA	10.2050	EUR	Carbon CEA	2026-01-16 05:45:44.40648
1fe2926c-0eff-4b88-a33c-e4d595770575	EUA	91.9000	EUR	Carbon EUA	2026-01-16 05:45:44.971015
177528ae-fb17-4cdb-9a3d-29ca05aa4627	CEA	10.2050	EUR	Carbon CEA	2026-01-16 05:55:45.818409
50b53de2-7228-498c-a02e-b345777a2b78	EUA	91.9000	EUR	Carbon EUA	2026-01-16 05:55:46.460959
5ef1478e-8128-4d86-a029-83298f87fabb	CEA	10.2050	EUR	Carbon CEA	2026-01-16 06:05:47.321009
83cef14e-2503-430c-9329-2ae86cac3388	EUA	91.9000	EUR	Carbon EUA	2026-01-16 06:05:47.788654
eb833553-2891-419b-9948-7291995df1cf	CEA	10.2050	EUR	Carbon CEA	2026-01-16 06:15:48.58128
90aa781a-26b7-4c16-95d6-169c0641bfef	EUA	91.9000	EUR	Carbon EUA	2026-01-16 06:15:49.044462
64dbdbd7-66b4-4907-a976-9cbf47b26436	CEA	10.2050	EUR	Carbon CEA	2026-01-16 06:25:50.354873
d119a77d-d533-4f17-8ee0-704763560ad8	EUA	91.9000	EUR	Carbon EUA	2026-01-16 06:25:51.138659
d844bd26-e654-4f10-bcde-6f8f301705ab	CEA	10.2050	EUR	Carbon CEA	2026-01-16 06:35:52.241846
04a0f67a-b434-4c31-a49c-f301f91eec5b	EUA	91.9000	EUR	Carbon EUA	2026-01-16 06:35:52.772758
109dbfc1-e3af-4f0a-99a2-99d34255bf60	CEA	10.2050	EUR	Carbon CEA	2026-01-16 06:45:53.632896
e1bc6b9f-cf74-45ec-9c91-a2b604dbc153	EUA	91.9000	EUR	Carbon EUA	2026-01-16 06:45:54.126932
2c0e5544-1715-4151-985c-8337a7e29df3	CEA	10.2050	EUR	Carbon CEA	2026-01-16 06:55:55.13878
a65b119f-17b6-4ad8-ba14-b4a5ee7704e9	EUA	91.9000	EUR	Carbon EUA	2026-01-16 06:55:55.618202
0aa37bba-6f33-45af-9b7b-8c89e0c3372c	CEA	10.2050	EUR	Carbon CEA	2026-01-16 07:05:56.408409
cfc58ecb-5216-45e3-a1b9-3da5514c5835	EUA	91.9000	EUR	Carbon EUA	2026-01-16 07:05:56.863102
fe536076-23b2-46f6-870d-cc618b7eeb60	CEA	10.2050	EUR	Carbon CEA	2026-01-16 07:15:58.195086
95849836-136e-4068-941f-9c4667f3ef1c	EUA	91.9000	EUR	Carbon EUA	2026-01-16 07:15:58.727822
42589963-84cd-4243-a783-5f364bbe25df	CEA	10.2050	EUR	Carbon CEA	2026-01-16 07:25:59.602037
10fc4d4c-5c81-4c1c-89ef-e9248e04b9ba	EUA	91.9000	EUR	Carbon EUA	2026-01-16 07:26:00.087277
b984b405-cfae-45ee-8216-ee0bdd53ea45	CEA	10.2050	EUR	Carbon CEA	2026-01-16 07:36:00.961795
2ff70e76-eaf5-481e-a65f-153afab09d78	EUA	92.1700	EUR	Carbon EUA	2026-01-16 07:36:01.440742
ed61710e-3a97-4c7b-a670-d6a2a87a98e2	CEA	10.2050	EUR	Carbon CEA	2026-01-16 07:46:02.26482
36bf8f8a-8304-45fa-8a0e-a2a4b812d536	EUA	92.1700	EUR	Carbon EUA	2026-01-16 07:46:02.798558
8ac6e89f-8b4f-41cd-8959-eb29d4052659	EUA	92.1700	EUR	Carbon EUA	2026-01-16 07:56:47.043542
58a41dda-4a38-40f2-88ca-7fcda894163b	CEA	10.2050	EUR	Carbon CEA	2026-01-16 07:56:48.001256
6113d68b-d76d-4c9d-85e3-85c34ab24a59	EUA	92.6200	EUR	Carbon EUA	2026-01-16 08:06:49.991547
12cbb426-796a-4062-ab73-78e75b9a68be	CEA	10.2050	EUR	Carbon CEA	2026-01-16 08:06:50.586654
ceedb884-08f8-468e-a1d9-a421e6b271fe	EUA	92.6200	EUR	Carbon EUA	2026-01-16 08:17:14.73079
246acc43-60e4-4b8f-9fb6-596d242a9d8d	CEA	10.2050	EUR	Carbon CEA	2026-01-16 08:17:15.993348
4f63f429-3adf-4591-99fa-0880c1a36598	EUA	92.6200	EUR	Carbon EUA	2026-01-16 08:27:29.064598
96ed22fa-9efa-4a45-a1ab-46a48727f88e	CEA	10.2050	EUR	Carbon CEA	2026-01-16 08:27:32.116357
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.refresh_tokens (id, user_id, token_hash, expires_at, revoked, revoked_at, used, used_at, created_at) FROM stdin;
177f82a4-4fce-4ba6-89b3-4ddec0932dae	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	be728e984479907c5cbb3bbdb9fa1ed079f644bc698a7e6b85a728ccd81828f2	2026-01-22 11:46:08.189699	f	\N	f	\N	2026-01-15 11:46:08.195282
e84f031e-d7e5-43d3-9c7d-7e8132a9195c	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	31d43fe16028ec49305357714ceca0e86b63b3ab201dfaa740c4ba541e36d8a1	2026-01-22 11:47:08.402893	f	\N	f	\N	2026-01-15 11:47:08.409276
c541281e-3f2e-41b5-8e9f-4d5223851908	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	0704e8b619ea5c89ce68efe1cc02f385d3389d77cb1f3d8622bf9f5c3e8e8d4f	2026-01-22 13:12:11.838533	f	\N	f	\N	2026-01-15 13:12:11.843775
ef26ffa2-70e4-4b60-9891-a2eff0479d3e	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	0c189e4f41fc4c536170b7551be334e94a0505fd7adef228b88655b4abbaebf6	2026-01-22 13:12:22.781897	f	\N	f	\N	2026-01-15 13:12:22.79183
22a57c40-eaff-4b2c-9b13-358778c2b5dc	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	acb356e51bd927152207bcd3f75d5b56e61e89423ac07ad7b51f63a7f032d83f	2026-01-22 13:20:17.755706	f	\N	f	\N	2026-01-15 13:20:17.759959
588a0061-89b0-4d08-a852-d488f44b7d10	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	a801a0bea558c2e62b8dab8ba85bd81723246a07c0dd17e3fcd323cb7b1d6c32	2026-01-22 13:43:57.037164	f	\N	f	\N	2026-01-15 13:43:57.041192
21e0a735-4a6e-4fed-a4c8-8062aaa95651	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	9ca764a18cdddf73315984153f32932e19d1acecd98dcfbe7aaaf617fcfdc533	2026-01-22 14:18:46.298243	f	\N	f	\N	2026-01-15 14:18:46.302039
31ff74c4-df78-4703-9eef-c6a0608f967e	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	4ea7bde13c66502848345d7268363ea5b38840d2dc744cfded9c30544681c32d	2026-01-22 20:58:35.808648	f	\N	f	\N	2026-01-15 20:58:35.81249
b15d60c8-1c88-4ccb-859f-967841503d22	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	adae57cc1320e22d58956d618a3680a7ec56aa30ca1b86993c80b13b92b09af3	2026-01-22 21:43:53.653071	f	\N	f	\N	2026-01-15 21:43:53.661248
b924daf2-f341-4d91-960a-72a255f0f98b	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	dda5c0e48d61de637586c9c992731ffbe64940c2c6180898b83c0a3e0a45ae7a	2026-01-22 14:52:21.526458	f	\N	f	\N	2026-01-15 14:52:21.530461
8de5bdc4-a3a5-4d97-8b42-25fdfaf5c0f3	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	ff4ddf5a6cac7b27e210bfab3d07e3f49bbdcd7d23e4ca346aaf5d55c3db36b1	2026-01-22 15:44:27.15732	f	\N	f	\N	2026-01-15 15:44:27.161208
3fd01886-996b-4a16-9d69-48a23fcff868	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	3849506f2f205e5d594ccb49ebfa7d18c61dbf443bda0acfa703fe2df67459f0	2026-01-22 16:03:52.766406	f	\N	f	\N	2026-01-15 16:03:52.777375
8e92536d-60bb-4f7b-9837-2cee7d35660e	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	800d6ea0f97cc68a44d90fe06a27656e3134626dca8d6a0f18ad00330476b350	2026-01-22 16:04:08.053031	f	\N	f	\N	2026-01-15 16:04:08.058633
a27b17b9-f622-44f1-b790-62c91ad6a632	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	6a1320ad50fb12a69ec01053baabc42085ed6b005d669080a910ca606f4b8220	2026-01-22 16:28:11.815503	f	\N	f	\N	2026-01-15 16:28:11.819428
f3479000-570d-4920-be60-e917fe13af0a	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	5840d48d1e9d704611a0b5c5541c3395e4295d1b1a6cf7847204b77ef3f60a88	2026-01-23 03:46:52.624136	f	\N	f	\N	2026-01-16 03:46:52.628703
3a513c1e-c875-480b-b3a5-d88c98726fa7	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	3cfcf66bd903764e13fc6ec9f6b429e5837f146daad48391dda0c036fcf71638	2026-01-23 03:58:56.425502	f	\N	f	\N	2026-01-16 03:58:56.430507
df621038-9fcf-4519-9f09-4c6d0204789e	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	a8800c71ff01b76f38430bb0e9922ec7d8b2f3150d89c5c0ff7e4e6a601c2c61	2026-01-23 03:59:30.74272	f	\N	f	\N	2026-01-16 03:59:30.748216
4b7bf237-3ed1-4bd9-8c66-f23cbd2f686d	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	842362bf25661a54a02df1338f78c66361f98ae938b1a828bf247ea902c0a2e5	2026-01-23 04:54:22.016607	f	\N	f	\N	2026-01-16 04:54:22.020418
013f1eaf-9a64-4baf-a962-99670ef78c75	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	bf60f8e53a9551e5e87c406b7eb911f0d0c16988de8213a295f12042c0c06d5e	2026-01-23 04:54:25.858784	f	\N	f	\N	2026-01-16 04:54:25.864107
be36ae91-826f-4eea-8549-5d955d5897cf	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	a28959176ad326fe77e48427583d5c53746ada62ebf75b3f131063c8d98a2506	2026-01-23 04:54:48.861422	f	\N	f	\N	2026-01-16 04:54:48.867337
bf7389ec-97dd-44d3-be63-82479c5588eb	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	df54b1787791220eae13bdf6ef32ccab61c88c726d3cef5dc9ebd39f59b9fe8d	2026-01-23 04:55:20.735541	f	\N	f	\N	2026-01-16 04:55:20.742625
\.


--
-- Data for Name: scraping_sources; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.scraping_sources (id, name, url, certificate_type, scrape_library, is_active, scrape_interval_minutes, last_scrape_at, last_scrape_status, last_price, config, created_at, updated_at) FROM stdin;
367a8d4c-a8be-4b44-875e-24a2ed17d4b5	Carbon EUA	https://carboncredits.com/carbon-prices-today/	EUA	HTTPX	t	10	2026-01-16 08:27:29.062332	SUCCESS	92.6200	null	2026-01-15 04:45:41.648004	2026-01-16 08:27:29.232596
6c5d6360-998e-4a10-a438-126de01c5a47	Carbon CEA	https://carboncredits.com/carbon-prices-today/	CEA	HTTPX	t	10	2026-01-16 08:27:30.075596	SUCCESS	10.2050	null	2026-01-15 04:46:07.447586	2026-01-16 08:27:35.389507
\.


--
-- Data for Name: sellers; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.sellers (id, client_code, name, company_name, jurisdiction, cea_balance, cea_sold, total_transactions, is_active, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: settlement_batches; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.settlement_batches (id, batch_reference, entity_id, order_id, trade_id, counterparty_id, settlement_type, status, asset_type, quantity, price, total_value_eur, expected_settlement_date, actual_settlement_date, registry_reference, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: settlement_status_history; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.settlement_status_history (id, settlement_batch_id, status, notes, updated_by, created_at) FROM stdin;
\.


--
-- Data for Name: swap_requests; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.swap_requests (id, entity_id, from_type, to_type, quantity, desired_rate, status, matched_with, anonymous_code, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ticket_logs; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.ticket_logs (id, ticket_id, user_id, entity_id, seller_id, market_maker_id, counterparty_entity_id, counterparty_user_id, order_id, trade_id, deposit_id, certificate_type, side, order_type, price, price_eur, volume, amount, currency, platform_fee, swap_commission, total_cost, details, notes, ip_address, created_at, ai_client_id, "timestamp", action_type, entity_type, status, request_payload, response_data, user_agent, session_id, before_state, after_state, related_ticket_ids, tags) FROM stdin;
fc6e7783-2823-4c95-b395-75896eed49cc	TKT-20260115-3EY8ZN	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"action": "ai_client_created", "client_id": "ni-4BJ-MVKA6", "initial_balances": {"eur": 10000000.0, "cea": 100000.0, "eua": 100000.0}}	\N	\N	2026-01-15 13:24:12.088474	bb914409-4633-456c-9c43-a31e0269f8f6	2026-01-25 03:32:35.787984	UNKNOWN	Unknown	SUCCESS	\N	\N	\N	\N	\N	\N	\N	\N
2ca21466-2688-4860-8ea8-607c6d890a78	TKT-2026-000083	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	e94be66a-a603-4df9-b2fd-66f43fe7b891	\N	e94be66a-a603-4df9-b2fd-66f43fe7b891	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-25 01:35:06.754067	MM_CREATED	MarketMaker	SUCCESS	{"name": "Test MM Email", "email": "test-mm-email@marketmaker.niha.internal", "mm_type": "CASH_BUYER", "description": "Testing email field implementation", "initial_eur_balance": "10000"}	null	\N	\N	null	{"id": "e94be66a-a603-4df9-b2fd-66f43fe7b891", "name": "Test MM Email", "mm_type": "CASH_BUYER", "is_active": true, "eur_balance": "10000"}	{}	{market_maker,creation}
819e1c27-128e-4261-9e29-9e5d225d6770	TKT-2026-000084	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	eafa0f39-f3ae-49c5-92c6-b01766ab3a29	\N	eafa0f39-f3ae-49c5-92c6-b01766ab3a29	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-25 01:35:29.90234	MM_CREATED	MarketMaker	SUCCESS	{"name": "Final Test MM", "email": "final-test-mm@marketmaker.niha.internal", "mm_type": "CASH_BUYER", "description": "Final test of email field implementation", "initial_eur_balance": "25000"}	null	\N	\N	null	{"id": "eafa0f39-f3ae-49c5-92c6-b01766ab3a29", "name": "Final Test MM", "mm_type": "CASH_BUYER", "is_active": true, "eur_balance": "25000"}	{}	{market_maker,creation}
204b3288-b769-4739-b0ba-3136e193071d	TKT-2026-000091	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	7754f081-a1b1-4537-aacc-50f2db2d1f58	\N	7754f081-a1b1-4537-aacc-50f2db2d1f58	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-25 02:03:43.469047	MM_CREATED	MarketMaker	SUCCESS	{"name": "mm4", "email": "mm4@marketmaker.niha.internal", "mm_type": "CEA_CASH_SELLER", "description": null, "initial_eur_balance": null}	null	\N	\N	null	{"id": "7754f081-a1b1-4537-aacc-50f2db2d1f58", "name": "mm4", "mm_type": "CEA_CASH_SELLER", "is_active": true, "eur_balance": "0"}	{}	{market_maker,creation}
5ca1a000-73b0-4e45-8a02-954704f8e54c	TKT-2026-000092	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	8afbc77f-d53b-48a2-8d64-97231f6b678e	\N	7754f081-a1b1-4537-aacc-50f2db2d1f58	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-25 02:03:43.486182	ASSET_DEPOSIT	AssetTransaction	SUCCESS	{"amount": "1000000", "certificate_type": "CEA", "transaction_type": "DEPOSIT"}	null	\N	\N	null	{"balance_after": "1000000", "previous_balance": "0"}	{TKT-2026-000091}	{asset_transaction,deposit}
f10802c8-916f-487f-ade9-30a403f17e2a	TKT-2026-000095	1a32a0cb-26e9-407c-8f8b-a6c276d518bd	07b910aa-ea74-476f-9e6f-6940dac46b88	\N	7754f081-a1b1-4537-aacc-50f2db2d1f58	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-25 02:18:01.737171	ASSET_DEPOSIT	AssetTransaction	SUCCESS	{"amount": "100000", "certificate_type": "CEA", "transaction_type": "DEPOSIT"}	null	\N	\N	null	{"balance_after": "1100000.00", "previous_balance": "1000000.00"}	{}	{asset_transaction,deposit}
\.


--
-- Data for Name: trades; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.trades (id, trade_type, buyer_entity_id, seller_entity_id, certificate_id, certificate_type, quantity, price_per_unit, total_value, status, created_at, completed_at) FROM stdin;
\.


--
-- Data for Name: trading_fee_configs; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.trading_fee_configs (id, market, bid_fee_rate, ask_fee_rate, is_active, created_at, updated_at, updated_by) FROM stdin;
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.user_sessions (id, user_id, ip_address, user_agent, device_info, started_at, ended_at, duration_seconds, is_active) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.users (id, entity_id, email, password_hash, first_name, last_name, "position", phone, role, is_active, must_change_password, invitation_token, invitation_sent_at, invitation_expires_at, created_by, creation_method, last_login, created_at, updated_at) FROM stdin;
2396c1e9-57a3-4fd0-a79c-e2d4dfef4f3b	dd9b9b61-acfe-494c-9c4f-a518bd994b7f	eu@eu.ro	$2b$12$7V9Bas1N1UPOQ7WUaMTlSuwE8ilxx7ZzHr3mEyYbbCliwL7gbyrki	Test	User	\N	\N	APPROVED	t	f	\N	\N	\N	\N	\N	\N	2026-01-15 04:23:13.246859	2026-01-15 04:23:13.246859
8023c8c5-019d-4b8c-abe1-0a6addcd0cfd	\N	test-mm-email@marketmaker.niha.internal	$2b$12$.I6h6qP9ZeaCDDiQo9iYVuJvvrpvJidKlgDtGDxWv2N9EPAQP9HSy	Test MM Email	Market Maker	\N	\N	MARKET_MAKER	t	f	\N	\N	\N	\N	\N	\N	2026-01-25 01:35:06.745863	2026-01-25 01:35:06.745867
5e870a5e-ddc5-4fd5-93c0-d26227c16ebb	\N	final-test-mm@marketmaker.niha.internal	$2b$12$F9k0ID2Ik/l1Mee.zGm.YOg9TShYxwEfde6CMNFuwEglKuQRTqt.q	Final Test MM	Market Maker	\N	\N	MARKET_MAKER	t	f	\N	\N	\N	\N	\N	\N	2026-01-25 01:35:29.893438	2026-01-25 01:35:29.893441
99b0e2ed-1a2a-451f-a595-f83cdd274c0f	\N	mm4@marketmaker.niha.internal	$2b$12$Yhhmm3/5NgY3NLgW06s31ugsqtUwi/YJjiigZqYhdm4KPchmeI5gy	mm4	Market Maker	\N	\N	MARKET_MAKER	t	f	\N	\N	\N	\N	\N	\N	2026-01-25 02:03:43.460295	2026-01-25 02:03:43.460299
1a32a0cb-26e9-407c-8f8b-a6c276d518bd	300083df-1f88-49b5-b634-cdb49eb00779	admin@nihaogroup.com	$2y$05$7W3Bhjm5AOgGHx31935.P.wh1kreW.1y8NY4GL7J7/WLhei2w35D6	Admin	User	\N	\N	ADMIN	t	f	\N	\N	\N	\N	\N	2026-01-25 07:47:54.827844	2026-01-15 04:23:13.246852	2026-01-25 07:47:54.832392
\.


--
-- Data for Name: withdrawals; Type: TABLE DATA; Schema: public; Owner: niha_user
--

COPY public.withdrawals (id, entity_id, user_id, asset_type, amount, status, destination_bank, destination_iban, destination_swift, destination_account_holder, destination_registry, destination_account_id, wire_reference, internal_reference, rejection_reason, client_notes, admin_notes, requested_at, processed_at, completed_at, rejected_at, processed_by, completed_by, rejected_by, created_at, updated_at) FROM stdin;
\.


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: agent_action_logs agent_action_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.agent_action_logs
    ADD CONSTRAINT agent_action_logs_pkey PRIMARY KEY (id);


--
-- Name: agent_config agent_config_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.agent_config
    ADD CONSTRAINT agent_config_pkey PRIMARY KEY (id);


--
-- Name: ai_clients ai_clients_client_id_key; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.ai_clients
    ADD CONSTRAINT ai_clients_client_id_key UNIQUE (client_id);


--
-- Name: ai_clients ai_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.ai_clients
    ADD CONSTRAINT ai_clients_pkey PRIMARY KEY (id);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: asset_transactions asset_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.asset_transactions
    ADD CONSTRAINT asset_transactions_pkey PRIMARY KEY (id);


--
-- Name: authentication_attempts authentication_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.authentication_attempts
    ADD CONSTRAINT authentication_attempts_pkey PRIMARY KEY (id);


--
-- Name: auto_trade_market_settings auto_trade_market_settings_market_key_key; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.auto_trade_market_settings
    ADD CONSTRAINT auto_trade_market_settings_market_key_key UNIQUE (market_key);


--
-- Name: auto_trade_market_settings auto_trade_market_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.auto_trade_market_settings
    ADD CONSTRAINT auto_trade_market_settings_pkey PRIMARY KEY (id);


--
-- Name: auto_trade_rules auto_trade_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.auto_trade_rules
    ADD CONSTRAINT auto_trade_rules_pkey PRIMARY KEY (id);


--
-- Name: auto_trade_settings auto_trade_settings_certificate_type_key; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.auto_trade_settings
    ADD CONSTRAINT auto_trade_settings_certificate_type_key UNIQUE (certificate_type);


--
-- Name: auto_trade_settings auto_trade_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.auto_trade_settings
    ADD CONSTRAINT auto_trade_settings_pkey PRIMARY KEY (id);


--
-- Name: cash_market_trades cash_market_trades_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.cash_market_trades
    ADD CONSTRAINT cash_market_trades_pkey PRIMARY KEY (id);


--
-- Name: certificates certificates_anonymous_code_key; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_anonymous_code_key UNIQUE (anonymous_code);


--
-- Name: certificates certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_pkey PRIMARY KEY (id);


--
-- Name: contact_requests contact_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.contact_requests
    ADD CONSTRAINT contact_requests_pkey PRIMARY KEY (id);


--
-- Name: deposits deposits_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.deposits
    ADD CONSTRAINT deposits_pkey PRIMARY KEY (id);


--
-- Name: entities entities_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.entities
    ADD CONSTRAINT entities_pkey PRIMARY KEY (id);


--
-- Name: entity_fee_overrides entity_fee_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.entity_fee_overrides
    ADD CONSTRAINT entity_fee_overrides_pkey PRIMARY KEY (id);


--
-- Name: entity_holdings entity_holdings_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.entity_holdings
    ADD CONSTRAINT entity_holdings_pkey PRIMARY KEY (id);


--
-- Name: exchange_rate_sources exchange_rate_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.exchange_rate_sources
    ADD CONSTRAINT exchange_rate_sources_pkey PRIMARY KEY (id);


--
-- Name: kyc_documents kyc_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.kyc_documents
    ADD CONSTRAINT kyc_documents_pkey PRIMARY KEY (id);


--
-- Name: liquidity_operations liquidity_operations_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.liquidity_operations
    ADD CONSTRAINT liquidity_operations_pkey PRIMARY KEY (id);


--
-- Name: mail_config mail_config_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.mail_config
    ADD CONSTRAINT mail_config_pkey PRIMARY KEY (id);


--
-- Name: market_maker_clients market_maker_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.market_maker_clients
    ADD CONSTRAINT market_maker_clients_pkey PRIMARY KEY (id);


--
-- Name: market_maker_clients market_maker_clients_user_id_key; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.market_maker_clients
    ADD CONSTRAINT market_maker_clients_user_id_key UNIQUE (user_id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: price_history price_history_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.price_history
    ADD CONSTRAINT price_history_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_hash_key UNIQUE (token_hash);


--
-- Name: scraping_sources scraping_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.scraping_sources
    ADD CONSTRAINT scraping_sources_pkey PRIMARY KEY (id);


--
-- Name: sellers sellers_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.sellers
    ADD CONSTRAINT sellers_pkey PRIMARY KEY (id);


--
-- Name: settlement_batches settlement_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.settlement_batches
    ADD CONSTRAINT settlement_batches_pkey PRIMARY KEY (id);


--
-- Name: settlement_status_history settlement_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.settlement_status_history
    ADD CONSTRAINT settlement_status_history_pkey PRIMARY KEY (id);


--
-- Name: swap_requests swap_requests_anonymous_code_key; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.swap_requests
    ADD CONSTRAINT swap_requests_anonymous_code_key UNIQUE (anonymous_code);


--
-- Name: swap_requests swap_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.swap_requests
    ADD CONSTRAINT swap_requests_pkey PRIMARY KEY (id);


--
-- Name: ticket_logs ticket_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.ticket_logs
    ADD CONSTRAINT ticket_logs_pkey PRIMARY KEY (id);


--
-- Name: trades trades_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_pkey PRIMARY KEY (id);


--
-- Name: trading_fee_configs trading_fee_configs_market_key; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.trading_fee_configs
    ADD CONSTRAINT trading_fee_configs_market_key UNIQUE (market);


--
-- Name: trading_fee_configs trading_fee_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.trading_fee_configs
    ADD CONSTRAINT trading_fee_configs_pkey PRIMARY KEY (id);


--
-- Name: entity_fee_overrides uq_entity_market_fee; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.entity_fee_overrides
    ADD CONSTRAINT uq_entity_market_fee UNIQUE (entity_id, market);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: withdrawals withdrawals_internal_reference_key; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_internal_reference_key UNIQUE (internal_reference);


--
-- Name: withdrawals withdrawals_pkey; Type: CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_pkey PRIMARY KEY (id);


--
-- Name: idx_ai_clients_client_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX idx_ai_clients_client_id ON public.ai_clients USING btree (client_id);


--
-- Name: idx_ai_clients_created_by; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX idx_ai_clients_created_by ON public.ai_clients USING btree (created_by);


--
-- Name: idx_ai_clients_is_active; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX idx_ai_clients_is_active ON public.ai_clients USING btree (is_active);


--
-- Name: idx_cash_market_trades_ai_client_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX idx_cash_market_trades_ai_client_id ON public.cash_market_trades USING btree (ai_client_id);


--
-- Name: idx_orders_ai_client_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX idx_orders_ai_client_id ON public.orders USING btree (ai_client_id);


--
-- Name: idx_orders_market; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX idx_orders_market ON public.orders USING btree (market);


--
-- Name: idx_refresh_tokens_expires_at; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX idx_refresh_tokens_expires_at ON public.refresh_tokens USING btree (expires_at);


--
-- Name: idx_refresh_tokens_token_hash; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX idx_refresh_tokens_token_hash ON public.refresh_tokens USING btree (token_hash);


--
-- Name: idx_refresh_tokens_user_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX idx_refresh_tokens_user_id ON public.refresh_tokens USING btree (user_id);


--
-- Name: idx_ticket_logs_ai_client_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX idx_ticket_logs_ai_client_id ON public.ticket_logs USING btree (ai_client_id);


--
-- Name: ix_activity_logs_created_at; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_activity_logs_created_at ON public.activity_logs USING btree (created_at);


--
-- Name: ix_activity_logs_user_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_activity_logs_user_id ON public.activity_logs USING btree (user_id);


--
-- Name: ix_agent_action_logs_created_at; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_agent_action_logs_created_at ON public.agent_action_logs USING btree (created_at);


--
-- Name: ix_agent_action_logs_market_maker_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_agent_action_logs_market_maker_id ON public.agent_action_logs USING btree (market_maker_id);


--
-- Name: ix_asset_transactions_entity_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_asset_transactions_entity_id ON public.asset_transactions USING btree (entity_id);


--
-- Name: ix_asset_transactions_market_maker_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_asset_transactions_market_maker_id ON public.asset_transactions USING btree (market_maker_id);


--
-- Name: ix_asset_transactions_ticket_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_asset_transactions_ticket_id ON public.asset_transactions USING btree (ticket_id);


--
-- Name: ix_authentication_attempts_created_at; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_authentication_attempts_created_at ON public.authentication_attempts USING btree (created_at);


--
-- Name: ix_authentication_attempts_email; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_authentication_attempts_email ON public.authentication_attempts USING btree (email);


--
-- Name: ix_authentication_attempts_user_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_authentication_attempts_user_id ON public.authentication_attempts USING btree (user_id);


--
-- Name: ix_auto_trade_rules_market_maker_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_auto_trade_rules_market_maker_id ON public.auto_trade_rules USING btree (market_maker_id);


--
-- Name: ix_cash_market_trades_buy_order_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_cash_market_trades_buy_order_id ON public.cash_market_trades USING btree (buy_order_id);


--
-- Name: ix_cash_market_trades_buyer_entity_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_cash_market_trades_buyer_entity_id ON public.cash_market_trades USING btree (buyer_entity_id);


--
-- Name: ix_cash_market_trades_buyer_user_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_cash_market_trades_buyer_user_id ON public.cash_market_trades USING btree (buyer_user_id);


--
-- Name: ix_cash_market_trades_executed_at; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_cash_market_trades_executed_at ON public.cash_market_trades USING btree (executed_at);


--
-- Name: ix_cash_market_trades_sell_order_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_cash_market_trades_sell_order_id ON public.cash_market_trades USING btree (sell_order_id);


--
-- Name: ix_cash_market_trades_ticket_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_cash_market_trades_ticket_id ON public.cash_market_trades USING btree (ticket_id);


--
-- Name: ix_deposits_entity_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_deposits_entity_id ON public.deposits USING btree (entity_id);


--
-- Name: ix_deposits_ticket_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_deposits_ticket_id ON public.deposits USING btree (ticket_id);


--
-- Name: ix_deposits_user_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_deposits_user_id ON public.deposits USING btree (user_id);


--
-- Name: ix_entity_fee_overrides_entity_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_entity_fee_overrides_entity_id ON public.entity_fee_overrides USING btree (entity_id);


--
-- Name: ix_entity_holdings_entity_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_entity_holdings_entity_id ON public.entity_holdings USING btree (entity_id);


--
-- Name: ix_kyc_documents_entity_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_kyc_documents_entity_id ON public.kyc_documents USING btree (entity_id);


--
-- Name: ix_kyc_documents_user_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_kyc_documents_user_id ON public.kyc_documents USING btree (user_id);


--
-- Name: ix_liquidity_operations_certificate_type; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_liquidity_operations_certificate_type ON public.liquidity_operations USING btree (certificate_type);


--
-- Name: ix_liquidity_operations_created_at; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_liquidity_operations_created_at ON public.liquidity_operations USING btree (created_at);


--
-- Name: ix_liquidity_operations_ticket_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE UNIQUE INDEX ix_liquidity_operations_ticket_id ON public.liquidity_operations USING btree (ticket_id);


--
-- Name: ix_market_maker_clients_client_code; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE UNIQUE INDEX ix_market_maker_clients_client_code ON public.market_maker_clients USING btree (client_code);


--
-- Name: ix_market_maker_clients_created_by; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_market_maker_clients_created_by ON public.market_maker_clients USING btree (created_by);


--
-- Name: ix_market_maker_clients_user_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_market_maker_clients_user_id ON public.market_maker_clients USING btree (user_id);


--
-- Name: ix_orders_created_at; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_orders_created_at ON public.orders USING btree (created_at);


--
-- Name: ix_orders_entity_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_orders_entity_id ON public.orders USING btree (entity_id);


--
-- Name: ix_orders_market_maker_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_orders_market_maker_id ON public.orders USING btree (market_maker_id);


--
-- Name: ix_orders_seller_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_orders_seller_id ON public.orders USING btree (seller_id);


--
-- Name: ix_orders_ticket_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_orders_ticket_id ON public.orders USING btree (ticket_id);


--
-- Name: ix_orders_user_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_orders_user_id ON public.orders USING btree (user_id);


--
-- Name: ix_price_history_recorded_at; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_price_history_recorded_at ON public.price_history USING btree (recorded_at);


--
-- Name: ix_sellers_client_code; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE UNIQUE INDEX ix_sellers_client_code ON public.sellers USING btree (client_code);


--
-- Name: ix_settlement_batches_batch_reference; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE UNIQUE INDEX ix_settlement_batches_batch_reference ON public.settlement_batches USING btree (batch_reference);


--
-- Name: ix_settlement_batches_created_at; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_settlement_batches_created_at ON public.settlement_batches USING btree (created_at);


--
-- Name: ix_settlement_batches_entity_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_settlement_batches_entity_id ON public.settlement_batches USING btree (entity_id);


--
-- Name: ix_settlement_batches_expected_settlement_date; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_settlement_batches_expected_settlement_date ON public.settlement_batches USING btree (expected_settlement_date);


--
-- Name: ix_settlement_batches_order_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_settlement_batches_order_id ON public.settlement_batches USING btree (order_id);


--
-- Name: ix_settlement_batches_settlement_type; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_settlement_batches_settlement_type ON public.settlement_batches USING btree (settlement_type);


--
-- Name: ix_settlement_batches_status; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_settlement_batches_status ON public.settlement_batches USING btree (status);


--
-- Name: ix_settlement_batches_trade_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_settlement_batches_trade_id ON public.settlement_batches USING btree (trade_id);


--
-- Name: ix_settlement_status_history_created_at; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_settlement_status_history_created_at ON public.settlement_status_history USING btree (created_at);


--
-- Name: ix_settlement_status_history_settlement_batch_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_settlement_status_history_settlement_batch_id ON public.settlement_status_history USING btree (settlement_batch_id);


--
-- Name: ix_ticket_logs_action_type; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_ticket_logs_action_type ON public.ticket_logs USING btree (action_type);


--
-- Name: ix_ticket_logs_created_at; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_ticket_logs_created_at ON public.ticket_logs USING btree (created_at);


--
-- Name: ix_ticket_logs_entity_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_ticket_logs_entity_id ON public.ticket_logs USING btree (entity_id);


--
-- Name: ix_ticket_logs_entity_type; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_ticket_logs_entity_type ON public.ticket_logs USING btree (entity_type);


--
-- Name: ix_ticket_logs_order_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_ticket_logs_order_id ON public.ticket_logs USING btree (order_id);


--
-- Name: ix_ticket_logs_status; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_ticket_logs_status ON public.ticket_logs USING btree (status);


--
-- Name: ix_ticket_logs_tags; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_ticket_logs_tags ON public.ticket_logs USING btree (tags);


--
-- Name: ix_ticket_logs_ticket_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE UNIQUE INDEX ix_ticket_logs_ticket_id ON public.ticket_logs USING btree (ticket_id);


--
-- Name: ix_ticket_logs_timestamp; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_ticket_logs_timestamp ON public.ticket_logs USING btree ("timestamp");


--
-- Name: ix_ticket_logs_trade_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_ticket_logs_trade_id ON public.ticket_logs USING btree (trade_id);


--
-- Name: ix_ticket_logs_user_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_ticket_logs_user_id ON public.ticket_logs USING btree (user_id);


--
-- Name: ix_user_sessions_user_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_user_sessions_user_id ON public.user_sessions USING btree (user_id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_withdrawals_entity_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_withdrawals_entity_id ON public.withdrawals USING btree (entity_id);


--
-- Name: ix_withdrawals_user_id; Type: INDEX; Schema: public; Owner: niha_user
--

CREATE INDEX ix_withdrawals_user_id ON public.withdrawals USING btree (user_id);


--
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: agent_action_logs agent_action_logs_market_maker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.agent_action_logs
    ADD CONSTRAINT agent_action_logs_market_maker_id_fkey FOREIGN KEY (market_maker_id) REFERENCES public.market_maker_clients(id);


--
-- Name: agent_action_logs agent_action_logs_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.agent_action_logs
    ADD CONSTRAINT agent_action_logs_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: ai_clients ai_clients_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.ai_clients
    ADD CONSTRAINT ai_clients_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: asset_transactions asset_transactions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.asset_transactions
    ADD CONSTRAINT asset_transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: asset_transactions asset_transactions_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.asset_transactions
    ADD CONSTRAINT asset_transactions_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.entities(id);


--
-- Name: asset_transactions asset_transactions_market_maker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.asset_transactions
    ADD CONSTRAINT asset_transactions_market_maker_id_fkey FOREIGN KEY (market_maker_id) REFERENCES public.market_maker_clients(id);


--
-- Name: authentication_attempts authentication_attempts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.authentication_attempts
    ADD CONSTRAINT authentication_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: auto_trade_rules auto_trade_rules_market_maker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.auto_trade_rules
    ADD CONSTRAINT auto_trade_rules_market_maker_id_fkey FOREIGN KEY (market_maker_id) REFERENCES public.market_maker_clients(id);


--
-- Name: cash_market_trades cash_market_trades_ai_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.cash_market_trades
    ADD CONSTRAINT cash_market_trades_ai_client_id_fkey FOREIGN KEY (ai_client_id) REFERENCES public.ai_clients(id);


--
-- Name: cash_market_trades cash_market_trades_buy_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.cash_market_trades
    ADD CONSTRAINT cash_market_trades_buy_order_id_fkey FOREIGN KEY (buy_order_id) REFERENCES public.orders(id);


--
-- Name: cash_market_trades cash_market_trades_buyer_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.cash_market_trades
    ADD CONSTRAINT cash_market_trades_buyer_entity_id_fkey FOREIGN KEY (buyer_entity_id) REFERENCES public.entities(id);


--
-- Name: cash_market_trades cash_market_trades_buyer_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.cash_market_trades
    ADD CONSTRAINT cash_market_trades_buyer_user_id_fkey FOREIGN KEY (buyer_user_id) REFERENCES public.users(id);


--
-- Name: cash_market_trades cash_market_trades_market_maker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.cash_market_trades
    ADD CONSTRAINT cash_market_trades_market_maker_id_fkey FOREIGN KEY (market_maker_id) REFERENCES public.market_maker_clients(id);


--
-- Name: cash_market_trades cash_market_trades_sell_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.cash_market_trades
    ADD CONSTRAINT cash_market_trades_sell_order_id_fkey FOREIGN KEY (sell_order_id) REFERENCES public.orders(id);


--
-- Name: cash_market_trades cash_market_trades_seller_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.cash_market_trades
    ADD CONSTRAINT cash_market_trades_seller_entity_id_fkey FOREIGN KEY (seller_entity_id) REFERENCES public.entities(id);


--
-- Name: cash_market_trades cash_market_trades_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.cash_market_trades
    ADD CONSTRAINT cash_market_trades_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.sellers(id);


--
-- Name: cash_market_trades cash_market_trades_seller_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.cash_market_trades
    ADD CONSTRAINT cash_market_trades_seller_user_id_fkey FOREIGN KEY (seller_user_id) REFERENCES public.users(id);


--
-- Name: certificates certificates_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.entities(id);


--
-- Name: contact_requests contact_requests_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.contact_requests
    ADD CONSTRAINT contact_requests_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(id);


--
-- Name: deposits deposits_confirmed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.deposits
    ADD CONSTRAINT deposits_confirmed_by_fkey FOREIGN KEY (confirmed_by) REFERENCES public.users(id);


--
-- Name: deposits deposits_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.deposits
    ADD CONSTRAINT deposits_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.entities(id);


--
-- Name: deposits deposits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.deposits
    ADD CONSTRAINT deposits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: entities entities_kyc_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.entities
    ADD CONSTRAINT entities_kyc_approved_by_fkey FOREIGN KEY (kyc_approved_by) REFERENCES public.users(id);


--
-- Name: entity_fee_overrides entity_fee_overrides_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.entity_fee_overrides
    ADD CONSTRAINT entity_fee_overrides_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.entities(id);


--
-- Name: entity_fee_overrides entity_fee_overrides_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.entity_fee_overrides
    ADD CONSTRAINT entity_fee_overrides_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: entity_holdings entity_holdings_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.entity_holdings
    ADD CONSTRAINT entity_holdings_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.entities(id);


--
-- Name: kyc_documents kyc_documents_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.kyc_documents
    ADD CONSTRAINT kyc_documents_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.entities(id);


--
-- Name: kyc_documents kyc_documents_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.kyc_documents
    ADD CONSTRAINT kyc_documents_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: kyc_documents kyc_documents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.kyc_documents
    ADD CONSTRAINT kyc_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: liquidity_operations liquidity_operations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.liquidity_operations
    ADD CONSTRAINT liquidity_operations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: market_maker_clients market_maker_clients_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.market_maker_clients
    ADD CONSTRAINT market_maker_clients_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: market_maker_clients market_maker_clients_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.market_maker_clients
    ADD CONSTRAINT market_maker_clients_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: orders orders_ai_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_ai_client_id_fkey FOREIGN KEY (ai_client_id) REFERENCES public.ai_clients(id);


--
-- Name: orders orders_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.entities(id);


--
-- Name: orders orders_market_maker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_market_maker_id_fkey FOREIGN KEY (market_maker_id) REFERENCES public.market_maker_clients(id);


--
-- Name: orders orders_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.sellers(id);


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: settlement_batches settlement_batches_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.settlement_batches
    ADD CONSTRAINT settlement_batches_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.entities(id);


--
-- Name: settlement_batches settlement_batches_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.settlement_batches
    ADD CONSTRAINT settlement_batches_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: settlement_batches settlement_batches_trade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.settlement_batches
    ADD CONSTRAINT settlement_batches_trade_id_fkey FOREIGN KEY (trade_id) REFERENCES public.cash_market_trades(id);


--
-- Name: settlement_status_history settlement_status_history_settlement_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.settlement_status_history
    ADD CONSTRAINT settlement_status_history_settlement_batch_id_fkey FOREIGN KEY (settlement_batch_id) REFERENCES public.settlement_batches(id);


--
-- Name: settlement_status_history settlement_status_history_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.settlement_status_history
    ADD CONSTRAINT settlement_status_history_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: swap_requests swap_requests_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.swap_requests
    ADD CONSTRAINT swap_requests_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.entities(id);


--
-- Name: swap_requests swap_requests_matched_with_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.swap_requests
    ADD CONSTRAINT swap_requests_matched_with_fkey FOREIGN KEY (matched_with) REFERENCES public.swap_requests(id);


--
-- Name: ticket_logs ticket_logs_ai_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.ticket_logs
    ADD CONSTRAINT ticket_logs_ai_client_id_fkey FOREIGN KEY (ai_client_id) REFERENCES public.ai_clients(id);


--
-- Name: ticket_logs ticket_logs_counterparty_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.ticket_logs
    ADD CONSTRAINT ticket_logs_counterparty_entity_id_fkey FOREIGN KEY (counterparty_entity_id) REFERENCES public.entities(id);


--
-- Name: ticket_logs ticket_logs_counterparty_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.ticket_logs
    ADD CONSTRAINT ticket_logs_counterparty_user_id_fkey FOREIGN KEY (counterparty_user_id) REFERENCES public.users(id);


--
-- Name: ticket_logs ticket_logs_deposit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.ticket_logs
    ADD CONSTRAINT ticket_logs_deposit_id_fkey FOREIGN KEY (deposit_id) REFERENCES public.deposits(id);


--
-- Name: ticket_logs ticket_logs_market_maker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.ticket_logs
    ADD CONSTRAINT ticket_logs_market_maker_id_fkey FOREIGN KEY (market_maker_id) REFERENCES public.market_maker_clients(id);


--
-- Name: ticket_logs ticket_logs_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.ticket_logs
    ADD CONSTRAINT ticket_logs_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: ticket_logs ticket_logs_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.ticket_logs
    ADD CONSTRAINT ticket_logs_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.sellers(id);


--
-- Name: ticket_logs ticket_logs_trade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.ticket_logs
    ADD CONSTRAINT ticket_logs_trade_id_fkey FOREIGN KEY (trade_id) REFERENCES public.cash_market_trades(id);


--
-- Name: ticket_logs ticket_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.ticket_logs
    ADD CONSTRAINT ticket_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: trades trades_buyer_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_buyer_entity_id_fkey FOREIGN KEY (buyer_entity_id) REFERENCES public.entities(id);


--
-- Name: trades trades_certificate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_certificate_id_fkey FOREIGN KEY (certificate_id) REFERENCES public.certificates(id);


--
-- Name: trades trades_seller_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_seller_entity_id_fkey FOREIGN KEY (seller_entity_id) REFERENCES public.entities(id);


--
-- Name: trading_fee_configs trading_fee_configs_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.trading_fee_configs
    ADD CONSTRAINT trading_fee_configs_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users users_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: users users_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.entities(id);


--
-- Name: withdrawals withdrawals_completed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES public.users(id);


--
-- Name: withdrawals withdrawals_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.entities(id);


--
-- Name: withdrawals withdrawals_processed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.users(id);


--
-- Name: withdrawals withdrawals_rejected_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_rejected_by_fkey FOREIGN KEY (rejected_by) REFERENCES public.users(id);


--
-- Name: withdrawals withdrawals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: niha_user
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

