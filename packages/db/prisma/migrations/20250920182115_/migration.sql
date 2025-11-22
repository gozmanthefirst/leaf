/*
  Warnings:

  - The primary key for the `folder` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `note` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `folder` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `parent_folder_id` on the `folder` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `note` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `folder_id` on the `note` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "public"."folder" DROP CONSTRAINT "folder_parent_folder_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."note" DROP CONSTRAINT "note_folder_id_fkey";

-- AlterTable
ALTER TABLE "public"."folder" DROP CONSTRAINT "folder_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "parent_folder_id",
ADD COLUMN     "parent_folder_id" UUID NOT NULL,
ADD CONSTRAINT "folder_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."note" DROP CONSTRAINT "note_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "folder_id",
ADD COLUMN     "folder_id" UUID NOT NULL,
ADD CONSTRAINT "note_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "public"."folder" ADD CONSTRAINT "folder_parent_folder_id_fkey" FOREIGN KEY ("parent_folder_id") REFERENCES "public"."folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."note" ADD CONSTRAINT "note_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "public"."folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
