/*
  Warnings:

  - Added the required column `rootUUID` to the `Drive` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Drive" ADD COLUMN     "rootUUID" TEXT NOT NULL;
