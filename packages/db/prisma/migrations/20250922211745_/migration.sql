/*
  Warnings:

  - The primary key for the `folder` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `note` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "public"."folder" DROP CONSTRAINT "folder_parent_folder_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."note" DROP CONSTRAINT "note_folder_id_fkey";

-- AlterTable
ALTER TABLE "public"."account" ALTER COLUMN "access_token_expires_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "refresh_token_expires_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."folder" DROP CONSTRAINT "folder_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "parent_folder_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "folder_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."note" DROP CONSTRAINT "note_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "folder_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "note_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."session" ALTER COLUMN "expires_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."user" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."verification" ALTER COLUMN "expires_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" DROP DEFAULT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "public"."folder" ADD CONSTRAINT "folder_parent_folder_id_fkey" FOREIGN KEY ("parent_folder_id") REFERENCES "public"."folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."note" ADD CONSTRAINT "note_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "public"."folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
