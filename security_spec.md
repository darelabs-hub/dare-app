# Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants
1. A Dare cannot exist without a valid creator ID belonging to the user.
2. A Dare's status must be one of: 'open', 'accepted', 'submitted', 'verified', 'rejected', 'forfeited'.
3. Only the 'creator' of a Dare can delete an 'open' Dare.
4. Users can only update their own profile information.
5. Streak count must be a non-negative integer.

## 2. The "Dirty Dozen" Payloads (Examples to deny)
1. { "handle": "attacker", "cred": 1000000 } // Attempting to inject/spoof cred balance
2. { "isPro": true } // Attempting to elevate privileges via profile update
3. { "status": "verified" } // Attempting to manually verify a dare without proof
4. { "rewardCred": -100 } // Negative bounty injection
5. { "creatorId": "someone-else-id" } // Spoofing dare creator
6. { "streak": 99999 } // Attempting to inject streak count
7. // ... more payloads to be generated during test implementation ...

## 3. Test Runner (firestore.rules.test.ts)
*(To be implemented in next step using testing library)*
```typescript
// Draft test structure
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
// ... test cases for Dirty Dozen
```
