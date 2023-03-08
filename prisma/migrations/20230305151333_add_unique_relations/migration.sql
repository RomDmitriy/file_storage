/*
  Warnings:

  - A unique constraint covering the columns `[title,ownerUUID]` on the table `Drive` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[title,folderUUID]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[title,driveUUID]` on the table `Folder` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Folder_uuid_driveUUID_key";

-- CreateIndex
CREATE UNIQUE INDEX "Drive_title_ownerUUID_key" ON "Drive"("title", "ownerUUID");

-- CreateIndex
CREATE UNIQUE INDEX "File_title_folderUUID_key" ON "File"("title", "folderUUID");

-- CreateIndex
CREATE UNIQUE INDEX "Folder_title_driveUUID_key" ON "Folder"("title", "driveUUID");
