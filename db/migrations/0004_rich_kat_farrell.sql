CREATE TABLE "referral_claims" (
	"telegram_id" bigint PRIMARY KEY NOT NULL,
	"referrer_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "referred_by" text;--> statement-breakpoint
ALTER TABLE "referral_claims" ADD CONSTRAINT "referral_claims_referrer_user_id_users_id_fk" FOREIGN KEY ("referrer_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_referred_by_users_id_fk" FOREIGN KEY ("referred_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;