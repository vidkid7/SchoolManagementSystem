# Property-Based Tests

This directory contains property-based tests using fast-check to validate universal correctness properties across the School Management System.

## What are Property-Based Tests?

Property-based tests verify that certain properties hold true for all possible inputs, rather than testing specific examples. They use random input generation to discover edge cases and ensure correctness across a wide range of scenarios.

## Test Files

### database-unique-constraints.property.test.ts

**Property 14: Database Unique Constraints**
**Validates: Requirements 40.1**

Tests that the database properly enforces unique constraints on critical fields:

1. **Student Code Uniqueness** - No two students can have the same `student_code`
2. **Symbol Number Uniqueness** - No two students can have the same `symbol_number` (SEE exam registration)
3. **NEB Registration Number Uniqueness** - No two students can have the same `neb_registration_number` (Class 11-12)
4. **Staff Code Uniqueness** - No two staff members can have the same `staff_code`
5. **Staff Email Uniqueness** - No two staff members can have the same email address
6. **Username Uniqueness** - No two users can have the same username
7. **User Email Uniqueness** - No two users can have the same email address

Each test:
- Generates random valid data using fast-check
- Inserts a record successfully
- Attempts to insert a duplicate record
- Verifies that the duplicate insertion is rejected with a database error

## Running Property-Based Tests

```bash
# Run all property-based tests
npm test -- properties/

# Run specific property test
npm test -- database-unique-constraints.property.test.ts

# Run with verbose output
npm test -- database-unique-constraints.property.test.ts --verbose
```

## Prerequisites

Before running these tests:

1. **Database Setup**: Ensure MySQL is running and accessible
2. **Environment Variables**: Configure `.env` file with database credentials
3. **Database Creation**: Run `npx ts-node src/scripts/create-database.ts`
4. **Migrations**: Run `npm run migrate:up` to create tables

## Test Configuration

- **Number of Runs**: Each property is tested with 20 random inputs (configurable via `numRuns`)
- **Timeout**: Tests have a 10-second timeout (configured in jest.config.js)
- **Database Cleanup**: Each test cleans up data before running to ensure isolation

## Benefits of Property-Based Testing

1. **Comprehensive Coverage**: Tests many more scenarios than manual example-based tests
2. **Edge Case Discovery**: Automatically finds edge cases you might not think of
3. **Regression Prevention**: Ensures properties hold true as code evolves
4. **Documentation**: Properties serve as executable specifications

## Adding New Property Tests

When adding new property-based tests:

1. Create a new file in this directory: `{feature}.property.test.ts`
2. Document the property being tested in the file header
3. Reference the requirement(s) being validated
4. Use fast-check arbitraries to generate test data
5. Ensure proper cleanup in `beforeEach`/`afterEach` hooks
6. Update this README with the new test

## Fast-Check Arbitraries Used

- `fc.string()` - Random strings with configurable length
- `fc.emailAddress()` - Valid email addresses
- `fc.date()` - Random dates within specified ranges
- `fc.integer()` - Random integers within specified ranges
- `fc.constantFrom()` - Random selection from a list of constants
- `fc.record()` - Random objects with specified structure
- `fc.filter()` - Filter generated values to meet constraints

## Troubleshooting

### Database Connection Errors

If you see "Access denied" errors:
- Verify `.env` file exists and has correct DB_PASSWORD
- Ensure MySQL is running
- Check database user permissions

### "Unknown database" Errors

If you see "Unknown database" errors:
- Run `npx ts-node src/scripts/create-database.ts`
- Verify DB_NAME in `.env` matches the created database

### Test Timeouts

If tests timeout:
- Check database connection is stable
- Increase timeout in jest.config.js
- Reduce `numRuns` in individual tests

## References

- [fast-check Documentation](https://github.com/dubzzz/fast-check)
- [Property-Based Testing Guide](https://fsharpforfunandprofit.com/posts/property-based-testing/)
- [Design Document](../../../.kiro/specs/school-management-system-nodejs-react/design.md)
