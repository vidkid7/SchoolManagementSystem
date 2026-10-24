import bcrypt from 'bcrypt';
import User, { UserRole, UserStatus } from '../User.model';

const buildUser = (password: string) => User.build({
  username: 'qa_password_hook',
  email: 'qa-password-hook@example.test',
  password,
  role: UserRole.SCHOOL_ADMIN,
  status: UserStatus.ACTIVE,
  failedLoginAttempts: 0,
});

const runModelHook = (hookName: 'beforeCreate' | 'beforeUpdate', user: InstanceType<typeof User>) =>
  (User as unknown as {
    runHooks: (name: string, instance: InstanceType<typeof User>) => Promise<void>;
  }).runHooks(hookName, user);

describe('User password hooks without a database', () => {
  it('hashes a plaintext password before create using bcrypt cost 12', async () => {
    const plaintext = 'QA-Password-Create-123!';
    const user = buildUser(plaintext);

    await runModelHook('beforeCreate', user);

    expect(user.password).not.toBe(plaintext);
    expect(user.password).toMatch(/^\$2[aby]\$12\$/);
    expect(bcrypt.getRounds(user.password)).toBe(12);
    await expect(user.comparePassword(plaintext)).resolves.toBe(true);
    await expect(user.comparePassword('wrong-password')).resolves.toBe(false);
  });

  it('hashes changed passwords before update and records the password change time', async () => {
    const user = buildUser('Old-QA-Password-123!');
    const newPassword = 'New-QA-Password-456!';
    user.setDataValue('password', newPassword);

    await runModelHook('beforeUpdate', user);

    expect(user.password).not.toBe(newPassword);
    expect(user.password).toMatch(/^\$2[aby]\$12\$/);
    expect(bcrypt.getRounds(user.password)).toBe(12);
    expect(user.passwordChangedAt).toBeInstanceOf(Date);
    await expect(user.comparePassword(newPassword)).resolves.toBe(true);
    await expect(user.comparePassword('Old-QA-Password-123!')).resolves.toBe(false);
  });
});
