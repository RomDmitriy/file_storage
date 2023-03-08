/*
  Warnings:

  - A unique constraint covering the columns `[title,ownerId]` on the table `Drive` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Drive_title_ownerId_key" ON "Drive"("title", "ownerId");
