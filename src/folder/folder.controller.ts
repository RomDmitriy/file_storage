import {
    Controller,
    Get,
    Post,
    UseGuards,
    Req,
    Delete,
    Param,
    HttpException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { FolderDto } from 'src/dto/folder.dto';
import { FolderInfoDto } from 'src/dto/folderInfo.dto';
import { FolderService } from './folder.service';

@Controller('folder')
export class FolderController {
    constructor(private readonly folderService: FolderService) {}

    /**
     * Получить путь до папки и её содержимое
     * @param driveUUID - UUID диска
     * @param folderUUID - UUID папки
     * @returns массив папок и файлов
     */
    @Get('data/:drive_uuid/:folder_uuid?')
    @UseGuards(AuthGuard('jwt'))
    async getFolderContent(
        @Req() req: Request,
        @Param('drive_uuid') driveUUID: string,
        @Param('folder_uuid') folderUUID: string,
    ): Promise<{path: FolderDto[], content: any[]} | HttpException> {
        return this.folderService.getFolder(
            req.user['uuid'],
            driveUUID,
            folderUUID,
        );
    }

    /**
     * Получить информацию о папке (кол-во файлов, папок и суммарный вес файлов)
     * @param driveUUID - UUID диска
     * @param folderUUID - UUID папки
     * @returns FolderInfoDto
     */
    @Get('info/:drive_uuid/:folder_uuid?')
    @UseGuards(AuthGuard('jwt'))
    async getFolderInfo(
        @Req() req: Request,
        @Param('drive_uuid') driveUUID: string,
        @Param('folder_uuid') folderUUID: string,
    ): Promise<FolderInfoDto | HttpException> {
        return this.folderService.getFolderInfo(req.user['uuid'], driveUUID, folderUUID);
    }

    /**
     * Создать папку.
     * @param driveUUID - UUID диск
     * @param folderUUID - UUID папки
     */
    @Post('data/:drive_uuid/:folder_uuid?')
    @UseGuards(AuthGuard('jwt'))
    async createFolder(
        @Req() req: Request,
        @Param('drive_uuid') driveUUID: string,
        @Param('folder_uuid') folderUUID: string,
    ): Promise<void | HttpException> {
        return this.folderService.createFolder(
            req.user['uuid'],
            driveUUID,
            folderUUID,
            req.body,
        );
    }

    /**
     * Удалить папку.
     * @param driveUUID - UUID диска
     * @param folderUUID - UUID папки
     */
    @Delete('data/:drive_uuid/:folder_uuid?')
    @UseGuards(AuthGuard('jwt'))
    async deleteFolder(
        @Req() req: Request,
        @Param('drive_uuid') driveUUID: string,
        @Param('folder_uuid') folderUUID: string,
    ): Promise<void | HttpException> {
        return this.folderService.deleteFolder(
            req.user['uuid'],
            driveUUID,
            folderUUID,
        );
    }
}
