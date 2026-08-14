CREATE TABLE "template_event_types" (
	"template_id" uuid NOT NULL,
	"event_type_key" text NOT NULL,
	CONSTRAINT "template_event_types_pkey" UNIQUE("template_id","event_type_key")
);
--> statement-breakpoint
ALTER TABLE "templates" DROP CONSTRAINT "templates_event_type_key_event_types_key_fk";
--> statement-breakpoint
ALTER TABLE "template_event_types" ADD CONSTRAINT "template_event_types_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_event_types" ADD CONSTRAINT "template_event_types_event_type_key_event_types_key_fk" FOREIGN KEY ("event_type_key") REFERENCES "public"."event_types"("key") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "templates" DROP COLUMN "event_type_key";