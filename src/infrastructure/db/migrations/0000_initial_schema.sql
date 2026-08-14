CREATE TYPE "public"."auth_attempt_kind" AS ENUM('issue', 'verify');--> statement-breakpoint
CREATE TYPE "public"."otp_channel" AS ENUM('email', 'whatsapp');--> statement-breakpoint
CREATE TYPE "public"."platform_role" AS ENUM('superadmin', 'support');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'admin', 'staff');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'invited', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."moderation_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."venue_kind" AS ENUM('church', 'reception', 'other');--> statement-breakpoint
CREATE TYPE "public"."guest_kind" AS ENUM('adult', 'child');--> statement-breakpoint
CREATE TYPE "public"."rsvp_channel" AS ENUM('web', 'whatsapp', 'panel');--> statement-breakpoint
CREATE TYPE "public"."rsvp_status" AS ENUM('pending', 'confirmed', 'declined');--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('queued', 'sent', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."reminder_channel" AS ENUM('whatsapp', 'email', 'sms');--> statement-breakpoint
CREATE TYPE "public"."table_shape" AS ENUM('round', 'rectangular', 'other');--> statement-breakpoint
CREATE TYPE "public"."client_status" AS ENUM('active', 'suspended', 'closed');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid,
	"user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip" "inet",
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "auth_attempt_kind" NOT NULL,
	"identifier_hash" text NOT NULL,
	"client_ip" "inet",
	"succeeded" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"identifier" text NOT NULL,
	"code_hash" text NOT NULL,
	"channel" "otp_channel" NOT NULL,
	"destination" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"request_ip" "inet",
	"request_user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_ip" "inet",
	"created_user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid,
	"email" text NOT NULL,
	"phone" text,
	"name" text NOT NULL,
	"role" "user_role" DEFAULT 'admin' NOT NULL,
	"platform_role" "platform_role",
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"preferred_otp_channel" "otp_channel" DEFAULT 'email' NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_client_xor_platform" CHECK (("users"."client_id" is not null and "users"."platform_role" is null)
          or ("users"."client_id" is null and "users"."platform_role" is not null))
);
--> statement-breakpoint
CREATE TABLE "guestbook_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"author_name" text NOT NULL,
	"message" text NOT NULL,
	"status" "moderation_status" DEFAULT 'pending' NOT NULL,
	"submitted_ip" "inet",
	"submitted_user_agent" text,
	"moderated_at" timestamp with time zone,
	"moderated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"block_key" text NOT NULL,
	"variant_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_blocks_event_block_key" UNIQUE("event_id","block_key")
);
--> statement-breakpoint
CREATE TABLE "event_gallery_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"url" text NOT NULL,
	"storage_key" text,
	"alt_text" text,
	"width" integer,
	"height" integer,
	"byte_size" integer,
	"content_type" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_gallery_items_event_position_key" UNIQUE("event_id","position")
);
--> statement-breakpoint
CREATE TABLE "event_gift_registries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL,
	"name" text NOT NULL,
	"detail" text,
	"url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"quote" text NOT NULL,
	"author" text NOT NULL,
	"author_role" text,
	"group_label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_messages_event_position_key" UNIQUE("event_id","position")
);
--> statement-breakpoint
CREATE TABLE "event_schedule_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"time_label" text NOT NULL,
	"starts_at" timestamp with time zone,
	"title" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_schedule_items_event_position_key" UNIQUE("event_id","position")
);
--> statement-breakpoint
CREATE TABLE "event_venues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"kind" "venue_kind" NOT NULL,
	"label" text NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"detail" text,
	"map_url" text,
	"starts_at" timestamp with time zone,
	"position" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"event_type_key" text NOT NULL,
	"plan_key" text NOT NULL,
	"template_id" uuid NOT NULL,
	"theme_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"access_code" text NOT NULL,
	"title" text NOT NULL,
	"celebrant_name" text NOT NULL,
	"celebrant_full_name" text,
	"celebrant_last_name" text,
	"event_type_label" text,
	"tagline" text,
	"story" text,
	"starts_at" timestamp with time zone NOT NULL,
	"time_zone" text DEFAULT 'America/Merida' NOT NULL,
	"city" text,
	"status" "event_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"rsvp_deadline" date,
	"music_url" text,
	"music_title" text,
	"hero_image_url" text,
	"story_image_url" text,
	"closing_image_url" text,
	"contact_phone" text,
	"contact_whatsapp" text,
	"contact_instagram" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug"),
	CONSTRAINT "events_id_client_id_key" UNIQUE("id","client_id")
);
--> statement-breakpoint
CREATE TABLE "guest_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"name" text NOT NULL,
	"invite_code" text NOT NULL,
	"max_adults" smallint DEFAULT 0 NOT NULL,
	"max_children" smallint DEFAULT 0 NOT NULL,
	"phone" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guest_groups_event_invite_code_key" UNIQUE("event_id","invite_code"),
	CONSTRAINT "guest_groups_id_client_id_key" UNIQUE("id","client_id")
);
--> statement-breakpoint
CREATE TABLE "guests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"guest_group_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"kind" "guest_kind" DEFAULT 'adult' NOT NULL,
	"status" "rsvp_status" DEFAULT 'pending' NOT NULL,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guests_id_client_id_key" UNIQUE("id","client_id")
);
--> statement-breakpoint
CREATE TABLE "rsvp_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"guest_group_id" uuid NOT NULL,
	"status" "rsvp_status" NOT NULL,
	"adults_count" smallint DEFAULT 0 NOT NULL,
	"children_count" smallint DEFAULT 0 NOT NULL,
	"message" text,
	"channel" "rsvp_channel" DEFAULT 'web' NOT NULL,
	"submitted_ip" "inet",
	"submitted_user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "features" (
	"key" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_features" (
	"plan_key" text NOT NULL,
	"feature_key" text NOT NULL,
	"is_included" boolean DEFAULT true NOT NULL,
	"limit_value" integer,
	CONSTRAINT "plan_features_plan_key_feature_key_pk" PRIMARY KEY("plan_key","feature_key")
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"key" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"currency" char(3) DEFAULT 'MXN' NOT NULL,
	"duration_months" smallint DEFAULT 12 NOT NULL,
	"rank" smallint NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blocks" (
	"key" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"feature_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "component_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"block_key" text NOT NULL,
	"variant_key" text NOT NULL,
	"registry_id" text GENERATED ALWAYS AS (block_key || '.' || variant_key) STORED NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"min_plan_rank" smallint DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "component_variants_block_variant_key" UNIQUE("block_key","variant_key"),
	CONSTRAINT "component_variants_registry_id_key" UNIQUE("registry_id")
);
--> statement-breakpoint
CREATE TABLE "event_types" (
	"key" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"block_key" text NOT NULL,
	"default_variant_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "template_blocks_template_block_key" UNIQUE("template_id","block_key"),
	CONSTRAINT "template_blocks_template_position_key" UNIQUE("template_id","position")
);
--> statement-breakpoint
CREATE TABLE "template_plans" (
	"template_id" uuid NOT NULL,
	"plan_key" text NOT NULL,
	CONSTRAINT "template_plans_pkey" UNIQUE("template_id","plan_key")
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"event_type_key" text NOT NULL,
	"preview_image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "templates_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "themes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"tokens" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "themes_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "reminder_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reminder_schedule_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"guest_group_id" uuid NOT NULL,
	"status" "delivery_status" DEFAULT 'queued' NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone,
	"provider_message_id" text,
	"error" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reminder_deliveries_schedule_guest_group_key" UNIQUE("reminder_schedule_id","guest_group_id")
);
--> statement-breakpoint
CREATE TABLE "reminder_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"offset_days" smallint NOT NULL,
	"send_at_local_time" time DEFAULT '10:00:00' NOT NULL,
	"channel" "reminder_channel" DEFAULT 'whatsapp' NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"message_template" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reminder_schedules_event_offset_channel_key" UNIQUE("event_id","offset_days","channel"),
	CONSTRAINT "reminder_schedules_id_client_id_key" UNIQUE("id","client_id")
);
--> statement-breakpoint
CREATE TABLE "event_tables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"name" text NOT NULL,
	"capacity" smallint NOT NULL,
	"shape" "table_shape" DEFAULT 'round' NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_tables_event_name_key" UNIQUE("event_id","name"),
	CONSTRAINT "event_tables_id_client_id_key" UNIQUE("id","client_id")
);
--> statement-breakpoint
CREATE TABLE "table_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"event_table_id" uuid NOT NULL,
	"guest_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "table_assignments_guest_id_key" UNIQUE("guest_id")
);
--> statement-breakpoint
CREATE TABLE "invitation_access_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"client_ip" "inet",
	"succeeded" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"status" "client_status" DEFAULT 'active' NOT NULL,
	"contact_email" text,
	"contact_phone" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clients_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "otp_challenges" ADD CONSTRAINT "otp_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guestbook_entries" ADD CONSTRAINT "guestbook_entries_moderated_by_users_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guestbook_entries" ADD CONSTRAINT "guestbook_entries_event_fk" FOREIGN KEY ("event_id","client_id") REFERENCES "public"."events"("id","client_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_blocks" ADD CONSTRAINT "event_blocks_block_key_blocks_key_fk" FOREIGN KEY ("block_key") REFERENCES "public"."blocks"("key") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_blocks" ADD CONSTRAINT "event_blocks_variant_id_component_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."component_variants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_blocks" ADD CONSTRAINT "event_blocks_event_fk" FOREIGN KEY ("event_id","client_id") REFERENCES "public"."events"("id","client_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_gallery_items" ADD CONSTRAINT "event_gallery_items_event_fk" FOREIGN KEY ("event_id","client_id") REFERENCES "public"."events"("id","client_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_gift_registries" ADD CONSTRAINT "event_gift_registries_event_fk" FOREIGN KEY ("event_id","client_id") REFERENCES "public"."events"("id","client_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_messages" ADD CONSTRAINT "event_messages_event_fk" FOREIGN KEY ("event_id","client_id") REFERENCES "public"."events"("id","client_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_schedule_items" ADD CONSTRAINT "event_schedule_items_event_fk" FOREIGN KEY ("event_id","client_id") REFERENCES "public"."events"("id","client_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_venues" ADD CONSTRAINT "event_venues_event_fk" FOREIGN KEY ("event_id","client_id") REFERENCES "public"."events"("id","client_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_event_type_key_event_types_key_fk" FOREIGN KEY ("event_type_key") REFERENCES "public"."event_types"("key") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_plan_key_plans_key_fk" FOREIGN KEY ("plan_key") REFERENCES "public"."plans"("key") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_groups" ADD CONSTRAINT "guest_groups_event_fk" FOREIGN KEY ("event_id","client_id") REFERENCES "public"."events"("id","client_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guests" ADD CONSTRAINT "guests_event_fk" FOREIGN KEY ("event_id","client_id") REFERENCES "public"."events"("id","client_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guests" ADD CONSTRAINT "guests_guest_group_fk" FOREIGN KEY ("guest_group_id","client_id") REFERENCES "public"."guest_groups"("id","client_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsvp_responses" ADD CONSTRAINT "rsvp_responses_event_fk" FOREIGN KEY ("event_id","client_id") REFERENCES "public"."events"("id","client_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsvp_responses" ADD CONSTRAINT "rsvp_responses_guest_group_fk" FOREIGN KEY ("guest_group_id","client_id") REFERENCES "public"."guest_groups"("id","client_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_plan_key_plans_key_fk" FOREIGN KEY ("plan_key") REFERENCES "public"."plans"("key") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_feature_key_features_key_fk" FOREIGN KEY ("feature_key") REFERENCES "public"."features"("key") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_feature_key_features_key_fk" FOREIGN KEY ("feature_key") REFERENCES "public"."features"("key") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "component_variants" ADD CONSTRAINT "component_variants_block_key_blocks_key_fk" FOREIGN KEY ("block_key") REFERENCES "public"."blocks"("key") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "template_blocks" ADD CONSTRAINT "template_blocks_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_blocks" ADD CONSTRAINT "template_blocks_block_key_blocks_key_fk" FOREIGN KEY ("block_key") REFERENCES "public"."blocks"("key") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "template_blocks" ADD CONSTRAINT "template_blocks_default_variant_id_component_variants_id_fk" FOREIGN KEY ("default_variant_id") REFERENCES "public"."component_variants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_plans" ADD CONSTRAINT "template_plans_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_plans" ADD CONSTRAINT "template_plans_plan_key_plans_key_fk" FOREIGN KEY ("plan_key") REFERENCES "public"."plans"("key") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_event_type_key_event_types_key_fk" FOREIGN KEY ("event_type_key") REFERENCES "public"."event_types"("key") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "reminder_deliveries" ADD CONSTRAINT "reminder_deliveries_schedule_fk" FOREIGN KEY ("reminder_schedule_id","client_id") REFERENCES "public"."reminder_schedules"("id","client_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_deliveries" ADD CONSTRAINT "reminder_deliveries_event_fk" FOREIGN KEY ("event_id","client_id") REFERENCES "public"."events"("id","client_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_deliveries" ADD CONSTRAINT "reminder_deliveries_guest_group_fk" FOREIGN KEY ("guest_group_id","client_id") REFERENCES "public"."guest_groups"("id","client_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_schedules" ADD CONSTRAINT "reminder_schedules_event_fk" FOREIGN KEY ("event_id","client_id") REFERENCES "public"."events"("id","client_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_tables" ADD CONSTRAINT "event_tables_event_fk" FOREIGN KEY ("event_id","client_id") REFERENCES "public"."events"("id","client_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_assignments" ADD CONSTRAINT "table_assignments_event_fk" FOREIGN KEY ("event_id","client_id") REFERENCES "public"."events"("id","client_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_assignments" ADD CONSTRAINT "table_assignments_event_table_fk" FOREIGN KEY ("event_table_id","client_id") REFERENCES "public"."event_tables"("id","client_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_assignments" ADD CONSTRAINT "table_assignments_guest_fk" FOREIGN KEY ("guest_id","client_id") REFERENCES "public"."guests"("id","client_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_client_id_created_at_idx" ON "audit_log" USING btree ("client_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_log_entity_idx" ON "audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "auth_attempts_identifier_idx" ON "auth_attempts" USING btree ("identifier_hash","kind","created_at");--> statement-breakpoint
CREATE INDEX "auth_attempts_ip_idx" ON "auth_attempts" USING btree ("client_ip","kind","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "otp_challenges_active_identifier_idx" ON "otp_challenges" USING btree ("identifier") WHERE consumed_at is null;--> statement-breakpoint
CREATE INDEX "otp_challenges_user_id_created_at_idx" ON "otp_challenges" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "otp_challenges_expires_at_idx" ON "otp_challenges" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "users_client_id_idx" ON "users" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "guestbook_entries_event_id_status_idx" ON "guestbook_entries" USING btree ("event_id","status");--> statement-breakpoint
CREATE INDEX "guestbook_entries_client_id_idx" ON "guestbook_entries" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "event_blocks_client_id_idx" ON "event_blocks" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "event_gallery_items_client_id_idx" ON "event_gallery_items" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "event_gift_registries_event_id_idx" ON "event_gift_registries" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_gift_registries_client_id_idx" ON "event_gift_registries" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "event_messages_client_id_idx" ON "event_messages" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "event_schedule_items_client_id_idx" ON "event_schedule_items" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "event_venues_event_id_idx" ON "event_venues" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_venues_client_id_idx" ON "event_venues" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "events_client_id_starts_at_idx" ON "events" USING btree ("client_id","starts_at");--> statement-breakpoint
CREATE INDEX "events_status_idx" ON "events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "guest_groups_event_id_idx" ON "guest_groups" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "guest_groups_client_id_idx" ON "guest_groups" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "guests_event_id_status_idx" ON "guests" USING btree ("event_id","status");--> statement-breakpoint
CREATE INDEX "guests_guest_group_id_idx" ON "guests" USING btree ("guest_group_id");--> statement-breakpoint
CREATE INDEX "guests_client_id_idx" ON "guests" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "rsvp_responses_event_id_created_at_idx" ON "rsvp_responses" USING btree ("event_id","created_at");--> statement-breakpoint
CREATE INDEX "rsvp_responses_client_id_idx" ON "rsvp_responses" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "reminder_deliveries_status_scheduled_for_idx" ON "reminder_deliveries" USING btree ("status","scheduled_for");--> statement-breakpoint
CREATE INDEX "reminder_deliveries_client_id_idx" ON "reminder_deliveries" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "reminder_schedules_client_id_idx" ON "reminder_schedules" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "event_tables_client_id_idx" ON "event_tables" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "table_assignments_event_table_id_idx" ON "table_assignments" USING btree ("event_table_id");--> statement-breakpoint
CREATE INDEX "table_assignments_client_id_idx" ON "table_assignments" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "invitation_access_attempts_ip_created_at_idx" ON "invitation_access_attempts" USING btree ("client_ip","created_at");--> statement-breakpoint
CREATE INDEX "invitation_access_attempts_slug_created_at_idx" ON "invitation_access_attempts" USING btree ("slug","created_at");