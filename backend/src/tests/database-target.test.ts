describe('Jest database target safety', () => {
  it('pins database tests to the local test database', () => {
    expect(process.env.DATABASE_URL).toBeUndefined();
    expect(process.env.MYSQL_URL).toBeUndefined();
    expect(process.env.DB_HOST).toBe('localhost');
    expect(process.env.DB_PORT).toBe('3306');
    expect(process.env.DB_NAME).toBe('school_management_system_test');
    expect(process.env.DB_USER).toBe('root');
  });

  it('uses an explicitly supplied test password without a source-code default', () => {
    expect(process.env.DB_PASSWORD).toBe(process.env.TEST_DB_PASSWORD || '');
  });
});
