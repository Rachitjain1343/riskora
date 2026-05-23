# Security Specification: Geopolitical Risk Sandbox

## 1. Data Invariants

1. **User Node Privacy**: A User profile node (`/users/{userId}`) can only be created, read, updated, or deleted by the exact authenticated owner matching the path parameter (`userId`).
2. **Relational Report Authenticity**: A Saved report (`/users/{userId}/reports/{reportId}`) can only be read or written by the authenticated user whose `request.auth.uid` matches the `{userId}` parent variable and where the document field `userId` is strictly set to `request.auth.uid`.
3. **No Cross-User Access**: Users are strictly blocked from listing, accessing, or modifying other users' profiles or report nodes.
4. **Valid Format Limits**: Inputs like region, domain, and scenarios have strict maximum characters and cannot contain arbitrary junk buffers.
5. **No Spoofed Timestamps**: All creation and modification timestamps must match `request.time` exactly.
6. **No Self-Assigned Privilege Escalation**: Role structures inside documents are verified or omitted to prevent unauthorized profile modification.

---

## 2. The "Dirty Dozen" Malicious Payloads

1. **The Ghost Field Profile**: User tries to register their profile with a spoofed high-privilege `isAdmin: true` flag inside `/users/attackerId`.
2. **The Identity Spoofer profile creation**: Authenticated `attackerUserId` attempts to write a user profile at path `/users/victimUserId`.
3. **The Unverified Email Read**: A user with `email_verified == false` attempts to write or read user reports.
4. **The Ghost Field Report**: User saves a report with additional random or malformed fields (`hackedResult: "success"`) trying to pollute storage space.
5. **The Cross-Tenant Report Hijack**: User authenticated with `uid: userA` tries to read reports stored at `/users/userB/reports/reportX`.
6. **The Client Spoofed Timestamp**: User attempts to save a report with static client-generated `createdAt: "2020-01-01T00:00:00Z"` to fake timeline histories.
7. **The Poison ID Buffer**: User submits a report ID of 100KB to try to cause Denial of Wallet and storage bloating.
8. **The Broken Enum Write**: User writes a report with `profileType: "MegaCorporation"` which is not a valid enum member of `ProfileType` ("Individual", "Business").
9. **The Orphaned Report Sibling**: Attacker logs in with `uid: userA` but writes a report at `/users/userA/reports/report1` with data field `userId: "userB"`.
10. **The Arbitrary Field Update**: User attempts to modify the immutable `createdAt` datetime field of an existing report.
11. **The Massive String Attack**: Attacker tries to write a `summary` field of 10MB to crash parsers or balloon database costs.
12. **The Anonymous Write Attempt**: An unauthenticated or anonymous visitor attempts to save an intelligence report.

---

## 3. Threat Matrix & Access Verification

| Threat | Target Path | Rule Countermeasure | Expected Result |
| --- | --- | --- | --- |
| Identity Spoofing | `/users/{userId}` | `request.auth.uid == userId` | `PERMISSION_DENIED` |
| State Shortcutting | `/users/{userId}/reports/{reportId}` | `incoming().userId == request.auth.uid` | `PERMISSION_DENIED` |
| Payload Poisoning | `/users/{userId}/reports/{reportId}` | `isValidRiskReport(incoming())` | `PERMISSION_DENIED` |
| Timestamp Fabricating| `/users/{userId}` | `incoming().createdAt == request.time` | `PERMISSION_DENIED` |
