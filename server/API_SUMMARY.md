# Identity Module - API Summary

## Authentication APIs (AuthController)
- **POST** `/api/v1/auth/login` - User login
- **POST** `/api/v1/auth/refresh` - Refresh access token
- **POST** `/api/v1/auth/logout` - User logout
- **POST** `/api/v1/auth/register/send-otp` - Send OTP for registration
- **POST** `/api/v1/auth/register` - Register new user
- **POST** `/api/v1/auth/forgot-password/send-otp` - Send OTP for password reset
- **POST** `/api/v1/auth/forgot-password/complete` - Complete password reset
- **POST** `/api/v1/auth/introspect` - Verify token validity ✅ NEW
- **POST** `/api/v1/auth/change-password` - Change user password ✅ NEW

## User APIs (UserController)
- **POST** `/api/v1/users` - Create user (admin only)
- **GET** `/api/v1/users` - Get paginated list of users (admin only)
- **GET** `/api/v1/users/{id}` - Get user by ID ✅ NEW
- **PUT** `/api/v1/users/profile` - Update user profile ✅ NEW

## Address APIs (AddressController) ✅ NEW
- **POST** `/api/v1/addresses` - Create new address
- **GET** `/api/v1/addresses` - Get all addresses of authenticated user
- **GET** `/api/v1/addresses/{addressId}` - Get specific address
- **PUT** `/api/v1/addresses/{addressId}` - Update address
- **DELETE** `/api/v1/addresses/{addressId}` - Delete address

## Points APIs (PointHistoryController) ✅ NEW
- **GET** `/api/v1/points/history` - Get point history of authenticated user

## Role APIs (RoleController) ✅ NEW
- **POST** `/api/v1/roles` - Create new role (admin only)
- **GET** `/api/v1/roles` - Get all roles
- **GET** `/api/v1/roles/{name}` - Get role by name
- **DELETE** `/api/v1/roles/{name}` - Delete role (admin only)

## Permission APIs (PermissionController) ✅ NEW
- **POST** `/api/v1/permissions` - Create new permission (admin only)
- **GET** `/api/v1/permissions` - Get all permissions
- **GET** `/api/v1/permissions/{id}` - Get permission by ID
- **DELETE** `/api/v1/permissions/{id}` - Delete permission (admin only)

## Membership Tier APIs (MembershipTierController) ✅ NEW
- **POST** `/api/v1/membership-tiers` - Create new membership tier (admin only)
- **GET** `/api/v1/membership-tiers` - Get all membership tiers
- **GET** `/api/v1/membership-tiers/{id}` - Get membership tier by ID
- **PUT** `/api/v1/membership-tiers/{id}` - Update membership tier (admin only)
- **DELETE** `/api/v1/membership-tiers/{id}` - Delete membership tier (admin only)

## Error Codes (Added to ErrorCode enum)
- `1014` - RESOURCE_NOT_FOUND - Resource not found
- `1015` - INSUFFICIENT_POINTS - Insufficient points balance
- `1016` - PASSWORD_MISMATCH - Passwords do not match
- `1017` - INVALID_CURRENT_PASSWORD - Current password is incorrect

## New Files Created
### Controllers
- AddressController
- PointHistoryController
- PermissionController
- RoleController
- MembershipTierController

### Services
- AddressService
- PointHistoryService
- PermissionService
- RoleService
- MembershipTierService

### Repositories
- AddressRepository
- PointHistoryRepository
- PermissionRepository
- MembershipTierRepository

### Mappers
- AddressMapper
- PointHistoryMapper
- PermissionMapper
- RoleMapper
- MembershipTierMapper

### DTOs (Request)
- CreateAddressRequest
- UpdateAddressRequest
- ChangePasswordRequest
- CreatePermissionRequest
- CreateRoleRequest
- CreateMembershipTierRequest
- UpdateMembershipTierRequest
- UpdateUserProfileRequest

### DTOs (Response)
- AddressResponse
- PointHistoryResponse
- MembershipTierResponse

## Updated Files
- AuthController (added introspect and change-password endpoints)
- UserController (uncommented and updated get user by ID, added update profile endpoint)
- ErrorCode enum (added 4 new error codes, fixed syntax error)
- MembershipTier entity (fixed table name from "permissions" to "membership_tiers")

## Key Features
✅ Full CRUD for User, Address, Role, Permission, MembershipTier
✅ Point tracking and history
✅ Token introspection for security
✅ Password change functionality
✅ User profile updates
✅ Default address management
✅ Membership tier management with discount support
