import {
    ConflictException,
    HttpException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { FolderDto } from 'src/dto/folder.dto';
import { FolderInfoDto } from 'src/dto/folderInfo.dto';
import { FileService } from 'src/file/file.service';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class FolderService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly fileService: FileService,
    ) {}

    /**
     * Получить путь до папки и её содержимое
     * @param userUUID - UUID пользователя (лежит в токене)
     * @param driveUUID - UUID диска
     * @param folderUUID - UUID папки
     */
    async getFolder(
        userUUID: string,
        driveUUID: string,
        folderUUID: string = '/',
    ): Promise<{ path: FolderDto[]; content: any[] } | HttpException> {
        // получаем UUID диска
        const drive = await this.prismaService.drive.findFirst({
            where: {
                uuid: driveUUID,
                ownerUUID: userUUID,
            },
            select: {
                uuid: true,
                rootUUID: true,
                title: true,
            },
        });

        // если диск с таким uuid и ownerId не найден
        if (!drive) throw new NotFoundException('Диск не найден.');

        // если это корень
        if (folderUUID === '/') folderUUID = drive.rootUUID;

        // проверяем наличие папки
        const folder = await this.prismaService.folder.findFirst({
            where: {
                uuid: folderUUID,
            },
            select: {
                uuid: true,
            },
        });

        // если папка не найдена
        if (!folder) throw new NotFoundException('Папка не найдена.');

        // Получение папок и файлов
        // получаем папки из рабочего каталога
        const tempFolders = await this.prismaService.folder.findMany({
            where: {
                parentUUID: folderUUID,
                NOT: {
                    title: '/',
                },
            },
            select: {
                uuid: true,
                title: true,
            },
        });

        // подписываем тип объекта
        const folders = tempFolders.map((folder) => ({
            type: 'Folder',
            ...folder,
        }));

        // получаем файлы из рабочего каталога
        const tempFiles = await this.prismaService.file.findMany({
            where: {
                folderUUID: folderUUID,
            },
            select: {
                uuid: true,
                title: true,
                ext: true,
            },
        });

        // подписываем тип объекта
        const files = tempFiles.map((file) => ({ type: 'File', ...file }));

        // Создание пути
        // получаем массив папок от рабочего каталога до корня
        let paths: FolderDto[] = [];
        let currentFolder: FolderDto = { uuid: folderUUID, title: '' };
        // пока мы не дошли до корня
        while (currentFolder.uuid !== drive.rootUUID) {
            // получаем информацию о текущем каталоге
            await this.prismaService.folder
                .findFirst({
                    where: {
                        uuid: currentFolder.uuid,
                    },
                    select: {
                        title: true,
                        parentUUID: true,
                    },
                })
                .then((folder) => {
                    currentFolder.title = folder.title;
                    paths.push(currentFolder);
                    currentFolder = { uuid: folder.parentUUID, title: '' };
                });
        }

        // добавляем сам корень
        paths.push({ uuid: drive.rootUUID, title: drive.title });

        // возвращаем результат
        return { path: paths.reverse(), content: [...folders, ...files] };
    }

    async getFolderInfo(
        userUUID: string,
        driveUUID: string,
        folderUUID: string = '/',
        skipValidation: boolean = false,
    ): Promise<FolderInfoDto> {
        let result: FolderInfoDto = {
            files: 0,
            folders: 0,
            filesSize: 0,
        };

        // для рекурсивных вызовов проверка ненужна, так как она была пройдена в вызывающей функции
        if (!skipValidation) {
            // проверяем диск
            const drive = await this.prismaService.drive.findFirst({
                where: {
                    ownerUUID: userUUID,
                    uuid: driveUUID,
                },
                select: {
                    rootUUID: true,
                },
            });

            // если диск с таким uuid и владельцем не найден
            if (!drive) throw new NotFoundException('Диск не найден.');

            // если считаем от корня
            if (folderUUID === '/') {
                folderUUID = drive.rootUUID;
            }
        }

        // получаем все файлы в данной директории
        const files = await this.prismaService.file.findMany({
            where: {
                folderUUID: folderUUID,
            },
            select: {
                uuid: true,
            },
        });

        // получаем информацию о файлах в текущей директории
        const filesSize = await this.fileService.getFilesSize(
            files.map((file) => file.uuid),
        );

        // получаем все папки в данной директории
        const folders = await this.prismaService.folder.findMany({
            where: {
                parentUUID: folderUUID,
            },
            select: {
                uuid: true,
            },
        });

        // если папки в данной директории есть
        if (folders.length !== 0) {
            // создаём массив promise'ов
            const promises = folders.map((folder) => {
                return this.getFolderInfo(
                    userUUID,
                    driveUUID,
                    folder.uuid,
                    true,
                );
            });

            // выполняем их
            const results = await Promise.all(promises);
            result = results.reduce((sum, cur) => {
                sum.files += cur.files;
                sum.filesSize += cur.filesSize;
                sum.folders += cur.folders;
                return sum;
            });
        }

        return {
            files: files.length + result.files,
            folders: folders.length + result.folders,
            filesSize: filesSize + result.filesSize,
        };
    }

    /**
     * Создать папку.
     * @param userUUID - UUID пользователя
     * @param driveUUID - UUID диска
     * @param parentUUID - UUID родительской папки ('/' = лежит в корне)
     * @param folderInfo - информация о папке
     */
    async createFolder(
        userUUID: string,
        driveUUID: string,
        parentUUID: string = '/',
        folderInfo: FolderDto,
    ): Promise<void | HttpException> {
        // проверяем, что пользователь владеет нужным диском
        const drive = await this.prismaService.drive.findFirst({
            where: {
                ownerUUID: userUUID,
                uuid: driveUUID,
            },
            select: {
                uuid: true,
                rootUUID: true,
            },
        });

        // если диск не найден или пользователь не владеет им
        if (!drive) throw new NotFoundException('Диск не найден.');

        // создаём новую папку
        try {
            await this.prismaService.folder.create({
                data: {
                    title: folderInfo.title,
                    driveUUID,
                    parentUUID:
                        parentUUID !== '/' ? parentUUID : drive.rootUUID,
                },
            });
        } catch (err) {
            if (err.code === 'P2002') {
                throw new ConflictException('Имя папки уже занято.');
            } else if (err.code === 'P2003') {
                throw new NotFoundException('Родительская папка не найдена.');
            }

            throw new InternalServerErrorException('Необработанная ошибка.');
        }
    }

    async deleteFolder(
        userUUID: string,
        driveUUID: string,
        folderUUID: string = '/',
        skipValidation: boolean = false,
    ): Promise<void | HttpException> {
        // переменная для отслеживания является ли данная директория корнем
        let isRoot = false;

        // для рекурсивных вызовов проверка ненужна, так как она была пройдена в вызывающей функции
        if (!skipValidation) {
            // проверяем диск
            const drive = await this.prismaService.drive.findFirst({
                where: {
                    ownerUUID: userUUID,
                    uuid: driveUUID,
                },
                select: {
                    rootUUID: true,
                },
            });

            // если диск с таким uuid и владельцем не найден
            if (!drive) throw new NotFoundException('Диск не найден.');

            // если очищаем корень
            if (folderUUID === '/') {
                folderUUID = drive.rootUUID;
                isRoot = true;
            }
        }

        // получаем все файлы в данной директории
        const files = await this.prismaService.file.findMany({
            where: {
                folderUUID: folderUUID,
            },
            select: {
                uuid: true,
            },
        });

        // удаляем их
        files.forEach(async (file) => {
            await this.fileService.deleteFile(
                userUUID,
                driveUUID,
                file.uuid,
                true,
            );
        });

        // получаем все папки в данной директории
        const folders = await this.prismaService.folder.findMany({
            where: {
                parentUUID: folderUUID,
            },
            select: {
                uuid: true,
            },
        });

        // рекурсивно удаляем их
        folders.forEach(async (folder) => {
            await this.deleteFolder(userUUID, driveUUID, folder.uuid, true);
        });

        // если мы зачищаем не корень (или корень тоже удаляем)
        if (!isRoot) {
            // удаляем папку, которую мы удаляли изначально
            await this.prismaService.folder
                .delete({
                    where: {
                        uuid: folderUUID,
                    },
                })
                .catch(() => {
                    return new NotFoundException('Папка не найдена.');
                });
        }
    }
}
