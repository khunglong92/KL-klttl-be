import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as dotenv from 'dotenv';
import { UsersService } from '../users/users.service';

dotenv.config();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'dev_secret_unsecure',
    });
  }

  async validate(payload: { sub: string; email: string }) {
    // Prefer tìm full user theo email
    const user = await this.usersService.findByEmail(payload.email);
    if (!user) {
      // fallback map theo payload
      return { userId: payload.sub, email: payload.email };
    }
    // Remove password before attaching to request user
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...safe } = user;
    return safe;
  }
}
