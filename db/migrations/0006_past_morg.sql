CREATE TABLE "spotlights" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"quote" text,
	"blurb" text,
	"published_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "spotlights" ADD CONSTRAINT "spotlights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "spotlights_published_idx" ON "spotlights" USING btree ("published_at");