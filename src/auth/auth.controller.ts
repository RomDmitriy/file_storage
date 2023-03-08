import { Controller, Post, UseGuards, Body, HttpCode, HttpStatus, HttpException, Headers, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JWTTokenDto } from 'src/dto/jwt-tokens.dto';
import { AuthDto } from 'src/dto/auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    /**
     * Создание пользователя.
     * @param {AuthDto} name_pass - Имя-пароль пользователя.
     */
    @Post('/signup')
    @HttpCode(HttpStatus.CREATED)
    async createUser(@Body() name_pass: AuthDto): Promise<JWTTokenDto | HttpException> {
        return this.authService.createUser(name_pass);
    }

    /**
     * Аутентификация пользователя.
     * @param {AuthDto} name_pass - Имя-пароль пользователя.
     */
    @Post('/login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() name_pass: AuthDto): Promise<JWTTokenDto | HttpException> {
        return this.authService.loginUser(name_pass);
    }

    /**
     * Обновление токенов.
     */
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard('jwt-refresh'))
    async refresh(@Req() req: Request): Promise<JWTTokenDto | HttpException> {
        return this.authService.refreshTokens(req.user['uuid'], req.user['refresh_token']);
    }

    /**
     * Выход из аккаунта (деактивация refresh token).
     */
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard('jwt'))
    async logout(@Req() req: Request): Promise<void | HttpException> {
        return this.authService.logout(req.user['uuid']);
    }
}
