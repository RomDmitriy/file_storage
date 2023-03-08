/*
  Warnings:

  - A unique constraint covering the columns `[uuid,driveId]` on the table `Folder` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Folder_uuid_driveId_key" ON "Folder"("uuid", "driveId");
