import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { FileController } from './file.controller';
import { FileService } from './file.service';

@Module({
  controllers: [FileController],
  providers: [PrismaService, FileService]
})
export class FileModule {}
