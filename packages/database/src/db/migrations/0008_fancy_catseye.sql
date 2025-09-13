ALTER TABLE "notes" ADD COLUMN "content_encrypted" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "content_iv" text NOT NULL;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "content_tag" text NOT NULL;