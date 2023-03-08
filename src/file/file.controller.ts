import { Controller, Get, Post, Param, Req, Res, UseGuards, HttpException, UploadedFile } from '@nestjs/common';
import { Delete, UseInterceptors } from '@nestjs/common/decorators';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { FileDto } from 'src/dto/file.dto';
import { FileService } from './file.service';

@Controller('file')
export class FileController {
    constructor(private readonly fileService: FileService) {}

    /**
     * Получить файл
     * @param driveUUID - UUID диска
     * @param folderUUID - UUID папки
     * @param fileUUID - UUID файла
     * @returns Файл
     */
    @Get('data/:drive_uuid/:folder_uuid?/:file_uuid')
    @UseGuards(AuthGuard('jwt'))
    async getFile(
        @Req() req: Request,
        @Res() res: Response,
        @Param('drive_uuid') driveUUID: string,
        @Param('folder_uuid') folderUUID: string = '/',
        @Param('file_uuid') fileUUID: string,
    ): Promise<void | HttpException> {
        return this.fileService.getFile(req.user['uuid'], driveUUID, folderUUID, fileUUID, res);
    }

    /**
     * Получить информацию о файле
     * @param driveUUID - UUID диска
     * @param fileUUID - UUID файла
     */
    @Get(':drive_uuid/:file_uuid')
    @UseGuards(AuthGuard('jwt'))
    async getFileInfo(
        @Req() req: Request,
        @Param('drive_uuid') driveUUID: string,
        @Param('file_uuid') fileUUID: string
    ): Promise<FileDto | HttpException> {
        return this.fileService.getFileInfo(req.user['uuid'], driveUUID, fileUUID);
    }

    /**
     * Загрузить файл (создать новый или обновить старый)
     * @param userUUID - UUID пользователя
     * @param driveUUID - UUID диска
     * @param folderUUID - UUID папки
     * @param file - Файл из формы с названием 'file'
     */
    @Post('data/:drive_uuid/:folder_uuid?')
    @UseGuards(AuthGuard('jwt'))
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @Req() req: Request,
        @Param('drive_uuid') driveUUID: string,
        @Param('folder_uuid') folderUUID: string = '/',
        @UploadedFile() file: Express.Multer.File
    ): Promise<void | HttpException> {
        return this.fileService.uploadFile(req.user['uuid'], driveUUID, folderUUID, file);
    }

    /**
     * Удалить файл
     * @param userUUID - UUID пользователя
     * @param driveUUID - UUID диска
     * @param fileUUID - UUID файла
     */
    @Delete('data/:drive_uuid/:file_uuid')
    @UseGuards(AuthGuard('jwt'))
    async deleteFile(
        @Req() req: Request,
        @Param('drive_uuid') driveUUID: string,
        @Param('file_uuid') fileUUID: string,
    ): Promise<void | HttpException> {
        return this.fileService.deleteFile(req.user['uuid'], driveUUID, fileUUID);
    }
}
