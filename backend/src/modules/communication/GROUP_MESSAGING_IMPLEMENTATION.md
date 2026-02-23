# Group Messaging Implementation

## Overview

This document describes the implementation of group messaging functionality for the School Management System, completing task 26.3.

## Requirements Implemented

- **Requirement 24.2**: Class-based group messaging
- **Requirement 24.8**: Announcement channels
- **Requirement 24.9**: Role-based restrictions on messaging

## Architecture

### Database Schema

Three new tables were created to support group messaging:

1. **group_conversations**: Stores group conversation metadata
   - Supports types: `class`, `announcement`, `custom`
   - Tracks last message and activity status
   - Links to classes for class-based groups
   - `isAnnouncementOnly` flag for announcement channels

2. **group_members**: Manages group membership
   - Tracks user roles: `admin` or `member`
   - Maintains unread counts per user
   - Records join dates and last read timestamps

3. **group_messages**: Stores group messages
   - Links to group conversations and senders
   - Supports attachments (JSON field)
   - Timestamps for message ordering

### Models

- **GroupConversation**: Represents a group conversation with methods for activation/deactivation
- **GroupMember**: Represents membership with role management methods
- **GroupMessage**: Represents individual messages in groups

### Repositories

- **groupConversation.repository.ts**: Data access for group conversations
  - Find by user, class ID, or type
  - Member and admin verification
  - Last message tracking

- **groupMember.repository.ts**: Data access for group members
  - Bulk member operations
  - Unread count management
  - Role updates

- **groupMessage.repository.ts**: Data access for group messages
  - Pagination support
  - Search functionality
  - Message deletion

### Services

- **groupConversation.service.ts**: Business logic for group management
  - Create class-based groups and announcement channels
  - Add/remove members with permission checks
  - Promote/demote members
  - Update group settings (admins only)
  - Delete groups (admins only)

- **groupMessage.service.ts**: Business logic for messaging
  - Send messages with role-based restrictions
  - Real-time message delivery via Socket.IO
  - Mark messages as read
  - Search messages
  - Delete messages (sender or admin only)

### Real-time Support

Extended **socket.service.ts** with group messaging events:
- `group:message:send`: Send message to group
- `group:message:new`: Receive new group message
- `group:typing:start`: User started typing in group
- `group:typing:stop`: User stopped typing in group
- `group:message:deleted`: Message was deleted

### API Endpoints

#### Group Conversation Management
- `POST /api/v1/communication/groups` - Create group
- `GET /api/v1/communication/groups` - List user's groups
- `GET /api/v1/communication/groups/:id` - Get group details
- `PUT /api/v1/communication/groups/:id` - Update group (admins only)
- `DELETE /api/v1/communication/groups/:id` - Delete group (admins only)

#### Group Messaging
- `POST /api/v1/communication/groups/messages` - Send group message
- `GET /api/v1/communication/groups/:id/messages` - Get group messages
- `PUT /api/v1/communication/groups/:id/read` - Mark group as read

#### Member Management
- `POST /api/v1/communication/groups/:id/members` - Add members (admins only)
- `DELETE /api/v1/communication/groups/:id/members/:userId` - Remove member (admins or self)
- `GET /api/v1/communication/groups/:id/members` - List group members

## Role-Based Restrictions

### Announcement-Only Groups (Requirement 24.9)

When `isAnnouncementOnly` is true:
- Only users with `admin` role can post messages
- Regular members can only read messages
- Enforced in `groupMessage.service.ts` `sendGroupMessage()` method

### Admin Privileges

Group admins can:
- Add/remove members
- Promote members to admin
- Demote admins to members (if not last admin)
- Update group settings
- Delete any message
- Delete the group

### Member Restrictions

Regular members can:
- View group messages
- Send messages (unless announcement-only)
- Delete their own messages
- Leave the group

## Class-Based Groups (Requirement 24.2)

- Groups can be linked to a class via `classId`
- Type set to `'class'`
- Prevents duplicate groups for the same class
- Automatically includes all class students and teachers

## Testing

Comprehensive unit tests cover:

### GroupConversation Service Tests
- Creating class-based groups
- Creating announcement channels
- Adding/removing members with permission checks
- Promoting/demoting members
- Updating group settings
- Access control validation

### GroupMessage Service Tests
- Sending messages in regular groups
- Enforcing announcement-only restrictions
- Real-time message delivery
- Message deletion permissions
- Search functionality
- Access control validation

All tests passed successfully with good coverage of business logic and edge cases.

## Usage Examples

### Create a Class-Based Group

```typescript
const group = await groupConversationService.createGroupConversation({
  name: 'Class 10-A Morning',
  type: 'class',
  classId: 1,
  createdBy: teacherId,
  memberIds: [student1Id, student2Id, student3Id],
  adminIds: [teacherId],
});
```

### Create an Announcement Channel

```typescript
const announcementChannel = await groupConversationService.createGroupConversation({
  name: 'School Announcements',
  type: 'announcement',
  createdBy: adminId,
  isAnnouncementOnly: true,
  memberIds: allStudentIds,
  adminIds: [adminId, principalId],
});
```

### Send a Group Message

```typescript
const result = await groupMessageService.sendGroupMessage({
  groupConversationId: groupId,
  senderId: userId,
  content: 'Hello everyone!',
  attachments: [],
});
```

### Add Members to Group

```typescript
await groupConversationService.addMembers(
  groupId,
  [newStudent1Id, newStudent2Id],
  adminId
);
```

## Security Considerations

1. **Authentication**: All endpoints require JWT authentication
2. **Authorization**: Role-based checks at service layer
3. **Input Validation**: Joi schemas validate all inputs
4. **SQL Injection**: Prevented via Sequelize ORM
5. **Access Control**: Users can only access groups they're members of

## Future Enhancements

Potential improvements for future iterations:
- Message reactions and threading
- File upload and storage for attachments
- Message editing
- Group avatars and descriptions
- Pinned messages
- Mute/unmute groups
- Group analytics and insights
- Message forwarding
- @mentions and notifications

## Migration

Run migration 029 to create the group messaging tables:

```bash
npm run migrate
```

## Conclusion

The group messaging implementation successfully adds:
- ✅ Class-based group messaging (Requirement 24.2)
- ✅ Announcement channels (Requirement 24.8)
- ✅ Role-based restrictions (Requirement 24.9)
- ✅ Real-time message delivery (Requirement 24.3)
- ✅ Comprehensive test coverage
- ✅ RESTful API endpoints
- ✅ Proper access control and security

The implementation is production-ready and integrates seamlessly with the existing messaging infrastructure.
