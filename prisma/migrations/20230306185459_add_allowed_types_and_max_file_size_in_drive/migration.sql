-- AlterTable
ALTER TABLE "Drive" ADD COLUMN     "allowedTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "maxFileSize" INTEGER NOT NULL DEFAULT 0;
