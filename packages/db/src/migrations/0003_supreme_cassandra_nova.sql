ALTER TABLE "folder" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "folder" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "folder" ALTER COLUMN "parent_folder_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "note" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "note" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "note" ALTER COLUMN "folder_id" SET DATA TYPE text;