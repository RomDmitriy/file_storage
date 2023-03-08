/*
  Warnings:

  - You are about to drop the column `storageId` on the `Folder` table. All the data in the column will be lost.
  - You are about to drop the `Storage` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `driveId` to the `Folder` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Folder" DROP CONSTRAINT "Folder_storageId_fkey";

-- DropForeignKey
ALTER TABLE "Storage" DROP CONSTRAINT "Storage_ownerId_fkey";

-- AlterTable
ALTER TABLE "Folder" DROP COLUMN "storageId",
ADD COLUMN     "driveId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Storage";

-- CreateTable
CREATE TABLE "Drive" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,

    CONSTRAINT "Drive_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Drive" ADD CONSTRAINT "Drive_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_driveId_fkey" FOREIGN KEY ("driveId") REFERENCES "Drive"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
