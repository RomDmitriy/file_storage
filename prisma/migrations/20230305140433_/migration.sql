/*
  Warnings:

  - Added the required column `date_updated` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date_uploaded` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "File" ADD COLUMN     "date_updated" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "date_uploaded" TIMESTAMP(3) NOT NULL;
