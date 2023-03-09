-- DropForeignKey
ALTER TABLE "Drive" DROP CONSTRAINT "Drive_ownerUUID_fkey";

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_folderUUID_fkey";

-- DropForeignKey
ALTER TABLE "Folder" DROP CONSTRAINT "Folder_driveUUID_fkey";

-- DropForeignKey
ALTER TABLE "Folder" DROP CONSTRAINT "Folder_parentUUID_fkey";

-- AddForeignKey
ALTER TABLE "Drive" ADD CONSTRAINT "Drive_ownerUUID_fkey" FOREIGN KEY ("ownerUUID") REFERENCES "User"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_parentUUID_fkey" FOREIGN KEY ("parentUUID") REFERENCES "Folder"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_driveUUID_fkey" FOREIGN KEY ("driveUUID") REFERENCES "Drive"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_folderUUID_fkey" FOREIGN KEY ("folderUUID") REFERENCES "Folder"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
