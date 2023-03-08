/*
  Warnings:

  - A unique constraint covering the columns `[title,parentUUID]` on the table `Folder` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Folder_title_driveUUID_key";

-- CreateIndex
CREATE UNIQUE INDEX "Folder_title_parentUUID_key" ON "Folder"("title", "parentUUID");
