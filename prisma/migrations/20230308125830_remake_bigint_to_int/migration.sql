/*
  Warnings:

  - You are about to alter the column `maxFileSize` on the `Drive` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `size` on the `File` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Drive" ALTER COLUMN "maxFileSize" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "File" ALTER COLUMN "size" SET DATA TYPE INTEGER;
