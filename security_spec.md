# Security Specification: Zero-Trust Attribute-Based Access Control (ABAC)

This security specification outlines the data invariants, protective gates, and malicious payload test-cases modeled to secure the Fleet Ops SaaS Firestore database.

## 1. Data Invariants & Master Gates

1. **Authentication & Email Verification**: All standard write operations require an authenticated session where `request.auth.token.email_verified == true`.
2. **PII and Identity Integrity**: A user can only write, read, or alter their own profile under `/users/{userId}`. Users can never spoof their role, org, or email fields.
3. **Immutability of Key Fields**: Once created, historical records such as `createdAt`, `userId`, `vehicleId`, and critical audit streams are protected against modification or deletion.
4. **Relational Verification**: Maintenance jobs, driver assignments, and vehicle registrations are strictly structured, with standard checks preventing orphaned records.
5. **No Blanket Reads**: Standard lists must be secured by checking `resource.data` fields (e.g. org/team constraints) to prevent collection scraping.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following 12 payloads represent structured bypass attempts. All must fail with `PERMISSION_DENIED` under our security rules.

### Scenario 1: Identity Spoofing (Setting another user's profile ID)
*   **Target Path**: `/users/legit-user-id`
*   **Attack Payload**:
    ```json
    { "id": 1, "email": "attacker@fleetops.sa", "firstName": "Hacker", "lastName": "Man", "role": "admin", "org": "Fleet Ops SA", "createdAt": "2026-07-08T00:00:00Z", "color": "#000000", "active": true }
    ```
*   **Reason for Rejection**: Authenticated user ID (`request.auth.uid`) does not match the document path variable `legit-user-id`.

### Scenario 2: Self-Promotion (Assigning own role to "admin")
*   **Target Path**: `/users/{attacker-uid}`
*   **Attack Payload (Update)**:
    ```json
    { "role": "admin" }
    ```
*   **Reason for Rejection**: The validation helper restricts key edits during updates, blocking privilege escalation from non-admins.

### Scenario 3: Untrusted Client-Side Timestamps
*   **Target Path**: `/auditLogs/log-999`
*   **Attack Payload**:
    ```json
    { "id": 12345, "action": "Faked Action", "detail": "Backdated event", "user": "Attacker", "time": "2010-01-01T00:00:00Z", "color": "#ff0000" }
    ```
*   **Reason for Rejection**: Server timestamp check mandates `incoming().time == request.time`.

### Scenario 4: Ghost Field Injection (Shadow Update)
*   **Target Path**: `/vehicles/vehicle-1`
*   **Attack Payload (Update)**:
    ```json
    { "mileage": 15000, "ghost_field_is_premium": true }
    ```
*   **Reason for Rejection**: Strict validation of affected keys (`affectedKeys().hasOnly(...)`) blocks un-whitelisted fields.

### Scenario 5: Unauthorized Status Advancement (State Shortcutting)
*   **Target Path**: `/transfers/transfer-123`
*   **Attack Payload (Update by Driver)**:
    ```json
    { "status": "completed", "approvedBy": "Fake Manager" }
    ```
*   **Reason for Rejection**: Field-level validation denies non-manager/non-admin roles from transitioning status directly to `completed` or overriding `approvedBy`.

### Scenario 6: Document ID Poisoning (Resource Exhaustion)
*   **Target Path**: `/vehicles/VERY_LONG_STRING_THAT_REPRESENTS_A_DENIAL_OF_WALLET_EXHAUSTION_ATTACK_CONTAINING_MORE_THAN_A_KILOBYTE_OF_GARBAGE_CHARACTERS`
*   **Attack Payload**:
    ```json
    { "id": 999, "make": "Tesla", "model": "Model Y" }
    ```
*   **Reason for Rejection**: Path variable ID validation restricts size (`id.size() <= 128`) and pattern matching.

### Scenario 7: Value Type Poisoning
*   **Target Path**: `/maintenance/maint-1`
*   **Attack Payload (Update)**:
    ```json
    { "estimatedCost": "One Million Dollars" }
    ```
*   **Reason for Rejection**: Validation function enforces `incoming().estimatedCost is number`.

### Scenario 8: Out-of-Bounds Rating/Integer Attack
*   **Target Path**: `/vehicles/vehicle-1`
*   **Attack Payload (Update)**:
    ```json
    { "mileage": -100 }
    ```
*   **Reason for Rejection**: Negative mileage values violate range constraints (`incoming().mileage >= 0`).

### Scenario 9: Bypassing Unbounded Array Guard (Denial of Wallet)
*   **Target Path**: `/settings/global`
*   **Attack Payload**:
    ```json
    { "hugeList": ["item1", "item2", "...", "item10000"] }
    ```
*   **Reason for Rejection**: Size validation prevents bulk list insertions (`incoming().keys().size() <= 6`).

### Scenario 10: Anonymous Read Attempt on Users Collection
*   **Target Path**: `/users/admin-user-id`
*   **Requesting User**: Anonymous (Not logged in)
*   **Reason for Rejection**: Unauthenticated users are completely blocked from reading profile data.

### Scenario 11: Non-Owner PII Extraction
*   **Target Path**: `/users/legit-user-id`
*   **Requesting User**: Logged in, but `uid` is different from `legit-user-id` (and not an administrator).
*   **Reason for Rejection**: Only profile owner or administrator can read the specific user document.

### Scenario 12: Insecure List Scraping (All Vehicles Query)
*   **Target Path**: `/vehicles`
*   **Query**: Standard select without organizational filters.
*   **Reason for Rejection**: Rules mandate checking `resource.data.org` against user's organization to prevent cross-tenant scraping.

---

## 3. Test Runner Definition

The following Jest/Firebase Test Suite outlines how these assertions are validated locally prior to production deployment.

```typescript
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';

let testEnv: RulesTestEnvironment;

describe('Fleet Ops SA Security Rules', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'gen-lang-client-0334729684',
      firestore: {
        rules: readFileSync('firestore.rules', 'utf8'),
        host: '127.0.0.1',
        port: 8080,
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  test('Denies anonymous users from any collection read', async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    await expect(unauthedDb.collection('vehicles').get()).toUseRulesDeny();
  });

  test('Denies a user from updating their own role to admin', async () => {
    const authedDb = testEnv.authenticatedContext('user-driver-123', {
      email: 'ahmed@fleetops.sa',
      email_verified: true,
    }).firestore();
    
    const userRef = authedDb.collection('users').doc('user-driver-123');
    await expect(userRef.update({ role: 'admin' })).toUseRulesDeny();
  });

  test('Denies backdated audit log submissions', async () => {
    const authedDb = testEnv.authenticatedContext('admin-123', {
      email: 'admin@fleetops.sa',
      email_verified: true,
    }).firestore();

    const logRef = authedDb.collection('auditLogs').doc('log-123');
    await expect(logRef.set({
      id: 1,
      action: 'Cheat',
      detail: 'Spoofed time',
      user: 'Attacker',
      time: '2020-01-01T00:00:00Z',
      color: 'red'
    })).toUseRulesDeny();
  });
});
```
