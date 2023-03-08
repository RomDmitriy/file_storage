import {
    Injectable,
    HttpException,
    NotFoundException,
    ConflictException,
    InternalServerErrorException,
    Body,
    ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JWTTokenDto } from 'src/dto/jwt-tokens.dto';
import { JwtGeneratorService } from './jwt/jwt-generator.service';
import { PrismaService } from 'src/prisma.service';
import { AuthDto } from 'src/dto/auth.dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtGeneratorService,
    ) {}

    /**
     * Создание пользователя.
     * @param {AuthDto} name_pass - Имя-пароль пользователя.
     */
    async createUser(@Body() name_pass: AuthDto): Promise<JWTTokenDto | HttpException> {
        // генерируем соль
        const salt = await bcrypt.genSalt();

        // хэшируем пароль
        const hashed_password = await bcrypt.hash(name_pass.password, salt);

        try {
            let access_token: string;
            let refresh_token: string;
            // создаём пользователя в БД, попутно создавая токены
            await this.prisma.$transaction(async (prisma) => {
                const user = await prisma.user.create({
                    data: {
                        username: name_pass.username,
                        password_hash: hashed_password,
                        password_salt: salt,
                    },
                });

                access_token = this.jwt.generateAccessToken(user.uuid);
                refresh_token = this.jwt.generateRefreshToken(user.uuid);

                await prisma.user.update({
                    where: {
                        uuid: user.uuid,
                    },
                    data: {
                        refresh_token: refresh_token,
                    },
                });
            });

            // возвращаем результат
            return {
                access_token,
                refresh_token,
            };
        } catch (err) {
            if (err.code === 'P2002') {
                throw new ConflictException('Данный ник уже занят.');
            }

            throw new InternalServerErrorException();
        }
    }

    /**
     * Аутентификация пользователя.
     * @param {AuthDto} name_pass - Имя-пароль пользователя.
     */
    async loginUser(name_pass: AuthDto): Promise<JWTTokenDto | HttpException> {
        // ищем пользователя
        const user = await this.prisma.user.findFirst({
            where: {
                username: name_pass.username,
            },
        });

        // если пользователь не найден
        if (user === null) {
            throw new NotFoundException('Пользователь не найден.');
        }

        // если пользователь найден
        const password_hash = user.password_hash;
        const password_salt = user.password_salt;
        const request_password_hashed = await bcrypt.hash(
            name_pass.password,
            password_salt,
        );

        // сравниваем пароли
        if (password_hash === request_password_hashed) {
            // генерируем новые токены
            const access_token = this.jwt.generateAccessToken(user.uuid);
            const refresh_token = this.jwt.generateRefreshToken(user.uuid);

            // перезаписываем refresh token в БД
            await this.prisma.user.update({
                where: {
                    uuid: user.uuid
                },
                data: {
                    refresh_token: refresh_token
                }
            })
            return {
                access_token,
                refresh_token
            };
        } else {
            // если пользователь найден, но пароль не совпадает
            throw new NotFoundException('Пользователь не найден.');
        }
    }

    /**
     * Обновление токенов.
     * @param {string} refresh_token - Refresh token пользователя.
     */
    async refreshTokens(uuid: string, rt: string): Promise<JWTTokenDto | HttpException> {
        // проверяем, что токен актуальный
        const user = await this.prisma.user.findFirst({
            where: {
                uuid,
                refresh_token: rt
            }
        });

        // если пользователя с таким uuid нет, либо refresh token не актуален
        if (!user) throw new ForbiddenException('Пользователь не найден, либо токен не актуален.');

        // создаём новый refresh token
        const refresh_token = this.jwt.generateRefreshToken(user.uuid);

        // обновляем refresh token в БД
        await this.prisma.user.update({
            where: {
                uuid: uuid,
            },
            data: {
                refresh_token: refresh_token,
            },
        });

        // возвращаем новые токены
        return {
            access_token: this.jwt.generateAccessToken(user.uuid),
            refresh_token: refresh_token,
        };
    }

    async logout(uuid: string): Promise<void |HttpException> {

        await this.prisma.user.update({
            where: {
                uuid
            },
            data: {
                refresh_token: null
            }
        })
    }
}
