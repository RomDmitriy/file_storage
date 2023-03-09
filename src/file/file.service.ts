import { Injectable, BadRequestException } from '@nestjs/common';
import {
    HttpException,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common/exceptions';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma.service';
import { parse } from 'path';
import { createReadStream, unlink, writeFileSync } from 'fs';
import { Response } from 'express';
import { FileDto } from 'src/dto/file.dto';

function getFilename(folderUUID: string, fileUUID: string) {
    return folderUUID + '.' + fileUUID;
}

@Injectable()
export class FileService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly configService: ConfigService,
    ) {}

    /**
     * Загрузить файл
     * @param userUUID - UUID пользователя
     * @param driveUUID - UUID диска
     * @param folderUUID - UUID папки
     */
    async uploadFile(
        userUUID: string,
        driveUUID: string,
        folderUUID: string,
        file: Express.Multer.File,
    ) {
        if (!file) throw new BadRequestException('Файл не отправлен.');
        const parsedFile = parse(file.originalname);

        // Этап 0. Получение ограничений диска.
        const drive = await this.prismaService.drive.findFirst({
            where: {
                ownerUUID: userUUID,
                uuid: driveUUID,
            },
            select: {
                uuid: true,
                allowedTypes: true,
                maxFileSize: true,
            },
        });

        // если диск с таким uuid и владельцем не найден
        if (!drive) throw new NotFoundException('Диск не найден.');

        // Этап 1. Проверка файла.
        // если размер файла больше максимального
        if (drive.maxFileSize !== 0 && file.size > drive.maxFileSize)
            throw new BadRequestException('Превышен лимит размера файла.');

        // если файл имеет недопустимый тип
        if (
            drive.allowedTypes.length !== 0 &&
            !drive.allowedTypes.includes(parsedFile.ext)
        ) {
            throw new BadRequestException('Недопустимый тип файла.');
        }

        // Этап 2. Проверка доступа к месту назначения.
        // если нужная папка не является корнем
        if (folderUUID !== '/') {
            // проверяем наличие папки
            await this.prismaService.folder
                .findFirstOrThrow({
                    where: {
                        driveUUID: driveUUID,
                        uuid: folderUUID,
                    },
                    select: {
                        uuid: true,
                    },
                })
                .then((folder) => {
                    // если папка найдена, то запоминаем её UUID
                    folderUUID = folder.uuid;
                })
                .catch((_) => {
                    // если папка на таком диске и с таким uuid не найдена
                    throw new NotFoundException('Папка не найдена.');
                });
        }
        // если это корень
        else {
            await this.prismaService.drive
                .findFirst({
                    where: {
                        uuid: driveUUID,
                    },
                    select: {
                        rootUUID: true,
                    },
                })
                .then((folder) => {
                    folderUUID = folder.rootUUID;
                });
        }

        // Этап 3. Логическая запись файла.
        // пробуем найти уже существующий файл
        const existingFile = await this.prismaService.file.findFirst({
            where: {
                title: parsedFile.name,
                ext: parsedFile.ext,
                folderUUID: folderUUID,
            },
            select: {
                uuid: true,
            },
        });

        let logicalFile;
        // если файл не существует
        if (!existingFile) {
            logicalFile = await this.prismaService.file.create({
                data: {
                    title: parsedFile.name,
                    ext: parsedFile.ext,
                    folderUUID: folderUUID,
                    size: file.size,
                },
                select: {
                    uuid: true,
                    folderUUID: true,
                },
            });
        }
        // иначе обновляем его
        else {
            // обновляем время обновления в БД
            logicalFile = await this.prismaService.file.update({
                where: {
                    uuid: existingFile.uuid,
                },
                data: {
                    date_updated: new Date(),
                    size: file.size,
                },
                select: {
                    physical_path: true,
                    uuid: true,
                    folderUUID: true,
                },
            });

            // обновляем сам файл
            try {
                writeFileSync(
                    logicalFile.physical_path +
                        '/' +
                        getFilename(logicalFile.folderUUID, logicalFile.uuid),
                    file.buffer,
                );
            } catch (_) {
                // если что-то пошло не так, то откатываем всё

                // удаляем логические данные о файле
                await this.prismaService.file.delete({
                    where: {
                        uuid: logicalFile,
                    },
                });

                throw new InternalServerErrorException(
                    'Произошла ошибка при записи файла.',
                );
            }
            return;
        }

        // Этап 4. Запись файла
        // загружаем массив допустимых папок
        const pathToServers: string[] = this.configService
            .getOrThrow('FILE_PATHS')
            .split(',');

        // берём случайный (почти) сервер
        const serverPath =
            pathToServers[Math.floor(Math.random() * pathToServers.length)];
        // создаём путь
        const path =
            serverPath +
            '/' +
            getFilename(logicalFile.folderUUID, logicalFile.uuid);

        // сохраняем файл
        try {
            writeFileSync(path, file.buffer);
        } catch (_) {
            // если что-то пошло не так, то откатываем всё

            // удаляем логические данные о файле
            await this.prismaService.file.delete({
                where: {
                    uuid: logicalFile.uuid,
                },
            });

            throw new InternalServerErrorException(
                'Произошла ошибка при записи файла.',
            );
        }

        // Этап 5. Завершение.
        // сохраняем в БД физический путь до файла
        await this.prismaService.file.update({
            where: {
                uuid: logicalFile.uuid,
            },
            data: {
                physical_path: serverPath,
            },
        });
    }

    /**
     * Получить информацию о файле
     * @param userUUID - UUID пользователя
     * @param fileUUID - UUID файла
     */
    async getFileInfo(userUUID: string, driveUUID: string, fileUUID: string): Promise<FileDto | HttpException> {
        // проверяем наличие диска и прав пользователя
        const drive = await this.prismaService.drive.findFirst({
            where: {
                uuid: driveUUID,
                ownerUUID: userUUID
            }
        });

        // если такого диска с таким пользовталем нет
        if (!drive) throw new NotFoundException('Диск не найден.');

        // получаем информацию о файле, попутно получая данные о родительской папке
        const file = await this.prismaService.file.findFirst({
            where: {
                uuid: fileUUID
            },
            select: {
                title: true,
                ext: true,
                date_uploaded: true,
                date_updated: true,
                size: true,
                folder: {
                    select: {
                        driveUUID: true
                    }
                }
            }
        });

        // если папка принадлежит другому диску
        if (file.folder.driveUUID !== driveUUID) throw new NotFoundException('Файл не найден.');

        // возвращаем информацию о файле
        return {
            title: file.title,
            ext: file.ext,
            date_updated: file.date_updated,
            date_uploaded: file.date_uploaded,
            size: file.size
        }
    }

    /**
     * Получить информацию о размере файлов по их UUID
     * 
     * Внимание! В этом методе нет никаких проверок. Использовать сугубо в рекурсивных вызовах.
     * @param filesUUID - массив UUID файлов
     */
    async getFilesSize(filesUUID: string[]): Promise<number> {
        const sizes = await this.prismaService.file.findMany({
            where: {
                uuid: {
                    in: filesUUID
                }
            },
            select: {
                size: true
            }
        });

        return sizes.reduce((sum, curr) => { return sum + curr.size} , 0);
    }

    /**
     * Получить файл
     * @param userUUID - UUID пользователя
     * @param driveUUID - UUID диска
     * @param folderUUID - UUID папки
     * @param fileUUID - UUID файла
     */
    async getFile(
        userUUID: string,
        driveUUID: string,
        folderUUID: string,
        fileUUID: string,
        res: Response,
    ): Promise<void | HttpException> {
        // проверяем наличие такого диска
        const drive = await this.prismaService.drive.findFirst({
            where: {
                uuid: driveUUID,
                ownerUUID: userUUID,
            },
            select: {
                rootUUID: true,
            },
        });

        // если диск с таким UUID и таким владельцем не найден
        if (!drive) throw new NotFoundException('Диск не найден.');

        // если нужная папка это корень
        if (folderUUID === '/') folderUUID = drive.rootUUID;

        // получаем папку + файл
        const logicalFolder = await this.prismaService.folder.findFirst({
            where: {
                uuid: folderUUID,
            },
            select: {
                File: {
                    select: {
                        physical_path: true,
                        folderUUID: true,
                        uuid: true,
                    },
                },
            },
        });

        // если не смогли найти папку
        if (!logicalFolder) throw new NotFoundException('Папка не найдена.');
        // если не смогли найти файл
        if (logicalFolder.File.length === 0)
            throw new NotFoundException('Файл не найден.');

        // берём файл
        const file = createReadStream(
            logicalFolder.File[0].physical_path +
                '/' +
                getFilename(
                    logicalFolder.File[0].folderUUID,
                    logicalFolder.File[0].uuid,
                ),
        );

        // отправляем файл
        file.pipe(res);
    }

    /**
     * Удалить файл
     * @param userUUID - UUID пользователя
     * @param driveUUID - UUID диска
     * @param folderUUID - UUID папки
     * @param fileUUID - UUID файла
     */
    async deleteFile(
        userUUID: string,
        driveUUID: string,
        fileUUID: string,
        skipValidation: boolean = false,
    ): Promise<void | HttpException> {
        // получаем логический файл
        const logicalFile = await this.prismaService.file.findFirst({
            where: {
                uuid: fileUUID,
            },
            select: {
                physical_path: true,
                folderUUID: true,
            },
        });

        // если файл не найден
        if (!logicalFile) 
            return new NotFoundException('Файл или диск не найдены.');

        // для рекурсивных вызовов проверка ненужна, так как она была пройдена в вызывающей функции
        if (!skipValidation) {
            // получаем папку
            await this.prismaService.folder
                .findFirst({
                    where: {
                        uuid: logicalFile.folderUUID,
                    },
                    select: {
                        driveUUID: true,
                    },
                })
                .then(async (folder) => {
                    // если диск с файлом и диск из запроса не совпадают
                    // защита от случаев если указать свой диск и чужой файл
                    if (driveUUID !== folder.driveUUID)
                        throw new NotFoundException('Файл не найден.');

                    // получаем диск
                    await this.prismaService.drive
                        .findFirst({
                            where: {
                                uuid: folder.driveUUID,
                                ownerUUID: userUUID,
                            },
                            select: {
                                uuid: true,
                            },
                        })
                        .then((drive) => {
                            // если у пользователя нет прав на этот диск
                            if (!drive)
                                throw new NotFoundException('Диск не найден.');
                        });
                });
        }

        // удаляем физический файл
        unlink(
            logicalFile.physical_path +
                '/' +
                getFilename(logicalFile.folderUUID, fileUUID),
            (err) => {
                if (err)
                    return new InternalServerErrorException(
                        'Ошибка при удалении файла.',
                    );
            },
        );

        // удаляем логический файл
        await this.prismaService.file.delete({
            where: {
                uuid: fileUUID,
            },
        });
    }
}
