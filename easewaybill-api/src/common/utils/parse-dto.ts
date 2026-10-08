import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

export async function parseDto<T extends object>(
  cls: new (...a: any[]) => T,
  raw: unknown,
): Promise<T> {
  let json: unknown;
  try {
    json = JSON.parse(String(raw));
  } catch {
    throw new BadRequestException('payload must be valid JSON');
  }

  const dto = plainToInstance(cls, json);
  const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
  if (errors.length)
    throw new BadRequestException(errors.flatMap((e) => Object.values(e.constraints ?? {})));
  return dto;
}
