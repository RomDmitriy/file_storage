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
import { Drive } from '@prisma/client';
import { Request } from 'express';
import { FolderInfoDto } from 'src/dto/folderInfo.dto';
import { DriveService } from './drive.service';

@Controller('drive')
export class DriveController {
    constructor(private readonly driveService: DriveService) {}

    /**
     * Получить диски пользователя
     * @returns DriveDto[] - массив дисков
     */
    @Get('/data')
    @UseGuards(AuthGuard('jwt'))
    async getUserDrives(@Req() req: Request): Promise<Drive[]> {
        return this.driveService.getUserDrives(req.user['uuid']);
    }

    /**
     * Получить информацию о диске
     * @param driveUUID - UUID диска
     * @returns FolderInfo[]
     */
    @Get('/info/:drive_uuid')
    @UseGuards(AuthGuard('jwt'))
    async getDriveInfo(
        @Req() req: Request,
        @Param('drive_uuid') driveUUID: string
    ): Promise<FolderInfoDto | HttpException> {
        return this.driveService.getDriveInfo(req.user['uuid'], driveUUID);
    }

    /**
     * Создать новый диск
     * @body driveDto - данные о диске
     */
    @Post('/data')
    @UseGuards(AuthGuard('jwt'))
    async createDrive(@Req() req: Request): Promise<void> {
        return this.driveService.createDrive(req.user['uuid'], req.body);
    }

    /**
     * Удаление диска
     * @param drive_uuid - UUID диска
     */
    @Delete('data/:drive_uuid')
    @UseGuards(AuthGuard('jwt'))
    async deleteDrive(
        @Req() req: Request,
        @Param('drive_uuid') uuid: string,
    ): Promise<void> {
        return this.driveService.deleteDrive(req.user['uuid'], uuid);
    }
}
