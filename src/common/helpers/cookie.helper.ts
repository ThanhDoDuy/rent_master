import { Injectable } from '@nestjs/common';

@Injectable()
export class CookieHelper {
    private readonly sameSite: 'Strict' | 'None' | 'Lax';
    private readonly accessTokenCookieName: string;
    private readonly env: string;
    private readonly isStaging: boolean;
    private readonly isProd: boolean;

    constructor() {
        this.env = process.env.NODE_ENV || 'development';
        this.isStaging = this.env === 'staging';
        this.isProd = this.env === 'production' || this.env === 'prod';
        this.sameSite = this.isProd || this.isStaging ? 'Strict' : 'None';
        this.accessTokenCookieName =
            this.isProd ? 'sessionToken' : `sessionToken_${this.env}`;
    }

  getOptions(): { options: any; sessionCookieName: string } {
    // Default: 7 days in milliseconds (604800000 ms)
    const defaultMaxAge = 7 * 24 * 60 * 60 * 1000;
    const maxAgeMs = parseInt(process.env.ACCESS_TOKEN_TTL_MS || String(defaultMaxAge));
    
    // Validate maxAge (must be a valid number and not too large)
    const validMaxAge = isNaN(maxAgeMs) || maxAgeMs <= 0 || maxAgeMs > Number.MAX_SAFE_INTEGER 
      ? defaultMaxAge 
      : maxAgeMs;

    const options: any = {
      maxAge: validMaxAge, // milliseconds
      httpOnly: true,
      path: '/',
      sameSite: this.sameSite as 'Strict' | 'None' | 'Lax',
      secure: this.sameSite === 'None',
    };

    // Only add domain if it's set and not empty
    if (process.env.COOKIE_DOMAIN && process.env.COOKIE_DOMAIN.trim() !== '') {
      options.domain = process.env.COOKIE_DOMAIN;
    }

    return { options, sessionCookieName: this.accessTokenCookieName };
  }
}

