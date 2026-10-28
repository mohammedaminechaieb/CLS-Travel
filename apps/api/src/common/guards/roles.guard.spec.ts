import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

function ctx(user?: { role: Role }): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  const withRoles = (roles?: Role[]) =>
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => (key === ROLES_KEY ? roles : undefined));

  afterEach(() => jest.restoreAllMocks());

  it('allows routes without @Roles()', () => {
    withRoles(undefined);
    expect(guard.canActivate(ctx({ role: Role.client }))).toBe(true);
  });

  it('allows a matching role', () => {
    withRoles([Role.super_admin, Role.manager]);
    expect(guard.canActivate(ctx({ role: Role.manager }))).toBe(true);
  });

  it('rejects a non-matching role', () => {
    withRoles([Role.super_admin]);
    expect(() => guard.canActivate(ctx({ role: Role.agent }))).toThrow(ForbiddenException);
  });

  it('rejects anonymous users on protected routes', () => {
    withRoles([Role.client]);
    expect(() => guard.canActivate(ctx())).toThrow(ForbiddenException);
  });
});
