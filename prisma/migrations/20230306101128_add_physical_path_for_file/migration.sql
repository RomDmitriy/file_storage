/*
  Warnings:

  - Added the required column `physical_path` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "File" ADD COLUMN     "physical_path" TEXT NOT NULL;
