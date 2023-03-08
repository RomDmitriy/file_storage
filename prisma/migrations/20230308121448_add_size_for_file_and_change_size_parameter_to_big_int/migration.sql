/*
  Warnings:

  - Added the required column `size` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Drive" ALTER COLUMN "maxFileSize" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "File" ADD COLUMN     "size" BIGINT NOT NULL;
