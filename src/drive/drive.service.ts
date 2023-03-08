import {
    ConflictException,
    HttpException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { Drive } from '@prisma/client';
import { DriveDto } from 'src/dto/drive.dto';
import { FolderInfoDto } from 'src/dto/folderInfo.dto';
import { FolderService } from 'src/folder/folder.service';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class DriveService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly folderService: FolderService
        ) {}

    /**
     * Получить диски пользователя
     * @param userUUID - UUID пользователя
     * @returns Drive[] - массив дисков
     */
    async getUserDrives(userUUID: string): Promise<Drive[]> {
        const drives = await this.prismaService.drive.findMany({
            where: {
                ownerUUID: userUUID,
            },
        });

        return drives;
    }

    async getDriveInfo(userUUID: string, driveUUID: string): Promise<FolderInfoDto | HttpException> {
        // получаем диск
        const drive = await this.prismaService.drive.findFirst({
            where: {
                uuid: driveUUID,
                ownerUUID: userUUID
            },
            select: {
                rootUUID: true
            }
        });

        // если такой диск не найден
        if (!drive) throw new NotFoundException('Диск не найден.');

        // рекурсивно считаем информацию
        return this.folderService.getFolderInfo(userUUID, driveUUID, drive.rootUUID, true);
    }

    /**
     * Создать новый диск
     * @param uuid - UUID пользователя
     * @param driveInfo - объект с информацией о новом диске
     */
    async createDrive(uuid: string, driveInfo: DriveDto): Promise<void> {
        // в Prisma нет возможности поставить min для числа, поэтому проверяем сами
        if (driveInfo.maxFileSize && driveInfo.maxFileSize < 0) driveInfo.maxFileSize = 0;
        // создаём сам диск
        try {
            const drive = await this.prismaService.drive.create({
                data: {
                    title: driveInfo.title || 'Unnamed Drive',
                    ownerUUID: uuid,
                    allowedTypes: driveInfo.allowedTypes || [],
                    maxFileSize: driveInfo.maxFileSize || 0
                },
                select: {
                    uuid: true,
                },
            });

            // создаём "папку" для хранения корневых файлов
            const root = await this.prismaService.folder.create({
                data: {
                    title: '/',
                    driveUUID: drive.uuid,
                },
                select: {
                    uuid: true
                }
            });

            // сохраняем UUID корневого каталога
            await this.prismaService.drive.update({
                where: {
                    uuid: drive.uuid
                },
                data: {
                    rootUUID: root.uuid
                }
            });
        } catch (err) {
            if (err.code === 'P2002') {
                throw new ConflictException('Имя диска уже занято.');
            }

            throw new InternalServerErrorException('Необработанная ошибка.');
        }
    }

    /**
     * Удаление диска
     * @param userUUID - UUID пользователя
     * @param driveUUID - UUID диска
     */
    async deleteDrive(userUUID: string, driveUUID: string): Promise<void> {
        // получаем диск, заодно получаем папки
        const drive = await this.prismaService.drive.findFirst({
            where: {
                uuid: driveUUID,
                ownerUUID: userUUID
            },
            select: {
                Folder: {
                    select: {
                        uuid: true
                    }
                }
            }
        });

        // если диск не найден
        if (!drive) throw new NotFoundException('Диск не найден.');

        // Рекурсивно чистим папки
        drive.Folder.forEach(async folder => {
            await this.folderService.deleteFolder(userUUID, driveUUID, folder.uuid, true);
        });

        // удаляем сам диск
        await this.prismaService.drive.delete({
            where: {
                uuid: driveUUID
            }
        });
    }
}
