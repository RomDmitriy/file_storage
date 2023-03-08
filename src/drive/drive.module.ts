import { Module } from '@nestjs/common';
import { FileService } from 'src/file/file.service';
import { FolderService } from 'src/folder/folder.service';
import { PrismaService } from 'src/prisma.service';
import { DriveController } from './drive.controller';
import { DriveService } from './drive.service';

@Module({
  controllers: [DriveController],
  providers: [PrismaService, FolderService, FileService, DriveService]
})
export class DriveModule {}
