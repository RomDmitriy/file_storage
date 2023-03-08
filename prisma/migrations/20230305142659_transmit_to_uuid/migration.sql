/*
  Warnings:

  - The primary key for the `Drive` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Drive` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `Drive` table. All the data in the column will be lost.
  - The primary key for the `File` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `folderId` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `File` table. All the data in the column will be lost.
  - The primary key for the `Folder` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `driveId` on the `Folder` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Folder` table. All the data in the column will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[uuid,driveUUID]` on the table `Folder` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ownerUUID` to the `Drive` table without a default value. This is not possible if the table is not empty.
  - Added the required column `folderUUID` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `driveUUID` to the `Folder` table without a default value. This is not possible if the table is not empty.
  - The required column `uuid` was added to the `User` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "Drive" DROP CONSTRAINT "Drive_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_folderId_fkey";

-- DropForeignKey
ALTER TABLE "Folder" DROP CONSTRAINT "Folder_driveId_fkey";

-- DropIndex
DROP INDEX "Drive_title_ownerId_key";

-- DropIndex
DROP INDEX "Drive_uuid_key";

-- DropIndex
DROP INDEX "File_title_folderId_key";

-- DropIndex
DROP INDEX "File_uuid_key";

-- DropIndex
DROP INDEX "Folder_uuid_driveId_key";

-- DropIndex
DROP INDEX "Folder_uuid_key";

-- AlterTable
ALTER TABLE "Drive" DROP CONSTRAINT "Drive_pkey",
DROP COLUMN "id",
DROP COLUMN "ownerId",
ADD COLUMN     "ownerUUID" TEXT NOT NULL,
ADD CONSTRAINT "Drive_pkey" PRIMARY KEY ("uuid");

-- AlterTable
ALTER TABLE "File" DROP CONSTRAINT "File_pkey",
DROP COLUMN "folderId",
DROP COLUMN "id",
ADD COLUMN     "folderUUID" TEXT NOT NULL,
ADD CONSTRAINT "File_pkey" PRIMARY KEY ("uuid");

-- AlterTable
ALTER TABLE "Folder" DROP CONSTRAINT "Folder_pkey",
DROP COLUMN "driveId",
DROP COLUMN "id",
ADD COLUMN     "driveUUID" TEXT NOT NULL,
ADD CONSTRAINT "Folder_pkey" PRIMARY KEY ("uuid");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "id",
ADD COLUMN     "uuid" TEXT NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "Folder_uuid_driveUUID_key" ON "Folder"("uuid", "driveUUID");

-- AddForeignKey
ALTER TABLE "Drive" ADD CONSTRAINT "Drive_ownerUUID_fkey" FOREIGN KEY ("ownerUUID") REFERENCES "User"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_driveUUID_fkey" FOREIGN KEY ("driveUUID") REFERENCES "Drive"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_folderUUID_fkey" FOREIGN KEY ("folderUUID") REFERENCES "Folder"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
