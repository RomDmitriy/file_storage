/*
  Warnings:

  - Made the column `parentUUID` on table `Folder` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Folder" ALTER COLUMN "parentUUID" SET NOT NULL,
ALTER COLUMN "parentUUID" SET DEFAULT '/';
