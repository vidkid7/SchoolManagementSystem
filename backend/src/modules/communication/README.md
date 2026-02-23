# Communication Module

## Overview

The Communication Module implements real-time messaging infrastructure for the School Management System. It provides secure, real-time messaging capabilities between users with conversation management, message history, online/offline status tracking, and read receipts.

## Requirements

- **24.1**: One-on-one messaging between users
- **24.3**: Real-time message delivery via WebSocket
- **24.5**: Chat history maintenance with search
- **24.6**: Online/offline status tracking
- **24.7**: Message read receipts

## Features

### Implemented (Task 26.1 & 26.2)

- ✅ Message model and repository
- ✅ Conversation model and repository
- ✅ One-on-one messaging support
- ✅ Conversation management
- ✅ Message search functionality
- ✅ Unread message tracking
- ✅ Read receipts
- ✅ Message history with pagination
- ✅ File attachment support (structure)
- ✅ Real-time messaging with Socket.IO
- ✅ Online/offline status tracking
- ✅ Real-time message delivery
- ✅ Real-time read receipts
- ✅ Typing indicators support

### Pending (Future Tasks)

- ⏳ Group messaging (Task 26.3)
- ⏳ File upload and storage (Task 26.4)

## Database Schema

### Conversations Table

Stores conversation metadata between two users.

```sql
CREATE TABLE conversations (
  conversation_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  participant1_id INT UNSIGNED NOT NULL,
  participant2_id INT UNSIGNED NOT NULL,
  last_message_id INT UNSIGNED,
  last_message_at DATETIME,
  unread_count_user1 INT UNSIGNED DEFAULT 0,
  unread_count_user2 INT UNSIGNED DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_conversations_participants (participant1_id, participant2_id)
);
```

### Messages Table

Stores individual messages within conversations.

```sql
CREATE TABLE messages (
  message_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT UNSIGNED NOT NULL,
  sender_id INT UNSIGNED NOT NULL,
  recipient_id INT UNSIGNED NOT NULL,
  content TEXT NOT NULL,
  attachments JSON,
  is_read BOOLEAN DEFAULT FALSE,
  read_at DATETIME,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE
);
```

## API Endpoints

### Messages

- `POST /api/v1/communication/messages` - Send a message
- `GET /api/v1/communication/messages/search` - Search messages
- `PUT /api/v1/communication/messages/:messageId/read` - Mark message as read
- `DELETE /api/v1/communication/messages/:messageId` - Delete a message

### Conversations

- `GET /api/v1/communication/conversations` - Get user conversations
- `POST /api/v1/communication/conversations` - Get or create conversation
- `GET /api/v1/communication/conversations/:conversationId` - Get conversation by ID
- `GET /api/v1/communication/conversations/:conversationId/messages` - Get conversation messages
- `PUT /api/v1/communication/conversations/:conversationId/read` - Mark conversation as read

### Utilities

- `GET /api/v1/communication/unread-count` - Get unread message count
- `GET /api/v1/communication/online-users` - Get list of online users
- `GET /api/v1/communication/users/:userId/online` - Check if user is online

## Socket.IO Events

### Client → Server Events

- `message:send` - Send a message in real-time
  ```typescript
  {
    recipientId: number;
    conversationId: number;
    messageId: number;
    content: string;
    sentAt: Date;
  }
  ```

- `message:read` - Mark message as read
  ```typescript
  {
    messageId: number;
    conversationId: number;
    senderId: number;
  }
  ```

- `typing:start` - User started typing
  ```typescript
  {
    recipientId: number;
    conversationId: number;
  }
  ```

- `typing:stop` - User stopped typing
  ```typescript
  {
    recipientId: number;
    conversationId: number;
  }
  ```

### Server → Client Events

- `message:new` - New message received
  ```typescript
  {
    messageId: number;
    conversationId: number;
    senderId: number;
    content: string;
    sentAt: Date;
    isRead: boolean;
  }
  ```

- `message:read` - Message was read (read receipt)
  ```typescript
  {
    messageId: number;
    conversationId: number;
    readBy: number;
    readAt: Date;
  }
  ```

- `typing:start` - User is typing
  ```typescript
  {
    conversationId: number;
    userId: number;
  }
  ```

- `typing:stop` - User stopped typing
  ```typescript
  {
    conversationId: number;
    userId: number;
  }
  ```

- `user:status` - User online/offline status changed
  ```typescript
  {
    userId: number;
    status: 'online' | 'offline';
    timestamp: Date;
  }
  ```

- `users:online` - List of currently online users
  ```typescript
  number[] // Array of user IDs
  ```

- `notification:new` - New notification received
  ```typescript
  {
    id: number;
    title: string;
    message: string;
    // ... other notification fields
  }
  ```

- `announcement:new` - New announcement received
  ```typescript
  {
    id: number;
    title: string;
    content: string;
    // ... other announcement fields
  }
  ```

## Usage Examples

### Connect to Socket.IO (Client)

```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Listen for connection
socket.on('connect', () => {
  console.log('Connected to Socket.IO');
});

// Listen for online users
socket.on('users:online', (userIds: number[]) => {
  console.log('Online users:', userIds);
});

// Listen for new messages
socket.on('message:new', (message) => {
  console.log('New message:', message);
});

// Listen for read receipts
socket.on('message:read', (data) => {
  console.log('Message read:', data);
});

// Listen for user status changes
socket.on('user:status', (data) => {
  console.log('User status:', data);
});

// Listen for typing indicators
socket.on('typing:start', (data) => {
  console.log('User typing:', data);
});

socket.on('typing:stop', (data) => {
  console.log('User stopped typing:', data);
});
```

### Send a Message (HTTP API)

```typescript
POST /api/v1/communication/messages
{
  "recipientId": 2,
  "content": "Hello, how are you?",
  "attachments": [
    {
      "type": "document",
      "url": "https://example.com/file.pdf",
      "name": "document.pdf",
      "size": 1024
    }
  ]
}
```

### Emit Typing Indicator (Socket.IO)

```typescript
// Start typing
socket.emit('typing:start', {
  recipientId: 2,
  conversationId: 1
});

// Stop typing
socket.emit('typing:stop', {
  recipientId: 2,
  conversationId: 1
});
```

### Get Conversations

```typescript
GET /api/v1/communication/conversations?page=1&limit=20
```

### Search Messages

```typescript
GET /api/v1/communication/messages/search?q=hello&page=1&limit=50
```

### Mark Conversation as Read

```typescript
PUT /api/v1/communication/conversations/1/read
```

## Business Logic

### Conversation Management

- Conversations are automatically created when users send their first message
- Participant IDs are normalized (smaller ID always as participant1) for consistency
- Each conversation tracks unread counts separately for both participants
- Last message metadata is updated automatically

### Message Handling

- Messages cannot be sent to self
- Only recipients can mark messages as read
- Only senders can delete messages
- Message search is scoped to user's conversations
- Pagination is supported for all list operations

### Real-time Features

- Messages are delivered in real-time via Socket.IO when recipient is online
- Read receipts are sent immediately when message is marked as read
- Online/offline status is tracked and broadcast to all connected users
- Typing indicators are sent in real-time to the recipient
- All Socket.IO connections are authenticated using JWT tokens

### Security

- All endpoints require authentication
- Users can only access their own conversations
- Participants are verified before allowing access to conversation data
- Message access is restricted to sender and recipient only
- Socket.IO connections require valid JWT token
- User rooms are isolated (user:userId format)

## Testing

Unit tests are provided for:

- Message service operations
- Conversation service operations
- Socket.IO service functionality
- JWT authentication
- Real-time event handling
- Business logic validation
- Error handling

Run tests:

```bash
npm test -- backend/src/modules/communication/__tests__
npm test -- backend/src/services/__tests__/socket.service.test.ts
```

## Future Enhancements

1. **Group Messaging** (Task 26.3)
   - Class-based groups
   - Announcement channels
   - Role-based restrictions

2. **File Attachments** (Task 26.4)
   - File upload handling
   - Secure storage
   - File type validation
   - Size limits

3. **Advanced Features**
   - Message reactions (emoji)
   - Message forwarding
   - Voice messages
   - Video calls (Phase 4)

## Dependencies

- Sequelize ORM
- Express.js
- Socket.IO 4.6.0
- Joi (validation)
- JWT (authentication)
- MySQL 8.0+

## Configuration

Required environment variables:

```env
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
```

## Migration

Run migration to create tables:

```bash
npm run migrate
```

Migration file: `028-create-messaging-tables.ts`

## Performance Considerations

- Socket.IO connections are kept alive with ping/pong (60s timeout, 25s interval)
- Message pagination prevents loading large datasets
- Indexes on frequently queried fields (conversation_id, sender_id, recipient_id)
- Unread counts are cached in conversation table for quick access
- Online user tracking uses in-memory Map for fast lookups

## Troubleshooting

### Socket.IO Connection Issues

1. Verify JWT token is valid and not expired
2. Check CORS configuration matches frontend URL
3. Ensure WebSocket is not blocked by firewall
4. Check server logs for authentication errors

### Message Delivery Issues

1. Verify recipient is online using `/api/v1/communication/users/:userId/online`
2. Check Socket.IO connection status
3. Verify conversation exists and user is participant
4. Check server logs for errors

### Read Receipt Issues

1. Verify message belongs to the user marking it as read
2. Check Socket.IO connection for sender
3. Verify sender is online to receive real-time receipt
4. Check database for readAt timestamp update
