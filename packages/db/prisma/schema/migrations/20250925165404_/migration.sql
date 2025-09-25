-- DropForeignKey
ALTER TABLE "public"."folder" DROP CONSTRAINT "folder_user_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."folder" ADD CONSTRAINT "folder_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
