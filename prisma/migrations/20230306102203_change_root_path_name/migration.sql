/*
  Warnings:

  - The primary key for the `File` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Made the column `folderUUID` on table `File` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_folderUUID_fkey";

-- AlterTable
ALTER TABLE "File" DROP CONSTRAINT "File_pkey",
ALTER COLUMN "folderUUID" SET NOT NULL,
ALTER COLUMN "folderUUID" SET DEFAULT '/',
ADD CONSTRAINT "File_pkey" PRIMARY KEY ("uuid", "folderUUID");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_folderUUID_fkey" FOREIGN KEY ("folderUUID") REFERENCES "Folder"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
