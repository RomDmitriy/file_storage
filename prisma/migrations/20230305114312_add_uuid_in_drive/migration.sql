/*
  Warnings:

  - A unique constraint covering the columns `[uuid]` on the table `Drive` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `uuid` to the `Drive` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Drive" ADD COLUMN     "uuid" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Drive_uuid_key" ON "Drive"("uuid");
