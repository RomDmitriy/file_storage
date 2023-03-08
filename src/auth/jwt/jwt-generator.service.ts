import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

const enum TOKEN_TYPES {
    'access' = 'access',
    'refresh' = 'refresh'
}

@Injectable()
export class JwtGeneratorService {
    constructor(
        private readonly jwt: JwtService,
        private readonly configService: ConfigService
    ) {}

    /**
     * Сгенерировать Access token
     * @param user - информация в токене
     * @returns Access token
     */
    generateAccessToken(uuid: string): string {
        return this.jwt.sign({uuid, type: TOKEN_TYPES.access}, {
            privateKey: this.configService.getOrThrow('JWT_ACCESS_KEY'),
            expiresIn: 900
        });
    }

    /**
     * Сгенерировать Refresh token
     * @param payload - информация в токене
     * @returns Refresh token
     */
    generateRefreshToken(uuid: string): string {
        return this.jwt.sign({uuid, type: TOKEN_TYPES.refresh}, {
            privateKey: this.configService.getOrThrow('JWT_REFRESH_KEY'),
            expiresIn: '30d'
        });
    }
}
