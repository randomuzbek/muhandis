ALTER TABLE "profiles" ADD COLUMN "status" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "custom_fields" jsonb DEFAULT '[]'::jsonb;