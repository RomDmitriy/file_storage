-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_folderUUID_fkey";

-- AlterTable
ALTER TABLE "File" ALTER COLUMN "folderUUID" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_folderUUID_fkey" FOREIGN KEY ("folderUUID") REFERENCES "Folder"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
