/*
  Warnings:

  - A unique constraint covering the columns `[title,folderId]` on the table `File` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "File_title_folderId_key" ON "File"("title", "folderId");
