/*
  Warnings:

  - A unique constraint covering the columns `[uuid]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uuid]` on the table `Folder` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `uuid` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uuid` to the `Folder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "File" ADD COLUMN     "uuid" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Folder" ADD COLUMN     "uuid" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "File_uuid_key" ON "File"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "Folder_uuid_key" ON "Folder"("uuid");
