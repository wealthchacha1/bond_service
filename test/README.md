# Bond Service Test Suite

## Overview
This test suite provides comprehensive test coverage for the Bond Service, targeting 80% code coverage.

## Test Files

### 1. `bondsController.test.js`
Tests for the BondController class covering:
- `getBondById` - Fetch bond by ID
- `calculateBond` - Calculate bond returns
- `getBondDetails` - Get bond details
- `getKYCStatus` - Get KYC status
- `getKYCUrl` - Generate KYC URL
- `getCheckoutUrl` - Generate checkout URL
- `createGripUser` - Create Grip user
- `getAllBonds` - Fetch all bonds
- `getAllBondsFromDB` - Fetch bonds from database

### 2. `bondService.test.js`
Tests for the BondService class covering:
- `getAllBondsFromDB` - Database queries with pagination
- `getAllBonds` - Fetch from Grip service
- `getBondById` - Get bond by ID
- `calculateBond` - Calculate bond returns
- `getBondDetails` - Get bond details
- `getKYCStatus` - Get KYC status
- `getKYCUrl` - Get KYC URL
- `getCheckoutUrl` - Get checkout URL
- `createGripUser` - Create Grip user

### 3. `bondsCategoryController.test.js`
Tests for the BondsCategoryController class covering:
- `getBondsByCategory` - Fetch bonds by category
- `updateBondsInCategory` - Update bonds in category
- `getFilterOptions` - Get filter options

### 4. `bondsCategoryService.test.js`
Tests for the BondsCategoryService class covering:
- `getBondsByCategory` - Complex filtering and sorting
- `updateBondsInCategory` - Add/remove bonds from categories
- `getFilterOptions` - Get available filter options

### 5. `startupTasks.test.js`
Tests for startup tasks covering:
- `runGripBondInitialFetch` - Initial bond fetch
- Bond creation and updates
- Marking bonds as inactive
- Cron job scheduling

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Coverage Target
- **Target**: 80% coverage
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## Mock Files

### `__mocks__/common-service.js`
Mocks for `@wc/common-service` including:
- `connectRedis`
- `verifyToken`
- `getFromRedis`
- `saveToRedis`
- `sendMessage`
- `getActiveFcList`

### `__mocks__/grip-bond-service.js`
Mocks for `@fc/grip_bond_service` including:
- `GripFinanceService` class with all methods

## Test Structure

Each test file follows this structure:
1. **Setup** - Mock dependencies and create test instances
2. **Test Cases** - Individual test cases for each method
3. **Error Handling** - Tests for error scenarios
4. **Edge Cases** - Tests for boundary conditions

## Notes

- All external dependencies are mocked
- Database operations are mocked using Jest
- External API calls are mocked
- Tests are isolated and independent
- Each test cleans up after itself


