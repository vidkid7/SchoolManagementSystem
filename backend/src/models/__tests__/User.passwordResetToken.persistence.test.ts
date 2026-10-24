import sequelize from '@config/database';
import User, { UserRole, UserStatus } from '../User.model';

describe('User password reset token persistence', () => {
  let user: User;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    user = await User.create({
      username: 'resetTokenQA',
      email: 'reset-token-qa@example.test',
      password: 'QA-Reset-Token-Password-123!',
      role: UserRole.SCHOOL_ADMIN,
      status: UserStatus.ACTIVE,
      failedLoginAttempts: 0,
    });
  });

  afterAll(async () => {
    await user?.destroy({ force: true });
    await sequelize.close();
  });

  it('removes a consumed reset token from persisted storage', async () => {
    const rawToken = await user.generatePasswordResetToken();
    await user.reload();

    expect(user.passwordResetToken).toBeTruthy();
    expect(user.passwordResetToken).not.toBe(rawToken);
    await expect(User.verifyPasswordResetToken(rawToken)).resolves.toBeTruthy();

    await user.clearPasswordResetToken();
    await user.reload();

    expect(user.passwordResetToken).toBeNull();
    expect(user.passwordResetExpires).toBeNull();
    await expect(User.verifyPasswordResetToken(rawToken)).resolves.toBeNull();
  });
});
